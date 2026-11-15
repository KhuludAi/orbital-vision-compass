import { predictSd } from "./kalman";
import { RNFL_WARN } from "./simulate";
import type { Dataset, Eye, Recommendation } from "./types";

export const MINUTES_PER_SCAN = 12;
export const HORIZON_DAYS = 14;
/** Expected estimator SD immediately after a good-quality scan. */
export const POST_SCAN_SD = 1.3;
const EYES: Eye[] = ["OD", "OS"];

const lastPoint = (ds: Dataset, e: Eye) => {
  const point = ds.kalman[e][ds.kalman[e].length - 1];
  if (!point) throw new Error(`No Kalman estimates available for ${e}`);
  return point;
};

/** Risk weight per eye: grows with deviation from baseline and with a rising trend. */
export function eyeRisk(ds: Dataset, e: Eye) {
  const l = lastPoint(ds, e);
  return 1 + Math.max(0, l.delta) / RNFL_WARN + Math.max(0, l.slope) * 30;
}

/** Predicted estimator SD on `day` given planned scan days for that eye. */
export function sdOnDay(ds: Dataset, e: Eye, planned: number[], day: number) {
  const prior = planned.filter((p) => p <= day);
  if (!prior.length) return predictSd(lastPoint(ds, e).sd, day - ds.currentDay);
  return predictSd(POST_SCAN_SD, day - Math.max(...prior));
}

export function planScans(ds: Dataset, budgetMin: number, horizon = HORIZON_DAYS): Recommendation[] {
  const picks: Record<Eye, number[]> = { OD: [], OS: [] };
  const cost = (e: Eye) => eyeRisk(ds, e) * Array.from({ length: horizon }, (_, i) => sdOnDay(ds, e, picks[e], ds.currentDay + 1 + i)).reduce((a, b) => a + b, 0);
  const recs: Recommendation[] = [];
  let used = 0;
  while (used + MINUTES_PER_SCAN <= budgetMin) {
    let best: Recommendation | null = null;
    for (const e of EYES) {
      const base = cost(e);
      for (let i = 1; i <= horizon; i++) {
        const d = ds.currentDay + i;
        if (picks[e].includes(d)) continue;
        const before = sdOnDay(ds, e, picks[e], d);
        picks[e].push(d);
        const gain = base - cost(e);
        picks[e].pop();
        if (!best || gain > best.score) best = { eye: e, day: d, minutes: MINUTES_PER_SCAN, score: gain, sdBefore: before, sdAfter: POST_SCAN_SD, rationale: "" };
      }
    }
    if (!best || best.score < 0.5) break;
    picks[best.eye].push(best.day);
    const l = lastPoint(ds, best.eye);
    best.rationale = l.delta > RNFL_WARN
      ? `Thickness is ${l.delta.toFixed(1)} µm above baseline — tighten surveillance`
      : best.sdBefore > 2 ? `Uncertainty ±${(1.96 * best.sdBefore).toFixed(1)} µm exceeds the ±3.9 µm target` : "Maintain cadence at low marginal cost";
    recs.push(best);
    used += MINUTES_PER_SCAN;
  }
  return recs.sort((a, b) => a.day - b.day);
}

/** Fixed (non-adaptive) schedule: `n` scans alternating eyes, evenly spaced across the horizon. */
export function fixedSchedule(ds: Dataset, n: number, horizon = HORIZON_DAYS): Record<Eye, number[]> {
  const out: Record<Eye, number[]> = { OD: [], OS: [] };
  const counts: Record<Eye, number> = { OD: Math.ceil(n / 2), OS: Math.floor(n / 2) };
  for (const e of EYES) for (let i = 1; i <= counts[e]; i++) out[e].push(ds.currentDay + Math.max(1, Math.round((i * horizon) / (counts[e] + 1))));
  return out;
}

export interface ScheduleScore { scans: number; minutes: number; meanCi: number; riskWeightedCi: number; worstCi: number; perEye: Record<Eye, number> }

/** Score a schedule by the 95% half-width (±µm) it is expected to leave over the horizon. */
export function scoreSchedule(ds: Dataset, picks: Record<Eye, number[]>, horizon = HORIZON_DAYS): ScheduleScore {
  const perEye = {} as Record<Eye, number>;
  let wSum = 0, wTot = 0, worst = 0;
  for (const e of EYES) {
    const ci = Array.from({ length: horizon }, (_, i) => 1.96 * sdOnDay(ds, e, picks[e], ds.currentDay + 1 + i));
    perEye[e] = ci.reduce((a, b) => a + b, 0) / horizon;
    worst = Math.max(worst, ...ci);
    const w = eyeRisk(ds, e);
    wSum += w * perEye[e]; wTot += w;
  }
  const scans = picks.OD.length + picks.OS.length;
  return { scans, minutes: scans * MINUTES_PER_SCAN, meanCi: (perEye.OD + perEye.OS) / 2, riskWeightedCi: wSum / wTot, worstCi: worst, perEye };
}

/** Adaptive vs fixed scheduling with the same number of scans (equal crew time). */
export function compareSchedules(ds: Dataset, budgetMin: number, horizon = HORIZON_DAYS) {
  const recs = planScans(ds, budgetMin, horizon);
  const adaptivePicks: Record<Eye, number[]> = { OD: recs.filter((r) => r.eye === "OD").map((r) => r.day), OS: recs.filter((r) => r.eye === "OS").map((r) => r.day) };
  const fixedPicks = fixedSchedule(ds, recs.length, horizon);
  return { recs, adaptivePicks, fixedPicks, adaptive: scoreSchedule(ds, adaptivePicks, horizon), fixed: scoreSchedule(ds, fixedPicks, horizon), none: scoreSchedule(ds, { OD: [], OS: [] }, horizon) };
}
