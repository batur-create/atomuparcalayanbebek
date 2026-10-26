// n46 G: planning in the browser of whoever acts, so the server only checks
// (Cloudflare's free plan gives a request about 10 ms of CPU; one search
// takes 15–30). Off the page's thread where the browser allows it, on it
// otherwise; the same planner code either way.
import { movePlans, planPlacement } from "../../shared/koy2/planner.js";
import { planDraft, planRerail } from "../../shared/koy2/switch.js";

const inline = (job) => {
  if (job.kind === "place") return { plan: planPlacement(job.layout, job.req) };
  if (job.kind === "move") return { plans: movePlans(job.layout, job.subject) };
  if (job.kind === "rerail") return planRerail(job.source);
  return planDraft(job.source, job.base);
};

/** Runs a planning job ({ kind: draft | place | move | rerail, ... }); rejects after `timeout` ms. */
export function runPlan(job, timeout = 0) {
  if (typeof Worker === "undefined") return Promise.resolve().then(() => inline(job));
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL("./planWorker.js", import.meta.url), { type: "module" });
    } catch {
      resolve(inline(job));
      return;
    }
    const timer = timeout ? setTimeout(() => done(reject, new Error("Planlama uzun sürdü.")), timeout) : 0;
    const done = (fn, value) => {
      clearTimeout(timer);
      worker.terminate();
      fn(value);
    };
    worker.onmessage = ({ data }) => (data.ok ? done(resolve, data) : done(reject, new Error(data.error)));
    // A browser that cannot start a module worker plans on the page instead.
    worker.onerror = (e) => {
      e.preventDefault?.();
      try {
        done(resolve, inline(job));
      } catch (error) {
        done(reject, error);
      }
    };
    worker.postMessage(job);
  });
}

/** What the server needs of a plan (no search diagnostics). */
export const sendable = ({ rejected, tried, score, ...plan }) => plan;

/** The planner's layout from a merged v2 village (src/koy2/village2.js). */
export const plannerLayout = (village) => ({
  ...village.layout,
  generator: village.generatorVersion,
  terrainVersion: village.terrainVersion,
  seq: village.seq,
});

/** A plan for one new plot, as the server takes it ({ layoutRev, plan }), or null (the server plans then). */
export async function placeIn(village, req, timeout = 6000) {
  if (!village?.v2 || !village.seq) return null;
  try {
    const { plan } = await runPlan({ kind: "place", layout: plannerLayout(village), req }, timeout);
    return plan?.ok ? { layoutRev: village.layoutRev, plan: sendable(plan) } : null;
  } catch {
    return null;
  }
}

/**
 * Komuta merkezi's plan for one new plot in a team's live village (a gift, the
 * shared Anıtkabir): null when the team is on today's village or planning
 * fails, and the server then decides as before.
 */
export async function ownerPlaceIn(get, groupId, req, timeout = 8000) {
  if (!groupId) return null;
  try {
    const source = await get(`/owner/village/${encodeURIComponent(groupId)}/source?layout=active`);
    if (!source.layout) return null;
    const { plan } = await runPlan({ kind: "place", layout: source.layout, req }, timeout);
    return plan?.ok ? { layoutRev: source.layoutRev, plan: sendable(plan) } : null;
  } catch {
    return null;
  }
}
