import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";
import { ArrowRight, BookOpen, CalendarClock, Eye, ShieldCheck } from "lucide-react";
import { Starfield } from "@/components/sans/Starfield";
import { Button } from "@/components/ui/button";
import { FallbackGlobe } from "@/components/sans/Globe";
import { simulate } from "@/lib/sans/simulate";
import { planScans } from "@/lib/sans/planner";
import { EYE } from "@/lib/sans/eyes";
import type { Dataset, Quality } from "@/lib/sans/types";

const Globe = lazy(() => import("@/components/sans/Globe"));

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "SANSIGHT — Beyond the Visible" },
    { name: "description", content: "Intelligent ocular health monitoring for long-duration space missions: per-eye OCT tracking, honest uncertainty and adaptive scan scheduling." },
    { property: "og:title", content: "SANSIGHT — Beyond the Visible" },
    { property: "og:description", content: "Intelligent ocular health monitoring for long-duration space missions." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Landing,
});

function Landing() {
  const ds = useMemo(() => simulate({ astronautId: "ASTRO001", scenario: "progressive", onsetRate: 1, noise: 1, uploads: [] }), []);
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-hero" aria-hidden />
      <Starfield density={0.00012} />

      <nav className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.25em]"><Eye className="h-4 w-4 text-primary" />SANSIGHT</span>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link to="/app/evidence" className="hidden hover:text-foreground sm:inline">Science</Link>
          <Link to="/workspace" className="hover:text-primary">Select workspace →</Link>
        </div>
      </nav>

      {/* Earth has its own space beside the text, or below it on narrow screens. */}
      <section className="earth-landing relative z-10 px-6 pb-24 md:px-12">
        <div className="earth-placement pointer-events-none" aria-hidden>
          <ClientOnly fallback={<FallbackGlobe />}><Suspense fallback={<FallbackGlobe />}><Globe /></Suspense></ClientOnly>
        </div>
        <div className="earth-landing-copy relative max-w-5xl animate-rise">
          <h1 className="title-shadow font-display text-[clamp(4.2rem,14vw,11.5rem)] font-semibold leading-[0.86] tracking-[-0.045em]">
            <span className="text-gradient">SANSIGHT</span>
          </h1>
          <p className="title-shadow mt-5 font-display text-3xl font-medium text-foreground/95 md:text-5xl">Beyond the Visible.</p>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">Intelligent ocular health monitoring for long-duration space missions.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild className="group h-auto rounded-lg bg-cta px-6 py-3 text-base transition-transform hover:-translate-y-0.5"><Link to="/workspace">Enter Mission Control<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></Button>
            <Button asChild variant="outline" className="h-auto rounded-lg border-border bg-background/40 px-6 py-3 text-base backdrop-blur-sm hover:border-primary/50"><Link to="/app/demo">Explore the Technology</Link></Button>
            <Button asChild variant="link" className="h-auto px-3 py-3 text-muted-foreground"><Link to="/workspace">Skip Intro</Link></Button>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-fade-bottom" aria-hidden />
      </section>

      <section className="relative z-10 px-6 pb-16 md:px-12" aria-label="Core capabilities">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard to="/app/monitoring" icon={Eye} title="Monitor each eye" body="Independent tracking of the right and left eye, with honest uncertainty."><MiniTrend ds={ds} /></FeatureCard>
          <FeatureCard to="/app/planner" icon={CalendarClock} title="Schedule adaptively" body="OCT scans recommended where uncertainty is highest and crew time allows."><MiniSchedule ds={ds} /></FeatureCard>
          <FeatureCard to="/app/integrity" icon={ShieldCheck} title="Trust the data" body="Every measurement is quality-checked; missing scans are detected."><MiniQuality ds={ds} /></FeatureCard>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-6 text-xs text-muted-foreground md:px-12">
        <span className="font-display tracking-[0.2em]">SANSIGHT</span>
        <Link to="/app/evidence" className="inline-flex items-center gap-1.5 hover:text-foreground"><BookOpen className="h-3.5 w-3.5" />Methods, references and data notice</Link>
      </footer>
    </div>
  );
}

function FeatureCard({ to, icon: I, title, body, children }: { to: "/app/monitoring" | "/app/planner" | "/app/integrity"; icon: typeof Eye; title: string; body: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="panel group flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-primary/25 bg-primary/10"><I className="h-4 w-4 text-primary" /></span>
        <ArrowRight className="h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
      <div className="mt-6 flex-1 rounded-lg border border-border/70 bg-background/40 p-3">{children}</div>
    </Link>
  );
}

function MiniTrend({ ds }: { ds: Dataset }) {
  const W = 240, H = 64;
  const series = (["OD", "OS"] as const).map((e) => ds.kalman[e].filter((_, i) => i % 4 === 0).map((p) => p.delta));
  const all = series.flat(); const min = Math.min(...all, 0) - 0.5, max = Math.max(...all) + 0.5;
  const path = (s: number[]) => s.map((v, i) => `${i ? "L" : "M"}${((i / (s.length - 1)) * W).toFixed(1)} ${(H - ((v - min) / (max - min)) * H).toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full overflow-visible" role="img" aria-label="RNFL change from baseline, right and left eye">
        <line x1="0" x2={W} y1={H - ((0 - min) / (max - min)) * H} y2={H - ((0 - min) / (max - min)) * H} stroke="oklch(0.72 0.03 235 / 0.5)" strokeDasharray="3 4" />
        <path d={path(series[0] ?? [])} fill="none" stroke={EYE.OD.color} strokeWidth="2" strokeLinecap="round" />
        <path d={path(series[1] ?? [])} fill="none" stroke={EYE.OS.color} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider"><span className="text-od">● Right eye (OD)</span><span className="text-os">● Left eye (OS)</span></div>
    </div>
  );
}

function MiniSchedule({ ds }: { ds: Dataset }) {
  const recs = planScans(ds, 60);
  const days = Array.from({ length: 14 }, (_, i) => ds.currentDay + 1 + i);
  const next = recs[0];
  return (
    <div>
      {(["OD", "OS"] as const).map((e) => (
        <div key={e} className="mb-1.5 flex items-center gap-2">
          <span className={`w-6 font-mono text-[10px] ${EYE[e].text}`}>{e}</span>
          <div className="grid flex-1 grid-cols-14 gap-0.5" style={{ gridTemplateColumns: "repeat(14,minmax(0,1fr))" }}>
            {days.map((d) => { const on = recs.some((r) => r.eye === e && r.day === d); return <span key={d} className={`h-4 rounded-[3px] ${on ? (e === "OD" ? "bg-od/80" : "bg-os/80") : "bg-muted/70"}`} />; })}
          </div>
        </div>
      ))}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{next ? <>Next · <span className={EYE[next.eye].text}>{EYE[next.eye].side}</span> · Day {next.day}</> : "No scan needed"}</p>
    </div>
  );
}

function MiniQuality({ ds }: { ds: Dataset }) {
  const order: { q: Quality; cls: string; label: string }[] = [{ q: "good", cls: "bg-success", label: "Good" }, { q: "delayed", cls: "bg-delayed", label: "Delayed" }, { q: "noisy", cls: "bg-warning", label: "Noisy" }, { q: "missing", cls: "bg-destructive", label: "Missing" }];
  const n = ds.scans.length;
  const c = (q: Quality) => ds.scans.filter((s) => s.quality === q).length;
  return (
    <div>
      <div className="flex items-baseline justify-between"><span className="font-mono text-2xl tabular-nums">{Math.round((c("good") / n) * 100)}%</span><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">clean scans</span></div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">{order.map((o) => <span key={o.q} className={o.cls} style={{ width: `${(c(o.q) / n) * 100}%` }} />)}</div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">{order.map((o) => <span key={o.q} className="inline-flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${o.cls}`} />{o.label} {c(o.q)}</span>)}</div>
    </div>
  );
}
