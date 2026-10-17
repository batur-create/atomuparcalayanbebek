// The ways into the week's story (n28) that live in the main bundle: the home
// page card that shows from Sunday 18:00, and the "seen" mark. The story itself
// (Story.jsx) loads on demand.
import React from "react";
import { m } from "motion/react";
import { ArrowRight } from "lucide-react";
import { storage } from "./ui.jsx";
import { storyReady, storyWeek } from "../shared/week.js";

export const STORY_SEEN = "kutup-story-seen";

/** True from Sunday 18:00 until this story is opened or two days pass. */
export function storyFresh(now) {
  const start = storyWeek(now);
  let seen = null;
  try {
    seen = storage.get(STORY_SEEN);
  } catch {}
  return seen !== String(start) && now - storyReady(start) < 54 * 3600000;
}
export function markStorySeen(start) {
  try {
    storage.set(STORY_SEEN, String(start));
  } catch {}
}

export function StoryNudge({ open }) {
  return (
    <m.button whileTap={{ scale: 0.97 }} type="button" className="story-nudge" onClick={open}>
      <span className="story-rings" aria-hidden="true">
        <i>📖</i>
      </span>
      <span>
        <strong>Haftanın hikâyesi hazır</strong>
        <small>Ekibin haftası kart kart: kim öne geçti, köyde neler yükseldi.</small>
      </span>
      <ArrowRight size={16} />
    </m.button>
  );
}
