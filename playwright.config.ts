import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration Playwright pour les tests E2E.
 *
 * Stratégie :
 *  - Par défaut on cible https://carlowonboarding.vercel.app (la prod).
 *    Pour tester en local, exporter BASE_URL=http://localhost:3000 puis
 *    lancer `npm run dev` dans un autre terminal.
 *  - On ne lance PAS de webServer automatique : les tests sont rejouables
 *    contre n'importe quel déploiement (preview, prod, local).
 *  - Browsers : Chromium uniquement par défaut (Firefox/Webkit en option).
 *
 * Lancer : `npx playwright test`
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "https://carlowonboarding.vercel.app",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
