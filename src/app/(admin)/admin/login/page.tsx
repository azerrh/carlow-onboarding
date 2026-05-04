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
      setError("Erreur reseau.");
      setLoading(false);
    }
  }

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-[420px] overflow-hidden p-0">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[rgb(var(--primary))] via-[#d4692a] to-[rgb(var(--success))]" />

        <div className="p-8">
          {/* Logo */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[#c46020] text-xl font-bold text-white shadow-sm">
                C
              </span>
              <div>
                <span className="text-lg font-bold tracking-tight">Carlow</span>
                <span className="ml-1.5 rounded-md bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--primary))]">
                  Admin
                </span>
              </div>
            </div>
          </div>

          <h1 className="text-xl font-semibold tracking-tight">Acces administration</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Reserve a l&apos;equipe Carlow.</p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
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
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Entrez le mot de passe"
                  className={cn(
                    "h-12 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-4 pr-10 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20",
                    error && "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  )}
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn("h-12 w-full text-sm font-semibold", loading && "opacity-60")}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Connexion…
                </span>
              ) : (
                "Acceder au panel"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-[rgb(var(--border))] bg-black/[0.02] px-8 py-4">
          <p className="text-center text-[11px] text-[rgb(var(--muted))]">
            Propulse par Carlow — Plateforme B2B multi-vendeurs
          </p>
        </div>
      </Card>
    </div>
  );
}
