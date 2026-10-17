// Kütüp köyü: build-mode focus sessions raise a building, stage by stage, on an
// isometric plot; finished ones join their owner's village for good.
// Everything is hand-built SVG driven by one requestAnimationFrame loop, so it
// stays light enough to run for a whole session with the screen kept on.
import React, { useEffect, useRef } from "react";
import { reducedMotion } from "./ui.jsx";
import { kindFor } from "../shared/village.js";
import { modelOf } from "../shared/catalog.js";
import {
  CRANE, DIRT, GRASS, STONE, WOOD, box, chimneySVG, doorSVG, f, flagSVG, foundationSVG, gardenSVG,
  poly, projector, pts, ridgeOf, roofSVG, seg, shadowSVG, spec, topOf, wallsSVG, windowsSVG, openingList, faceX, faceY,
  porticoSVG, sailsSVG, wallFittingsSVG, yardFittingsSVG,
} from "./iso.js";
import { FRAME_END, phaseAt, rendered, sitePlan, siteSVG, systemOf, workHeight } from "./construction.js";
import { crewSVG, fleeSVG } from "./crew.js";
import { handoverSVG, plotSVG, trussesSVG } from "./sitedetail.js";
import { craneSVG, liftRuns, mobileCraneSVG } from "./crane.js";
import { skyAt } from "./villageWorld.js";

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
const ALU = ["#c9ced3", "#b3b9bf", "#dde1e4"],
  OSB = ["#d6b27a", "#c29d63", "#a7824b"],
  UNDERLAY = ["#5b6b7d", "#4a5868", "#7d8b9a"];
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
// Insulated render facade, on the two visible faces: insulation boards laid
// course by course in a running bond and pinned with anchors; then the base
// coat with its mesh and the paint, each going up from the ground.
const EPS = ["#f4f4ef", "#e2e1da"],
  BASECOAT = ["#d5d0c4", "#bfb9ac"];
function sweep(P, sp, z1, [left, right], d = 0.04) {
  const w = sp.hw + d;
  return poly([P(-w, w, 0.3), P(w, w, 0.3), P(w, w, z1), P(-w, w, z1)], left) + poly([P(w, -w, 0.3), P(w, w, 0.3), P(w, w, z1), P(w, -w, z1)], right);
}
function epsSVG(P, sp, t) {
  const w = sp.hw + 0.04,
    rowH = 0.5,
    rows = Math.ceil(sp.h / rowH),
    laid = t * rows,
    top = 0.3 + sp.h;
  let s = "";
  for (let r = 0; r < Math.ceil(laid); r++) {
    const z0 = 0.3 + r * rowH,
      z1 = Math.min(top, z0 + rowH),
      reach = r < Math.floor(laid) ? 1 : laid - r;
    const end = -w + 2 * w * reach;
    s += poly(faceY(P, w, -w, end, z0, z1), EPS[0]) + poly(faceX(P, w, -w, end, z0, z1), EPS[1]);
    s += seg(P(-w, w, z1), P(end, w, z1), "#c9c7bd", 0.7) + seg(P(w, -w, z1), P(w, end, z1), "#c9c7bd", 0.6);
    for (let u = -w + (r % 2 ? 0.5 : 1); u < end - 0.05; u += 1) {
      s += seg(P(u, w, z0), P(u, w, z1), "#c9c7bd", 0.7) + seg(P(w, u, z0), P(w, u, z1), "#c9c7bd", 0.6);
      // anchors: one at each joint, one in the middle of the board
      for (const [a, b] of [[u, z0 + rowH * 0.5], [u - 0.5, z0 + rowH * 0.5]]) {
        if (a < -w + 0.05) continue;
        const q1 = P(a, w, b),
          q2 = P(w, a, b);
        s += `<circle cx="${f(q1[0])}" cy="${f(q1[1])}" r="1.1" fill="#9aa0a6"/><circle cx="${f(q2[0])}" cy="${f(q2[1])}" r="1.1" fill="#9aa0a6"/>`;
      }
    }
  }
  return s;
}
function renderFacadeSVG(P, sp, t) {
  const top = 0.3 + sp.h,
    [, left, right] = sp.wall.faces;
  if (t >= 1) return wallsSVG(P, sp, 1);
  if (t < 0.36) return epsSVG(P, sp, t / 0.36);
  if (t < 0.65) {
    // Base coat over the mesh, with the wet front a shade darker.
    const z = 0.3 + sp.h * ((t - 0.36) / 0.29);
    return epsSVG(P, sp, 1) + sweep(P, sp, z, BASECOAT, 0.05) + sweep(P, sp, z, ["#cfc9bc", "#bbb5a7"], 0.05).replace(/<polygon/g, `<polygon opacity="0.5"`);
  }
  return sweep(P, sp, top, BASECOAT, 0.05) + sweep(P, sp, 0.3 + sp.h * ((t - 0.65) / 0.35), [left, right], 0.051);
}

function sceneParts(P, sp, seed, plan) {
  const w = sp.hw,
    look = sp.look || {},
    sys = systemOf(sp),
    rc = sys === "rc";
  const phase = (key) => plan.find((p) => p.key === key),
    first = plan.find((p) => p.floor >= 0),
    facade = plan.filter((p) => ["eps", "render", "paint", "finish"].includes(p.key)),
    openings = phase("openings");
  const span = (from, to, p) => from + (to - from) * p;
  // Scaffold goes up once there is something to reach: the infill walls of a
  // concrete frame, the first storey's walls once they pass head height, the
  // timber frame's sheathing, the glazing of a steel frame.
  const scaffoldAt = rc ? FRAME_END - 0.02 : sys === "masonry" ? span(first.a, first.b, 0.4) : sys === "timber" ? phase("joists").a : 0.66;
  return [
    { a: rc ? FRAME_END : first.a, b: 0.68, kind: "grow", draw: (t) => shadowSVG(P, sp, t) },
    { a: 0, b: 1, kind: "site", draw: (shown) => siteSVG(P, sp, plan, shown) },
    ...(rc ? [{ a: FRAME_END, b: 0.68, kind: "grow", draw: (t) => masonrySVG(P, sp, t) }] : []),
    // The finished wall goes up from the ground: insulated render on a
    // concrete frame; pointing, timber cladding or glass otherwise.
    { a: facade[0].a, b: facade[facade.length - 1].b, kind: "grow", draw: (t) => (rc ? renderFacadeSVG(P, sp, t) : wallsSVG(P, sp, t)) },
    // The door is fitted into its frame from the threshold up.
    { a: span(openings.a, openings.b, 0.25), b: span(openings.a, openings.b, 0.75), kind: "reveal", fit: true, draw: () => doorSVG(P, sp) },
    { a: openings.a, b: openings.b, kind: "grow", lights: true, draw: (t, lit) => windowsSVG(P, sp, lit, t) },
    { a: scaffoldAt, b: 0.93, kind: "erect", draw: (time, shown, built) => scaffoldSVG(P, sp, built) },
    // Roof: trusses one by one, purlins across; OSB sheathing and the
    // waterproofing underlay go on from the eaves up, then the tiles.
    { a: 0.68, b: 0.715, kind: "grow", draw: (t) => (sp.roofType === "dome" ? "" : trussesSVG(P, sp, ridgeOf(sp), topOf(sp), t, sys === "steel")) },
    ...(sp.roofType === "dome"
      ? []
      : sys === "steel"
      ? [{ a: 0.715, b: 0.748, kind: "reveal", draw: () => roofSVG(P, { ...sp, roof: ALU }) }]
      : [
          { a: 0.712, b: 0.735, kind: "reveal", draw: () => roofSVG(P, { ...sp, roof: OSB }) },
          { a: 0.733, b: 0.75, kind: "reveal", draw: () => roofSVG(P, { ...sp, roof: UNDERLAY }) },
        ]),
    { a: 0.748, b: 0.78, kind: "reveal", draw: () => roofSVG(P, sp) },
    { a: 0.78, b: 0.8, kind: "grow", live: sp.roofType === "pyramid", draw: (t, lit, time) => (sp.roofType === "pyramid" ? flagSVG(P, sp, t, time * 3) : chimneySVG(P, sp, t)) },
    // Windmill sails go up blade by blade once the roof is on, then turn.
    ...(look.sails ? [{ a: 0.79, b: 0.82, kind: "grow", live: true, draw: (t, lit, time) => sailsSVG(P, sp, t >= 1 ? 0.4 + time * 0.9 : 0.4, 2, Math.ceil(t * 4)) }] : []),
    // Once the scaffold is down: the shop front (awning, shutters, window
    // boxes, balcony, clock) and the columned porch.
    ...(sp.look ? [{ a: 0.93, b: 0.955, kind: "reveal", fit: true, draw: () => wallFittingsSVG(P, sp) + (look.columns ? porticoSVG(P, sp) : "") }] : []),
    // Planting: the garden comes up out of the ground, with the yard's tables, beds and sign.
    { a: 0.94, b: 0.98, kind: "reveal", fit: true, draw: () => gardenSVG(P, sp, seed) + yardFittingsSVG(P, sp) },
    // The tower goes up with a tower crane, once its footing is cast at the
    // blinding; it comes down after the roof. Smaller buildings get a mobile
    // crane, which comes and goes with the lifting work.
    sp.kind === "tower"
      ? { a: plan.find((p) => p.key === "lean").a, b: 0.82, kind: "erect", live: true, crane: true, draw: (time, shown, built) => craneSVG(P, sp, plan, time, shown, built, workHeight(plan, sp, shown)) }
      : { a: liftRuns(plan)[0][0], b: 0.79, kind: "erect", live: true, crane: true, draw: (time, shown) => mobileCraneSVG(P, sp, plan, time, shown, workHeight(plan, sp, shown)) },
  ];
}

const springOut = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2));
const clamp = (v) => Math.max(0, Math.min(1, v));
const NS = "http://www.w3.org/2000/svg";
// Machines, workers and the crane: smooth enough, and every frame costs battery.
const MOVING_FPS = 12;
let sceneSerial = 0;
// Keep one <g> per piece and touch only the pieces whose drawing changed.
function patch(layer, pieces) {
  while (layer.children.length > pieces.length) layer.lastChild.remove();
  pieces.forEach((text, i) => {
    const g = layer.children[i] || layer.appendChild(document.createElementNS(NS, "g"));
    if (g.__text !== text) g.innerHTML = g.__text = text;
  });
}
const escapeText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/**
 * Live construction site.
 * run: { endsAt, minutes, kind, seed } while a build-mode session is on.
 * outcome: { type: "built" | "collapsed", kind, seed, at } right after it ends.
 */
export function ConstructionScene({ run, outcome, idle = false }) {
  const ref = useRef(null);
  const live = useRef({ run, outcome, idle });
  live.current = { run, outcome, idle };
  const wakeRef = useRef(null);
  const subject = run || outcome;
  const kind = subject?.kind || "cottage",
    seed = subject?.seed || 1,
    model = subject?.model || null;
  const item = modelOf(model, kind);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const sp = spec(kind, seed, model);
    const motionReduced = reducedMotion();
    const s = { cottage: 31, house: 28, tower: 23.5 }[kind];
    const P = projector({ cx: 350, cy: 268, s });
    root.innerHTML = "";
    // The scene is a stack of SVG sheets. The moving ones (machines, workers,
    // the crane) sit on their own compositor layers, so redrawing them 15 times
    // a second does not repaint the sky, the plot and the building under them.
    const sheet = (name) => {
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 680 400");
      svg.setAttribute("class", `site-sheet ${name}`);
      svg.setAttribute("aria-hidden", "true");
      root.appendChild(svg);
      return svg;
    };
    const base = sheet("base"),
      backSheet = sheet("moving back"),
      mid = sheet("mid"),
      topSheet = sheet("moving top"),
      washSheet = sheet("light"),
      labelSheet = sheet("label");
    let into = base;
    const layer = (name, parent = into) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", name);
      parent.appendChild(g);
      return g;
    };
    // Daylight: a sky behind the site (sunset peach, night navy with stars)
    // and a light wash over it, following the time of day in Türkiye.
    const skyLayer = layer("sky");
    layer("ground").innerHTML = plotSVG(P, sp, seed);
    const uid = ++sceneSerial;
    // Machines are clipped to the plot (open upwards) so they drive in from beyond its edge.
    const plot = [P(-3.4, 3.4, 0), P(3.4, 3.4, 0), P(3.4, -3.4, 0)];
    const plotClip = (id) => `<clipPath id="${id}"><polygon points="${[...plot, [plot[2][0], -400], [plot[0][0], -400]].map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ")}"/></clipPath>`;
    backSheet.innerHTML = plotClip(`plot${uid}b`);
    topSheet.innerHTML = plotClip(`plot${uid}t`);
    const yard = layer("yard");
    const crewBack = layer("crew-back", backSheet);
    into = mid;
    const building = layer("site");
    const frontYard = layer("front-yard");
    into = topSheet;
    const craneLayer = layer("crane");
    const crewFront = layer("crew-front");
    crewBack.setAttribute("clip-path", `url(#plot${uid}b)`);
    crewFront.setAttribute("clip-path", `url(#plot${uid}t)`);
    // The mobile crane drives in from beyond the plot like the other machines.
    if (sp.kind !== "tower") craneLayer.setAttribute("clip-path", `url(#plot${uid}t)`);
    const fx = layer("fx");
    const wash = layer("light", washSheet);
    // The structure and its crane shake, fall or bounce together.
    const moveBuilding = (t) => {
      for (const g of [building, craneLayer]) t ? g.setAttribute("transform", t) : g.removeAttribute("transform");
    };
    let daylight = skyAt(),
      skyKey = "";
    const paintSky = () => {
      daylight = skyAt();
      if (daylight.key === skyKey) return;
      skyKey = daylight.key;
      const { night, warm } = daylight;
      let sky = "",
        light = "";
      if (night > 0) {
        sky += `<defs><linearGradient id="night${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151c38"/><stop offset="1" stop-color="#34406a"/></linearGradient></defs><rect width="680" height="400" fill="url(#night${uid})" opacity="${night.toFixed(2)}"/>`;
        for (let i = 0; i < 34; i++) {
          const x = (i * 197.3) % 680,
            y = (i * 71.9) % 190;
          sky += `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 5 ? 0.9 : 1.5}" fill="#fff8e1" opacity="${(night * (0.35 + (i % 3) * 0.2)).toFixed(2)}"/>`;
        }
        light += `<rect width="680" height="400" fill="#20306e" opacity="${(0.3 * night).toFixed(2)}"/>`;
      }
      if (warm > 0) {
        sky += `<defs><linearGradient id="warm${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3a77a"/><stop offset="1" stop-color="#f7e2c8" stop-opacity="0"/></linearGradient></defs><rect width="680" height="400" fill="url(#warm${uid})" opacity="${warm.toFixed(2)}"/>`;
        light += `<rect width="680" height="400" fill="#ff9145" opacity="${(0.13 * warm).toFixed(2)}"/>`;
      }
      skyLayer.innerHTML = sky;
      wash.innerHTML = light;
    };
    paintSky();
    const skyTimer = setInterval(paintSky, 180000);
    const caption = layer("caption", labelSheet);
    const plan = sitePlan(sp);
    let crewKey = "";
    const parts = sceneParts(P, sp, seed, plan).map((p) => ({ ...p, el: (p.crane ? craneLayer : building).appendChild(document.createElementNS(NS, "g")) }));
    let shown = 0,
      raf = 0,
      last = 0,
      mode = "build",
      eventAt = 0,
      landed = false,
      puff = null,
      rubble = "";
    const start = performance.now();
    // A tea break freezes the site where it stood.
    const progressOf = (r) => clamp(1 - (r.endsAt - (r.pausedAt || Date.now())) / (r.minutes * 60000));
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
        moveBuilding(fallT < 0 ? `translate(${f(Math.sin(tau * 55) * 3.2 * (tau / SHAKE))} 0)` : "");
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
      // Lights on once finished, or at night as soon as the windows are in.
      const lit = mode === "done" || (daylight.night > 0.5 && shown > 0.86);
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
          const key = built.toFixed(2) + (p.live ? Math.floor(time * MOVING_FPS) : "");
          if (op && key !== p.key) {
            const out = p.draw(time, shown, built);
            p.key = key;
            if (typeof out === "string") p.el.innerHTML = out;
            else {
              // The crane: its mast only changes while it goes up or comes
              // down; the slewing top is redrawn only when it has moved.
              if (!p.mast) p.el.innerHTML = "<g></g><g></g>";
              [p.mast, p.head] = p.el.children;
              for (const [g, text] of [[p.mast, out.mast], [p.head, out.head]])
                if (g.__text !== text) g.innerHTML = g.__text = text;
            }
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
        moveBuilding(`translate(${f(base[0])} ${f(base[1])}) scale(${bounce.toFixed(4)}) translate(${f(-base[0])} ${f(-base[1])})`);
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
      // Machines and workers for the work under way (12 fps is plenty for them).
      const resting = mode === "build" && !!live.current.run?.pausedAt;
      if (mode === "build" && !resting) {
        const key = `${Math.floor(time * MOVING_FPS)}|${shown.toFixed(3)}`;
        if (key !== crewKey) {
          const c = crewSVG(P, sp, plan, shown, time);
          patch(crewBack, c.behind);
          patch(crewFront, c.front);
          crewKey = key;
        }
      } else if (crewKey) {
        patch(crewBack, []);
        patch(crewFront, []);
        crewKey = "";
      }
      const label = mode === "done" ? "Teslim edildi 🎉" : resting ? "☕ Çay molası: işçiler demlikte" : phaseAt(plan, shown).label;
      const text = `${label}|${Math.round(shown * 100)}|${daylight.night > 0.4}`;
      if (text !== caption.dataset.text) {
        caption.dataset.text = text;
        const dark = daylight.night > 0.4;
        caption.innerHTML = `<text x="22" y="40" fill="${dark ? "#f1efe6" : "#4f4a3f"}" font-size="24" font-weight="700" font-family="DM Sans, sans-serif">${escapeText(label)}</text><text x="22" y="68" fill="${dark ? "#b9bdd4" : "#8a8170"}" font-size="20" font-family="DM Sans, sans-serif">Hakediş %${Math.round(shown * 100)}</text>`;
      }
    };
    // Nothing is drawn while nobody can see it: scrolled away, or covered by
    // the focus screen (which runs its own copy of the site).
    let onScreen = true;
    const awake = () => onScreen && !live.current.idle && !document.hidden;
    const loop = (now) => {
      if (!awake()) {
        raf = 0;
        return;
      }
      // 30 fps is plenty for a scene that changes in minutes, and spares the battery.
      if (now - last > 33) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!motionReduced && !raf && awake()) raf = requestAnimationFrame(loop);
    };
    wakeRef.current = wake;
    const seen = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([e]) => {
          onScreen = e.isIntersecting;
          wake();
        })
      : null;
    seen?.observe(root);
    document.addEventListener("visibilitychange", wake);
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      clearInterval(skyTimer);
      seen?.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
    if (motionReduced) {
      shown = run ? progressOf(run) : 1;
      draw(performance.now());
      const timer = setInterval(() => {
        if (!awake()) return;
        if (live.current.run) shown = progressOf(live.current.run);
        draw(performance.now());
      }, 5000);
      return () => {
        clearInterval(timer);
        stop();
      };
    }
    wake();
    return stop;
    // The scene lives for one building; run/outcome are read live through the ref.
  }, [kind, seed, model]);
  useEffect(() => wakeRef.current?.(), [idle]);
  return <div ref={ref} className="village-scene" role="img" aria-label={`${item.emoji} ${item.name} inşaatı`} />;
}
