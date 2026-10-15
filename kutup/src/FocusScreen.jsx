// Odak ekranı: the phone (or laptop) becomes a desk timer. Full screen, dark and
// quiet: a big countdown or count-up (or the time) in portrait, a flip clock in
// landscape, the construction site hidden, beside the clock or filling the
// screen, and the sounds a tap away. The controls stay out of sight until the
// screen is touched.
import React, { useEffect, useRef, useState } from "react";
import { Expand, Headphones, Minus, Plus, RotateCcw, Shrink, X } from "lucide-react";
import { ConstructionScene } from "./Village.jsx";
import { isIOS, keepScreenOn, releaseScreen, storage } from "./ui.jsx";
import { DeskMates } from "./Together.jsx";
import { SoundButton, SoundPanel } from "./Sound.jsx";
import { modelOf } from "../shared/catalog.js";
import { kindFor } from "../shared/village.js";
import { skyAt } from "./villageWorld.js";
import "./focusscreen.css";

const KEY = "kutup-odak-ekrani";
const prefs = () => {
  try {
    return { mode: "down", scene: "side", ...JSON.parse(storage.get(KEY) || "{}") };
  } catch {
    return { mode: "down", scene: "side" };
  }
};
const two = (n) => String(n).padStart(2, "0");
const clockParts = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000)),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return h ? [String(h), two(m), two(s % 60)] : [two(m), two(s % 60)];
};
const timeParts = (now) => {
  const d = new Date(now + 3 * 3600000); // Türkiye
  return [two(d.getUTCHours()), two(d.getUTCMinutes())];
};

// The site's surroundings in the colour of its sky, so it fills the screen
// edge to edge (day green, sunset peach, night navy).
const STARS = [[12, 8], [28, 18], [47, 6], [63, 15], [81, 9], [92, 22], [8, 31], [37, 27], [71, 30], [55, 38], [18, 44], [88, 41]]
  .map(([x, y], i) => `radial-gradient(${i % 3 ? 1 : 1.6}px ${i % 3 ? 1 : 1.6}px at ${x}% ${y}%, #fff8e1 60%, transparent 100%)`)
  .join(", ");
const skyOf = (now) => {
  const { night, warm } = skyAt(now);
  if (night > 0.4) return { tone: "night", background: `${STARS}, linear-gradient(#151c38, #34406a)` };
  if (warm > 0) return { tone: "warm", background: "linear-gradient(#f3b58c, #f7e2c8 55%, #eef4e6)" };
  return { tone: "day", background: "#eef4e6" };
};

// Pinch (two fingers), wheel or the buttons zoom the site; drag pans it when
// zoomed in; a double tap zooms in or back out.
function useZoom() {
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const box = useRef(null),
    pointers = useRef(new Map()),
    pinch = useRef(null),
    lastTap = useRef(0);
  const clampView = (v) => {
    const s = Math.min(4, Math.max(1, v.s)),
      el = box.current,
      w = el ? el.clientWidth : 0,
      h = el ? el.clientHeight : 0,
      mx = ((s - 1) * w) / 2,
      my = ((s - 1) * h) / 2;
    return { s, x: Math.max(-mx, Math.min(mx, v.x)), y: Math.max(-my, Math.min(my, v.y)) };
  };
  // Zoom by `k` keeping the screen point (cx, cy) where it is.
  const zoomAt = (k, cx, cy) =>
    setView((v) => {
      const el = box.current;
      if (!el) return v;
      const r = el.getBoundingClientRect(),
        px = cx - (r.left + r.width / 2),
        py = cy - (r.top + r.height / 2);
      const s = Math.min(4, Math.max(1, v.s * k)),
        f = s / v.s;
      return clampView({ s, x: px - (px - v.x) * f, y: py - (py - v.y) * f });
    });
  const center = () => {
    const r = box.current?.getBoundingClientRect();
    return r ? [r.left + r.width / 2, r.top + r.height / 2] : [0, 0];
  };
  const handlers = {
    onWheel: (e) => zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY),
    onPointerDown: (e) => {
      pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) };
      }
      const now = Date.now();
      if (pointers.current.size === 1 && now - lastTap.current < 300) {
        setView((v) => (v.s > 1.2 ? { s: 1, x: 0, y: 0 } : v));
        if (view.s <= 1.2) zoomAt(2, e.clientX, e.clientY);
      }
      lastTap.current = now;
    },
    onPointerMove: (e) => {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.current.size === 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        zoomAt(d / pinch.current.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        pinch.current.d = d;
      } else if (pointers.current.size === 1) {
        setView((v) => (v.s > 1 ? clampView({ ...v, x: v.x + e.clientX - prev[0], y: v.y + e.clientY - prev[1] }) : v));
      }
    },
    onPointerUp: (e) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
    },
  };
  handlers.onPointerCancel = handlers.onPointerUp;
  return {
    view,
    box,
    handlers,
    zoomIn: () => zoomAt(1.4, ...center()),
    zoomOut: () => zoomAt(1 / 1.4, ...center()),
    reset: () => setView({ s: 1, x: 0, y: 0 }),
  };
}

/** Asks for full screen; call it from the tap that opens the focus screen. */
export function enterFullscreen() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el, { navigationUI: "hide" })?.catch?.(() => {});
  } catch {}
}
function leaveFullscreen() {
  try {
    if (document.fullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
  } catch {}
}

// A desk flip-clock digit: the upper flap falls to show the new number.
function FlipDigit({ value }) {
  const [shown, setShown] = useState(value),
    [from, setFrom] = useState(null);
  useEffect(() => {
    if (value === shown) return;
    setFrom(shown);
    setShown(value);
    const timer = setTimeout(() => setFrom(null), 620);
    return () => clearTimeout(timer);
  }, [value]);
  return (
    <span className="flip" aria-hidden="true">
      <span className="half top">
        <i>{shown}</i>
      </span>
      <span className="half bottom">
        <i>{from ?? shown}</i>
      </span>
      {from !== null && (
        <>
          <span className="half flap-top" key={`t${shown}`}>
            <i>{from}</i>
          </span>
          <span className="half flap-bottom" key={`b${shown}`}>
            <i>{shown}</i>
          </span>
        </>
      )}
    </span>
  );
}
function FlipClock({ parts }) {
  return (
    <div className="flip-clock">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="flip-colon">:</span>}
          {[...part].map((d, j) => (
            <FlipDigit key={`${i}-${j}-${part.length}`} value={d} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

export function FocusScreen({ me, members = [], now, run, outcome, close }) {
  const [pref, setPref] = useState(prefs),
    [controls, setControls] = useState(true),
    [sounds, setSounds] = useState(false),
    [landscape, setLandscape] = useState(() => matchMedia("(orientation: landscape)").matches),
    [full, setFull] = useState(() => !!document.fullscreenElement),
    [drift, setDrift] = useState([0, 0]);
  const opened = useRef(Date.now()),
    hide = useRef(0);
  const zoom = useZoom();
  const session = me?.focusEnd > now ? { end: me.focusEnd, total: me.focusMinutes * 60000, at: me.focusPausedAt || now } : null;
  const item = session && me.focusStrict ? modelOf(me.focusModel, kindFor(me.focusMinutes)) : null;
  const showScene = !!(run || outcome) && pref.scene !== "hidden";
  const set = (patch) =>
    setPref((p) => {
      const next = { ...p, ...patch };
      storage.set(KEY, JSON.stringify(next));
      return next;
    });
  // Controls fade away; a touch brings them back.
  const wake = () => {
    setControls(true);
    clearTimeout(hide.current);
    hide.current = setTimeout(() => setControls(false), 4000);
  };
  useEffect(() => {
    wake();
    keepScreenOn();
    const orient = matchMedia("(orientation: landscape)"),
      onOrient = () => setLandscape(orient.matches),
      onFull = () => setFull(!!document.fullscreenElement),
      onKey = (e) => e.key === "Escape" && !document.fullscreenElement && close();
    orient.addEventListener?.("change", onOrient);
    document.addEventListener("fullscreenchange", onFull);
    document.addEventListener("keydown", onKey);
    // Nudge everything a few pixels every minute so an OLED screen keeps no ghost.
    const nudge = setInterval(() => setDrift([Math.round(Math.random() * 12 - 6), Math.round(Math.random() * 12 - 6)]), 60000);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(hide.current);
      clearInterval(nudge);
      orient.removeEventListener?.("change", onOrient);
      document.removeEventListener("fullscreenchange", onFull);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      // A build-mode session keeps its own hold on the screen.
      if (!(me?.focusStrict && me.focusEnd > Date.now())) releaseScreen();
    };
  }, []);
  const exit = () => {
    leaveFullscreen();
    close();
  };

  // What the big numbers say.
  let mode = pref.mode,
    parts,
    caption;
  if (!session && mode === "down") mode = "up";
  if (mode === "clock") {
    parts = timeParts(now);
    caption = session ? `Seansın bitmesine ${Math.ceil((session.end - now) / 60000)} dk` : "Saat";
  } else if (mode === "down") {
    parts = clockParts(session.end - session.at);
    caption = me.focusPausedAt ? "☕ çay molası: sayaç bekliyor" : "kalan";
  } else {
    parts = clockParts(session ? session.at - (session.end - session.total) : now - opened.current);
    caption = session ? "geçen" : "kronometre";
  }
  const progress = session ? Math.min(1, Math.max(0, 1 - (session.end - session.at) / session.total)) : 0;
  const done = !session && outcome?.type === "built";

  return (
    <div
      className={`focus-screen ${landscape ? "landscape" : "portrait"} scene-${showScene ? pref.scene : "hidden"} ${controls ? "show-controls" : ""}`}
      role="dialog"
      aria-label="Odak ekranı"
      onPointerDown={wake}
    >
      <div className="fs-stage" style={{ transform: `translate(${drift[0]}px, ${drift[1]}px)` }}>
        {showScene && (
          <div className={`fs-scene ${skyOf(now).tone}`} style={{ background: skyOf(now).background }} ref={zoom.box} {...zoom.handlers}>
            <div className="fs-zoom" style={{ transform: `translate(${zoom.view.x}px, ${zoom.view.y}px) scale(${zoom.view.s})` }}>
              <ConstructionScene run={run} outcome={outcome} />
            </div>
          </div>
        )}
        <div className="fs-clock">
          {landscape ? (
            <FlipClock parts={parts} />
          ) : (
            <div className="fs-digits" aria-live="off">
              {parts.join(":")}
            </div>
          )}
          <div className="fs-caption">
            {done ? "Bitti! Köyüne eklendi 🎉" : caption}
            {item && mode !== "clock" ? ` · ${item.emoji} ${item.name} · hakediş %${Math.round(progress * 100)}` : ""}
          </div>
          <DeskMates me={me} members={members} now={now} dark />
          {session && !landscape && (
            <div className="fs-progress" aria-hidden="true">
              <i style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="fs-controls" aria-hidden={!controls}>
        <div className="fs-bar">
          <button className="fs-icon" aria-label="Odak ekranını kapat" onClick={exit}>
            <X size={20} />
          </button>
          <div className="fs-seg" role="group" aria-label="Sayaç">
            {[
              ["down", "Kalan"],
              ["up", session ? "Geçen" : "Kronometre"],
              ["clock", "Saat"],
            ]
              .filter(([id]) => session || id !== "down")
              .map(([id, label]) => (
                <button key={id} className={mode === id ? "on" : ""} aria-pressed={mode === id} onClick={() => set({ mode: id })}>
                  {label}
                </button>
              ))}
          </div>
          {(run || outcome) && (
            <div className="fs-seg" role="group" aria-label="İnşaat">
              {[
                ["hidden", "İnşaat gizli"],
                ["side", "Yanında"],
                ["full", "Sadece inşaat"],
              ].map(([id, label]) => (
                <button key={id} className={pref.scene === id ? "on" : ""} aria-pressed={pref.scene === id} onClick={() => set({ scene: id })}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {showScene && (
            <div className="fs-seg fs-zoom-buttons" role="group" aria-label="Yakınlaştır">
              <button aria-label="Uzaklaştır" onClick={zoom.zoomOut}>
                <Minus size={15} />
              </button>
              <button aria-label="Yakınlaştırmayı sıfırla" onClick={zoom.reset}>
                <RotateCcw size={14} />
              </button>
              <button aria-label="Yakınlaştır" onClick={zoom.zoomIn}>
                <Plus size={15} />
              </button>
            </div>
          )}
          <button className={`fs-icon ${sounds ? "on" : ""}`} aria-label="Odak sesleri" aria-expanded={sounds} onClick={() => setSounds(!sounds)}>
            <Headphones size={19} />
          </button>
          {!isIOS && (
            <button className="fs-icon" aria-label={full ? "Tam ekrandan çık" : "Tam ekran"} onClick={() => (full ? leaveFullscreen() : enterFullscreen())}>
              {full ? <Shrink size={19} /> : <Expand size={19} />}
            </button>
          )}
        </div>
        <div className="fs-foot">
          <SoundButton />
          {!landscape && <span className="fs-hint">Yan çevir: masa saati</span>}
        </div>
      </div>
      {sounds && (
        <div className="fs-sounds" onPointerDown={(e) => e.stopPropagation()}>
          <div className="fs-sounds-head">
            <b>Odak sesleri</b>
            <button className="fs-icon" aria-label="Sesleri kapat" onClick={() => setSounds(false)}>
              <X size={18} />
            </button>
          </div>
          <SoundPanel dark />
        </div>
      )}
    </div>
  );
}
