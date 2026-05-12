// Test direct de l'envoi Resend
// Usage : node scripts/test-resend.mjs <to-email>

import { Resend } from "resend";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

const to = process.argv[2];
if (!to) {
  console.error("Usage : node scripts/test-resend.mjs <to-email>");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("❌ RESEND_API_KEY manquant");
  process.exit(1);
}

console.log(`→ Test envoi Resend vers : ${to}`);
console.log(`   API key : ${apiKey.slice(0, 10)}...`);

const resend = new Resend(apiKey);

try {
  const result = await resend.emails.send({
    from: "Carlow <onboarding@resend.dev>",
    to,
    subject: "Test Resend Carlow",
    html: "<p>Si vous recevez ce mail, Resend fonctionne pour cet email.</p>",
  });

  console.log("\n✓ Resend a accepté la requête :");
  console.log(JSON.stringify(result, null, 2));

  if (result.error) {
    console.log("\n❌ MAIS Resend a retourné une erreur :");
    console.log(JSON.stringify(result.error, null, 2));
  }
} catch (err) {
  console.error("\n❌ Erreur d'envoi :");
  console.error(err);
}
