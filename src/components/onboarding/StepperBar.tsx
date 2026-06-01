import { cn } from "@/lib/cn";

const STEPS = [
  "Compte",
  "Société",
  "Documents",
  "Certifications",
  "Logistique",
  "Confirmation",
];

/**
 * Barre de progression de l'onboarding vendeur.
 *
 * `current` = index (0-based) de l'étape en cours.
 * Les étapes < current sont marquées "complétées" (✓), l'étape == current
 * est mise en avant, les étapes > current sont grisées.
 *
 * Refait en Tailwind (compatible dark mode + tokens de couleur Carlow).
 */
export function StepperBar({ current }: { current: number }) {
  const progressPct =
    STEPS.length > 1
      ? (Math.min(current, STEPS.length - 1) / (STEPS.length - 1)) * 100
      : 0;

  return (
    <div className="mb-8">
      {/* Version desktop : cercles + connecteurs */}
      <div className="relative hidden sm:block">
        {/* Ligne de fond */}
        <div className="absolute left-0 right-0 top-[15px] h-0.5 bg-[rgb(var(--border))]" />
        {/* Ligne de progression */}
        <div
          className="absolute left-0 top-[15px] h-0.5 bg-gradient-to-r from-[rgb(var(--primary))] to-[#c05510] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />

        <ol className="relative flex justify-between">
          {STEPS.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={label} className="flex flex-col items-center">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                    done &&
                      "border-[rgb(var(--primary))] bg-[rgb(var(--primary))] text-white shadow-[0_2px_8px_rgb(var(--primary)/0.35)]",
                    active &&
                      "border-[rgb(var(--primary))] bg-[rgb(var(--card))] text-[rgb(var(--primary))] shadow-[0_0_0_4px_rgb(var(--primary)/0.12)]",
                    !done &&
                      !active &&
                      "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]"
                  )}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    "mt-2 text-[11px] font-medium transition-colors",
                    active
                      ? "text-[rgb(var(--primary))]"
                      : done
                        ? "text-[rgb(var(--fg))]"
                        : "text-[rgb(var(--muted))]"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Version mobile : compteur + barre + label */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight">
            {STEPS[Math.min(current, STEPS.length - 1)]}
          </span>
          <span className="text-xs font-semibold text-[rgb(var(--muted))]">
            Étape {Math.min(current + 1, STEPS.length)} / {STEPS.length}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--border))]/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--primary))] to-[#c05510] transition-all duration-500"
            style={{
              width: `${((Math.min(current, STEPS.length - 1) + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
