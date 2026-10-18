// n40, dürüst dakika on a computer: the floating window (Chrome and Edge's
// Document Picture-in-Picture, a small window that stays above every other
// app, like YouTube's), the alarm sound, and the system-wide idle check
// ("no mouse or keyboard anywhere for 15 minutes"). Each needs a tap to start,
// so FocusCard calls primeFloat() from the start button itself.
let pip = null;
const listeners = new Set();
const tell = () => listeners.forEach((fn) => fn(pip));

export const floatSupported = () => typeof window !== "undefined" && "documentPictureInPicture" in window;
export const floatWindow = () => (pip && !pip.closed ? pip : null);
export function onFloat(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const CSS = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { font: 15px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif; background: #17161f; color: #f4f1ea; display: grid; }
  .float { display: grid; align-content: center; justify-items: center; gap: 6px; padding: 10px 12px; text-align: center; transition: background .3s; }
  .float .top { font-size: 13px; opacity: .8; }
  .float .clock { font-size: 40px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: .02em; }
  .float .bar { width: 100%; height: 5px; border-radius: 3px; background: rgba(255,255,255,.14); overflow: hidden; }
  .float .bar i { display: block; height: 100%; background: #f5b342; }
  .float p { margin: 0; font-size: 12.5px; opacity: .85; }
  .float button { font: inherit; font-weight: 700; border: 0; border-radius: 999px; padding: 8px 18px; background: #fff; color: #b3261e; cursor: pointer; }
  .float.soft { background: #8a6a12; }
  .float.soft button { color: #6b4f00; }
  .float.alarm { background: #b3261e; animation: shake .5s ease-in-out infinite; }
  .float.alarm .bar i { background: #fff; }
  .float.alarm p { opacity: 1; font-weight: 600; }
  @keyframes shake { 0%, 100% { transform: translateX(0) } 25% { transform: translateX(-3px) } 75% { transform: translateX(3px) } }
  @media (prefers-reduced-motion: reduce) { .float.alarm { animation: none; } }
`;

export async function openFloat() {
  if (!floatSupported()) return null;
  if (floatWindow()) return pip;
  try {
    pip = await window.documentPictureInPicture.requestWindow({ width: 240, height: 170 });
  } catch {
    pip = null;
    return null;
  }
  const style = pip.document.createElement("style");
  style.textContent = CSS;
  pip.document.head.append(style);
  pip.document.title = "Kütüp · odak";
  pip.addEventListener("pagehide", () => {
    pip = null;
    tell();
  });
  tell();
  return pip;
}
export function closeFloat() {
  if (pip && !pip.closed) pip.close();
  pip = null;
  tell();
}

// A short three-tone alarm. The audio context is made on the start tap, so it
// may play later from a background tab.
let audio = null;
export function primeSound() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume?.();
  } catch {
    audio = null;
  }
}
export function alarmSound() {
  if (!audio) return;
  try {
    audio.resume?.();
    const t = audio.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = audio.createOscillator(),
        g = audio.createGain(),
        at = t + i * 0.32;
      o.type = "square";
      o.frequency.value = i % 2 ? 660 : 880;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
      o.connect(g).connect(audio.destination);
      o.start(at);
      o.stop(at + 0.3);
    }
  } catch {}
}

// Chrome's idle detection sees the whole computer, not only this tab.
export const idleSupported = () => typeof window !== "undefined" && "IdleDetector" in window;
export async function askIdle() {
  if (!idleSupported()) return "unsupported";
  try {
    return await window.IdleDetector.requestPermission();
  } catch {
    return "denied";
  }
}

/** Everything a computer's focus session needs, asked for on the start tap. */
export function primeFloat() {
  primeSound();
  askIdle().catch(() => {});
  return openFloat();
}
