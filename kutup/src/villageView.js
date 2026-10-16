// Canvas view of the village. The static world (ground, roads, buildings) is
// painted once into 256px tiles per zoom level and cached; every frame only
// blits the visible tiles and paints the live layer on top (smoke, walkers,
// balloons, lamp glow). The loop sleeps whenever nothing moves.
import { useCanvas, useSVG } from "./iso.js";
import { GROUND, MEMBER_COLORS, pointOnPath } from "./villageWorld.js";
import { AVATAR_BG, avatarImage, parseAvatar } from "../shared/avatars.js";

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

export function createView(canvas, { interactive = false, onPick = () => {}, onCamera = () => {} } = {}) {
  const ctx = canvas.getContext("2d");
  let world = null,
    sky = null,
    tint = (c) => c,
    gen = 0,
    fallback = null;
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
    liveTimer = 0;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
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
          ctx.drawImage(tile.c, dx, dy, size + 0.6, size + 0.6);
        } else if (missing) missing.push([i, j, Math.hypot(dx + size / 2 - W / 2, dy + size / 2 - H / 2)]);
      }
  }

  // ---------- live layer ----------
  const atScreen = (wx, wy, z = 0) => {
    const [sx, sy] = screen(wx, wy, z);
    return [(sx - cam.x) * cam.s + W / 2, (sy - cam.y) * cam.s + H / 2];
  };
  const onScreen = ([x, y], m = 60) => x > -m && y > -m && x < W + m && y < H + m;
  function drawLive(now) {
    const time = (now - start) / 1000;
    const s = cam.s;
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
    // Chimney smoke above the homes of whoever is in the library.
    for (const puff of world.smoke) {
      const base = atScreen(puff.x, puff.y, puff.z);
      if (!onScreen(base)) continue;
      for (let i = 0; i < 3; i++) {
        const k = reduced ? 0.3 + i * 0.25 : (time * 0.35 + i / 3 + (puff.seed % 7) / 7) % 1;
        ctx.globalAlpha = 0.65 * (1 - k);
        ctx.fillStyle = tint("#f1ece2");
        ctx.beginPath();
        ctx.arc(base[0] + Math.sin(k * 5 + i) * s * 0.35, base[1] - k * s * 2.6, s * (0.22 + k * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // Friends on the way walk the road towards the square.
    for (const w of world.walkers) {
      const t = reduced ? 0.35 : ((time / Math.max(8, w.path.total / 1.4) + (w.member.id.charCodeAt(0) % 10) / 10) % 1);
      const [x, y] = pointOnPath(w.path, t);
      const p = atScreen(x, y);
      if (!onScreen(p)) continue;
      const k = Math.max(0.55, Math.min(1.6, s / 9));
      const bob = reduced ? 0 : Math.abs(Math.sin(time * 7)) * 1.6 * k;
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
    // Avatar balloons above homes; a coffee for those on a break.
    for (const b of world.balloons) {
      const p = atScreen(b.x, b.y, b.z);
      if (!onScreen(p)) continue;
      const float = reduced ? 0 : Math.sin(time * 1.6 + b.x) * 2;
      const r = Math.max(9, Math.min(15, s * 0.9));
      bubble(p[0], p[1] - r - 6 + float, b.member, r, true, b.member.status === "break");
    }
    // District names while zoomed out (the signs carry them when close).
    if (interactive && s < 9 && s > 2)
      for (const d of world.districts) {
        if (!d.memberId) continue;
        if (s < 4.2 && !world.farLabels.has(d.id)) continue;
        const name = world.names?.get(d.memberId);
        if (!name) continue;
        const [x, y] = d.layout.sign;
        const p = atScreen(x, y, 2.2);
        if (!onScreen(p, 100)) continue;
        pill(p[0], p[1] - 8, name);
      }
    if (selected) {
      const item = world.byId.get(selected);
      if (item) {
        const p = atScreen(item.x, item.y);
        const pulse = reduced ? 0.5 : (Math.sin(time * 4) + 1) / 2;
        ctx.strokeStyle = `rgba(255,255,255,${0.55 + pulse * 0.4})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], s * (item.sp.hw + 1) * 1.6, s * (item.sp.hw + 1) * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  function bubble(x, y, member, r, pointer, coffee = false) {
    ctx.save();
    ctx.shadowColor = "rgba(40,30,70,.25)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#fffdf7";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (pointer) {
      ctx.moveTo(x - r * 0.35, y + r * 0.85);
      ctx.lineTo(x, y + r * 1.45);
      ctx.lineTo(x + r * 0.35, y + r * 0.85);
    }
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = Math.max(1.5, r * 0.16);
    ctx.strokeStyle = MEMBER_COLORS[member.color] || "#a99be0";
    ctx.beginPath();
    ctx.arc(x, y, r - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();
    // The member's color as the disc, as in the app; characters are the same SVG as in the page.
    const inner = r - ctx.lineWidth;
    ctx.fillStyle = AVATAR_BG[member.color] || AVATAR_BG.lilac;
    ctx.beginPath();
    ctx.arc(x, y, inner, 0, Math.PI * 2);
    ctx.fill();
    if (parseAvatar(member.avatar)) {
      const img = avatarImage(member.avatar, request);
      if (img) {
        ctx.save();
        ctx.clip();
        ctx.drawImage(img, x - inner, y - inner, inner * 2, inner * 2);
        ctx.restore();
      }
    } else {
      ctx.font = `${Math.round(r * 1.15)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(member.avatar || "🙂", x, y + r * 0.08);
    }
    if (coffee) {
      ctx.font = `${Math.round(r * 0.8)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.fillText("☕", x + r * 0.95, y - r * 0.7);
    }
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
  const animated = () =>
    !reduced && !still && (world?.smoke.length || world?.walkers.length || world?.balloons.length || selected);
  function frame(now) {
    raf = 0;
    if (destroyed || !world || document.visibilityState === "hidden") return;
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = tint(GROUND);
    ctx.fillRect(0, 0, W, H);
    const L = tileLevel(cam.s, W, H);
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
    const pending = missing.length && missing.some(([i, j]) => !tiles.has(keyOf(gen, L, i, j)));
    // Even the last newly painted tile must reach the screen before we sleep
    // (especially with reduced motion and no live characters).
    if (missing.length) blit(gen, L, null);
    if (!pending) fallback = { g: gen, L };
    drawLive(now);
    if (pending || flight || inertia || gestureActive()) request();
    else if (animated() && visible) {
      // Live layer at ~24 fps: smoke and walkers need no more, the battery thanks us.
      if (!liveTimer) {
        const wait = Math.max(0, 42 - (now - lastLive));
        lastLive = now + wait;
        liveTimer = setTimeout(() => {
          liveTimer = 0;
          request();
        }, wait);
      }
    }
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
    if (reduced || ms === 0) {
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

  return {
    cam,
    /** A new world (data or time of day changed): tiles are repainted lazily. */
    setWorld(next, nextSky, tintFn) {
      world = next;
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
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
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
    zoomBy: (factor) => zoomAt(W / 2, H / 2, factor),
    select(id) {
      selected = id;
      request();
    },
    setStill(value) {
      still = value;
      request();
    },
    redraw: request,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      clearTimeout(liveTimer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      if (interactive) {
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
        canvas.removeEventListener("wheel", wheel);
        canvas.removeEventListener("keydown", key);
      }
      tiles.clear();
    },
  };
}
