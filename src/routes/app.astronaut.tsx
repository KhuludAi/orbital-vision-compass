import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader } from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { pageHead } from "@/lib/sans/head";

export const Route = createFileRoute("/app/astronaut")({
  head: () => pageHead("Astronaut Profile", "Pseudonymized simulated crew profile with pre-flight ocular baselines."),
  component: Profile,
});

function Profile() {
  const { data } = useDataset();
  const a = data.astronaut;
  const pct = Math.round((data.currentDay / a.missionLengthDays) * 100);
  const milestones = [{ d: 0, l: "Launch" }, { d: 30, l: "FD30 imaging" }, { d: 90, l: "Mid-mission review" }, { d: 150, l: "FD150 imaging" }, { d: 180, l: "Return" }];
  return (
    <>
      <PageHeader eyebrow="Crew record · pseudonymized" title={`${a.id} — "${a.callsign}"`} description="Fictional crew member generated for this demonstration. No real astronaut identity or medical data is represented." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-1" eyebrow="Profile">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full border border-primary/40 bg-primary/10 font-display text-2xl text-primary shadow-glow">{a.callsign.slice(0, 2)}</div>
            <div><p className="font-display text-xl font-semibold">{a.callsign}</p><p className="text-sm text-muted-foreground">{a.role}</p></div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {[["Age", a.age], ["Prior flights", a.priorFlights], ["Mission", a.mission], ["Duration", `${a.missionLengthDays} d`]].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg border border-border/60 p-2.5"><dt className="eyebrow !text-[9px]">{k}</dt><dd className="mt-1">{v}</dd></div>
            ))}
          </dl>
        </Panel>
        <Panel className="lg:col-span-2" eyebrow="Mission timeline" title={`Day ${data.currentDay} · ${pct}% complete`}>
          <div className="relative mt-6 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-cta shadow-glow" style={{ width: `${pct}%` }} /></div>
          <div className="relative mt-2 h-12">
            {milestones.map((m) => (
              <div key={m.d} className="absolute -translate-x-1/2 text-center" style={{ left: `${(m.d / a.missionLengthDays) * 100}%` }}>
                <div className={`mx-auto h-2 w-2 rounded-full ${m.d <= data.currentDay ? "bg-primary" : "bg-muted-foreground/40"}`} />
                <p className="mt-1 whitespace-nowrap font-mono text-[10px] text-muted-foreground">{m.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Pre-flight ocular baseline</caption>
              <thead><tr className="eyebrow text-left"><th className="py-2 font-normal">Eye</th><th className="font-normal">Baseline RNFL</th><th className="font-normal">Refraction</th><th className="font-normal">Current Δ</th></tr></thead>
              <tbody>{(["OD", "OS"] as const).map((e) => { const k = data.kalman[e].at(-1)!; return (
                <tr key={e} className="border-t border-border/60"><td className="py-2.5 font-mono">{e}</td><td className="tabular-nums">{a.baseline[e]} µm</td><td>{a.refraction[e]}</td><td className="tabular-nums">{k.delta >= 0 ? "+" : ""}{k.delta.toFixed(1)} µm</td></tr>); })}</tbody>
            </table>
          </div>
        </Panel>
        <Panel className="lg:col-span-3" eyebrow="Simulated contextual factors" title="Risk modifiers in this model">
          <div className="grid gap-3 sm:grid-cols-3">
            {[["Model sensitivity", `${a.riskMultiplier.toFixed(2)}×`, "Scales the simulated thickening rate for this fictional crew member."], ["Countermeasures", "Not modelled", "Lower-body negative pressure, thigh cuffs etc. are out of scope."], ["Consent", "Synthetic", "No personal health information is stored or transmitted."]].map(([t, v, d]) => (
              <div key={t} className="rounded-lg border border-border/60 p-3"><p className="eyebrow !text-[9px]">{t}</p><p className="mt-1 font-display text-lg">{v}</p><p className="mt-1 text-xs text-muted-foreground">{d}</p></div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
