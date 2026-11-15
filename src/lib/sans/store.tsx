import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchDataset, SANS_API_URL, type ApiMode } from "./api";
import { setRequestedSource, useWorkspace } from "./workspace";
import type { Dataset, RangeId, Scan, ScenarioId } from "./types";

interface Ctx {
  astronautId: string; setAstronautId: (v: string) => void;
  scenario: ScenarioId; setScenario: (v: ScenarioId) => void;
  range: RangeId; setRange: (v: RangeId) => void;
  onsetRate: number; setOnsetRate: (v: number) => void;
  noise: number; setNoise: (v: number) => void;
  budget: number; setBudget: (v: number) => void;
  mode: ApiMode; setMode: (v: ApiMode) => void;
  uploads: Scan[]; addUpload: (s: Scan) => void; reset: () => void;
  acked: Set<string>; ack: (id: string) => void;
  /** Communication link state (AOS = true). The blackout scenario starts in loss of signal. */
  linkUp: boolean; setLinkUp: (v: boolean) => void;
  downlinked: string[]; markDownlinked: (id: string) => void;
  checkins: CheckIn[]; addCheckin: (c: CheckIn) => void;
  data: Dataset | undefined; isLoading: boolean; error: Error | null; refetch: () => void;
}
export interface CheckIn { day: number; at: string; wellbeing: number; symptoms: string[]; sleepHours: number; notes: string }
const SansCtx = createContext<Ctx | null>(null);

/** `lockedAstronautId` pins the dataset to one crew member (astronaut workspace sees only their own record). */
export function SansProvider({ children, lockedAstronautId }: { children: ReactNode; lockedAstronautId?: string | undefined }) {
  const [selectedId, setAstronautId] = useState("ASTRO001");
  const astronautId = lockedAstronautId ?? selectedId;
  const [scenario, setScenarioRaw] = useState<ScenarioId>("progressive");
  const [range, setRange] = useState<RangeId>(180);
  const [onsetRate, setOnsetRate] = useState(1);
  const [noise, setNoise] = useState(1);
  const [budget, setBudget] = useState(60);
  const ws = useWorkspace();
  // Live is only requested when a backend is configured; any failure falls back to demo below.
  const mode: ApiMode = ws.source === "live" && SANS_API_URL ? "live" : "demo";
  const setMode = (v: ApiMode) => setRequestedSource(v);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [uploads, setUploads] = useState<Scan[]>([]);
  const [acked, setAcked] = useState<Set<string>>(new Set());
  const [linkUp, setLinkUp] = useState(true);
  const [downlinked, setDownlinked] = useState<string[]>([]);
  const setScenario = (v: ScenarioId) => { setScenarioRaw(v); setDownlinked([]); setLinkUp(v !== "blackout"); };
  const q = useQuery({
    queryKey: ["sans", astronautId, scenario, onsetRate, noise, mode, uploads.length, downlinked.join(",")],
    queryFn: () => fetchDataset({ astronautId, scenario, onsetRate, noise, uploads, downlinked }, mode),
    // Keep the previous dataset during refetches only if it came from the same source: never mix demo and live.
    placeholderData: (prev) => (prev && prev.source === mode ? prev : undefined),
    retry: false,
  });
  useEffect(() => {
    if (mode === "live" && q.error) {
      setRequestedSource("demo");
      toast.warning("Live source unavailable", { description: `${q.error.message} Showing demo data instead.` });
    }
  }, [mode, q.error]);
  const value = useMemo<Ctx>(() => ({
    astronautId, setAstronautId: (v) => { setAstronautId(v); setDownlinked([]); }, scenario, setScenario, range, setRange, onsetRate, setOnsetRate, noise, setNoise,
    budget, setBudget, mode, setMode, uploads, addUpload: (s) => setUploads((u) => [...u, s]),
    reset: () => { setScenario("progressive"); setOnsetRate(1); setNoise(1); setBudget(60); setUploads([]); setAcked(new Set()); setMode("demo"); },
    acked, ack: (id) => setAcked((a) => new Set(a).add(id)),
    checkins, addCheckin: (c) => setCheckins((l) => [c, ...l]),
    linkUp, setLinkUp, downlinked, markDownlinked: (id) => setDownlinked((d) => (d.includes(id) ? d : [...d, id])),
    data: q.data, isLoading: q.isLoading, error: q.error as Error | null, refetch: () => void q.refetch(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [astronautId, scenario, range, onsetRate, noise, budget, mode, uploads, acked, checkins, linkUp, downlinked, q.data, q.isLoading, q.error, q]);
  return <SansCtx.Provider value={value}>{children}</SansCtx.Provider>;
}

export function useSans() {
  const c = useContext(SansCtx);
  if (!c) throw new Error("useSans outside provider");
  return c;
}
/** For pages rendered inside the data gate: dataset is guaranteed. */
export function useDataset() {
  const c = useSans();
  if (!c.data) throw new Error("Dataset is not available outside the data gate");
  return { ...c, data: c.data };
}
