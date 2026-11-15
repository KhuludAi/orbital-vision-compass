import type { KalmanPoint, Quality, Scan } from "./types";

export const MEAS_SD: Record<Quality, number> = { good: 1.4, delayed: 1.6, noisy: 4.2, missing: Infinity };
export const Q_LEVEL = 0.02; // µm² / day
export const Q_SLOPE = 0.00004;

/** Local linear trend Kalman filter run daily over the mission. */
export function runKalman(scans: Scan[], baseline: number, days: number): KalmanPoint[] {
  const byDay = new Map<number, Scan[]>();
  for (const s of scans) if (s.rnfl != null && s.quality !== "missing" && s.synced) {
    const arr = byDay.get(s.day) ?? [];
    arr.push(s);
    byDay.set(s.day, arr);
  }
  let x0 = baseline, x1 = 0;
  let p00 = 2, p01 = 0, p11 = 0.0004;
  const out: KalmanPoint[] = [];
  for (let d = 0; d <= days; d++) {
    if (d > 0) {
      x0 = x0 + x1;
      const n00 = p00 + 2 * p01 + p11 + Q_LEVEL;
      const n01 = p01 + p11;
      const n11 = p11 + Q_SLOPE;
      p00 = n00; p01 = n01; p11 = n11;
    }
    let obs: number | null = null;
    let quality: Quality | undefined;
    for (const s of byDay.get(d) ?? []) {
      if (s.rnfl == null) continue;
      const r = MEAS_SD[s.quality] ** 2 * (s.signal < 6 ? 1.8 : 1);
      const y = s.rnfl - x0;
      const S = p00 + r;
      const k0 = p00 / S, k1 = p01 / S;
      x0 += k0 * y; x1 += k1 * y;
      const n00 = (1 - k0) * p00;
      const n01 = (1 - k0) * p01;
      const n11 = p11 - k1 * p01;
      p00 = n00; p01 = n01; p11 = n11;
      obs = s.rnfl; quality = s.quality;
    }
    const sd = Math.sqrt(Math.max(p00, 1e-6));
    out.push({ day: d, est: x0, lo: x0 - 1.96 * sd, hi: x0 + 1.96 * sd, sd, slope: x1, obs, quality, delta: x0 - baseline });
  }
  return out;
}

/** Predicted level SD after `gap` days with no measurement. */
export function predictSd(sd: number, gap: number) {
  return Math.sqrt(sd * sd + Q_LEVEL * gap + Q_SLOPE * gap * gap * gap / 3);
}
