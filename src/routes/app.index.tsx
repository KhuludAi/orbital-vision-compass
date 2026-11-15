import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowRight, CalendarClock, Database, Eye, HeartPulse, RefreshCcw, ShieldAlert } from "lucide-react";
import { Panel, PageHeader, SeverityBadge, Stat } from "@/components/sans/ui";
import { RnflChart } from "@/components/sans/RnflChart";
import { useDataset } from "@/lib/sans/store";
import { planScans } from "@/lib/sans/planner";
import { RNFL_CRIT, RNFL_WARN } from "@/lib/sans/simulate";
import { pageHead } from "@/lib/sans/head";
import type { Eye as EyeT } from "@/lib/sans/types";

export const Route = createFileRoute("/app/")({
  head: () => pageHead("Mission Control", "Overview of simulated SANS risk, per-eye OCT estimates, alerts and scan schedule."),
  component: MissionControl,
});

const tone = (d: number): "critical" | "warning" | "success" => d > RNFL_CRIT ? "critical" : d > RNFL_WARN ? "warning" : "success";

function MissionControl() {
  const { data, range, budget, acked } = useDataset();
  const from = data.currentDay - range;
  const last = (e: EyeT) => {
    const point = data.kalman[e].at(-1);
    if (!point) throw new Error(`No Kalman estimates available for ${e}`);
    return point;
  };
  const recs = useMemo(() => planScans(data, budget), [data, budget]);
  const usable = data.scans.filter((s) => s.quality !== "missing").length;
  const open = data.alerts.filter((a) => !acked.has(a.id) && a.severity !== "info");
  const risk = Math.min(100, Math.round((Math.max(last("OD").delta, last("OS").delta) / RNFL_CRIT) * 100));
  const unsynced = data.scans.filter((s) => !s.synced).length;

  return (
    <>
      <PageHeader eyebrow={`${data.astronaut.id} · ${data.astronaut.callsign} · ${data.astronaut.mission}`} title="Mission Control" description="Fused, uncertainty-aware view of simulated per-eye retinal nerve fiber layer (RNFL) thickness, data health and recommended OCT sessions." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Mission day" value={data.currentDay} sub={`of ${data.astronaut.missionLengthDays}`} icon={<CalendarClock className="h-4 w-4" />} />
        <Stat label="OD Δ RNFL" value={(last("OD").delta >= 0 ? "+" : "") + last("OD").delta.toFixed(1)} unit="µm" tone={tone(last("OD").delta)} sub={`±${(1.96 * last("OD").sd).toFixed(1)} µm 95% CI`} icon={<Eye className="h-4 w-4" />} />
        <Stat label="OS Δ RNFL" value={(last("OS").delta >= 0 ? "+" : "") + last("OS").delta.toFixed(1)} unit="µm" tone={tone(last("OS").delta)} sub={`±${(1.96 * last("OS").sd).toFixed(1)} µm 95% CI`} icon={<Eye className="h-4 w-4" />} />
        <Stat label="Data completeness" value={Math.round((usable / data.scans.length) * 100)} unit="%" sub={`${usable}/${data.scans.length} usable scans`} icon={<Database className="h-4 w-4" />} />
        <Stat label="Open alerts" value={open.length} tone={open.some((a) => a.severity === "critical") ? "critical" : open.length ? "warning" : "success"} sub="warning + critical" icon={<ShieldAlert className="h-4 w-4" />} />
        <Stat label="Downlink queue" value={unsynced} sub={unsynced ? "awaiting sync" : "all synced"} tone={unsynced ? "warning" : "success"} icon={<RefreshCcw className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" eyebrow="Kalman-filtered RNFL · 95% confidence band" title="Per-eye trajectory" action={<Link to="/app/monitoring" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Details <ArrowRight className="h-3 w-3" /></Link>}>
          <div className="grid gap-4 md:grid-cols-2">
            {(["OD", "OS"] as EyeT[]).map((e) => (
              <div key={e}>
                <p className="mb-1 font-mono text-xs"><span className={e === "OD" ? "text-od" : "text-os"}>●</span> {e} {e === "OD" ? "right eye" : "left eye"}</p>
                <RnflChart eye={e} points={data.kalman[e]} baseline={data.astronaut.baseline[e]} fromDay={from} height={230} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel eyebrow="Composite indicator" title="SANS progression index">
          <RiskGauge value={risk} />
          <p className="mt-3 text-xs text-muted-foreground">Index = largest per-eye RNFL Δ relative to the {RNFL_CRIT} µm review threshold. A research heuristic, not a diagnosis.</p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel eyebrow="Latest" title="Alerts" action={<Link to="/app/alerts" className="text-xs text-primary hover:underline">All alerts</Link>}>
          <ul className="space-y-2">
            {data.alerts.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-2.5">
                <SeverityBadge s={a.severity} />
                <div className="min-w-0"><p className="truncate text-sm">{a.title}</p><p className="font-mono text-[10px] text-muted-foreground">D{a.day} · {a.category}</p></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel eyebrow={`Next 14 days · ${budget} min crew budget`} title="Recommended OCT sessions" action={<Link to="/app/planner" className="text-xs text-primary hover:underline">Planner</Link>}>
          {recs.length ? (
            <ul className="space-y-2">{recs.slice(0, 5).map((r) => (
              <li key={`${r.eye}${r.day}`} className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-sm">
                <span className="font-mono"><span className={r.eye === "OD" ? "text-od" : "text-os"}>{r.eye}</span> · D{r.day}</span>
                <span className="text-xs text-muted-foreground">{r.minutes} min</span>
              </li>))}</ul>
          ) : <p className="text-sm text-muted-foreground">No sessions fit the current budget.</p>}
        </Panel>
        <Panel eyebrow="Wearable context" title="Heart rate" action={<Link to="/app/vitals" className="text-xs text-primary hover:underline"><HeartPulse className="h-4 w-4" /></Link>}>
          <p className="font-display text-3xl font-semibold">{data.vitals.at(-1)?.hr ?? "—"}<span className="ml-1 text-sm text-muted-foreground">bpm</span></p>
          <div className="h-24"><ResponsiveContainer><AreaChart data={data.vitals.slice(-range)}><defs><linearGradient id="hr" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart-os)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--chart-os)" stopOpacity={0} /></linearGradient></defs><Area dataKey="hr" stroke="var(--chart-os)" fill="url(#hr)" strokeWidth={1.5} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>
        </Panel>
      </div>
    </>
  );
}

function RiskGauge({ value }: { value: number }) {
  const r = 70, c = Math.PI * r;
  const color = value >= 100 ? "var(--destructive)" : value >= 50 ? "var(--warning)" : "var(--primary)";
  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg viewBox="0 0 180 105" className="w-full" role="img" aria-label={`Progression index ${value} of 100`}>
        <path d="M20 95 A70 70 0 0 1 160 95" stroke="oklch(0.85 0.08 220 / 0.1)" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M20 95 A70 70 0 0 1 160 95" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0.02, value / 100))} style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center"><p className="font-display text-4xl font-semibold tabular-nums">{value}</p><p className="eyebrow">/ 100</p></div>
    </div>
  );
}
