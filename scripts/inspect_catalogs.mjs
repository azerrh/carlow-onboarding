import dotenv from "dotenv";
dotenv.config({ quiet: true });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const vendors = await prisma.vendor.findMany({
  select: {
    id: true, name: true, companyName: true, status: true,
    catalogs: { select: { id: true, name: true, active: true, _count: { select: { products: true } } } },
  },
});
for (const v of vendors) {
  console.log(`Vendeur: ${v.companyName || v.name} | status=${v.status} | id=${v.id}`);
  for (const c of v.catalogs) {
    console.log(`   catalogue: ${c.name || "(sans nom)"} | active=${c.active} | produits=${c._count.products} | id=${c.id}`);
  }
}
const cats = await prisma.product.findMany({ select: { category: true }, distinct: ["category"] });
console.log("\nCatégories existantes:", cats.map((c) => c.category).filter(Boolean).join(", "));
await prisma.$disconnect();
