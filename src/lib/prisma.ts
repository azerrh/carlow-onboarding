import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Client Prisma singleton — version production-ready pour Vercel serverless.
 *
 * Sur Vercel, chaque invocation de fonction peut être un cold start qui
 * crée un nouveau PrismaClient. Sans cache global, le pool de connexions
 * Postgres est rapidement épuisé (erreur "Too many connections").
 *
 * Stratégie :
 *  1. Singleton via `globalThis` (Vercel garde le contexte entre warm starts)
 *  2. Cache appliqué en TOUS environnements (dev + prod)
 *  3. Pool de connexions limité à 5 par instance — sur un projet PFE avec
 *     trafic modéré, c'est largement suffisant et ça évite la saturation
 *  4. Connexion idle expirée à 10s pour libérer rapidement le pool
 *
 * Référence : https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing env DATABASE_URL");
  }

  // Limite agressive du pool : Vercel peut spawn 100+ Lambdas en parallèle.
  // Avec 100 Lambdas × 5 connexions = 500 max (vs limite Postgres ~100).
  // En réduisant à 3 par Lambda, on reste sous la limite même en pic.
  const adapter = new PrismaPg({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
  });

  return new PrismaClient({
    adapter,
    // En production, on coupe les logs Prisma pour économiser les ressources
    // et éviter de polluer les logs Vercel.
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// ⚠️ ON CACHE EN TOUS ENVIRONNEMENTS (pas juste en dev).
// Sur Vercel, les Lambdas réutilisent leur contexte entre invocations
// (warm starts). Sans ce cache, chaque requête HTTP créerait un nouveau
// pool de connexions → saturation immédiate.
globalForPrisma.prisma = prisma;
