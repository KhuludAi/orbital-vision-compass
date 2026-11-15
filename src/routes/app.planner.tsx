
import { can, useWorkspace } from "@/lib/sans/workspace";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import {
  EmptyState,
  Panel,
  PageHeader,
  axisProps,
  tooltipStyle,
} from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { MINUTES_PER_SCAN, planScans } from "@/lib/sans/planner";
import { pageHead } from "@/lib/sans/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/planner")({
  head: () =>
    pageHead(
      "Adaptive Scan Planner",
      "Uncertainty- and risk-weighted OCT scheduling under a crew-time budget."
    ),
  component: Planner,
});

type ScheduleRecommendation = {
  eye: "R" | "L";
  priority: string;
  next_scan_days: number;
  recommended_date: string;
  change_from_baseline_um: number | null;
  uncertainty_um: number;
  days_since_valid_scan: number | null;
  reason: string;
};

type ScheduleResponse = {
  astronaut_id: string;
  generated_at: string;
  recommendations: ScheduleRecommendation[];
};

function LiveSchedulePanel() {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/sans/sans/schedule/ASTRO001"
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result: ScheduleResponse = await response.json();
      setSchedule(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to scheduling API"
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
      eyebrow="Backend-connected scheduling"
      title="Live Adaptive Scan Recommendations — ASTRO001"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          API-generated recommendations · Research demo data
        </p>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh Schedule"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {schedule && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {schedule.recommendations.map((rec) => {
              const high = rec.priority.toUpperCase() === "HIGH";

              return (
                <div
                  key={rec.eye}
                  className="rounded-xl border border-border bg-background/40 p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      {rec.eye === "R"
                        ? "Right Eye (OD)"
                        : "Left Eye (OS)"}
                    </h3>

                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        high
                          ? "border-warning/40 bg-warning/10 text-warning"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {rec.priority} PRIORITY
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground">
                      Recommended next scan
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {rec.next_scan_days === 0
                        ? "Today"
                        : `In ${rec.next_scan_days} days`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rec.recommended_date}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Uncertainty
                      </p>
                      <p className="font-medium tabular-nums">
                        {rec.uncertainty_um.toFixed(2)} µm
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Baseline change
                      </p>
                      <p className="font-medium tabular-nums">
                        {rec.change_from_baseline_um == null
                          ? "Not available"
                          : `${rec.change_from_baseline_um >= 0 ? "+" : ""}${rec.change_from_baseline_um.toFixed(2)} µm`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Days since valid scan
                      </p>
                      <p className="font-medium">
                        {rec.days_since_valid_scan == null
                          ? "No valid scan"
                          : rec.days_since_valid_scan.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-border/60 pt-3">
                    <p className="text-xs text-muted-foreground">
                      Scheduling rationale
                    </p>
                    <p className="mt-1 text-sm">
                      {rec.reason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Generated:{" "}
            {new Date(schedule.generated_at).toLocaleString()}
            {" · "}
            Recommendations are based on the current stored
            measurements and model uncertainty.
          </p>
        </>
      )}

      {!schedule && !loading && !error && (
        <p className="text-sm text-muted-foreground">
          No scheduling recommendations available.
        </p>
      )}
    </Panel>
  );
}

function Planner() {
  const { data, budget, setBudget } = useDataset();
  const canManage = can(
    useWorkspace().role,
    "manageSchedule"
  );

  const recs = useMemo(
    () => planScans(data, budget),
    [data, budget]
  );

  const days = Array.from(
    { length: 14 },
    (_, i) => data.currentDay + 1 + i
  );

  const used = recs.reduce(
    (a, r) => a + r.minutes,
    0
  );

  return (
    <>
      <PageHeader
        eyebrow="Value-of-information scheduling"
        title="Adaptive Scan Planner"
        description={`Greedy allocation of ${MINUTES_PER_SCAN}-minute OCT sessions that maximise risk-weighted reduction in estimator uncertainty over the next 14 days.`}
      />

      <div className="mb-4">
        <LiveSchedulePanel />
      </div>

      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Simulated Mission Data — Budget-Constrained Scheduling
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel eyebrow="Constraint" title="Crew-time budget">
          <p className="font-display text-4xl font-semibold tabular-nums">
            {budget}
            <span className="ml-1 text-sm text-muted-foreground">
              min / 14 d
            </span>
          </p>

          <Slider
            className="mt-5"
            disabled={!canManage}
            value={[budget]}
            min={0}
            max={180}
            step={12}
            onValueChange={([v]) => {
              if (v !== undefined) setBudget(v);
            }}
            aria-label="Crew time budget in minutes"
          />

          <div className="mt-4 h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-cta transition-all"
              style={{
                width: `${
                  budget ? (used / budget) * 100 : 0
                }%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {used} min allocated · {budget - used} min unused
          </p>

          {!canManage && (
            <p className="mt-2 text-xs text-muted-foreground">
              Read-only: only mission monitors can change the
              crew-time budget.
            </p>
          )}
        </Panel>

        <Panel
          className="lg:col-span-2"
          eyebrow="14-day schedule"
          title="Recommended sessions"
        >
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[640px] gap-1"
              style={{
                gridTemplateColumns:
                  "48px repeat(14, minmax(0,1fr))",
              }}
            >
              <div />

              {days.map((d) => (
                <div
                  key={d}
                  className="text-center font-mono text-[10px] text-muted-foreground"
                >
                  D{d}
                </div>
              ))}

              {(["OD", "OS"] as const).map((e) => (
                <Fragment key={e}>
                  <div
                    className={cn(
                      "self-center font-mono text-xs",
                      e === "OD" ? "text-od" : "text-os"
                    )}
                  >
                    {e}
                  </div>

                  {days.map((d) => {
                    const r = recs.find(
                      (x) => x.eye === e && x.day === d
                    );

                    return (
                      <div
                        key={e + d}
                        title={r?.rationale}
                        className={cn(
                          "h-10 rounded-md border transition-all",
                          r
                            ? e === "OD"
                              ? "border-od/60 bg-od/25 shadow-glow"
                              : "border-os/60 bg-os/25"
                            : "border-border/50 bg-background/30"
                        )}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel eyebrow="Rationale" title="Session queue">
          {recs.length ? (
            <ol className="space-y-2">
              {recs.map((r, i) => (
                <li
                  key={r.eye + r.day}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                    {i + 1}
                  </span>

                  <div className="flex-1">
                    <p className="text-sm">
                      <span
                        className={
                          r.eye === "OD"
                            ? "text-od"
                            : "text-os"
                        }
                      >
                        {r.eye}
                      </span>
                      {" · "}Mission day {r.day}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {r.rationale}
                    </p>
                  </div>

                  <span className="font-mono text-xs text-muted-foreground">
                    ±{(1.96 * r.sdBefore).toFixed(1)}
                    {" → "}
                    ±{(1.96 * r.sdAfter).toFixed(1)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="Budget too small"
              body={`Increase the budget to at least ${MINUTES_PER_SCAN} minutes to schedule a session.`}
            />
          )}
        </Panel>

        <Panel
          eyebrow="Expected benefit"
          title="Uncertainty reduction per session (µm, 95%)"
        >
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart
                data={recs.map((r) => ({
                  name: `${r.eye} D${r.day}`,
                  gain: +(
                    1.96 *
                    (r.sdBefore - r.sdAfter)
                  ).toFixed(2),
                }))}
                margin={{ left: -16 }}
              >
                <CartesianGrid
                  stroke="oklch(0.85 0.08 220 / 0.07)"
                  vertical={false}
                />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip
                  {...tooltipStyle}
                  cursor={{
                    fill: "oklch(0.84 0.13 205 / 0.06)",
                  }}
                />
                <Bar
                  dataKey="gain"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}
