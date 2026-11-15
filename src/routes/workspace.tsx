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
          <p className="mt-3 max-w-xl text-muted-foreground">Choose how you want to access the SANSIGHT monitoring platform.</p>
        </header>

        <section className="mt-10 grid gap-4 lg:grid-cols-3" aria-label="Workspaces">
          {CARDS.map(({ role, icon: I, audience, features }) => {
            const w = WORKSPACES[role];
            const current = ws.chosen && ws.role === role;
            return (
              <article key={role} className={cn("panel flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35", current && "border-primary/45")}>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-primary/25 bg-primary/10"><I className="h-5 w-5 text-primary" /></span>
                  {current ? <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary"><Check className="h-3 w-3" />Current</span>
                    : role === "viewer" ? <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><Lock className="h-3 w-3" />Read-only</span> : null}
                </div>
                <p className="eyebrow mt-5">{w.num} — {w.label}</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{w.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{audience}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {features.map((f) => <li key={f} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />{f}</li>)}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-mono text-[11px] text-muted-foreground">Demo ID <span className="text-foreground">{w.demoId}</span></span>
                </div>
                <Button onClick={() => enter(role)} className="group mt-4 h-auto w-full rounded-lg bg-cta py-2.5 text-sm">
                  {w.cta}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </article>
            );
          })}
        </section>

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
