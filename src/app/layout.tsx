import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/components/ui/ThemeToggle";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carlow — Marketplace B2B EnR",
  description:
    "Marketplace européenne des équipements d'énergies renouvelables. Photovoltaïque, onduleurs, batteries, IRVE, pompes à chaleur — vendeurs vérifiés, paiement sécurisé Stripe.",
  metadataBase: new URL("https://carlowonboarding.vercel.app"),
  openGraph: {
    title: "Carlow — Marketplace B2B EnR",
    description:
      "La marketplace dédiée aux équipements EnR pour les professionnels.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      // suppressHydrationWarning : le ThemeScript modifie data-theme avant
      // que React n'hydrate, ce qui sinon génère un warning de mismatch.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          Script inline qui applique le thème (dark/light) AVANT le premier
          paint. Doit être en <head> et exécuté en synchrone, sinon flash
          blanc sur les utilisateurs en mode sombre.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsent />
        <ScrollToTop />
      </body>
    </html>
  );
}
