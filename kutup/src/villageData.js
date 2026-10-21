// The village of my group, kept in sync incrementally. Lives apart from the
// map (VillageMap.jsx, loaded on demand) so the app shell can fetch it early.
import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { mergeVillage } from "./villageWorld.js";
import { placeIn } from "./koy2/browserPlan.js";

// This app can draw a planned (v2) village; a team still on today's village gets today's answer.
const V2 = { "X-Kutup-Village-Version": "2" };
const get = (path, signal) => api(path, undefined, "GET", V2, signal);

/** The village of my group, kept in sync incrementally (only changed rows travel). */
export function useVillage(session, villageRev) {
  const [village, setVillage] = useState(null);
  const [error, setError] = useState("");
  const [attempt, retry] = useState(0);
  const known = useRef({ member: null, data: null });
  const refreshRef = useRef(async () => {});
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
        const since = have?.v2 ? `?cursor=${encodeURIComponent(have.cursor)}` : have ? `?rev=${have.rev}&after=${have.until || 0}` : "";
        const raw = await get(`/village${since}`, controller.signal);
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
    refreshRef.current = refresh;
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
  // n46 G: a new plot planned here, on the village as it stands right now (one
  // small catch-up first), for the server to check; null leaves it to the server.
  const planFor = async (req) => {
    if (!known.current.data?.v2) return null;
    await refreshRef.current().catch(() => {});
    return placeIn(known.current.data, req);
  };
  return { village, like, error, retry: () => retry((n) => n + 1), planFor };
}

