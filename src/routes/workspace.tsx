import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Eye, HeartPulse, Lock, MonitorDot, Satellite } from "lucide-react";
import { Starfield } from "@/components/sans/Starfield";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLiveProbe } from "@/lib/sans/live";
import { HOME, WORKSPACES, resolveSource, setRequestedSource, setWorkspaceRole, useWorkspace, type Role } from "@/lib/sans/workspace";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [
    { title: "Select Your Workspace — SANSIGHT" },
    { name: "description", content: "Choose the Astronaut, Mission Monitor or read-only Viewer workspace of the SANSIGHT ocular health monitoring platform." },
    { property: "og:title", content: "Select Your Workspace — SANSIGHT" },
    { property: "og:description", content: "Astronaut, Mission Monitor or Viewer access to SANSIGHT." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: WorkspaceSelect,
});

const CARDS: { role: Role; icon: typeof Eye; audience: string; features: string[] }[] = [
  { role: "astronaut", icon: HeartPulse, audience: "For astronauts monitoring their own health during space missions.", features: [
    "View personal health measurements.", "Monitor right and left eye health.", "Check heart rate, blood pressure, and oxygen saturation.",
    "Receive OCT scan reminders.", "View upcoming scan schedules.", "Complete daily health check-ins."] },
  { role: "monitor", icon: MonitorDot, audience: "For authorized mission medical personnel monitoring astronaut health.", features: [
    "Monitor multiple crew members.", "Review individual astronaut health profiles.", "Track right and left eye RNFL measurements.",
    "Review OCT scans and measurement trends.", "Monitor vital signs and health alerts.", "Manage adaptive OCT scheduling.", "Review data quality and synchronization status."] },
  { role: "viewer", icon: Eye, audience: "For judges, researchers, and visitors who want to explore the system without changing anything.", features: [
    "Explore all main dashboard features.", "View astronaut health profiles.", "Explore OCT monitoring and scheduling.",
    "View charts, alerts, and simulated scenarios.", "No data editing or submission permissions."] },
];

function DemoIdEntry() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [error, setError] = useState("");

  function enter() {
    const normalized = id.trim().toUpperCase();

    const role: Role | undefined =
      normalized === "ASTRO001"
        ? "astronaut"
        : normalized === "OBS001"
          ? "monitor"
          : normalized === "VIEW001"
            ? "viewer"
            : undefined;

    if (!role) {
      setError("Unknown Demo ID. Please check the ID.");
      return;
    }

    setWorkspaceRole(role);
    setError("");

    void navigate({
      to: role === "viewer" ? "/visitor" : HOME[role],
    });
  }

  return (
    <section className="mx-auto mt-10 max-w-xl rounded-2xl border border-primary/25 bg-card/90 p-7 shadow-xl">
      <p className="eyebrow text-primary">
        MISSION ACCESS
      </p>

      <h2 className="mt-3 font-display text-2xl font-semibold">
        Enter Your Mission ID
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Your demo ID determines which workspace opens.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          enter();
        }}
      >
        <input
          value={id}
          onChange={(event) => {
            setId(event.target.value);
            setError("");
          }}
          placeholder="Enter Demo ID"
          autoComplete="off"
          aria-label="Demo ID"
          className="w-full rounded-xl border border-border bg-background px-4 py-4 font-mono text-base uppercase tracking-widest outline-none focus:border-primary"
        />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-cta px-5 py-4 font-semibold text-primary-foreground hover:opacity-90"
        >
          Enter Mission Workspace
        </button>
      </form>

      <div className="mt-6 border-t border-border/60 pt-5">
        <p className="text-xs text-muted-foreground">
          Demo access IDs
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ["ASTRO001", "Astronaut"],
            ["OBS001", "Monitor"],
            ["VIEW001", "Visitor"],
          ].map(([demoId, label]) => (
            <button
              key={demoId}
              type="button"
              onClick={() => setId(demoId)}
              className="rounded-lg border border-border p-3 text-left hover:border-primary/60"
            >
              <span className="block font-mono text-xs text-primary">
                {demoId}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Prototype role selection only. No identity verification.
      </p>
    </section>
  );
}
function WorkspaceSelect() {
  const navigate = useNavigate();
  const ws = useWorkspace();
  const live = useLiveProbe();
  const source = resolveSource(ws.source, live.verified);
  const enter = (role: Role) => { setWorkspaceRole(role); void navigate({ to: HOME[role] }); };
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-hero" aria-hidden />
      <Starfield density={0.00008} />
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.25em]"><Eye className="h-4 w-4 text-primary" />SANSIGHT</Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Home</Link>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16 md:px-12">
        <header className="animate-rise pt-6 md:pt-10">
          <p className="eyebrow">SANSIGHT</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">Select Your Workspace</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Enter your mission demo ID to open the appropriate workspace.</p>
        </header>

        <DemoIdEntry />

        <section className="mt-10" aria-label="Data source">
          <p className="eyebrow">Data source</p>
          <h2 className="mt-1 font-display text-xl font-semibold">Where the displayed data comes from</h2>
          <div className={cn("mt-4 grid gap-4", live.verified && "md:grid-cols-2")}>
            <SourceTile kind="demo" active={source === "demo"} onSelect={live.verified ? () => setRequestedSource("demo") : undefined}
              body="All displayed astronaut profiles and health measurements are simulated for demonstration purposes. They do not represent actual astronauts or real patient records." />
            {live.verified && (
              <SourceTile kind="live" active={source === "live"} onSelect={() => setRequestedSource("live")}
                body="Displays measurements received from the connected backend and configured data sources." />
            )}
          </div>
          {!live.verified && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Satellite className="h-3.5 w-3.5" />
              {live.checking ? "Checking the connected data source…" : live.configured ? "The connected backend could not be verified, so demo data is used automatically." : "No verified live data source is connected, so demo data is used automatically."}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function SourceTile({ kind, active, body, onSelect }: { kind: "demo" | "live"; active: boolean; body: string; onSelect?: (() => void) | undefined }) {
  const demo = kind === "demo";
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider", demo ? "text-demo" : "text-live")}><span className="h-2 w-2 rounded-full bg-current" aria-hidden />{demo ? "Demo mode" : "Live mode"}</span>
        {active && <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">In use</span>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </>
  );
  const cls = cn("panel block w-full p-5 text-left", active && (demo ? "border-demo/45" : "border-live/45"));
  return onSelect ? <button type="button" onClick={onSelect} aria-pressed={active} className={cls}>{inner}</button> : <div className={cls}>{inner}</div>;
}
