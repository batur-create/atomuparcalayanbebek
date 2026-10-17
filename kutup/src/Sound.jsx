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
// n24: slow shapes (gusts, waves, voices, a fire's flicker) are drawn once as
// low-rate control buffers and drive gains and filters, so nothing in the mix
// repeats as a plain sine wobble. 8 kHz keeps a minute of shape under 2 MB.
const SHAPE_RATE = 8000;
function shape(key, seconds, paint) {
  if (cache[key] !== undefined) return cache[key];
  let buf = null;
  try {
    const len = Math.floor(SHAPE_RATE * seconds),
      d = new Float32Array(len);
    paint(d, SHAPE_RATE);
    // Close the loop softly so the seam is never heard.
    const fade = Math.min(len >> 3, SHAPE_RATE);
    for (let i = 0; i < fade; i++) d[len - fade + i] = d[len - fade + i] * (1 - i / fade) + d[i] * (i / fade);
    buf = ctx.createBuffer(1, len, SHAPE_RATE);
    buf.copyToChannel(d, 0);
  } catch {}
  return (cache[key] = buf);
}
// The samples of an already drawn shape, so a derived one (leaves from the
// gusts, foam from the waves) lines up with it.
function drawn(name, seconds) {
  const buf = shape(name, seconds, SHAPES[name]);
  if (buf) return buf.getChannelData(0);
  const d = new Float32Array(Math.floor(SHAPE_RATE * seconds));
  SHAPES[name](d, SHAPE_RATE);
  return d;
}
// Random values eased into each other: a smooth, never-repeating-looking curve.
function drift(d, rate, { every, low = 0, high = 1 }) {
  let from = rnd(low, high),
    to = rnd(low, high),
    span = Math.floor(rate * every * rnd(0.6, 1.4)),
    at = 0;
  for (let i = 0; i < d.length; i++, at++) {
    if (at >= span) {
      from = to;
      to = rnd(low, high);
      span = Math.floor(rate * every * rnd(0.6, 1.4));
      at = 0;
    }
    const t = at / span;
    d[i] = from + (to - from) * (t * t * (3 - 2 * t));
  }
  return d;
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
// A water drop: the tiny air bubble it traps rings as a damped sine whose pitch
// rises as the bubble shrinks (Minnaert), after a soft click of the impact.
function bubble(rate, { f, level = 0.1, decay = 0.006, rise = 0.6 }) {
  const n = Math.floor(rate * decay * 7),
    out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    phase += (2 * Math.PI * f * (1 + rise * (t / (decay * 7)))) / rate;
    out[i] = Math.sin(phase) * Math.exp(-t / decay) * level;
  }
  const click = burst(rate, { f: f * 1.8, q: 0.7, decay: 0.0006, level: level * 0.5 });
  for (let i = 0; i < click.length && i < n; i++) out[i] += click[i];
  return out;
}
// A tone gliding from f0 to f1 (exponentially), with a soft envelope and an
// optional vibrato (birdsong).
function glide(rate, { f0, f1, dur, level = 0.2, partials = [1], vib = 0, vibRate = 30 }) {
  const n = Math.floor(rate * dur),
    out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n,
      f = f0 * Math.pow(f1 / f0, t) * (1 + vib * Math.sin((2 * Math.PI * vibRate * i) / rate)),
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
  // Each partial is a sine by recurrence with its own decay: no sin or exp per
  // sample, so a table of cups renders fast even on an old phone.
  for (const [p, a] of partials) {
    const w = (2 * Math.PI * f * p) / rate,
      c = 2 * Math.cos(w),
      fall = Math.exp(-(1 / 0.16 + p * 2) / rate);
    let s1 = 0,
      s2 = -Math.sin(w),
      amp = a * level;
    for (let i = 0; i < n; i++) {
      const s0 = c * s1 - s2;
      s2 = s1;
      s1 = s0;
      out[i] += s0 * amp * (i < 0.002 * rate ? i / (0.002 * rate) : 1);
      amp *= fall;
    }
  }
  return out;
}
// A page turned: paper rustles in many tiny grains, then lands with a soft slap.
function pageTurn(rate, level = 0.1) {
  const dur = rnd(0.35, 0.6),
    out = new Float32Array(Math.floor(rate * (dur + 0.15)));
  const grains = Math.floor(rnd(28, 46));
  for (let g = 0; g < grains; g++) {
    const at = Math.floor(rate * dur * Math.pow(Math.random(), 0.8)),
      piece = burst(rate, { f: rnd(1800, 6500), q: rnd(0.8, 2.5), decay: rnd(0.002, 0.009), level: level * rnd(0.2, 0.7) * Math.sin((Math.PI * at) / (rate * dur)) });
    for (let i = 0; i < piece.length && at + i < out.length; i++) out[at + i] += piece[i];
  }
  const slap = burst(rate, { f: rnd(700, 1100), q: 0.6, attack: 0.004, decay: 0.03, level: level * 0.8 }),
    at = Math.floor(rate * dur);
  for (let i = 0; i < slap.length && at + i < out.length; i++) out[at + i] += slap[i];
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
// A few kinds of bird, each with its own song shape.
const SONGS = [
  // Trill: a run of quick rising notes.
  (put, rate, at, pan, far) => {
    const base = rnd(3800, 5200), n = Math.floor(rnd(7, 14)), gap = rnd(0.06, 0.09);
    for (let j = 0; j < n; j++) put(at + j * gap, glide(rate, { f0: base, f1: base * 1.35, dur: 0.045, level: 0.03 * far }), pan);
  },
  // Two notes, high-low, repeated: "tee-oo, tee-oo".
  (put, rate, at, pan, far) => {
    const hi = rnd(4200, 5200), lo = hi * rnd(0.72, 0.8);
    for (let j = 0; j < Math.floor(rnd(2, 4)); j++) {
      put(at + j * 0.42, glide(rate, { f0: hi, f1: hi * 0.97, dur: 0.13, level: 0.032 * far }), pan);
      put(at + j * 0.42 + 0.17, glide(rate, { f0: lo, f1: lo * 0.95, dur: 0.16, level: 0.028 * far }), pan);
    }
  },
  // A blackbird-like fluted phrase: slow whistles with vibrato and a soft overtone.
  (put, rate, at, pan, far) => {
    let t = at;
    for (let j = 0; j < Math.floor(rnd(3, 6)); j++) {
      const f = rnd(1700, 2800), dur = rnd(0.12, 0.28);
      put(t, glide(rate, { f0: f, f1: f * rnd(0.85, 1.25), dur, level: 0.03 * far, partials: [1, 2], vib: 0.015, vibRate: rnd(18, 32) }), pan);
      t += dur + rnd(0.03, 0.09);
    }
  },
  // Single short chips, scattered.
  (put, rate, at, pan, far) => {
    for (let j = 0; j < Math.floor(rnd(2, 5)); j++) {
      const f = rnd(5000, 6800);
      put(at + j * rnd(0.25, 0.6), glide(rate, { f0: f, f1: f * 0.8, dur: 0.035, level: 0.025 * far }), pan);
    }
  },
];
const EVENTS = {
  // Drops on the window: close ticks on the glass and little ringing bubbles
  // in the puddle, at every size and distance.
  drops: (put, rate) => {
    for (let i = 0; i < 230; i++) {
      const near = Math.random() < 0.3;
      put(rnd(0, 12), bubble(rate, { f: rnd(near ? 1800 : 1200, near ? 4200 : 3000), decay: rnd(0.002, near ? 0.009 : 0.005), level: rnd(0.02, near ? 0.12 : 0.05) }), rnd(-0.95, 0.95));
    }
    for (let i = 0; i < 90; i++) put(rnd(0, 12), burst(rate, { f: rnd(3000, 7000), q: rnd(3, 8), decay: rnd(0.0015, 0.004), level: rnd(0.05, 0.2) }), rnd(-0.9, 0.9));
  },
  // Gutter drips: slower, deeper and steadier, slightly off to one side.
  gutter: (put, rate) => {
    let t = 0;
    while (t < 12) {
      put(t, bubble(rate, { f: rnd(600, 950), decay: 0.012, level: 0.07, rise: 0.3 }), 0.55);
      t += rnd(0.35, 0.9);
    }
  },
  pages: (put, rate) => {
    for (const at of [rnd(2, 6), rnd(10, 15), rnd(21, 26)]) put(at, pageTurn(rate, rnd(0.08, 0.13)), rnd(-0.6, 0.6));
    // A pencil writing a line somewhere nearby.
    for (const at of [rnd(6, 9), rnd(16, 19)]) {
      const strokes = Math.floor(rnd(10, 22)), pan = rnd(-0.5, 0.5);
      for (let j = 0; j < strokes; j++) put(at + j * rnd(0.07, 0.13), burst(rate, { f: rnd(3500, 6000), q: 1.5, attack: 0.01, decay: 0.02, level: 0.018 }), pan);
    }
    // Footsteps far down the hall, and a chair.
    const walk = rnd(0, 20), pan = rnd(-0.7, 0.7);
    for (let j = 0; j < 7; j++) put(walk + j * 0.55, burst(rate, { f: rnd(140, 220), q: 1.5, attack: 0.003, decay: 0.025, level: 0.06 * Math.sin((Math.PI * (j + 1)) / 8) }), pan + j * 0.03);
    put(rnd(26, 29), glide(rate, { f0: 190, f1: 150, dur: 0.5, level: 0.025, partials: [1, 2.01, 3.02] }), rnd(-0.5, 0.5));
  },
  // A fire: crackles come in clusters (a pop and its little echoes), the wood
  // hisses, and now and then a log settles with a soft thud.
  crackle: (put, rate) => {
    for (let c = 0; c < 70; c++) {
      const at = rnd(0, 12), pan = rnd(-0.45, 0.45);
      put(at, burst(rate, { f: rnd(900, 2600), q: 1.1, decay: rnd(0.001, 0.004), level: rnd(0.25, 0.6) }), pan);
      for (let j = 0; j < Math.floor(rnd(1, 7)); j++)
        put(at + rnd(0.005, 0.12), burst(rate, { f: rnd(2400, 6500), q: 0.9, decay: rnd(0.0004, 0.0018), level: rnd(0.05, 0.3) }), pan + rnd(-0.1, 0.1));
    }
    for (let i = 0; i < 160; i++) put(rnd(0, 12), burst(rate, { f: rnd(3000, 7000), q: 0.8, decay: rnd(0.0003, 0.001), level: rnd(0.03, 0.12) }), rnd(-0.4, 0.4));
    for (let i = 0; i < 2; i++) put(rnd(0, 12), burst(rate, { f: rnd(90, 160), q: 1.4, attack: 0.01, decay: 0.08, level: 0.35 }), rnd(-0.2, 0.2));
  },
  birds: (put, rate) => {
    for (let k = 0; k < 9; k++) {
      const far = rnd(0.35, 1);
      SONGS[Math.floor(Math.random() * SONGS.length)](put, rate, rnd(0, 26), rnd(-0.85, 0.85), far);
    }
  },
  cups: (put, rate) => {
    for (const at of [rnd(2, 8), rnd(12, 18), rnd(20, 24)]) {
      const pan = rnd(-0.8, 0.8);
      put(at, ting(rate, { f: rnd(1900, 2600), level: 0.045 }), pan);
      if (Math.random() < 0.5) put(at + rnd(0.15, 0.3), ting(rate, { f: rnd(2400, 3100), level: 0.025 }), pan);
    }
    // A spoon stirring a glass of tea, a few quick taps.
    const stir = rnd(9, 11), pan = rnd(-0.6, 0.6);
    for (let j = 0; j < Math.floor(rnd(4, 8)); j++) put(stir + j * rnd(0.16, 0.22), ting(rate, { f: rnd(3300, 3700), level: 0.018 }), pan);
  },
  merger: (put, rate) => put(rnd(18, 36), mergerChirp(rate), 0),
};
const SHAPES = {
  // Wind: slow gusts with quicker eddies on top.
  gusts: (d, rate) => {
    const slow = drift(new Float32Array(d.length), rate, { every: 7, low: 0.25, high: 1 }),
      fast = drift(new Float32Array(d.length), rate, { every: 0.9, low: 0.75, high: 1 });
    for (let i = 0; i < d.length; i++) d[i] = slow[i] * fast[i];
  },
  // Leaves: rustles that follow the gusts, in short bursts.
  leaves: (d, rate) => {
    d.set(drawn("gusts", d.length / rate));
    const flutter = drift(new Float32Array(d.length), rate, { every: 0.12, low: 0, high: 1 });
    for (let i = 0; i < d.length; i++) d[i] = Math.max(0, d[i] - 0.45) * 1.8 * flutter[i];
  },
  // A fire's breath: uneven flicker instead of a steady wobble.
  flicker: (d, rate) => {
    const slow = drift(new Float32Array(d.length), rate, { every: 2.5, low: 0.55, high: 1 }),
      fast = drift(new Float32Array(d.length), rate, { every: 0.18, low: 0.8, high: 1 });
    for (let i = 0; i < d.length; i++) d[i] = slow[i] * fast[i];
  },
  // Waves of uneven size and period: a slow build, the break, the wash.
  waves: (d, rate) => {
    let t = 0,
      prev = 0.15;
    while (t < d.length) {
      const period = rnd(7, 13) * rate, size = rnd(0.5, 1), build = period * rnd(0.45, 0.6), crash = rate * rnd(0.25, 0.5);
      // Each wave builds from wherever the last one's wash left off.
      for (let i = 0; i < period && t + i < d.length; i++) {
        let v;
        if (i < build) v = prev + (0.5 * size - prev) * (i / build) ** 2;
        else if (i < build + crash) v = size * (0.5 + 0.5 * ((i - build) / crash));
        else v = size * (0.15 + 0.85 * Math.exp(-(i - build - crash) / (rate * 2.2)));
        d[t + i] = v;
      }
      prev = d[Math.min(d.length, t + Math.floor(period)) - 1];
      t += Math.floor(period);
    }
    // Round off the corners: water never switches.
    const k = 1 / (rate * 0.12);
    let y = d[d.length - 1];
    for (let i = 0; i < d.length; i++) d[i] = y += (d[i] - y) * k;
  },
  // The foam: hiss that comes in right after each break and drains away.
  foam: (d, rate) => {
    d.set(drawn("waves", d.length / rate));
    const shift = Math.floor(rate * 0.35), copy = d.slice();
    for (let i = 0; i < d.length; i++) d[i] = Math.max(0, copy[(i - shift + d.length) % d.length] - 0.35) * 1.5;
  },
  // People talking: syllables in phrases, with pauses between turns.
  voices: (d, rate) => {
    let i = 0;
    while (i < d.length) {
      const phrase = Math.floor(rate * rnd(1.2, 3.5));
      for (let p = 0; p < phrase && i < d.length; ) {
        const syl = Math.floor(rate * rnd(0.12, 0.26)), peak = rnd(0.5, 1);
        for (let s = 0; s < syl && i < d.length; s++, p++, i++) d[i] = peak * Math.sin((Math.PI * s) / syl) ** 1.5;
      }
      const pause = Math.floor(rate * rnd(0.3, 1.6));
      for (let s = 0; s < pause && i < d.length; s++, i++) d[i] = 0;
    }
  },
};

const node = {
  loop(buf, at = rnd(0, buf.duration - 0.1)) {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start(0, at % buf.duration);
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
// Drives an AudioParam with a drawn shape (scaled by depth, added to its value);
// falls back to a slow wobble where low-rate buffers are not supported. Params
// given the same `at` move together (one wave lifts the rumble and the foam).
const follow = (param, name, seconds, depth, sources, { fallback = 0.1, at } = {}) => {
  const buf = shape(name, seconds, SHAPES[name]);
  if (!buf) return wobble(param, fallback, depth / 2, sources);
  const s = node.loop(buf, at),
    g = node.gain(depth);
  s.connect(g);
  g.connect(param);
  sources.push(s);
};
// Space: a reverb tail drawn as decaying noise that loses its highs as it fades
// (air absorbs them), so a sound sits in a room, a hall or the open air.
const SPACES = { room: [0.9, 0.25, 7000], hall: [2.4, 0.7, 5000], open: [1.4, 0.35, 3500] };
function space(out, kind, wet) {
  const [seconds, decay, bright] = SPACES[kind];
  const key = `space-${kind}`;
  if (!cache[key]) {
    const rate = ctx.sampleRate,
      len = Math.floor(rate * seconds),
      buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let low = 0;
      for (let i = 0; i < len; i++) {
        const t = i / rate,
          cut = Math.exp((-2 * Math.PI * bright * Math.exp(-t / decay)) / rate);
        low = (1 - cut) * (Math.random() * 2 - 1) + cut * low;
        d[i] = low * Math.exp(-t / decay) * (i < rate * 0.004 ? i / (rate * 0.004) : 1);
      }
    }
    cache[key] = buf;
  }
  const verb = ctx.createConvolver();
  verb.buffer = cache[key];
  const send = node.gain(wet);
  chain(send, verb, out);
  return send;
}

// Each recipe connects its sources into `out` and returns them for stopping.
const RECIPES = {
  rain(out) {
    const s = [node.loop(noise("pink")), node.loop(rendered("drops", 12, EVENTS.drops)), node.loop(noise("brown")), node.loop(rendered("gutter", 12, EVENTS.gutter)), node.loop(noise("pink"))];
    const room = space(out, "room", 0.35);
    // The wide wash of rain on the street, breathing a little.
    const wash = node.gain(0.32);
    chain(s[0], node.filter("highpass", 400), node.filter("lowpass", 5200), wash, out);
    follow(wash.gain, "gusts", 40, 0.14, s);
    // Hiss on the glass, high and close.
    chain(s[4], node.filter("highpass", 5000), node.gain(0.06), out);
    const drops = chain(s[1], node.gain(0.85));
    drops.connect(out);
    drops.connect(room);
    chain(s[3], node.filter("lowpass", 2500), node.gain(0.6), room);
    chain(s[2], node.filter("lowpass", 160), node.gain(0.22), out);
    return s;
  },
  library(out) {
    const s = [node.loop(noise("brown")), node.loop(noise("pink")), node.loop(rendered("pages", 30, EVENTS.pages)), node.osc("sine", 100), node.osc("sine", 200.4)];
    const hall = space(out, "hall", 0.6);
    // Room tone: the big reading room's air and a far ventilation hum.
    chain(s[0], node.filter("lowpass", 280), node.gain(0.4), out);
    chain(s[1], node.filter("bandpass", 700, 0.35), node.gain(0.035), out);
    const hum = node.gain(0.006);
    chain(s[3], hum, out);
    chain(s[4], node.gain(0.5), hum);
    const events = chain(s[2], node.gain(0.9));
    events.connect(out);
    events.connect(hall);
    return s;
  },
  fire(out) {
    const s = [node.loop(noise("brown")), node.loop(rendered("crackle", 12, EVENTS.crackle)), node.loop(noise("pink"))];
    const room = space(out, "room", 0.15);
    // The roar of the flames, flickering unevenly.
    const roar = node.gain(0.12);
    chain(s[0], node.filter("lowpass", 520), roar, out);
    const at = rnd(0, 30);
    follow(roar.gain, "flicker", 30, 0.32, s, { fallback: 0.17, at });
    // Gas hissing out of the wood.
    const hiss = node.gain(0.006);
    chain(s[2], node.filter("highpass", 2800), node.filter("lowpass", 9000), hiss, out);
    follow(hiss.gain, "flicker", 30, 0.025, s, { fallback: 0.23, at });
    const crackle = chain(s[1], node.filter("highpass", 120), node.gain(0.85));
    crackle.connect(out);
    crackle.connect(room);
    return s;
  },
  forest(out) {
    const s = [node.loop(noise("pink")), node.loop(noise("white")), node.loop(rendered("birds", 30, EVENTS.birds))];
    const open = space(out, "open", 0.5);
    // Wind through the trees, in gusts; the band slides up as it blows harder.
    const band = node.filter("bandpass", 380, 0.8),
      wind = node.gain(0.12);
    chain(s[0], band, wind, out);
    const at = rnd(0, 40);
    follow(wind.gain, "gusts", 40, 0.55, s, { fallback: 0.085, at });
    follow(band.frequency, "gusts", 40, 520, s, { fallback: 0.055, at });
    // Leaves rustling high up, only when the gust is strong.
    const leaves = node.gain(0);
    chain(s[1], node.filter("highpass", 2600), node.filter("lowpass", 9000), leaves, out);
    follow(leaves.gain, "leaves", 40, 0.09, s, { at });
    const birds = chain(s[2], node.gain(2));
    birds.connect(out);
    birds.connect(open);
    return s;
  },
  waves(out) {
    const s = [node.loop(noise("brown")), node.loop(noise("pink")), node.loop(noise("white"))];
    const open = space(out, "open", 0.25),
      at = rnd(0, 60);
    // The body of each wave: rumble that opens up as it breaks.
    const low = node.filter("lowpass", 250),
      swell = node.gain(0.05);
    chain(s[0], low, swell, out);
    follow(swell.gain, "waves", 60, 0.55, s, { at });
    follow(low.frequency, "waves", 60, 900, s, { at });
    // The break and the foam draining back over the sand.
    const crash = node.gain(0);
    chain(s[1], node.filter("bandpass", 1100, 0.5), crash, out);
    crash.connect(open);
    follow(crash.gain, "waves", 60, 0.08, s, { at });
    const foam = node.gain(0);
    chain(s[2], node.filter("highpass", 2500), node.filter("lowpass", 9500), foam, out);
    follow(foam.gain, "foam", 60, 0.05, s, { at });
    return s;
  },
  cafe(out) {
    const s = [node.loop(noise("pink")), node.loop(noise("pink")), node.loop(noise("pink")), node.loop(noise("brown")), node.loop(rendered("cups", 26, EVENTS.cups))];
    const room = space(out, "hall", 0.7);
    // Three tables talking, each a different voice (vowel formants) and place.
    // Most of what reaches us is the room, so the words never come through.
    for (const [k, f1, f2, pan, level] of [[0, 520, 1500, -0.4, 0.9], [1, 380, 1100, 0.3, 0.75], [2, 650, 1900, 0.05, 0.55]]) {
      const voice = node.gain(0);
      const formant1 = node.filter("bandpass", f1, 3),
        formant2 = node.filter("bandpass", f2, 4),
        mixVoice = node.gain(level);
      s[k].connect(formant1);
      s[k].connect(formant2);
      formant1.connect(mixVoice);
      chain(formant2, node.gain(0.6), mixVoice);
      chain(mixVoice, voice, node.pan(pan));
      voice.connect(room);
      chain(voice, node.gain(0.35), out);
      follow(voice.gain, "voices", 43, 1, s);
    }
    chain(s[3], node.filter("lowpass", 260), node.gain(0.2), out);
    const cups = chain(s[4], node.gain(1.1));
    cups.connect(out);
    cups.connect(room);
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

// n24: each new recipe brought back to the loudness of the sound it replaced,
// so a saved mix keeps its balance (measured offline, K-weighted).
const TRIM = { rain: 1.26, library: 1.17, fire: 1.32, forest: 1.3, waves: 1.68, cafe: 1.84 };
const layers = new Map(); // id -> { gain, sources }
const FADE = 1.2;
function setLayer(id, volume) {
  const now = ctx.currentTime;
  let layer = layers.get(id);
  if (!layer && volume > 0) {
    const gain = node.gain(0),
      trim = node.gain(TRIM[id] ?? 1);
    chain(trim, gain, master);
    layer = { gain, sources: RECIPES[id](trim) };
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

/** A soft two-note chime for a message or a call (straight to the speakers). */
export function chime() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  for (const [f, d, g] of [[1318.5, 0, 0.12], [1760, 0.13, 0.09]]) {
    const o = c.createOscillator(),
      v = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    v.gain.setValueAtTime(0, t + d);
    v.gain.linearRampToValueAtTime(g, t + d + 0.01);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.9);
    o.connect(v);
    v.connect(c.destination);
    o.start(t + d);
    o.stop(t + d + 1);
  }
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

// ---------- shared state: one mix for the whole app ----------
// The card, the focus screen and the little "playing" pill all show and change
// the same sounds, so they live in one store rather than in each component.
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
const store = { cfg: loadSettings(), playing: false };
const listeners = new Set();
/** Changes the mix (and plays or stops it); call it from a tap where possible. */
export function setSound(patch) {
  const next = typeof patch === "function" ? patch(store) : patch;
  Object.assign(store, next);
  storage.set(KEY, JSON.stringify(store.cfg));
  if (store.playing) mix(store.cfg.layers, store.cfg.master);
  else hush();
  listeners.forEach((f) => f());
}
export function useSound() {
  const [, tick] = useState(0);
  useEffect(() => {
    const f = () => tick((n) => n + 1);
    listeners.add(f);
    return () => listeners.delete(f);
  }, []);
  return store;
}
/** "Odak seansıyla": start with a session, stop when it ends (used once, by the app). */
export function useSoundFollowsFocus(focusing) {
  const was = useRef(focusing);
  useEffect(() => {
    if (store.cfg.auto && focusing && !was.current) setSound({ playing: true });
    if (store.cfg.auto && !focusing && was.current) setSound({ playing: false });
    was.current = focusing;
  }, [focusing]);
}
const activeOf = (cfg) => SOUNDS.filter((s) => cfg.layers[s.id] > 0);
const play = () => {
  audio(); // inside the tap, so phones allow the sound
  setSound((s) => ({ playing: !s.playing, cfg: activeOf(s.cfg).length ? s.cfg : { ...s.cfg, layers: { rain: 0.7 } } }));
};
const toggle = (id) => {
  audio();
  setSound((s) => {
    const layers = { ...s.cfg.layers };
    const on = layers[id] > 0;
    if (on) delete layers[id];
    else layers[id] = 0.7;
    return { cfg: { ...s.cfg, layers }, playing: on ? s.playing : true };
  });
};

/** The sound tiles, master volume and the follow-focus switch. */
export function SoundPanel({ dark = false }) {
  const { cfg } = useSound();
  return (
    <div className={`ambient-mixer ${dark ? "dark" : ""}`}>
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
                  onChange={(e) => setSound((st) => ({ cfg: { ...st.cfg, layers: { ...st.cfg.layers, [s.id]: Number(e.target.value) } } }))}
                />
              )}
            </div>
          );
        })}
      </div>
      <label className="sound-master">
        <span>🔊 Genel ses</span>
        <input type="range" min="0" max="1" step="0.01" value={cfg.master} aria-label="Genel ses düzeyi" onChange={(e) => setSound((st) => ({ cfg: { ...st.cfg, master: Number(e.target.value) } }))} />
      </label>
      <label className="sound-auto">
        <input type="checkbox" checked={cfg.auto} onChange={(e) => setSound((st) => ({ cfg: { ...st.cfg, auto: e.target.checked } }))} />
        <span>Odak seansı başlayınca kendiliğinden çalsın, bitince sussun</span>
      </label>
      <p className="sound-note">Sesler cihazında üretilir, internet harcamaz. Başka sekmede ders çalışırken de çalmaya devam eder.</p>
    </div>
  );
}

/** Play/pause with what is playing, for small places (the focus card, the focus screen). */
export function SoundButton({ label = true }) {
  const { cfg, playing } = useSound();
  const active = activeOf(cfg);
  return (
    <button type="button" className={`sound-pill ${playing ? "on" : ""}`} aria-pressed={playing} onClick={play}>
      {playing ? <Pause size={14} /> : <Play size={14} />}
      {label && <span>{playing ? `${active.map((s) => s.emoji).join(" ")} çalıyor` : "Odak sesi"}</span>}
    </button>
  );
}

export function SoundMixer() {
  const { cfg, playing } = useSound();
  const [open, setOpen] = useState(false);
  const active = activeOf(cfg);
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
      {open && <SoundPanel />}
    </section>
  );
}
