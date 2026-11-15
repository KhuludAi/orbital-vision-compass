import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useDataset } from "@/lib/sans/store";
import { SCENARIOS } from "@/lib/sans/simulate";
import { uploadScan } from "@/lib/sans/api";
import { useLiveProbe } from "@/lib/sans/live";
import { can, useWorkspace } from "@/lib/sans/workspace";
import { Panel, PageHeader, Segmented, SourceBadge } from "@/components/sans/ui";
import { pageHead } from "@/lib/sans/head";
import { cn } from "@/lib/utils";
import type { Eye, ScenarioId } from "@/lib/sans/types";

export const Route = createFileRoute("/app/demo")({
  head: () => pageHead("Interactive Demo", "Drive SANSIGHT scenarios, noise and simulated OCT uploads."),
  component: Demo,
});

function Demo() {
  const s = useDataset();
  const { role } = useWorkspace();
  const live = useLiveProbe();
  const canScenario = can(role, "changeScenario"), canUpload = can(role, "uploadScan"), canBudget = can(role, "manageSchedule"), canSource = can(role, "switchSource");
  const [eye, setEye] = useState<Eye>("OD");
  const [val, setVal] = useState(106);
  const [prog, setProg] = useState<number | null>(null);
  const upload = async (file: File | null) => {
    if (!canUpload) return;
    setProg(10);
    try {
      await uploadScan(file, s.mode);
      for (const p of [40, 70, 100]) { await new Promise((r) => setTimeout(r, 250)); setProg(p); }
      const day = s.data.currentDay;
      s.addUpload({ id: `${s.astronautId}-${eye}-U${s.uploads.length + 1}`, eye, day, rnfl: val, signal: 8.6, quality: "good", delayDays: 0, synced: true, source: "upload" });
      toast.success(`${eye} scan ingested`, { description: `RNFL ${val} µm on day ${day} — estimator updated.` });
    } catch (e) { toast.error((e as Error).message); }
    setTimeout(() => setProg(null), 600);
  };
  return (
    <>
      <PageHeader eyebrow="Judge sandbox" title="Interactive Demo" description="Change the scenario and watch every page respond: estimates, alerts, schedule and sync." actions={<button onClick={() => { s.reset(); toast("Demo reset"); }} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Reset</button>} />
      <div className="grid gap-3 md:grid-cols-4">{(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
        <button key={id} disabled={!canScenario} onClick={() => s.setScenario(id)} aria-pressed={s.scenario === id} className={cn("panel p-4 text-left transition-all hover:-translate-y-0.5", s.scenario === id && "shadow-glow")}>
          <p className="eyebrow text-primary">Scenario</p><p className="mt-1 font-display text-lg">{SCENARIOS[id].label}</p><p className="mt-1 text-xs text-muted-foreground">{SCENARIOS[id].blurb}</p>
        </button>))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel eyebrow="Physiology" title="Model controls">
          <p className="text-sm">Thickening rate × {s.onsetRate.toFixed(1)}</p><Slider className="mt-2" value={[s.onsetRate]} min={0} max={2} step={0.1} onValueChange={([v]) => { if (v !== undefined) s.setOnsetRate(v); }} aria-label="Thickening rate" disabled={!canScenario} />
          <p className="mt-5 text-sm">Measurement noise × {s.noise.toFixed(1)}</p><Slider className="mt-2" value={[s.noise]} min={0.5} max={3} step={0.1} onValueChange={([v]) => { if (v !== undefined) s.setNoise(v); }} aria-label="Noise" disabled={!canScenario} />
          <p className="mt-5 text-sm">Crew budget {s.budget} min</p><Slider className="mt-2" value={[s.budget]} min={0} max={180} step={12} onValueChange={([v]) => { if (v !== undefined) s.setBudget(v); }} aria-label="Budget" disabled={!canBudget} />
        </Panel>
        <Panel eyebrow="Simulated upload" title="Ingest an OCT scan">
          {!canUpload && <p className="mb-3 text-xs text-muted-foreground">Read-only: uploads are disabled in the Viewer workspace.</p>}
          <fieldset disabled={!canUpload} className="disabled:opacity-60">
          <Segmented label="Eye" value={eye} onChange={setEye} options={[{ value: "OD", label: "OD" }, { value: "OS", label: "OS" }]} />
          <p className="mt-4 text-sm">RNFL {val} µm</p><Slider className="mt-2" value={[val]} min={85} max={125} step={1} onValueChange={([v]) => { if (v !== undefined) setVal(v); }} aria-label="RNFL value" />
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-primary/40 p-4 text-center text-xs text-muted-foreground hover:bg-primary/5">
            <Upload className="h-5 w-5 text-primary" />Drop a file (any file; contents not read in demo) or<input type="file" className="sr-only" onChange={(e) => upload(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={() => upload(null)} disabled={prog != null} className="mt-3 w-full rounded-md bg-cta py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Simulate upload</button>
          {prog != null && <Progress value={prog} className="mt-3" aria-label="Upload progress" />}
          </fieldset>
        </Panel>
        <Panel eyebrow="Data source" title="API adapter">
          <SourceBadge source={s.data.source} />
          {live.verified && canSource && <Segmented className="mt-4" label="Mode" value={s.mode} onChange={s.setMode} options={[{ value: "demo", label: "Demo" }, { value: "live", label: "Live" }]} />}
          <p className="mt-4 text-xs text-muted-foreground">{live.verified ? "A verified live backend is connected." : live.configured ? "The configured backend could not be verified, so demo data is used." : "No verified live data source is connected, so demo data is used automatically."}</p>
          <p className="mt-2 text-xs text-muted-foreground">Demo and live measurements are never shown together.</p>
        </Panel>
      </div>
    </>
  );
}
