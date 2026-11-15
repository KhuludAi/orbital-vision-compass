import type { Eye } from "./types";

/** Single source of truth for eye naming and colour. Right eye (OD) is always cyan, left eye (OS) always mint. */
export const EYE: Record<Eye, { side: string; label: string; upper: string; latin: string; text: string; bg: string; border: string; soft: string; color: string }> = {
  OD: { side: "Right eye", label: "Right Eye (OD)", upper: "RIGHT EYE (OD)", latin: "oculus dexter", text: "text-od", bg: "bg-od", border: "border-od/40", soft: "bg-od/10", color: "var(--chart-od)" },
  OS: { side: "Left eye", label: "Left Eye (OS)", upper: "LEFT EYE (OS)", latin: "oculus sinister", text: "text-os", bg: "bg-os", border: "border-os/40", soft: "bg-os/10", color: "var(--chart-os)" },
};
export const EYES: Eye[] = ["OD", "OS"];
export const eyeLabel = (e: Eye) => EYE[e].label;
