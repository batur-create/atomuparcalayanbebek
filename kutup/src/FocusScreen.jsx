// Odak ekranı: the phone (or laptop) becomes a desk timer. Full screen, dark and
// quiet: a big countdown or count-up (or the time) in portrait, a flip clock in
// landscape, the construction site hidden, beside the clock or filling the
// screen, and the sounds a tap away. The controls stay out of sight until the
// screen is touched.
import React, { useEffect, useRef, useState } from "react";
import { Expand, Headphones, Shrink, X } from "lucide-react";
import { ConstructionScene } from "./Village.jsx";
import { keepScreenOn, releaseScreen, storage } from "./ui.jsx";
import { SoundButton, SoundPanel } from "./Sound.jsx";
import { modelOf } from "../shared/catalog.js";
import { kindFor } from "../shared/village.js";
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

export function FocusScreen({ me, now, run, outcome, close }) {
  const [pref, setPref] = useState(prefs),
    [controls, setControls] = useState(true),
    [sounds, setSounds] = useState(false),
    [landscape, setLandscape] = useState(() => matchMedia("(orientation: landscape)").matches),
    [full, setFull] = useState(() => !!document.fullscreenElement),
    [drift, setDrift] = useState([0, 0]);
  const opened = useRef(Date.now()),
    hide = useRef(0);
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
          <div className="fs-scene">
            <ConstructionScene run={run} outcome={outcome} />
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
          <button className={`fs-icon ${sounds ? "on" : ""}`} aria-label="Odak sesleri" aria-expanded={sounds} onClick={() => setSounds(!sounds)}>
            <Headphones size={19} />
          </button>
          <button className="fs-icon" aria-label={full ? "Tam ekrandan çık" : "Tam ekran"} onClick={() => (full ? leaveFullscreen() : enterFullscreen())}>
            {full ? <Shrink size={19} /> : <Expand size={19} />}
          </button>
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
