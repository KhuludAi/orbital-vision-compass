
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  HeartPulse,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";

import {
  Panel,
  PageHeader,
  Stat,
  axisProps,
  tooltipStyle,
} from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { pageHead } from "@/lib/sans/head";

export const Route = createFileRoute("/app/vitals")({
  head: () =>
    pageHead(
      "Vital Signs",
      "Physiological monitoring, data-quality analysis and trained AI inference."
    ),
  component: Vitals,
});

const API = "/api/vitals";

const grid = (
  <CartesianGrid
    stroke="oklch(0.85 0.08 220 / 0.07)"
    vertical={false}
  />
);

type LiveReading = {
  id?: number;
  astronaut_id?: string;
  vital: string;
  value: number;
  timestamp?: string;
  status?: {
    state?: string;
    [key: string]: unknown;
  };
};

type TrendResult = {
  astronaut_id: string;
  vital: string;
  analysis: Record<string, unknown>;
  data_quality: Record<string, unknown>;
  alert_details: Record<string, unknown>;
};

type StressSample = {
  true_condition: string;
  features: Record<string, number>;
};

type StressResult = {
  prediction: string;
  probabilities: Record<string, number>;
};

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API}${path}`, options);

  if (!response.ok) {
    let message = `Request failed: HTTP ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (body.detail) {
        message = JSON.stringify(body.detail);
      }
    } catch {
      // Keep HTTP error.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function pretty(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function LiveVitals({ astronautId }: { astronautId: string }) {
  const [readings, setReadings] = useState<LiveReading[]>([]);
  const [trends, setTrends] = useState<TrendResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLive() {
    setLoading(true);
    setError(null);

    try {
      const latest = await apiRequest<LiveReading[]>(
        `/latest/${encodeURIComponent(astronautId)}`
      );

      const vitals = ["hr", "spo2", "glucose", "hrv"];

      const results = await Promise.allSettled(
        vitals.map((vital) =>
          apiRequest<TrendResult>(
            `/trends/${encodeURIComponent(astronautId)}/${vital}`
          )
        )
      );

      setReadings(latest);
      setTrends(
        results
          .filter(
            (r): r is PromiseFulfilledResult<TrendResult> =>
              r.status === "fulfilled"
          )
          .map((r) => r.value)
      );
      setLoaded(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Connection failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel
      eyebrow="Connected Backend · SQLite"
      title="Live Physiological Data"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted-foreground">
            Retrieve recorded measurements and quality-aware trend
            analysis from the running SANSIGHT Vitals API.
          </p>

          <button
            type="button"
            onClick={loadLive}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-cta px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {loading ? "Loading..." : "Fetch Live Data"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Astronaut: {astronautId}
          </span>
          <span>Source: Local SQLite database</span>
        </div>

        {error && (
          <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loaded && (
          <>
            {readings.length === 0 ? (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                The API is connected, but no recorded readings
                were found for {astronautId}. The simulated
                charts below remain separate.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {readings.map((reading, index) => (
                  <div
                    key={`${reading.vital}-${index}`}
                    className="rounded-xl border border-border/70 bg-muted/20 p-4"
                  >
                    <p className="eyebrow">
                      {reading.vital.toUpperCase()}
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                      {reading.value}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Status: {reading.status?.state ?? "Not classified"}
                    </p>
                    {reading.timestamp && (
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {reading.timestamp}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {trends.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Data Integrity & Trend Analysis
                </h3>

                <div className="grid gap-3 lg:grid-cols-2">
                  {trends.map((trend) => (
                    <div
                      key={trend.vital}
                      className="rounded-xl border border-border/70 bg-background/40 p-4"
                    >
                      <p className="mb-3 font-semibold uppercase">
                        {trend.vital}
                      </p>

                      <p className="mb-2 text-xs font-medium text-primary">
                        Trend
                      </p>

                      <div className="space-y-1">
                        {Object.entries(trend.analysis).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex flex-wrap justify-between gap-2 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {key.replaceAll("_", " ")}
                              </span>
                              <span className="max-w-full break-all text-right">
                                {pretty(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-4 border-t border-border/60 pt-3">
                        <p className="mb-2 text-xs font-medium text-primary">
                          Data Quality
                        </p>

                        {Object.entries(trend.data_quality).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex flex-wrap justify-between gap-2 py-1 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {key.replaceAll("_", " ")}
                              </span>
                              <span className="max-w-full break-all text-right">
                                {pretty(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-3 border-t border-border/60 pt-3">
                        <p className="mb-2 text-xs font-medium text-primary">
                          Alert Assessment
                        </p>

                        {Object.entries(trend.alert_details).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex flex-wrap justify-between gap-2 py-1 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {key.replaceAll("_", " ")}
                              </span>
                              <span className="max-w-full break-all text-right">
                                {pretty(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}

function StressAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StressResult | null>(null);
  const [sample, setSample] = useState<StressSample | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runInference() {
    setLoading(true);
    setError(null);
    setResult(null);
    setSample(null);

    try {
      const testSample = await apiRequest<StressSample>(
        "/demo/stress-sample"
      );

      const prediction = await apiRequest<StressResult>(
        "/predict/stress",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testSample.features),
        }
      );

      setSample(testSample);
      setResult(prediction);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Inference failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel
      eyebrow="Trained Machine Learning"
      title="HRV Stress Model"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Run the trained heart-rate variability model on
              a test sample, when the original HRV test
              dataset is available locally.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runInference}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cta px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          {loading ? "Running Model..." : "Run Trained HRV Model"}
        </button>

        {error && (
          <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Model inference completed
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                <p className="eyebrow">AI PREDICTION</p>
                <p className="mt-2 break-words font-display text-xl font-semibold">
                  {result.prediction}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 p-4">
                <p className="eyebrow">TEST SAMPLE LABEL</p>
                <p className="mt-2 break-words font-display text-xl font-semibold">
                  {sample?.true_condition ?? "—"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 p-4">
              <h3 className="mb-4 text-sm font-semibold">
                Class Probabilities
              </h3>

              <div className="space-y-4">
                {Object.entries(result.probabilities).map(
                  ([label, probability]) => (
                    <div key={label}>
                      <div className="mb-2 flex justify-between gap-3 text-sm">
                        <span>{label}</span>
                        <span className="font-mono">
                          {(probability * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, probability * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Research demonstration on an HRV test sample.
              Not a clinical assessment of an astronaut.
            </p>
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          The model requires engineered HRV features,
          not just a single heart-rate measurement.
          If the original test CSV files are unavailable,
          the API will report that limitation instead of
          generating a simulated prediction.
        </p>
      </div>
    </Panel>
  );
}



type GlucoseResult = {
  estimated_glucose_mg_dl: number;
  status?: { state?: string };
  note?: string;
};

const glucoseFields = [
  { key: "AGE", label: "Age (years)" },
  { key: "WEIGHT", label: "Weight (kg)" },
  { key: "SKIN_COLOR", label: "Skin color (dataset numeric code)" },
  { key: "NIR_Reading", label: "NIR sensor reading" },
  { key: "HEARTRATE", label: "Heart rate (bpm)" },
  { key: "HEIGHT", label: "Height (cm)" },
  { key: "LAST_EATEN", label: "Last eaten (dataset numeric value)" },
  { key: "HR_IR", label: "HR infrared reading" },
] as const;

function GlucoseAI() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [gender, setGender] = useState("M");
  const [diabetic, setDiabetic] = useState("N");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GlucoseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function predict(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const payload: Record<string, number | string> = {
      GENDER: gender,
      DIABETIC: diabetic,
    };

    for (const field of glucoseFields) {
      const raw = values[field.key]?.trim();
      if (!raw) {
        setError(`Enter ${field.label} before running the model.`);
        return;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        setError(`Invalid value for ${field.label}.`);
        return;
      }
      payload[field.key] = parsed;
    }

    setLoading(true);
    try {
      const prediction = await apiRequest<GlucoseResult>("/predict/glucose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Glucose inference failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel eyebrow="Trained Machine Learning · API Connected" title="Glucose Estimation AI">
      <form onSubmit={predict} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Run the trained glucose regression model using its required input features.
          Enter research or sensor measurements; no values are generated automatically.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {glucoseFields.map((field) => (
            <label key={field.key} className="space-y-1.5 text-sm">
              <span className="block text-xs text-muted-foreground">{field.label}</span>
              <input
                type="number"
                step="any"
                required
                value={values[field.key] ?? ""}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))}
                placeholder="Enter value"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
              />
            </label>
          ))}
          <label className="space-y-1.5 text-sm">
            <span className="block text-xs text-muted-foreground">Gender (dataset encoding)</span>
            <select value={gender} onChange={(event) => setGender(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="block text-xs text-muted-foreground">Diabetic (dataset encoding)</span>
            <select value={diabetic} onChange={(event) => setDiabetic(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
              <option value="N">N</option>
              <option value="Y">Y</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cta px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          {loading ? "Running Glucose Model..." : "Run Trained Glucose Model"}
        </button>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {result && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
            <p className="eyebrow">AI ESTIMATED GLUCOSE</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
              {result.estimated_glucose_mg_dl.toFixed(1)}
              <span className="ml-2 text-sm text-muted-foreground">mg/dL</span>
            </p>
            {result.status?.state && <p className="mt-2 text-sm">Model status: {result.status.state}</p>}
            {result.note && <p className="mt-3 text-xs text-muted-foreground">{result.note}</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Research demonstration only. Input codes must match the original training dataset.
          The model's reported average error is approximately 39 mg/dL; do not use for medical decisions.
        </p>
      </form>
    </Panel>
  );
}

function Vitals() {
  const { data, range } = useDataset();

  const v = data.vitals.filter(
    (p) => p.day >= data.currentDay - range
  );

  const last = data.vitals.at(-1)!;

  const labs = data.vitals.filter(
    (p) => p.glucose != null
  );

  const xa = (
    <XAxis
      dataKey="day"
      {...axisProps}
      tickFormatter={(d) => `D${d}`}
      minTickGap={24}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Physiological context"
        title="Vital Signs"
        description="Physiological monitoring, data integrity and trained machine-learning models. Simulated mission measurements are clearly separated from recorded API data."
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <HeartPulse className="h-4 w-4 text-primary" />
        <span>
          Research prototype · Not for clinical diagnosis
        </span>
      </div>

      <LiveVitals astronautId={data.astronaut.id} />

      <StressAI />

      <GlucoseAI />

      <div className="space-y-4">
        <div>
          <p className="eyebrow">
            SIMULATED MISSION DATA
          </p>

          <h2 className="mt-1 font-display text-xl font-semibold">
            Physiological Trends
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Illustrative daily averages from simulated
            wearables, cuff measurements and periodic labs.
            These values are not real astronaut readings.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Heart rate"
            value={last.hr}
            unit="bpm"
            sub="wearable PPG (sim.)"
          />

          <Stat
            label="Blood pressure"
            value={`${last.sys}/${last.dia}`}
            unit="mmHg"
            sub="cuff (sim.)"
            tone={last.sys >= 132 ? "warning" : "default"}
          />

          <Stat
            label="SpO₂"
            value={last.spo2}
            unit="%"
            sub="pulse oximetry (sim.)"
          />

          <Stat
            label="Glucose"
            value={labs.at(-1)?.glucose ?? "—"}
            unit="mg/dL"
            sub={`lab draw · D${labs.at(-1)?.day ?? "—"}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel eyebrow="bpm" title="Heart rate">
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart
                  data={v}
                  margin={{ left: -16 }}
                >
                  <defs>
                    <linearGradient
                      id="hrv"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--chart-od)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--chart-od)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  {grid}
                  {xa}

                  <YAxis
                    {...axisProps}
                    domain={[
                      "dataMin - 4",
                      "dataMax + 4",
                    ]}
                  />

                  <Tooltip {...tooltipStyle} />

                  <Area
                    dataKey="hr"
                    stroke="var(--chart-od)"
                    fill="url(#hrv)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel eyebrow="mmHg" title="Blood pressure">
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart
                  data={v}
                  margin={{ left: -16 }}
                >
                  {grid}
                  {xa}

                  <YAxis
                    {...axisProps}
                    domain={[60, 145]}
                  />

                  <Tooltip {...tooltipStyle} />

                  <Line
                    dataKey="sys"
                    stroke="var(--warning)"
                    dot={false}
                    isAnimationActive={false}
                    name="Systolic"
                  />

                  <Line
                    dataKey="dia"
                    stroke="var(--chart-os)"
                    dot={false}
                    isAnimationActive={false}
                    name="Diastolic"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel eyebrow="%" title="SpO₂">
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart
                  data={v}
                  margin={{ left: -16 }}
                >
                  {grid}
                  {xa}

                  <YAxis
                    {...axisProps}
                    domain={[94, 100]}
                  />

                  <Tooltip {...tooltipStyle} />

                  <Line
                    dataKey="spo2"
                    stroke="var(--chart-os)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            eyebrow="mg/dL · periodic lab samples"
            title="Glucose"
          >
            <div className="h-44">
              <ResponsiveContainer>
                <ScatterChart
                  margin={{ left: -16 }}
                >
                  {grid}

                  <XAxis
                    dataKey="day"
                    type="number"
                    {...axisProps}
                    tickFormatter={(d) => `D${d}`}
                  />

                  <YAxis
                    dataKey="glucose"
                    {...axisProps}
                    domain={[70, 120]}
                  />

                  <Tooltip {...tooltipStyle} />

                  <Scatter
                    data={labs}
                    fill="var(--primary)"
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-2 flex gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              Glucose comes from simulated monthly lab
              draws. Wrist wearables in this model do
              not measure glucose.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
