import { useSyncExternalStore } from "react";

/** Prototype workspaces. No passwords: picking a workspace only changes menus and permissions. */
export type Role = "astronaut" | "monitor" | "viewer";
export type DataSource = "demo" | "live";

export const OWN_ASTRONAUT_ID = "ASTRO001";

export const WORKSPACES: Record<Role, { num: string; label: string; title: string; demoId: string; cta: string }> = {
  astronaut: { num: "01", label: "Astronaut", title: "My Health Dashboard", demoId: "ASTRO001", cta: "Enter Astronaut Dashboard" },
  monitor: { num: "02", label: "Mission Monitor", title: "Medical Monitoring Center", demoId: "OBS001", cta: "Enter Mission Control" },
  viewer: { num: "03", label: "Viewer", title: "Read-Only Project View", demoId: "VIEW001", cta: "Explore as Viewer" },
};

export type Action = "ackAlert" | "manageSchedule" | "uploadScan" | "syncData" | "switchSource" | "changeScenario" | "dailyCheckin" | "browseCrew";

const PERMISSIONS: Record<Role, readonly Action[]> = {
  astronaut: ["dailyCheckin"],
  monitor: ["ackAlert", "manageSchedule", "uploadScan", "syncData", "switchSource", "changeScenario", "browseCrew"],
  // Viewers may switch between simulated scenarios to explore them, but never edit or submit data.
  viewer: ["changeScenario", "browseCrew"],
};

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[role].includes(action);
}

const MONITOR_PATHS = ["/app", "/app/crew", "/app/astronaut", "/app/monitoring", "/app/scans", "/app/planner", "/app/integrity", "/app/alerts", "/app/vitals", "/app/sync", "/app/guidance", "/app/evidence", "/app/demo"];
const PATHS: Record<Role, readonly string[]> = {
  astronaut: ["/app/me", "/app/checkin", "/app/astronaut", "/app/monitoring", "/app/scans", "/app/vitals", "/app/guidance", "/app/evidence"],
  monitor: MONITOR_PATHS,
  viewer: [...MONITOR_PATHS, "/app/me", "/app/checkin"],
};

export const HOME: Record<Role, "/app" | "/app/me"> = { astronaut: "/app/me", monitor: "/app", viewer: "/app" };

export function canAccess(role: Role, pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PATHS[role].includes(p);
}

/** Astronauts only ever see their own record; other workspaces may browse every crew member. */
export function lockedAstronaut(role: Role): string | undefined {
  return role === "astronaut" ? OWN_ASTRONAUT_ID : undefined;
}

/** Live data is used only when a verified live source exists; otherwise demo data is used automatically. */
export function resolveSource(requested: DataSource, liveVerified: boolean): DataSource {
  return requested === "live" && liveVerified ? "live" : "demo";
}

// ---- Persisted selection (browser only, hydration-safe) ----
const KEY = "sansight.workspace";
const EVT = "sansight-workspace";
interface Stored { role: Role | null; source: DataSource }
export interface WorkspaceState extends Stored { ready: boolean }
const SERVER: WorkspaceState = { role: null, source: "demo", ready: false };
let cacheRaw: string | null | undefined;
let cacheVal: WorkspaceState = SERVER;

function read(): WorkspaceState {
  const raw = window.localStorage.getItem(KEY);
  if (raw === cacheRaw) return cacheVal;
  let parsed: Partial<Stored> = {};
  try { parsed = raw ? (JSON.parse(raw) as Partial<Stored>) : {}; } catch { parsed = {}; }
  const role = parsed.role && parsed.role in WORKSPACES ? parsed.role : null;
  cacheRaw = raw;
  cacheVal = { role, source: parsed.source === "live" ? "live" : "demo", ready: true };
  return cacheVal;
}
function write(next: Partial<Stored>) {
  const cur = read();
  window.localStorage.setItem(KEY, JSON.stringify({ role: cur.role, source: cur.source, ...next }));
  window.dispatchEvent(new Event(EVT));
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
}

export const setWorkspaceRole = (role: Role) => write({ role });
export const setRequestedSource = (source: DataSource) => write({ source });

export function useWorkspace() {
  const s = useSyncExternalStore(subscribe, read, () => SERVER);
  // Deep links opened without a choice fall back to the read-only workspace.
  const role: Role = s.role ?? "viewer";
  return { ...s, role, chosen: s.role !== null };
}
