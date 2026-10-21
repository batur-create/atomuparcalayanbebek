// n46 G: the owner's browser plans a team's draft (plan §8.2) and the server
// only checks it (server/villageSwitch.js). A new draft plans every building,
// site and shared project in a stable order; bringing a draft (or the layout
// to go back to) up to date keeps everything already placed where it is,
// lets go of what is gone and plans only what is new.
import { layoutFrom } from "./draft.js";
import { emptyLayout, releaseSubject } from "./planner.js";

const keyOf = (s) => `${s.type}:${s.id}`;

/** source: { seed, items } from GET /owner/village/:id/source; base: a stored layout to continue, or null. */
export function planDraft({ seed, items }, base = null) {
  let layout = base || emptyLayout(seed);
  const live = new Set(items.map((i) => keyOf(i.subject)));
  let released = 0;
  for (const p of base ? base.plots : [])
    if (p.subject && !live.has(keyOf(p.subject))) {
      layout = releaseSubject(layout, p.subject);
      released++;
    }
  const have = new Set(layout.plots.filter((p) => p.subject).map((p) => keyOf(p.subject)));
  const todo = items.filter((i) => !have.has(keyOf(i.subject))).map(({ subject, model, owner, created }) => ({ subject, model, owner, created }));
  const { layout: next, missing } = layoutFrom(seed, todo, layout);
  return { layout: next, missing, added: todo.length - missing.length, released };
}
