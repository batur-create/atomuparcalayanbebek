import React from "react";
import { LoaderCircle } from "lucide-react";

export const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};
export const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const standalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
export const pushSupported =
  "Notification" in window &&
  "PushManager" in window &&
  "serviceWorker" in navigator;
// Build mode keeps the screen awake so the phone does not lock itself mid-session
// (a screen that goes dark on its own looks exactly like leaving the app).
// The Wake Lock API first; it is dropped whenever the page is hidden, and some
// phones refuse it (battery saver), so it is asked for again on every return,
// and a tiny, near-invisible playing video stands in when it is refused:
// most phones do not dim the screen while a video plays.
let wakeSentinel = null,
  wakeVideo = null,
  wakeWanted = false;
export const screenAwake = () => !!(wakeSentinel && !wakeSentinel.released) || !!(wakeVideo && !wakeVideo.paused);
function playKeepAwake() {
  if (!wakeVideo) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 2;
    const stream = canvas.captureStream?.(1);
    if (!stream) return;
    const paint = canvas.getContext("2d");
    wakeVideo = document.createElement("video");
    wakeVideo.muted = true;
    wakeVideo.playsInline = true;
    wakeVideo.setAttribute("playsinline", "");
    wakeVideo.setAttribute("aria-hidden", "true");
    wakeVideo.srcObject = stream;
    Object.assign(wakeVideo.style, { position: "fixed", left: "0", bottom: "0", width: "2px", height: "2px", opacity: "0.01", pointerEvents: "none" });
    document.body.appendChild(wakeVideo);
    let frame = 0;
    wakeVideo.dataset.timer = String(
      setInterval(() => {
        paint.fillStyle = frame++ % 2 ? "#000" : "#010101";
        paint.fillRect(0, 0, 2, 2);
      }, 1000),
    );
  }
  wakeVideo.play().catch(() => {});
}
export async function keepScreenOn() {
  wakeWanted = true;
  try {
    if (!wakeSentinel || wakeSentinel.released) wakeSentinel = (await navigator.wakeLock?.request("screen")) || null;
  } catch {
    wakeSentinel = null; // not supported or refused (battery saver)
  }
  if (!(wakeSentinel && !wakeSentinel.released)) playKeepAwake();
}
export function releaseScreen() {
  wakeWanted = false;
  wakeSentinel?.release().catch(() => {});
  wakeSentinel = null;
  if (wakeVideo) {
    clearInterval(Number(wakeVideo.dataset.timer));
    wakeVideo.pause();
    wakeVideo.srcObject = null;
    wakeVideo.remove();
    wakeVideo = null;
  }
}
document.addEventListener("visibilitychange", () => {
  if (wakeWanted && document.visibilityState === "visible") keepScreenOn();
});
// VAPID public key (base64url) → the byte array PushManager.subscribe wants.
export function pushKey(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(
    atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    (c) => c.charCodeAt(0),
  );
}

// Batur's own profile (badge "dev") carries a tiny black hole in orbit, everywhere.
export function Avatar({ member, size = "", className = "" }) {
  const dev = member?.badge === "dev";
  return (
    <span
      aria-hidden="true"
      className={`avatar ${member?.color || "lilac"} ${size} ${className} ${dev ? "dev" : ""}`}
    >
      {member?.avatar || "🪐"}
      {dev && <i className="dev-orbit" />}
      {member?.crown && <i className="avatar-crown">👑</i>}
    </span>
  );
}
export function Busy({ children, loading, disabled, ...props }) {
  return (
    <button {...props} disabled={loading || disabled} aria-busy={loading || undefined}>
      {loading ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Empty({ emoji, title, children }) {
  return (
    <div className="empty">
      <span>{emoji}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
// A one-shot emoji burst for good news (a request accepted or shipped).
const BURST = ["🎉", "✨", "💜", "⭐", "🎊", "✳"];
export function Burst() {
  return (
    <span className="burst" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 70 + (i % 3) * 22;
        return (
          <i
            key={i}
            style={{
              "--dx": `${Math.cos(angle) * distance}px`,
              "--dy": `${Math.sin(angle) * distance - 20}px`,
              "--delay": `${(i % 4) * 40}ms`,
            }}
          >
            {BURST[i % BURST.length]}
          </i>
        );
      })}
    </span>
  );
}
