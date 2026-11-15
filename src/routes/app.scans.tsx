import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyState, Panel, PageHeader, QualityBadge } from "@/components/sans/ui";
import { OctView } from "@/components/sans/OctView";
import { useDataset } from "@/lib/sans/store";
import { pageHead } from "@/lib/sans/head";
import { cn } from "@/lib/utils";
import type { Eye, Scan } from "@/lib/sans/types";

export const Route = createFileRoute("/app/scans")({
  head: () => pageHead("OCT Eye Scans", "Separate right (OD) and left (OS) eye OCT scan histories with quality flags."),
  component: Scans,
});

function EyeColumn({ eye, scans }: { eye: Eye; scans: Scan[] }) {
  const usable = scans.filter((s) => s.rnfl != null);
  const [sel, setSel] = useState<string | undefined>(usable.at(-1)?.id);
  const cur = scans.find((s) => s.id === sel) ?? usable.at(-1);
  return (
    <Panel eyebrow={eye === "OD" ? "Oculus dexter" : "Oculus sinister"} title={<span><span className={eye === "OD" ? "text-od" : "text-os"}>{eye}</span> · {eye === "OD" ? "Right eye" : "Left eye"}</span>}>
      {cur && cur.rnfl != null ? (
        <>
          <OctView eye={eye} thickness={cur.rnfl} signal={cur.signal} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border/60 p-2"><p className="eyebrow !text-[9px]">RNFL</p><p className="font-display text-lg tabular-nums">{cur.rnfl}</p></div>
            <div className="rounded-lg border border-border/60 p-2"><p className="eyebrow !text-[9px]">Day</p><p className="font-display text-lg">D{cur.day}</p></div>
            <div className="rounded-lg border border-border/60 p-2"><p className="eyebrow !text-[9px]">Quality</p><div className="mt-1"><QualityBadge q={cur.quality} /></div></div>
          </div>
        </>
      ) : <EmptyState title="No usable scan" body="Acquire an OCT volume to populate this eye." />}
      <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <caption className="sr-only">{eye} scan history</caption>
          <thead className="sticky top-0 bg-popover"><tr className="eyebrow text-left"><th className="px-3 py-2 font-normal">Scan</th><th className="font-normal">RNFL</th><th className="font-normal">SSI</th><th className="font-normal">Flag</th></tr></thead>
          <tbody>{[...scans].reverse().map((s) => (
            <tr key={s.id} onClick={() => s.rnfl != null && setSel(s.id)} tabIndex={s.rnfl != null ? 0 : -1} onKeyDown={(e) => e.key === "Enter" && s.rnfl != null && setSel(s.id)}
              className={cn("cursor-pointer border-t border-border/50 font-mono text-xs transition-colors hover:bg-accent/40", cur?.id === s.id && "bg-primary/10")}>
              <td className="px-3 py-2">D{s.day}{s.source === "upload" && <span className="ml-1 text-primary">↑</span>}</td><td>{s.rnfl ?? "—"}</td><td>{s.signal || "—"}</td><td><QualityBadge q={s.quality} /></td>
            </tr>))}</tbody>
        </table>
      </div>
    </Panel>
  );
}

function Scans() {
  const { data, range } = useDataset();
  const from = data.currentDay - range;
  return (
    <>
      <PageHeader eyebrow="Optical coherence tomography" title="OCT Eye Scans" description="Each eye is tracked independently. Select a scan to inspect its synthetic B-scan rendering and quality metadata. Images are illustrative only." />
      <div className="grid gap-4 lg:grid-cols-2">
        {(["OD", "OS"] as Eye[]).map((e) => <EyeColumn key={`${e}-${data.astronaut.id}`} eye={e} scans={data.scans.filter((s) => s.eye === e && s.day >= from)} />)}
      </div>
    </>
  );
}
