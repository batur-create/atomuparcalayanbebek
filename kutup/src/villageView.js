// Canvas view of the village. The static world (ground, roads, buildings) is
// painted once into 256px tiles per zoom level and cached, and blitted onto the
// map canvas only when the camera moves. Everything alive (smoke, walkers,
// villagers, balloons, window glow, birds, lamp light, a celebration) is painted
// on a second, transparent canvas on top, so a puff of smoke never repaints
// the whole map. The loop sleeps whenever nothing that moves is on screen.
import { drawParkMotion, PARK_LAMPS } from "./kuguluPark.js";
import { useCanvas, useSVG, mirrored } from "./iso.js";
import { GROUND, MEMBER_COLORS, pointOnPath } from "./villageWorld.js";
import { AVATAR_BG, avatarImage, parseAvatar } from "../shared/avatars.js";
import { HOUSE_SCREEN, lodFor } from "./koy2/life.js";
import { drawCar, drawCrossing, drawPuffs, drawWhistle, obox } from "./koy2/trainArt.js";

const TS = 256;
const MAX_TILES = 40;
const scaleFor = (level) => 2 ** (level / 2);
// Never ask for more visible tiles than fit in the cache. Otherwise a large
// fullscreen map keeps evicting tiles that the next frame immediately needs.
export function tileLevel(scale, width, height) {
  let level = Math.ceil(Math.log2(Math.max(0.0001, scale) * 0.97) * 2);
  while ((Math.ceil(width * scaleFor(level) / scale / TS) + 1) *
    (Math.ceil(height * scaleFor(level) / scale / TS) + 1) > MAX_TILES) level--;
  return level;
}
const screen = (x, y, z = 0) => [(x - y) * 0.866, (x + y) * 0.5 - z];

// How much may move: Ben → Görünüm (html[data-motion]) or, until someone picks,
// the phone's own setting. "calm" rests the ambient life but keeps transitions
// and answers to real events; "still" moves nothing on its own.
const reduceQuery = typeof window !== "undefined" ? window.matchMedia?.("(prefers-reduced-motion: reduce)") : null;
export function motionLevel() {
  const picked = document.documentElement.dataset.motion;
  if (picked === "full" || picked === "calm" || picked === "still") return picked;
  return reduceQuery?.matches ? "still" : "full";
}

// Birds: a small flock crosses the sky now and then, by day only.
const FLOCK_EVERY = 17,
  FLOCK_CROSS = 9;
const CONFETTI = ["#f2c14e", "#eca0b7", "#86bf98", "#8ab2da", "#a99be0", "#efac85", "#fffdf7"];
const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

export function createView(canvas, { interactive = false, onPick = () => {}, onCamera = () => {}, onTrain = () => {}, onFollow = () => {} } = {}) {
  const bg = canvas.getContext("2d");
  // The live layer: same size, on top, never in the way of a finger.
  const layer = document.createElement("canvas");
  layer.className = "village-live";
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:absolute;left:0;top:0;pointer-events:none";
  canvas.after(layer);
  const ctx = layer.getContext("2d");
  let parks = [];
  let world = null,
    sky = null,
    tint = (c) => c,
    gen = 0,
    fallback = null,
    painted = "";
  let W = 1,
    H = 1,
    dpr = 1;
  const cam = { x: 0, y: 0, s: 6 };
  let minS = 1.5,
    maxS = 30;
  const tiles = new Map();
  let raf = 0,
    lastLive = 0,
    visible = true,
    destroyed = false,
    selected = null,
    flight = null,
    still = false,
    liveTimer = 0,
    liveDue = 0,
    party = null,
    alive = false,
    smooth = false,
    wakeIn = 0,
    lod = null;
  const start = performance.now();

  // ---------- tiles ----------
  function renderTile(L, i, j) {
    const ls = scaleFor(L);
    const c = document.createElement("canvas");
    c.width = c.height = Math.round(TS * dpr);
    const t = c.getContext("2d");
    t.scale(dpr, dpr);
    const ox = i * TS,
      oy = j * TS;
    t.fillStyle = tint(GROUND);
    t.fillRect(0, 0, TS, TS);
    const at = (wx, wy) => (x, y, z) => [
      (wx + x - wy - y) * 0.866 * ls - ox,
      (wx + x + wy + y) * 0.5 * ls - z * ls - oy,
    ];
    const view = { s: ls, ctx: t, at, tint, detail: world.detailFor(ls) };
    useCanvas(t, tint, Math.max(0.35, ls / 15));
    try {
      for (const item of world.query(ox / ls, oy / ls, (ox + TS) / ls, (oy + TS) / ls)) item.draw(view);
    } finally {
      useSVG();
    }
    return c;
  }
  const keyOf = (g, L, i, j) => `${g}:${L}:${i}:${j}`;
  function store(key, canvasTile) {
    tiles.set(key, { c: canvasTile, used: performance.now() });
    if (tiles.size > MAX_TILES) {
      const old = [...tiles.entries()].sort((a, b) => a[1].used - b[1].used);
      for (let k = 0; k < tiles.size - MAX_TILES; k++) tiles.delete(old[k][0]);
    }
  }
  function visibleRange(L) {
    const ls = scaleFor(L);
    const x0 = cam.x - W / 2 / cam.s,
      y0 = cam.y - H / 2 / cam.s,
      x1 = cam.x + W / 2 / cam.s,
      y1 = cam.y + H / 2 / cam.s;
    return [Math.floor((x0 * ls) / TS), Math.floor((y0 * ls) / TS), Math.floor((x1 * ls) / TS), Math.floor((y1 * ls) / TS)];
  }
  function blit(g, L, missing) {
    const ls = scaleFor(L),
      size = (TS / ls) * cam.s;
    const [i0, j0, i1, j1] = visibleRange(L);
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++) {
        const tile = tiles.get(keyOf(g, L, i, j));
        const dx = ((i * TS) / ls - cam.x) * cam.s + W / 2,
          dy = ((j * TS) / ls - cam.y) * cam.s + H / 2;
        if (tile) {
          tile.used = performance.now();
          bg.drawImage(tile.c, dx, dy, size + 0.6, size + 0.6);
        } else if (missing) missing.push([i, j, Math.hypot(dx + size / 2 - W / 2, dy + size / 2 - H / 2)]);
      }
  }

  // ---------- live layer ----------
  const atScreen = (wx, wy, z = 0) => {
    const [sx, sy] = screen(wx, wy, z);
    return [(sx - cam.x) * cam.s + W / 2, (sy - cam.y) * cam.s + H / 2];
  };
  const onScreen = ([x, y], m = 60) => x > -m && y > -m && x < W + m && y < H + m;
  // Whether any of a box in iso units (a whole stroll) can be seen.
  const boxShown = ([x0, y0, x1, y1]) => {
    const hw = W / 2 / cam.s + 4,
      hh = H / 2 / cam.s + 4;
    return x1 > cam.x - hw && x0 < cam.x + hw && y1 > cam.y - hh && y0 < cam.y + hh;
  };
  // Paints the live layer. Sets `alive` when something on screen is moving,
  // `smooth` when that something needs every display frame (a train crossing
  // the screen), and `wakeIn` (ms) when nothing moves now but something will
  // later (birds, the end of a still celebration), so the loop can sleep in between.
  function drawLive(now, level) {
    const time = (now - start) / 1000;
    const s = cam.s,
      ambient = level === "full" && !still;
    alive = false;
    smooth = false;
    wakeIn = 0;
    trainHits = [];
    // Lamp glow at night.
    if (sky?.lamps)
      for (const item of world.lamps) {
        const p = atScreen(item.x, item.y, 2.0);
        if (!onScreen(p)) continue;
        const r = s * 2.4;
        const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
        g.addColorStop(0, "rgba(255,226,150,.42)");
        g.addColorStop(1, "rgba(255,226,150,0)");
        ctx.fillStyle = g;
        ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
      }
    // Someone is focusing at home: their window light breathes slowly.
    for (const glow of world.glows) {
      const p = atScreen(glow.x, glow.y, glow.z);
      const r = s * glow.r;
      if (!onScreen(p, r)) continue;
      const breath = ambient ? (Math.sin(time * 1.35 + glow.seed) + 1) / 2 : 0.5;
      if (ambient) alive = true;
      const a = sky?.night > 0.5 ? 0.42 + breath * 0.2 : 0.36 + breath * 0.26,
        radius = r * (1 + breath * 0.1);
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.scale(1, 0.72);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      g.addColorStop(0, `rgba(255,214,140,${a})`);
      g.addColorStop(0.45, `rgba(255,190,105,${a * 0.5})`);
      g.addColorStop(1, "rgba(255,190,105,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      ctx.restore();
    }
    // Chimney smoke above the homes of whoever is in the library.
    for (const puff of world.smoke) {
      const base = atScreen(puff.x, puff.y, puff.z);
      if (!onScreen(base)) continue;
      if (ambient) alive = true;
      for (let i = 0; i < 3; i++) {
        const k = ambient ? (time * 0.35 + i / 3 + (puff.seed % 7) / 7) % 1 : 0.3 + i * 0.25;
        ctx.globalAlpha = 0.65 * (1 - k);
        ctx.fillStyle = tint("#f1ece2");
        ctx.beginPath();
        ctx.arc(base[0] + Math.sin(k * 5 + i) * s * 0.35, base[1] - k * s * 2.6, s * (0.22 + k * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // Kuğulu Park: water life only, on the existing transparent live canvas.
    for (const park of parks) {
      const center = atScreen(park.x, park.y);
      const detail = world.detailFor(s);
      if (!detail || !onScreen(center, s * 18)) continue;
      const moving = ambient && detail === 2 && s >= 5;
      if (moving) alive = true;
      const base = lifeAt(park.x, park.y);
      const facing = park.building.facing ?? 0;
      const P = facing ? mirrored(base) : base;
      // Emissive light stays warm after the world's night tint. These pools
      // are still images on the existing live layer, not pulsing animations.
      if (sky?.night > 0.5) for (const [x,y] of PARK_LAMPS) {
        const q=P(x,y,.08),head=P(x,y,2.05),r=s*1.15;
        ctx.save();ctx.translate(q[0],q[1]);ctx.scale(1,.55);
        const glow=ctx.createRadialGradient(0,0,0,0,0,r);
        glow.addColorStop(0,'rgba(255,218,139,.36)');glow.addColorStop(1,'rgba(255,218,139,0)');
        ctx.fillStyle=glow;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
        const halo=ctx.createRadialGradient(head[0],head[1],0,head[0],head[1],s*.4);
        halo.addColorStop(0,'rgba(255,231,170,.65)');halo.addColorStop(1,'rgba(255,219,140,0)');
        ctx.fillStyle=halo;ctx.fillRect(head[0]-s*.4,head[1]-s*.4,s*.8,s*.8);
      }
      useCanvas(ctx, tint, Math.max(0.35, s / 15));
      try { drawParkMotion(P, { time: moving ? time : 0, seed: park.building.seed || 0, detail, lit: sky?.night > 0.5, ctx }); }
      finally { useSVG(); }
    }
    const k = Math.max(0.55, Math.min(1.6, s / 9));
    if (world.life) shared(level, time, k);
    // Neighbours stroll to the square and back, resting a moment at each end.
    for (const v of world.villagers) {
      if (!boxShown(v.box)) continue;
      let t = v.rest,
        dir = 1,
        walking = false;
      if (ambient) {
        alive = true;
        const one = v.path.total / v.speed,
          pause = 2.5,
          cycle = 2 * (one + pause),
          u = (time + v.phase * cycle) % cycle;
        if (u < one) [t, walking] = [u / one, true];
        else if (u < one + pause) t = 1;
        else if (u < 2 * one + pause) [t, dir, walking] = [1 - (u - one - pause) / one, -1, true];
        else [t, dir] = [0, -1];
      }
      const [x, y] = pointOnPath(v.path, t),
        [nx, ny] = pointOnPath(v.path, Math.max(0, Math.min(1, t + dir * 0.01)));
      const p = atScreen(x, y);
      if (!onScreen(p, 30)) continue;
      const face = nx - ny >= x - y ? 1 : -1;
      villager(p[0], p[1], k, v, walking ? time * 7 + v.phase * 10 : null, face);
    }
    // Friends on the way walk the road towards the square.
    for (const w of world.walkers) {
      if (!boxShown(w.box)) continue;
      if (ambient) alive = true;
      const t = ambient ? ((time / Math.max(8, w.path.total / 1.4) + (w.member.id.charCodeAt(0) % 10) / 10) % 1) : 0.35;
      const [x, y] = pointOnPath(w.path, t);
      const p = atScreen(x, y);
      if (!onScreen(p)) continue;
      const bob = ambient ? Math.abs(Math.sin(time * 7)) * 1.6 * k : 0;
      ctx.fillStyle = "rgba(40,50,30,.22)";
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], 5 * k, 2 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = MEMBER_COLORS[w.member.color] || "#a99be0";
      ctx.beginPath();
      ctx.roundRect?.(p[0] - 3.4 * k, p[1] - 13 * k - bob, 6.8 * k, 10 * k, 3 * k);
      ctx.fill();
      bubble(p[0], p[1] - 19 * k - bob, w.member, 8.5 * k, false);
    }
    // Avatar balloons above homes: 🎧 for those focusing, a coffee for a break.
    for (const b of world.balloons) {
      const p = atScreen(b.x, b.y, b.z);
      if (!onScreen(p)) continue;
      if (ambient) alive = true;
      const float = ambient ? Math.sin(time * 1.6 + b.x) * 2 : 0;
      const r = Math.max(9, Math.min(15, s * 0.9));
      const resting = b.member.status === "break" || (b.focus && b.member.focusPausedAt > 0);
      bubble(p[0], p[1] - r - 6 + float, b.member, r, true, b.focus && !resting ? "🎧" : resting ? "☕" : null);
    }
    // District names while zoomed out (the signs carry them when close).
    const districtLabels = [];
    if (interactive && s < 9 && s > (world.districts.some((d) => d.personal) ? 0.65 : 2))
      for (const d of [...world.districts].sort((a, b) => Number(!!b.personal && b.memberId === world.me) - Number(!!a.personal && a.memberId === world.me))) {
        if (!d.memberId) continue;
        if (s < 4.2 && !world.farLabels.has(d.id)) continue;
        const name = d.label || world.names?.get(d.memberId);
        if (!name) continue;
        const [x, y] = d.layout.sign;
        const p = atScreen(x, y, 2.2);
        if (!onScreen(p, 100)) continue;
        if (d.personal) {
          ctx.font = '700 11px "DM Sans", sans-serif';
          const w = ctx.measureText(name).width + 20, box = [p[0] - w / 2, p[1] - 22, p[0] + w / 2, p[1] + 6];
          if (districtLabels.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
          districtLabels.push(box);
        }
        pill(p[0], p[1] - 8, name);
      }
    if (selected) {
      const item = world.byId.get(selected);
      if (item) {
        const p = atScreen(item.x, item.y);
        if (ambient && onScreen(p)) alive = true;
        const pulse = ambient ? (Math.sin(time * 4) + 1) / 2 : 0.5;
        ctx.strokeStyle = `rgba(255,255,255,${0.55 + pulse * 0.4})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], s * (item.sp.hw + 1) * 1.6, s * (item.sp.hw + 1) * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // A small flock crosses the sky now and then, by day.
    if (ambient && sky && sky.night < 0.5 && !world.life) {
      const clock = time + 12; // the first flock comes a few seconds after the map opens
      const round = Math.floor(clock / FLOCK_EVERY),
        u = clock - round * FLOCK_EVERY;
      if (u < FLOCK_CROSS) {
        alive = true;
        birds(round, u / FLOCK_CROSS, time);
      } else wakeIn = (FLOCK_EVERY - u) * 1000;
    }
    if (party) celebration(now, level);
  }
  // ---------- the v2 village's shared life (src/koy2/life.js) ----------
  // Everything comes from the shared clock, so this only draws: no state is
  // kept between frames apart from the level of detail and its hysteresis.
  const lifeAt = (wx, wy) => (x, y, z) => [
    ((wx + x - wy - y) * 0.866 - cam.x) * cam.s + W / 2,
    ((wx + x + wy + y) * 0.5 - z - cam.y) * cam.s + H / 2,
  ];
  function viewRect(m = 6) {
    // The screen's corners in world x/y (the inverse of the iso projection).
    const hw = W / 2 / cam.s + m,
      hh = H / 2 / cam.s + m;
    const xs = [],
      ys = [];
    for (const [sx, sy] of [[cam.x - hw, cam.y - hh], [cam.x + hw, cam.y - hh], [cam.x - hw, cam.y + hh], [cam.x + hw, cam.y + hh]]) {
      xs.push(sy + sx / 1.732);
      ys.push(sy - sx / 1.732);
    }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  function shared(level, time, k) {
    lod = lodFor(lod, cam.s * HOUSE_SCREEN);
    const out = world.life.at(Date.now(), viewRect(), { lod, motion: still ? "calm" : level, sky, focus: world.lifeFocus });
    const moving = level === "full" && !still;
    const w = out.weather;
    if (w.puddles > 0 || w.kind === "rain") puddles(w.kind ? w.strength : w.puddles);
    // People, back to front; whoever is behind a wall or a tree goes behind it.
    const people = [...out.people].sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const f of people) {
      const p = atScreen(f.x, f.y);
      if (!onScreen(p, 30)) continue;
      const face = f.face[0] - f.face[1] >= 0 ? 1 : -1;
      villager(p[0], p[1], k, world.lookOf(f.home), f.walking ? f.step : null, face);
      cover(f.x, f.y, p, k);
    }
    if (world.train) trainLayer(level, time, k);
    if (out.ducks) ducks(out.ducks, time, k);
    if (out.boat) rowboat(out.boat, time, k);
    if (out.nature) nature(out.nature, time, k);
    if (w.kind) weatherLayer(w, time, moving);
    if (out.moving && moving) alive = true;
    else if (moving && lod > 0) wakeIn = wakeIn ? Math.min(wakeIn, 2000) : 2000;
  }
  // ---------- the little train (src/koy2/train.js, n49) ----------
  // Shown at every level of detail: from far away it is the village's one big
  // moving thing. With motion off only a train standing at the platform shows.
  const OCCLUDE = ["building", "tree", "bush", "rock", "lamp", "fountain"];
  function trainLayer(level, time, k) {
    const tr = world.train;
    const motion = still ? "calm" : level;
    const ambient = motion === "full";
    const now = Date.now();
    const out = tr.at(now, { motion });
    const s = cam.s;
    const A = (x, y, z = 0) => atScreen(x, y, z);
    const night = sky?.night || 0;
    // Passengers stand on the village's side of the track: behind the train.
    // A materials train's workers wear a hard hat and a high-visibility vest.
    for (const f of out.riders) {
      const p = atScreen(f.x, f.y);
      if (!onScreen(p, 30)) continue;
      const face = f.face[0] - f.face[1] >= 0 ? 1 : -1;
      const look = world.lookOf(f.home);
      villager(p[0], p[1], k, f.worker ? { ...look, coat: "#ee7a2f", hat: 3, hatColor: "#f4c430" } : look, f.walking ? f.step : null, face);
      if (f.load) shoulderLoad(p[0], p[1], k, face, f.load, f.walking ? f.step : null);
      cover(f.x, f.y, p, k);
    }
    useCanvas(ctx, tint, Math.max(0.35, s / 15));
    let seen = false,
      carSeen = false;
    try {
      const blink = ambient ? Math.floor(time * 2.2) % 2 : null;
      for (const c of out.crossings) {
        if (!onScreen(atScreen(c.x, c.y), s * 4)) continue;
        drawCrossing(A, c, c.close, blink, s, ctx, world.railWidth || 1.7);
        if (ambient && c.close > 0) seen = true;
      }
      const cars = [...out.cars].sort((a, b) => a.x + a.y - (b.x + b.y));
      for (const car of cars) {
        const p = atScreen(car.x, car.y);
        if (!onScreen(p, s * car.len)) continue;
        seen = carSeen = true;
        trainHits.push({ x: p[0], y: p[1] - s * 0.8, r: Math.max(20, s * car.len * 0.7) });
        drawCar(A, car, { s, night, ctx });
        trainCover(car, p);
      }
      if (out.puffs.length) drawPuffs(ctx, A, out.puffs, s, tint);
      const loco = out.cars.find((c) => c.kind === "loco");
      let blow = out.whistle;
      const tootAge = now - honkAt;
      if (loco && tootAge >= 0 && tootAge < 1800) {
        blow = tootAge / 1800;
        alive = true;
        smooth = true;
      }
      if (blow !== null && loco) drawWhistle(ctx, A, loco, blow, s);
    } finally {
      useSVG();
    }
    if (!ambient) return;
    // A train sliding across the screen at 24 fps judders (the frames land
    // 17, 50 or 67 ms apart): while one is seen moving, every display frame.
    if (seen && out.moving) {
      alive = true;
      if (carSeen && out.speed > 0.05) smooth = true;
    } else {
      // Off screen: look again soon while a train is on the line, else when the next one is due.
      const next = out.run ? 1000 : Math.max(500, tr.nextIn(now));
      wakeIn = wakeIn ? Math.min(wakeIn, next) : next;
    }
  }
  // A mother duck and her ducklings: paddling in a line, or resting by the shore.
  function ducks(d, time, k) {
    for (const [i, q] of d.brood.entries()) {
      const p = atScreen(q.x, q.y);
      if (!onScreen(p, 20)) continue;
      const face = q.dx - q.dy >= 0 ? 1 : -1;
      const r = q.big ? 2.7 * k : 1.6 * k;
      if (d.moving) {
        // A small V of ripples behind each one.
        ctx.strokeStyle = "rgba(235,245,250,.55)";
        ctx.lineWidth = Math.max(0.6, 0.5 * k);
        ctx.beginPath();
        const w = r * (1.6 + 0.25 * Math.sin(time * 3 + i));
        ctx.moveTo(p[0] - face * r * 0.6, p[1]);
        ctx.lineTo(p[0] - face * (r + w), p[1] - w * 0.35);
        ctx.moveTo(p[0] - face * r * 0.6, p[1] + r * 0.3);
        ctx.lineTo(p[0] - face * (r + w), p[1] + w * 0.45);
        ctx.stroke();
      }
      const bob = d.moving ? Math.sin(time * 4 + i * 1.3) * 0.25 * k : 0;
      ctx.fillStyle = tint(q.big ? "#8b6d4c" : "#f2d36b");
      ctx.beginPath();
      ctx.ellipse(p[0], p[1] - r * 0.45 + bob, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p[0] + face * r * 0.75, p[1] - r * 1.05 + bob, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tint("#e89a3c");
      ctx.beginPath();
      ctx.ellipse(p[0] + face * r * 1.2, p[1] - r * 1.0 + bob, r * 0.24, r * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // A rowing boat with one rower, oars dipping in turn.
  function rowboat(b, time, k) {
    const p = atScreen(b.x, b.y);
    if (!onScreen(p, 40)) return;
    const len = Math.hypot(b.dx, b.dy) || 1,
      dx = b.dx / len,
      dy = b.dy / len;
    const A = (x, y, z = 0) => atScreen(x, y, z);
    // The wake: two lines opening behind.
    ctx.strokeStyle = "rgba(235,245,250,.6)";
    ctx.lineWidth = Math.max(0.8, 0.6 * k);
    ctx.beginPath();
    for (const side of [-1, 1]) {
      ctx.moveTo(...A(b.x - dx * 1.1, b.y - dy * 1.1));
      ctx.lineTo(...A(b.x - dx * 3.2 - dy * side * 0.6, b.y - dy * 3.2 + dx * side * 0.6));
    }
    ctx.stroke();
    useCanvas(ctx, tint, Math.max(0.35, cam.s / 15));
    try {
      obox(A, b.x, b.y, dx, dy, -1.1, 1.1, -0.42, 0.42, 0.02, 0.32, ["#7a5434", "#b07a45", "#9a6838"]);
      obox(A, b.x, b.y, dx, dy, -0.9, 0.9, -0.3, 0.3, 0.2, 0.25, ["#5e4029", "#5e4029", "#5e4029"]);
    } finally {
      useSVG();
    }
    // Oars sweep back and forth.
    const stroke = Math.sin(b.u * 2.6);
    ctx.strokeStyle = tint("#c79a62");
    ctx.lineWidth = Math.max(1, 0.5 * k);
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const o = [b.x - dy * side * 0.35, b.y + dx * side * 0.35];
      const tip = [o[0] + dx * stroke * 0.7 - dy * side * 1.2, o[1] + dy * stroke * 0.7 + dx * side * 1.2];
      ctx.moveTo(...A(o[0], o[1], 0.45));
      ctx.lineTo(...A(tip[0], tip[1], 0.05 + Math.max(0, -stroke) * 0.25));
    }
    ctx.stroke();
    const seat = atScreen(b.x - dx * 0.2, b.y - dy * 0.2, 0.25);
    villager(seat[0], seat[1] + 3.5 * k, k, world.lookOf("boat"), null, dx - dy >= 0 ? -1 : 1);
    cover(b.x, b.y, p, k * 1.6);
  }
  // What stands beyond the track, on the camera's side, is drawn again over a car.
  function trainCover(car, p) {
    const [sx, sy] = screen(car.x, car.y);
    const reach = car.len * 0.6 + 1;
    let nx = -car.dy,
      ny = car.dx;
    if (nx + ny < 0) [nx, ny] = [-nx, -ny];
    const list = world.query(sx - reach, sy - 2.4, sx + reach, sy + 0.6).filter((it) => it.depth !== undefined && OCCLUDE.includes(it.type) && (it.x - car.x) * nx + (it.y - car.y) * ny > 1.4 && it.depth > car.x + car.y);
    if (!list.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(p[0] - reach * cam.s, p[1] - 2.4 * cam.s, reach * 2 * cam.s, 3 * cam.s);
    ctx.clip();
    try {
      const v = { s: cam.s, ctx, at: lifeAt, tint, detail: world.detailFor(cam.s) };
      for (const it of list) it.draw(v);
    } finally {
      ctx.restore();
    }
  }
  // Redraws, clipped to a figure's own small box, whatever stands in front of it (B's depth mask).
  function cover(x, y, p, k) {
    if (!world.occludersAt) return;
    const list = world.occludersAt(x, y, 0.5, 1.7);
    if (!list.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(p[0] - 6 * k, p[1] - 18 * k, 12 * k, 20 * k);
    ctx.clip();
    useCanvas(ctx, tint, Math.max(0.35, cam.s / 15));
    try {
      const v = { s: cam.s, ctx, at: lifeAt, tint, detail: world.detailFor(cam.s) };
      for (const it of list) it.draw(v);
    } finally {
      useSVG();
      ctx.restore();
    }
  }
  function puddles(alpha) {
    for (const q of world.life.puddles) {
      const p = atScreen(q.x, q.y);
      if (!onScreen(p)) continue;
      ctx.fillStyle = `rgba(150,176,196,${0.55 * alpha})`;
      ctx.beginPath();
      ctx.ellipse(p[0], p[1], q.size * cam.s * 1.3, q.size * cam.s * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(235,244,250,${0.35 * alpha})`;
      ctx.beginPath();
      ctx.ellipse(p[0] - q.size * cam.s * 0.35, p[1] - q.size * cam.s * 0.12, q.size * cam.s * 0.45, q.size * cam.s * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Rain or snow over the whole view: a light veil, and (with motion on) the drops themselves.
  function weatherLayer(w, time, moving) {
    const snow = w.kind === "snow";
    ctx.fillStyle = snow ? `rgba(236,240,246,${0.14 * w.strength})` : `rgba(92,104,128,${0.13 * w.strength})`;
    ctx.fillRect(0, 0, W, H);
    if (!moving) return;
    const count = Math.round(Math.min(160, (W * H) / 2600) * w.strength);
    ctx.strokeStyle = "rgba(214,226,240,.55)";
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const a = (Math.sin(i * 12.9898) * 43758.5453) % 1,
        b = (Math.sin(i * 78.233) * 12543.1234) % 1;
      const fall = snow ? 26 + Math.abs(b) * 12 : 420 + Math.abs(b) * 160;
      const x = ((Math.abs(a) * W + time * (snow ? 8 : 60) + Math.sin(time + i) * (snow ? 6 : 0)) % (W + 20)) - 10,
        y = ((Math.abs(b) * H + time * fall) % (H + 20)) - 10;
      if (snow) {
        ctx.moveTo(x + 1.4, y);
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2.5, y + 9);
      }
    }
    if (snow) ctx.fill();
    else ctx.stroke();
  }
  function nature(n, time, k) {
    if (n.kind === "birds") {
      // Three small birds on the bank, pecking and hopping.
      const len = Math.hypot(n.dir[0], n.dir[1]) || 1;
      for (let i = 0; i < n.count; i++) {
        const off = (i - 1) * 0.9,
          hop = Math.max(0, Math.sin(time * 5 + i * 2.1)) * 0.25;
        const p = atScreen(n.x + (n.dir[0] / len) * off, n.y + (n.dir[1] / len) * off, hop);
        if (!onScreen(p)) continue;
        const side = i % 2 ? 1 : -1;
        ctx.fillStyle = "rgba(40,50,30,.18)";
        ctx.beginPath();
        ctx.ellipse(p[0], p[1] + hop * cam.s, 2.4 * k, 0.9 * k, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tint("#6b5d55");
        ctx.beginPath();
        ctx.ellipse(p[0], p[1] - 2 * k, 2.6 * k, 1.6 * k, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p[0] + side * 2.2 * k, p[1] - (3.2 + Math.max(0, Math.sin(time * 3 + i)) * 1.2) * k, 1.2 * k, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (n.kind === "butterflies") {
      const [x0, y0, x1, y1] = n.box;
      for (let i = 0; i < n.count; i++) {
        const u = n.u + i * 3.1;
        const x = (x0 + x1) / 2 + Math.cos(u * 0.9 + i * 2) * (x1 - x0) * 0.3,
          y = (y0 + y1) / 2 + Math.sin(u * 1.3 + i) * (y1 - y0) * 0.3;
        const p = atScreen(x, y, 0.9 + Math.sin(u * 2.3) * 0.3);
        if (!onScreen(p)) continue;
        const flap = Math.abs(Math.sin(time * 14 + i)) * 2.2 * k + 0.6 * k;
        ctx.fillStyle = i % 2 ? "#f29bb8" : "#f7d154";
        ctx.beginPath();
        ctx.ellipse(p[0] - 1.3 * k, p[1], flap, 1.6 * k, -0.4, 0, Math.PI * 2);
        ctx.ellipse(p[0] + 1.3 * k, p[1], flap, 1.6 * k, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (n.kind === "fireflies") {
      // Little lights drifting low over the grass, each blinking on its own beat.
      const fade = Math.min(1, n.u / 4, (n.stay - n.u) / 4);
      for (let i = 0; i < n.count; i++) {
        const a = i * 2.39996,
          u = n.u * (0.35 + (i % 3) * 0.08);
        const x = n.x + Math.cos(a + u) * n.r * (0.4 + 0.6 * ((i * 0.37) % 1)),
          y = n.y + Math.sin(a * 1.3 + u * 1.2) * n.r * (0.4 + 0.6 * ((i * 0.61) % 1));
        const p = atScreen(x, y, 0.5 + 0.4 * Math.sin(u * 2 + i));
        if (!onScreen(p)) continue;
        const glow = Math.max(0, Math.sin(time * (1.6 + (i % 4) * 0.35) + i * 1.7)) * fade;
        if (glow < 0.05) continue;
        const r = 4.5 * k;
        const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
        g.addColorStop(0, `rgba(240,255,170,${glow})`);
        g.addColorStop(0.25, `rgba(220,255,130,${0.6 * glow})`);
        g.addColorStop(1, "rgba(200,255,120,0)");
        ctx.fillStyle = g;
        ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
      }
      return;
    }
    if (n.kind === "wind") {
      // A breath of wind: a few leaves leave each tree's crown and drift down.
      const q = n.u / n.stay;
      ctx.fillStyle = tint(sky?.season === "autumn" ? "#d98a3a" : "#7fb257");
      ctx.globalAlpha = Math.max(0, 1 - q);
      for (const t of n.trees) {
        for (let i = 0; i < 3; i++) {
          const p = atScreen(t.x + (i - 1) * 0.5 + q * 1.4, t.y - q * 0.6, 2.2 * t.size - q * 1.6);
          if (!onScreen(p)) continue;
          ctx.beginPath();
          ctx.ellipse(p[0], p[1] + Math.sin(time * 6 + i) * 2, 1.6 * k, 0.8 * k, time * 3 + i, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  // A neighbour: shadow, legs, coat, face and hat. `step` is the walk cycle
  // (null while standing); `face` is 1 when heading right on screen, -1 left.
  function villager(x, y, k, v, step, face) {
    const bob = step === null ? 0 : Math.abs(Math.sin(step)) * 0.9 * k,
      swing = step === null ? 0 : Math.sin(step) * 1.3 * k,
      top = y - bob;
    ctx.fillStyle = "rgba(40,50,30,.22)";
    ctx.beginPath();
    ctx.ellipse(x, y, 4.2 * k, 1.6 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = tint("#4b4458");
    ctx.lineWidth = 1.4 * k;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 1.1 * k, top - 4.2 * k);
    ctx.lineTo(x - 1.1 * k + swing, y - 0.4 * k);
    ctx.moveTo(x + 1.1 * k, top - 4.2 * k);
    ctx.lineTo(x + 1.1 * k - swing, y - 0.4 * k);
    ctx.stroke();
    ctx.fillStyle = tint(v.coat);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 3.1 * k, top - 11.6 * k, 6.2 * k, 8 * k, 2.6 * k);
    else ctx.rect(x - 3.1 * k, top - 11.6 * k, 6.2 * k, 8 * k);
    ctx.fill();
    const hx = x + face * 0.5 * k,
      hy = top - 13.7 * k;
    ctx.fillStyle = tint(v.skin);
    ctx.beginPath();
    ctx.arc(hx, hy, 2.5 * k, 0, Math.PI * 2);
    ctx.fill();
    if (k >= 0.7) {
      ctx.fillStyle = "#3a3340";
      for (const ex of [-0.85, 0.85]) {
        ctx.beginPath();
        ctx.arc(hx + face * 0.7 * k + ex * k, hy + 0.2 * k, 0.36 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = tint(v.hatColor);
    ctx.beginPath();
    if (v.hat === 0) {
      // A straw hat with a wide brim.
      ctx.ellipse(hx, hy - 1.5 * k, 4 * k, 1.15 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx, hy - 1.7 * k, 2.1 * k, Math.PI, Math.PI * 2);
    } else if (v.hat === 1) {
      // A knitted cap with a pompom.
      ctx.arc(hx, hy - 0.6 * k, 2.65 * k, Math.PI, Math.PI * 2);
      ctx.moveTo(hx + 0.9 * k, hy - 3.6 * k);
      ctx.arc(hx, hy - 3.6 * k, 0.9 * k, 0, Math.PI * 2);
    } else if (v.hat === 3) {
      // A builder's hard hat: a dome and a short brim all round.
      ctx.arc(hx, hy - 0.9 * k, 2.75 * k, Math.PI, Math.PI * 2);
      ctx.ellipse(hx, hy - 0.85 * k, 3.4 * k, 0.75 * k, 0, 0, Math.PI * 2);
    } else {
      // A flat cap, its peak towards where they are going.
      ctx.arc(hx, hy - 0.8 * k, 2.6 * k, Math.PI, Math.PI * 2);
      ctx.ellipse(hx + face * 2.1 * k, hy - 0.85 * k, 1.9 * k, 0.6 * k, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  // A load on a worker's shoulder: bricks, a few planks or a cement sack.
  const LOAD_ART = { bricks: ["#c8603f", "#9c4630"], logs: ["#c08a55", "#8f6238"], cement: ["#ece3cf", "#b9ad92"] };
  function shoulderLoad(x, y, k, face, load, step) {
    const bob = step === null ? 0 : Math.abs(Math.sin(step)) * 0.9 * k;
    const [fill, edge] = (LOAD_ART[load] || LOAD_ART.bricks).map(tint);
    const cx = x - face * 1.6 * k,
      cy = y - bob - 13.4 * k;
    const [w, h] = load === "logs" ? [9 * k, 1.9 * k] : load === "cement" ? [5.6 * k, 2.8 * k] : [4.8 * k, 3.4 * k];
    ctx.fillStyle = fill;
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(0.5, 0.45 * k);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - w / 2, cy - h / 2, w, h, load === "cement" ? 1.2 * k : 0.4 * k);
    else ctx.rect(cx - w / 2, cy - h / 2, w, h);
    ctx.fill();
    ctx.stroke();
    if (load === "bricks") {
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, cy);
      ctx.lineTo(cx + w / 2, cy);
      ctx.stroke();
    }
    // The near hand up to hold it.
    ctx.strokeStyle = tint("#4b4458");
    ctx.lineWidth = 1.2 * k;
    ctx.beginPath();
    ctx.moveTo(cx + face * 1.2 * k, cy + h / 2);
    ctx.lineTo(x + face * 1.4 * k, y - bob - 8.5 * k);
    ctx.stroke();
  }
  function birds(round, progress, time) {
    // The same round always flies the same way: alternate sides, a varying height.
    const r = (n) => {
      const v = Math.sin(round * 12.9898 + n * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const dir = round % 2 ? -1 : 1,
      count = r(1) < 0.5 ? 3 : 4,
      span = W + 140,
      lead = dir > 0 ? -70 + progress * span : W + 70 - progress * span,
      height = H * (0.12 + r(2) * 0.3) + (r(3) - 0.5) * H * 0.12 * progress;
    ctx.strokeStyle = "rgba(78,72,96,.62)";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const row = Math.ceil(i / 2),
        side = i % 2 ? 1 : -1,
        bx = lead - dir * row * 13,
        by = height + side * row * 7 + Math.sin(time * 1.3 + i) * 2,
        size = 4.6 + r(4 + i) * 1.6,
        flap = Math.sin(time * 9 + i * 1.9) * size * 0.55;
      ctx.moveTo(bx - size, by - flap);
      ctx.quadraticCurveTo(bx - size * 0.45, by - size * 0.15, bx, by + size * 0.15);
      ctx.quadraticCurveTo(bx + size * 0.45, by - size * 0.15, bx + size, by - flap);
    }
    ctx.stroke();
  }
  // A building was just finished: a ring of light opens around it and confetti
  // flies off the roof for 2.5 s. "still" only marks the spot for a moment.
  function celebration(now, level) {
    const t = (now - party.t0) / 1000;
    if (t > 2.5) {
      party = null;
      return;
    }
    if (t < 0) {
      if (level === "still") wakeIn = Math.max(wakeIn, 16);
      else alive = true;
      return;
    }
    const s = cam.s,
      ground = atScreen(party.x, party.y),
      roof = atScreen(party.x, party.y, party.z),
      rx = s * (party.hw + 1) * 1.6,
      ry = s * (party.hw + 1) * 0.8;
    if (level === "still") {
      ctx.strokeStyle = "rgba(255,238,170,.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ground[0], ground[1], rx * 1.25, ry * 1.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      const left = (2.5 - t) * 1000 + 16;
      wakeIn = wakeIn ? Math.min(wakeIn, left) : left;
      return;
    }
    alive = true;
    // A soft flash on the building, then two rings of light spreading out.
    if (t < 0.9) {
      const a = 0.45 * (1 - t / 0.9),
        r = rx * 1.4;
      const g = ctx.createRadialGradient(roof[0], roof[1], 0, roof[0], roof[1], r);
      g.addColorStop(0, `rgba(255,240,190,${a})`);
      g.addColorStop(1, "rgba(255,240,190,0)");
      ctx.fillStyle = g;
      ctx.fillRect(roof[0] - r, roof[1] - r, r * 2, r * 2);
    }
    for (const [delay, strength] of [[0, 1], [0.35, 0.7]]) {
      const q = (t - delay) / 1.6;
      if (q < 0 || q > 1) continue;
      const e = 1 - Math.pow(1 - q, 3);
      ctx.strokeStyle = `rgba(255,236,170,${0.9 * strength * (1 - q)})`;
      ctx.lineWidth = 1 + 3.5 * (1 - q);
      ctx.beginPath();
      ctx.ellipse(ground[0], ground[1], rx * (0.9 + e * 2.6), ry * (0.9 + e * 2.6), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const scale = Math.max(0.7, Math.min(1.4, s / 12)),
      drift = (1 - Math.exp(-2.2 * t)) / 2.2,
      fade = t > 1.8 ? 1 - (t - 1.8) / 0.7 : 1;
    ctx.globalAlpha = Math.max(0, fade);
    for (const bit of party.bits) {
      const x = roof[0] + (bit.vx * drift + Math.sin(t * 6 + bit.rot) * 3) * scale,
        y = roof[1] + (bit.vy * drift + 40 * t * t) * scale;
      ctx.fillStyle = bit.color;
      if (bit.round) {
        ctx.beginPath();
        ctx.arc(x, y, bit.h * scale, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(bit.rot + bit.spin * t);
        ctx.fillRect((-bit.w / 2) * scale, (-bit.h / 2) * scale, bit.w * scale, bit.h * scale);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
  // A balloon looks the same frame after frame: keep each one as a small bitmap
  // (the soft shadow and the avatar picture are the costly parts to paint).
  const sprites = new Map();
  function bubble(x, y, member, r, pointer, badge = null) {
    r = Math.round(r * 2) / 2;
    const key = `${member.avatar}|${member.color}|${r}|${pointer ? 1 : 0}|${badge || ""}|${dpr}`;
    let sprite = sprites.get(key);
    if (!sprite) {
      const pad = 9,
        left = r + pad,
        top = r * 1.15 + pad;
      const c = document.createElement("canvas");
      c.width = Math.ceil((r * 2.45 + pad * 2) * dpr);
      c.height = Math.ceil((r * 2.6 + pad * 2) * dpr);
      const b = c.getContext("2d");
      b.scale(dpr, dpr);
      sprite = { c, left, top };
      // An avatar picture still loading is painted without it and not kept.
      if (paintBubble(b, left, top, member, r, pointer, badge)) {
        sprites.set(key, sprite);
        if (sprites.size > 48) {
          // Safari lets go of a canvas's memory sooner once it is emptied.
          const [oldest, old] = sprites.entries().next().value;
          old.c.width = old.c.height = 0;
          sprites.delete(oldest);
        }
      }
    }
    // Whole device pixels keep the bitmap sharp.
    ctx.drawImage(sprite.c, Math.round((x - sprite.left) * dpr) / dpr, Math.round((y - sprite.top) * dpr) / dpr, sprite.c.width / dpr, sprite.c.height / dpr);
  }
  function paintBubble(c, x, y, member, r, pointer, badge) {
    let ready = true;
    c.save();
    c.shadowColor = "rgba(40,30,70,.25)";
    c.shadowBlur = 6;
    c.shadowOffsetY = 2;
    c.fillStyle = "#fffdf7";
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    if (pointer) {
      c.moveTo(x - r * 0.35, y + r * 0.85);
      c.lineTo(x, y + r * 1.45);
      c.lineTo(x + r * 0.35, y + r * 0.85);
    }
    c.fill();
    c.restore();
    c.lineWidth = Math.max(1.5, r * 0.16);
    c.strokeStyle = MEMBER_COLORS[member.color] || "#a99be0";
    c.beginPath();
    c.arc(x, y, r - c.lineWidth / 2, 0, Math.PI * 2);
    c.stroke();
    // The member's color as the disc, as in the app; characters are the same SVG as in the page.
    const inner = r - c.lineWidth;
    c.fillStyle = AVATAR_BG[member.color] || AVATAR_BG.lilac;
    c.beginPath();
    c.arc(x, y, inner, 0, Math.PI * 2);
    c.fill();
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (parseAvatar(member.avatar)) {
      const img = avatarImage(member.avatar, request);
      if (img) {
        c.save();
        c.clip();
        c.drawImage(img, x - inner, y - inner, inner * 2, inner * 2);
        c.restore();
      } else ready = false;
    } else {
      c.font = `${Math.round(r * 1.15)}px ${EMOJI}`;
      c.fillText(member.avatar || "🙂", x, y + r * 0.08);
    }
    if (badge) {
      c.font = `${Math.round(r * 0.8)}px ${EMOJI}`;
      c.fillText(badge, x + r * 0.95, y - r * 0.7);
    }
    return ready;
  }
  function pill(x, y, text) {
    ctx.font = '700 11px "DM Sans", sans-serif';
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = "rgba(255,253,247,.92)";
    ctx.beginPath();
    ctx.roundRect?.(x - w / 2, y - 10, w, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#5a4f73";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y + 0.5);
  }

  // ---------- frame loop ----------
  // Keep going only while something that moves is actually on screen (set by drawLive).
  const animated = () => alive && !still;
  function wake(wait) {
    const due = performance.now() + wait;
    if (liveTimer && liveDue <= due + 1) return;
    clearTimeout(liveTimer);
    liveDue = due;
    liveTimer = setTimeout(() => {
      liveTimer = 0;
      request();
    }, wait);
  }
  function frame(now) {
    raf = 0;
    if (destroyed || !world || document.visibilityState === "hidden") return;
    const level = motionLevel();
    if (following) followStep();
    if (flight) {
      const k = Math.min(1, (now - flight.t0) / flight.ms),
        e = 1 - Math.pow(1 - k, 3);
      cam.x = flight.from.x + (flight.to.x - flight.from.x) * e;
      cam.y = flight.from.y + (flight.to.y - flight.from.y) * e;
      cam.s = flight.from.s * Math.pow(flight.to.s / flight.from.s, e);
      if (k >= 1) flight = null;
      onCamera(cam);
    }
    if (inertia) stepInertia();
    // The map canvas is repainted only when the camera or the world changed.
    const L = tileLevel(cam.s, W, H);
    const shot = `${gen}|${L}|${cam.x}|${cam.y}|${cam.s}`;
    let pending = false;
    if (shot !== painted) {
      bg.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg.fillStyle = tint(GROUND);
      bg.fillRect(0, 0, W, H);
      if (fallback && (fallback.g !== gen || fallback.L !== L)) blit(fallback.g, fallback.L, null);
      const missing = [];
      blit(gen, L, missing);
      // Paint missing tiles nearest to the centre first, within a frame budget.
      missing.sort((a, b) => a[2] - b[2]);
      const t0 = performance.now();
      for (const [i, j] of missing) {
        if (performance.now() - t0 > 14) break;
        store(keyOf(gen, L, i, j), renderTile(L, i, j));
      }
      pending = missing.length > 0 && missing.some(([i, j]) => !tiles.has(keyOf(gen, L, i, j)));
      // Even the last newly painted tile must reach the screen before we sleep.
      if (missing.length) blit(gen, L, null);
      if (!pending) fallback = { g: gen, L };
      painted = pending ? "" : shot;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawLive(now, level);
    if (pending || flight || inertia || gestureActive() || (following && followMoving)) request();
    else if (animated() && visible && smooth) request();
    else if (animated() && visible) {
      // Live layer at ~24 fps: smoke, strollers and birds need no more, the battery thanks us.
      const wait = Math.max(0, 42 - (now - lastLive));
      lastLive = now + wait;
      wake(wait);
    } else if (wakeIn && visible) wake(wakeIn);
  }
  function request() {
    if (!raf && !destroyed && visible && document.visibilityState !== "hidden") raf = requestAnimationFrame(frame);
  }

  // ---------- camera ----------
  function clamp() {
    if (!world) return;
    cam.s = Math.max(minS, Math.min(maxS, cam.s));
    const [x0, y0, x1, y1] = world.bounds;
    cam.x = Math.max(x0 - 10, Math.min(x1 + 10, cam.x));
    cam.y = Math.max(y0 - 10, Math.min(y1 + 10, cam.y));
  }
  function zoomAt(px, py, factor) {
    const wx = cam.x + (px - W / 2) / cam.s,
      wy = cam.y + (py - H / 2) / cam.s;
    cam.s = Math.max(minS, Math.min(maxS, cam.s * factor));
    cam.x = wx - (px - W / 2) / cam.s;
    cam.y = wy - (py - H / 2) / cam.s;
    clamp();
    onCamera(cam);
    request();
  }
  function fitBox([x0, y0, x1, y1], pad = 16) {
    const s = Math.min((W - pad * 2) / Math.max(10, x1 - x0), (H - pad * 2) / Math.max(10, y1 - y0));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, s: Math.max(minS, Math.min(maxS, s)) };
  }

  // ---------- the train, close up (n51) ----------
  // Screen circles of the cars drawn last frame (for taps), the camera
  // following the engine, and a toot of the whistle on request.
  let trainHits = [],
    following = false,
    followMoving = false,
    honkAt = 0;
  const trainNow = () => {
    const tr = world?.train;
    if (!tr) return null;
    const out = tr.at(Date.now(), { motion: still ? "calm" : motionLevel() });
    return out.cars.length ? out : null;
  };
  function stopFollow() {
    if (!following) return;
    following = false;
    onFollow(false);
  }
  function followStep() {
    const out = trainNow();
    if (!out) return stopFollow();
    const mid = out.cars[Math.floor(out.cars.length / 2)];
    const [tx, ty] = screen(mid.x, mid.y, 1);
    followMoving = out.speed > 0.05;
    if (flight) {
      flight.to.x = tx;
      flight.to.y = ty;
    } else {
      const k = followMoving ? 0.16 : 0.08;
      cam.x += (tx - cam.x) * k;
      cam.y += (ty - cam.y) * k;
      onCamera(cam);
    }
  }

  // ---------- gestures ----------
  const pointers = new Map();
  let pinch = null,
    tap = null,
    lastTap = null,
    inertia = null,
    track = [];
  const gestureActive = () => pointers.size > 0;
  function stepInertia() {
    inertia.vx *= 0.92;
    inertia.vy *= 0.92;
    cam.x -= inertia.vx / cam.s;
    cam.y -= inertia.vy / cam.s;
    clamp();
    if (Math.hypot(inertia.vx, inertia.vy) < 0.2) inertia = null;
  }
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  function down(e) {
    canvas.setPointerCapture?.(e.pointerId);
    const p = local(e);
    pointers.set(e.pointerId, p);
    inertia = null;
    flight = null;
    track = [[p[0], p[1], e.timeStamp]];
    stopFollow();
    if (pointers.size === 1) tap = { x: p[0], y: p[1], t: e.timeStamp, moved: false };
    else {
      tap = null;
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
    }
  }
  function move(e) {
    if (!pointers.has(e.pointerId)) return;
    const p = local(e),
      prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, p);
    if (pointers.size === 1) {
      if (tap && Math.hypot(p[0] - tap.x, p[1] - tap.y) > 7) tap.moved = true;
      if (tap?.moved || !tap) {
        cam.x -= (p[0] - prev[0]) / cam.s;
        cam.y -= (p[1] - prev[1]) / cam.s;
        track.push([p[0], p[1], e.timeStamp]);
        if (track.length > 5) track.shift();
        clamp();
        onCamera(cam);
      }
    } else if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]),
        m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      cam.x -= (m[0] - pinch.m[0]) / cam.s;
      cam.y -= (m[1] - pinch.m[1]) / cam.s;
      zoomAt(m[0], m[1], d / (pinch.d || d));
      pinch = { d, m };
    }
    request();
  }
  function up(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0 && tap && !tap.moved && e.timeStamp - tap.t < 400) {
      const p = local(e);
      if (lastTap && e.timeStamp - lastTap.t < 320 && Math.hypot(p[0] - lastTap.x, p[1] - lastTap.y) < 30) {
        lastTap = null;
        flyTo({ x: cam.x + (p[0] - W / 2) / cam.s, y: cam.y + (p[1] - H / 2) / cam.s, s: Math.min(maxS, cam.s * 1.9) }, 320);
      } else {
        lastTap = { x: p[0], y: p[1], t: e.timeStamp };
        pick(p[0], p[1]);
      }
    } else if (pointers.size === 0 && track.length > 1) {
      const a = track[0],
        b = track[track.length - 1],
        dt = Math.max(16, b[2] - a[2]);
      if (b[2] - a[2] < 160 && e.timeStamp - b[2] < 80) inertia = { vx: ((b[0] - a[0]) / dt) * 16, vy: ((b[1] - a[1]) / dt) * 16 };
    }
    tap = null;
    request();
  }
  function pick(px, py) {
    // A tap on the train comes before the buildings behind it.
    const car = trainHits.find((c) => Math.hypot(px - c.x, py - c.y) <= c.r);
    if (car) {
      selected = null;
      onTrain(true);
      request();
      return;
    }
    const x = cam.x + (px - W / 2) / cam.s,
      y = cam.y + (py - H / 2) / cam.s;
    const hits = world.query(x - 1, y - 1, x + 1, y + 1).filter(
      (it) => it.type === "building" && x >= it.hit[0] && x <= it.hit[2] && y >= it.hit[1] && y <= it.hit[3],
    );
    const item = hits[hits.length - 1] || null;
    selected = item ? item.id : null;
    onPick(item ? item.building : null);
    request();
  }
  function wheel(e) {
    // Plain wheel scrolls the page; pinch-to-zoom on trackpads arrives with ctrlKey.
    if (!e.ctrlKey && !canvas.closest(".village-full")) return;
    e.preventDefault();
    const [px, py] = local(e);
    zoomAt(px, py, Math.exp(-e.deltaY * 0.0045));
  }
  function key(e) {
    const step = 60 / cam.s;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      cam.x += moves[e.key][0];
      cam.y += moves[e.key][1];
      clamp();
      request();
    } else if (e.key === "+" || e.key === "=") zoomAt(W / 2, H / 2, 1.3);
    else if (e.key === "-") zoomAt(W / 2, H / 2, 1 / 1.3);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(W / 2, H / 2);
    }
  }
  if (interactive) {
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("keydown", key);
  }
  function flyTo(to, ms = 600) {
    const target = { ...to, s: Math.max(minS, Math.min(maxS, to.s ?? cam.s)) };
    if (motionLevel() === "still" || ms === 0) {
      flight = null;
      Object.assign(cam, target);
      clamp();
      onCamera(cam);
    } else flight = { from: { ...cam }, to: target, t0: performance.now(), ms };
    request();
  }

  // Pause while the map is scrolled away or the app is in the background.
  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) request();
      })
    : null;
  observer?.observe(canvas);
  const visibility = () => {
    if (document.visibilityState === "visible") request();
    else {
      cancelAnimationFrame(raf);
      clearTimeout(liveTimer);
      raf = liveTimer = 0;
    }
  };
  document.addEventListener("visibilitychange", visibility);
  // The motion setting can change while the map is open (Ben → Görünüm, or the phone's own).
  const motionWatch = new MutationObserver(() => request());
  motionWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  reduceQuery?.addEventListener?.("change", request);

  return {
    cam,
    /** A new world (data or time of day changed): tiles are repainted lazily. */
    setWorld(next, nextSky, tintFn) {
      world = next;
      parks = next.items.filter(i => i.type === "building" && i.building?.model === "kugulupark" && !i.building.site && !i.building.spot);
      sky = nextSky;
      tint = tintFn;
      gen++;
      clamp();
      request();
    },
    resize(width, height) {
      W = Math.max(1, width);
      H = Math.max(1, height);
      const next = Math.min(2, window.devicePixelRatio || 1);
      if (next !== dpr) {
        dpr = next;
        tiles.clear();
        fallback = null;
      }
      // Setting a canvas size clears it, even to the same size.
      canvas.width = layer.width = Math.round(W * dpr);
      canvas.height = layer.height = Math.round(H * dpr);
      painted = "";
      Object.assign(layer.style, { left: `${canvas.offsetLeft}px`, top: `${canvas.offsetTop}px`, width: `${W}px`, height: `${H}px` });
      clamp();
      request();
    },
    fit(boxToFit, pad, ms = 0) {
      flyTo(fitBox(boxToFit, pad), ms);
    },
    fitScale: (b, pad) => fitBox(b, pad).s,
    limits(lo, hi) {
      minS = lo;
      maxS = hi;
      clamp();
    },
    flyTo,
    /** n51: the camera rides along with the train until the finger moves the map; false when none is on the line. */
    follow(on) {
      if (!on) return stopFollow();
      const out = trainNow();
      if (!out) return false;
      following = true;
      onFollow(true);
      const mid = out.cars[Math.floor(out.cars.length / 2)];
      const [tx, ty] = screen(mid.x, mid.y, 1);
      flyTo({ x: tx, y: ty, s: Math.max(cam.s, 9) }, 650);
      request();
      return true;
    },
    /** n51: a toot of the engine's whistle; false when no engine is in view. */
    honk() {
      if (!trainHits.length) return false;
      honkAt = Date.now();
      request();
      return true;
    },
    /** n51: fly to a spot given in village units. */
    flyToWorld(x, y, s = 9, ms = 600) {
      const [sx, sy] = screen(x, y, 0);
      flyTo({ x: sx, y: sy, s }, ms);
    },
    zoomBy: (factor) => zoomAt(W / 2, H / 2, factor),
    select(id) {
      selected = id;
      request();
    },
    /** Flies to a just-finished building and celebrates it; false if the world does not have it yet. */
    celebrate(id) {
      const item = world?.byId.get(id);
      if (!item?.sp || item.building?.spot) return false;
      const level = motionLevel();
      const [x, y] = screen(item.x, item.y, item.top * 0.45);
      flyTo({ x, y, s: Math.max(12, Math.min(16, cam.s)) }, 750);
      party = {
        x: item.x,
        y: item.y,
        z: item.top + 0.6,
        hw: item.sp.hw,
        t0: performance.now() + (level === "still" ? 0 : 600),
        bits: Array.from({ length: 42 }, (_, i) => {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.3,
            v = 90 + Math.random() * 80;
          return {
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            rot: Math.random() * 6,
            spin: (Math.random() - 0.5) * 14,
            color: CONFETTI[i % CONFETTI.length],
            w: 3 + Math.random() * 2.5,
            h: 1.6 + Math.random() * 1.4,
            round: i % 5 === 0,
          };
        }),
      };
      request();
      return true;
    },
    setStill(value) {
      still = value;
      request();
    },
    redraw: request,
    destroy() {
      destroyed = true;
      following = false;
      cancelAnimationFrame(raf);
      clearTimeout(liveTimer);
      observer?.disconnect();
      motionWatch.disconnect();
      reduceQuery?.removeEventListener?.("change", request);
      document.removeEventListener("visibilitychange", visibility);
      if (interactive) {
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
        canvas.removeEventListener("wheel", wheel);
        canvas.removeEventListener("keydown", key);
      }
      layer.remove();
      tiles.clear();
    },
  };
}
