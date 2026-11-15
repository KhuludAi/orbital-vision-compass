import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { Panel, PageHeader } from "@/components/sans/ui";
import { pageHead } from "@/lib/sans/head";

export const Route = createFileRoute("/app/evidence")({
  head: () => pageHead("Scientific Evidence", "Background literature on SANS and the estimation methods used by the prototype."),
  component: Evidence,
});

const refs = [
  { tag: "Clinical observation", cite: "Mader TH, et al. Ophthalmology. 2011.", title: "Optic disc edema, globe flattening, choroidal folds, and hyperopic shifts observed in astronauts after long-duration space flight.", why: "Early case series describing the ocular findings later grouped under SANS." },
  { tag: "OCT changes", cite: "Macias BR, et al. JAMA Ophthalmology. 2020.", title: "Association of long-duration spaceflight with anterior and posterior ocular structure changes in astronauts and their recovery.", why: "Reports in-flight and post-flight OCT structural changes, motivating longitudinal per-eye tracking." },
  { tag: "Programmatic", cite: "NASA Human Research Program.", title: "Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS).", why: "SANS is tracked as a recognised human-health risk for exploration missions." },
  { tag: "Method", cite: "Kalman RE. J. Basic Engineering. 1960.", title: "A new approach to linear filtering and prediction problems.", why: "Foundation of the recursive state estimator used to fuse noisy, irregular OCT measurements." },
];

function Evidence() {
  return (
    <>
      <PageHeader eyebrow="Background" title="Scientific Evidence" description="Context sources that informed the design. Summaries are paraphrased — consult the original publications. No result in this app is derived from real astronaut data." />
      <div className="grid gap-4 md:grid-cols-2">{refs.map((r) => (
        <Panel key={r.title}><div className="flex items-start gap-3"><BookOpen className="mt-1 h-4 w-4 shrink-0 text-primary" /><div><p className="eyebrow text-primary">{r.tag}</p><p className="mt-2 font-display text-base">{r.title}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{r.cite}</p><p className="mt-3 text-sm text-muted-foreground">{r.why}</p></div></div></Panel>))}
      </div>
      <Panel className="mt-4" eyebrow="What is novel here" title="Prototype contributions (unvalidated)">
        <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
          <li className="rounded-lg border border-border/60 p-3">Uncertainty-aware per-eye estimation tolerant to missing and noisy scans.</li>
          <li className="rounded-lg border border-border/60 p-3">Risk-weighted OCT scheduling under a fixed crew-time budget.</li>
          <li className="rounded-lg border border-border/60 p-3">Offline-first data flow suited to intermittent deep-space communication.</li>
        </ul>
      </Panel>
    </>
  );
}
