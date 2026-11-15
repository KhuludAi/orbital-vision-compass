import type { ReactNode } from "react";
import { AlertTriangle, CircleCheck, CircleOff, Clock3, Eye as EyeIcon, Info, Loader2, OctagonAlert, RefreshCw, SatelliteDish, Waves } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EYE } from "@/lib/sans/eyes";
import { GLOSSARY, type Term as TermKey } from "@/lib/sans/glossary";
import type { Eye, Quality, Severity } from "@/lib/sans/types";

export function Panel({ title, eyebrow, action, children, className }: { title?: ReactNode; eyebrow?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel min-w-0 p-5 animate-rise", className)}>
      {(title || eyebrow || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="mt-1 text-base font-semibold text-foreground">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export type Tone = "default" | "warning" | "critical" | "success";
export const toneText: Record<Tone, string> = { default: "text-foreground", warning: "text-warning", critical: "text-destructive", success: "text-success" };

export function Stat({ label, value, unit, sub, tone = "default", icon }: { label: ReactNode; value: ReactNode; unit?: string; sub?: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <div className="panel relative overflow-hidden p-4 animate-rise">
      <div className="flex items-center justify-between gap-2"><p className="eyebrow">{label}</p><span className="text-primary/70">{icon}</span></div>
      <p className={cn("mt-2 font-mono text-2xl font-medium tabular-nums md:text-3xl", toneText[tone])}>{value}{unit && <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">{unit}</span>}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="eyebrow text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const QUALITY: Record<Quality, { label: string; cls: string; icon: typeof CircleCheck; impact: string }> = {
  good: { label: "Good", cls: "bg-success/12 text-success border-success/30", icon: CircleCheck, impact: "Full weight in the estimate." },
  delayed: { label: "Delayed", cls: "bg-delayed/12 text-delayed border-delayed/35", icon: Clock3, impact: "Measured later than planned — the gap before it widens uncertainty." },
  noisy: { label: "Noisy", cls: "bg-warning/12 text-warning border-warning/30", icon: Waves, impact: "High measurement noise — counts about 9× less than a good scan." },
  missing: { label: "Missing", cls: "bg-destructive/12 text-destructive border-destructive/30", icon: CircleOff, impact: "No usable volume — the estimate cannot update and uncertainty grows." },
};
export function QualityBadge({ q }: { q: Quality }) {
  const m = QUALITY[q];
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", m.cls)}><m.icon className="h-3 w-3" aria-hidden />{m.label}</span>;
}

export const SEVERITY: Record<Severity, { label: string; cls: string; icon: typeof Info }> = {
  info: { label: "Info", cls: "bg-primary/10 text-primary border-primary/30", icon: Info },
  warning: { label: "Warning", cls: "bg-warning/12 text-warning border-warning/35", icon: AlertTriangle },
  critical: { label: "Critical", cls: "bg-destructive/15 text-destructive border-destructive/40", icon: OctagonAlert },
};
export function SeverityBadge({ s }: { s: Severity }) {
  const m = SEVERITY[s];
  return <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", m.cls)}><m.icon className="h-3 w-3" aria-hidden />{m.label}</span>;
}

/** Eye identifier — never shows OD/OS without the plain-language side. */
export function EyeTag({ eye, size = "sm", className }: { eye: Eye; size?: "sm" | "md" | "lg"; className?: string }) {
  const m = EYE[eye];
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-display font-semibold uppercase tracking-[0.12em]", m.text, size === "sm" && "text-[11px]", size === "md" && "text-xs", size === "lg" && "text-sm", className)}>
      <span className={cn("grid place-items-center rounded-full border", m.border, m.soft, size === "lg" ? "h-7 w-7" : "h-5 w-5")}><EyeIcon className={size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} aria-hidden /></span>
      {m.upper}
    </span>
  );
}

/** Technical term with a hover/focus explanation. */
export function Term({ k, children, className }: { k: TermKey; children?: ReactNode; className?: string }) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className={cn("cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm", className)}>{children ?? k}</button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">{GLOSSARY[k]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, label, className }: { value: T; options: { value: T; label: ReactNode; activeClass?: string }[]; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex flex-wrap rounded-lg border border-border bg-background/40 p-0.5", className)}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn("rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors", value === o.value ? (o.activeClass ?? "bg-primary/15 text-primary ring-1 ring-primary/30") : "text-muted-foreground hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function eyeOptions<T extends Eye>() {
  return [
    { value: "OD" as T, label: "Right eye (OD)", activeClass: "bg-od/15 text-od ring-1 ring-od/40" },
    { value: "OS" as T, label: "Left eye (OS)", activeClass: "bg-os/15 text-os ring-1 ring-os/40" },
  ];
}

export function LoadingState() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-muted-foreground" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="eyebrow">Acquiring telemetry…</p>
    </div>
  );
}
export function ErrorState({ message, onRetry, onDemo }: { message: string; onRetry: () => void; onDemo?: () => void }) {
  return (
    <div className="panel mx-auto mt-16 max-w-lg p-8 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
      <h2 className="mt-3 text-lg font-semibold">Link to analysis service lost</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 flex justify-center gap-2">
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"><RefreshCw className="h-4 w-4" />Retry</button>
        {onDemo && <button onClick={onDemo} className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-primary-foreground">Switch to demo mode</button>}
      </div>
    </div>
  );
}
export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      {icon ?? <SatelliteDish className="h-7 w-7 text-primary/60" />}
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

/** Inline legend swatch. */
export function Swatch({ kind, color, label }: { kind: "line" | "dot" | "band" | "dash" | "diamond"; color: string; label: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <svg width="18" height="10" aria-hidden>
        {kind === "line" && <line x1="0" y1="5" x2="18" y2="5" stroke={color} strokeWidth="2.5" />}
        {kind === "dash" && <line x1="0" y1="5" x2="18" y2="5" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />}
        {kind === "dot" && <circle cx="9" cy="5" r="3.2" fill={color} />}
        {kind === "diamond" && <rect x="5.5" y="1.5" width="7" height="7" transform="rotate(45 9 5)" fill={color} />}
        {kind === "band" && <rect x="0" y="1" width="18" height="8" rx="2" fill={color} opacity="0.3" />}
      </svg>
      {label}
    </span>
  );
}

export const tooltipStyle = {
  contentStyle: { background: "oklch(0.17 0.03 252 / 0.97)", border: "1px solid oklch(0.85 0.08 220 / 0.2)", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "oklch(0.68 0.03 235)", fontFamily: "JetBrains Mono" },
  itemStyle: { padding: 0 },
};
export const axisProps = { stroke: "oklch(0.72 0.03 235 / 0.75)", fontSize: 11, tickLine: false, axisLine: false, fontFamily: "JetBrains Mono" } as const;
export const gridStroke = "var(--grid-stroke)";
