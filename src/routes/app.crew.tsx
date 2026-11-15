import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { EyeTag, LoadingState, Panel, PageHeader, SourceBadge } from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { fetchDataset } from "@/lib/sans/api";
import { ASTRONAUTS } from "@/lib/sans/simulate";
import { STATUS_META, eyeSummary, signed } from "@/lib/sans/metrics";
import { pageHead } from "@/lib/sans/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/crew")({
  head: () => pageHead("Crew Overview", "Per-eye RNFL status and open alerts for every crew member."),
  component: Crew,
});

function Crew() {
  const s = useDataset();
  const navigate = useNavigate();
  // Every crew record is loaded from the same source as the current view, so demo and live never mix.
  const source = s.data.source;
  const results = useQueries({ queries: ASTRONAUTS.map((a) => ({
    queryKey: ["sans-crew", a.id, s.scenario, s.onsetRate, s.noise, source],
    queryFn: () => fetchDataset({ astronautId: a.id, scenario: s.scenario, onsetRate: s.onsetRate, noise: s.noise, uploads: [] }, source),
    retry: false,
  })) });
  const open = (id: string) => { s.setAstronautId(id); void navigate({ to: "/app/astronaut" }); };
  return (
    <>
      <PageHeader eyebrow="All crew members" title="Crew Overview" description="Status of each eye for every crew member. Open a profile to review it in detail." />
      <div className="grid gap-4 lg:grid-cols-3">
        {results.map((r, i) => {
          const a = ASTRONAUTS[i];
          if (!a) return null;
          if (r.error) return <Panel key={a.id} title={a.callsign}><p className="text-sm text-destructive">{(r.error as Error).message}</p></Panel>;
          if (!r.data) return <Panel key={a.id}><LoadingState /></Panel>;
          const d = r.data;
          const alerts = d.alerts.filter((x) => x.severity !== "info" && !s.acked.has(x.id)).length;
          return (
            <Panel key={a.id} className={cn(a.id === s.astronautId && "border-primary/40")} eyebrow={`${a.id} · ${a.role}`} title={a.callsign} action={<SourceBadge source={d.source} />}>
              <ul className="space-y-3">{(["OD", "OS"] as const).map((e) => { const m = eyeSummary(d, e); const st = STATUS_META[m.status]; return (
                <li key={e} className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
                  <div><EyeTag eye={e} /><p className={cn("mt-1 text-xs", st.text)}>{st.label}</p></div>
                  <span className={cn("font-mono text-lg tabular-nums", st.text)}>{signed(m.delta)}<span className="ml-1 text-xs text-muted-foreground">µm</span></span>
                </li>); })}</ul>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{alerts ? `${alerts} open alert${alerts > 1 ? "s" : ""}` : "No open alerts"}</span>
                <button onClick={() => open(a.id)} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-foreground hover:border-primary/50 hover:text-primary">Open profile<ArrowRight className="h-3 w-3" /></button>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
