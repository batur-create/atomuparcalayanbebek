// Buildings with a shape and a way of being built of their own (n37). Each
// lives in its own module and describes itself with one object; the site,
// the crew, the crane, the inspector and the quantities all follow it.
//
// A description holds:
//   spec(base)              spec fields over the kind's base (hw, h, wall, roof…)
//   ridge                   height of the top above topOf(sp)
//   system                  what systemOf() says (and the tests check)
//   ground                  the generic first steps it keeps (default: all eight)
//   steps, later, frameEnd  its own steps by weight up to frameEnd, then fixed spans;
//                           a step may say lift / liftAs (crane load), pour (slump
//                           test, mixer), inspect + next (the inspector), stock
//   site(P, sp, k, shown)   drawn with the site (under the machines)
//   scene(P, sp, plan, shown, lit), shadow(P, sp, t), shadowFrom
//   building(P, sp, seed, { lit, detail, shadowP }), snow(P, sp)
//   workHeight(sp, p, k), crew(sp, p, k, kk, time), chute(sp)
//   metraj(sp, p, k) → { concrete, rebar, steel, timber, wall, stone }, items(q, num):
//                           one item after the concrete, or both items as an array
//   craneEnd, liftUntil     when the crane leaves; when lifting stops
import { DOME } from "./geodesic.js";
import { COLOSSEUM, KEOPS, PISA } from "./landmarks1.js";
import { ANITKABIR, GALATA, SULEYMANIYE } from "./landmarks2.js";
import { BURJ, EIFFEL, SYDNEY } from "./landmarks3.js";
import { CANTILEVER, SHELL_MARKET, TENSILE } from "./modern.js";
import { CAPSULE_TOWER, TWIST_TOWER, WATER_TOWER } from "./towers.js";
import { ARCH_BRIDGE, SERENDER, BEEHIVE } from "./vernacular.js";

let registry = null;
// Built on first use: the modules import iso.js, which imports this one.
const all = () => (registry ||= { geodesic: DOME, kemer: ARCH_BRIDGE, serender: SERENDER, kerpic: BEEHIVE, kabuk: SHELL_MARKET, gergi: TENSILE, konsol: CANTILEVER, kapsul: CAPSULE_TOWER, burgu: TWIST_TOWER, sukulesi: WATER_TOWER, keops: KEOPS, kolezyum: COLOSSEUM, pisa: PISA, suleymaniye: SULEYMANIYE, galata: GALATA, anitkabir: ANITKABIR, eyfel: EIFFEL, sidney: SYDNEY, burj: BURJ });
// n44: an enlarged building (sp.k > 1, see iso.js spec) answers through a
// wrapper: its own methods see the drawing's spec and a projector scaled by
// k, and the heights and positions they return are scaled back up.
const scaled = new WeakMap();
const scaleP = (P, k) => {
  const S = (x, y, z) => P(k * x, k * y, k * z);
  if (P.mirror) S.mirror = true;
  return S;
};
function wrap(own, sp) {
  const k = sp.k,
    L = sp.local,
    up = (list) => list && list.map((w) => [w[0] * k, w[1] * k, w[2] * k, ...w.slice(3)]);
  const w = Object.create(own);
  Object.assign(w, {
    ridge: own.ridge * k,
    building: (P, _sp, seed, o = {}) => own.building(scaleP(P, k), L, seed, { ...o, shadowP: scaleP(o.shadowP || P, k) }),
    scene: (P, _sp, ...rest) => own.scene(scaleP(P, k), L, ...rest),
    shadow: (P, _sp, t) => own.shadow(scaleP(P, k), L, t),
    workHeight: (_sp, p, x) => {
      const z = own.workHeight(L, p, x);
      return z == null ? z : z * k;
    },
    crew: (_sp, ...rest) => up(own.crew(L, ...rest)),
    metraj: (_sp, ...rest) => own.metraj(L, ...rest),
  });
  if (own.site) w.site = (P, _sp, ...rest) => own.site(scaleP(P, k), L, ...rest);
  if (own.snow) w.snow = (P) => own.snow(scaleP(P, k), L);
  if (own.chute) w.chute = () => own.chute(L).map((v) => v * k);
  return w;
}
export function specialOf(sp) {
  const own = sp?.special ? all()[sp.special] || null : null;
  if (!own || !(sp.k > 1) || !sp.local) return own;
  let w = scaled.get(sp);
  if (!w) scaled.set(sp, (w = wrap(own, sp)));
  return w;
}
export const specialById = (id) => all()[id] || null;
