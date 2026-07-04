import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Hôte Supabase Storage (où vivent les photos produits). Déduit de l'env
// publique pour rester synchro avec le projet Supabase ; fallback sur l'hôte
// connu si l'env n'est pas chargée au moment du build.
function supabaseHostname(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "veylgmgeldakcwpmwayx.supabase.co";
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    // next/image redimensionne et sert du WebP/AVIF à la volée pour les photos
    // stockées sur Supabase (les originaux peuvent peser plusieurs Mo). Voir
    // le composant <SmartImage> qui s'appuie sur cette whitelist.
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [50, 75],
    minimumCacheTTL: 2_592_000, // 30 jours — les photos changent rarement
  },
};

export default nextConfig;
