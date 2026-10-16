// The home tab (n17 + n18): a living sky, my own status, who is where, who is
// coming when, and two tiles into the village and the board. The layout stays
// still; what moves tells something real: the time of day, a friend arriving, a
// count changing. Every tap gets a small answer.
//
// Performance: the sky's drawing is a static SVG. Everything that moves in it
// (sun, clouds, birds, mill blades, crane, smoke, stars) is its own small layer
// animated with transform/opacity only, so the phone's GPU does the work and the
// drawing is never repainted frame by frame.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { ArrowUpRight, Check, Headphones, MapPin, Moon, Plus, Trash2 } from "lucide-react";
import { Avatar, Empty, reducedMotion } from "./ui.jsx";
import { STATUS, dayWord, shortTime, minutesLabel } from "./api.js";
import { skyAt, sunTimes } from "./villageWorld.js";
import { modelOf } from "../shared/catalog.js";
import { BuildingThumb } from "./Economy.jsx";
import { KaraHome } from "./Kara.jsx";
import "./home.css";

// Kütüp's motion feel: playful paper. Cards settle with a little give,
// celebrations bounce, swaps are quick and quiet.
const SPRING = { type: "spring", stiffness: 300, damping: 24 };
const BOUNCY = { type: "spring", stiffness: 220, damping: 14 };
const EASE_OUT = [0.16, 1, 0.3, 1];
const swap = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE_OUT } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.16, ease: "easeIn" } },
};
const names = (list, max = 2) =>
  list.length <= max ? list.map((x) => x.name).join(" ve ") : `${list.slice(0, max).map((x) => x.name).join(", ")} +${list.length - max}`;
const hours = (min) => (min >= 60 ? `${Math.round((min / 60) * 10) / 10} sa` : `${min} dk`);

export function Badge({ status }) {
  return (
    <span className={`status ${status}`}>
      <i />
      {STATUS[status]?.[0] || status}
    </span>
  );
}

// Words that rise into place one after another, like a title card in a motion
// video. "view" plays when it scrolls into sight, "mount" as soon as it appears.
export function Kinetic({ text, as = "h2", className = "", when = "view", delay = 0, children }) {
  const Tag = m[as];
  const words = String(text).split(" ");
  const play = when === "view" ? { whileInView: "show", viewport: { once: true, margin: "0px 0px -30px 0px" } } : { animate: "show" };
  return (
    <Tag className={`kinetic-text ${className}`} aria-label={text} initial="hide" {...play} transition={{ staggerChildren: 0.065, delayChildren: delay }}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span className="kw" aria-hidden="true">
            <m.span variants={{ hide: { y: "108%", rotate: 4 }, show: { y: 0, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 20 } } }}>{word}</m.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
      {children}
    </Tag>
  );
}

// A block that rises in when it first scrolls into view.
export function Reveal({ children, className = "", delay = 0, as = "div" }) {
  const Tag = m[as];
  return (
    <Tag className={className} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }} transition={{ ...SPRING, delay }}>
      {children}
    </Tag>
  );
}

// A number that rolls to its new value; on the opening it counts up from zero.
function Count({ value, intro = false, delay = 0 }) {
  const [shown, setShown] = useState(intro ? 0 : value),
    first = useRef(intro);
  useEffect(() => {
    if (!first.current) return setShown(value);
    first.current = false;
    const timer = setTimeout(() => setShown(value), delay);
    return () => clearTimeout(timer);
  }, [value]);
  return (
    <span className="count-roll">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span key={shown} initial={{ y: "75%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-75%", opacity: 0 }} transition={BOUNCY}>
          {shown}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

// Live facts that take turns in one line: who is here, who is on the way,
// who is building, the next plan, the week together.
function Ticker({ facts }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (facts.length < 2) return;
    const timer = setInterval(() => document.visibilityState === "visible" && setI((n) => n + 1), 3800);
    return () => clearInterval(timer);
  }, [facts.length]);
  const text = facts[i % facts.length];
  return (
    <span className="sky-ticker" aria-live="off">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span key={text} initial={{ y: "110%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-110%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
          {text}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

// ---------- the sky ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// The scene is 960 × 236 units (x from −300 to 660). A phone sees the middle,
// a wide screen all of it. Layers sit on it in percentages of the scene.
const at = (x, y) => ({ left: `${((x + 300) / 960) * 100}%`, top: `${(y / 236) * 100}%` });
const span = (w) => `${(w / 960) * 100}%`;
const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: ((i * 97 + 31) % 950) - 295,
  y: ((i * 53 + 17) % 118) + 6,
  r: [0.7, 1, 1.3][i % 3],
}));
const CLOUDS = [
  { y: 58, w: 64, d: "c1" },
  { y: 92, w: 44, d: "c2" },
  { y: 26, w: 72, d: "c3" },
  { y: 74, w: 52, d: "c4" },
];
const MILLS = [
  { x: -170, y: 131, roof: "r2", slow: false },
  { x: 560, y: 127, roof: "r1", slow: true },
];
const FINS = Array.from({ length: 9 }, (_, i) => 202 + i * 11.4);
const WINDOWS = Array.from({ length: 8 }, (_, i) => 206.5 + i * 11.4).filter((_, i) => i !== 4);
const TREES = [[-280, 0], [-205, 1], [-120, 2], [-60, 0], [16, 1], [128, 2], [322, 0], [344, 1], [400, 2], [480, 0], [610, 1], [640, 2]];
const greeting = (hour) =>
  hour < 5 ? "GECE MESAİSİ" : hour < 11 ? "GÜNAYDIN" : hour < 17 ? "GÜZEL BİR ÇALIŞMA GÜNÜ" : hour < 22 ? "İYİ AKŞAMLAR" : "GECE MESAİSİ";

// A friend (or I) walking along the path into the library when they arrive.
function Walker({ color }) {
  const motion = useRef(null);
  useEffect(() => {
    motion.current?.beginElement?.();
  }, []);
  return (
    <g className="sky-walker">
      <g transform="translate(0 -9) scale(1.45)">
        <rect x="-2.6" y="0" width="5.2" height="6.5" rx="2.4" fill={color} stroke="#25242d" strokeWidth=".7" />
        <circle cx="0" cy="-2.6" r="2.5" fill={color} stroke="#25242d" strokeWidth=".7" />
      </g>
      <animateMotion ref={motion} dur="2.8s" fill="freeze" begin="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".4 0 .3 1">
        <mpath href="#sky-route" />
      </animateMotion>
    </g>
  );
}

function House({ x, y, w, h, roof }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className="sky-wall" x="0" y="0" width={w} height={h} rx="1.5" />
      <path className={`sky-roof ${roof}`} d={`M-3 1 L${w / 2} ${-h * 0.7} L${w + 3} 1Z`} />
      <rect className="sky-window" x={w / 2 - 3} y={h * 0.35} width="6" height="6" rx="1" />
    </g>
  );
}

function HomeSky({ me, data, arrivals, arrived, unread, navigate, dark, now, intro }) {
  const box = useRef(null),
    [paused, setPaused] = useState(false);
  // The loops stop when the sky is off screen or the app is in the background.
  useEffect(() => {
    let seen = true;
    const update = () => setPaused(!seen || document.visibilityState !== "visible");
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => ((seen = e.isIntersecting), update())) : null;
    if (io && box.current) io.observe(box.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const minute = Math.floor(now / 60000);
  const sky = useMemo(() => {
    const t = minute * 60000,
      s = skyAt(t),
      { hour, sunrise, sunset } = sunTimes(t),
      night = dark ? 1 : s.night,
      day = clamp((hour - sunrise) / (sunset - sunrise)),
      dusk = ((hour - sunset + 24) % 24) / (24 - (sunset - sunrise)),
      moonAt = dark && !s.night ? 0.62 : clamp(dusk);
    return {
      hour,
      night,
      warm: dark ? 0 : s.warm,
      lamps: dark || s.lamps,
      // Sun and moon keep to the top-right, clear of the greeting, and still
      // tell the hour: low in the morning and evening, high at noon.
      sun: [266 + 64 * day, 104 - 54 * Math.sin(Math.PI * day)],
      moon: [268 + 58 * moonAt, 96 - 48 * Math.sin(Math.PI * moonAt)],
    };
  }, [minute, dark]);
  const here = data.members.filter((x) => x.status === "here" || x.status === "break"),
    coming = data.members.filter((x) => x.status === "coming"),
    focusing = data.members.filter((x) => x.focusEnd > now).sort((a, b) => a.focusEnd - b.focusEnd),
    next = data.plans.find((p) => p.starts > now),
    week = data.members.reduce((t, x) => t + (x.focusWeek || 0), 0);
  const facts = [
    here.length ? `${here.length} kişi kütüpte` : "Kütüp şimdilik sessiz",
    coming.length && `${names(coming)} yolda${coming.length === 1 && coming[0].arrival ? ` · ${coming[0].arrival}` : ""}`,
    focusing.length && `${focusing[0].name} odakta · ${Math.max(1, Math.ceil((focusing[0].focusEnd - now) / 60000))} dk kaldı`,
    next && `${dayWord(next.starts)} ${shortTime(next.starts)} · ${next.note || "kütüp buluşması"}`,
    week >= 30 && `Bu hafta ekipçe ${hours(week)} odak`,
  ].filter(Boolean);
  const night = sky.night > 0.5;
  return (
    <section ref={box} className={`home-sky ${night ? "is-night" : ""} ${sky.lamps ? "lamps" : ""} ${paused ? "paused" : ""} ${intro ? "intro" : ""}`}>
      <div className="sky-scene" aria-hidden="true">
        <svg className="sky-base" viewBox="-300 0 960 236" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#cfe1f2" />
              <stop offset=".62" stopColor="#eef1ea" />
              <stop offset="1" stopColor="#f8f1e2" />
            </linearGradient>
            <linearGradient id="sky-warm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b9c3e6" />
              <stop offset=".55" stopColor="#f2c9c0" />
              <stop offset="1" stopColor="#f8dcb4" />
            </linearGradient>
            <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1d1c3c" />
              <stop offset=".6" stopColor="#352f5c" />
              <stop offset="1" stopColor="#55456a" />
            </linearGradient>
          </defs>
          <rect x="-300" width="960" height="236" fill="url(#sky-day)" />
          <rect className="sky-fade" x="-300" width="960" height="236" fill="url(#sky-warm)" style={{ opacity: sky.warm }} />
          <rect className="sky-fade" x="-300" width="960" height="236" fill="url(#sky-night)" style={{ opacity: sky.night }} />
          <g className="sky-land">
            <path className="sky-hill back" d="M-300 176 C -220 152, -110 168, 0 178 C 60 150, 120 160, 180 170 S 300 150, 360 162 S 540 148, 660 168 L660 236 L-300 236Z" />
            {MILLS.map((mill) => (
              <g key={mill.x} transform={`translate(${mill.x} 0)`}>
                <path className="sky-wall" d={`M-7 ${mill.y + 41} L-4 ${mill.y + 5} L4 ${mill.y + 5} L7 ${mill.y + 41}Z`} />
                <path className={`sky-roof ${mill.roof}`} d={`M-6 ${mill.y + 6} L0 ${mill.y - 3} L6 ${mill.y + 6}Z`} />
              </g>
            ))}
            <House x={-250} y={162} w={20} h={15} roof="r3" />
            <House x={430} y={158} w={22} h={16} roof="r2" />
            <House x={28} y={154} w={22} h={18} roof="r1" />
            <House x={62} y={160} w={18} h={15} roof="r2" />
            <House x={92} y={164} w={20} h={14} roof="r3" />
            <g className="sky-crane">
              <rect x="151" y="112" width="3" height="58" />
              <rect className="sky-wall" x="138" y="160" width="26" height="11" rx="1" />
            </g>
            <g className="sky-library">
              <rect className="sky-lib-top" x="194" y="134" width="112" height="7" rx="1.5" />
              <rect className="sky-lib" x="198" y="141" width="104" height="30" rx="1" />
              {FINS.map((x) => <rect key={x} className="sky-lib-top" x={x} y="141" width="3" height="30" />)}
              {WINDOWS.map((x, i) => <rect key={x} className="sky-window" x={x} y="146" width="6" height="9" rx="1" style={{ transitionDelay: `${(i % 4) * 0.15}s` }} />)}
              <rect className="sky-door" x="248" y="157" width="10" height="14" rx="1" />
              {arrivals.map((a) => <rect key={a.key} className="sky-door-glow" x="248" y="157" width="10" height="14" rx="1" />)}
              <rect className="sky-steps" x="238" y="171" width="30" height="2.5" rx="1" />
            </g>
            <path className="sky-hill front" d="M-300 204 C -200 186, -90 196, 0 202 C 70 184, 150 192, 210 198 S 320 186, 360 194 S 550 184, 660 198 L660 236 L-300 236Z" />
            <path className="sky-path" d="M-300 228 C -200 222, -90 226, -10 220" />
            <path className="sky-path" id="sky-route" d="M-10 220 C 60 210, 140 216, 190 200 S 240 182, 253 172" />
            {TREES.map(([x, k]) => (
              <g key={x}>
                <rect className="sky-trunk" x={x} y={186 + k * 3} width="3" height="11" />
                <circle className={`sky-leaf ${k % 2 ? "b" : ""}`} cx={x + 1.5} cy={182 + k * 3} r={7 + k * 1.5} />
              </g>
            ))}
            {arrivals.map((a) => <Walker key={a.key} color={a.color} />)}
          </g>
        </svg>
        <div className="sky-stars" style={{ opacity: sky.night }}>
          {["a", "b"].map((half, h) => (
            <svg key={half} className={`stars ${half}`} viewBox="-300 0 960 236" preserveAspectRatio="none">
              {STARS.filter((_, i) => i % 2 === h).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} />)}
            </svg>
          ))}
        </div>
        <div className="sky-orb sun" style={{ ...at(...sky.sun), width: span(34), opacity: clamp(1 - sky.night * 1.6) }}>
          <i className="sky-halo" />
          <i className="sky-disc" />
        </div>
        <div className="sky-orb moon" style={{ ...at(...sky.moon), width: span(28), opacity: clamp(sky.night * 1.4 - 0.3) }}>
          <svg viewBox="-14 -14 28 28">
            <mask id="sky-crescent">
              <rect x="-14" y="-14" width="28" height="28" fill="#fff" />
              <circle cx="6" cy="-4" r="11" fill="#000" />
            </mask>
            <circle r="13" fill="#f4efd9" mask="url(#sky-crescent)" />
          </svg>
        </div>
        {CLOUDS.map((c) => (
          <div key={c.d} className={`sky-drift ${c.d}`} style={{ top: `${(c.y / 236) * 100}%` }}>
            <svg className="sky-cloud" style={{ width: span(c.w) }} viewBox="0 0 64 26">
              <ellipse cx="30" cy="17" rx="27" ry="9" />
              <ellipse cx="40" cy="11" rx="15" ry="11" />
              <ellipse cx="20" cy="12" rx="11" ry="8" />
            </svg>
          </div>
        ))}
        <div className="sky-drift birds" style={{ top: "34%" }}>
          <svg className="sky-birds" style={{ width: span(34) }} viewBox="0 0 34 14">
            <path d="M1 9 q4 -4 8 0 q4 -4 8 0" />
            <path d="M21 4 q3 -3 6 0 q3 -3 6 0" />
          </svg>
        </div>
        {MILLS.map((mill) => (
          <div key={mill.x} className="sky-hub" style={{ ...at(mill.x, mill.y), width: span(30) }}>
            <svg className={`sky-blades ${mill.slow ? "slow" : ""}`} viewBox="-15 -15 30 30">
              <rect x="-1.2" y="-14" width="2.4" height="28" rx="1" />
              <rect x="-14" y="-1.2" width="28" height="2.4" rx="1" />
              <circle r="2" />
            </svg>
          </div>
        ))}
        <svg className="sky-boom" style={{ ...at(140, 110), width: span(48) }} viewBox="0 0 48 30">
          <rect x="0" y="2" width="44" height="2.6" rx="1" />
          <line x1="36" y1="4.5" x2="36" y2="22" />
          <rect className="sky-load" x="32" y="22" width="8" height="5" rx="1" />
        </svg>
        <i className="sky-puff" style={{ ...at(42, 146), width: span(7) }} />
        <i className="sky-puff late" style={{ ...at(42, 146), width: span(7) }} />
      </div>
      <div className="sky-copy">
        <span className="sky-eyebrow">{greeting(sky.hour)}</span>
        <Kinetic as="h1" when="mount" delay={intro ? 0.3 : 0.05} text={`Selam${me ? `, ${me.name}` : ""}`}>
          {" "}
          <span className="wave" aria-hidden="true">✌️</span>
        </Kinetic>
        <span className="sky-live">
          <i className={here.length ? "on" : ""} />
          <Ticker facts={facts} />
        </span>
      </div>
      <div className="sky-over">
        <KaraHome me={me} data={data} now={now} unread={unread} navigate={navigate} arrived={arrived} style={{ ...at(290, 134), width: span(62) }} />
      </div>
      <span className="sky-sticker" aria-hidden="true">
        ders arası
        <b>hayat ✷</b>
      </span>
    </section>
  );
}

// ---------- my status ----------
const PARTY = ["var(--accent)", "#e2a184", "#a9cc92", "#a9bcdc", "#e9c46a", "#d9a5c0"];
function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: (Math.random() - 0.5) * 280,
        y: -60 - Math.random() * 120,
        r: (Math.random() - 0.5) * 540,
        k: i % 3,
        c: PARTY[i % PARTY.length],
        d: 1.35 + (i % 5) * 0.08,
      })),
    [],
  );
  return (
    <span className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <m.i
          key={i}
          className={`bit k${b.k}`}
          style={{ color: b.c, background: b.k ? b.c : undefined }}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
          animate={{ x: [0, b.x, b.x * 1.25], y: [0, b.y, b.y + 160], rotate: [0, b.r / 2, b.r], scale: [0.4, 1, 0.85], opacity: [1, 1, 0] }}
          transition={{ duration: b.d, times: [0, 0.42, 1], ease: [0.2, 0.7, 0.4, 1] }}
        >
          {b.k === 0 ? "✦" : null}
        </m.i>
      ))}
    </span>
  );
}

// The little picture on the status card: a lit library door (away), a scooter on
// its way (coming), or a pin with a ring that fills with my hours here.
function StatusArt({ state, minutes }) {
  if (state === "here") {
    const fill = clamp(minutes / 180);
    return (
      <span className="status-art here" aria-hidden="true">
        <svg viewBox="0 0 80 80">
          <circle className="ring-track" cx="40" cy="40" r="32" />
          <circle className="ring-fill" cx="40" cy="40" r="32" style={{ strokeDashoffset: 201 * (1 - fill) }} />
        </svg>
        <MapPin size={26} />
        <b>{minutes >= 60 ? `${Math.floor(minutes / 60)}s ${minutes % 60}dk` : `${minutes} dk`}</b>
      </span>
    );
  }
  if (state === "coming")
    return (
      <span className="status-art coming" aria-hidden="true">
        <i className="road" />
        <i className="ride">🛵</i>
        <i className="goal">
          <MapPin size={16} />
        </i>
      </span>
    );
  return (
    <span className="status-art away" aria-hidden="true">
      <i className="door-glow" />
      <svg viewBox="0 0 80 80">
        <rect className="door-wall" x="10" y="14" width="60" height="58" rx="4" />
        <rect className="door-frame" x="27" y="30" width="26" height="42" rx="13" />
        <path className="door-leaf" d="M27 43 a13 13 0 0 1 13 -13 L40 72 L27 72Z" />
        <circle className="door-knob" cx="36" cy="54" r="1.6" />
        <path className="door-step" d="M20 72 H60" />
      </svg>
    </span>
  );
}

function StatusCard({ me, data, now, setModal, requireMember, mutate }) {
  const state = me?.status === "break" ? "here" : me?.status === "here" || me?.status === "coming" ? me.status : "away";
  const [party, setParty] = useState(0),
    [burst, setBurst] = useState(0),
    was = useRef(me?.status);
  // Sitting down is worth a small celebration: confetti and a dropping pin.
  useEffect(() => {
    const before = was.current;
    was.current = me?.status;
    if (me?.status === "here" && before && before !== "here" && before !== "break" && !reducedMotion()) setParty(Date.now());
  }, [me?.status]);
  useEffect(() => {
    if (!party) return;
    setBurst(party);
    const timer = setTimeout(() => setBurst(0), 2200);
    return () => clearTimeout(timer);
  }, [party]);
  const minutes = me?.since ? Math.max(0, Math.floor((now - me.since) / 60000)) : 0;
  const waiting = data.members.filter((x) => x.id !== me?.id && (x.status === "here" || x.status === "break"));
  const away = () => mutate("/presence", { status: "away" }, "Bugünlük bu kadar. Yarın görüşürüz! 👋");
  return (
    <m.section layout className={`panel home-status ${state}`} transition={SPRING}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={state} className="status-body" {...swap}>
          <div className="status-text">
            <span className="status-kicker">{state === "here" ? (me.status === "break" ? "MOLADASIN" : "KÜTÜPTESİN") : state === "coming" ? "YOLDASIN" : "BUGÜN"}</span>
            {state === "away" && <h2>Geliyor musun?</h2>}
            {state === "coming" && <h2>Varış: {me.arrival || "birazdan"}</h2>}
            {state === "here" && (
              <h2>
                {me.location || "Milli Kütüphane"}
                {me.desk ? ` · masa ${me.desk}` : ""}
              </h2>
            )}
            {waiting.length ? (
              <p className="status-waiting">
                <span className="avatar-stack">
                  {waiting.slice(0, 3).map((x) => (
                    <Avatar key={x.id} member={x} size="tiny" />
                  ))}
                </span>
                {state === "here" ? `${names(waiting)} da burada.` : `${names(waiting)} kütüpte, masan hazır.`}
              </p>
            ) : (
              <p>{state === "here" ? (minutes >= 1 ? `Burada · ${minutesLabel(minutes)}` : "Şimdi geldin ✨ İlk sandalye senin.") : state === "coming" ? "Ekip haberdar, yolun açık olsun." : "İlk sandalye senin. Gelince ekibine haber gider."}</p>
            )}
            {state !== "here" && (
              <a className="status-route" href="https://www.google.com/maps/search/?api=1&query=Milli+K%C3%BCt%C3%BCphane+Ankara" target="_blank" rel="noopener noreferrer">
                <MapPin size={13} /> Milli Kütüphane yol tarifi
              </a>
            )}
          </div>
          <StatusArt state={state} minutes={minutes} key={state === "here" ? party : state} />
          <div className={`home-acts ${state === "here" ? "even" : ""}`}>
            {state !== "here" && (
              <m.button whileTap={{ scale: 0.95 }} className="btn primary shine" onClick={() => requireMember(() => setModal("presence"))}>
                <MapPin size={18} /> Geldim
              </m.button>
            )}
            {state === "away" && (
              <m.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={() => requireMember(() => setModal("coming"))}>
                Yoldayım
              </m.button>
            )}
            {state === "coming" && (
              <m.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={() => mutate("/presence", { status: "away" }, "Tamam, başka zaman. 👋")}>
                Vazgeçtim
              </m.button>
            )}
            {state === "here" && (
              <>
                <m.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={() => setModal("presence")}>
                  Yerimi değiştir
                </m.button>
                <m.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={away}>
                  Çıktım
                </m.button>
              </>
            )}
          </div>
        </m.div>
      </AnimatePresence>
      {burst > 0 && <Confetti key={burst} />}
    </m.section>
  );
}

// ---------- who is where ----------
// A card turns over when its person sits down, and gets a stamp. The flip is a
// plain Web Animation: the new face is swapped in while the card is edge-on.
function MemberCard({ member, mine, now, onClick, arrived }) {
  const card = useRef(null);
  const [shown, setShown] = useState(member);
  const latest = useRef(member),
    was = useRef(member.status),
    flipping = useRef(false);
  latest.current = member;
  useEffect(() => {
    const before = was.current;
    was.current = member.status;
    if (flipping.current) return;
    const el = card.current;
    if (member.status === "here" && before !== "here" && !reducedMotion() && el?.animate) {
      flipping.current = true;
      el.animate([{ transform: "perspective(800px) rotateY(0)" }, { transform: "perspective(800px) rotateY(90deg)" }], { duration: 200, easing: "ease-in" }).onfinish = () => {
        setShown(latest.current);
        flipping.current = false;
        el.animate([{ transform: "perspective(800px) rotateY(-90deg)" }, { transform: "perspective(800px) rotateY(0)" }], { duration: 560, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
      };
    } else setShown(member);
  }, [member]);
  const m0 = shown;
  const left = m0.focusEnd > now ? Math.max(1, Math.ceil((m0.focusEnd - now) / 60000)) : 0,
    total = m0.focusMinutes || 25;
  return (
    <m.button ref={card} className={`member-card ${m0.color} ${m0.status} ${arrived ? "arrived" : ""}`} onClick={onClick} whileTap={{ scale: 0.96 }}>
      <div className="member-card-top">
        <Avatar member={m0} />
        <Badge status={m0.status} />
      </div>
      <AnimatePresence>
        {arrived && m0.status === "here" && (
          <m.span className="arrive-stamp" initial={{ opacity: 0, scale: 2.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ ...BOUNCY, delay: 0.25 }}>
            {mine ? "GELDİN" : "GELDİ"}
          </m.span>
        )}
      </AnimatePresence>
      <div className="member-name">
        <h3>{m0.name}</h3>
        {mine && <span>sen</span>}
        {m0.crown && <span title="Haftanın Ustası">👑</span>}
      </div>
      {m0.badge === "dev" && (
        <p className="dev-tag" title="Kütüp’ü yapan kişi">✦ Kurucu · Olay ufku bekçisi</p>
      )}
      <p className="member-note">{m0.note || "Bu masada güzel şeyler olacak."}</p>
      {left > 0 ? (
        <p className="member-focus">
          {m0.focusStrict ? "🏗️" : <Headphones size={13} />} odakta · {left} dk
          <i style={{ width: `${clamp(1 - left / total) * 100}%` }} />
        </p>
      ) : (
        (m0.status === "here" || m0.status === "break") && (
          <p className="member-since">
            {m0.since && now - m0.since >= 60000
              ? `${m0.status === "here" ? "burada" : "molada"} · ${minutesLabel(Math.floor((now - m0.since) / 60000))}`
              : m0.status === "here"
                ? "şimdi geldi ✨"
                : "molaya yeni çıktı"}
          </p>
        )
      )}
      <div className="member-card-bottom">
        {m0.status === "coming" ? (
          <>
            <span className="scooter-route" aria-hidden="true">
              <b>🛵</b>
            </span>
            <span>{m0.arrival || "Birazdan burada"}</span>
          </>
        ) : m0.status === "away" ? (
          <>
            <Moon size={14} />
            <span>Henüz yerini almadı</span>
          </>
        ) : (
          <>
            <MapPin size={14} />
            <span>
              {m0.location || "Milli Kütüphane"}
              {m0.desk ? ` · ${m0.desk}` : ""}
            </span>
          </>
        )}
        <ArrowUpRight size={14} />
      </div>
    </m.button>
  );
}

// People at the library first (latest arrival first), then those on the way.
const RANK = { here: 0, break: 0, coming: 1 };
const rank = (x) => RANK[x.status] ?? 2;
function People({ members, me, now, arrived, filter, setFilter, openMember, intro }) {
  const sorted = useMemo(
    () => [...members].sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? (b.since || 0) - (a.since || 0) : 0)),
    [members],
  );
  const here = members.filter((x) => x.status === "here" || x.status === "break").length,
    coming = members.filter((x) => x.status === "coming").length;
  const visible = sorted.filter((x) => filter === "all" || (filter === "here" ? x.status === "here" || x.status === "break" : x.status === filter));
  return (
    <section className="home-people">
      <div className="section-heading">
        <Kinetic text="Kim nerede?">
          {" "}
          <span className="count-tag">{members.length}</span>
        </Kinetic>
      </div>
      <div className="filter-row">
        {[
          ["all", "Herkes", members.length],
          ["here", "Kütüpte", here],
          ["coming", "Yolda", coming],
        ].map(([id, label, count], i) => (
          <button key={id} className={`filter-chip ${filter === id ? "selected" : ""}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {filter === id && <m.i layoutId="filter-pill" className="filter-pill" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
            {id !== "all" && <i className={id} />}
            {label}
            <span>
              <Count value={count} intro={intro} delay={800 + i * 150} />
            </span>
          </button>
        ))}
        <span className="filter-live">
          canlı <span />
        </span>
      </div>
      <div className="member-grid">
        <AnimatePresence mode="popLayout" initial={intro}>
          {visible.map((x, i) => (
            <m.div
              key={x.id}
              layout
              className="member-slot"
              initial={intro ? { opacity: 0, y: 34, rotate: i % 2 ? 3 : -3, scale: 0.94 } : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
              transition={intro ? { ...BOUNCY, delay: 0.55 + Math.min(i, 6) * 0.07 } : SPRING}
            >
              <MemberCard member={x} mine={x.id === me?.id} now={now} arrived={arrived.includes(x.id)} onClick={() => openMember(x)} />
            </m.div>
          ))}
        </AnimatePresence>
      </div>
      {!visible.length && (
        <Empty emoji="🪑" title="Şimdilik sakin.">
          İlk gelenin haberi buraya düşecek.
        </Empty>
      )}
    </section>
  );
}

// ---------- who is coming when ----------
function PlanRow({ plan, data, me, requireMember, mutate }) {
  const owner = data.members.find((x) => x.id === plan.memberId),
    joined = plan.attendees.includes(me?.id),
    date = new Date(plan.starts);
  return (
    <m.article layout className="home-plan" initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} exit={{ opacity: 0, scale: 0.97 }} transition={SPRING}>
      <div className="plan-tile">
        <span>{date.toLocaleDateString("tr-TR", { month: "short", timeZone: "Europe/Istanbul" })}</span>
        <b>{date.toLocaleDateString("tr-TR", { day: "numeric", timeZone: "Europe/Istanbul" })}</b>
        <small>{shortTime(plan.starts)}</small>
      </div>
      <div className="home-plan-text">
        <strong>{plan.note || "Kütüpte buluşalım"}</strong>
        <small>
          {dayWord(plan.starts)} · {owner?.name || "Biri"} planladı
        </small>
        <span className="home-plan-who">
          <span className="avatar-stack">
            {plan.attendees.slice(0, 4).map((id) => (
              <Avatar key={id} member={data.members.find((x) => x.id === id)} size="tiny" />
            ))}
          </span>
          {plan.attendees.length} kişi geliyor
        </span>
      </div>
      {plan.memberId === me?.id ? (
        <button
          className="icon-button"
          aria-label="Planı sil"
          onClick={() => {
            if (confirm("Bu planı kaldırmak istiyor musun?")) mutate(`/plans/${plan.id}`, {}, "Plan kaldırıldı.", "DELETE");
          }}
        >
          <Trash2 size={16} />
        </button>
      ) : (
        <m.button
          whileTap={{ scale: 0.92 }}
          className={`btn small-btn ${joined ? "joined" : "primary"}`}
          aria-pressed={joined}
          onClick={() => requireMember(() => mutate(`/plans/${plan.id}/join`, {}, joined ? "Plandan ayrıldın." : "Sen de varsın. Harika!"))}
        >
          {joined ? <Check size={15} /> : <Plus size={15} />}
          {joined ? "Varım" : "Ben de"}
        </m.button>
      )}
    </m.article>
  );
}

function Plans({ data, me, requireMember, mutate, openPlan }) {
  const [all, setAll] = useState(false);
  const shown = all ? data.plans : data.plans.slice(0, 3);
  return (
    <section className="panel home-plans" id="plans">
      <div className="section-heading">
        <Kinetic text="Kim ne zaman geliyor?" />
        <m.button whileTap={{ scale: 0.94 }} className="text-button accent" onClick={() => requireMember(openPlan)}>
          <Plus size={15} /> Plan yap
        </m.button>
      </div>
      <div className="plan-line">
        <AnimatePresence initial={false}>
          {shown.map((plan) => (
            <PlanRow key={plan.id} plan={plan} data={data} me={me} requireMember={requireMember} mutate={mutate} />
          ))}
        </AnimatePresence>
      </div>
      {!data.plans.length && (
        <p className="plans-empty">
          <span aria-hidden="true">🗓️</span>
          Takvim boş. İlk “yarın buluşuruz” senden gelsin.
        </p>
      )}
      {data.plans.length > 3 && (
        <button className="text-button" onClick={() => setAll(!all)}>
          {all ? "Daha az göster" : `Tüm planlar (${data.plans.length})`}
        </button>
      )}
    </section>
  );
}

// ---------- tiles into the village and the board ----------
function VillageTile({ me, members, village, week, now, navigate }) {
  const builds = useMemo(() => [...(village?.buildings || [])].sort((a, b) => b.created - a.created).slice(0, 3), [village]);
  const focusing = members.filter((x) => x.focusEnd > now).sort((a, b) => a.focusEnd - b.focusEnd),
    first = focusing[0],
    left = first ? Math.max(1, Math.ceil((first.focusEnd - now) / 60000)) : 0,
    total = members.reduce((t, x) => t + (x.focusWeek || 0), 0),
    goal = week?.goal || 600,
    done = clamp(total / goal);
  return (
    <m.button whileTap={{ scale: 0.97 }} className={`home-tile village ${first ? "busy" : ""}`} onClick={() => navigate("focus")}>
      <span className="tile-head">
        <b>Köy</b>
        <small>{first ? "inşaat sürüyor" : `${builds.length ? village.buildings.length : 0} bina`}</small>
      </span>
      <span className="tile-scene" aria-hidden="true">
        <i className="tile-ground" />
        {builds.length ? (
          builds.map((b, i) => (
            <span key={b.id} className={`tile-build b${i}`}>
              <BuildingThumb id={modelOf(b.model, b.kind).id} size={i === 1 ? 64 : 50} />
            </span>
          ))
        ) : (
          <svg className="tile-crane" viewBox="0 0 60 50">
            <path d="M14 48V10M6 10h44M42 10v12" />
            <rect x="38" y="22" width="8" height="6" rx="1" />
            <path d="M4 48h30" />
          </svg>
        )}
      </span>
      <span className="tile-foot">
        {first ? (
          <>
            <span>
              {first.id === me?.id ? "Sen" : first.name} · {left} dk
            </span>
            <i className="tile-bar">
              <i style={{ width: `${clamp(1 - left / (first.focusMinutes || 25)) * 100}%` }} />
            </i>
          </>
        ) : (
          <>
            <span>Anıt · %{Math.round(done * 100)}</span>
            <i className="tile-bar">
              <i style={{ width: `${done * 100}%` }} />
            </i>
          </>
        )}
      </span>
    </m.button>
  );
}

function BoardTile({ members, messages, unread, navigate }) {
  const last = messages.filter((x) => x.kind !== "system").slice(-2).reverse();
  return (
    <m.button whileTap={{ scale: 0.97 }} className="home-tile board" onClick={() => navigate("board")}>
      <span className="tile-head">
        <b>Pano</b>
        {unread > 0 ? <em className="tile-badge">{unread} yeni</em> : <small>ekip sohbeti</small>}
      </span>
      <span className="tile-bubbles">
        {last.length ? (
          last.map((msg, i) => {
            const author = members.find((x) => x.id === msg.memberId);
            return (
              <span key={msg.id} className={`tile-bubble ${i ? "older" : ""}`}>
                <Avatar member={author} size="tiny" />
                <span>
                  <b>{author?.name || "Biri"}</b>
                  {msg.text}
                </span>
              </span>
            );
          })
        ) : (
          <span className="tile-empty">Ekibe ilk notu sen bırak ✎</span>
        )}
      </span>
    </m.button>
  );
}

export function Home({ data, me, now, dark, intro, arrived, filter, setFilter, unread, setModal, requireMember, mutate, navigate, village, extras }) {
  // Each arrival sends a little figure along the path into the library.
  const arrivals = useMemo(
    () => (reducedMotion() ? [] : arrived.map((id) => ({ key: id, color: `var(--${data.members.find((x) => x.id === id)?.color || "lilac"})` }))),
    [arrived.join(",")],
  );
  const rise = (i) =>
    intro ? { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.75, delay: 0.35 + i * 0.12, ease: EASE_OUT } } : {};
  return (
    <div className="home-stack">
      <HomeSky me={me} data={data} arrivals={arrivals} arrived={arrived} unread={unread} navigate={navigate} dark={dark} now={now} intro={intro} />
      <m.div className="home-main" {...rise(0)}>
        <StatusCard me={me} data={data} now={now} setModal={setModal} requireMember={requireMember} mutate={mutate} />
        {extras}
        <People
          members={data.members}
          me={me}
          now={now}
          arrived={arrived}
          filter={filter}
          setFilter={setFilter}
          intro={intro}
          openMember={(x) => (x.id === me?.id ? navigate("me") : requireMember(() => setModal({ member: x })))}
        />
      </m.div>
      <m.div className="home-side" {...rise(2)}>
        <Plans data={data} me={me} requireMember={requireMember} mutate={mutate} openPlan={() => setModal("plan")} />
        <Reveal className="home-tiles">
          <VillageTile me={me} members={data.members} village={village} week={data.week} now={now} navigate={navigate} />
          <BoardTile members={data.members} messages={data.messages} unread={unread} navigate={navigate} />
        </Reveal>
      </m.div>
    </div>
  );
}
