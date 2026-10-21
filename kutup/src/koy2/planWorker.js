// n46 G: the village planner off the page's thread. The heavy searches run in
// the browser of whoever acts (on Cloudflare's free plan one request may spend
// about 10 ms of CPU; the server only checks what is sent, see checkPlan):
//   draft: a whole village for Komuta merkezi,
//   place: one new plot (a building session, a gift, the shared Anıtkabir),
//   move:  a building's move proposals.
import { movePlans, planPlacement } from "../../shared/koy2/planner.js";
import { planDraft } from "../../shared/koy2/switch.js";

self.onmessage = ({ data }) => {
  try {
    if (data.kind === "place") self.postMessage({ ok: true, plan: planPlacement(data.layout, data.req) });
    else if (data.kind === "move") self.postMessage({ ok: true, plans: movePlans(data.layout, data.subject) });
    else self.postMessage({ ok: true, ...planDraft(data.source, data.base) });
  } catch (e) {
    self.postMessage({ ok: false, error: String(e?.message || e) });
  }
};
