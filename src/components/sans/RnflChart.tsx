import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import type { Eye, KalmanPoint, Quality } from "@/lib/sans/types";
import { RNFL_WARN } from "@/lib/sans/simulate";
import { EYE } from "@/lib/sans/eyes";
import { QUALITY, Swatch, Term, axisProps, gridStroke } from "./ui";

type Row = { day: number; est: number; band: [number, number]; obs: number | null; noisy: number | null; quality?: Quality | undefined };

function ChartTooltip({ active, payload, eye, baseline }: { active?: boolean; payload?: { payload: Row }[]; eye: Eye; baseline: number }) {
  if (!active || !payload?.length) return null;
  const r = payload[0]?.payload;
  if (!r) return null;
  return (
    <div className="min-w-[200px] rounded-lg border border-border bg-popover/95 p-3 text-xs shadow-lg">
      <p className={`font-display text-[11px] font-semibold uppercase tracking-wider ${EYE[eye].text}`}>{EYE[eye].upper} · Mission day {r.day}</p>
      <dl className="mt-2 space-y-1 font-mono">
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Kalman estimate</dt><dd>{r.est.toFixed(1)} µm</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">95% interval</dt><dd>{r.band[0].toFixed(1)}–{r.band[1].toFixed(1)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Change vs baseline</dt><dd>{r.est - baseline >= 0 ? "+" : ""}{(r.est - baseline).toFixed(1)} µm</dd></div>
        {r.obs != null && <div className="flex justify-between gap-4 border-t border-border pt-1"><dt className="text-muted-foreground">Raw OCT reading</dt><dd>{r.obs.toFixed(1)} µm</dd></div>}
        {r.quality && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Scan quality</dt><dd>{QUALITY[r.quality].label}</dd></div>}
      </dl>
    </div>
  );
}

export function RnflLegend({ eye }: { eye: Eye }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      <Swatch kind="line" color={EYE[eye].color} label={<Term k="Kalman">Kalman estimate</Term>} />
      <Swatch kind="band" color={EYE[eye].color} label={<Term k="CI">95% interval</Term>} />
      <Swatch kind="dot" color="oklch(0.97 0.01 220)" label={<Term k="Raw">Raw OCT reading</Term>} />
      <Swatch kind="diamond" color="var(--warning)" label="Noisy reading" />
      <Swatch kind="dash" color="oklch(0.72 0.03 235)" label={<Term k="Baseline">Pre-flight baseline</Term>} />
    </div>
  );
}

export function RnflChart({ eye, points, baseline, fromDay, height = 300, legend = false }: { eye: Eye; points: KalmanPoint[]; baseline: number; fromDay: number; height?: number; legend?: boolean }) {
  const data: Row[] = points.filter((p) => p.day >= fromDay).map((p) => ({ day: p.day, est: +p.est.toFixed(2), band: [+p.lo.toFixed(2), +p.hi.toFixed(2)], obs: p.obs, noisy: p.quality === "noisy" ? p.obs : null, quality: p.quality }));
  const color = EYE[eye].color;
  return (
    <div>
      <div style={{ height }} className="w-full" role="img" aria-label={`${EYE[eye].label} RNFL thickness: Kalman estimate, 95% interval and raw OCT readings`}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`band-${eye}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0.14} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis dataKey="day" {...axisProps} tickFormatter={(d) => `D${d}`} minTickGap={28} />
            <YAxis {...axisProps} domain={["dataMin - 2", "dataMax + 2"]} tickFormatter={(v) => Number(v).toFixed(0)} width={44} label={{ value: "µm", angle: 0, position: "insideTopLeft", offset: 0, dy: -8, fill: "oklch(0.72 0.03 235)", fontSize: 10 }} />
            <Tooltip content={<ChartTooltip eye={eye} baseline={baseline} />} cursor={{ stroke: "oklch(0.85 0.08 220 / 0.25)" }} />
            <ReferenceLine y={baseline} stroke="oklch(0.72 0.03 235 / 0.7)" strokeDasharray="4 4" label={{ value: `Baseline ${baseline.toFixed(1)}`, fill: "oklch(0.72 0.03 235)", fontSize: 10, position: "insideBottomRight" }} />
            <ReferenceLine y={baseline + RNFL_WARN} stroke="var(--warning)" strokeOpacity={0.55} strokeDasharray="2 6" label={{ value: `+${RNFL_WARN} µm model threshold`, fill: "var(--warning)", fontSize: 10, position: "insideTopRight" }} />
            <Area dataKey="band" stroke={color} strokeOpacity={0.25} strokeWidth={1} fill={`url(#band-${eye})`} isAnimationActive={false} activeDot={false} />
            <Line dataKey="est" stroke={color} strokeWidth={2.4} dot={false} isAnimationActive={false} />
            <Scatter dataKey="obs" fill="oklch(0.97 0.01 220)" shape="circle" isAnimationActive={false} />
            <Scatter dataKey="noisy" fill="var(--warning)" shape="diamond" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {legend && <RnflLegend eye={eye} />}
    </div>
  );
}
