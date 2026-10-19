// The village of my group, kept in sync incrementally. Lives apart from the
// map (VillageMap.jsx, loaded on demand) so the app shell can fetch it early.
import { useEffect, useRef, useState } from "react";
import { api, get } from "./api.js";
import { mergeVillage } from "./villageWorld.js";

/** The village of my group, kept in sync incrementally (only changed rows travel). */
export function useVillage(session, villageRev) {
  const [village, setVillage] = useState(null);
  const [error, setError] = useState("");
  const [attempt, retry] = useState(0);
  const known = useRef({ member: null, data: null });
  useEffect(() => {
    if (!session) {
      known.current = { member: null, data: null };
      setVillage(null);
      return;
    }
    if (known.current.member !== session.memberId) {
      known.current = { member: session.memberId, data: null };
      setVillage(null);
    }
    let gone = false, timer, inFlight = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (gone || inFlight) return;
      clearTimeout(timer);
      inFlight = true;
      const have = known.current.data;
      try {
        const raw = await get(`/village${have ? `?rev=${have.rev}&after=${have.until || 0}` : ""}`, controller.signal);
        if (gone) return;
        let next = mergeVillage(known.current.data, raw);
        // A building was taken back (n43): fetch the village whole once.
        if (next?.stale) next = mergeVillage(null, await get("/village", controller.signal));
        if (gone) return;
        known.current.data = next;
        setVillage(next);
        setError("");
      } catch (e) {
        if (!gone) {
          setError(e.message);
          timer = setTimeout(refresh, 5000);
        }
      } finally {
        inFlight = false;
      }
    };
    refresh();
    window.addEventListener("online", refresh);
    return () => {
      gone = true;
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("online", refresh);
    };
  }, [session?.memberId, villageRev, attempt]);
  const like = async (building) => {
    const r = await api(`/buildings/${building.id}/like`, {});
    const patch = (v) => v && { ...v, buildings: v.buildings.map((b) => (b.id === building.id ? { ...b, likes: r.likes, mine: r.liked } : b)) };
    known.current.data = patch(known.current.data);
    setVillage(patch);
    retry((n) => n + 1);
    return r;
  };
  return { village, like, error, retry: () => retry((n) => n + 1) };
}

