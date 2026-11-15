import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, PageHeader, Segmented, axisProps, tooltipStyle } from "@/components/sans/ui";
import { RnflChart } from "@/components/sans/RnflChart";
import { useDataset } from "@/lib/sans/store";
import { RNFL_WARN } from "@/lib/sans/simulate";
import { pageHead } from "@/lib/sans/head";
import type { Eye } from "@/lib/sans/types";

export const Route = createFileRoute("/app/monitoring")({
  head: () => pageHead("SANS Monitoring", "Kalman-filtered per-eye RNFL trends with uncertainty bands and deviation from baseline."),
  component: Monitoring,
});

function Monitoring() {
  const { data, range } = useDataset();
  const [eye, setEye] = useState<Eye>("OD");
  const from = data.currentDay - range;
  const k = data.kalman[eye];
  const last = k.at(-1);
  if (!last) throw new Error(`No Kalman estimates available for ${eye}`);
  const leftByDay = new Map(data.kalman.OS.map((p) => [p.day, p.delta]));
  const delta = data.kalman.OD.filter((p) => p.day >= from).map((p) => ({ day: p.day, OD: +p.delta.toFixed(2), OS: leftByDay.has(p.day) ? Number(leftByDay.get(p.day)?.toFixed(2)) : null }));
  const table = k.filter((p) => p.obs != null && p.day >= from).slice(-10).reverse();
  return (
    <>
      <PageHeader eyebrow="Longitudinal surveillance" title="SANS Monitoring" description="Each OCT measurement updates a local-linear-trend Kalman filter. Noisy or low-signal scans are down-weighted; gaps widen the confidence band." actions={<Segmented label="Eye" value={eye} onChange={setEye} options={[{ value: "OD", label: "OD · right" }, { value: "OS", label: "OS · left" }]} />} />
      <div className="grid gap-4 xl:grid-cols-4">
        <Panel className="xl:col-span-3" eyebrow={`${eye} · RNFL µm`} title="Estimate, measurements and 95% CI">
          <RnflChart eye={eye} points={k} baseline={data.astronaut.baseline[eye]} fromDay={from} height={340} />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span><span className={eye === "OD" ? "text-od" : "text-os"}>━</span> Kalman estimate</span><span>● OCT measurement</span><span className="text-warning">◆ low-quality scan</span><span>▒ 95% confidence band</span>
          </div>
        </Panel>
        <div className="grid gap-4">
          <Panel eyebrow="Current estimate"><p className="font-display text-4xl font-semibold tabular-nums">{last.est.toFixed(1)}<span className="ml-1 text-sm text-muted-foreground">µm</span></p><p className="mt-1 text-sm text-muted-foreground">95% CI {last.lo.toFixed(1)} – {last.hi.toFixed(1)}</p></Panel>
          <Panel eyebrow="Trend"><p className={`font-display text-3xl font-semibold tabular-nums ${last.slope * 30 > 0.5 ? "text-warning" : ""}`}>{last.slope * 30 >= 0 ? "+" : ""}{(last.slope * 30).toFixed(2)}<span className="ml-1 text-sm text-muted-foreground">µm / 30 d</span></p></Panel>
          <Panel eyebrow="Δ from baseline"><p className={`font-display text-3xl font-semibold tabular-nums ${last.delta > RNFL_WARN ? "text-warning" : "text-success"}`}>{last.delta >= 0 ? "+" : ""}{last.delta.toFixed(1)} µm</p></Panel>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel eyebrow="Both eyes" title="Deviation from pre-flight baseline">
          <div className="h-60"><ResponsiveContainer><LineChart data={delta} margin={{ left: -12, right: 8 }}>
            <CartesianGrid stroke="oklch(0.85 0.08 220 / 0.07)" vertical={false} /><XAxis dataKey="day" {...axisProps} tickFormatter={(d) => `D${d}`} minTickGap={24} /><YAxis {...axisProps} unit=" µm" width={60} />
            <Tooltip {...tooltipStyle} labelFormatter={(d) => `Mission day ${d}`} /><ReferenceLine y={RNFL_WARN} stroke="var(--warning)" strokeDasharray="3 5" />
            <Line dataKey="OD" stroke="var(--chart-od)" dot={false} strokeWidth={2} isAnimationActive={false} /><Line dataKey="OS" stroke="var(--chart-os)" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel eyebrow={`${eye} · recent updates`} title="Filter log">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="eyebrow text-left"><th className="py-2 font-normal">Day</th><th className="font-normal">Measured</th><th className="font-normal">Estimate</th><th className="font-normal">±95%</th><th className="font-normal">Quality</th></tr></thead>
            <tbody>{table.map((p) => (<tr key={p.day} className="border-t border-border/60 font-mono text-xs"><td className="py-2">D{p.day}</td><td>{p.obs?.toFixed(1)}</td><td>{p.est.toFixed(1)}</td><td>{(1.96 * p.sd).toFixed(2)}</td><td className={p.quality === "noisy" ? "text-warning" : "text-success"}>{p.quality}</td></tr>))}</tbody>
          </table></div>
        </Panel>
      </div>
    </>
  );
}
