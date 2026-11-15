import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, BellRing, CalendarClock, ClipboardCheck, Droplets, HeartPulse, Wind } from "lucide-react";
import { EyeCard } from "@/components/sans/EyeCard";
import { EyeTag, Panel, PageHeader, SourceBadge, Stat } from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { planScans } from "@/lib/sans/planner";
import { eyeSummary } from "@/lib/sans/metrics";
import { EYE } from "@/lib/sans/eyes";
import { pageHead } from "@/lib/sans/head";

export const Route = createFileRoute("/app/me")({
  head: () => pageHead("My Health Dashboard", "Personal eye health, vital signs, OCT scan reminders and daily check-ins for the astronaut workspace."),
  component: MyHealth,
});

function MyHealth() {
  const { data, budget, checkins } = useDataset();
  const a = data.astronaut;
  const recs = useMemo(() => planScans(data, budget).slice().sort((x, y) => x.day - y.day), [data, budget]);
  const next = recs[0];
  const v = data.vitals.at(-1);
  const today = checkins.find((c) => c.day === data.currentDay);
  const inDays = next ? next.day - data.currentDay : null;
  return (
    <>
      <PageHeader eyebrow={`${a.id} · ${a.callsign} · Mission day ${data.currentDay}`} title="My Health Dashboard"
        description="Your own eye and body measurements during the mission. Only your profile is shown in this workspace."
        actions={<SourceBadge source={data.source} />} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" eyebrow="OCT scan reminder" title={next ? `${EYE[next.eye].label} scan ${inDays === 1 ? "tomorrow" : `in ${inDays} days`}` : "No OCT scan needed in the next 14 days"}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-warning/30 bg-warning/10"><BellRing className="h-5 w-5 text-warning" /></span>
            <p className="text-sm text-muted-foreground">{next ? <>Planned for mission day {next.day}, about {next.minutes} minutes. {next.rationale}</> : "Your eye estimates are confident enough that no extra scan is planned right now."}</p>
          </div>
        </Panel>
        <Panel eyebrow="Daily check-in" title={today ? "Completed today" : "Not completed today"}>
          <p className="text-sm text-muted-foreground">{today ? `Wellbeing ${today.wellbeing}/5 · ${today.symptoms.length ? today.symptoms.join(", ") : "no symptoms"}` : "Takes about a minute: how you feel, any vision changes, and sleep."}</p>
          <Link to="/app/checkin" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-cta px-3 py-1.5 text-sm font-medium text-primary-foreground"><ClipboardCheck className="h-4 w-4" />{today ? "View check-in" : "Start check-in"}</Link>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {(["OD", "OS"] as const).map((e) => <EyeCard key={e} s={eyeSummary(data, e)} />)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Heart rate" value={v?.hr ?? "—"} unit="bpm" sub={`Day ${v?.day ?? "—"} average`} icon={<HeartPulse className="h-4 w-4" />} />
        <Stat label="Blood pressure" value={v ? `${v.sys}/${v.dia}` : "—"} unit="mmHg" tone={v && v.sys >= 132 ? "warning" : "default"} sub="cuff" icon={<Droplets className="h-4 w-4" />} />
        <Stat label="Oxygen saturation" value={v?.spo2 ?? "—"} unit="%" sub="pulse oximetry" icon={<Wind className="h-4 w-4" />} />
      </div>

      <Panel className="mt-4" eyebrow="Next 14 days" title="Upcoming scan schedule" action={<Link to="/app/scans" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">My scans<ArrowRight className="h-3 w-3" /></Link>}>
        {recs.length ? (
          <ul className="divide-y divide-border/60">{recs.map((r) => (
            <li key={`${r.eye}-${r.day}`} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="inline-flex w-24 items-center gap-1.5 font-mono text-xs"><CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />Day {r.day}</span>
              <EyeTag eye={r.eye} />
              <span className="ml-auto font-mono text-xs text-muted-foreground">{r.minutes} min</span>
            </li>))}</ul>
        ) : <p className="text-sm text-muted-foreground">No scans scheduled.</p>}
      </Panel>
    </>
  );
}
