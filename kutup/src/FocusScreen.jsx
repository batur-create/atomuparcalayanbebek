import { createPortal } from "react-dom";
import { Breadcrumbs } from "./Navigation.jsx";
import { useDialogFocus } from "./Modal.jsx";
// Odak ekranı: the phone (or laptop) becomes a desk timer. Full screen, dark and
// quiet: a big countdown or count-up (or the time) in portrait, a flip clock in
// landscape, the construction site hidden, beside the clock or filling the
// screen, and the sounds a tap away. The controls stay out of sight until the
// screen is touched.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Expand, MapPinned,Headphones, Minus, Plus, RotateCcw, Shrink, X } from "lucide-react";
import { ConstructionScene } from "./Village.jsx";
import { useZoom } from "./zoom.js";
import { enterFullscreen, leaveFullscreen } from "./fullscreen.js";
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

export function FocusScreen({ me, members = [], now, run, outcome, close,onVillage }) {
  const [pref, setPref] = useState(prefs),
    [controls, setControls] = useState(true),
    [sounds, setSounds] = useState(false),
    [landscape, setLandscape] = useState(() => matchMedia("(orientation: landscape)").matches),
    [full, setFull] = useState(() => !!document.fullscreenElement),
    [drift, setDrift] = useState([0, 0]);
  const screen = useRef(null);
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
    if (!me?.focusRelaxed) keepScreenOn();
    const orient = matchMedia("(orientation: landscape)"),
      onOrient = () => setLandscape(orient.matches),
      onFull = () => setFull(!!document.fullscreenElement),
      onKey = (e) => e.key === "Escape" && !document.fullscreenElement && close();
    orient.addEventListener?.("change", onOrient);
    document.addEventListener("fullscreenchange", onFull);
    document.addEventListener("keydown", onKey);
    // Nudge everything a few pixels every minute so an OLED screen keeps no ghost.
    const nudge = setInterval(() => setDrift([Math.round(Math.random() * 12 - 6), Math.round(Math.random() * 12 - 6)]), 60000);
    return () => {
      clearTimeout(hide.current);
      clearInterval(nudge);
      orient.removeEventListener?.("change", onOrient);
      document.removeEventListener("fullscreenchange", onFull);
      document.removeEventListener("keydown", onKey);
      // A build-mode session keeps its own hold on the screen.
      if (!(me?.focusStrict && !me?.focusRelaxed && me.focusEnd > Date.now())) releaseScreen();
    };
  }, []);
  useDialogFocus(screen, close, { escape: false });
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
  // iOS standalone changes its usable rectangle after rotation. Fit to that
  // rectangle, not the large CSS layout viewport, and reset only this scene.
  const flipUnits = parts.reduce((n, part) => n + part.length * .79, 0) + (parts.length - 1) * .92;
  useLayoutEffect(() => {
    const root = screen.current;
    let frame = 0, previousLandscape = landscape;
    const measure = () => {
      const v = window.visualViewport;
      const width = v?.width || window.innerWidth, height = v?.height || window.innerHeight;
      root.style.setProperty("--focus-w", `${width}px`);
      root.style.setProperty("--focus-h", `${height}px`);
      root.style.setProperty("--focus-top", `${v?.offsetTop || 0}px`);
      root.style.setProperty("--focus-left", `${v?.offsetLeft || 0}px`);
      const bar = root.querySelector('.fs-bar').getBoundingClientRect();
      root.style.setProperty('--focus-toolbar', `${bar.bottom - root.getBoundingClientRect().top + 12}px`);
      const nextLandscape = width > height;
      if (nextLandscape !== previousLandscape) { previousLandscape = nextLandscape; zoom.reset(); }
      setLandscape(nextLandscape);
      const stage = root.querySelector('.fs-stage'), clock = root.querySelector('.fs-clock'), scene = root.querySelector('.fs-scene');
      const style = getComputedStyle(stage);
      const available = Math.max(1, stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
      const friendsHeight=root.querySelector(".desk-mates")?.getBoundingClientRect().height||0;
      root.style.setProperty('--flip-size', `${Math.max(18, Math.min(240, clock.clientWidth / flipUnits, (available - 65-friendsHeight) / 1.1))}px`);
      root.style.setProperty('--digits-size', `${Math.max(28, Math.min(220, clock.clientWidth / (parts.join(':').length * .58), available * .4))}px`);
      if (scene) {
        const box = getComputedStyle(scene);
        const sceneWidth = scene.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight);
        const sceneHeight = scene.clientHeight - parseFloat(box.paddingTop) - parseFloat(box.paddingBottom);
        root.style.setProperty('--fs-site-width', `${Math.max(1, Math.min(sceneWidth, Math.max(1, sceneHeight - 32) * 1.7))}px`);
      }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root); observer.observe(root.querySelector('.fs-clock'));
    const scene = root.querySelector('.fs-scene'); if (scene) observer.observe(scene);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', schedule); window.visualViewport?.removeEventListener('resize', schedule); window.visualViewport?.removeEventListener('scroll', schedule); };
  }, [pref.scene, showScene, flipUnits, parts.join(':').length]);


  return createPortal(
    <div
      ref={screen}
      className={`focus-screen ${landscape ? "landscape" : "portrait"} scene-${showScene ? pref.scene : "hidden"} ${controls ? "show-controls" : ""}`}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onFocusCapture={wake}
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
          {landscape && pref.scene !== "full" ? (
            <FlipClock parts={parts} />
          ) : (
            <div className="fs-digits" aria-live="off">
              {parts.join(":")}
            </div>
          )}
          <div className="fs-caption">
            {done ? "Bitti! Köyüne eklendi 🎉" : caption}
            {item && mode !== "clock" ? ` · ${item.emoji} ${item.name} · Seans %${Math.round(progress * 100)} tamamlandı` : ""}
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
        <Breadcrumbs className="focus-breadcrumbs" />
        <div className="fs-bar">
          <button type="button" className="fs-village btn outline" onClick={()=>{leaveFullscreen();(onVillage||close)();}}><MapPinned size={17}/>Köye bak · seans sürsün</button>
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
    </div>, document.body
  );
}
