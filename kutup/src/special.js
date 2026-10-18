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
import { CANTILEVER, SHELL_MARKET, TENSILE } from "./modern.js";
import { CAPSULE_TOWER, TWIST_TOWER, WATER_TOWER } from "./towers.js";
import { ARCH_BRIDGE, SERENDER, BEEHIVE } from "./vernacular.js";

let registry = null;
// Built on first use: the modules import iso.js, which imports this one.
const all = () => (registry ||= { geodesic: DOME, kemer: ARCH_BRIDGE, serender: SERENDER, kerpic: BEEHIVE, kabuk: SHELL_MARKET, gergi: TENSILE, konsol: CANTILEVER, kapsul: CAPSULE_TOWER, burgu: TWIST_TOWER, sukulesi: WATER_TOWER });
export const specialOf = (sp) => (sp?.special ? all()[sp.special] || null : null);
export const specialById = (id) => all()[id] || null;
