/** Concise explanations shown in tooltips next to technical terms. */
export const GLOSSARY = {
  RNFL: "Retinal nerve fiber layer — the innermost retinal layer around the optic disc. Thickening on OCT is one marker associated with optic disc edema in spaceflight.",
  OCT: "Optical coherence tomography — a non-invasive scan that images retinal layers in cross-section and measures their thickness in micrometres (µm).",
  Kalman: "A Kalman filter combines each new measurement with the previous estimate, weighting them by how reliable each is. Noisy scans count less; gaps increase uncertainty.",
  CI: "95% confidence interval — the range the model expects the true thickness to fall within 95% of the time. Wider bands mean less certainty.",
  SSI: "Signal strength index (0–10) reported by the OCT device. Below 6 the measurement is treated as low quality and down-weighted.",
  Baseline: "Average RNFL thickness measured before flight. All changes are reported relative to it.",
  Delta: "Change from pre-flight baseline, in micrometres (µm). Positive values mean thickening.",
  Uncertainty: "The 95% half-width of the estimate (±µm). It shrinks after a good scan and grows the longer an eye goes unscanned.",
  Raw: "The thickness value reported by an individual OCT scan, before filtering.",
  Downlink: "Transfer of data captured onboard to the ground team. Scans not yet downlinked are not included in ground estimates.",
  AOS: "Acquisition of signal — the spacecraft has a communication link with the ground.",
  LOS: "Loss of signal — no communication link; data is stored onboard until the link returns.",
  SANS: "Spaceflight-associated neuro-ocular syndrome — eye and optic-nerve changes observed in some astronauts during long-duration flight.",
} as const;
export type Term = keyof typeof GLOSSARY;
