import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

/**
 * Sitemap XML dynamique pour Google + autres moteurs.
 *
 * Inclut :
 *   - Pages statiques publiques (home, marketplace, légal, login pages)
 *   - Toutes les fiches produits actives (max 1000 pour rester sous la
 *     limite de 50k URL/sitemap)
 *   - Toutes les pages vendeurs publiques (vendeurs actifs uniquement)
 *
 * URLs privées (admin, dashboard, buyer dashboard) volontairement
 * exclues — pas de SEO sur ces pages, et on ne veut pas que Google
 * les crawl.
 *
 * Next.js sert automatiquement ce fichier sur /sitemap.xml.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://carlowonboarding.vercel.app";
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/marketplace`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${base}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/buyer/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/buyer/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/legal/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/legal/cgv`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/legal/cgu`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/legal/confidentialite`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/legal/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Produits actifs — chunk pour éviter les requêtes trop lourdes
  const products = await prisma.product
    .findMany({
      where: {
        active: true,
        catalog: { active: true, vendor: { status: "active" } },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    })
    .catch(() => []);

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/marketplace/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Vendeurs actifs
  const vendors = await prisma.vendor
    .findMany({
      where: { status: "active" },
      select: { id: true, activatedAt: true },
      take: 1000,
    })
    .catch(() => []);

  const vendorEntries: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${base}/marketplace/vendeur/${v.id}`,
    lastModified: v.activatedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries, ...vendorEntries];
}
