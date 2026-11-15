import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Panel, PageHeader, Segmented, SourceBadge } from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { can, useWorkspace } from "@/lib/sans/workspace";
import { pageHead } from "@/lib/sans/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/checkin")({
  head: () => pageHead("Daily Check-in", "Daily astronaut wellbeing, vision symptom and sleep check-in."),
  component: CheckinPage,
});

const SYMPTOMS = ["Blurred near vision", "Headache", "Eye pressure or pain", "Facial puffiness", "Dizziness"];

function CheckinPage() {
  const { data, checkins, addCheckin } = useDataset();
  const { role } = useWorkspace();
  const allowed = can(role, "dailyCheckin");
  const done = checkins.some((c) => c.day === data.currentDay);
  const [wellbeing, setWellbeing] = useState(4);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [sleep, setSleep] = useState(7);
  const [notes, setNotes] = useState("");
  const toggle = (s: string) => setSymptoms((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowed || done) return;
    addCheckin({ day: data.currentDay, at: new Date().toISOString(), wellbeing, symptoms, sleepHours: sleep, notes: notes.trim().slice(0, 500) });
    toast.success("Check-in saved", { description: "Stored for this session only — not sent anywhere." });
  };
  return (
    <>
      <PageHeader eyebrow={`${data.astronaut.callsign} · Mission day ${data.currentDay}`} title="Daily Check-in" description="A short daily self-report. Vision symptoms help mission medical staff decide when an extra OCT scan is useful." actions={<SourceBadge source={data.source} />} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" eyebrow={done ? "Completed" : "Today"} title={done ? "Today's check-in is complete" : "How are you today?"}>
          {!allowed && <p className="mb-4 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" />Read-only: only the astronaut can submit a check-in.</p>}
          <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={!allowed || done} className="space-y-5 disabled:opacity-60">
              <div><p className="mb-2 text-sm">Overall wellbeing</p>
                <Segmented label="Overall wellbeing" value={wellbeing} onChange={setWellbeing} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} />
                <p className="mt-1 text-xs text-muted-foreground">1 = very unwell · 5 = excellent</p></div>
              <div><p className="mb-2 text-sm">Any of these since yesterday?</p>
                <div className="flex flex-wrap gap-2">{SYMPTOMS.map((s) => (
                  <button type="button" key={s} onClick={() => toggle(s)} aria-pressed={symptoms.includes(s)} className={cn("rounded-full border px-3 py-1 text-xs transition-colors", symptoms.includes(s) ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>{s}</button>))}
                </div></div>
              <label className="block text-sm">Hours of sleep
                <input type="number" min={0} max={14} step={0.5} value={sleep} onChange={(e) => setSleep(Math.min(14, Math.max(0, Number(e.target.value) || 0)))} className="mt-2 block w-28 rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="block text-sm">Notes (optional)
                <textarea maxLength={500} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 block w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <button type="submit" className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Submit check-in</button>
            </fieldset>
          </form>
        </Panel>
        <Panel eyebrow="This session" title="Previous check-ins">
          {checkins.length ? <ul className="space-y-2">{checkins.map((c) => (
            <li key={c.at} className="rounded-md border border-border/60 p-3 text-xs"><p className="font-mono">Day {c.day} · wellbeing {c.wellbeing}/5 · {c.sleepHours} h sleep</p><p className="mt-1 text-muted-foreground">{c.symptoms.length ? c.symptoms.join(", ") : "No symptoms"}</p></li>))}</ul>
            : <p className="text-sm text-muted-foreground">No check-ins yet.</p>}
        </Panel>
      </div>
    </>
  );
}
