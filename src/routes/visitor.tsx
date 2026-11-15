import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ChangeEvent } from "react";
import {
  Activity, ArrowRight, CalendarClock, Eye,
  ShieldCheck, ScanEye, UploadCloud, Loader2
} from "lucide-react";
import { Starfield } from "@/components/sans/Starfield";

export const Route = createFileRoute("/visitor")({
  component: Visitor,
});

type Tab = "oct" | "timeline" | "integrity" | "scheduler";
type EyeSide = "OD" | "OS";

type OctResult = {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  model?: string;
};

const technologies = [
  { id: "oct" as Tab, number: "01", title: "AI OCT Image Analysis", icon: ScanEye,
    body: "Run a real OCT image through the trained classification model." },
  { id: "timeline" as Tab, number: "02", title: "Longitudinal Eye Monitoring", icon: Eye,
    body: "Follow changes in each eye throughout a simulated mission." },
  { id: "integrity" as Tab, number: "03", title: "Data Integrity", icon: ShieldCheck,
    body: "Explore how missing or unreliable measurements affect monitoring." },
  { id: "scheduler" as Tab, number: "04", title: "Adaptive Scan Scheduling", icon: CalendarClock,
    body: "Compare scan priorities under a limited examination budget." },
];

const mission = [
  { day: 0, od: 98.4, os: 96.9 },
  { day: 30, od: 99.0, os: 97.3 },
  { day: 60, od: 99.3, os: 97.1 },
  { day: 90, od: 102.1, os: 98.5 },
  { day: 120, od: 104.5, os: 100.1 },
  { day: 150, od: 107.7, os: 102.0 },
  { day: 168, od: 108.5, os: 102.0 },
];

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Visitor() {
  const [tab, setTab] = useState<Tab>("oct");
  const [eye, setEye] = useState<EyeSide>("OD");
  const [index, setIndex] = useState(6);
  const [missing, setMissing] = useState(false);
  const [lowQuality, setLowQuality] = useState(false);
  const [budget, setBudget] = useState(3);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OctResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = mission[index];
  const baseline = eye === "OD" ? mission[0].od : mission[0].os;
  const current = eye === "OD" ? selected.od : selected.os;
  const delta = current - baseline;

  function chooseFile(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null;
    setResult(null);
    setError("");
    if (selectedFile && !["image/png", "image/jpeg"].includes(selectedFile.type)) {
      setError("Please choose a PNG or JPEG image.");
      setFile(null);
      return;
    }
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setError("Maximum image size is 10 MB.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/oct/oct/analyze", {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error(`AI service error: ${response.status}`);
      const data = await response.json();
      if (
        typeof data.prediction !== "string" ||
        typeof data.confidence !== "number" ||
        !data.probabilities
      ) throw new Error("Unexpected AI response.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Starfield density={0.00006} />
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        <nav className="flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-semibold tracking-[0.25em]">
            SANSIGHT
          </Link>
          <Link to="/workspace" className="text-sm text-muted-foreground hover:text-primary">
            Mission Access
          </Link>
        </nav>

        <header className="mx-auto max-w-3xl py-12 text-center">
          <p className="eyebrow text-primary">INTERACTIVE TECHNOLOGY SHOWCASE</p>
          <h1 className="mt-4 font-display text-4xl font-semibold md:text-6xl">
            Beyond the Visible.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            From a single OCT image to longitudinal surveillance
            and intelligent scan scheduling.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Interactive research prototype. Mission measurements and scheduling
            examples are simulated; OCT inference connects to a separately trained model.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {technologies.map((tech) => {
            const Icon = tech.icon;
            return (
              <button
                key={tech.id}
                type="button"
                onClick={() => setTab(tech.id)}
                className={`rounded-2xl border p-6 text-left transition-all hover:border-primary/70 ${
                  tab === tech.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary">
                    TECHNOLOGY {tech.number}
                  </span>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold">
                  {tech.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{tech.body}</p>
                <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary">
                  Explore technology <ArrowRight className="h-3 w-3" />
                </p>
              </button>
            );
          })}
        </div>

        <section className="mt-7 rounded-2xl border border-primary/30 bg-card/90 p-5 md:p-8">
          {tab === "oct" && (
            <div>
              <p className="eyebrow text-primary">TECHNOLOGY 01 / TRAINED MODEL</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Live OCT Image Classification
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload an OCT image to obtain a classification and model confidence.
                This classifier does not extract RNFL thickness.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="space-y-4">
                  <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 p-6 text-center">
                    <UploadCloud className="mb-3 h-9 w-9 text-primary" />
                    <span className="font-semibold">Choose OCT Image</span>
                    <span className="mt-2 text-xs text-muted-foreground">
                      PNG / JPEG, up to 10 MB
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="sr-only"
                      onChange={chooseFile}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={analyze}
                    disabled={!file || loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-cta px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanEye className="h-4 w-4" />}
                    {loading ? "Analyzing..." : "Analyze with Trained AI"}
                  </button>
                  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                </div>

                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-background/50 p-4">
                  {file ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Uploaded OCT"
                      className="max-h-64 max-w-full object-contain"
                      onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Image preview</p>
                  )}
                </div>
              </div>

              {result && (
                <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <p className="eyebrow">AI CLASSIFICATION RESULT</p>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                    <p className="font-display text-2xl font-semibold">{result.prediction}</p>
                    <p className="font-display text-3xl text-primary">{pct(result.confidence)}</p>
                  </div>
                  <div className="mt-5 space-y-3">
                    {Object.entries(result.probabilities).map(([label, value]) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{label}</span><span>{pct(value)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: pct(value) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Model: {result.model || "OCT classifier"}. Research demonstration only;
                    not a clinical diagnosis.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "timeline" && (
            <div>
              <p className="eyebrow text-primary">TECHNOLOGY 02 / TEMPORAL ANALYSIS</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Eye Health Across the Mission
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Select an eye and a mission day to inspect how RNFL changes
                relative to its pre-flight baseline.
              </p>

              <div className="mt-6 flex gap-3">
                {(["OD", "OS"] as EyeSide[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => setEye(side)}
                    className={`rounded-lg border px-5 py-2 text-sm ${
                      eye === side ? "border-primary bg-primary/15 text-primary" : "border-border"
                    }`}
                  >
                    {side === "OD" ? "Right Eye (OD)" : "Left Eye (OS)"}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Baseline RNFL", `${baseline.toFixed(1)} µm`],
                  ["Selected RNFL", `${current.toFixed(1)} µm`],
                  ["Change", `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} µm`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border p-5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-border p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-semibold">Mission progression</span>
                  <span className="font-mono text-primary">DAY {selected.day}</span>
                </div>
                <div className="flex h-44 items-end gap-2">
                  {mission.map((point, i) => {
                    const value = eye === "OD" ? point.od : point.os;
                    return (
                      <button
                        key={point.day}
                        onClick={() => setIndex(i)}
                        title={`Day ${point.day}: ${value.toFixed(1)} µm`}
                        className="flex h-full flex-1 flex-col justify-end gap-2"
                      >
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            i === index ? "bg-primary" : "bg-primary/30 hover:bg-primary/60"
                          }`}
                          style={{ height: `${Math.max(12, (value - 90) * 5)}%` }}
                        />
                        <span className="text-center font-mono text-[10px] text-muted-foreground">
                          D{point.day}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="range"
                  min={0}
                  max={mission.length - 1}
                  value={index}
                  onChange={(e) => setIndex(Number(e.target.value))}
                  className="mt-6 w-full accent-cyan-400"
                  aria-label="Select mission day"
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Illustrative mission values, not measurements extracted from OCT images.
              </p>
            </div>
          )}

          {tab === "integrity" && (
            <div>
              <p className="eyebrow text-primary">TECHNOLOGY 03 / RELIABILITY</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                What Happens When Data Becomes Unreliable?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Toggle measurement problems to explore the integrity-aware
                monitoring concept.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-5">
                  <input type="checkbox" checked={missing}
                    onChange={(e) => setMissing(e.target.checked)}
                    className="h-5 w-5 accent-cyan-400" />
                  <span>Missing OCT scan</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-5">
                  <input type="checkbox" checked={lowQuality}
                    onChange={(e) => setLowQuality(e.target.checked)}
                    className="h-5 w-5 accent-cyan-400" />
                  <span>Low-quality OCT scan</span>
                </label>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border p-5">
                  <p className="text-xs text-muted-foreground">Measurement status</p>
                  <p className="mt-3 text-xl font-semibold">
                    {missing ? "Missing" : lowQuality ? "Flagged" : "Accepted"}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-5">
                  <p className="text-xs text-muted-foreground">Illustrative uncertainty</p>
                  <p className="mt-3 text-xl font-semibold">
                    ±{(2.0 + (missing ? 2.5 : 0) + (lowQuality ? 1.5 : 0)).toFixed(1)} µm
                  </p>
                </div>
                <div className="rounded-xl border border-border p-5">
                  <p className="text-xs text-muted-foreground">Recommended response</p>
                  <p className="mt-3 text-lg font-semibold">
                    {missing ? "Acquire replacement" : lowQuality ? "Repeat quality check" : "Continue monitoring"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                These uncertainty values illustrate system behavior and are
                not outputs from a live Kalman filter run.
              </p>
            </div>
          )}

          {tab === "scheduler" && (
            <div>
              <p className="eyebrow text-primary">TECHNOLOGY 04 / CREW-TIME OPTIMIZATION</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Adaptive vs Fixed Scan Scheduling
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Both strategies use the same scan budget. The adaptive example
                prioritizes the eye with the greater monitoring need.
              </p>

              <div className="mt-6 rounded-xl border border-border p-5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="scan-budget" className="font-semibold">
                    Available OCT sessions
                  </label>
                  <span className="font-mono text-2xl text-primary">{budget}</span>
                </div>
                <input
                  id="scan-budget"
                  type="range" min="1" max="6" value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-5 w-full accent-cyan-400"
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border p-5">
                  <p className="eyebrow">FIXED SCHEDULING</p>
                  <h3 className="mt-3 text-xl font-semibold">Calendar-based</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Scans occur at regular intervals regardless of uncertainty.
                  </p>
                  <div className="mt-5 space-y-2">
                    {Array.from({ length: budget }, (_, i) => (
                      <div key={i} className="rounded-lg border border-border p-3 text-sm">
                        Session {i + 1} — Day {Math.round((i + 1) * 14 / (budget + 1))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <p className="eyebrow text-primary">ADAPTIVE SCHEDULING</p>
                  <h3 className="mt-3 text-xl font-semibold">Need-based</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Higher-risk or uncertain measurements receive priority.
                  </p>
                  <div className="mt-5 space-y-2">
                    {Array.from({ length: budget }, (_, i) => (
                      <div key={i} className="rounded-lg border border-primary/20 p-3 text-sm">
                        Session {i + 1} — {i % 3 === 2 ? "Left eye (OS)" : "Right eye (OD)"}
                        <span className="ml-2 text-xs text-primary">
                          {i === 0 ? "High priority" : "Follow-up"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Illustrative scheduling comparison, not measured superiority
                or a live optimizer result. Both columns contain {budget} sessions.
              </p>
            </div>
          )}
        </section>

        <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-7 text-center">
          <Activity className="mx-auto h-7 w-7 text-primary" />
          <h2 className="mt-3 font-display text-2xl font-semibold">
            One Connected Monitoring Workflow
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            OCT classification provides image-level evidence. Longitudinal RNFL
            monitoring tracks changes over time. Integrity checks identify
            unreliable measurements. Adaptive scheduling determines which
            examination should be prioritized next.
          </p>
          <Link
            to="/workspace"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cta px-6 py-3 font-semibold text-primary-foreground"
          >
            Enter Mission Workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
