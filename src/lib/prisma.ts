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
 *  2. Pool = 1 connexion par instance (max=1) : sur Vercel, une fonction est
 *     GELÉE après sa réponse (pas tuée) → ses connexions restent ouvertes
 *     côté Supabase et le minuteur d'idle est gelé aussi. Avec un gros pool,
 *     chaque cold start accumulait jusqu'à `max` connexions → on saturait la
 *     limite client du pooler Supabase (200) → erreur EMAXCONN. Avec max=1,
 *     chaque instance ne retient qu'1 connexion (pgbouncer multiplexe déjà
 *     en mode transaction, donc 1 suffit). Recommandation Prisma/Supabase
 *     pour le serverless (équivalent de connection_limit=1).
 *  3. idleTimeout court + allowExitOnIdle pour libérer dès que possible.
 *  4. connectionTimeout : si le pooler est saturé, on échoue vite (10s) au
 *     lieu de bloquer la Lambda (ce qui aggraverait la saturation).
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
    // pgbouncer (transaction pooler Supabase) multiplexe déjà les connexions :
    // 1 connexion par instance suffit et évite de saturer la limite client du
    // pooler (200) à cause des instances Vercel gelées qui retiennent leurs
    // connexions. Voir l'en-tête du fichier.
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache TOUJOURS (production incluse). Vercel warm starts réutilisent
// le contexte global entre invocations.
globalForPrisma.prisma = prisma;
