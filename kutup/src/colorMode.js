import { useEffect, useState } from "react";
import { storage, reducedMotion } from "./ui.jsx";
import { darkAt } from "./villageWorld.js";

// Light or dark page: "auto" (follows the sun), "light" or "dark". Only this
// device remembers the choice. public/mode.js applies it before the first paint;
// this keeps it current while the app stays open past sunset or sunrise.
export const MODES = ["auto", "light", "dark"];
const CANVAS = { light: "#f6f5f0", dark: "#181916" };

let wanted;
function apply(dark, fade) {
  const root = document.documentElement;
  wanted = dark ? "dark" : "light";
  if (root.dataset.mode === wanted) return;
  // The crossfade runs the swap a frame later; by then a quick second tap may
  // have changed the choice, so the swap always reads the latest one.
  const swap = () => {
    root.dataset.mode = wanted;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CANVAS[wanted]);
  };
  // A soft crossfade where the browser has one (Safari 18, Chrome).
  if (fade && document.startViewTransition && !reducedMotion() && document.visibilityState === "visible")
    document.startViewTransition(swap);
  else swap();
}

export function useColorMode() {
  const [mode, setMode] = useState(() => {
    const saved = storage.get("kutup-mode");
    return MODES.includes(saved) ? saved : "auto";
  });
  useEffect(() => {
    storage.set("kutup-mode", mode);
    apply(darkAt(mode), true);
    if (mode !== "auto") return;
    const check = () => apply(darkAt(mode), document.visibilityState === "visible");
    const timer = setInterval(check, 60000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [mode]);
  return [mode, setMode];
}
