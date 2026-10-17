// Başarımlar (n14): notices a badge the moment it is earned. The server works
// badges out from the logs, so the app asks again after the things that can
// earn one (tuğla changes after a session, an arrival, a Pano message) and
// compares with what this phone has already celebrated. The very first look
// celebrates everything earned before badges existed, once, as one summary.
import { useEffect, useRef, useState } from "react";
import { get } from "./api.js";
import { storage } from "./ui.jsx";

const GAP = 20000; // at most one look every 20 seconds
const seenKey = (id) => `kutup-badges-${id}`;

export function useAchievementWatch(me, trigger) {
  const [cheer, setCheer] = useState(null);
  const last = useRef(0),
    timer = useRef(0),
    known = useRef(null); // for phones that keep no storage

  const id = me?.id;
  useEffect(() => {
    known.current = null;
    last.current = 0;
  }, [id]);
  useEffect(() => {
    if (!id) return;
    let gone = false;
    const look = async () => {
      last.current = Date.now();
      try {
        const { list } = await get(`/achievements/${id}`);
        if (gone) return;
        const earned = list.filter((a) => a.at !== null).map((a) => a.key);
        const stored = storage.get(seenKey(id)) ?? known.current;
        const seen = new Set(stored ? stored.split(",") : []);
        const fresh = earned.filter((key) => !seen.has(key));
        known.current = earned.join(",");
        storage.set(seenKey(id), known.current);
        if (fresh.length) setCheer({ keys: fresh, first: stored === null, at: Date.now() });
      } catch {
        // Offline or signed out: the next trigger asks again.
      }
    };
    const wait = last.current ? Math.max(0, GAP - (Date.now() - last.current)) : 2500;
    clearTimeout(timer.current);
    timer.current = setTimeout(look, wait);
    return () => {
      gone = true;
      clearTimeout(timer.current);
    };
  }, [id, trigger]);
  return [cheer, () => setCheer(null)];
}
