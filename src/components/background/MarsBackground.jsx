import { useEffect, useRef } from "react";

/**
 * Decorative animated Mars globe behind the whole app.
 * Pure canvas 2D, procedurally shaded — no images, no datasets, no extra libraries.
 * Interactive: the globe tilts toward the pointer, spins a little faster while the
 * pointer moves, and the star field drifts with a gentle parallax.
 */

const TEX_W = 512;
const TEX_H = 256;
const GLOBE_RES = 260; // internal render diameter in px (scaled up smoothly)
const BASE_SPIN = 0.045; // rad/s
const POINTER_SPIN = 0.35; // extra rad/s at full pointer speed
const TILT_MAX = 0.35; // rad
const EASE = 3.5; // pointer smoothing (higher = snappier)
const STAR_COUNT = 140;

function tokenRgb(ctx, name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = fallback;
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

// Small seeded 3D value noise so the surface wraps seamlessly around the sphere.
function makeNoise(seed = 7) {
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const val = new Float32Array(256).map((_, i) => perm[i] / 255);
  const fade = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const h = (x, y, z) => val[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]];
  return (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    return lerp(
      lerp(lerp(h(xi, yi, zi), h(xi + 1, yi, zi), xf), lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
      lerp(lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf),
      zf,
    );
  };
}

function buildTexture(colors) {
  const noise = makeNoise();
  const fbm = (x, y, z) => {
    let a = 0.5, f = 1, sum = 0;
    for (let o = 0; o < 5; o++) {
      sum += a * noise(x * f, y * f, z * f);
      a *= 0.5;
      f *= 2.03;
    }
    return sum;
  };
  const tex = new Uint8ClampedArray(TEX_W * TEX_H * 3);
  const { dark, mid, light, cap } = colors;
  for (let j = 0; j < TEX_H; j++) {
    const lat = (0.5 - j / TEX_H) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < TEX_W; i++) {
      const lon = (i / TEX_W) * Math.PI * 2;
      const x = cl * Math.cos(lon), y = sl, z = cl * Math.sin(lon);
      const n = fbm(x * 2.2 + 10, y * 2.2 + 10, z * 2.2 + 10);
      const d = fbm(x * 7 + 3, y * 7 + 3, z * 7 + 3);
      let t = Math.min(1, Math.max(0, (n - 0.32) * 2.6));
      let r, g, b;
      if (t < 0.5) {
        const k = t * 2;
        r = dark[0] + (mid[0] - dark[0]) * k; g = dark[1] + (mid[1] - dark[1]) * k; b = dark[2] + (mid[2] - dark[2]) * k;
      } else {
        const k = (t - 0.5) * 2;
        r = mid[0] + (light[0] - mid[0]) * k; g = mid[1] + (light[1] - mid[1]) * k; b = mid[2] + (light[2] - mid[2]) * k;
      }
      const grain = 0.85 + d * 0.3;
      r *= grain; g *= grain; b *= grain;
      const polar = Math.abs(sl) - 0.9 - (d - 0.5) * 0.08;
      if (polar > 0) {
        const k = Math.min(1, polar * 18);
        r += (cap[0] - r) * k; g += (cap[1] - g) * k; b += (cap[2] - b) * k;
      }
      const o = (j * TEX_W + i) * 3;
      tex[o] = r; tex[o + 1] = g; tex[o + 2] = b;
    }
  }
  return tex;
}

export default function MarsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Colours come from design tokens.
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    probe.canvas.width = probe.canvas.height = 1;
    const colors = {
      dark: tokenRgb(probe, "--mars-surface-dark", "rgb(90,40,25)"),
      mid: tokenRgb(probe, "--mars-surface-mid", "rgb(160,80,45)"),
      light: tokenRgb(probe, "--mars-surface-light", "rgb(210,140,90)"),
      cap: tokenRgb(probe, "--mars-polar-cap", "rgb(235,225,215)"),
      glow: tokenRgb(probe, "--mars-atmosphere", "rgb(220,120,70)"),
      star: tokenRgb(probe, "--foreground", "rgb(235,230,225)"),
    };
    const tex = buildTexture(colors);

    // Offscreen globe buffer + per-pixel sphere geometry and lighting (light fixed in view space).
    const globe = document.createElement("canvas");
    globe.width = globe.height = GLOBE_RES;
    const gctx = globe.getContext("2d");
    const img = gctx.createImageData(GLOBE_RES, GLOBE_RES);
    const R = GLOBE_RES / 2;
    const L = [-0.55, 0.45, 0.7];
    const ln = Math.hypot(...L);
    const px = [], py = [], pz = [], shade = [], alpha = [], idx = [];
    for (let y = 0; y < GLOBE_RES; y++) {
      for (let x = 0; x < GLOBE_RES; x++) {
        const nx = (x + 0.5 - R) / R, ny = (R - y - 0.5) / R;
        const rr = nx * nx + ny * ny;
        if (rr > 1) continue;
        const nz = Math.sqrt(1 - rr);
        const lam = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ln);
        px.push(nx); py.push(ny); pz.push(nz);
        shade.push(0.12 + 1.2 * Math.pow(lam, 0.85) * (0.75 + 0.25 * nz));
        alpha.push(rr > 0.985 ? Math.max(0, (1 - rr) / 0.015) * 255 : 255);
        idx.push((y * GLOBE_RES + x) * 4);
      }
    }

    const rand = (() => { let s = 42; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: rand(), y: rand(), r: 0.4 + rand() * 1.1, depth: 0.2 + rand() * 0.8, phase: rand() * Math.PI * 2, speed: 0.4 + rand() * 1.2,
    }));

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Pointer state, normalised to [-1, 1], eased every frame.
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let pointerSpeed = 0;
    let lastPointer = null;
    const onPointer = (e) => {
      const nx = (e.clientX / w) * 2 - 1, ny = (e.clientY / h) * 2 - 1;
      if (lastPointer) pointerSpeed = Math.min(1, pointerSpeed + Math.hypot(nx - lastPointer.x, ny - lastPointer.y) * 4);
      lastPointer = { x: nx, y: ny };
      target.x = nx; target.y = ny;
    };
    const onLeave = () => { target.x = 0; target.y = 0; lastPointer = null; };

    let spin = 0;
    const data = img.data;
    const renderGlobe = (pitch) => {
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const TWO_PI = Math.PI * 2;
      for (let k = 0; k < idx.length; k++) {
        const y0 = py[k], z0 = pz[k];
        const y1 = y0 * cp - z0 * sp;
        const z1 = y0 * sp + z0 * cp;
        let lon = Math.atan2(px[k], z1) + spin;
        lon = ((lon % TWO_PI) + TWO_PI) % TWO_PI;
        const lat = Math.asin(y1 < -1 ? -1 : y1 > 1 ? 1 : y1);
        const tx = (lon / TWO_PI) * TEX_W | 0;
        const ty = (0.5 - lat / Math.PI) * (TEX_H - 1) | 0;
        const t = (ty * TEX_W + tx) * 3;
        const s = shade[k], o = idx[k];
        data[o] = tex[t] * s; data[o + 1] = tex[t + 1] * s; data[o + 2] = tex[t + 2] * s; data[o + 3] = alpha[k];
      }
      gctx.putImageData(img, 0, 0);
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);
      const [sr, sg, sb] = colors.star;
      for (const st of stars) {
        const tw = reduceMotion ? 0.7 : 0.55 + 0.45 * Math.sin(time * st.speed + st.phase);
        const x = st.x * w - cur.x * 18 * st.depth;
        const y = st.y * h - cur.y * 12 * st.depth;
        ctx.fillStyle = `rgba(${sr},${sg},${sb},${0.15 + 0.45 * tw * st.depth})`;
        ctx.beginPath(); ctx.arc(x, y, st.r, 0, Math.PI * 2); ctx.fill();
      }

      const D = Math.max(Math.min(w, h) * 0.78, 340);
      const cx = w * (w < 768 ? 0.7 : 0.76) + cur.x * 22;
      const cy = h * 0.62 + cur.y * 16;
      const [gr, gg, gb] = colors.glow;
      const halo = ctx.createRadialGradient(cx, cy, D * 0.45, cx, cy, D * 0.75);
      halo.addColorStop(0, `rgba(${gr},${gg},${gb},0.28)`);
      halo.addColorStop(0.35, `rgba(${gr},${gg},${gb},0.08)`);
      halo.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(cx - D, cy - D, D * 2, D * 2);

      renderGlobe(cur.y * TILT_MAX * -1 + 0.12);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(globe, cx - D / 2, cy - D / 2, D, D);

      // Thin lit rim for atmosphere.
      ctx.strokeStyle = `rgba(${gr},${gg},${gb},0.35)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, D / 2, Math.PI * 0.75, Math.PI * 1.6); ctx.stroke();
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = 1 - Math.exp(-EASE * dt);
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;
      pointerSpeed *= Math.exp(-2.5 * dt);
      spin += (BASE_SPIN + POINTER_SPIN * pointerSpeed + cur.x * 0.06) * dt;
      draw(now / 1000);
      raf = requestAnimationFrame(loop);
    };

    const onResize = () => { resize(); if (reduceMotion) draw(0); };
    window.addEventListener("resize", onResize);
    if (reduceMotion) {
      draw(0);
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(loop);
    }
    canvas.dataset.sceneReady = "true";

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="mars-backdrop pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
