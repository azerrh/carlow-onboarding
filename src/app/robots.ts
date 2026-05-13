import type { MetadataRoute } from "next";

/**
 * robots.txt — directives crawlers.
 *
 * On bloque explicitement les espaces privés (dashboard, admin, buyer
 * privé, API) pour éviter que Google ne les indexe par accident.
 *
 * Next.js sert ce fichier automatiquement sur /robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  const base = "https://carlowonboarding.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/marketplace",
          "/marketplace/",
          "/legal/",
          "/register",
          "/buyer/register",
          "/login",
          "/buyer/login",
          "/forgot-password",
        ],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/buyer/dashboard",
          "/buyer/orders",
          "/buyer/account",
          "/buyer/favoris",
          "/api/",
          "/checkout/",
          "/reset-password/",
          "/verify-email",
          "/step-2-company",
          "/step-3-documents",
          "/step-4-certifications",
          "/step-5-logistics",
          "/step-6-confirmation",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
