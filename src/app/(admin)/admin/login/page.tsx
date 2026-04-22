"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || "Mot de passe incorrect");
        setLoading(false);
        return;
      }
      router.push("/admin");
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-[400px] p-8">
        <div className="mb-6 flex items-center gap-3">
          <Brand variant="compact" />
          <span className="rounded-full bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--primary))]">
            Admin
          </span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">Accès administration</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Réservé à l&apos;équipe Carlow.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]"
            >
              Mot de passe admin
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={cn("w-full", loading && "opacity-60")}
          >
            {loading ? "Connexion…" : "Accéder au panel"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
