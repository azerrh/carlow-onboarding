import dotenv from "dotenv";
dotenv.config({ quiet: true });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATALOG_ID = "cmq4e9deb0002hcd66gxakv4n"; // Carlow Demo Vendor — Catalogue de démonstration

const products = [
  {
    name: "Pompe à chaleur air/eau 8 kW",
    reference: "PAC-AW-8000",
    description:
      "Pompe à chaleur air/eau monobloc 8 kW, COP 4,6, pour le chauffage et l'eau chaude sanitaire. Compatible plancher chauffant et radiateurs basse température. Fonctionnement garanti jusqu'à -20 °C.",
    price: 3290,
    weightKg: 95,
    dimensions: "1100 x 450 x 850 mm",
    category: "Pompes à chaleur",
    stock: 12,
  },
  {
    name: "Borne de recharge IRVE 22 kW",
    reference: "IRVE-T2-22",
    description:
      "Borne de recharge murale pour véhicule électrique, 22 kW triphasé, prise Type 2, pilotage Wi-Fi et gestion dynamique de la charge. Conforme aux normes IRVE, éligible aux aides ADVENIR.",
    price: 890,
    weightKg: 6,
    dimensions: "330 x 200 x 130 mm",
    category: "Mobilité électrique",
    stock: 30,
  },
  {
    name: "Chaudière biomasse à granulés 24 kW",
    reference: "BIO-GRA-24",
    description:
      "Chaudière à granulés de bois 24 kW, rendement 94 %, réservoir 200 kg, allumage automatique et nettoyage autonome. Régulation connectée. Idéale pour maison individuelle ou petit collectif.",
    price: 4550,
    weightKg: 180,
    dimensions: "1250 x 700 x 1100 mm",
    category: "Biomasse",
    stock: 8,
  },
  {
    name: "Chauffe-eau solaire thermique 300 L",
    reference: "SOL-CESI-300",
    description:
      "Système solaire individuel (CESI) avec ballon 300 L et 2 capteurs plans de 2 m². Couvre jusqu'à 70 % des besoins en eau chaude sanitaire. Appoint électrique intégré. Garantie 10 ans sur les capteurs.",
    price: 1850,
    weightKg: 140,
    dimensions: "Ballon Ø600 x 1800 mm",
    category: "Solaire thermique",
    stock: 15,
  },
];

let created = 0;
for (const p of products) {
  // évite les doublons si le script est relancé
  const exists = await prisma.product.findFirst({
    where: { catalogId: CATALOG_ID, name: p.name },
    select: { id: true },
  });
  if (exists) {
    console.log(`= déjà présent : ${p.name}`);
    continue;
  }
  const prod = await prisma.product.create({
    data: { ...p, active: true, catalogId: CATALOG_ID },
    select: { id: true, name: true },
  });
  created++;
  console.log(`✅ créé : ${prod.name} (id=${prod.id})`);
}
console.log(`\n${created} produit(s) ajouté(s). (sans image — à compléter via l'admin)`);
await prisma.$disconnect();
