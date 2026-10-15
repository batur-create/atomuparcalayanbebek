// Kütüp köyü: build-mode focus sessions raise a building, stage by stage, on an
// isometric plot; finished ones join their owner's village for good.
// Everything is hand-built SVG driven by one requestAnimationFrame loop, so it
// stays light enough to run for a whole session with the screen kept on.
import React, { useEffect, useRef } from "react";
import { reducedMotion } from "./ui.jsx";
import { kindFor } from "../shared/village.js";
import {
  CRANE, DIRT, GRASS, STONE, WOOD, box, chimneySVG, doorSVG, f, flagSVG, foundationSVG, gardenSVG,
  poly, projector, pts, ridgeOf, roofSVG, seg, shadowSVG, spec, topOf, wallsSVG, windowsSVG, openingList, faceX, faceY,
  porticoSVG, sailsSVG, wallFittingsSVG, yardFittingsSVG,
} from "./iso.js";
import { FRAME_END, phaseAt, sitePlan, siteSVG, workHeight } from "./construction.js";
import { crewSVG, fleeSVG } from "./crew.js";
import { handoverSVG, plotSVG, trussesSVG } from "./sitedetail.js";
import { craneSVG } from "./crane.js";

export const KINDS = {
  cottage: { label: "Kulübe", emoji: "🏡", minutes: 25 },
  house: { label: "İki katlı ev", emoji: "🏠", minutes: 50 },
  tower: { label: "Kule", emoji: "🏰", minutes: 75 },
};
export { kindFor };

// ---------- construction site ----------
// The crane stands to the left with its arm across the screen, and always lowers
// its load just above whatever is being built.
// Facade scaffold, built up lift by lift: base plates and standards, ledgers,
// boards with toe boards, two guard rails per lift and diagonal braces.
function scaffoldSVG(P, sp, built = 1) {
  const w = sp.hw + 0.45,
    top = (topOf(sp) + 0.2) * built,
    pole = "#9aa4ae",
    rail = "#f2c14e",
    board = "#c79a5a";
  const posts = [-w + 0.25, 0, w];
  let s = "";
  for (const t of posts) s += box(P, w - 0.07, t - 0.07, w + 0.07, t + 0.07, 0, 0.03, ["#68727c", "#555e67", "#454c54"]) + box(P, t - 0.07, w - 0.07, t + 0.07, w + 0.07, 0, 0.03, ["#68727c", "#555e67", "#454c54"]);
  posts.forEach((y) => (s += seg(P(w, y, 0), P(w, y, top), pole, 1.8)));
  posts.forEach((x) => (s += seg(P(x, w, 0), P(x, w, top), pole, 1.8)));
  for (let z = 1.2, lift = 0; z <= top + 0.01; z += 1.2, lift++) {
    s += box(P, w - 0.18, -w + 0.15, w + 0.04, w, z - 0.05, z, [board, "#ad7f43", "#946b38"]) + box(P, -w + 0.15, w - 0.18, w, w + 0.04, z - 0.05, z, [board, "#ad7f43", "#946b38"]);
    s += seg(P(w + 0.05, -w + 0.15, z + 0.08), P(w + 0.05, w, z + 0.08), "#ad7f43", 1.6) + seg(P(-w + 0.15, w + 0.05, z + 0.08), P(w, w + 0.05, z + 0.08), "#ad7f43", 1.6);
    for (const r of [0.45, 0.9]) s += seg(P(w + 0.06, -w + 0.15, z + r), P(w + 0.06, w, z + r), rail, 1) + seg(P(-w + 0.15, w + 0.06, z + r), P(w, w + 0.06, z + r), rail, 1);
    const z0 = z - 1.2;
    s += seg(P(w, lift % 2 ? -w + 0.25 : 0, z0), P(w, lift % 2 ? 0 : -w + 0.25, z), pole, 1, 0.8) + seg(P(lift % 2 ? -w + 0.25 : 0, w, z0), P(lift % 2 ? 0 : -w + 0.25, w, z), pole, 1, 0.8);
  }
  return s;
}
// Infill walls are laid in aerated-concrete blocks, course by course; the
// course being laid creeps along the two visible faces.
const BLOCK = { faces: ["#ecebe6", "#d9d7cf", "#c4c1b8"], grain: "#c9c6bd", pattern: "blocks" };
function masonrySVG(P, sp, t) {
  const courses = Math.max(4, Math.round(sp.h / 0.25)),
    done = Math.floor(t * courses),
    part = t * courses - done,
    w = sp.hw,
    step = sp.h / courses;
  let s = done ? wallsSVG(P, { ...sp, wall: BLOCK }, done / courses) : "";
  const laid = 0.3 + done * step;
  for (const o of openingList(sp)) {
    if (o.z0 >= laid) continue;
    const face = (a, b, z0, z1) => (o.face === "y" ? faceY(P, w + 0.012, a, b, z0, z1) : faceX(P, w + 0.012, a, b, z0, z1));
    s += poly(face(o.a, o.b, o.z0, Math.min(o.z1, laid)), "#57544e");
    // A reinforced-concrete lintel bears on the blocks either side.
    if (laid >= o.z1 + 0.14) s += poly(face(o.a - 0.16, o.b + 0.16, o.z1, o.z1 + 0.14), "#b9b6ae");
  }
  if (part > 0 && done < courses) {
    const z0 = 0.3 + done * step,
      z1 = z0 + step,
      reach = -w + 2 * w * part;
    s += box(P, -w, w - 0.2, reach, w, z0, z1, BLOCK.faces) + box(P, w - 0.2, -w, w, reach, z0, z1, BLOCK.faces);
  }
  return s;
}
// Render and paint go up the scaffold from the ground: only the two visible
// faces sweep upward, then the finished wall (trim, floor bands) takes over.
function facadeSVG(P, sp, t) {
  if (t >= 1) return wallsSVG(P, sp, 1);
  const w = sp.hw,
    z1 = 0.3 + sp.h * t,
    [, left, right] = sp.wall.faces;
  return poly([P(-w, w, 0.3), P(w, w, 0.3), P(w, w, z1), P(-w, w, z1)], left) + poly([P(w, -w, 0.3), P(w, w, 0.3), P(w, w, z1), P(w, -w, z1)], right);
}

function sceneParts(P, sp, seed, plan) {
  const w = sp.hw,
    look = sp.look || {};
  return [
    { a: FRAME_END, b: 0.68, kind: "grow", draw: (t) => shadowSVG(P, sp, t) },
    { a: 0, b: 1, kind: "site", draw: (shown) => siteSVG(P, sp, plan, shown) },
    { a: FRAME_END, b: 0.68, kind: "grow", draw: (t) => masonrySVG(P, sp, t) },
    { a: 0.86, b: 0.93, kind: "grow", draw: (t) => facadeSVG(P, sp, t) },
    // The door is fitted into its frame from the threshold up.
    { a: 0.8, b: 0.84, kind: "reveal", fit: true, draw: () => doorSVG(P, sp) },
    { a: 0.78, b: 0.86, kind: "grow", lights: true, draw: (t, lit) => windowsSVG(P, sp, lit, t) },
    { a: FRAME_END - 0.02, b: 0.93, kind: "erect", draw: (time, shown, built) => scaffoldSVG(P, sp, built) },
    // Roof: trusses one by one, purlins across, then tiles from the eaves up.
    { a: 0.68, b: 0.73, kind: "grow", draw: (t) => trussesSVG(P, sp, ridgeOf(sp), topOf(sp), t) },
    { a: 0.72, b: 0.78, kind: "reveal", draw: () => roofSVG(P, sp) },
    { a: 0.78, b: 0.8, kind: "grow", live: sp.roofType === "pyramid", draw: (t, lit, time) => (sp.roofType === "pyramid" ? flagSVG(P, sp, t, time * 3) : chimneySVG(P, sp, t)) },
    // Windmill sails go up blade by blade once the roof is on, then turn.
    ...(look.sails ? [{ a: 0.79, b: 0.82, kind: "grow", live: true, draw: (t, lit, time) => sailsSVG(P, sp, t >= 1 ? 0.4 + time * 0.9 : 0.4, 2, Math.ceil(t * 4)) }] : []),
    // Once the scaffold is down: the shop front (awning, shutters, window
    // boxes, balcony, clock) and the columned porch.
    ...(sp.look ? [{ a: 0.93, b: 0.955, kind: "reveal", fit: true, draw: () => wallFittingsSVG(P, sp) + (look.columns ? porticoSVG(P, sp) : "") }] : []),
    // Planting: the garden comes up out of the ground, with the yard's tables, beds and sign.
    { a: 0.94, b: 0.98, kind: "reveal", fit: true, draw: () => gardenSVG(P, sp, seed) + yardFittingsSVG(P, sp) },
    // The tower crane goes up once its footing is cast, at the blinding, and comes down after the roof.
    { a: plan.find((p) => p.key === "lean").a, b: 0.82, kind: "erect", live: true, draw: (time, shown, built) => craneSVG(P, sp, plan, time, shown, built, workHeight(plan, sp, shown)) },
  ];
}

const springOut = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2));
const clamp = (v) => Math.max(0, Math.min(1, v));
const NS = "http://www.w3.org/2000/svg";
let sceneSerial = 0;
const escapeText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

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
    seed = subject?.seed || 1,
    model = subject?.model || null;
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const sp = spec(kind, seed, model);
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
    layer("ground").innerHTML = plotSVG(P, sp, seed);
    const uid = ++sceneSerial;
    // Machines are clipped to the plot (open upwards) so they drive in from beyond its edge.
    const plot = [P(-3.4, 3.4, 0), P(3.4, 3.4, 0), P(3.4, -3.4, 0)];
    root.firstChild.insertAdjacentHTML("beforeend", `<clipPath id="plot${uid}"><polygon points="${[...plot, [plot[2][0], -400], [plot[0][0], -400]].map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ")}"/></clipPath>`);
    const yard = layer("yard");
    const crewBack = layer("crew-back");
    const building = layer("site");
    const frontYard = layer("front-yard");
    const crewFront = layer("crew-front");
    crewBack.setAttribute("clip-path", `url(#plot${uid})`);
    crewFront.setAttribute("clip-path", `url(#plot${uid})`);
    const fx = layer("fx");
    const caption = layer("caption");
    const plan = sitePlan(sp);
    let crewKey = "";
    const parts = sceneParts(P, sp, seed, plan).map((p) => ({ ...p, el: building.appendChild(document.createElementNS(NS, "g")) }));
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
        caption.innerHTML = "";
        crewBack.innerHTML = "";
        const tau = motionReduced ? 3 : (now - eventAt) / 1000;
        // 1) Cracks open and the structure shakes harder and harder; 2) it comes
        // down piece by piece; 3) dust. The crew runs clear; the debris stays.
        const SHAKE = motionReduced ? 0 : 0.75,
          fallT = tau - SHAKE;
        if (fallT < 0) building.setAttribute("transform", `translate(${f(Math.sin(tau * 55) * 3.2 * (tau / SHAKE))} 0)`);
        else building.removeAttribute("transform");
        parts.forEach((p) => {
          if (!p.fall) return p.el.setAttribute("opacity", "0");
          const l = Math.max(0, fallT - p.fall.d);
          p.el.setAttribute("transform", `${p.fall.base} translate(${f(p.fall.dx * l)} ${f(320 * l * l)}) rotate(${f(p.fall.r * l)} ${f(p.fall.cx)} ${f(p.fall.cy)})`);
          // Pieces fall in full colour and only disappear into the dust once down.
          p.el.setAttribute("opacity", (p.fall.op * clamp(1 - (l - 0.55) * 2.5)).toFixed(2));
        });
        crewFront.innerHTML = motionReduced ? "" : fleeSVG(P, sp, tau);
        let cracks = "";
        if (fallT < 0.25) {
          const grow = clamp(tau / Math.max(0.01, SHAKE)),
            w = sp.hw,
            top = topOf(sp);
          [[-0.9, "y"], [0.5, "y"], [-0.4, "x"], [0.8, "x"]].forEach(([u, face], i) => {
            let d = "";
            for (let j = 0; j <= 6; j++) {
              const z = top - 0.2 - (top - 0.5) * grow * (j / 6),
                off = u + (j % 2 ? 0.18 : -0.12) * (i % 2 ? 1 : -1);
              const q = face === "y" ? P(off * w, w + 0.02, z) : P(w + 0.02, off * w, z);
              d += `${j ? "L" : "M"}${f(q[0])} ${f(q[1])}`;
            }
            cracks += `<path d="${d}" fill="none" stroke="#3b2f2a" stroke-width="1.8" stroke-linejoin="round"/>`;
          });
        }
        if (fallT > 0.15 && !rubble)
          rubble = foundationSVG(P, sp) + [[-1, 0.4], [0.3, -0.6], [0.9, 0.8], [-0.2, 1.2], [0.8, -1.3], [-1.3, -0.7]].map(([x, y], i) => box(P, x - 0.35, y - 0.25, x + 0.35, y + 0.25, 0.3, 0.55 + (i % 2) * 0.22, i % 3 ? sp.wall.faces : WOOD)).join("");
        let dust = "";
        const k = clamp(Math.max(0, fallT) / 1.4);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2,
            q = P(Math.cos(a) * (sp.hw + 0.4), Math.sin(a) * (sp.hw + 0.4), 0.3);
          dust += `<circle cx="${f(q[0] + Math.cos(a) * 34 * k)}" cy="${f(q[1] - 16 * k)}" r="${f(7 + 28 * k)}" fill="#ddd3c3" opacity="${(0.75 * (1 - k)).toFixed(2)}"/>`;
        }
        fx.innerHTML = (rubble ? `<g opacity="${clamp((fallT - 0.15) / 0.4).toFixed(2)}">${rubble}</g>` : "") + (fallT > 0 ? dust : "") + cracks;
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
        } else if (p.kind === "site") {
          const key = shown.toFixed(3);
          if (key !== p.key) {
            const out = p.draw(shown);
            yard.innerHTML = out.yard;
            p.el.innerHTML = out.rest;
            frontYard.innerHTML = out.front;
            p.key = key;
          }
        } else if (p.kind === "erect") {
          const built = clamp((shown - p.a) / 0.03) * clamp((p.b - shown) / 0.03);
          op = built > 0 ? 1 : 0;
          const key = built.toFixed(2) + (p.live ? Math.floor(time * 15) : "");
          if (op && key !== p.key) {
            p.el.innerHTML = p.draw(time, shown, built);
            p.key = key;
          }
        } else if (p.kind === "reveal") {
          // Tiles go on from the eaves up to the ridge: a clip uncovers the roof bottom-up.
          if (!p.ready) {
            const id = `reveal${uid}-${parts.indexOf(p)}`;
            p.el.innerHTML = `<clipPath id="${id}"><rect x="0" y="0" width="680" height="0"/></clipPath><g clip-path="url(#${id})">${p.draw()}</g>`;
            p.rect = p.el.querySelector("rect");
            const hw = sp.hw,
              tops = [P(0, 0, ridgeOf(sp)), P(-hw, -hw, ridgeOf(sp))].map((q) => q[1]);
            p.top = Math.min(...tops) - 30;
            p.bottom = Math.max(P(hw + 0.5, hw + 0.5, topOf(sp))[1], P(hw, -hw, topOf(sp))[1]) + 20;
            // Smaller pieces (door, garden) reveal over their own height.
            if (p.fit)
              try {
                const bb = p.el.querySelector("g").getBBox();
                if (bb.height > 0) [p.top, p.bottom] = [bb.y - 2, bb.y + bb.height + 2];
              } catch {}
            p.ready = true;
          }
          const y = p.bottom - (p.bottom - p.top) * l;
          p.rect.setAttribute("y", y.toFixed(1));
          p.rect.setAttribute("height", Math.max(0, p.bottom - y).toFixed(1));
          op = l > 0 ? 1 : 0;
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
        const dt = (now - eventAt) / 1000;
        effects += handoverSVG(P, sp, motionReduced ? 3 : dt);
        const
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
      // Machines and workers for the work under way (15 fps is plenty for them).
      if (mode === "build") {
        const key = `${Math.floor(time * 15)}|${shown.toFixed(3)}`;
        if (key !== crewKey) {
          const c = crewSVG(P, sp, plan, shown, time);
          crewBack.innerHTML = c.behind;
          crewFront.innerHTML = c.front;
          crewKey = key;
        }
      } else if (crewKey) {
        crewBack.innerHTML = crewFront.innerHTML = "";
        crewKey = "";
      }
      const label = mode === "done" ? "Teslim edildi 🎉" : phaseAt(plan, shown).label;
      const text = `${label}|${Math.round(shown * 100)}`;
      if (text !== caption.dataset.text) {
        caption.dataset.text = text;
        caption.innerHTML = `<text x="22" y="40" fill="#4f4a3f" font-size="24" font-weight="700" font-family="DM Sans, sans-serif">${escapeText(label)}</text><text x="22" y="68" fill="#8a8170" font-size="20" font-family="DM Sans, sans-serif">Hakediş %${Math.round(shown * 100)}</text>`;
      }
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
  }, [kind, seed, model]);
  return (
    <svg className="village-scene" viewBox="0 0 680 400" role="img" aria-label={`${KINDS[kind].label} inşaatı`}>
      <g ref={ref} />
    </svg>
  );
}
