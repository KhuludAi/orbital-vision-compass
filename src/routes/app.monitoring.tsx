
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Panel,
  PageHeader,
  Segmented,
  axisProps,
  tooltipStyle,
} from "@/components/sans/ui";
import { RnflChart } from "@/components/sans/RnflChart";
import { useDataset } from "@/lib/sans/store";
import { RNFL_WARN } from "@/lib/sans/simulate";
import { pageHead } from "@/lib/sans/head";
import type { Eye } from "@/lib/sans/types";

export const Route = createFileRoute("/app/monitoring")({
  head: () =>
    pageHead(
      "SANS Monitoring",
      "Kalman-filtered per-eye RNFL trends with uncertainty bands and deviation from baseline."
    ),
  component: Monitoring,
});

type EyeStatus = {
  baseline_rnfl_um: number | null;
  estimated_rnfl_um: number | null;
  uncertainty_um: number;
  last_valid_scan: string | null;
  history: Array<{
    eye: string;
    timestamp: string;
    accepted: boolean;
    flags: string[];
    raw_rnfl_um: number | null;
    estimated_rnfl_um: number | null;
    change_from_baseline_um: number | null;
    uncertainty_um: number;
  }>;
};

type SansStatus = {
  astronaut_id: string;
  eyes: {
    R: EyeStatus;
    L: EyeStatus;
  };
};

function LiveSansPanel() {
  const [status, setStatus] = useState<SansStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/sans/sans/status/ASTRO001"
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result: SansStatus = await response.json();
      setStatus(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to SANS API"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Panel
      eyebrow="Backend-connected analysis"
      title="Live SANS AI — ASTRO001"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          API-backed RNFL estimates · Research demo data
        </p>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh Analysis"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {!status && !loading && !error && (
        <p className="text-sm text-muted-foreground">
          No SANS measurements available.
        </p>
      )}

      {status && (
        <div className="grid gap-4 md:grid-cols-2">
          {(["R", "L"] as const).map((eye) => {
            const item = status.eyes[eye];
            const latest =
              [...item.history].reverse().find((p) => p.accepted) ??
              item.history.at(-1);

            const change = latest?.change_from_baseline_um;

            return (
              <div
                key={eye}
                className="rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">
                    {eye === "R"
                      ? "Right Eye (OD)"
                      : "Left Eye (OS)"}
                  </h3>

                  <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                    {item.last_valid_scan
                      ? "Measurement available"
                      : "Baseline needed"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Estimated RNFL
                    </p>
                    <p className="font-display text-3xl font-semibold tabular-nums">
                      {item.estimated_rnfl_um == null
                        ? "—"
                        : item.estimated_rnfl_um.toFixed(2)}
                      {item.estimated_rnfl_um != null && (
                        <span className="ml-1 text-sm text-muted-foreground">
                          µm
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Baseline
                      </p>
                      <p className="font-medium tabular-nums">
                        {item.baseline_rnfl_um == null
                          ? "Not available"
                          : `${item.baseline_rnfl_um.toFixed(2)} µm`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Uncertainty
                      </p>
                      <p className="font-medium tabular-nums">
                        {item.uncertainty_um.toFixed(2)} µm
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Change from baseline
                      </p>
                      <p
                        className={`font-medium tabular-nums ${
                          change != null && change > RNFL_WARN
                            ? "text-warning"
                            : ""
                        }`}
                      >
                        {change == null
                          ? "Not available"
                          : `${change >= 0 ? "+" : ""}${change.toFixed(2)} µm`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Measurement history
                      </p>
                      <p className="font-medium">
                        {item.history.length} records
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-3 text-xs">
                    <p className="text-muted-foreground">
                      Last valid scan
                    </p>
                    <p className="mt-1">
                      {item.last_valid_scan
                        ? new Date(
                            item.last_valid_scan
                          ).toLocaleString()
                        : "No valid scan"}
                    </p>
                  </div>

                  <div className="text-xs">
                    <p className="text-muted-foreground">
                      Measurement integrity
                    </p>
                    <p className="mt-1">
                      {!latest
                        ? "No measurements"
                        : !latest.accepted
                        ? "Rejected"
                        : latest.flags.length
                        ? latest.flags.join(", ")
                        : "Accepted — no flags"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function Monitoring() {
  const { data, range } = useDataset();
  const [eye, setEye] = useState<Eye>("OD");

  const from = data.currentDay - range;
  const k = data.kalman[eye];
  const last = k.at(-1);

  if (!last) {
    throw new Error(`No Kalman estimates available for ${eye}`);
  }

  const leftByDay = new Map(
    data.kalman.OS.map((p) => [p.day, p.delta])
  );

  const delta = data.kalman.OD
    .filter((p) => p.day >= from)
    .map((p) => ({
      day: p.day,
      OD: +p.delta.toFixed(2),
      OS: leftByDay.has(p.day)
        ? Number(leftByDay.get(p.day)?.toFixed(2))
        : null,
    }));

  const table = k
    .filter((p) => p.obs != null && p.day >= from)
    .slice(-10)
    .reverse();

  return (
    <>
      <PageHeader
        eyebrow="Longitudinal surveillance"
        title="SANS Monitoring"
        description="Track longitudinal RNFL changes, measurement integrity, and uncertainty for each eye."
        actions={
          <Segmented
            label="Eye"
            value={eye}
            onChange={setEye}
            options={[
              { value: "OD", label: "OD · right" },
              { value: "OS", label: "OS · left" },
            ]}
          />
        }
      />

      <div className="mb-4">
        <LiveSansPanel />
      </div>

      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Simulated Mission Data — Longitudinal Visualization
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Panel
          className="xl:col-span-3"
          eyebrow={`${eye} · RNFL µm`}
          title="Estimate, measurements and 95% CI"
        >
          <RnflChart
            eye={eye}
            points={k}
            baseline={data.astronaut.baseline[eye]}
            fromDay={from}
            height={340}
          />

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              <span
                className={
                  eye === "OD" ? "text-od" : "text-os"
                }
              >
                ━
              </span>{" "}
              Kalman estimate
            </span>
            <span>● OCT measurement</span>
            <span className="text-warning">
              ◆ low-quality scan
            </span>
            <span>▒ 95% confidence band</span>
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel eyebrow="Current estimate">
            <p className="font-display text-4xl font-semibold tabular-nums">
              {last.est.toFixed(1)}
              <span className="ml-1 text-sm text-muted-foreground">
                µm
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              95% CI {last.lo.toFixed(1)} –{" "}
              {last.hi.toFixed(1)}
            </p>
          </Panel>

          <Panel eyebrow="Trend">
            <p
              className={`font-display text-3xl font-semibold tabular-nums ${
                last.slope * 30 > 0.5
                  ? "text-warning"
                  : ""
              }`}
            >
              {last.slope * 30 >= 0 ? "+" : ""}
              {(last.slope * 30).toFixed(2)}
              <span className="ml-1 text-sm text-muted-foreground">
                µm / 30 d
              </span>
            </p>
          </Panel>

          <Panel eyebrow="Δ from baseline">
            <p
              className={`font-display text-3xl font-semibold tabular-nums ${
                last.delta > RNFL_WARN
                  ? "text-warning"
                  : "text-success"
              }`}
            >
              {last.delta >= 0 ? "+" : ""}
              {last.delta.toFixed(1)} µm
            </p>
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          eyebrow="Both eyes"
          title="Deviation from pre-flight baseline"
        >
          <div className="h-60">
            <ResponsiveContainer>
              <LineChart
                data={delta}
                margin={{ left: -12, right: 8 }}
              >
                <CartesianGrid
                  stroke="oklch(0.85 0.08 220 / 0.07)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  {...axisProps}
                  tickFormatter={(d) => `D${d}`}
                  minTickGap={24}
                />
                <YAxis
                  {...axisProps}
                  unit=" µm"
                  width={60}
                />
                <Tooltip
                  {...tooltipStyle}
                  labelFormatter={(d) => `Mission day ${d}`}
                />
                <ReferenceLine
                  y={RNFL_WARN}
                  stroke="var(--warning)"
                  strokeDasharray="3 5"
                />
                <Line
                  dataKey="OD"
                  stroke="var(--chart-od)"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="OS"
                  stroke="var(--chart-os)"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          eyebrow={`${eye} · recent updates`}
          title="Filter log"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="eyebrow text-left">
                  <th className="py-2 font-normal">Day</th>
                  <th className="font-normal">Measured</th>
                  <th className="font-normal">Estimate</th>
                  <th className="font-normal">±95%</th>
                  <th className="font-normal">Quality</th>
                </tr>
              </thead>
              <tbody>
                {table.map((p) => (
                  <tr
                    key={p.day}
                    className="border-t border-border/60 font-mono text-xs"
                  >
                    <td className="py-2">D{p.day}</td>
                    <td>{p.obs?.toFixed(1)}</td>
                    <td>{p.est.toFixed(1)}</td>
                    <td>{(1.96 * p.sd).toFixed(2)}</td>
                    <td
                      className={
                        p.quality === "noisy"
                          ? "text-warning"
                          : "text-success"
                      }
                    >
                      {p.quality}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
