// The home tab (n17 + n18): a living sky, my own status, who is where, who is
// coming when, and one-line doors to the village and the board. The layout stays
// still; what moves tells something real: the time of day, a friend arriving, a
// count changing. Every tap gets a small answer.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { ArrowUpRight, Check, ChevronRight, Headphones, MapPin, MessageCircle, Moon, Plus, Trash2 } from "lucide-react";
import { Avatar, Empty, reducedMotion } from "./ui.jsx";
import { STATUS, dayWord, shortTime, minutesLabel } from "./api.js";
import { skyAt, sunTimes } from "./villageWorld.js";
import "./home.css";

// Kütüp's motion feel: playful paper. Cards settle with a little give,
// celebrations bounce, swaps are quick and quiet.
const SPRING = { type: "spring", stiffness: 300, damping: 24 };
const BOUNCY = { type: "spring", stiffness: 220, damping: 14 };
const EASE_OUT = [0.16, 1, 0.3, 1];
const swap = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: "easeIn" } },
};

export function Badge({ status }) {
  return (
    <span className={`status ${status}`}>
      <i />
      {STATUS[status]?.[0] || status}
    </span>
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

// ---------- the sky ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const STARS = Array.from({ length: 24 }, (_, i) => ({
  x: ((i * 97 + 31) % 350) + 5,
  y: ((i * 53 + 17) % 118) + 6,
  r: [0.7, 1, 1.3][i % 3],
  d: -((i * 0.37) % 3.2),
}));
const FINS = Array.from({ length: 9 }, (_, i) => 202 + i * 11.4);
const WINDOWS = Array.from({ length: 8 }, (_, i) => 206.5 + i * 11.4).filter((_, i) => i !== 4);
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

function HomeSky({ me, here, coming, arrivals, dark, now, intro }) {
  const box = useRef(null),
    [paused, setPaused] = useState(false);
  // The ambient loops stop when the sky is off screen or the app is hidden.
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
      // Sun and moon keep to the top-right corner, clear of the greeting,
      // and still tell the hour: low and left in the morning, high at noon.
      sun: [266 + 64 * day, 104 - 54 * Math.sin(Math.PI * day)],
      moon: [268 + 58 * moonAt, 96 - 48 * Math.sin(Math.PI * moonAt)],
    };
  }, [minute, dark]);
  const isNight = sky.night > 0.5;
  return (
    <section ref={box} className={`home-sky ${isNight ? "is-night" : ""} ${sky.lamps ? "lamps" : ""} ${paused ? "paused" : ""} ${intro ? "intro" : ""}`}>
      {/* The scene is 960 wide: a phone sees the middle 360, a wide screen sees all of it. */}
      <svg className="sky-art" viewBox="-300 0 960 236" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
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
          <mask id="sky-crescent">
            <rect x="-20" y="-20" width="40" height="40" fill="#fff" />
            <circle cx="6" cy="-4" r="11" fill="#000" />
          </mask>
        </defs>
        <rect x="-300" width="960" height="236" fill="url(#sky-day)" />
        <rect className="sky-fade" x="-300" width="960" height="236" fill="url(#sky-warm)" style={{ opacity: sky.warm }} />
        <rect className="sky-fade" x="-300" width="960" height="236" fill="url(#sky-night)" style={{ opacity: sky.night }} />
        <g className="sky-stars" style={{ opacity: sky.night }}>
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} style={{ animationDelay: `${s.d}s` }} />
          ))}
        </g>
        <g className="sky-body" style={{ transform: `translate(${sky.sun[0]}px, ${sky.sun[1]}px)`, opacity: clamp(1 - sky.night * 1.6) }}>
          <g className="sky-sun-rise">
            <circle className="sky-halo" r="30" />
            <circle className="sky-sun" r="17" />
          </g>
        </g>
        <g className="sky-body" style={{ transform: `translate(${sky.moon[0]}px, ${sky.moon[1]}px)`, opacity: clamp(sky.night * 1.4 - 0.3) }}>
          <circle r="14" fill="#f4efd9" mask="url(#sky-crescent)" />
        </g>
        <g className="sky-cloud c1"><g className="sky-cloud-fill"><ellipse cx="60" cy="74" rx="26" ry="10" /><ellipse cx="78" cy="68" rx="16" ry="12" /><ellipse cx="46" cy="70" rx="12" ry="9" /></g></g>
        <g className="sky-cloud c2"><g className="sky-cloud-fill"><ellipse cx="20" cy="104" rx="20" ry="7" /><ellipse cx="33" cy="99" rx="12" ry="9" /></g></g>
        <g className="sky-cloud c3"><g className="sky-cloud-fill"><ellipse cx="0" cy="40" rx="30" ry="9" /><ellipse cx="18" cy="34" rx="15" ry="10" /><ellipse cx="-12" cy="36" rx="12" ry="8" /></g></g>
        <g className="sky-birds">
          <g className="sky-fly">
            <path className="sky-flap" d="M0 96 q4 -4 8 0 q4 -4 8 0" />
            <path className="sky-flap" style={{ animationDelay: "-.2s" }} d="M20 88 q3 -3 6 0 q3 -3 6 0" />
          </g>
        </g>
        <g className="sky-land">
          <path className="sky-hill back" d="M-300 176 C -220 152, -110 168, 0 178 C 60 150, 120 160, 180 170 S 300 150, 360 162 S 540 148, 660 168 L660 236 L-300 236Z" />
          <g className="sky-mill" transform="translate(-170 0)">
            <path className="sky-wall" d="M-7 172 L-4 136 L4 136 L7 172Z" />
            <path className="sky-roof r2" d="M-6 137 L0 128 L6 137Z" />
            <g className="sky-blades"><rect x="-1.2" y="117" width="2.4" height="28" rx="1" /><rect x="-14" y="129.8" width="28" height="2.4" rx="1" /></g>
          </g>
          <g transform="translate(-250 6)">
            <rect className="sky-wall" x="0" y="156" width="20" height="15" rx="1.5" /><path className="sky-roof r3" d="M-3 157 L10 146 L23 157Z" /><rect className="sky-window" x="7" y="161" width="5" height="5" rx="1" />
          </g>
          <g className="sky-mill" transform="translate(560 -4)">
            <path className="sky-wall" d="M-7 172 L-4 136 L4 136 L7 172Z" />
            <path className="sky-roof r1" d="M-6 137 L0 128 L6 137Z" />
            <g className="sky-blades slow"><rect x="-1.2" y="117" width="2.4" height="28" rx="1" /><rect x="-14" y="129.8" width="28" height="2.4" rx="1" /></g>
          </g>
          <g transform="translate(430 2)">
            <rect className="sky-wall" x="0" y="156" width="22" height="16" rx="1.5" /><path className="sky-roof r2" d="M-3 157 L11 145 L25 157Z" /><rect className="sky-window" x="8" y="161" width="5" height="5" rx="1" />
          </g>
          <g className="sky-houses" transform="translate(0 4)">
            <rect className="sky-wall" x="28" y="150" width="22" height="18" rx="1.5" /><path className="sky-roof r1" d="M25 151 L39 139 L53 151Z" /><rect className="sky-window" x="35" y="156" width="6" height="6" rx="1" />
            <rect className="sky-wall" x="62" y="156" width="18" height="15" rx="1.5" /><path className="sky-roof r2" d="M59 157 L71 147 L83 157Z" /><rect className="sky-window" x="68" y="161" width="5" height="5" rx="1" />
            <rect className="sky-wall" x="92" y="160" width="20" height="14" rx="1.5" /><path className="sky-roof r3" d="M89 161 L102 151 L115 161Z" /><rect className="sky-window" x="99" y="164" width="5" height="5" rx="1" />
            <circle className="sky-smoke" cx="45" cy="136" r="3" />
            <circle className="sky-smoke" style={{ animationDelay: "-1.8s" }} cx="45" cy="136" r="3" />
          </g>
          <g className="sky-crane">
            <rect x="151" y="112" width="3" height="58" />
            <g className="sky-boom">
              <rect x="140" y="112" width="44" height="2.6" rx="1" />
              <g className="sky-hook"><line x1="176" y1="114" x2="176" y2="134" /><rect className="sky-roof r1" x="172" y="134" width="8" height="5" rx="1" /></g>
            </g>
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
          <g className="sky-tree" style={{ animationDelay: "-1s" }}><rect className="sky-trunk" x="16" y="186" width="3" height="12" /><circle className="sky-leaf" cx="17.5" cy="182" r="9" /></g>
          <g className="sky-tree" style={{ animationDelay: "-2.4s" }}><rect className="sky-trunk" x="128" y="190" width="3" height="11" /><circle className="sky-leaf b" cx="129.5" cy="186" r="8" /></g>
          <g className="sky-tree" style={{ animationDelay: "-.4s" }}><rect className="sky-trunk" x="322" y="180" width="3" height="13" /><circle className="sky-leaf" cx="323.5" cy="175" r="10" /></g>
          <g className="sky-tree" style={{ animationDelay: "-3.1s" }}><rect className="sky-trunk" x="344" y="186" width="3" height="10" /><circle className="sky-leaf b" cx="345.5" cy="182" r="7.5" /></g>
          {[-280, -205, -120, -60, 400, 480, 610, 640].map((x, i) => (
            <g key={x} className="sky-tree" style={{ animationDelay: `${-i * 0.7}s` }}>
              <rect className="sky-trunk" x={x} y={186 + (i % 3) * 3} width="3" height="11" />
              <circle className={`sky-leaf ${i % 2 ? "b" : ""}`} cx={x + 1.5} cy={182 + (i % 3) * 3} r={7 + (i % 3) * 1.5} />
            </g>
          ))}
          {arrivals.map((a) => <Walker key={a.key} color={a.color} />)}
        </g>
      </svg>
      <div className="sky-copy">
        <span className="sky-eyebrow">{greeting(sky.hour)}</span>
        <h1>
          Selam{me ? `, ${me.name}` : ""} <span className="wave">✌️</span>
        </h1>
        <span className="sky-live">
          <i className={here ? "on" : ""} />
          {here ? (
            <>
              <Count value={here} intro={intro} delay={900} />&nbsp;kişi kütüpte
            </>
          ) : (
            "Kütüp şimdilik sessiz"
          )}
          {coming > 0 && (
            <>
              &nbsp;·&nbsp;
              <Count value={coming} intro={intro} delay={1100} />&nbsp;yolda
            </>
          )}
        </span>
      </div>
    </section>
  );
}

// ---------- my status ----------
const PARTY = ["var(--accent)", "#e2a184", "#a9cc92", "#a9bcdc", "#e9c46a", "#d9a5c0"];
function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: (Math.random() - 0.5) * 250,
        y: -50 - Math.random() * 110,
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
          animate={{ x: [0, b.x, b.x * 1.25], y: [0, b.y, b.y + 150], rotate: [0, b.r / 2, b.r], scale: [0.4, 1, 0.85], opacity: [1, 1, 0] }}
          transition={{ duration: b.d, times: [0, 0.42, 1], ease: [0.2, 0.7, 0.4, 1] }}
        >
          {b.k === 0 ? "✦" : null}
        </m.i>
      ))}
    </span>
  );
}

function StatusCard({ me, now, setModal, requireMember, mutate }) {
  const state = me?.status === "break" ? "here" : me?.status === "here" || me?.status === "coming" ? me.status : "away";
  const [party, setParty] = useState(0),
    [burst, setBurst] = useState(0),
    was = useRef(me?.status);
  useEffect(() => {
    if (!party) return;
    setBurst(party);
    const timer = setTimeout(() => setBurst(0), 2200);
    return () => clearTimeout(timer);
  }, [party]);
  // Sitting down is worth a small celebration: confetti and a dropping pin.
  useEffect(() => {
    const before = was.current;
    was.current = me?.status;
    if (me?.status === "here" && before && before !== "here" && before !== "break" && !reducedMotion()) setParty(Date.now());
  }, [me?.status]);
  const minutes = me?.since ? Math.floor((now - me.since) / 60000) : 0;
  const away = () => mutate("/presence", { status: "away" }, "Bugünlük bu kadar. Yarın görüşürüz! 👋");
  return (
    <m.section layout className={`panel home-status ${state}`} transition={SPRING}>
      <AnimatePresence mode="wait" initial={false}>
        {state === "away" && (
          <m.div key="away" {...swap}>
            <h2>Bugün geliyor musun?</h2>
            <p>Henüz kütüpte değilsin. Gelince ekibine haber gider.</p>
            <div className="home-acts">
              <m.button whileTap={{ scale: 0.96 }} className="btn primary" onClick={() => requireMember(() => setModal("presence"))}>
                <MapPin size={18} /> Geldim
              </m.button>
              <m.button whileTap={{ scale: 0.96 }} className="btn ghost" onClick={() => requireMember(() => setModal("coming"))}>
                Yoldayım
              </m.button>
            </div>
          </m.div>
        )}
        {state === "coming" && (
          <m.div key="coming" {...swap}>
            <div className="home-status-head">
              <Badge status="coming" />
              <small>{me.arrival || "Birazdan"}</small>
            </div>
            <h2>Yoldasın, ekip haberdar.</h2>
            <div className="home-acts">
              <m.button whileTap={{ scale: 0.96 }} className="btn primary" onClick={() => setModal("presence")}>
                <MapPin size={18} /> Geldim
              </m.button>
              <m.button whileTap={{ scale: 0.96 }} className="btn ghost" onClick={() => mutate("/presence", { status: "away" }, "Tamam, başka zaman. 👋")}>
                Vazgeçtim
              </m.button>
            </div>
          </m.div>
        )}
        {state === "here" && (
          <m.div key="here" {...swap}>
            <div className="home-status-head">
              <m.span key={party} className="home-pin" initial={party ? { y: -26, opacity: 0 } : false} animate={{ y: 0, opacity: 1 }} transition={BOUNCY}>
                <MapPin size={16} />
              </m.span>
              <Badge status={me.status} />
              <small>{minutes >= 1 ? `burada · ${minutesLabel(minutes)}` : "şimdi geldin ✨"}</small>
            </div>
            <h2>
              {me.location || "Milli Kütüphane"}
              {me.desk ? ` · masa ${me.desk}` : ""}
            </h2>
            <div className="home-acts even">
              <m.button whileTap={{ scale: 0.96 }} className="btn ghost" onClick={() => setModal("presence")}>
                Yerimi değiştir
              </m.button>
              <m.button whileTap={{ scale: 0.96 }} className="btn ghost" onClick={away}>
                Çıktım
              </m.button>
            </div>
          </m.div>
        )}
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
  return (
    <m.button ref={card} className={`member-card ${m0.color} ${arrived ? "arrived" : ""}`} onClick={onClick} whileTap={{ scale: 0.97 }}>
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
        {m0.focusEnd > now &&
          (m0.focusStrict ? (
            <span className="member-plant" title="İnşaat modunda odakta">
              🏗️
            </span>
          ) : (
            <Headphones size={16} />
          ))}
      </div>
      {m0.badge === "dev" && (
        <p className="dev-tag" title="Kütüp’ü yapan kişi">✦ Kurucu · Olay ufku bekçisi</p>
      )}
      <p className="member-note">{m0.note || "Bu masada güzel şeyler olacak."}</p>
      {(m0.status === "here" || m0.status === "break") && (
        <p className="member-since">
          {m0.since && now - m0.since >= 60000
            ? `${m0.status === "here" ? "burada" : "molada"} · ${minutesLabel(Math.floor((now - m0.since) / 60000))}`
            : m0.status === "here"
              ? "şimdi geldi ✨"
              : "molaya yeni çıktı"}
        </p>
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
const rank = (m) => RANK[m.status] ?? 2;
function People({ members, me, now, arrived, filter, setFilter, openMember, intro }) {
  const sorted = useMemo(
    () => [...members].sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? (b.since || 0) - (a.since || 0) : 0)),
    [members],
  );
  const here = members.filter((m) => m.status === "here" || m.status === "break").length,
    coming = members.filter((m) => m.status === "coming").length;
  const visible = sorted.filter((m) => filter === "all" || (filter === "here" ? m.status === "here" || m.status === "break" : m.status === filter));
  return (
    <section className="home-people">
      <div className="section-heading">
        <h2>
          Kim nerede? <span>{members.length}</span>
        </h2>
      </div>
      <div className="filter-row">
        {[
          ["all", "Herkes", members.length],
          ["here", "Kütüpte", here],
          ["coming", "Yolda", coming],
        ].map(([id, label, count], i) => (
          <button key={id} className={`filter-chip ${filter === id ? "selected" : ""}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
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
    <m.article layout className="home-plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={SPRING}>
      <div className="date-square">
        <span>{date.toLocaleDateString("tr-TR", { month: "short", timeZone: "Europe/Istanbul" })}</span>
        <b>{date.toLocaleDateString("tr-TR", { day: "numeric", timeZone: "Europe/Istanbul" })}</b>
      </div>
      <div className="home-plan-text">
        <strong>{plan.note || "Kütüpte buluşalım"}</strong>
        <small>
          {dayWord(plan.starts)} {shortTime(plan.starts)} · {owner?.name || "Biri"} planladı
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
          whileTap={{ scale: 0.94 }}
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
        <h2>Kim ne zaman geliyor?</h2>
        <button className="text-button accent" onClick={() => requireMember(openPlan)}>
          <Plus size={15} /> Plan yap
        </button>
      </div>
      <AnimatePresence initial={false}>
        {shown.map((plan) => (
          <PlanRow key={plan.id} plan={plan} data={data} me={me} requireMember={requireMember} mutate={mutate} />
        ))}
      </AnimatePresence>
      {!data.plans.length && <p className="muted small">Takvim boş. İlk “yarın buluşuruz” senden gelsin.</p>}
      {data.plans.length > 3 && (
        <button className="text-button" onClick={() => setAll(!all)}>
          {all ? "Daha az göster" : `Tüm planlar (${data.plans.length})`}
        </button>
      )}
    </section>
  );
}

// ---------- doors to the village and the board ----------
function Doors({ me, members, messages, now, unread, navigate }) {
  const focusing = members.filter((x) => x.focusEnd > now && x.id !== me?.id),
    left = me?.focusEnd > now ? Math.ceil((me.focusEnd - now) / 60000) : 0;
  const village = left
    ? `Odaktasın · ${left} dk kaldı`
    : focusing.length
      ? `${focusing.slice(0, 2).map((x) => x.name).join(", ")}${focusing.length > 2 ? ` +${focusing.length - 2}` : ""} odakta`
      : "25 dk odaklan, köyüne bir bina ekle";
  const last = messages.filter((x) => x.kind !== "system").reduce((a, b) => (!a || b.created > a.created ? b : a), null),
    author = last && members.find((x) => x.id === last.memberId);
  return (
    <div className="home-doors">
      <m.button whileTap={{ scale: 0.98 }} className="home-door" onClick={() => navigate("focus")}>
        <i className={`door-icon crane ${left || focusing.length ? "busy" : ""}`}>
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M7 23V5" />
            <g className="door-boom">
              <path d="M3 5h18" />
              <g className="door-hook">
                <path d="M18 5v6" />
                <rect x="16" y="11" width="4" height="3" rx=".6" />
              </g>
            </g>
            <path d="M4 23h16" />
          </svg>
        </i>
        <span>
          <strong>Köy</strong>
          <small>{village}</small>
        </span>
        <ChevronRight size={17} />
      </m.button>
      <m.button whileTap={{ scale: 0.98 }} className="home-door" onClick={() => navigate("board")}>
        <i className="door-icon">
          <MessageCircle size={19} />
          {unread > 0 && <b className="door-dot" />}
        </i>
        <span>
          <strong>{last ? `${author?.name || "Biri"}: ${last.text}` : "Pano"}</strong>
          <small>{unread ? `Pano · ${unread} yeni mesaj` : last ? "Pano · son mesaj" : "Ekibe küçük bir not bırak"}</small>
        </span>
        <ChevronRight size={17} />
      </m.button>
    </div>
  );
}

export function Home({ data, me, now, dark, intro, arrived, filter, setFilter, unread, setModal, requireMember, mutate, navigate, extras }) {
  const here = data.members.filter((x) => x.status === "here" || x.status === "break").length,
    coming = data.members.filter((x) => x.status === "coming").length;
  // Each arrival sends a little figure along the path into the library.
  const arrivals = useMemo(
    () =>
      reducedMotion()
        ? []
        : arrived.map((id) => ({ key: id, color: `var(--${data.members.find((x) => x.id === id)?.color || "lilac"})` })),
    [arrived.join(",")],
  );
  const rise = (i) =>
    intro ? { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.75, delay: 0.35 + i * 0.12, ease: EASE_OUT } } : {};
  return (
    <div className="home-stack">
      <HomeSky me={me} here={here} coming={coming} arrivals={arrivals} dark={dark} now={now} intro={intro} />
      <m.div className="home-main" {...rise(0)}>
        <StatusCard me={me} now={now} setModal={setModal} requireMember={requireMember} mutate={mutate} />
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
        <Doors me={me} members={data.members} messages={data.messages} now={now} unread={unread} navigate={navigate} />
      </m.div>
    </div>
  );
}
