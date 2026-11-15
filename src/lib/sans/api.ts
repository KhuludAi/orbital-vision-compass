import { simulate } from "./simulate";
import type { Dataset, SimParams } from "./types";

/** API adapter. Demo mode (default) simulates locally; live mode calls a FastAPI backend. */
export type ApiMode = "demo" | "live";

const env = import.meta.env as Record<string, string | undefined>;
export const SANS_API_URL: string | undefined = env['VITE_SANS_API_URL'] || env['NEXT_PUBLIC_SANS_API_URL'] || undefined;

/** Accepts a backend response as live data only when it declares verified provenance. */
export function acceptLive(json: unknown): Dataset {
  const d = json as Partial<Dataset> | null;
  if (!d || typeof d !== "object" || !d.astronaut || !d.kalman || !d.scans) throw new Error("Live source returned an unrecognised dataset.");
  if (d.provenance?.verified !== true) throw new Error("Live source did not verify where its data came from.");
  return { ...(d as Dataset), source: "live" };
}

export async function fetchDataset(params: SimParams, mode: ApiMode): Promise<Dataset> {
  if (mode === "live") {
    if (!SANS_API_URL) throw new Error("No backend URL configured (VITE_SANS_API_URL).");
    const res = await fetch(`${SANS_API_URL.replace(/\/$/, "")}/v1/astronauts/${params.astronautId}/dataset?scenario=${params.scenario}`);
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return acceptLive(await res.json());
  }
  await new Promise((r) => setTimeout(r, 350));
  return simulate(params);
}

export async function uploadScan(file: File | null, mode: ApiMode): Promise<{ ok: true }> {
  if (mode === "live" && SANS_API_URL && file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${SANS_API_URL.replace(/\/$/, "")}/v1/scans`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  }
  return { ok: true };
}
