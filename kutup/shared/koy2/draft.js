// n46 köy v2: a whole layout from an inventory, in a stable order (what a
// new draft does, plan §8.2). Existing placements are never revisited: each
// item is planned against everything placed before it.
import { cmp } from "./geom.js";
import { applyPlan, emptyLayout, planPlacement } from "./planner.js";

/** items: [{ subject: {type, id}, model, owner, created }]. Sites count like buildings. */
export function layoutFrom(seed, items, layout = emptyLayout(seed)) {
  const order = [...items].sort((a, b) => a.created - b.created || cmp(`${a.subject.type}:${a.subject.id}`, `${b.subject.type}:${b.subject.id}`));
  const missing = [];
  for (const item of order) {
    const plan = planPlacement(layout, item);
    if (!plan.ok) {
      missing.push({ subject: item.subject, model: item.model, error: plan.error, rejected: plan.rejected });
      continue;
    }
    layout = applyPlan(layout, plan);
  }
  return { layout, missing };
}
