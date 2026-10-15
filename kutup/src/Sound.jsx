// "Şehir biraz sussun": ambient sounds made in the browser with the Web Audio
// API, no files to download. Each sound is a layer with its own volume, and
// layers mix. Events (rain drops, crackles, page turns, birds, cups, a black
// hole merger's chirp) are rendered once into looping buffers, so they keep
// playing evenly in a background tab, where timers are slowed down.
import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, SlidersHorizontal } from "lucide-react";
import { storage } from "./ui.jsx";
import "./sound.css";

export const SOUNDS = [
  { id: "rain", emoji: "🌧️", name: "Yağmur", hint: "Cama vuran damlalar" },
  { id: "library", emoji: "📚", name: "Kütüphane", hint: "Uğultu, ara ara sayfa sesi" },
  { id: "fire", emoji: "🔥", name: "Şömine", hint: "Çıtırdayan odun" },
  { id: "forest", emoji: "🌲", name: "Orman", hint: "Rüzgâr ve kuşlar" },
  { id: "waves", emoji: "🌊", name: "Dalgalar", hint: "Gelip giden deniz" },
  { id: "cafe", emoji: "☕", name: "Kafe", hint: "Uzak sohbet, fincanlar" },
  { id: "brown", emoji: "🟤", name: "Odak gürültüsü", hint: "Yumuşak kahverengi gürültü" },
  { id: "blackhole", emoji: "🕳️", name: "Kara delik", hint: "Derin uğultu, ara ara birleşme cıvıltısı" },
];

// ---------- the engine ----------
let ctx = null,
  master = null,
  meter = null;
const cache = {};
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(limiter);
    limiter.connect(ctx.destination);
    meter = ctx.createAnalyser();
    meter.fftSize = 2048;
    limiter.connect(meter);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}
const rnd = (a, b) => a + Math.random() * (b - a);

// Stereo noise, 8 seconds, with the loop seam cross-faded so it never clicks.
function noise(color) {
  if (cache[color]) return cache[color];
  const rate = ctx.sampleRate,
    len = rate * 8,
    buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === "white") d[i] = w * 0.5;
      else if (color === "pink") {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    const fade = Math.floor(rate * 0.25);
    for (let i = 0; i < fade; i++) d[len - fade + i] = d[len - fade + i] * (1 - i / fade) + d[i] * (i / fade);
  }
  return (cache[color] = buf);
}

// Offline rendering of one-shot events into a looping stereo buffer.
function rendered(key, seconds, paint) {
  if (cache[key]) return cache[key];
  const rate = ctx.sampleRate,
    len = Math.floor(rate * seconds),
    L = new Float32Array(len),
    R = new Float32Array(len);
  const put = (at, samples, pan = 0) => {
    const a = ((pan + 1) * Math.PI) / 4,
      gl = Math.cos(a),
      gr = Math.sin(a),
      start = Math.floor(at * rate);
    for (let i = 0; i < samples.length; i++) {
      const j = (start + i) % len;
      L[j] += samples[i] * gl;
      R[j] += samples[i] * gr;
    }
  };
  paint(put, rate);
  const buf = ctx.createBuffer(2, len, rate);
  buf.copyToChannel(L, 0);
  buf.copyToChannel(R, 1);
  return (cache[key] = buf);
}
// A burst of noise through a resonant band-pass (RBJ biquad), with an envelope.
function burst(rate, { f, q = 1, attack = 0.001, decay = 0.02, level = 0.3 }) {
  const n = Math.floor(rate * (attack + decay * 6)),
    out = new Float32Array(n);
  const w0 = (2 * Math.PI * f) / rate,
    alpha = Math.sin(w0) / (2 * q),
    a0 = 1 + alpha,
    b0 = alpha / a0,
    b2 = -alpha / a0,
    a1 = (-2 * Math.cos(w0)) / a0,
    a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate,
      env = t < attack ? t / attack : Math.exp(-(t - attack) / decay),
      x = Math.random() * 2 - 1,
      y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    out[i] = y * env * level;
  }
  return out;
}
// A tone gliding from f0 to f1 (exponentially), with a soft envelope.
function glide(rate, { f0, f1, dur, level = 0.2, partials = [1] }) {
  const n = Math.floor(rate * dur),
    out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n,
      f = f0 * Math.pow(f1 / f0, t),
      env = Math.sin(Math.PI * t) ** 2;
    phase += (2 * Math.PI * f) / rate;
    let v = 0;
    partials.forEach((p, k) => (v += Math.sin(phase * p) / (k + 1)));
    out[i] = v * env * level;
  }
  return out;
}
// A struck cup or spoon: inharmonic partials that ring and fade.
function ting(rate, { f, level = 0.05 }) {
  const n = Math.floor(rate * 0.9),
    out = new Float32Array(n),
    partials = [[1, 1], [2.32, 0.5], [3.9, 0.3], [5.4, 0.15]];
  for (let i = 0; i < n; i++) {
    const t = i / rate,
      env = Math.min(1, t / 0.002) * Math.exp(-t / 0.16);
    let v = 0;
    for (const [p, a] of partials) v += Math.sin(2 * Math.PI * f * p * t) * a * Math.exp(-t * p * 2);
    out[i] = v * env * level;
  }
  return out;
}
// A gravitational-wave chirp: frequency and loudness climb as the two holes
// spiral in (f ∝ (tc − t)^(−3/8)), then a short ring-down.
function mergerChirp(rate) {
  const dur = 2.4,
    n = Math.floor(rate * (dur + 0.35)),
    out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    let f, a;
    if (t < dur) {
      const left = Math.max(0.004, dur + 0.004 - t);
      f = Math.min(320, 34 * Math.pow(left / dur, -3 / 8));
      a = Math.pow(f / 320, 2 / 3) * Math.min(1, t / 0.4);
    } else {
      f = 320;
      a = Math.exp(-(t - dur) / 0.06);
    }
    phase += (2 * Math.PI * f) / rate;
    out[i] = Math.sin(phase) * a * 0.32;
  }
  return out;
}
const EVENTS = {
  drops: (put, rate) => {
    for (let i = 0; i < 150; i++) put(rnd(0, 8), burst(rate, { f: rnd(1400, 6200), q: rnd(2, 6), decay: rnd(0.004, 0.012), level: rnd(0.08, 0.32) }), rnd(-0.9, 0.9));
  },
  pages: (put, rate) => {
    for (const at of [rnd(3, 9), rnd(17, 24), rnd(31, 38)]) {
      put(at, burst(rate, { f: rnd(2200, 3200), q: 0.6, attack: 0.07, decay: 0.09, level: 0.12 }), rnd(-0.6, 0.6));
      put(at + 0.16, burst(rate, { f: rnd(3000, 4200), q: 0.6, attack: 0.03, decay: 0.05, level: 0.06 }), rnd(-0.6, 0.6));
    }
    put(rnd(26, 29), glide(rate, { f0: 190, f1: 150, dur: 0.5, level: 0.03, partials: [1, 2.01, 3.02] }), rnd(-0.5, 0.5)); // a chair, far away
  },
  crackle: (put, rate) => {
    for (let i = 0; i < 260; i++) put(rnd(0, 10), burst(rate, { f: rnd(1800, 5200), q: 0.9, decay: rnd(0.0008, 0.003), level: rnd(0.1, 0.5) }), rnd(-0.4, 0.4));
    for (let i = 0; i < 7; i++) put(rnd(0, 10), burst(rate, { f: rnd(500, 1100), q: 1.2, decay: rnd(0.006, 0.014), level: rnd(0.3, 0.6) }), rnd(-0.3, 0.3));
  },
  birds: (put, rate) => {
    for (let k = 0; k < 6; k++) {
      const at = rnd(0, 28),
        base = rnd(2600, 4200),
        pan = rnd(-0.8, 0.8);
      for (let j = 0; j < 2 + Math.floor(rnd(0, 3)); j++)
        put(at + j * rnd(0.14, 0.22), glide(rate, { f0: base, f1: base * rnd(1.15, 1.45), dur: rnd(0.07, 0.12), level: 0.035 }), pan);
    }
  },
  cups: (put, rate) => {
    for (const at of [rnd(2, 8), rnd(12, 18), rnd(20, 24)]) {
      const pan = rnd(-0.8, 0.8);
      put(at, ting(rate, { f: rnd(1900, 2600), level: 0.045 }), pan);
      if (Math.random() < 0.5) put(at + rnd(0.15, 0.3), ting(rate, { f: rnd(2400, 3100), level: 0.025 }), pan);
    }
  },
  merger: (put, rate) => put(rnd(18, 36), mergerChirp(rate), 0),
};

const node = {
  loop(buf) {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start(0, rnd(0, buf.duration - 0.1));
    return s;
  },
  filter(type, f, q = 0.7) {
    const n = ctx.createBiquadFilter();
    n.type = type;
    n.frequency.value = f;
    n.Q.value = q;
    return n;
  },
  gain(v) {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  },
  osc(type, f) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.start();
    return o;
  },
  pan(p) {
    if (!ctx.createStereoPanner) return node.gain(1);
    const n = ctx.createStereoPanner();
    n.pan.value = p;
    return n;
  },
};
const chain = (...nodes) => {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
  return nodes.at(-1);
};
// A slow wobble on an AudioParam around its current value.
const wobble = (param, rate, depth, sources) => {
  const o = node.osc("sine", rate),
    g = node.gain(depth);
  o.connect(g);
  g.connect(param);
  sources.push(o);
};

// Each recipe connects its sources into \`out\` and returns them for stopping.
const RECIPES = {
  rain(out) {
    const s = [node.loop(noise("pink")), node.loop(rendered("drops", 8, EVENTS.drops)), node.loop(noise("brown"))];
    chain(s[0], node.filter("highpass", 500), node.filter("lowpass", 6500), node.gain(0.5), out);
    chain(s[1], node.gain(0.75), out);
    chain(s[2], node.filter("lowpass", 180), node.gain(0.25), out);
    return s;
  },
  library(out) {
    const s = [node.loop(noise("brown")), node.loop(noise("pink")), node.loop(rendered("pages", 42, EVENTS.pages))];
    chain(s[0], node.filter("lowpass", 340), node.gain(0.45), out);
    chain(s[1], node.filter("bandpass", 900, 0.4), node.gain(0.05), out);
    chain(s[2], node.gain(0.9), out);
    return s;
  },
  fire(out) {
    const s = [node.loop(noise("brown")), node.loop(rendered("crackle", 10, EVENTS.crackle))];
    const roar = node.gain(0.42);
    chain(s[0], node.filter("lowpass", 650), roar, out);
    wobble(roar.gain, 0.17, 0.12, s);
    chain(s[1], node.filter("highpass", 400), node.gain(0.55), out);
    return s;
  },
  forest(out) {
    const s = [node.loop(noise("pink")), node.loop(noise("white")), node.loop(rendered("birds", 30, EVENTS.birds))];
    const band = node.filter("bandpass", 650, 0.9),
      wind = node.gain(0.62);
    chain(s[0], band, wind, out);
    wobble(band.frequency, 0.055, 330, s);
    wobble(wind.gain, 0.085, 0.12, s);
    chain(s[1], node.filter("highpass", 4200), node.gain(0.05), out);
    chain(s[2], node.gain(1.3), out);
    return s;
  },
  waves(out) {
    const s = [node.loop(noise("brown")), node.loop(noise("pink"))];
    const low = node.filter("lowpass", 650),
      swell = node.gain(0.34),
      spray = node.gain(0.05);
    chain(s[0], low, swell, out);
    chain(s[1], node.filter("highpass", 1600), spray, out);
    // One swell drives all three, so the foam comes in with the wave.
    const tide = node.osc("sine", 0.1);
    s.push(tide);
    for (const [param, depth] of [[low.frequency, 420], [swell.gain, 0.28], [spray.gain, 0.045]]) {
      const g = node.gain(depth);
      tide.connect(g);
      g.connect(param);
    }
    return s;
  },
  cafe(out) {
    const s = [node.loop(noise("pink")), node.loop(noise("pink")), node.loop(noise("brown")), node.loop(rendered("cups", 26, EVENTS.cups))];
    const voices = node.gain(0.42),
      voices2 = node.gain(0.17);
    chain(s[0], node.filter("bandpass", 480, 0.9), voices, node.pan(-0.3), out);
    chain(s[1], node.filter("bandpass", 1150, 1.1), voices2, node.pan(0.35), out);
    wobble(voices.gain, 4.3, 0.07, s);
    wobble(voices2.gain, 5.7, 0.04, s);
    chain(s[2], node.filter("lowpass", 300), node.gain(0.3), out);
    chain(s[3], node.gain(1.1), out);
    return s;
  },
  brown(out) {
    const s = [node.loop(noise("brown"))];
    chain(s[0], node.filter("lowpass", 950), node.gain(0.55), out);
    return s;
  },
  blackhole(out) {
    // Two deep tones a hair apart beat slowly against each other; the
    // accretion disk hisses as it swirls; now and then two holes merge.
    const s = [node.osc("sine", 41), node.osc("sine", 41.6), node.osc("triangle", 82.4), node.loop(noise("pink")), node.loop(rendered("merger", 54, EVENTS.merger)), node.osc("sine", 123.4), node.osc("sine", 164.9)];
    const drone = node.filter("lowpass", 420);
    chain(drone, node.gain(0.32), out);
    chain(s[0], node.gain(0.5), node.pan(-0.45), drone);
    chain(s[1], node.gain(0.5), node.pan(0.45), drone);
    chain(s[2], node.gain(0.16), drone);
    // Overtones a laptop speaker can play, so the ear hears the deep tone too.
    const overtones = node.gain(0.09);
    chain(overtones, drone);
    chain(s[5], node.pan(-0.2), overtones);
    chain(s[6], node.gain(0.6), node.pan(0.2), overtones);
    wobble(overtones.gain, 0.045, 0.05, s);
    const disk = node.filter("bandpass", 260, 1.4),
      diskLevel = node.gain(0.2);
    chain(s[3], disk, diskLevel, out);
    wobble(disk.frequency, 0.07, 160, s);
    wobble(diskLevel.gain, 0.031, 0.08, s);
    chain(s[4], node.gain(0.9), out);
    return s;
  },
};

const layers = new Map(); // id -> { gain, sources }
const FADE = 1.2;
function setLayer(id, volume) {
  const now = ctx.currentTime;
  let layer = layers.get(id);
  if (!layer && volume > 0) {
    const gain = node.gain(0);
    gain.connect(master);
    layer = { gain, sources: RECIPES[id](gain) };
    layers.set(id, layer);
  }
  if (!layer) return;
  layer.gain.gain.cancelScheduledValues(now);
  layer.gain.gain.setTargetAtTime(volume, now, FADE / 3);
  if (volume <= 0) {
    layers.delete(id);
    setTimeout(() => {
      for (const s of layer.sources) s.stop?.();
      layer.gain.disconnect();
    }, FADE * 1500);
  }
}
/** Plays exactly these layers ({ id: volume }) at this master volume. */
export function mix(wanted, volume) {
  if (!audio()) return false;
  for (const id of [...layers.keys()]) if (!(wanted[id] > 0)) setLayer(id, 0);
  for (const [id, v] of Object.entries(wanted)) if (RECIPES[id]) setLayer(id, v);
  master.gain.setTargetAtTime(volume, ctx.currentTime, 0.4);
  return true;
}
export function hush() {
  if (!ctx) return;
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  for (const id of [...layers.keys()]) setLayer(id, 0);
  setTimeout(() => !layers.size && ctx.state === "running" && ctx.suspend().catch(() => {}), 2500);
}

/** What is playing and how loud (RMS and peak of the output), for checks. */
export function soundState() {
  if (!meter) return { state: "off", layers: [] };
  const data = new Float32Array(meter.fftSize);
  meter.getFloatTimeDomainData(data);
  let sum = 0,
    peak = 0;
  for (const v of data) {
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  return { state: ctx.state, layers: [...layers.keys()], rms: Math.sqrt(sum / data.length), peak };
}

// ---------- the card ----------
const KEY = "kutup-sound";
const DEFAULTS = { layers: { rain: 0.7 }, master: 0.7, auto: false };
const loadSettings = () => {
  try {
    const saved = JSON.parse(storage.get(KEY) || "null");
    return saved && typeof saved.layers === "object" ? { ...DEFAULTS, ...saved } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

export function SoundMixer({ focusing = false }) {
  const [cfg, setCfg] = useState(loadSettings),
    [playing, setPlaying] = useState(false),
    [open, setOpen] = useState(false);
  const was = useRef(focusing);
  useEffect(() => {
    storage.set(KEY, JSON.stringify(cfg));
  }, [cfg]);
  useEffect(() => {
    if (playing) mix(cfg.layers, cfg.master);
    else hush();
  }, [playing, cfg]);
  // "Odak seansıyla": start with a session, stop when it ends.
  useEffect(() => {
    if (cfg.auto && focusing && !was.current) setPlaying(true);
    if (cfg.auto && !focusing && was.current) setPlaying(false);
    was.current = focusing;
  }, [focusing, cfg.auto]);
  useEffect(() => () => hush(), []);
  const active = SOUNDS.filter((s) => cfg.layers[s.id] > 0);
  const play = () => {
    audio(); // inside the tap, so phones allow the sound
    if (!active.length) setCfg((c) => ({ ...c, layers: { rain: 0.7 } }));
    setPlaying(!playing);
  };
  const toggle = (id) => {
    audio();
    setCfg((c) => {
      const next = { ...c.layers };
      if (next[id] > 0) delete next[id];
      else next[id] = 0.7;
      return { ...c, layers: next };
    });
    if (!playing && !(cfg.layers[id] > 0)) setPlaying(true);
  };
  return (
    <section className={`ambient-card ${open ? "open" : ""} ${playing ? "on" : ""}`}>
      <div className="ambient-head">
        <span className="ambient-emoji" aria-hidden="true">
          {active[0]?.emoji || "🌧️"}
        </span>
        <div>
          <h3>Şehir biraz sussun.</h3>
          <p>{playing && active.length ? active.map((s) => s.name).join(" + ") : "Yağmur, kütüphane, şömine… ya da bir kara delik."}</p>
        </div>
        <button className="icon-button" aria-label="Ses ayarları" aria-expanded={open} onClick={() => setOpen(!open)}>
          <SlidersHorizontal size={19} />
        </button>
        <button aria-label={playing ? "Sesi durdur" : "Sesi başlat"} aria-pressed={playing} className={`icon-button ${playing ? "playing" : ""}`} onClick={play}>
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
      {open && (
        <div className="ambient-mixer">
          <div className="sound-grid">
            {SOUNDS.map((s) => {
              const on = cfg.layers[s.id] > 0;
              return (
                <div key={s.id} className={`sound-tile ${on ? "on" : ""} ${s.id === "blackhole" ? "deep" : ""}`}>
                  <button type="button" aria-pressed={on} onClick={() => toggle(s.id)}>
                    <span aria-hidden="true">{s.emoji}</span>
                    <b>{s.name}</b>
                    <small>{s.hint}</small>
                  </button>
                  {on && (
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.01"
                      value={cfg.layers[s.id]}
                      aria-label={`${s.name} ses düzeyi`}
                      onChange={(e) => setCfg((c) => ({ ...c, layers: { ...c.layers, [s.id]: Number(e.target.value) } }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <label className="sound-master">
            <span>🔊 Genel ses</span>
            <input type="range" min="0" max="1" step="0.01" value={cfg.master} aria-label="Genel ses düzeyi" onChange={(e) => setCfg((c) => ({ ...c, master: Number(e.target.value) }))} />
          </label>
          <label className="sound-auto">
            <input type="checkbox" checked={cfg.auto} onChange={(e) => setCfg((c) => ({ ...c, auto: e.target.checked }))} />
            <span>Odak seansı başlayınca kendiliğinden çalsın, bitince sussun</span>
          </label>
          <p className="sound-note">Sesler cihazında üretilir, internet harcamaz. Başka sekmede ders çalışırken de çalmaya devam eder.</p>
        </div>
      )}
    </section>
  );
}
