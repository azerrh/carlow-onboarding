"use client";

import { cn } from "@/lib/cn";

/**
 * Petits composants de visualisation SVG pour le dashboard admin.
 *
 * Volontairement sans dépendance externe (pas de Recharts, Chart.js) :
 *  - Bundle plus léger
 *  - Maîtrise totale du style/dark-mode
 *  - Pas de hydration mismatch sur des libs côté client uniquement
 *
 * Pour des charts plus complexes (zoom, légendes interactives), envisager
 * Recharts. Ici on reste sur des charts statiques très propres.
 */

/* ---------- LineChart (sparkline + axis) ---------- */

export function LineChart({
  labels,
  series,
  height = 180,
  format,
  color = "#E87A30",
}: {
  labels: string[];
  series: number[];
  height?: number;
  format?: (v: number) => string;
  color?: string;
}) {
  if (series.length === 0) return null;
  const max = Math.max(...series, 1);
  const min = 0;
  const W = 100; // viewBox width, ratio
  const H = 100;
  const pad = { top: 6, right: 4, bottom: 18, left: 4 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const x = (i: number) =>
    pad.left + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - ((v - min) / (max - min)) * innerH;

  const path = series.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const areaPath = `${path} L${x(series.length - 1)},${pad.top + innerH} L${x(0)},${pad.top + innerH} Z`;

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
        role="img"
      >
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Gridlines horizontales (4) */}
        {[0.25, 0.5, 0.75].map((t) => {
          const yy = pad.top + innerH * t;
          return (
            <line
              key={t}
              x1={pad.left}
              x2={W - pad.right}
              y1={yy}
              y2={yy}
              stroke="rgb(var(--border))"
              strokeWidth="0.2"
              strokeDasharray="0.5 0.5"
            />
          );
        })}
        {/* Air sous la courbe */}
        <path d={areaPath} fill="url(#lineFill)" />
        {/* Courbe */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points + tooltips natifs SVG */}
        {series.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r="0.8" fill={color} />
            <title>
              {labels[i]} : {format ? format(v) : String(v)}
            </title>
          </g>
        ))}
        {/* Labels X (sub-échantillonné si trop nombreux) */}
        {labels.map((lab, i) => {
          if (labels.length > 6 && i % 2 !== 0 && i !== labels.length - 1) return null;
          return (
            <text
              key={i}
              x={x(i)}
              y={H - 4}
              fontSize="3.2"
              textAnchor="middle"
              fill="rgb(var(--muted))"
            >
              {lab}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- BarsChart (verticales, série unique) ---------- */

export function BarsChart({
  labels,
  series,
  height = 180,
  format,
  color = "#E87A30",
}: {
  labels: string[];
  series: number[];
  height?: number;
  format?: (v: number) => string;
  color?: string;
}) {
  const max = Math.max(...series, 1);
  return (
    <div className="flex w-full items-end gap-2" style={{ height }}>
      {series.map((v, i) => {
        const h = (v / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${Math.max(h, 2)}%`,
                  background: `linear-gradient(to top, ${color}cc, ${color}55)`,
                }}
                title={`${labels[i]} : ${format ? format(v) : String(v)}`}
              />
            </div>
            <span className="text-[10px] font-medium text-[rgb(var(--muted))]">
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Donut chart (parts) ---------- */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const radius = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const arcs = slices.map((s, i) => {
    const fraction = s.value / total;
    const length = fraction * 2 * Math.PI * radius;
    const dasharray = `${length} ${2 * Math.PI * radius}`;
    const el = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={s.color}
        strokeWidth={thickness}
        strokeDasharray={dasharray}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      >
        <title>
          {s.label} : {s.value} ({Math.round(fraction * 100)}%)
        </title>
      </circle>
    );
    offset += length;
    return el;
  });

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Cercle de fond */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgb(var(--border))"
            strokeOpacity="0.4"
            strokeWidth={thickness}
          />
          {arcs}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-xl font-bold tracking-tight">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <ul className="grid w-full grid-cols-1 gap-1.5 sm:flex-1">
        {slices.map((s) => {
          const fraction = (s.value / total) * 100;
          return (
            <li key={s.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: s.color }}
                />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="shrink-0 font-mono text-[rgb(var(--muted))]">
                {s.value} · {Math.round(fraction)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- KPI Card avec trend ---------- */

export function KpiCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  trend?: number; // % growth, peut être négatif
  trendLabel?: string;
  icon: string;
  highlight?: boolean;
}) {
  const positive = trend !== undefined && trend >= 0;
  return (
    <div
      className={cn(
        "rounded-2xl border bg-[rgb(var(--card))] p-5",
        highlight
          ? "border-[rgb(var(--primary))]/30 shadow-[0_8px_24px_-12px_rgba(232,122,48,0.3)]"
          : "border-[rgb(var(--border))]/60"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl text-xl",
            highlight ? "bg-[rgb(var(--primary))]/15" : "bg-[rgb(var(--primary))]/8"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
            {label}
          </p>
          <p className="truncate text-lg font-bold tracking-tight sm:text-xl">
            {value}
          </p>
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-[rgb(var(--border))]/40 pt-2.5 text-[11px]">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              positive
                ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                : "bg-red-50 text-red-700"
            )}
          >
            {positive ? "↗" : "↘"} {Math.abs(trend)}%
          </span>
          {trendLabel && (
            <span className="text-[rgb(var(--muted))]">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
