import { RNFL_CRIT, RNFL_WARN } from "./simulate";
import type { Dataset, Eye, Scan } from "./types";

export type EyeStatus = "nominal" | "elevated" | "review";
export type Trend = "rising" | "stable" | "falling";
export type Confidence = "High" | "Moderate" | "Low";

export interface EyeSummary {
  eye: Eye; baseline: number; estimate: number; delta: number; ci: number; lo: number; hi: number;
  slope30: number; trend: Trend; status: EyeStatus; confidence: Confidence;
  lastScan?: Scan | undefined; latestRaw: number | null; daysSinceScan: number | null; usable: number; total: number;
}

export function confidenceOf(ci: number): Confidence {
  return ci < 2.5 ? "High" : ci < 4 ? "Moderate" : "Low";
}

/** Plain-language per-eye summary derived from the Kalman output and the scan log. */
export function eyeSummary(ds: Dataset, eye: Eye): EyeSummary {
  const k = ds.kalman[eye];
  const last = k[k.length - 1];
  if (!last) throw new Error(`No Kalman estimates available for ${eye}`);
  const baseline = ds.astronaut.baseline[eye];
  const scans = ds.scans.filter((s) => s.eye === eye);
  const measured = scans.filter((s) => s.rnfl != null && s.synced);
  const lastScan = measured[measured.length - 1];
  const ci = 1.96 * last.sd;
  const slope30 = last.slope * 30;
  const status: EyeStatus = last.lo - baseline > RNFL_CRIT ? "review" : last.delta > RNFL_WARN && last.lo > baseline ? "elevated" : "nominal";
  return {
    eye, baseline, estimate: last.est, delta: last.delta, ci, lo: last.lo, hi: last.hi, slope30,
    trend: slope30 > 0.3 ? "rising" : slope30 < -0.3 ? "falling" : "stable",
    status, confidence: confidenceOf(ci), lastScan, latestRaw: lastScan?.rnfl ?? null,
    daysSinceScan: lastScan ? ds.currentDay - lastScan.day : null,
    usable: scans.filter((s) => s.quality !== "missing").length, total: scans.length,
  };
}

export const STATUS_META: Record<EyeStatus, { label: string; tone: "success" | "warning" | "critical"; text: string }> = {
  nominal: { label: "Within expected range", tone: "success", text: "text-success" },
  elevated: { label: "Thickening above baseline", tone: "warning", text: "text-warning" },
  review: { label: "Review recommended", tone: "critical", text: "text-destructive" },
};

export const signed = (v: number, d = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(d)}`;
