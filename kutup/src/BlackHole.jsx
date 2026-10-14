// Batur's black hole: the art (event horizon, photon ring, spinning accretion
// disk, infalling sparks) and the gate the secret ✳ combination opens. The gate
// only shows the way in; /batur still needs the key or a remembered owner cookie.
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, KeyRound } from "lucide-react";
import { api, get } from "./api.js";
import { reducedMotion } from "./ui.jsx";
import "./blackhole.css";

// Sparks spiral in on a small canvas; one rAF loop, paused when hidden.
function Infall({ size }) {
  const canvas = useRef();
  useEffect(() => {
    if (reducedMotion()) return;
    const c = canvas.current,
      ctx = c.getContext("2d"),
      dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = size * dpr;
    ctx.scale(dpr, dpr);
    const center = size / 2,
      horizon = size * 0.17;
    const spark = () => ({
      r: size * (0.32 + Math.random() * 0.2),
      a: Math.random() * Math.PI * 2,
      hue: 20 + Math.random() * 30,
    });
    const sparks = Array.from({ length: 70 }, spark);
    let frame = 0,
      last = performance.now();
    const draw = (time) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden) return;
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      ctx.clearRect(0, 0, size, size);
      for (const s of sparks) {
        // Closer in, faster around and faster down: a Keplerian-ish spiral.
        const speed = 1.6 * Math.pow(size * 0.3 / s.r, 1.5);
        s.a += speed * dt;
        s.r -= (6 + 900 / s.r) * dt;
        if (s.r < horizon) Object.assign(s, spark());
        const x = center + Math.cos(s.a) * s.r,
          y = center + Math.sin(s.a) * s.r * 0.38;
        const fade = Math.min(1, (s.r - horizon) / (size * 0.08));
        ctx.fillStyle = `hsla(${s.hue}, 100%, 70%, ${0.85 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.3 + fade, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [size]);
  return <canvas ref={canvas} className="bh-infall" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function BlackHoleArt({ size = 240, sparks = true, className = "" }) {
  return (
    <div className={`bh ${className}`} style={{ "--bh-size": `${size}px` }} aria-hidden="true">
      <div className="bh-glow" />
      <div className="bh-disk-tilt">
        <div className="bh-disk" />
      </div>
      <div className="bh-lens" />
      <div className="bh-horizon" />
      <div className="bh-disk-tilt bh-front">
        <div className="bh-disk" />
      </div>
      {sparks && <Infall size={size} />}
    </div>
  );
}

function Gate({ close }) {
  const [phase, setPhase] = useState("falling"), // falling → locked | entering
    [key, setKey] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [badge, setBadge] = useState(false);
  useEffect(() => {
    const calm = reducedMotion();
    // The page collapses toward the hole wherever it was scrolled to.
    document.body.style.setProperty("--bh-scroll", `${window.scrollY}px`);
    document.body.classList.add(calm ? "bh-calm" : "bh-pulling");
    navigator.vibrate?.([20, 40, 60]);
    // Finding the door is a hidden badge (members only; others just get the view).
    api("/achievements", { key: "black-hole" })
      .then((r) => r.new && setBadge(true))
      .catch(() => {});
    let gone = false;
    const settle = new Promise((r) => setTimeout(r, calm ? 300 : 1400));
    Promise.all([get("/owner/status").catch(() => ({})), settle]).then(([status]) => {
      if (gone) return;
      if (status.signedIn) {
        setPhase("entering");
        location.href = "/batur";
      } else setPhase("locked");
    });
    return () => {
      gone = true;
    };
  }, []);
  const leave = () => {
    document.body.classList.remove("bh-pulling", "bh-calm");
    document.body.classList.add("bh-releasing");
    setPhase("leaving");
    setTimeout(() => {
      document.body.classList.remove("bh-releasing");
      close();
    }, reducedMotion() ? 0 : 700);
  };
  const unlock = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/owner/login", { key });
      setPhase("entering");
      location.href = "/batur";
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  useEffect(() => {
    const escape = (e) => e.key === "Escape" && phase === "locked" && leave();
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [phase]);
  return (
    <div className={`bh-gate ${phase}`} role="dialog" aria-modal="true" aria-label="Batur’un kara deliği">
      <BlackHoleArt size={Math.min(300, window.innerWidth - 40)} />
      {phase === "locked" && (
        <div className="bh-card">
          <h2>Burası Batur’un kara deliği 🕳️</h2>
          <p>Buraya düşen ışık bile geri dönmez. Sen döneceksin ama; merak etme.</p>
          {badge && <p className="bh-badge">✨ Gizli rozet: Kara delik kâşifi</p>}
          <form onSubmit={unlock}>
            <label>
              <span>Anahtarın varsa</span>
              <input
                type="password"
                autoComplete="current-password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Sadece Batur’da olan anahtar"
              />
            </label>
            {error && <p className="bh-error">{error}</p>}
            <div className="bh-actions">
              <button type="button" className="bh-back" onClick={leave}>
                <ArrowLeft size={16} /> Geri dön
              </button>
              <button type="submit" className="bh-open" disabled={!key || busy}>
                <KeyRound size={16} /> {busy ? "Açılıyor…" : "Aç"}
              </button>
            </div>
          </form>
        </div>
      )}
      {phase === "entering" && <p className="bh-whisper">Olay ufkunu geçiyorsun…</p>}
    </div>
  );
}

let mounted = null;
export function openBlackHole() {
  if (mounted || location.pathname === "/batur") return;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  mounted = { root, host };
  root.render(
    <Gate
      close={() => {
        root.unmount();
        host.remove();
        mounted = null;
      }}
    />,
  );
}
