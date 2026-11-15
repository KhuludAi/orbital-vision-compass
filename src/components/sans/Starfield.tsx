import { useEffect, useRef } from "react";

export function Starfield({ density = 0.00018, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.floor(c.offsetWidth * c.offsetHeight * density);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * c.offsetWidth, y: Math.random() * c.offsetHeight, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.2 }));
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, c.offsetWidth, c.offsetHeight);
      for (const st of stars) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(st.p + (t / 1000) * st.s * 0.5));
        ctx.fillStyle = `rgba(200,230,255,${a * 0.8})`;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.28); ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    resize(); draw(0);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [density]);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
