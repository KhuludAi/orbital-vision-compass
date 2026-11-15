import type { Eye } from "@/lib/sans/types";

/** Stylised synthetic OCT B-scan illustration. Not a real image. */
export function OctView({ eye, thickness, signal }: { eye: Eye; thickness: number; signal: number }) {
  const w = 360, h = 150;
  const swell = Math.max(0, thickness - 95) * 1.6;
  const path = (off: number, amp: number) => {
    let d = `M0 ${off}`;
    for (let x = 0; x <= w; x += 6) {
      const c = (x - w / 2) / 55;
      const pit = -18 * Math.exp(-c * c) + amp * Math.exp(-((x - (eye === "OD" ? 290 : 70)) ** 2) / 900);
      d += ` L${x} ${(off + pit + Math.sin(x / 23) * 1.5).toFixed(1)}`;
    }
    return d;
  };
  const noise = Math.max(0, 8 - signal) / 8;
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-background scanline">
      <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" role="img" aria-label={`Synthetic ${eye} OCT B-scan illustration`}>
        <defs>
          <filter id={`n-${eye}`}><feTurbulence baseFrequency="0.9" numOctaves="2" seed={eye === "OD" ? 3 : 7} /><feColorMatrix values="0 0 0 0 0.6 0 0 0 0 0.85 0 0 0 0 1 0 0 0 0.35 0" /></filter>
        </defs>
        <rect width={w} height={h} fill="oklch(0.1 0.02 255)" />
        <path d={path(55, -swell)} stroke="oklch(0.95 0.05 210)" strokeWidth="2.4" fill="none" opacity="0.95" />
        <path d={path(62, -swell * 0.7)} stroke="oklch(0.84 0.13 205)" strokeWidth="5" fill="none" opacity="0.55" />
        <path d={path(78, -swell * 0.3)} stroke="oklch(0.7 0.1 220)" strokeWidth="3" fill="none" opacity="0.5" />
        <path d={path(95, 0)} stroke="oklch(0.9 0.06 200)" strokeWidth="2" fill="none" opacity="0.8" />
        <path d={path(104, 0)} stroke="oklch(0.8 0.15 75)" strokeWidth="3.5" fill="none" opacity="0.55" />
        <rect width={w} height={h} filter={`url(#n-${eye})`} opacity={0.25 + noise * 0.9} />
      </svg>
      <span className="absolute left-2 top-2 font-mono text-[10px] text-primary/80">{eye} · synthetic B-scan</span>
      <span className="absolute bottom-2 right-2 font-mono text-[10px] text-muted-foreground">SSI {signal.toFixed(1)}/10</span>
    </div>
  );
}
