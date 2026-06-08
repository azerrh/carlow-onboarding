import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Client Prisma singleton — DB Supabase Postgres via transaction pooler.
 *
 * Setup :
 *  - DATABASE_URL pointe vers le transaction pooler Supabase (port 6543,
 *    pgbouncer=true) qui multiplexe les connexions → idéal pour Vercel
 *    serverless (résout les "too many connections").
 *  - Pour les migrations (prisma db push / migrate), utiliser l'URL session
 *    pooler (port 5432) via le flag --url ou DIRECT_URL.
 *
 * Stratégie :
 *  1. Singleton global maintenu en TOUS environnements (Vercel warm starts
 *     réutilisent le contexte → pas de nouveau pool par requête)
 *  2. Pool modéré (max=3) : pgbouncer gère déjà le multiplexing, donc
 *     pas besoin d'un gros pool côté Lambda
 *  3. idleTimeout court pour libérer rapidement les connexions inactives
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing env DATABASE_URL");
  }

  const adapter = new PrismaPg({
    connectionString,
    // pgbouncer (transaction pooler Supabase) multiplexe déjà les connexions,
    // donc un petit pool par Lambda suffit largement.
    max: 3,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache TOUJOURS (production incluse). Vercel warm starts réutilisent
// le contexte global entre invocations.
globalForPrisma.prisma = prisma;
