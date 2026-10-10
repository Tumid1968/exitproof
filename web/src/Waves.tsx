/**
 * Full-screen animated waves on a canvas (no library, no media file).
 * Budget: ≤ 30 frames/s, devicePixelRatio capped at 1.5, lower resolution on small screens,
 * paused when the tab is hidden, a single still frame when prefers-reduced-motion is set.
 * The measured frame rate is exposed on window.__epFps for checks.
 */
import { useEffect, useRef } from "react";

declare global { interface Window { __epFps?: number } }

// back to front: [base y (0..1), amplitude (px at 1080p), wavelength factor, speed, colour top, colour bottom]
const LAYERS: [number, number, number, number, string, string][] = [
  [0.38, 46, 1.6, 0.05, "#0f1d33", "#0a1322"],
  [0.50, 58, 1.15, 0.08, "#122441", "#0a1526"],
  [0.62, 52, 0.9, 0.11, "#15294a", "#0b1729"],
  [0.74, 44, 0.7, 0.15, "#183056", "#0c192c"],
  [0.86, 34, 0.55, 0.2, "#1b365f", "#0d1a2e"],
];

export function Waves() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, scale = 1, raf = 0, last = 0, t0 = performance.now();
    let frames = 0, fpsStart = performance.now();

    const resize = () => {
      const small = innerWidth < 700;
      scale = Math.min(devicePixelRatio || 1, 1.5) * (small ? 0.6 : 1); // lower resolution on phones
      w = Math.ceil(innerWidth * scale); h = Math.ceil(innerHeight * scale);
      canvas.width = w; canvas.height = h;
    };

    const draw = (time: number) => {
      const t = (time - t0) / 1000;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#04070d"); sky.addColorStop(1, "#08101c");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      const k = h / 1080;
      const step = Math.max(4, Math.round(8 * scale));
      for (const [base, amp, len, speed, top, bottom] of LAYERS) {
        const y0 = base * h, a = amp * k, L = (Math.max(w, h * 1.6) / len) / (Math.PI * 2); // keep long swells on tall phone screens
        const yAt = (x: number) =>
          y0 + a * Math.sin(x / L + t * speed * 2.1) + a * 0.45 * Math.sin(x / (L * 0.47) - t * speed * 3.3 + base * 7) + a * 0.18 * Math.sin(x / (L * 0.21) + t * speed * 5);
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w + step; x += step) ctx.lineTo(x, yAt(x));
        ctx.lineTo(w, h); ctx.closePath();
        const g = ctx.createLinearGradient(0, y0 - a * 2, 0, h);
        g.addColorStop(0, top); g.addColorStop(1, bottom);
        ctx.fillStyle = g; ctx.fill();
        // light relief on the crest
        ctx.beginPath();
        for (let x = 0; x <= w + step; x += step) { const y = yAt(x); if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.strokeStyle = "rgba(150, 200, 255, 0.07)"; ctx.lineWidth = 1.2 * scale; ctx.stroke();
      }
    };

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop);
      if (time - last < 1000 / 30 - 1) return; // cap at 30 frames per second
      last = time;
      draw(time);
      frames++;
      if (time - fpsStart >= 2000) { window.__epFps = Math.round((frames * 1000) / (time - fpsStart)); frames = 0; fpsStart = time; }
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) { last = 0; raf = requestAnimationFrame(loop); }
    };
    const onResize = () => { resize(); if (reduced) draw(t0 + 12000); };

    resize();
    if (reduced) { draw(t0 + 12000); window.__epFps = 0; }
    else raf = requestAnimationFrame(loop);
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return <canvas ref={ref} className="waves" aria-hidden="true" />;
}
