import { runKalman } from "./kalman";
import { EYE } from "./eyes";
import type { Alert, Astronaut, Dataset, Eye, Quality, Scan, ScenarioId, SimParams, VitalPoint } from "./types";

export const ASTRONAUTS: Astronaut[] = [
  { id: "ASTRO001", callsign: "ORION", role: "Flight Engineer", mission: "Simulated LEO Increment A", missionLengthDays: 180, age: 44, priorFlights: 1, baseline: { OD: 98.4, OS: 96.9 }, seed: 11, riskMultiplier: 1, refraction: { OD: "-0.50 D", OS: "-0.75 D" } },
  { id: "ASTRO002", callsign: "VEGA", role: "Mission Specialist", mission: "Simulated LEO Increment A", missionLengthDays: 180, age: 39, priorFlights: 0, baseline: { OD: 101.2, OS: 100.6 }, seed: 23, riskMultiplier: 0.55, refraction: { OD: "+0.25 D", OS: "Plano" } },
  { id: "ASTRO003", callsign: "LYRA", role: "Commander", mission: "Simulated LEO Increment A", missionLengthDays: 180, age: 51, priorFlights: 2, baseline: { OD: 94.7, OS: 95.3 }, seed: 37, riskMultiplier: 1.35, refraction: { OD: "+0.75 D", OS: "+0.50 D" } },
];

export const SCENARIOS: Record<ScenarioId, { label: string; blurb: string; rate: number; missing: number; noisy: number; delayed: number; blackoutDays: number }> = {
  nominal: { label: "Nominal flight", blurb: "Stable RNFL, routine cadence, clean data.", rate: 0.004, missing: 0.04, noisy: 0.06, delayed: 0.04, blackoutDays: 0 },
  progressive: { label: "Progressive SANS", blurb: "Gradual peripapillary RNFL thickening after ~day 40.", rate: 0.075, missing: 0.05, noisy: 0.08, delayed: 0.06, blackoutDays: 0 },
  dataloss: { label: "Degraded data", blurb: "Missing, delayed and noisy scans stress the estimator.", rate: 0.05, missing: 0.25, noisy: 0.28, delayed: 0.18, blackoutDays: 0 },
  blackout: { label: "Comms blackout", blurb: "Recent scans captured onboard but not yet downlinked.", rate: 0.05, missing: 0.05, noisy: 0.08, delayed: 0.06, blackoutDays: 24 },
};

export const CURRENT_DAY = 168;
export const RNFL_WARN = 5;
export const RNFL_CRIT = 10;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
}

export function truthRnfl(a: Astronaut, scenario: ScenarioId, eye: Eye, day: number, onsetRate: number) {
  const s = SCENARIOS[scenario];
  const onset = 40;
  const eyeFactor = eye === "OD" ? 1 : 0.72;
  const growth = day > onset ? s.rate * onsetRate * a.riskMultiplier * eyeFactor * (day - onset) : 0;
  return a.baseline[eye] + growth + 0.3 * Math.sin(day / 17 + (eye === "OD" ? 0 : 1));
}

export function simulate(p: SimParams): Dataset {
  const a = ASTRONAUTS.find((x) => x.id === p.astronautId) ?? ASTRONAUTS[0];
  if (!a) throw new Error("No simulated astronauts configured");
  const s = SCENARIOS[p.scenario];
  const r = rng(a.seed * 97 + Object.keys(SCENARIOS).indexOf(p.scenario) * 13);
  const scans: Scan[] = [];
  (["OD", "OS"] as Eye[]).forEach((eye, ei) => {
    for (let day = ei; day <= CURRENT_DAY; day += 10) {
      const u = r();
      let quality: Quality = "good";
      if (day > 5) {
        if (u < s.missing) quality = "missing";
        else if (u < s.missing + s.noisy * Math.min(1.5, p.noise)) quality = "noisy";
        else if (u < s.missing + s.noisy + s.delayed) quality = "delayed";
      }
      const delayDays = quality === "delayed" ? 2 + Math.floor(r() * 5) : 0;
      const sd = (quality === "noisy" ? 4 : 1.2) * p.noise;
      const rnfl = quality === "missing" ? null : +(truthRnfl(a, p.scenario, eye, day, p.onsetRate) + gauss(r) * sd).toFixed(1);
      const signal = quality === "missing" ? 0 : quality === "noisy" ? +(4 + r() * 2).toFixed(1) : +(7.2 + r() * 2.6).toFixed(1);
      const id = `${a.id}-${eye}-D${String(day).padStart(3, "0")}`;
      scans.push({ id, eye, day: day + delayDays, rnfl, signal, quality, delayDays, synced: day < CURRENT_DAY - s.blackoutDays || !!p.downlinked?.includes(id), source: "simulated" });
    }
  });
  for (const u of p.uploads) if (u.id.startsWith(a.id)) scans.push(u);
  scans.sort((x, y) => x.day - y.day);

  const kalman = {
    OD: runKalman(scans.filter((x) => x.eye === "OD"), a.baseline.OD, CURRENT_DAY),
    OS: runKalman(scans.filter((x) => x.eye === "OS"), a.baseline.OS, CURRENT_DAY),
  };

  const vitals: VitalPoint[] = [];
  const vr = rng(a.seed + 5);
  for (let d = 0; d <= CURRENT_DAY; d++) {
    const fluid = Math.min(1, d / 30);
    vitals.push({
      day: d,
      hr: Math.round(64 + 4 * Math.sin(d / 9) + gauss(vr) * 3 - fluid * 2),
      sys: Math.round(116 + fluid * 4 + gauss(vr) * 4 + (p.scenario === "progressive" && d > 120 ? 6 : 0)),
      dia: Math.round(74 + fluid * 3 + gauss(vr) * 3),
      spo2: +(97.6 + gauss(vr) * 0.5).toFixed(1),
      glucose: d % 30 === 0 ? Math.round(92 + gauss(vr) * 6) : null,
    });
  }

  const alerts = buildAlerts(scans, kalman, vitals, p.scenario);
  return { astronaut: a, scenario: p.scenario, currentDay: CURRENT_DAY, scans, kalman, vitals, alerts, generatedAt: "simulated" };
}

function buildAlerts(scans: Scan[], kalman: Dataset["kalman"], vitals: VitalPoint[], scenario: ScenarioId): Alert[] {
  const out: Alert[] = [];
  (["OD", "OS"] as Eye[]).forEach((eye) => {
    let level = 0;
    for (const k of kalman[eye]) {
      const lvl = k.lo - (k.est - k.delta) > RNFL_CRIT ? 2 : k.delta > RNFL_WARN && k.lo > k.est - k.delta ? 1 : 0;
      if (lvl > level) {
        out.push({ id: `sans-${eye}-${k.day}`, day: k.day, eye, category: "SANS", severity: lvl === 2 ? "critical" : "warning",
          title: lvl === 2 ? `${EYE[eye].label}: RNFL more than ${RNFL_CRIT} µm above baseline` : `${EYE[eye].label}: RNFL trending above baseline`,
          detail: `Estimated change +${k.delta.toFixed(1)} µm from pre-flight baseline (95% CI ${(k.lo - (k.est - k.delta)).toFixed(1)} to ${(k.hi - (k.est - k.delta)).toFixed(1)} µm).` });
        level = lvl;
      }
    }
  });
  for (const s of scans) {
    if (s.quality === "missing") out.push({ id: `miss-${s.id}`, day: s.day, eye: s.eye, category: "Integrity", severity: "warning", title: `${EYE[s.eye].label}: scan missed`, detail: `The OCT scheduled for mission day ${s.day} produced no usable measurement, so the estimate for this eye could not update.` });
    if (s.quality === "noisy") out.push({ id: `noisy-${s.id}`, day: s.day, eye: s.eye, category: "Integrity", severity: "info", title: `${EYE[s.eye].label}: low signal strength`, detail: `Signal strength ${s.signal}/10 (below 6). The measurement was used but given less weight.` });
    if (s.quality === "delayed") out.push({ id: `delay-${s.id}`, day: s.day, eye: s.eye, category: "Integrity", severity: "info", title: `${EYE[s.eye].label}: scan ${s.delayDays} days late`, detail: `Captured ${s.delayDays} days after plan; the longer gap temporarily widened uncertainty.` });
  }
  const unsynced = scans.filter((s) => !s.synced).length;
  if (unsynced) out.push({ id: "sync-backlog", day: CURRENT_DAY, category: "Sync", severity: unsynced > 3 ? "warning" : "info", title: `${unsynced} scans awaiting downlink`, detail: "Captured and stored onboard, but not yet received on the ground — ground estimates do not include them yet." });
  for (const v of vitals) if (v.sys >= 132) out.push({ id: `bp-${v.day}`, day: v.day, category: "Vitals", severity: "info", title: `Systolic blood pressure ${v.sys} mmHg`, detail: "Above the 132 mmHg context threshold. Shown as physiological context only — not used in eye estimates." });
  void scenario;
  return out.sort((a, b) => b.day - a.day);
}
