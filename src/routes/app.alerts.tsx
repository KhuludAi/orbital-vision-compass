import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Panel, PageHeader, Segmented, SeverityBadge } from "@/components/sans/ui";
import { useDataset } from "@/lib/sans/store";
import { pageHead } from "@/lib/sans/head";
import { can, useWorkspace } from "@/lib/sans/workspace";
import type { Alert, Severity } from "@/lib/sans/types";

export const Route = createFileRoute("/app/alerts")({
  head: () => pageHead("Alerts", "Filterable SANS, data-integrity, vitals and sync alerts for the simulated mission."),
  component: Alerts,
});

function Alerts() {
  const { data, acked, ack } = useDataset();
  const canAck = can(useWorkspace().role, "ackAlert");
  const [sev, setSev] = useState<"all" | Severity>("all");
  const [cat, setCat] = useState<"all" | Alert["category"]>("all");
  const [showAck, setShowAck] = useState(false);
  const list = data.alerts.filter((a) => (sev === "all" || a.severity === sev) && (cat === "all" || a.category === cat) && (showAck || !acked.has(a.id)));
  return (
    <>
      <PageHeader eyebrow="Event stream" title="Alerts" description="Alerts are generated from estimator thresholds and data-pipeline events. Acknowledging is local to this demo session." />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Segmented label="Severity" value={sev} onChange={setSev} options={[{ value: "all", label: "All" }, { value: "critical", label: "Critical" }, { value: "warning", label: "Warning" }, { value: "info", label: "Info" }]} />
          <Segmented label="Category" value={cat} onChange={setCat} options={[{ value: "all", label: "All" }, { value: "SANS", label: "SANS" }, { value: "Integrity", label: "Integrity" }, { value: "Vitals", label: "Vitals" }, { value: "Sync", label: "Sync" }]} />
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showAck} onChange={(e) => setShowAck(e.target.checked)} className="accent-primary" />Show acknowledged</label>
        </div>
        {list.length ? (
          <ul className="space-y-2">{list.map((a) => (
            <li key={a.id} className={`flex flex-col gap-3 rounded-lg border p-4 transition-all sm:flex-row sm:items-center ${a.severity === "critical" ? "border-destructive/40 bg-destructive/5" : a.severity === "warning" ? "border-warning/30 bg-warning/5" : "border-border/60"} ${acked.has(a.id) ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-2 sm:w-40"><SeverityBadge s={a.severity} /><span className="font-mono text-[10px] text-muted-foreground">{a.category}</span></div>
              <div className="flex-1"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.detail}</p></div>
              <span className="font-mono text-xs text-muted-foreground">D{a.day}</span>
              <button disabled={acked.has(a.id) || !canAck} title={canAck ? undefined : "Read-only in this workspace"} onClick={() => { ack(a.id); toast.success("Alert acknowledged"); }} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/50 hover:text-primary disabled:opacity-40">
                <Check className="h-3 w-3" />{acked.has(a.id) ? "Acked" : "Acknowledge"}
              </button>
            </li>))}</ul>
        ) : <EmptyState title="All clear" body="No alerts match the current filters." />}
      </Panel>
    </>
  );
}
