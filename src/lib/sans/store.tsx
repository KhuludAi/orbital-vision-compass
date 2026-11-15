import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDataset, type ApiMode } from "./api";
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
  data: Dataset | undefined; isLoading: boolean; error: Error | null; refetch: () => void;
}
const SansCtx = createContext<Ctx | null>(null);

export function SansProvider({ children }: { children: ReactNode }) {
  const [astronautId, setAstronautId] = useState("ASTRO001");
  const [scenario, setScenarioRaw] = useState<ScenarioId>("progressive");
  const [range, setRange] = useState<RangeId>(180);
  const [onsetRate, setOnsetRate] = useState(1);
  const [noise, setNoise] = useState(1);
  const [budget, setBudget] = useState(60);
  const [mode, setMode] = useState<ApiMode>("demo");
  const [uploads, setUploads] = useState<Scan[]>([]);
  const [acked, setAcked] = useState<Set<string>>(new Set());
  const [linkUp, setLinkUp] = useState(true);
  const [downlinked, setDownlinked] = useState<string[]>([]);
  const setScenario = (v: ScenarioId) => { setScenarioRaw(v); setDownlinked([]); setLinkUp(v !== "blackout"); };
  const q = useQuery({
    queryKey: ["sans", astronautId, scenario, onsetRate, noise, mode, uploads.length, downlinked.join(",")],
    queryFn: () => fetchDataset({ astronautId, scenario, onsetRate, noise, uploads, downlinked }, mode),
    placeholderData: (prev) => prev,
    retry: false,
  });
  const value = useMemo<Ctx>(() => ({
    astronautId, setAstronautId: (v) => { setAstronautId(v); setDownlinked([]); }, scenario, setScenario, range, setRange, onsetRate, setOnsetRate, noise, setNoise,
    budget, setBudget, mode, setMode, uploads, addUpload: (s) => setUploads((u) => [...u, s]),
    reset: () => { setScenario("progressive"); setOnsetRate(1); setNoise(1); setBudget(60); setUploads([]); setAcked(new Set()); setMode("demo"); },
    acked, ack: (id) => setAcked((a) => new Set(a).add(id)),
    linkUp, setLinkUp, downlinked, markDownlinked: (id) => setDownlinked((d) => (d.includes(id) ? d : [...d, id])),
    data: q.data, isLoading: q.isLoading, error: q.error as Error | null, refetch: () => void q.refetch(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [astronautId, scenario, range, onsetRate, noise, budget, mode, uploads, acked, linkUp, downlinked, q.data, q.isLoading, q.error, q]);
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
