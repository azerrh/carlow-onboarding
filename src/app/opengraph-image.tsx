import { ImageResponse } from "next/og";

/**
 * Image Open Graph dynamique pour la page d'accueil.
 * Affichée quand le lien Carlow est partagé sur LinkedIn, Twitter, Slack, etc.
 *
 * Format : 1200x630px (ratio standard OG / Twitter Card).
 * Construite en JSX via @vercel/og — bundlée en Edge runtime à la
 * première requête, puis cachée par le CDN Vercel.
 */

export const runtime = "edge";
export const alt = "Carlow — Marketplace B2B EnR";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #FFF8F1 0%, #FFFFFF 50%, #F0FAF5 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Bulles décoratives */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            background: "rgba(232, 122, 48, 0.20)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -120,
            width: 400,
            height: 400,
            background: "rgba(34, 160, 107, 0.15)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "#E87A30",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 50,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: -1,
            }}
          >
            arlow
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#E87A30",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 16,
          }}
        >
          Marketplace B2B EnR
        </div>

        {/* Titre principal */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#1a1a1a",
            lineHeight: 1.1,
            letterSpacing: -2,
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          La marketplace dédiée aux équipements{" "}
          <span style={{ color: "#E87A30" }}>EnR</span> des pros.
        </div>

        {/* Sous-titre */}
        <div
          style={{
            fontSize: 26,
            color: "#666",
            maxWidth: 850,
            lineHeight: 1.4,
          }}
        >
          Photovoltaïque · Onduleurs · Batteries · IRVE · Pompes à chaleur
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ fontSize: 22, color: "#999", fontFamily: "monospace" }}
          >
            carlowonboarding.vercel.app
          </div>
          <div
            style={{
              display: "flex",
              gap: 14,
              fontSize: 18,
              color: "#666",
              fontWeight: 600,
            }}
          >
            <span>✓ Stripe</span>
            <span>✓ VIES</span>
            <span>✓ SIRENE</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
