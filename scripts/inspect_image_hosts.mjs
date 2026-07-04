import dotenv from "dotenv";
dotenv.config({ quiet: true });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function host(u) {
  try {
    return new URL(u).host;
  } catch {
    return `(non-url) ${String(u).slice(0, 40)}`;
  }
}

const counts = {};
function add(u) {
  if (!u) return;
  const h = host(u);
  counts[h] = (counts[h] || 0) + 1;
}

// 1) toutes les Photos
const photos = await prisma.photo.findMany({ select: { url: true } });
photos.forEach((p) => add(p.url));

// 2) champ imageUrl sur Product (si présent dans le schéma)
try {
  const prods = await prisma.product.findMany({ select: { imageUrl: true } });
  prods.forEach((p) => add(p.imageUrl));
} catch {
  console.log("(pas de champ Product.imageUrl)");
}

console.log("Hôtes d'images trouvés :");
for (const [h, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(4)}  ${h}`);
}
console.log(`\nTotal Photos: ${photos.length}`);
await prisma.$disconnect();
