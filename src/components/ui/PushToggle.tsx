"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useWebPush } from "@/hooks/useWebPush";
import { cn } from "@/lib/cn";

/**
 * Carte "Activer les notifications" — à insérer dans les dashboards.
 *
 * Adapte l'UI au support navigateur et à l'état de permission :
 *  - Non supporté → message d'incompatibilité
 *  - Permission denied → CTA pour expliquer comment réactiver
 *  - Default → bouton "Activer"
 *  - Granted + souscrit → bouton "Désactiver"
 */
export function PushToggle({
  user,
  compact,
}: {
  user: { vendorId?: string; buyerId?: string };
  compact?: boolean;
}) {
  const { supported, permission, enabled, loading, busy, subscribe, unsubscribe } =
    useWebPush(user);

  if (loading) {
    return (
      <Card className={cn("p-4 sm:p-5", compact && "p-3 sm:p-4")}>
        <p className="text-xs text-[rgb(var(--muted))]">Chargement…</p>
      </Card>
    );
  }

  if (!supported) {
    return (
      <Card className={cn("p-4 sm:p-5", compact && "p-3 sm:p-4")}>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-black/[0.04] text-base">
            🔕
          </span>
          <div>
            <p className="text-sm font-semibold">Notifications non supportées</p>
            <p className="text-[11px] text-[rgb(var(--muted))]">
              Votre navigateur ne supporte pas les notifications push.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isOn = enabled && permission === "granted";

  return (
    <Card className={cn("p-4 sm:p-5", compact && "p-3 sm:p-4")}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base",
            isOn
              ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
              : "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
          )}
        >
          {isOn ? "🔔" : "🔕"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {isOn
              ? "Notifications activées"
              : "Notifications push désactivées"}
          </p>
          <p className="text-[11px] text-[rgb(var(--muted))]">
            {isOn
              ? "Vous serez prévenu des nouveaux messages et commandes même hors onglet."
              : permission === "denied"
                ? "Les notifications sont bloquées dans les paramètres du navigateur. Réactivez-les depuis l'icône à gauche de la barre d'URL."
                : "Activez pour recevoir une alerte instantanée sur les évènements importants."}
          </p>
        </div>
        <Button
          size="sm"
          variant={isOn ? "secondary" : "primary"}
          disabled={busy || permission === "denied"}
          onClick={() => (isOn ? unsubscribe() : subscribe())}
        >
          {busy ? "…" : isOn ? "Désactiver" : "Activer"}
        </Button>
      </div>
    </Card>
  );
}
