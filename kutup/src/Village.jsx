// Kütüp köyü: build-mode focus sessions raise a building, stage by stage, on an
// isometric plot; finished ones join their owner's village for good.
// Everything is hand-built SVG driven by one requestAnimationFrame loop, so it
// stays light enough to run for a whole session with the screen kept on.
import React, { useEffect, useRef } from "react";
import { reducedMotion } from "./ui.jsx";
import { kindFor } from "../shared/village.js";
import {
  CRANE, DIRT, GRASS, STONE, WOOD, box, chimneySVG, doorSVG, f, flagSVG, foundationSVG, gardenSVG,
  poly, projector, pts, ridgeOf, roofSVG, seg, shadowSVG, spec, topOf, wallsSVG, windowsSVG,
} from "./iso.js";

export const KINDS = {
  cottage: { label: "Kulübe", emoji: "🏡", minutes: 25 },
  house: { label: "İki katlı ev", emoji: "🏠", minutes: 50 },
  tower: { label: "Kule", emoji: "🏰", minutes: 75 },
};
export { kindFor };

// ---------- construction site ----------
// The crane stands to the left with its arm across the screen, and always lowers
// its load just above whatever is being built.
function craneSVG(P, sp, time, shown) {
  const zc = Math.max(topOf(sp) + 2.3, 4.6),
    mast = [-3.0, 3.0],
    end = [0.6, -0.6];
  const walls = Math.max(0, Math.min(1, (shown - 0.32) / 0.3)),
    roofUp = Math.max(0, Math.min(1, (shown - 0.62) / 0.13));
  const u = 0.72 + 0.14 * Math.sin(time * 0.7),
    x = mast[0] + (end[0] - mast[0]) * u,
    y = mast[1] + (end[1] - mast[1]) * u,
    z = Math.min(zc - 0.9, 0.3 + sp.h * walls + (ridgeOf(sp) - topOf(sp)) * roofUp + 0.9 + 0.2 * Math.sin(time * 1.4));
  const load = shown < 0.32 ? WOOD : shown < 0.62 ? sp.wall.faces : [sp.roof[2], sp.roof[0], sp.roof[1]];
  let s = box(P, mast[0] - 0.16, mast[1] - 0.16, mast[0] + 0.16, mast[1] + 0.16, 0, zc, CRANE);
  for (let k = 0.5; k < zc - 0.3; k += 0.55) s += seg(P(mast[0] - 0.16, mast[1] + 0.17, k), P(mast[0] + 0.16, mast[1] + 0.17, k + 0.5), "#c99622", 1);
  s += box(P, mast[0] - 0.3, mast[1] - 0.3, mast[0] + 0.3, mast[1] + 0.3, zc - 0.05, zc + 0.35, ["#5f6f86", "#4b5a70", "#3c4a5e"]);
  s += seg(P(mast[0], mast[1], zc + 0.4), P(end[0], end[1], zc + 0.4), "#e4b031", 4) + seg(P(mast[0], mast[1], zc + 0.4), P(mast[0] - 1.1, mast[1] + 1.1, zc + 0.4), "#c99622", 4);
  s += box(P, mast[0] - 1.35, mast[1] + 0.85, mast[0] - 0.85, mast[1] + 1.35, zc + 0.05, zc + 0.6, STONE);
  s += seg(P(x, y, zc + 0.4), P(x, y, z + 0.38), "#5f5e5a", 1.1) + box(P, x - 0.38, y - 0.38, x + 0.38, y + 0.38, z, z + 0.38, load);
  return s;
}
function scaffoldSVG(P, sp) {
  const w = sp.hw + 0.45,
    top = topOf(sp) + 0.2,
    pole = "#c79a5a",
    plank = "#ad7f43";
  let s = "";
  [-w + 0.25, 0, w].forEach((y) => (s += seg(P(w, y, 0), P(w, y, top), pole, 2)));
  [-w + 0.25, 0, w].forEach((x) => (s += seg(P(x, w, 0), P(x, w, top), pole, 2)));
  for (let z = 1.2; z <= top; z += 1.2) s += seg(P(w, -w + 0.15, z), P(w, w, z), plank, 3.2) + seg(P(-w + 0.15, w, z), P(w, w, z), plank, 3.2);
  s += seg(P(w, -w + 0.25, 0.1), P(w, 0, 1.2), pole, 1.2, 0.7) + seg(P(-w + 0.25, w, 0.1), P(0, w, 1.2), pole, 1.2, 0.7);
  return s;
}
function sceneParts(P, sp, seed) {
  const w = sp.hw,
    top = topOf(sp);
  return [
    { a: 0, b: 0.05, kind: "drop", dist: 30, out: [0.1, 0.14], draw: () => [[-w - 0.2, -w - 0.2], [w + 0.2, -w - 0.2], [w + 0.2, w + 0.2], [-w - 0.2, w + 0.2]].map(([x, y]) => box(P, x - 0.08, y - 0.08, x + 0.08, y + 0.08, 0, 0.7, WOOD)).join("") },
    { a: 0.32, b: 0.62, kind: "grow", draw: (t) => shadowSVG(P, sp, t) },
    { a: 0.04, b: 0.12, kind: "drop", dist: -22, draw: () => foundationSVG(P, sp) },
    { a: 0.12, b: 0.28, kind: "grow", draw: (t) => [[-w, -w], [w, -w], [-w, w], [w, w]].map(([x, y], i) => { const k = Math.max(0, Math.min(1, t * 1.6 - i * 0.2)); return k > 0 ? box(P, x - 0.12, y - 0.12, x + 0.12, y + 0.12, 0.3, 0.3 + sp.h * k, WOOD) : ""; }).join("") },
    { a: 0.26, b: 0.32, kind: "drop", dist: 30, draw: () => `<polygon points="${pts([P(-w, -w, top), P(w, -w, top), P(w, w, top), P(-w, w, top)])}" fill="none" stroke="#bd8649" stroke-width="3.5" stroke-linejoin="round"/>` },
    { a: 0.32, b: 0.62, kind: "grow", draw: (t) => wallsSVG(P, sp, t) },
    { a: 0.78, b: 0.82, kind: "pop", anchor: [0, w, 0.3], draw: () => doorSVG(P, sp) },
    { a: 0.82, b: 0.93, kind: "grow", lights: true, draw: (t, lit) => windowsSVG(P, sp, lit, t) },
    { a: 0.1, b: 0.96, kind: "span", draw: () => scaffoldSVG(P, sp) },
    { a: 0.62, b: 0.75, kind: "drop", dist: 80, land: true, draw: () => roofSVG(P, sp) },
    { a: 0.75, b: 0.79, kind: "grow", live: sp.roofType === "pyramid", draw: (t, lit, time) => (sp.roofType === "pyramid" ? flagSVG(P, sp, t, time * 3) : chimneySVG(P, sp, t)) },
    { a: 0.92, b: 0.97, kind: "pop", anchor: [0, w + 0.9, 0], draw: () => gardenSVG(P, sp, seed) },
    { a: 0.05, b: 0.96, kind: "span", live: true, draw: (time, shown) => craneSVG(P, sp, time, shown) },
  ];
}

const springOut = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2));
const clamp = (v) => Math.max(0, Math.min(1, v));
const NS = "http://www.w3.org/2000/svg";

/**
 * Live construction site.
 * run: { endsAt, minutes, kind, seed } while a build-mode session is on.
 * outcome: { type: "built" | "collapsed", kind, seed, at } right after it ends.
 */
export function ConstructionScene({ run, outcome }) {
  const ref = useRef(null);
  const live = useRef({ run, outcome });
  live.current = { run, outcome };
  const subject = run || outcome;
  const kind = subject?.kind || "cottage",
    seed = subject?.seed || 1;
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const sp = spec(kind, seed);
    const motionReduced = reducedMotion();
    const s = { cottage: 31, house: 28, tower: 23.5 }[kind];
    const P = projector({ cx: 350, cy: 268, s });
    root.innerHTML = "";
    const layer = (name) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", name);
      root.appendChild(g);
      return g;
    };
    layer("ground").innerHTML =
      box(P, -3.4, -3.4, 3.4, 3.4, -0.5, 0, GRASS) +
      poly([P(-sp.hw - 0.95, -sp.hw - 0.95, 0.006), P(sp.hw + 0.95, -sp.hw - 0.95, 0.006), P(sp.hw + 0.95, sp.hw + 0.95, 0.006), P(-sp.hw - 0.95, sp.hw + 0.95, 0.006)], DIRT[0]) +
      [[-2.9, -1.6], [2.8, -2.9], [-2.4, -3.0], [2.9, 2.2]].map(([x, y]) => { const p = P(x, y, 0); return `<ellipse cx="${f(p[0])}" cy="${f(p[1] - 6)}" rx="9" ry="7" fill="#79b25a"/>`; }).join("");
    const building = layer("site");
    const fx = layer("fx");
    const parts = sceneParts(P, sp, seed).map((p) => ({ ...p, el: building.appendChild(document.createElementNS(NS, "g")) }));
    let shown = 0,
      raf = 0,
      last = 0,
      mode = "build",
      eventAt = 0,
      landed = false,
      puff = null,
      rubble = "";
    const start = performance.now();
    const progressOf = (r) => clamp(1 - (r.endsAt - Date.now()) / (r.minutes * 60000));
    const draw = (now) => {
      const time = motionReduced ? 0 : (now - start) / 1000;
      const { run: r, outcome: out } = live.current;
      if (mode === "build") {
        if (r) shown += (progressOf(r) - shown) * (shown === 0 ? 1 : 0.15);
        else if (out?.type === "built") {
          shown += (1 - shown) * 0.2;
          if (shown > 0.995) {
            shown = 1;
            mode = "done";
            eventAt = now;
          }
        } else if (out?.type === "collapsed") {
          mode = "collapse";
          eventAt = now;
          parts.forEach((p, i) => {
            const op = +p.el.getAttribute("opacity");
            if (!(op > 0)) return;
            let bb;
            try {
              bb = p.el.getBBox();
            } catch {
              bb = { x: 350, y: 268, width: 0, height: 0 };
            }
            p.fall = { base: p.el.getAttribute("transform") || "", cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2, r: (Math.random() * 2 - 1) * 42, dx: (Math.random() * 2 - 1) * 55, d: (parts.length - i) * 0.03, op };
          });
        }
      }
      if (mode === "collapse") {
        const tau = motionReduced ? 1.5 : (now - eventAt) / 1000;
        parts.forEach((p) => {
          if (!p.fall) return p.el.setAttribute("opacity", "0");
          const l = Math.max(0, tau - p.fall.d);
          p.el.setAttribute("transform", `${p.fall.base} translate(${f(p.fall.dx * l)} ${f(320 * l * l)}) rotate(${f(p.fall.r * l)} ${f(p.fall.cx)} ${f(p.fall.cy)})`);
          p.el.setAttribute("opacity", Math.max(0, (1 - l * 1.3) * p.fall.op).toFixed(2));
        });
        if (tau > 0.9 && !rubble)
          rubble = foundationSVG(P, sp) + [[-1, 0.4], [0.3, -0.6], [0.9, 0.8], [-0.2, 1.2], [0.8, -1.3], [-1.3, -0.7]].map(([x, y], i) => box(P, x - 0.35, y - 0.25, x + 0.35, y + 0.25, 0.3, 0.55 + (i % 2) * 0.22, i % 3 ? sp.wall.faces : WOOD)).join("");
        let dust = "";
        const k = clamp(tau / 1.4);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2,
            q = P(Math.cos(a) * (sp.hw + 0.4), Math.sin(a) * (sp.hw + 0.4), 0.3);
          dust += `<circle cx="${f(q[0] + Math.cos(a) * 34 * k)}" cy="${f(q[1] - 16 * k)}" r="${f(7 + 28 * k)}" fill="#ddd3c3" opacity="${(0.75 * (1 - k)).toFixed(2)}"/>`;
        }
        fx.innerHTML = (rubble ? `<g opacity="${clamp((tau - 0.9) / 0.4).toFixed(2)}">${rubble}</g>` : "") + dust;
        return;
      }
      const lit = mode === "done";
      parts.forEach((p) => {
        const l = clamp((shown - p.a) / (p.b - p.a));
        let op = 1;
        if (p.kind === "drop") {
          if (!p.ready) {
            p.el.innerHTML = p.draw();
            p.ready = true;
          }
          const e = springOut(l);
          p.el.setAttribute("transform", `translate(0 ${f(-(1 - e) * p.dist)})`);
          op = l > 0 ? Math.min(1, l * 2.5) : 0;
          if (p.out) op *= 1 - clamp((shown - p.out[0]) / (p.out[1] - p.out[0]));
          if (p.land && l >= 1 && !landed) {
            landed = true;
            puff = now;
          }
        } else if (p.kind === "grow") {
          const key = l.toFixed(3) + (p.lights && lit ? "L" : "") + (p.live && l >= 1 ? Math.floor(time * 15) : "");
          if (key !== p.key) {
            p.el.innerHTML = l > 0 ? p.draw(l, lit, time) : "";
            p.key = key;
          }
        } else if (p.kind === "pop") {
          if (!p.ready) {
            p.el.innerHTML = p.draw();
            p.ready = true;
          }
          const e = springOut(l),
            q = P(...p.anchor);
          p.el.setAttribute("transform", `translate(${f(q[0])} ${f(q[1])}) scale(${Math.max(0.001, e).toFixed(3)}) translate(${f(-q[0])} ${f(-q[1])})`);
          op = l > 0 ? 1 : 0;
        } else if (p.kind === "span") {
          op = clamp((shown - p.a) / 0.04) * clamp((p.b - shown) / 0.04);
          if (op > 0 && (p.live || !p.ready)) {
            p.el.innerHTML = p.draw(time, shown);
            p.ready = true;
          }
        }
        p.el.setAttribute("opacity", op.toFixed(2));
      });
      let effects = "";
      if (puff && now - puff < 700) {
        const k = (now - puff) / 700;
        [[-sp.hw - 0.3, sp.hw + 0.3], [sp.hw + 0.3, -sp.hw - 0.3], [sp.hw + 0.3, sp.hw + 0.3]].forEach(([x, y]) => {
          const q = P(x, y, topOf(sp) - 0.1);
          effects += `<circle cx="${f(q[0])}" cy="${f(q[1] - 10 * k)}" r="${f(5 + 16 * k)}" fill="#efe9dd" opacity="${(0.8 * (1 - k)).toFixed(2)}"/>`;
        });
      }
      if (mode === "done") {
        const dt = (now - eventAt) / 1000,
          base = P(0, 0, 0),
          bounce = motionReduced ? 1 : 1 + 0.06 * Math.exp(-dt * 5) * Math.cos(dt * 14);
        building.setAttribute("transform", `translate(${f(base[0])} ${f(base[1])}) scale(${bounce.toFixed(4)}) translate(${f(-base[0])} ${f(-base[1])})`);
        const apex = P(0, 0, ridgeOf(sp));
        for (let i = 0; !motionReduced && i < 18 && dt < 1.5; i++) {
          const a = -Math.PI / 2 + (i / 17 - 0.5) * 2.5,
            vx = Math.cos(a) * 130,
            vy = Math.sin(a) * 170,
            x = apex[0] + vx * dt,
            y = apex[1] + vy * dt + 170 * dt * dt;
          effects += `<rect x="${f(x)}" y="${f(y)}" width="6" height="6" transform="rotate(45 ${f(x + 3)} ${f(y + 3)})" fill="${["#ffd36e", sp.roof[0], "#e98aa8", "#86b75e"][i % 4]}" opacity="${(1 - dt / 1.5).toFixed(2)}"/>`;
        }
        if (sp.chimney && sp.roofType === "gable")
          for (let i = 0; i < 3; i++) {
            const k = (time * 0.45 + i / 3) % 1,
              c = P(sp.hw + 0.18, 0, ridgeOf(sp) + 0.6);
            effects += `<circle cx="${f(c[0] + 8 * Math.sin(k * 5 + i))}" cy="${f(c[1] - k * 44)}" r="${f(4 + k * 8)}" fill="#ece7dd" opacity="${(0.7 * (1 - k)).toFixed(2)}"/>`;
          }
      }
      fx.innerHTML = effects;
    };
    const loop = (now) => {
      // 30 fps is plenty for a scene that changes in minutes, and spares the battery.
      if (now - last > 33) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };
    if (motionReduced) {
      shown = run ? progressOf(run) : 1;
      draw(performance.now());
      const timer = setInterval(() => {
        if (live.current.run) shown = progressOf(live.current.run);
        draw(performance.now());
      }, 5000);
      return () => clearInterval(timer);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // The scene lives for one building; run/outcome are read live through the ref.
  }, [kind, seed]);
  return (
    <svg className="village-scene" viewBox="0 0 680 400" role="img" aria-label={`${KINDS[kind].label} inşaatı`}>
      <g ref={ref} />
    </svg>
  );
}
