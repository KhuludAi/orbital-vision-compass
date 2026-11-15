import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import { Panel, PageHeader, Stat, axisProps, tooltipStyle } from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { pageHead } from "@/lib/sans/head";

export const Route = createFileRoute("/app/vitals")({
  head: () => pageHead("Vital Signs", "Simulated heart rate, blood pressure and SpO₂ context alongside periodic lab glucose."),
  component: Vitals,
});

const grid = <CartesianGrid stroke="oklch(0.85 0.08 220 / 0.07)" vertical={false} />;

function Vitals() {
  const { data, range } = useDataset();
  const v = data.vitals.filter((p) => p.day >= data.currentDay - range);
  const last = data.vitals.at(-1)!;
  const labs = data.vitals.filter((p) => p.glucose != null);
  const xa = <XAxis dataKey="day" {...axisProps} tickFormatter={(d) => `D${d}`} minTickGap={24} />;
  return (
    <>
      <PageHeader eyebrow="Physiological context" title="Vital Signs" description="Daily averages from simulated wearable and cuff measurements. Shown as context for fluid-shift physiology — not used for SANS diagnosis." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Heart rate" value={last.hr} unit="bpm" sub="wearable PPG (sim.)" />
        <Stat label="Blood pressure" value={`${last.sys}/${last.dia}`} unit="mmHg" sub="cuff (sim.)" tone={last.sys >= 132 ? "warning" : "default"} />
        <Stat label="SpO₂" value={last.spo2} unit="%" sub="pulse oximetry (sim.)" />
        <Stat label="Glucose" value={labs.at(-1)?.glucose ?? "—"} unit="mg/dL" sub={`lab draw · D${labs.at(-1)?.day}`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel eyebrow="bpm" title="Heart rate"><div className="h-56"><ResponsiveContainer><AreaChart data={v} margin={{ left: -16 }}><defs><linearGradient id="hrv" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--chart-od)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-od)" stopOpacity={0} /></linearGradient></defs>{grid}{xa}<YAxis {...axisProps} domain={["dataMin - 4", "dataMax + 4"]} /><Tooltip {...tooltipStyle} /><Area dataKey="hr" stroke="var(--chart-od)" fill="url(#hrv)" isAnimationActive={false} /></AreaChart></ResponsiveContainer></div></Panel>
        <Panel eyebrow="mmHg" title="Blood pressure"><div className="h-56"><ResponsiveContainer><LineChart data={v} margin={{ left: -16 }}>{grid}{xa}<YAxis {...axisProps} domain={[60, 145]} /><Tooltip {...tooltipStyle} /><Line dataKey="sys" stroke="var(--warning)" dot={false} isAnimationActive={false} name="Systolic" /><Line dataKey="dia" stroke="var(--chart-os)" dot={false} isAnimationActive={false} name="Diastolic" /></LineChart></ResponsiveContainer></div></Panel>
        <Panel eyebrow="%" title="SpO₂"><div className="h-56"><ResponsiveContainer><LineChart data={v} margin={{ left: -16 }}>{grid}{xa}<YAxis {...axisProps} domain={[94, 100]} /><Tooltip {...tooltipStyle} /><Line dataKey="spo2" stroke="var(--chart-os)" dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div></Panel>
        <Panel eyebrow="mg/dL · periodic lab samples" title="Glucose">
          <div className="h-44"><ResponsiveContainer><ScatterChart margin={{ left: -16 }}>{grid}<XAxis dataKey="day" type="number" {...axisProps} tickFormatter={(d) => `D${d}`} /><YAxis dataKey="glucose" {...axisProps} domain={[70, 120]} /><Tooltip {...tooltipStyle} /><Scatter data={labs} fill="var(--primary)" isAnimationActive={false} /></ScatterChart></ResponsiveContainer></div>
          <p className="mt-2 flex gap-2 text-xs text-muted-foreground"><Info className="h-4 w-4 shrink-0 text-primary" />Glucose comes from simulated monthly lab draws. Wrist wearables in this model do not measure glucose.</p>
        </Panel>
      </div>
    </>
  );
}
