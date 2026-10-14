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
// Build mode keeps the screen awake so the phone does not lock itself mid-session.
let wakeSentinel = null;
export async function keepScreenOn() {
  try {
    if (!wakeSentinel || wakeSentinel.released)
      wakeSentinel = await navigator.wakeLock?.request("screen");
  } catch {
    // Not supported or refused (battery saver): the session still works.
  }
}
export function releaseScreen() {
  wakeSentinel?.release().catch(() => {});
  wakeSentinel = null;
}
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
