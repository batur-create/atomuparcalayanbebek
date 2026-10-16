// How much the page moves, picked per device (Ben → Görünüm):
//   full  "Şölen"       everything: the living sky, card flips, confetti, slides
//   calm  "Sakin"       the ambient loops rest; transitions and answers to taps stay
//   still "Kıpırtısız"  nothing moves on its own; changes happen at once
// Until someone picks, the phone's own "reduce motion" setting decides (live).
// A pick lives on <html data-motion>, where CSS and reducedMotion() read it.
import { useEffect, useState } from "react";
import { storage } from "./ui.jsx";

export const MOTIONS = ["full", "calm", "still"];
const saved = () => (MOTIONS.includes(storage.get("kutup-motion")) ? storage.get("kutup-motion") : null);

export function useMotionPref() {
  const [motion, setMotion] = useState(saved);
  useEffect(() => {
    if (motion) document.documentElement.dataset.motion = motion;
    else delete document.documentElement.dataset.motion;
  }, [motion]);
  const choose = (value) => {
    storage.set("kutup-motion", value);
    setMotion(value);
  };
  // What is in effect right now, for the settings to show.
  const shown = motion || (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "still" : "full");
  return [motion, choose, shown];
}
