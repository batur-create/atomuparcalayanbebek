// n46 G: the owner's browser plans a team's draft (plan §8.2) and the server
// only checks it (server/villageSwitch.js). A new draft plans every building,
// site and shared project in a stable order; bringing a draft (or the layout
// to go back to) up to date keeps everything already placed where it is,
// lets go of what is gone and plans only what is new.
import { layoutFrom } from "./draft.js";
import { emptyLayout, releaseSubject, seedNeighbourhoods } from "./planner.js";
import { rerailLayout } from "./rerail.js";

const keyOf = (s) => `${s.type}:${s.id}`;

/** source: { seed, items } from GET /owner/village/:id/source; base: a stored layout to continue, or null. */
export function planDraft({ seed, items, members = [] }, base = null) {
  let layout = base || emptyLayout(seed);
  if (!base) layout = seedNeighbourhoods(layout, [...members.map((m) => m.id), ...items.map((i) => i.owner)]);
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

/**
 * n49-2: the team's live layout with its railway re-laid in bends (every house
 * where it stands), brought up to date like any draft. { layout, missing,
 * bends } or { error } when no bend fits.
 */
export function planRerail(source) {
  const r = rerailLayout(source.layout);
  if (r.error) return { error: r.error, layout: null, missing: [] };
  return { ...planDraft(source, r.layout), bends: r.bends };
}
