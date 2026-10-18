// Quality control on site: the building inspector checks the rebar (or the
// frame) before it is covered up, and every concrete pour starts with a slump
// test and cube samples taken for the lab. Pure functions of progress.
import { box, poly, seg } from "./iso.js";

const clamp = (v) => Math.max(0, Math.min(1, v));
const n1 = (v) => v.toFixed(1);
// Work that is inspected before it disappears, and what the inspector checks.
const INSPECT = {
  footRebar: "temel donatısı",
  colRebar: "kolon donatısı",
  deckRebar: "kiriş ve döşeme donatısı",
  wallLay: "duvar, lento ve hatıl donatısı",
  studs: "karkas ve bağlantılar",
  steelBeam: "bulon sıkma torku",
  anchor: "ankraj plakaları ve bulonlar",
  nodes: "düğüm bulonlarının torku",
};
const POURS = new Set(["footPour", "colPour", "deckPour", "steelDeck"]);

/** The check under way at `shown`, if any: { kind, k, label }. */
export function checkAt(plan, shown) {
  const p = plan.find((q) => shown >= q.a && shown < q.b);
  if (!p) return null;
  const k = (shown - p.a) / (p.b - p.a);
  const floor = p.floor >= 0 ? `${p.floor + 1}. kat ` : "";
  if (INSPECT[p.key] && k > 0.84) {
    const what = p.key === "colRebar" && /perde/.test(p.label) ? "kolon ve perde donatısı" : p.key === "deckRebar" && /hatıl/.test(p.label) ? "hatıl ve döşeme donatısı" : INSPECT[p.key];
    const t = (k - 0.84) / 0.16;
    const next = { wallLay: "hatıllar dökülebilir", studs: "kirişlere geçilebilir", steelBeam: "çaprazlara geçilebilir", anchor: "çubuk montajına geçilebilir", nodes: "paneller takılabilir" }[p.key] || "beton dökülebilir";
    return { kind: "inspect", k: t, label: t < 0.7 ? `Yapı denetim: ${floor}${what}` : `Denetim onayı ✓ ${next}` };
  }
  if (POURS.has(p.key) && k < 0.2) return { kind: "slump", k: k / 0.2, label: "Slump testi ve küp numuneleri" };
  return null;
}

// The lab corner: in front of the site container, clear of the stock and lanes.
export const LAB = [-2.4, -1.95];

/** Slump cone, its plate and rod, the slumped concrete, and the cube moulds. */
export function slumpSVG(P, k) {
  const [x, y] = LAB;
  let s = box(P, x - 0.2, y - 0.2, x + 0.2, y + 0.2, 0, 0.02, ["#9aa4ae", "#7f8994", "#68727c"]);
  const cone = (cx, cy, z0, h, up) => {
    const [bx, by] = P(cx, cy, z0),
      [tx, ty] = P(cx, cy, z0 + h);
    const [rb, rt] = up ? [6, 3.2] : [3.2, 6];
    return `<path d="M${n1(bx - rb)} ${n1(by)} L${n1(tx - rt)} ${n1(ty)} L${n1(tx + rt)} ${n1(ty)} L${n1(bx + rb)} ${n1(by)} Z" fill="#b8c0c8" stroke="#7f8994" stroke-width="0.6"/>`;
  };
  if (k < 0.55) {
    // Filled in three layers, each rodded.
    s += cone(x, y, 0.02, 0.32, true);
    const rod = 0.05 * Math.sin(k * 60);
    s += seg(P(x + rod, y, 0.3), P(x + rod, y, 0.62), "#4a4f55", 1.1);
  } else {
    // Lifted off: the concrete slumps; the rod across the upturned cone
    // measures how far it dropped.
    const sink = 0.1 * clamp((k - 0.55) / 0.15);
    const [mx, my] = P(x, y, 0.02);
    s += `<ellipse cx="${n1(mx)}" cy="${n1(my - 1)}" rx="7.5" ry="3" fill="#7a7e85"/>`;
    s += `<path d="M${n1(mx - 6)} ${n1(my - 1)} Q${n1(mx)} ${n1(P(x, y, 0.32 - sink)[1] - 2)} ${n1(mx + 6)} ${n1(my - 1)} Z" fill="#8e9298"/>`;
    s += cone(x + 0.3, y + 0.05, 0.02, 0.32, false);
    s += seg(P(x + 0.3, y + 0.05, 0.34), P(x - 0.05, y, 0.34), "#4a4f55", 1.1);
    if (k > 0.7) s += seg(P(x, y, 0.33), P(x, y, 0.32 - sink), "#e2533f", 1);
  }
  // Three 15 cm cube moulds, filled one after another.
  for (let i = 0; i < 3; i++) {
    const cx = x + 0.15 + i * 0.16,
      cy = y + 0.35;
    s += box(P, cx, cy, cx + 0.11, cy + 0.11, 0, 0.11, ["#4a4f55", "#3c4146", "#2f3338"]);
    if (k > 0.3 + i * 0.2) s += poly([P(cx + 0.01, cy + 0.01, 0.111), P(cx + 0.1, cy + 0.01, 0.111), P(cx + 0.1, cy + 0.1, 0.111), P(cx + 0.01, cy + 0.1, 0.111)], "#8e9298");
  }
  return s;
}

/** A green approval tick over the inspector's head. */
export function approvedSVG(P, x, y, z) {
  const [cx, cy] = P(x, y, z);
  return `<circle cx="${n1(cx)}" cy="${n1(cy - 34)}" r="5.5" fill="#3f9d5a"/><path d="M${n1(cx - 2.6)} ${n1(cy - 34)} l1.8 2 l3.4 -3.8" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}
