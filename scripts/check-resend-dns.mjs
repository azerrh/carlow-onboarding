// Vérifie que les records DNS Resend pour carlow.fr sont bien en place.
//
// Usage : node scripts/check-resend-dns.mjs
//
// Ce script utilise le DNS public Cloudflare (1.1.1.1) pour interroger
// les records SPF (TXT), DKIM (CNAME) et DMARC (TXT) attendus par Resend.
//
// ⚠️ Les VALEURS exactes des records sont générées par Resend lors de
// l'ajout du domaine sur resend.com/domains. Tu les verras dans leur
// dashboard. Ce script vérifie juste que des records EXISTENT aux bons
// endroits — la valeur exacte doit être validée côté dashboard Resend.

import { promises as dns } from "node:dns";

const DOMAIN = "carlow.fr";

// Endpoints DNS attendus pour Resend (format typique 2026)
const CHECKS = [
  {
    type: "TXT",
    host: `send.${DOMAIN}`,
    label: "SPF (autorise Resend à envoyer)",
    expectedSubstring: "amazonses.com",
  },
  {
    type: "MX",
    host: `send.${DOMAIN}`,
    label: "MX bounce handling",
    expectedSubstring: "feedback-smtp",
  },
  {
    type: "CNAME",
    host: `resend._domainkey.${DOMAIN}`,
    label: "DKIM signature (clé 1)",
    expectedSubstring: "amazonses.com",
  },
];

const OPTIONAL_CHECKS = [
  {
    type: "TXT",
    host: `_dmarc.${DOMAIN}`,
    label: "DMARC (recommandé, optionnel)",
    expectedSubstring: "v=DMARC1",
  },
];

async function check(spec) {
  try {
    let records;
    if (spec.type === "TXT") {
      records = (await dns.resolveTxt(spec.host)).flat();
    } else if (spec.type === "MX") {
      records = (await dns.resolveMx(spec.host)).map((r) => r.exchange);
    } else if (spec.type === "CNAME") {
      records = await dns.resolveCname(spec.host);
    } else {
      records = [];
    }
    const ok = records.some((r) =>
      r.toLowerCase().includes(spec.expectedSubstring.toLowerCase())
    );
    return { ok, records };
  } catch (err) {
    return { ok: false, error: err.code ?? err.message ?? String(err) };
  }
}

async function main() {
  console.log(`\n→ Vérification DNS Resend pour ${DOMAIN}\n`);

  let allOk = true;
  for (const spec of CHECKS) {
    process.stdout.write(`  [${spec.type}] ${spec.host.padEnd(40)} `);
    const r = await check(spec);
    if (r.ok) {
      console.log(`✓ OK (${spec.label})`);
    } else if (r.error === "ENOTFOUND" || r.error === "ENODATA") {
      console.log(`❌ Record absent  — ${spec.label}`);
      allOk = false;
    } else if (r.records) {
      console.log(`⚠ Trouvé mais valeur inattendue : ${JSON.stringify(r.records)}`);
      allOk = false;
    } else {
      console.log(`❌ Erreur DNS : ${r.error}`);
      allOk = false;
    }
  }

  console.log("\nRecords optionnels :");
  for (const spec of OPTIONAL_CHECKS) {
    process.stdout.write(`  [${spec.type}] ${spec.host.padEnd(40)} `);
    const r = await check(spec);
    if (r.ok) {
      console.log(`✓ Présent (${spec.label})`);
    } else {
      console.log(`(absent — ${spec.label})`);
    }
  }

  console.log("\n" + (allOk ? "✅ Tous les records obligatoires sont présents." : "❌ Au moins un record obligatoire manque. Vérifie ton DNS provider."));
  console.log("\nProchaine étape :");
  if (allOk) {
    console.log("  → Va sur resend.com/domains, clique « Verify DNS » pour");
    console.log("    carlow.fr. Une fois vert, décommente RESEND_FROM_EMAIL");
    console.log("    dans .env puis redéploie.");
  } else {
    console.log("  → Ajoute les records manquants chez ton DNS provider");
    console.log("    (les valeurs exactes sont dans resend.com/domains).");
    console.log("  → Attends 5 à 30 minutes pour propagation.");
    console.log("  → Relance ce script.");
  }
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
