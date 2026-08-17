import { useEffect, useRef } from "react";

/**
 * Kunskapsträdet — landningssidans bildmässiga bärare.
 *
 * Trädet ÄR mätaren, inte dekoren: `score` är prognostiserat normerat
 * betyg 0,00–2,00 och ritar hela formen. Samma modul är tänkt att gå
 * igen i profilen och i veckomailet, alltid med samma data.
 *
 * Tre saker i algoritmen är inte kosmetiska:
 *
 * 1. Tvåpassritningen. Kronan mäts först utan att ritas och skalas
 *    sedan in. Utan den blir ett litet träd en nästan tom ruta och ett
 *    stort träd får kronan avskuren.
 * 2. Tillväxten är gejtad per djup. Stammen finns alltid (golv 70 %),
 *    grenar öppnar med stigande poäng, löv tätnar från 0,44 och äpplen
 *    sätter sig från 1,24.
 * 3. Äpplena glesas ut med ett minsta avstånd, annars klumpar de ihop
 *    sig till en röd massa i toppen vid höga poäng.
 *
 * Färgerna läses ur CSS-tokens i stället för att hårdkodas, så ett
 * palettbyte kräver noll ändringar här.
 *
 * Sväjningen pausar utanför vyn och när fliken är dold, och startar
 * aldrig under prefers-reduced-motion.
 */
export function KunskapsTrad({ score = 1.45, seed = 20260516 }: { score?: number; seed?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = (n: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#7a5236";

    const rng = (a: number) => () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

    let phase = 0;
    let visible = true;
    let raf = 0;
    let last = 0;

    function draw() {
      const cvv = ref.current;
      if (!cvv) return;
      const r = cvv.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvv.width = Math.round(r.width * dpr);
      cvv.height = Math.round(r.height * dpr);
      const ctx = cvv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = r.width;
      const H = r.height;
      ctx.clearRect(0, 0, W, H);

      const t = clamp(score / 2, 0, 1);
      const bark = css("--teal");
      const leafA = css("--success");
      const leafB = css("--success");
      const apple = css("--amber");
      const groundY = H * 0.9;
      const baseX = W * 0.5;
      const MAXD = 7;

      let rnd = rng(seed);
      let leaves: { x: number; y: number; a: number; l: number; c: string; o: number; s: number }[] = [];
      let apples: { x: number; y: number; r: number; s: number }[] = [];
      let minX = baseX;
      let maxX = baseX;
      let minY = groundY;
      let maxY = groundY;

      function branch(x: number, y: number, ang: number, len: number, w: number, d: number, drawing: boolean) {
        if (d > MAXD) return;
        const gate = (d / (MAXD + 1)) * 0.6;
        let local = clamp((t - gate) / 0.4, 0, 1);
        if (d === 0) local = 0.7 + local * 0.3;
        else if (d === 1) local = 0.35 + local * 0.65;
        if (local <= 0.03) return;
        const L = len * local;
        const sway = drawing && !reduce ? Math.sin(phase * 0.55 + d * 0.7 + x * 0.03) * 0.014 * d : 0;
        const a = ang + sway;
        const x2 = x + Math.cos(a) * L;
        const y2 = y + Math.sin(a) * L;
        if (drawing && ctx) {
          ctx.lineWidth = Math.max(0.8, w * (0.45 + local * 0.55));
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + Math.cos(a - 0.16) * L * 0.6, y + Math.sin(a - 0.16) * L * 0.6, x2, y2);
          ctx.stroke();
        } else {
          if (x2 < minX) minX = x2;
          if (x2 > maxX) maxX = x2;
          if (y2 < minY) minY = y2;
          if (y2 > maxY) maxY = y2;
        }
        if (d >= 4 && local > 0.35) {
          const n = d >= 6 ? 4 : 2;
          for (let i = 0; i < n; i++) {
            leaves.push({
              x: x2 + (rnd() - 0.5) * L * 0.5,
              y: y2 + (rnd() - 0.5) * L * 0.5,
              a: rnd() * Math.PI * 2,
              l: H * 0.02 * (0.7 + rnd() * 0.7),
              c: rnd() < 0.45 ? leafB : leafA,
              o: 0.55 + rnd() * 0.45,
              s: rnd(),
            });
          }
        }
        if (d >= 5 && rnd() < 0.13) {
          apples.push({ x: x2 + (rnd() - 0.5) * L * 0.3, y: y2 + L * 0.22, r: H * 0.0165, s: rnd() });
        }
        const kids = d < 2 ? 3 : rnd() < 0.22 ? 3 : 2;
        const spread = d < 2 ? 0.46 : 0.44 + rnd() * 0.2;
        for (let k = 0; k < kids; k++) {
          const off = (k - (kids - 1) / 2) * spread + (rnd() - 0.5) * 0.16;
          branch(x2, y2, a + off, len * (0.74 + rnd() * 0.07), w * 0.66, d + 1, drawing);
        }
      }

      function grow(drawing: boolean) {
        rnd = rng(seed);
        leaves = [];
        apples = [];
        branch(baseX, groundY, -Math.PI / 2, H * 0.2, Math.max(6, H * 0.03), 0, drawing);
      }

      // pass 1: mät utan att rita
      grow(false);
      for (const lf of leaves) {
        if (lf.x - lf.l < minX) minX = lf.x - lf.l;
        if (lf.x + lf.l > maxX) maxX = lf.x + lf.l;
        if (lf.y - lf.l < minY) minY = lf.y - lf.l;
        if (lf.y + lf.l > maxY) maxY = lf.y + lf.l;
      }
      maxY = Math.max(maxY, groundY);
      const bw = Math.max(1, maxX - minX);
      const bh = Math.max(1, maxY - minY);
      const fit = Math.min((W * 0.94) / bw, (H * 0.86) / bh, 2.6);
      const cx = (minX + maxX) / 2;

      ctx.save();
      ctx.translate(W / 2, H * 0.945);
      ctx.scale(fit, fit);
      ctx.translate(-cx, -maxY);

      // pass 2: rita, samma frö ger exakt samma träd
      ctx.strokeStyle = bark;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      grow(true);

      const leafT = clamp((t - 0.22) / 0.45, 0, 1);
      for (const lf of leaves) {
        if (lf.s > leafT) continue;
        const len = lf.l * (0.5 + leafT * 0.5);
        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.a);
        ctx.globalAlpha = lf.o;
        ctx.fillStyle = lf.c;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.55, -len * 0.42, len, 0);
        ctx.quadraticCurveTo(len * 0.55, len * 0.42, 0, 0);
        ctx.fill();
        ctx.restore();
      }

      const appleT = clamp((t - 0.62) / 0.38, 0, 1);
      apples.sort((a, b) => a.s - b.s);
      const minD = H * 0.055;
      const kept: typeof apples = [];
      for (const ap of apples) {
        let ok = true;
        for (const k of kept) {
          const dx = k.x - ap.x;
          const dy = k.y - ap.y;
          if (dx * dx + dy * dy < minD * minD) {
            ok = false;
            break;
          }
        }
        if (ok) kept.push(ap);
      }
      for (const ap of kept) {
        if (ap.s > appleT) continue;
        const rr = ap.r * (0.55 + appleT * 0.45);
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = bark;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ap.x, ap.y - rr * 0.9);
        ctx.lineTo(ap.x + rr * 0.25, ap.y - rr * 1.7);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = apple;
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    draw();

    const onResize = () => draw();
    window.addEventListener("resize", onResize);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((e) => (visible = e[0].isIntersecting), { threshold: 0 });
      io.observe(cv);
    }

    if (!reduce) {
      const loop = (ts: number) => {
        if (visible && !document.hidden && ts - last > 55) {
          phase += 0.055;
          draw();
          last = ts;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (io) io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [score, seed]);

  return (
    <canvas
      ref={ref}
      className="h-full w-full"
      role="img"
      aria-label="Ett äppelträd vars storlek visar hur långt du kommit mot 2,0"
    />
  );
}
