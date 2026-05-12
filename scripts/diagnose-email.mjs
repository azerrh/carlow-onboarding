// Diagnostic email reset password.
// Usage : node scripts/diagnose-email.mjs <email>

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage : node scripts/diagnose-email.mjs <email>");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

console.log(`\n→ Diagnostic pour "${email}"\n`);

// 1) Existe-t-il un vendor ?
const vendor = await prisma.vendor.findUnique({
  where: { email },
  select: {
    id: true,
    name: true,
    status: true,
    emailVerifiedAt: true,
    createdAt: true,
  },
});
console.log("VENDOR :", vendor ?? "❌ NON TROUVÉ");

// 2) Existe-t-il un buyer ?
const buyer = await prisma.buyer.findUnique({
  where: { email },
  select: {
    id: true,
    name: true,
    emailVerifiedAt: true,
    createdAt: true,
  },
});
console.log("BUYER  :", buyer ?? "❌ NON TROUVÉ");

// 3) Tokens récemment générés pour ce user ?
if (vendor || buyer) {
  const userId = vendor?.id ?? buyer?.id;
  const userType = vendor ? "VENDOR" : "BUYER";
  const tokens = await prisma.authToken.findMany({
    where: { userType, userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("\nDERNIERS TOKENS générés :", tokens.length);
  for (const t of tokens) {
    const status = t.usedAt
      ? "✓ utilisé"
      : t.expiresAt.getTime() < Date.now()
        ? "⏱ expiré"
        : "✓ valide";
    console.log(
      `  - ${t.type} ${status} (créé : ${t.createdAt.toISOString().slice(0, 19)}, expire : ${t.expiresAt.toISOString().slice(0, 19)})`
    );
  }
}

// 4) Liste de tous les vendors récents
console.log("\nVendors actuellement en base (5 derniers) :");
const recent = await prisma.vendor.findMany({
  orderBy: { createdAt: "desc" },
  take: 5,
  select: { email: true, name: true, status: true, createdAt: true },
});
for (const v of recent) {
  console.log(`  - ${v.email} (${v.name}, ${v.status})`);
}

// 5) Resend API key configurée ?
const resendKey = process.env.RESEND_API_KEY;
console.log("\nRESEND_API_KEY :", resendKey ? `✓ configurée (${resendKey.slice(0, 8)}...)` : "❌ MANQUANTE");

await prisma.$disconnect();
