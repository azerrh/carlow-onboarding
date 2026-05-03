import bcrypt from "bcryptjs";

/**
 * Helpers centralisés pour le hash et la vérification des mots de passe.
 *
 * - bcrypt avec 12 rounds (~250 ms sur Vercel Serverless en 2026)
 * - validation de robustesse côté serveur
 *
 * Tous les flux d'inscription/connexion (Vendor, Buyer) doivent passer par
 * ces fonctions — ne jamais réimplémenter bcrypt à la main ailleurs.
 */

/** Coût bcrypt. 12 = standard sécurité 2026, 14+ = trop lent en serverless. */
const BCRYPT_ROUNDS = 12;

/** Longueur minimale acceptée pour un mot de passe utilisateur. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Hash un mot de passe en clair.
 * Toujours utiliser pour les inscriptions et les changements de mot de passe.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Vérifie un mot de passe en clair contre un hash bcrypt.
 * Retourne `false` si l'un des arguments est falsy (pas d'exception sur null
 * pour simplifier les call-sites style `vendor ? compare(...) : false`).
 */
export async function verifyPassword(
  plain: string,
  hash: string | null | undefined
): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * Validation de robustesse — règles intentionnellement minimales (UX > friction).
 * Retourne `null` si OK, sinon le message d'erreur à afficher.
 */
export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== "string") return "Mot de passe invalide.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  if (password.length > 200) {
    return "Le mot de passe est trop long (max 200 caractères).";
  }
  return null;
}

/**
 * Validation email basique. Pas de regex parfaite (impossible en pratique) —
 * c'est juste pour rejeter les inputs ouvertement invalides côté API.
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  if (email.length < 6 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
