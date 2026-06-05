import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Client Prisma singleton — version production-ready pour Vercel serverless.
 *
 * Diagnostic du problème "Too many connections opened for role prisma_migration" :
 *  - La DB est Prisma Postgres (db.prisma.io)
 *  - L'URL `postgres://...` est la connexion DIRECTE (limitée à ~5 connexions)
 *  - Sur Vercel, chaque Lambda peut spawn son propre pool
 *  - Sans précautions, on sature instantanément la limite de la DB
 *
 * Stratégie de mitigation (sans changer de DB ni passer à Accelerate) :
 *  1. Singleton global maintenu en TOUS environnements
 *  2. Pool ultra-minimal : max=1 connexion par Lambda
 *     → Lambdas concurrentes × 1 connexion ≪ limite directe (~5)
 *  3. idleTimeout court (5s) pour libérer rapidement les ressources
 *  4. allowExitOnIdle pour fermer le pool quand la Lambda gèle
 *
 * Pour une solution scalable définitive : activer Prisma Accelerate
 * et remplacer DATABASE_URL par une URL prisma://... (recommandé).
 * Voir : https://www.prisma.io/docs/accelerate
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
    // ⚠️ POOL ULTRA-MINIMAL pour Prisma Postgres + Vercel serverless.
    // La direct connection de Prisma Postgres limite à ~5 connexions.
    // Avec 1 connexion max par Lambda, on supporte 5 Lambdas concurrentes
    // sans saturation. Si plus de trafic → activer Prisma Accelerate.
    max: 1,
    idleTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache TOUJOURS (production incluse). Vercel warm starts réutilisent
// le contexte global entre invocations.
globalForPrisma.prisma = prisma;
