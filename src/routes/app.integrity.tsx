import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { EmptyState, Panel, PageHeader, QualityBadge, Segmented, Stat, axisProps, tooltipStyle } from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { pageHead } from "@/lib/sans/head";
import type { Quality } from "@/lib/sans/types";

export const Route = createFileRoute("/app/integrity")({
  head: () => pageHead("Data Integrity", "Missing, delayed and noisy OCT scans and their effect on estimate confidence."),
  component: Integrity,
});

function Integrity() {
  const { data } = useDataset();
  const [f, setF] = useState<"all" | Quality>("all");
  const count = (q: Quality) => data.scans.filter((s) => s.quality === q).length;
  const issues = data.scans.filter((s) => s.quality !== "good" && (f === "all" || s.quality === f));
  const pct = Math.round((count("good") / data.scans.length) * 100);
  return (
    <>
      <PageHeader eyebrow="Pipeline health" title="Data Integrity" description="Quality control flags feed directly into the estimator's measurement noise model." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Clean scans" value={pct} unit="%" tone={pct > 80 ? "success" : "warning"} />
        <Stat label="Missing" value={count("missing")} tone={count("missing") ? "critical" : "success"} />
        <Stat label="Delayed" value={count("delayed")} />
        <Stat label="Noisy / low SSI" value={count("noisy")} tone={count("noisy") ? "warning" : "success"} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel eyebrow="Signal strength index" title="Scan quality over mission">
          <div className="h-64"><ResponsiveContainer><ScatterChart margin={{ left: -16, right: 8 }}>
            <CartesianGrid stroke="oklch(0.85 0.08 220 / 0.07)" /><XAxis dataKey="day" type="number" {...axisProps} tickFormatter={(d) => `D${d}`} /><YAxis dataKey="signal" domain={[0, 10]} {...axisProps} />
            <Tooltip {...tooltipStyle} /><ReferenceLine y={6} stroke="var(--warning)" strokeDasharray="3 5" />
            <Scatter data={data.scans.filter((s) => s.eye === "OD")} fill="var(--chart-od)" name="OD" isAnimationActive={false} />
            <Scatter data={data.scans.filter((s) => s.eye === "OS")} fill="var(--chart-os)" name="OS" isAnimationActive={false} />
          </ScatterChart></ResponsiveContainer></div>
        </Panel>
        <Panel eyebrow="Issue log" title="Flagged scans" action={<Segmented label="Filter issues" value={f} onChange={setF} options={[{ value: "all", label: "All" }, { value: "missing", label: "Missing" }, { value: "delayed", label: "Delayed" }, { value: "noisy", label: "Noisy" }]} />}>
          {issues.length ? <div className="max-h-64 overflow-auto"><table className="w-full text-sm">
            <thead className="sticky top-0 bg-popover"><tr className="eyebrow text-left"><th className="py-2 font-normal">Scan ID</th><th className="font-normal">Eye</th><th className="font-normal">Flag</th><th className="font-normal">Impact</th></tr></thead>
            <tbody>{issues.map((s) => (<tr key={s.id} className="border-t border-border/50 text-xs"><td className="py-2 font-mono">{s.id}</td><td>{s.eye}</td><td><QualityBadge q={s.quality} /></td><td className="text-muted-foreground">{s.quality === "missing" ? "No update — CI widens" : s.quality === "noisy" ? `SSI ${s.signal}; ~9× less weight` : `+${s.delayDays} d gap`}</td></tr>))}</tbody>
          </table></div> : <EmptyState title="No issues" body="No scans match this filter." />}
        </Panel>
      </div>
    </>
  );
}
