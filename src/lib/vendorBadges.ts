import { prisma } from "@/lib/prisma";

/**
 * Système de badges automatiques pour les vendeurs.
 *
 * Approche stateless : on calcule les badges à la volée à partir des données
 * existantes (commandes, avis, produits, dates). Aucun stockage en DB.
 * Avantages :
 *  - Toujours à jour
 *  - Pas de migration / pas de cron de recalcul
 *  - Facile à ajouter de nouveaux critères
 *
 * Performance : si un vendeur a des milliers de commandes, il faudrait
 * passer à un cache Redis avec invalidation à chaque nouvelle commande.
 * Pour le PFE, calcul direct = OK.
 */

export type BadgeId =
  | "verified"
  | "top_seller"
  | "excellence"
  | "fast_response"
  | "new_seller"
  | "rich_catalog"
  | "stripe_connect"
  | "multi_category"
  | "premium";

export interface Badge {
  id: BadgeId;
  label: string;
  description: string;
  icon: string;
  color: "primary" | "success" | "warning" | "info" | "premium";
  earned: boolean;
}

const ALL_BADGES: Omit<Badge, "earned">[] = [
  {
    id: "verified",
    label: "Vendeur vérifié",
    description: "Compte validé par Carlow avec documents légaux conformes",
    icon: "🛡️",
    color: "success",
  },
  {
    id: "top_seller",
    label: "Top vendeur",
    description: "Plus de 10 commandes livrées sur les 30 derniers jours",
    icon: "🏆",
    color: "warning",
  },
  {
    id: "excellence",
    label: "Excellence",
    description: "Note moyenne ≥ 4.5/5 sur au moins 5 avis",
    icon: "⭐",
    color: "warning",
  },
  {
    id: "fast_response",
    label: "Réponse rapide",
    description: "Mise à jour des commandes en moins de 24h en moyenne",
    icon: "⚡",
    color: "info",
  },
  {
    id: "new_seller",
    label: "Nouveau vendeur",
    description: "Vendeur actif depuis moins de 30 jours — découvrez-le !",
    icon: "🌱",
    color: "primary",
  },
  {
    id: "rich_catalog",
    label: "Catalogue riche",
    description: "Plus de 20 produits actifs au catalogue",
    icon: "📦",
    color: "info",
  },
  {
    id: "stripe_connect",
    label: "Paiement direct",
    description: "Paiements sécurisés directement vers le vendeur (Stripe Connect)",
    icon: "💳",
    color: "info",
  },
  {
    id: "multi_category",
    label: "Multi-catégories",
    description: "Vendeur expert : produits dans 3 catégories EnR ou plus",
    icon: "🎨",
    color: "primary",
  },
  {
    id: "premium",
    label: "Premium",
    description: "Top vendeur ET Excellence — un partenaire de premier choix",
    icon: "👑",
    color: "premium",
  },
];

/**
 * Récupère les données nécessaires en une seule passe puis calcule
 * tous les badges. Retourne uniquement les badges obtenus.
 */
export async function computeVendorBadges(vendorId: string): Promise<Badge[]> {
  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [vendor, docsValidated, deliveredCount30d, reviewsAgg, productsCount, categoriesGroup, fastResponseTime] =
    await Promise.all([
      prisma.vendor.findUnique({
        where: { id: vendorId },
        select: {
          status: true,
          emailVerifiedAt: true,
          createdAt: true,
          activatedAt: true,
          stripeChargesEnabled: true,
        },
      }),
      // Au moins 1 document validé (présent en DB)
      prisma.document.count({ where: { vendorId } }),
      // Commandes livrées 30 derniers jours (count via orderLine groupé par order)
      prisma.order.count({
        where: {
          status: "LIVREE",
          orderedAt: { gte: thirty },
          lines: { some: { product: { catalog: { vendorId } } } },
        },
      }),
      // Moyenne avis sur les produits du vendeur
      prisma.review.aggregate({
        where: { product: { catalog: { vendorId } } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.product.count({
        where: { active: true, catalog: { vendorId } },
      }),
      // Catégories uniques avec au moins 1 produit actif
      prisma.product.groupBy({
        by: ["category"],
        where: {
          active: true,
          catalog: { vendorId },
          category: { not: null },
        },
        _count: { id: true },
      }),
      // Réponse rapide : on regarde les commandes passées en SHIPPED ou LIVREE
      // récemment et la diff orderedAt vs updatedAt en moyenne (en heures).
      // On ne fait le calcul que sur 20 commandes max pour rester rapide.
      prisma.order.findMany({
        where: {
          status: { in: ["SHIPPED", "LIVREE"] },
          orderedAt: { gte: thirty },
          lines: { some: { product: { catalog: { vendorId } } } },
        },
        orderBy: { orderedAt: "desc" },
        take: 20,
        select: { orderedAt: true, updatedAt: true },
      }),
    ]);

  if (!vendor) return [];

  // --- Calcul ---
  const earned = new Set<BadgeId>();

  // 1. Vérifié
  if (
    vendor.status === "active" &&
    docsValidated > 0 &&
    vendor.emailVerifiedAt !== null
  ) {
    earned.add("verified");
  }

  // 2. Top vendeur
  const isTopSeller = deliveredCount30d >= 10;
  if (isTopSeller) earned.add("top_seller");

  // 3. Excellence (note ≥ 4.5 sur ≥ 5 avis)
  const avgRating = reviewsAgg._avg.rating ?? 0;
  const reviewCount = reviewsAgg._count._all;
  const isExcellent = reviewCount >= 5 && avgRating >= 4.5;
  if (isExcellent) earned.add("excellence");

  // 4. Réponse rapide (< 24h en moyenne entre orderedAt et updatedAt)
  if (fastResponseTime.length >= 3) {
    const avgHours =
      fastResponseTime.reduce(
        (sum, o) =>
          sum +
          (new Date(o.updatedAt).getTime() - new Date(o.orderedAt).getTime()) /
            (1000 * 60 * 60),
        0
      ) / fastResponseTime.length;
    if (avgHours < 24) earned.add("fast_response");
  }

  // 5. Nouveau vendeur (activé il y a < 30 jours)
  const since = vendor.activatedAt ?? vendor.createdAt;
  const ageDays = (Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 30 && vendor.status === "active" && productsCount > 0) {
    earned.add("new_seller");
  }

  // 6. Catalogue riche
  if (productsCount >= 20) earned.add("rich_catalog");

  // 7. Stripe Connect actif
  if (vendor.stripeChargesEnabled) earned.add("stripe_connect");

  // 8. Multi-catégories (>= 3)
  if (categoriesGroup.length >= 3) earned.add("multi_category");

  // 9. Premium : Top + Excellence
  if (isTopSeller && isExcellent) earned.add("premium");

  return ALL_BADGES.filter((b) => earned.has(b.id)).map((b) => ({
    ...b,
    earned: true,
  }));
}

/**
 * Version compacte pour les cartes produit : ne renvoie que les 2 badges
 * les plus prestigieux (premium > top_seller > excellence > verified > autres).
 */
export async function computeTopVendorBadges(vendorId: string): Promise<Badge[]> {
  const all = await computeVendorBadges(vendorId);
  const priority: BadgeId[] = [
    "premium",
    "top_seller",
    "excellence",
    "verified",
    "fast_response",
    "stripe_connect",
    "rich_catalog",
    "multi_category",
    "new_seller",
  ];
  return all
    .sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id))
    .slice(0, 2);
}

/** Liste de tous les badges existants (pour pages explicatives). */
export function listAllBadges(): Omit<Badge, "earned">[] {
  return ALL_BADGES;
}
