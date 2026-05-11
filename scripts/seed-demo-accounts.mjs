// Seed des comptes de démonstration pour la présentation entreprise.
// Usage : node scripts/seed-demo-accounts.mjs
//
// Crée OU met à jour (idempotent) :
//  - 1 vendeur de démo (status "active", onboardingStep 6) avec catalogue
//    + 3 produits exemples
//  - 1 acheteur de démo
//
// L'admin n'est PAS dans une table BDD — son mot de passe est stocké dans
// la variable d'environnement ADMIN_SECRET, déjà fixée à "carlow-admin-2026!"
// dans le fichier .env qui ship avec le déploiement Vercel.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL manquant — vérifier .env");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const VENDOR = {
  email: "azerrahali@gmail.com",
  password: "12345678",
  name: "Azer RAHALI",
  companyName: "Carlow Demo Vendor",
  siret: "12345678900012",
  vatNumber: "FR12345678901",
  legalForm: "SAS",
  address: "12 rue de la Démo, 75001 Paris, France",
  iban: "FR7612345678901234567890123",
  incoterms: "DAP — Rendu au lieu de destination",
};

const BUYER = {
  email: "azerrahali@gmail.com", // peut être identique au vendeur (tables séparées)
  password: "123456789",
  name: "Azer RAHALI",
  phone: "+33 6 12 34 56 78",
  address: "12 rue de la Démo, 75001 Paris, France",
};

const DEMO_PRODUCTS = [
  {
    name: "Panneau solaire monocristallin 450W",
    reference: "PV-MONO-450",
    description:
      "Panneau photovoltaïque haut rendement monocristallin 450W, certifié CE et IEC 61215. Garantie 25 ans linéaire.",
    price: 199.0,
    weightKg: 22.5,
    dimensions: "1762 x 1134 x 30 mm",
    category: "Photovoltaïque",
    stock: 120,
  },
  {
    name: "Onduleur hybride 5kW triphasé",
    reference: "INV-HYB-5K",
    description:
      "Onduleur hybride couplé à une batterie lithium. Compatible monitoring Wi-Fi/4G. Triphasé 230/400V.",
    price: 1290.0,
    weightKg: 18.0,
    dimensions: "470 x 350 x 180 mm",
    category: "Onduleurs",
    stock: 25,
  },
  {
    name: "Batterie lithium LiFePO4 10 kWh",
    reference: "BAT-LIFE-10K",
    description:
      "Batterie de stockage stationnaire. Cellules LiFePO4 grade A. 6000 cycles à 90% DoD. BMS intégré.",
    price: 3490.0,
    weightKg: 95.0,
    dimensions: "600 x 480 x 200 mm",
    category: "Stockage",
    stock: 8,
  },
];

async function upsertVendor() {
  const hashed = await bcrypt.hash(VENDOR.password, 12);
  const vendor = await prisma.vendor.upsert({
    where: { email: VENDOR.email },
    create: {
      email: VENDOR.email,
      password: hashed,
      name: VENDOR.name,
      companyName: VENDOR.companyName,
      siret: VENDOR.siret,
      vatNumber: VENDOR.vatNumber,
      vatValid: true,
      legalForm: VENDOR.legalForm,
      address: VENDOR.address,
      iban: VENDOR.iban,
      incoterms: VENDOR.incoterms,
      status: "active",
      onboardingStep: 6,
      activatedAt: new Date(),
    },
    update: {
      // On force un reset du mot de passe (utile si on relance le script
      // pour rétablir les credentials de démo).
      password: hashed,
      name: VENDOR.name,
      companyName: VENDOR.companyName,
      siret: VENDOR.siret,
      vatNumber: VENDOR.vatNumber,
      vatValid: true,
      legalForm: VENDOR.legalForm,
      address: VENDOR.address,
      iban: VENDOR.iban,
      incoterms: VENDOR.incoterms,
      status: "active",
      onboardingStep: 6,
      activatedAt: new Date(),
    },
  });
  console.log(`✓ Vendor ${vendor.email} (id=${vendor.id})`);
  return vendor;
}

async function upsertBuyer() {
  const hashed = await bcrypt.hash(BUYER.password, 12);
  const buyer = await prisma.buyer.upsert({
    where: { email: BUYER.email },
    create: {
      email: BUYER.email,
      password: hashed,
      name: BUYER.name,
      phone: BUYER.phone,
      address: BUYER.address,
    },
    update: {
      password: hashed,
      name: BUYER.name,
      phone: BUYER.phone,
      address: BUYER.address,
    },
  });
  console.log(`✓ Buyer  ${buyer.email} (id=${buyer.id})`);
  return buyer;
}

async function ensureCatalogAndProducts(vendorId) {
  // Un seul catalogue de démo. Si déjà existant on le réutilise.
  let catalog = await prisma.catalog.findFirst({
    where: { vendorId, name: "Catalogue de démonstration" },
  });
  if (!catalog) {
    catalog = await prisma.catalog.create({
      data: {
        vendorId,
        name: "Catalogue de démonstration",
        description:
          "Catalogue contenant des produits exemples pour la présentation Carlow.",
        active: true,
      },
    });
    console.log(`✓ Catalog "${catalog.name}" créé`);
  } else {
    console.log(`✓ Catalog "${catalog.name}" déjà présent (id=${catalog.id})`);
  }

  // Upsert des produits par `reference` (qui agit comme clé naturelle ici).
  for (const p of DEMO_PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { catalogId: catalog.id, reference: p.reference },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...p, active: true },
      });
      console.log(`  ↻ Product "${p.name}" mis à jour`);
    } else {
      await prisma.product.create({
        data: { ...p, catalogId: catalog.id, active: true },
      });
      console.log(`  + Product "${p.name}" créé`);
    }
  }
}

async function main() {
  console.log("→ Seed des comptes de démonstration\n");
  const vendor = await upsertVendor();
  await upsertBuyer();
  await ensureCatalogAndProducts(vendor.id);

  console.log("\n✅ Seed terminé avec succès.\n");
  console.log("Identifiants de connexion :");
  console.log(`  Vendeur   → ${VENDOR.email} / ${VENDOR.password}`);
  console.log(`  Acheteur  → ${BUYER.email} / ${BUYER.password}`);
  console.log("  Admin     → mot de passe défini par ADMIN_SECRET (.env)\n");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
