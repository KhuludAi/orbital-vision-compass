import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { EYE } from "@/lib/sans/eyes";
import { STATUS_META, signed, type EyeSummary } from "@/lib/sans/metrics";
import { EyeTag, QualityBadge, Term } from "./ui";
import type { ReactNode } from "react";

const TrendIcon = { rising: TrendingUp, falling: TrendingDown, stable: Minus };

function Cell({ label, children, sub }: { label: ReactNode; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-base tabular-nums text-foreground">{children}</dd>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Dedicated per-eye status card. Colour + plain label make ownership of every value obvious. */
export function EyeCard({ s, children, className }: { s: EyeSummary; children?: ReactNode; className?: string }) {
  const m = EYE[s.eye];
  const st = STATUS_META[s.status];
  const T = TrendIcon[s.trend];
  return (
    <section className={cn("panel relative overflow-hidden p-5 animate-rise", className)} aria-label={`${m.label} status`}>
      <span className={cn("absolute inset-y-0 left-0 w-1", m.bg)} aria-hidden />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <EyeTag eye={s.eye} size="lg" />
          <p className={cn("mt-2 text-sm font-medium", st.text)}>{st.label}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground"><Term k="Delta">Change from baseline</Term></p>
          <p className={cn("font-mono text-3xl font-medium tabular-nums", st.text)}>{signed(s.delta)}<span className="ml-1 font-sans text-sm text-muted-foreground">µm</span></p>
        </div>
      </header>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        <Cell label={<Term k="Baseline">Baseline RNFL</Term>}>{s.baseline.toFixed(1)} µm</Cell>
        <Cell label={<Term k="Kalman">Latest estimate</Term>} sub={s.latestRaw != null ? `Last raw reading ${s.latestRaw.toFixed(1)} µm` : undefined}>{s.estimate.toFixed(1)} µm</Cell>
        <Cell label={<Term k="Uncertainty">Uncertainty</Term>} sub={`${s.confidence} confidence`}>±{s.ci.toFixed(1)} µm</Cell>
        <Cell label="Trend direction" sub={`${signed(s.slope30, 2)} µm / 30 days`}><span className="inline-flex items-center gap-1 font-sans text-sm capitalize"><T className={cn("h-4 w-4", s.trend === "rising" ? "text-warning" : "text-muted-foreground")} aria-hidden />{s.trend}</span></Cell>
        <Cell label="Last OCT scan" sub={s.daysSinceScan != null ? `${s.daysSinceScan} days ago` : undefined}>{s.lastScan ? `Day ${s.lastScan.day}` : "None"}</Cell>
        <Cell label={<Term k="SSI">Scan signal quality</Term>}>
          {s.lastScan ? <span className="inline-flex items-center gap-2">{s.lastScan.signal.toFixed(1)}<span className="text-xs text-muted-foreground">/10</span><QualityBadge q={s.lastScan.quality} /></span> : "—"}
        </Cell>
        <Cell label="Usable scans">{s.usable}/{s.total}</Cell>
        <Cell label={<Term k="CI">95% range</Term>}>{s.lo.toFixed(1)}–{s.hi.toFixed(1)}</Cell>
      </dl>
      {children && <div className="mt-5 border-t border-border pt-4">{children}</div>}
    </section>
  );
}
