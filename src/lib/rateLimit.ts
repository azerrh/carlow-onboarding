import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting in-memory pour protéger les endpoints sensibles.
 *
 * ⚠️ LIMITATION : la map est par instance Node.js. Sur Vercel, chaque
 * lambda peut avoir son propre état. Dans la réalité :
 *  - Pour les endpoints peu trafiqués (auth, reset), une instance est
 *    presque toujours réutilisée pour des requêtes consécutives du même
 *    IP grâce au warm start → la protection fonctionne en pratique.
 *  - Pour un usage plus strict (anti-DDoS global), passer à Upstash
 *    Redis avec @upstash/ratelimit. Le code ici reste compatible : il
 *    suffit de remplacer cette implémentation.
 *
 * Format de la clé : `${bucket}:${identifier}` où identifier = IP par
 * défaut (ou email pour cibler par compte cible).
 */

interface BucketState {
  count: number;
  resetAt: number; // timestamp ms
}

const buckets = new Map<string, BucketState>();

// Cleanup périodique pour éviter de bourrer la mémoire avec d'anciennes clés.
// On purge les entrées expirées toutes les 5 minutes.
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, state] of buckets) {
    if (state.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitOptions {
  /** Identifiant logique de l'endpoint (ex: "auth:login"). */
  bucket: string;
  /** Nombre de requêtes max sur la fenêtre. */
  limit: number;
  /** Fenêtre en secondes. */
  windowSec: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
}

/**
 * Récupère l'IP client. Sur Vercel, on s'appuie sur x-forwarded-for.
 * En dev local, on retombe sur "127.0.0.1" plutôt que de tout bloquer.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // Premier IP de la chaîne = client réel (les suivants sont les proxies)
    return xff.split(",")[0]!.trim();
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "127.0.0.1";
}

/**
 * Vérifie + consomme un slot du bucket. Retourne le résultat sans
 * modifier la réponse.
 *
 * Usage :
 *   const rl = checkRateLimit(`auth:login:${ip}`, { limit: 10, windowSec: 60 });
 *   if (!rl.allowed) return tooManyRequests(rl);
 */
export function checkRateLimit(
  identifier: string,
  opts: { bucket: string; limit: number; windowSec: number }
): RateLimitResult {
  maybeCleanup();

  const key = `${opts.bucket}:${identifier}`;
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const state = buckets.get(key);

  if (!state || state.resetAt < now) {
    // Nouvelle fenêtre
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: opts.limit - 1,
      resetInSec: opts.windowSec,
    };
  }

  state.count += 1;
  const remaining = Math.max(0, opts.limit - state.count);
  const resetInSec = Math.ceil((state.resetAt - now) / 1000);

  return {
    allowed: state.count <= opts.limit,
    remaining,
    resetInSec,
  };
}

/**
 * Helper raccourci : retourne directement une NextResponse 429 si la
 * limite est dépassée, sinon `null` pour continuer le flow.
 *
 * Usage :
 *   const blocked = applyRateLimit(req, { bucket: "auth:login", limit: 10, windowSec: 60 });
 *   if (blocked) return blocked;
 */
export function applyRateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
  customKey?: string
): NextResponse | null {
  const ip = getClientIp(req);
  const identifier = customKey ?? ip;
  const rl = checkRateLimit(identifier, opts);
  if (rl.allowed) return null;
  return NextResponse.json(
    {
      error: `Trop de tentatives. Réessayez dans ${rl.resetInSec} secondes.`,
      retryAfter: rl.resetInSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(rl.resetInSec),
        "X-RateLimit-Limit": String(opts.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(rl.resetInSec),
      },
    }
  );
}
