import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Panel, PageHeader } from "@/components/sans/ui";
import { RNFL_CRIT, RNFL_WARN } from "@/lib/sans/simulate";
import { pageHead } from "@/lib/sans/head";

export const Route = createFileRoute("/app/guidance")({
  head: () => pageHead("Clinical Guidance", "How SANSIGHT's research thresholds map to suggested review steps — not clinical protocol."),
  component: Guidance,
});

const tiers = [
  { t: "Green", c: "border-success/40 text-success", r: `Δ RNFL < ${RNFL_WARN} µm`, a: "Continue routine cadence. Planner optimises for uncertainty only." },
  { t: "Amber", c: "border-warning/40 text-warning", r: `Δ ${RNFL_WARN}–${RNFL_CRIT} µm or rising trend`, a: "Increase OCT frequency; flag for flight-surgeon remote review; check scan quality first." },
  { t: "Red", c: "border-destructive/40 text-destructive", r: `Lower 95% CI > ${RNFL_CRIT} µm`, a: "Escalate for expert ophthalmic review per mission medical operations. SANSIGHT does not issue clinical orders." },
];

function Guidance() {
  return (
    <>
      <PageHeader eyebrow="Decision support · research only" title="Clinical Guidance" description="Illustrative escalation logic used by this prototype. Thresholds are hypothetical and have not been clinically validated." />
      <div className="panel mb-4 flex gap-3 border-warning/30 p-4 text-sm"><AlertTriangle className="h-5 w-5 shrink-0 text-warning" /><p>Not a medical device. Real crew health decisions are made by qualified flight surgeons and ophthalmologists using validated protocols.</p></div>
      <div className="grid gap-4 md:grid-cols-3">{tiers.map((x) => (
        <Panel key={x.t} className={`border ${x.c.split(" ")[0]}`}><p className={`eyebrow ${x.c.split(" ")[1]}`}>{x.t} tier</p><p className="mt-2 font-display text-lg">{x.r}</p><p className="mt-2 text-sm text-muted-foreground">{x.a}</p></Panel>))}
      </div>
      <Panel className="mt-4" eyebrow="FAQ" title="How to read the system">
        <Accordion type="single" collapsible>
          {([["Why RNFL thickness?", "Peripapillary RNFL thickening on OCT is one documented marker associated with optic disc edema in long-duration spaceflight. It is one of several SANS findings (others include globe flattening, choroidal folds and refractive shifts)."],
            ["Why per eye?", "SANS findings are frequently asymmetric, so OD and OS are filtered and scheduled independently."],
            ["What does the confidence band mean?", "The 95% interval of the Kalman state estimate. It widens between scans and when measurements are noisy, and shrinks after high-quality scans."],
            ["Can this replace an ophthalmologist?", "No. It is a research visualisation demonstrating how uncertainty-aware scheduling could help prioritise limited crew time."]] as const).map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>))}
        </Accordion>
      </Panel>
    </>
  );
}
