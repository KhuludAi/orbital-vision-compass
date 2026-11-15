import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowLeftRight, BookOpen, CalendarClock, ClipboardCheck, Eye, FlaskConical, Gauge, HeartPulse, Lock, Menu, RefreshCcw, ScanEye, ShieldCheck, Stethoscope, User, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSans } from "@/lib/sans/store";
import { ASTRONAUTS, SCENARIOS } from "@/lib/sans/simulate";
import { Segmented, SourceBadge } from "./ui";
import { WORKSPACES, can, useWorkspace, type Role } from "@/lib/sans/workspace";
import { Starfield } from "./Starfield";
import type { RangeId } from "@/lib/sans/types";

const ITEM = {
  control: { to: "/app", label: "Mission Control", icon: Gauge },
  crew: { to: "/app/crew", label: "Crew Overview", icon: Users },
  me: { to: "/app/me", label: "My Health Dashboard", icon: Gauge },
  checkin: { to: "/app/checkin", label: "Daily Check-in", icon: ClipboardCheck },
  profile: { to: "/app/astronaut", label: "Astronaut Profile", icon: User },
  myProfile: { to: "/app/astronaut", label: "My Profile", icon: User },
  monitoring: { to: "/app/monitoring", label: "SANS Monitoring", icon: Activity },
  myEyes: { to: "/app/monitoring", label: "My Eye Health", icon: Activity },
  scans: { to: "/app/scans", label: "OCT Eye Scans", icon: ScanEye },
  planner: { to: "/app/planner", label: "Adaptive Planner", icon: CalendarClock },
  integrity: { to: "/app/integrity", label: "Data Integrity", icon: ShieldCheck },
  alerts: { to: "/app/alerts", label: "Alerts", icon: AlertTriangle },
  vitals: { to: "/app/vitals", label: "Vital Signs", icon: HeartPulse },
  sync: { to: "/app/sync", label: "Offline Sync", icon: RefreshCcw },
  guidance: { to: "/app/guidance", label: "Clinical Guidance", icon: Stethoscope },
  evidence: { to: "/app/evidence", label: "Scientific Evidence", icon: BookOpen },
  demo: { to: "/app/demo", label: "Interactive Demo", icon: FlaskConical },
} as const;
type NavItem = (typeof ITEM)[keyof typeof ITEM];
const MONITOR_NAV = [
  { group: "Operations", items: [ITEM.control, ITEM.crew, ITEM.profile, ITEM.monitoring, ITEM.scans, ITEM.planner] },
  { group: "Systems", items: [ITEM.integrity, ITEM.alerts, ITEM.vitals, ITEM.sync] },
  { group: "Knowledge", items: [ITEM.guidance, ITEM.evidence, ITEM.demo] },
];
/** Each workspace has its own menu; all of them read the same astronaut records. */
export const NAVS: Record<Role, { group: string; items: NavItem[] }[]> = {
  astronaut: [
    { group: "My health", items: [ITEM.me, ITEM.checkin, ITEM.myEyes, ITEM.scans, ITEM.vitals, ITEM.myProfile] },
    { group: "Learn", items: [ITEM.guidance, ITEM.evidence] },
  ],
  monitor: MONITOR_NAV,
  viewer: [
    { group: "Mission overview", items: [ITEM.control, ITEM.crew, ITEM.profile, ITEM.monitoring, ITEM.scans, ITEM.planner] },
    { group: "Systems", items: [ITEM.integrity, ITEM.alerts, ITEM.vitals, ITEM.sync] },
    { group: "Astronaut view", items: [ITEM.me, ITEM.checkin] },
    { group: "Knowledge", items: [ITEM.guidance, ITEM.evidence, ITEM.demo] },
  ],
};

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data, acked } = useSans();
  const { role } = useWorkspace();
  const ws = WORKSPACES[role];
  const open = data ? data.alerts.filter((a) => a.severity !== "info" && !acked.has(a.id)).length : 0;
  return (
    <nav aria-label="Primary" className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-3 px-5 py-5" onClick={onNavigate}>
        <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/40 bg-primary/10"><Eye className="h-4 w-4 text-primary" /></span>
        <span><span className="block font-display text-lg font-semibold tracking-[0.18em]">SANSIGHT</span><span className="eyebrow !text-[9px]">Beyond the visible</span></span>
      </Link>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        <div className="mx-2 rounded-lg border border-border/70 bg-background/30 px-3 py-2.5">
          <p className="eyebrow !text-[9px]">Workspace {ws.num}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">{ws.label}{role === "viewer" && <Lock className="h-3 w-3 text-muted-foreground" aria-label="Read-only" />}</p>
          <p className="font-mono text-[10px] text-muted-foreground">Demo ID {ws.demoId}</p>
        </div>
        {NAVS[role].map((g) => (
          <div key={g.group}>
            <p className="eyebrow px-3 pb-2">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.to + it.label}>
                  <Link to={it.to} onClick={onNavigate} activeOptions={{ exact: true }}
                    className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-primary">
                    <it.icon className="h-4 w-4 opacity-80" />
                    <span className="flex-1">{it.label}</span>
                    {it.to === "/app/alerts" && open > 0 && <span className="rounded-full bg-warning/20 px-1.5 font-mono text-[10px] text-warning">{open}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="m-3 space-y-2">
        <Link to="/workspace" onClick={onNavigate} className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary">
          <ArrowLeftRight className="h-3.5 w-3.5" />Back to Workspace Selection
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          <span>Estimator online · {data ? data.scans.filter((s) => s.synced).length : "—"} scans on ground</span>
        </div>
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { astronautId, setAstronautId, range, setRange, data, scenario } = useSans();
  const { role } = useWorkspace();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const norm = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const current = NAVS[role].map((g) => g.items.find((i) => i.to === norm)).find((i) => i !== undefined);
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-hero" aria-hidden />
      <div className="pointer-events-none fixed inset-0 opacity-30" aria-hidden><Starfield density={0.00005} /></div>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar backdrop-blur-xl lg:block"><SideNav /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-background"><button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-5 p-1 text-muted-foreground"><X className="h-5 w-5" /></button><SideNav onNavigate={() => setOpen(false)} /></aside>
        </div>
      )}
      <div className="relative lg:pl-64">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/60 px-4 py-3 backdrop-blur-xl md:px-8">
          <button aria-label="Open menu" className="rounded-md border border-border p-2 lg:hidden" onClick={() => setOpen(true)}><Menu className="h-4 w-4" /></button>
          <div className="min-w-0 flex-1">
            <p className="eyebrow truncate">{data ? `${data.astronaut.callsign} · Mission day ${data.currentDay} of ${data.astronaut.missionLengthDays}` : "Loading"}<span className="hidden md:inline"> · {SCENARIOS[scenario].label}</span></p>
            <p className="truncate font-display text-sm font-medium">{current?.label ?? WORKSPACES[role].title}</p>
          </div>
          {can(role, "browseCrew") ? (<>
            <label className="hidden text-xs text-muted-foreground xl:inline" htmlFor="astro">Astronaut</label>
            <select id="astro" value={astronautId} onChange={(e) => setAstronautId(e.target.value)} className="rounded-lg border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              {ASTRONAUTS.map((a) => <option key={a.id} value={a.id}>{a.callsign} · {a.role}</option>)}
            </select>
          </>) : (
            <span className="rounded-lg border border-border bg-background/60 px-3 py-1.5 font-mono text-xs">{data ? `${data.astronaut.callsign} · ${data.astronaut.id}` : "—"}</span>
          )}
          <Segmented<RangeId> label="Time range" value={range} onChange={setRange} options={[{ value: 30, label: "30d" }, { value: 90, label: "90d" }, { value: 180, label: "Mission" }]} />
          {role === "viewer" && <span className="hidden items-center gap-1 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline-flex"><Lock className="h-3 w-3" />Read-only</span>}
          {/* Indicator follows the data actually on screen, not the requested mode. */}
          <SourceBadge source={data?.source ?? "demo"} />
          <Link to="/workspace" aria-label="Switch workspace" title="Switch workspace" className="rounded-md border border-border p-2 text-muted-foreground hover:border-primary/50 hover:text-primary"><ArrowLeftRight className="h-3.5 w-3.5" /></Link>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
