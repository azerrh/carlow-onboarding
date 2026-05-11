import { test, expect } from "@playwright/test";

/**
 * Tests E2E des flows d'authentification.
 *
 * Utilise les comptes de démo seedés (scripts/seed-demo-accounts.mjs) :
 *  - Vendor : azerrahali@gmail.com / 12345678 (status active)
 *  - Buyer  : azerrahali@gmail.com / 123456789
 *  - Admin  : password "carlow-admin-2026!"
 */

const VENDOR_EMAIL = "azerrahali@gmail.com";
const VENDOR_PASS = "12345678";
const BUYER_EMAIL = "azerrahali@gmail.com";
const BUYER_PASS = "123456789";
const ADMIN_PASS = "carlow-admin-2026!";

test.describe("Connexion vendeur", () => {
  test("Connexion vendeur réussie redirige vers le dashboard", async ({ page }) => {
    await page.goto("/login");

    // Formulaire de connexion
    await page.fill('input[type="email"]', VENDOR_EMAIL);
    await page.fill('input[type="password"]', VENDOR_PASS);
    await page.click('button[type="submit"]');

    // Redirection vers /dashboard (peut prendre un moment)
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Connexion vendeur échoue avec un mauvais mot de passe", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', VENDOR_EMAIL);
    await page.fill('input[type="password"]', "mauvais-mot-de-passe");
    await page.click('button[type="submit"]');

    // Le message d'erreur doit apparaître (peu importe le wording exact)
    await expect(page.locator("text=/incorrect|invalide|erreur/i").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe("Connexion acheteur", () => {
  test("Connexion acheteur réussie redirige vers le dashboard buyer", async ({ page }) => {
    await page.goto("/buyer/login");

    await page.fill('input[type="email"]', BUYER_EMAIL);
    await page.fill('input[type="password"]', BUYER_PASS);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/buyer\//, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/buyer\//);
  });
});

test.describe("Connexion admin", () => {
  test("Connexion admin avec le bon mot de passe ouvre le back-office", async ({ page }) => {
    await page.goto("/admin/login");

    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("Connexion admin échoue avec un mauvais mot de passe", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[type="password"]', "nope");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/incorrect|invalide|erreur/i").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
