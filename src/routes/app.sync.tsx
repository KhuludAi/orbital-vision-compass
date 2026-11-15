import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CloudOff, RefreshCcw, Satellite } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { EmptyState, Panel, PageHeader, Stat } from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { pageHead } from "@/lib/sans/head";

export const Route = createFileRoute("/app/sync")({
  head: () => pageHead("Offline Sync", "Store-and-forward downlink queue for OCT data captured during communication gaps."),
  component: Sync,
});

function Sync() {
  const { data } = useDataset();
  const queue = data.scans.filter((s) => !s.synced);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>(["AOS acquired · TDRS link nominal (simulated)"]);
  const pending = queue.filter((s) => !done.has(s.id));
  const run = () => {
    if (!pending.length) return;
    setProgress(0);
    let i = 0;
    const t = setInterval(() => {
      const s = pending[i];
      if (!s) { clearInterval(t); setProgress(null); return; }
      setDone((d) => new Set(d).add(s.id));
      setLog((l) => [`Downlinked ${s.id} · ${(2.4 + (i % 3) * 0.6).toFixed(1)} MB`, ...l]);
      i++;
      setProgress(Math.round((i / pending.length) * 100));
      if (i >= pending.length) { clearInterval(t); toast.success("Queue drained", { description: "Ground estimates will refresh on next model run." }); setTimeout(() => setProgress(null), 800); }
    }, 450);
  };
  return (
    <>
      <PageHeader eyebrow="Store and forward" title="Offline Sync" description="Scans acquired onboard during loss of signal are cached locally and downlinked when the link returns. Try the Comms blackout scenario in the Interactive Demo." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Queued" value={pending.length} tone={pending.length ? "warning" : "success"} icon={<CloudOff className="h-4 w-4" />} />
        <Stat label="Synced this session" value={done.size} icon={<RefreshCcw className="h-4 w-4" />} />
        <Stat label="Link" value="AOS" sub="simulated" tone="success" icon={<Satellite className="h-4 w-4" />} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel eyebrow="Onboard cache" title="Downlink queue" action={<button onClick={run} disabled={!pending.length || progress != null} className="rounded-md bg-cta px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40">Sync now</button>}>
          {progress != null && <Progress value={progress} className="mb-3" aria-label="Sync progress" />}
          {queue.length ? <ul className="space-y-1.5">{queue.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 font-mono text-xs">
              <span>{s.id}</span><span className={done.has(s.id) ? "text-success" : "text-warning"}>{done.has(s.id) ? "synced" : "queued"}</span>
            </li>))}</ul> : <EmptyState title="Nothing queued" body="All scans have reached ground. Switch to the Comms blackout scenario to simulate a backlog." />}
        </Panel>
        <Panel eyebrow="Link log" title="Events">
          <ul className="max-h-72 space-y-1 overflow-auto font-mono text-xs text-muted-foreground" aria-live="polite">{log.map((l, i) => <li key={i}><span className="text-primary">›</span> {l}</li>)}</ul>
        </Panel>
      </div>
    </>
  );
}
