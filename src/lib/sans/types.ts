export type Eye = "OD" | "OS";
export type Quality = "good" | "noisy" | "delayed" | "missing";
export type Severity = "info" | "warning" | "critical";
export type ScenarioId = "nominal" | "progressive" | "dataloss" | "blackout";
export type RangeId = 30 | 90 | 180;

export interface Astronaut {
  id: string;
  callsign: string;
  role: string;
  mission: string;
  missionLengthDays: number;
  age: number;
  priorFlights: number;
  baseline: Record<Eye, number>;
  seed: number;
  riskMultiplier: number;
  refraction: Record<Eye, string>;
}

export interface Scan {
  id: string;
  eye: Eye;
  day: number;
  rnfl: number | null;
  signal: number;
  quality: Quality;
  delayDays: number;
  synced: boolean;
  source: "simulated" | "upload";
}

export interface KalmanPoint {
  day: number;
  est: number;
  lo: number;
  hi: number;
  sd: number;
  slope: number;
  obs: number | null;
  quality?: Quality | undefined;
  delta: number;
}

export interface VitalPoint {
  day: number;
  hr: number;
  sys: number;
  dia: number;
  spo2: number;
  glucose: number | null;
}

export interface Alert {
  id: string;
  day: number;
  severity: Severity;
  category: "SANS" | "Integrity" | "Vitals" | "Sync";
  title: string;
  detail: string;
  eye?: Eye;
}

export interface Recommendation {
  eye: Eye;
  day: number;
  minutes: number;
  score: number;
  sdBefore: number;
  sdAfter: number;
  rationale: string;
}

export interface Dataset {
  astronaut: Astronaut;
  scenario: ScenarioId;
  currentDay: number;
  scans: Scan[];
  kalman: Record<Eye, KalmanPoint[]>;
  vitals: VitalPoint[];
  alerts: Alert[];
  generatedAt: string;
}

export interface SimParams {
  astronautId: string;
  scenario: ScenarioId;
  onsetRate: number; // multiplier 0..2
  noise: number; // multiplier 0.5..3
  uploads: Scan[];
  /** Scan ids downlinked during this session (store-and-forward). */
  downlinked?: string[];
}
