"use client";

import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";

export default function AdminParametresPage() {
  return (
    <AdminShell>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Paramètres"]}
        title="Paramètres"
        subtitle="Configuration de la plateforme"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compte admin */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6">
          <h2 className="text-base font-semibold">Compte administrateur</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Identifiants utilisés pour accéder au back-office.
          </p>
          <dl className="mt-4 space-y-3">
            <Row label="Email" value="admin@example.com" />
            <Row label="Méthode auth" value="Cookie (admin_session)" mono />
            <Row label="Durée session" value="8 heures" />
          </dl>
          <p className="mt-4 text-xs text-[rgb(var(--muted))]">
            Pour changer le mot de passe, modifie la variable
            <code className="mx-1 rounded bg-black/[0.05] px-1 py-0.5 text-xs">ADMIN_SECRET</code>
            dans
            <code className="mx-1 rounded bg-black/[0.05] px-1 py-0.5 text-xs">.env.local</code>
            (local) ou Vercel Dashboard (production).
          </p>
        </div>

        {/* Plateforme */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6">
          <h2 className="text-base font-semibold">Plateforme</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Métadonnées projet et état des intégrations.
          </p>
          <dl className="mt-4 space-y-3">
            <Row label="Nom" value="Carlow Marketplace" />
            <Row label="Stack" value="Next.js 16 + Prisma + Supabase" />
            <Row label="Email transactionnel" value="Resend" />
            <Row label="Stockage fichiers" value="Supabase Storage" />
          </dl>
        </div>

        {/* Schéma DB — état */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 lg:col-span-2">
          <h2 className="text-base font-semibold">Modèles Prisma</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            État du schéma de base de données. Les modèles manquants empêchent
            certaines pages admin de fonctionner avec de vraies données.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            <Mod name="Vendor" present />
            <Mod name="Document" present />
            <Mod name="Certification" present />
            <Mod name="Acheteur" />
            <Mod name="Produit" />
            <Mod name="Catalogue" />
            <Mod name="Photo" />
            <Mod name="Commande" />
            <Mod name="LigneCommande" />
            <Mod name="Notification" />
            <Mod name="Logistique" />
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))]/60 py-2 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "text-sm"}>{value}</dd>
    </div>
  );
}

function Mod({ name, present = false }: { name: string; present?: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[#f8f9fc] px-3 py-2">
      <span className="font-mono text-sm">{name}</span>
      {present ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          Actif
        </span>
      ) : (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          À créer
        </span>
      )}
    </li>
  );
}
