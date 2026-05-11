import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Helpers pour la génération et la consommation de tokens d'authentification.
 *
 * Deux usages :
 *  - VERIFY_EMAIL : confirme une adresse email à l'inscription (durée 7j)
 *  - RESET_PASSWORD : autorise un changement de mot de passe (durée 1h)
 *
 * Sécurité :
 *  - 32 bytes aléatoires → 256 bits d'entropie (impossible à deviner)
 *  - Expiration stricte côté DB (check expiresAt > now())
 *  - `usedAt` empêche le rejeu (un token consommé reste en DB pour audit
 *    mais n'est plus valide)
 *  - Au moment de demander un nouveau token du même type, on invalide
 *    automatiquement les anciens non utilisés (évite l'accumulation)
 */

export type TokenType = "VERIFY_EMAIL" | "RESET_PASSWORD";
export type UserType = "BUYER" | "VENDOR";

const DURATIONS_MS: Record<TokenType, number> = {
  VERIFY_EMAIL: 7 * 24 * 60 * 60 * 1000, // 7 jours
  RESET_PASSWORD: 60 * 60 * 1000, // 1 heure
};

function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Crée un nouveau token pour cet utilisateur. Invalide les précédents
 * du même type (non utilisés) pour éviter d'avoir 50 tokens valides
 * simultanément si l'utilisateur clique 10 fois sur "renvoyer".
 */
export async function createToken(
  type: TokenType,
  userType: UserType,
  userId: string
): Promise<string> {
  // Marque les précédents comme utilisés (silencieusement révoqués).
  await prisma.authToken.updateMany({
    where: { type, userType, userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateRawToken();
  const expiresAt = new Date(Date.now() + DURATIONS_MS[type]);
  await prisma.authToken.create({
    data: { type, userType, userId, token, expiresAt },
  });
  return token;
}

/**
 * Vérifie qu'un token est valide (existe, non expiré, non utilisé).
 * Retourne le record si OK, null sinon.
 */
export async function findValidToken(token: string, type: TokenType) {
  if (!token || typeof token !== "string") return null;
  const record = await prisma.authToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.type !== type) return null;
  if (record.usedAt !== null) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  return record;
}

/**
 * Marque un token comme utilisé. À appeler APRÈS l'action (changement
 * de mot de passe ou validation d'email) pour éviter le rejeu.
 */
export async function consumeToken(tokenId: string): Promise<void> {
  await prisma.authToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}
