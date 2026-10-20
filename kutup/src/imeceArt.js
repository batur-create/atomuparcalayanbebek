// Shared Anıtkabir: derived from the reviewed plan/photo model, independent
// of the legacy private landmark. Uniform local unit = 30 m in x/y/z.
// Canvas layers are deferred until after depth sorting (no hidden front pillars).
import { box, circle, poly, seg, outline } from "./iso.js";
import { clamp, mix, mixAll, shade } from "./kit.js";
import { IMECE_TASKS } from "../shared/imece.js";
const AK = {
  tx0:-2.24,tx1:0.08,ty0:-2.10,ty1:0.70,zt:0.21,
  hx0:-2.05,hx1:-0.1383,hy0:-1.3942,hy1:-0.0058,
  cx0:-1.91,cx1:-0.29,cy0:-1.255,cy1:-0.145,
  zs:0.2333,zc:0.7133,ze:0.767,za:0.80,
  sx1:0.64,sy0:-1.50,sy1:0.10,
  qx0:0.64,qx1:4.94,qy0:-2.10,qy1:0.70,yc:-0.7,
  rx0:2.5767,rx1:3.0033,roadEnd:9.4333,
  pole:[2.79,-2.60],poleTop:33.5/30,
};
const squeezed=P=>P;
// Defer every layer until after depth sorting, for Canvas as well as SVG.
const paintAK=list=>list.sort((a,b)=>a.depth-b.depth).map(e=>typeof e.s==='function'?e.s():e.s).join('');
const TRAVERTINE = ["#ead1a5", "#d5b88b", "#b99b70"],
  WHITE_TRAV = ["#efdbb6", "#e1c599", "#c4a477"],
  CONC = ["#c9c7c1", "#b0aea7", "#96948d"],
  MARBLE_W = ["#fbfaf6", "#e6e3db", "#cbc7bd"],
  RED_MARBLE = ["#c0604c", "#a24a39", "#86392b"],
  LION = ["#efe7d6", "#d7cdb7", "#b9ae96"],
  FLOODLIT = ["#fff1cc", "#f4dba4", "#dcc08a"],
  BRONZE = "#7c5a32",
  GOLD = "#d9b24a",
  FLAG_RED = "#e30a17";
// Ten towers: İstiklal and Hürriyet at the head of the road, four on the
// north side of the square (two flanking the road), four on the south.
const T = 0.20;
const TOWER_LIST = [
  [2.27,9.60],[3.31,9.60],
  [0.14,0.90],[2.35,0.90],[3.23,0.90],[5.14,0.90],
  [0.14,-2.30],[2.35,-2.30],[3.23,-2.30],[5.14,-2.30],
];
const TOWERS=[...TOWER_LIST.slice(2),...TOWER_LIST.slice(0,2)];
const LIONS=Array.from({length:24},(_,i)=>[
  i%2?AK.rx1+0.075:AK.rx0-0.075,
  1.36+Math.floor(i/2)*0.67,
  i%2?-1:1,
]);
const PARK=[];
for(let i=0;i<17;i++) for(const x of [2.04,3.54]) PARK.push([x,1.25+i*0.48,0.06+(i%3)*0.007]);
for(let i=0;i<12;i++) for(const y of [-2.98,1.58]) PARK.push([-2.1+i*0.58,y,0.08+(i%3)*0.008]);
for(let i=0;i<8;i++) PARK.push([-2.72,-2.8+i*0.63,0.09]);
const TUMULI = [[0.9, -0.7, 0.42], [1.5, 0.3, 0.32]];
// Screen radius of a ball of world radius r at (x, y, z), so it scales with the projection.
const ballR = (P, x, y, z, r) => Math.abs(P(x, y, z + r)[1] - P(x, y, z)[1]);
const tree = (P, x, y, r) => seg(P(x, y, 0), P(x, y, r * 1.3), "#6b4f2e", 1.2) + circle(...P(x, y, r * 1.9), ballR(P, x, y, r * 1.9, r), "#4f8a3c") + circle(...P(x - r * 0.25, y + r * 0.25, r * 2.15), ballR(P, x, y, r * 2.1, r * 0.5), "#64a04c");
// Seljuk sawtooth ornament under an eave, along a visible face: x = const
// (axis "y") or y = const (axis "x"), points hanging down from z.
function sawtooth(P, axis, at, a, b, z, faces, w = 0.035) {
  let s = "";
  const n = Math.max(1, Math.round((b - a) / w)),
    step = (b - a) / n,
    q = axis === "y" ? (u, zz) => P(at, u, zz) : (u, zz) => P(u, at, zz);
  s += poly([q(a, z), q(b, z), q(b, z - 0.012), q(a, z - 0.012)], faces[2]);
  for (let i = 0; i < n; i++) s += poly([q(a + i * step, z - 0.012), q(a + (i + 1) * step, z - 0.012), q(a + (i + 0.5) * step, z - 0.04)], faces[2]);
  return s;
}
// Text set in gold leaf: rows of short strokes on a face x = const.
function inscription(P, x, y0, y1, z0, z1, rows) {
  let s = "";
  for (let r = 0; r < rows; r++) {
    const z = z1 - ((z1 - z0) * (r + 0.5)) / rows;
    let y = y0;
    for (let w = 0; y > y1 + 0.01; w++) {
      const len = 0.03 + ((r * 7 + w * 13) % 5) * 0.012,
        end = Math.max(y1, y - len);
      s += seg(P(x, y, z), P(x, end, z), GOLD, 0.7);
      y = end - 0.012;
    }
  }
  return s;
}
// The Turkish flag, by the Türk Bayrağı Kanunu: G is its height, 1.5 G its
// length; the crescent's outer circle (Ø G/2) sits G/2 from the hoist, the
// inner one (Ø 2G/5) G/16 further, the star's circle (Ø G/4) G/3 beyond the
// inner circle, with one point towards the hoist; a white sleeve G/30 wide.
const flagShapes = (() => {
  const G = 1,
    M = G / 30,
    cy = G / 2,
    co = (4.25 / 8) * G,
    ro = G / 4,
    d = G / 16,
    ri = G / 5,
    a = (ro * ro - ri * ri + d * d) / (2 * d),
    h = Math.sqrt(ro * ro - a * a),
    to = Math.atan2(h, a),
    ti = Math.atan2(h, a - d),
    crescent = [];
  for (let i = 0; i <= 28; i++) {
    const t = to + ((2 * Math.PI - 2 * to) * i) / 28;
    crescent.push([co + ro * Math.cos(t), cy + ro * Math.sin(t)]);
  }
  for (let i = 0; i <= 24; i++) {
    const t = 2 * Math.PI - ti - ((2 * Math.PI - 2 * ti) * i) / 24;
    crescent.push([co + d + ri * Math.cos(t), cy + ri * Math.sin(t)]);
  }
  const cs = (6.83334 / 8) * G,
    R = G / 8,
    star = Array.from({ length: 10 }, (_, i) => {
      const t = Math.PI + (i * Math.PI) / 5,
        r = i % 2 ? R * 0.381966 : R;
      return [cs + r * Math.cos(t), cy + r * Math.sin(t)];
    });
  return { M, crescent, star };
})();
// The flag flying from a pole at (px, py), top at z, height G; it streams
// towards the screen's right whichever way the building faces, so it never
// reads mirrored. `wave` is the phase of the ripple.
function flagSVG(P, px, py, z, G, wave = 0) {
  const L = 1.5 * G,
    amp = G * 0.10,
    off = (u) => amp * Math.sin((u / L) * 2 * Math.PI * 1.15 - wave) * (u / L),
    q = P.mirror ? (u, v) => P(px - u, py + off(u), z - v) : (u, v) => P(px + off(u), py - u, z - v),
    at = ([u, v]) => q(u * G, v * G);
  const N=24;
  // A continuous red backing avoids hairline gaps between lit cloth strips.
  let s=poly([...Array.from({length:N+1},(_,i)=>q(L*i/N,0)),...Array.from({length:N+1},(_,i)=>q(L*(N-i)/N,G))],FLAG_RED);
  for (let i = 0; i < N; i++) {
    const u0 = (L * i) / N,
      u1 = (L * (i + 1)) / N,
      slope = (off(u1) - off(u0)) / (u1 - u0);
    const fill = i === 0 ? null : slope > 0 ? mix(FLAG_RED, "#ff5a4f", clamp(slope * 2.2)) : mix(FLAG_RED, "#8e0710", clamp(-slope * 2.2));
    if (fill) s += poly([q(u0, 0), q(Math.min(L, u1 + L * 0.004), 0), q(Math.min(L, u1 + L * 0.004), G), q(u0, G)], fill);
  }
  const m = flagShapes.M * G;
  s += poly([q(m, 0), q(L / N, 0), q(L / N, G), q(m, G)], FLAG_RED) + poly([q(0, 0), q(m, 0), q(m, G), q(0, G)], "#f4f1ea");
  s += poly(flagShapes.crescent.map(at), "#ffffff") + poly(flagShapes.star.map(at), "#ffffff");
  return s;
}
// A seated Hittite-style lion on its plinth, looking across the road (dir ±1 along x).
function lionSVG(P,x,y,dir,detail){
  let s=box(P,x-.043,y-.026,x+.043,y+.026,0,.016,TRAVERTINE);
  s+=box(P,x-.032,y-.018,x+.028,y+.018,.016,.035,LION);
  const hx=x+dir*.022;
  s+=box(P,hx-.017,y-.018,hx+.017,y+.018,.026,.068,LION);
  if(detail>0){
    s+=box(P,hx+dir*.011-.012,y-.014,hx+dir*.011+.012,y+.014,.06,.079,LION);
    for(const yy of [y-.013,y+.013])s+=box(P,hx+dir*.017-.015,yy-.004,hx+dir*.017+.015,yy+.004,.016,.028,LION);
    for(const yy of [y-.012,y+.012])s+=box(P,hx-.008,yy-.003,hx+.008,yy+.003,.075,.083,LION);
  }
  return s;
}
// A statue group of three on a plinth (the men's and the women's groups).
function groupSVG(P, x, y, women) {
  let s = box(P, x - 0.09, y - 0.035, x + 0.09, y + 0.035, 0, 0.03, TRAVERTINE);
  for (const [dx, h] of [[-0.05, 0.07], [0, women ? 0.072 : 0.08], [0.05, 0.07]]) {
    s += box(P, x + dx - 0.012, y - 0.012, x + dx + 0.012, y + 0.012, 0.03, 0.03 + h, WHITE_TRAV);
    s += circle(...P(x + dx, y, 0.03 + h + 0.008), ballR(P, x + dx, y, 0.03 + h + 0.008, 0.008), WHITE_TRAV[1]);
  }
  if (women) s += box(P, x - 0.07, y + 0.012, x + 0.07, y + 0.02, 0.04, 0.055, ["#e3cf8f", "#cdb672", "#b39b5a"]);
  return s;
}
// A tower: travertine walls, a relief on its face, the Seljuk sawtooth under
// the eave, a low pyramidal roof like a Turkish tent and a bronze spearhead.
function towerSVG(P, x, y, t, lit, detail, trav) {
  const H = 0.265,
    top = H * t;
  let s = box(P, x - T, y - T, x + T, y + T, 0, top, trav);
  if (t < 1) return s;
  if (detail >= 1) {
    // relief panel on the +x face, door on the +y face
    s += poly([P(x + T + 0.002, y - 0.08, 0.07), P(x + T + 0.002, y + 0.08, 0.07), P(x + T + 0.002, y + 0.08, 0.22), P(x + T + 0.002, y - 0.08, 0.22)], mix(trav[2], "#ffffff", 0.25));
    if (detail >= 2)
      for (const [a, b, c, d] of [[-0.05, 0.15, -0.03, 0.29], [-0.01, 0.15, 0.0, 0.31], [0.03, 0.15, 0.05, 0.28], [-0.06, 0.24, 0.06, 0.24]]) s += seg(P(x + T + 0.003, y + a, b), P(x + T + 0.003, y + c, d), trav[2], 0.8);
    s += poly([P(x - 0.035, y + T + 0.002, 0), P(x + 0.035, y + T + 0.002, 0), P(x + 0.035, y + T + 0.002, 0.1), P(x - 0.035, y + T + 0.002, 0.1)], lit ? mix(BRONZE, "#ffd36e", 0.6) : BRONZE);
  }
  if (detail >= 2) s += sawtooth(P, "y", x + T + 0.001, y - T, y + T, H - 0.005, trav, 0.03) + sawtooth(P, "x", y + T + 0.001, x - T, x + T, H - 0.005, trav, 0.03);
  const e = T + 0.025;
  s += box(P, x - e, y - e, x + e, y + e, H, H + 0.025, trav);
  const apex = P(x, y, H + 0.08),
    rf = ["#cbc5b6", "#b7af9c", "#a3977f"];
  s += poly([P(x - e, y + e, H + 0.025), P(x + e, y + e, H + 0.025), apex], shade(P, [0, 0.62, 0.78], rf)) + poly([P(x + e, y - e, H + 0.025), P(x + e, y + e, H + 0.025), apex], shade(P, [0.62, 0, 0.78], rf));
  s += seg(apex, P(x, y, H + 0.115), BRONZE, 1.2);
  if (detail >= 1) s += poly([P(x, y, H + 0.15), P(x + 0.012, y - 0.012, H + 0.125), P(x, y, H + 0.10), P(x - 0.012, y + 0.012, H + 0.125)], "#a07a3c");
  return s;
}
// A portico: square pillars under a flat roof, open both sides; x0..x1 by y0..y1.
function porticoSVG(P, x0, y0, x1, y1, t, trav, detail) {
  const H = 0.19,
    alongY = y1 - y0 > x1 - x0,
    len = alongY ? y1 - y0 : x1 - x0,
    n = Math.max(2, Math.round(len / 0.12) + 1),
    p = 0.016,
    top = H * t;
  let s = "";
  const pillars = [];
  for (let i = 0; i < n; i++) {
    const u = (alongY ? y0 : x0) + 0.02 + ((len - 0.04) * i) / (n - 1);
    for (const side of [0, 1]) {
      const [px, py] = alongY ? [side ? x1 - 0.02 : x0 + 0.02, u] : [u, side ? y1 - 0.02 : y0 + 0.02];
      pillars.push({ depth: px + py, s: () => box(P, px - p, py - p, px + p, py + p, 0, top, WHITE_TRAV) });
    }
  }
  s += box(P, x0 + 0.03, y0 + 0.03, x1 - 0.03, y1 - 0.03, 0, 0.01, ["#e3d6b8", "#cfc09f", "#b5a684"]) + paintAK(pillars);
  if (t < 1) return s;
  s += box(P, x0, y0, x1, y1, H, H + 0.04, ["#c9c3b3","#b2aa96","#a1967e"]);
  if (detail >= 2) s += sawtooth(P, "y", x1 + 0.001, y0, y1, H + 0.035, trav, 0.03) + sawtooth(P, "x", y1 + 0.001, x0, x1, H + 0.035, trav, 0.03);
  return s;
}
// The kilim of the Ceremonial Square: a border and rows of diamond medallions.
function squareSVG(P,k,detail,motifs=1){
  const {qx0,qx1,qy0,qy1}=AK, NX=22,NY=14;
  const floor=(x0,y0,x1,y1,c)=>poly([P(x0,y0,.003),P(x1,y0,.003),P(x1,y1,.003),P(x0,y1,.003)],c);
  let s=floor(qx0-.025,qy0-.025,qx1+.025,qy1+.025,'#b19370');
  const colors=['#785b46','#a65b42','#c5a26b'];
  const diamond=(cx,cy,rx,ry,color,width)=>{
    let out='';const v=[[0,-1],[.26,-.74],[.26,-.62],[.48,-.62],[.48,-.48],[.65,-.48],[.65,-.26],[.82,-.26],[1,0],[.82,.26],[.65,.26],[.65,.48],[.48,.48],[.48,.62],[.26,.62],[.26,.74],[0,1],[-.26,.74],[-.26,.62],[-.48,.62],[-.48,.48],[-.65,.48],[-.65,.26],[-.82,.26],[-1,0],[-.82,-.26],[-.65,-.26],[-.65,-.48],[-.48,-.48],[-.48,-.62],[-.26,-.62],[-.26,-.74]];
    // One closed path per motif, rather than 32 separate Canvas strokes.
    out+=outline(v.map(([x,y])=>P(cx+x*rx,cy+y*ry,.005)),color,width);
    return out;
  };
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
    if((j*NX+i)/(NX*NY)>=k)continue;
    const dx=(qx1-qx0)/NX,dy=(qy1-qy0)/NY,x0=qx0+i*dx,y0=qy0+j*dy;
    s+=floor(x0+.001,y0+.001,x0+dx-.001,y0+dy-.001,(i+j)%3?'#e5d7b9':'#eddfc3');
    if(detail>0 && (j*NX+i)/(NX*NY)<motifs){
      const cx=x0+dx/2,cy=y0+dy/2,c=colors[(i+j)%3];
      s+=diamond(cx,cy,dx*.46,dy*.46,c,0.58);
      if(detail>1){s+=diamond(cx,cy,dx*.34,dy*.34,c,0.32);s+=diamond(cx,cy,dx*.16,dy*.16,colors[(i+j+1)%3],0.48);}
    }
  }
  return s;
}
// The 40-tonne cenotaph: red marble on a white Afyon marble base.
const lahitSVG = (P, x, y, z) => box(P, x - 0.09, y - 0.045, x + 0.09, y + 0.045, z, z + 0.025, MARBLE_W) + box(P, x - 0.075, y - 0.032, x + 0.075, y + 0.032, z + 0.025, z + 0.075, RED_MARBLE);
// Where the cenotaph is while it is hauled in: across the square, up the
// 42 steps on rollers, through the bronze door to its niche.
function lahitAt(t) {
  const path = [[0.95, AK.yc, 0], [AK.sx1, AK.yc, 0], [AK.tx1, AK.yc, AK.zt], [AK.hx1, AK.yc, AK.zs], [-1.7, AK.yc, AK.zs]];
  const u = clamp(t) * (path.length - 1),
    i = Math.min(path.length - 2, Math.floor(u)),
    f = u - i;
  return path[i].map((v, j) => v + (path[i + 1][j] - v) * f);
}
function hallSVG(P, k, trav, lit, detail) {
  const { tx0, tx1, ty0, ty1, zt, hx0, hx1, hy0, hy1, cx0, cx1, cy0, cy1, zs, zc, ze, za, sx1, sy0, sy1, yc } = AK;
  let s = "";
  // Raft: rebar mesh, then concrete.
  if (k.raftRebar > 0) {
    s += poly([P(tx0, ty0, 0.005), P(tx1, ty0, 0.005), P(tx1, ty1, 0.005), P(tx0, ty1, 0.005)], k.raft > 0 ? (k.raft < 1 ? "#8e9298" : CONC[0]) : "#8a6a48");
    if (k.raft < 1 && detail >= 1)
      for (let x = tx0 + 0.1; x < tx0+(tx1-tx0)*k.raftRebar; x += 0.15) s += seg(P(x, ty0, 0.02), P(x, ty1, 0.02), "#7a4a2a", 0.7);
    if (k.raft < 1 && detail >= 2)
      for (let y = ty0 + 0.1; y < ty0+(ty1-ty0)*k.raftRebar; y += 0.15) s += seg(P(tx0, y, 0.02), P(tx1, y, 0.02), "#7a4a2a", 0.6);
    if(k.raft>0)s+=box(P,tx0,ty0,tx0+(tx1-tx0)*k.raft,ty1,.021,.045,CONC);
  }
  // Terrace: concrete, then travertine; the stairs and the kürsü once it is up.
  const pod = clamp(k.podium);
  if (pod > 0) {
    const clad = mixAll(CONC, trav, k.cladding);
    s += box(P, tx0, ty0, tx1, ty1, 0, zt * pod, clad);
    if (pod >= 1 && detail >= 2)
      for (const z of [0.045, 0.09, 0.135, 0.18]) s += seg(P(tx1 + 0.002, ty0, z), P(tx1 + 0.002, ty1, z), trav[2], 0.6, 0.7) + seg(P(tx0, ty1 + 0.002, z), P(tx1, ty1 + 0.002, z), trav[2], 0.6, 0.7);
  }
  if (pod >= 1 && k.stairs > 0) {
    const N = 42,
      run = sx1 - tx1;
    // the far cheek wall, the steps bottom up, then the near cheek
    const cheek = (y) => poly([P(tx1, y, zt + 0.035), P(sx1, y, 0.035), P(sx1, y, 0), P(tx1, y, 0)], trav[1]) + poly([P(tx1, y - 0.04, zt + 0.035), P(sx1, y - 0.04, 0.035), P(sx1, y, 0.035), P(tx1, y, zt + 0.035)], trav[0]);
    s += cheek(sy0);
    for (let i = 0; i < Math.ceil(N * k.stairs); i++) s += box(P, tx1 - 0.01, sy0, tx1 + (run * (N - i)) / N, sy1, (zt * i) / N, (zt * (i + 1)) / N, WHITE_TRAV);
    // the speaker's platform half way up: "Hakimiyet kayıtsız şartsız milletindir"
    const kz = zt * 0.5;
    s += box(P, tx1 + run * 0.3, yc - 0.13, tx1 + run * 0.62, yc + 0.13, kz - 0.01, kz + 0.07, MARBLE_W);
    if (detail >= 2) s += seg(P(tx1 + run * 0.62 + 0.003, yc + 0.09, kz + 0.035), P(tx1 + run * 0.62 + 0.003, yc - 0.09, kz + 0.035), GOLD, 0.9);
    s += cheek(sy1 + 0.04);
  }
  // Hall of Honour.
  const frame = clamp(k.frame),
    cols = clamp(k.columns),
    roof = clamp(k.roof);
  const lahit = k.lahit > 0 && k.lahit < 1 ? lahitAt(k.lahit) : null;
  if (k.lahit >= 1 || (lahit && lahit[0] < cx1)) s += lahitSVG(P, ...(lahit || [-1.7, yc, zs]));
  if (frame > 0) {
    if (frame >= 1) s += box(P, hx0, hy0, hx1, hy1, zt, zs, WHITE_TRAV);
    const zTop = zs + (zc - zs) * frame,
      zWall = zs + (ze - zs) * (k.hall||0),
      pillar = (x,y,clad) => {
        let s=box(P,x-0.0333,y-0.0333,x+0.0333,y+0.0333,zs,zTop,clad?mixAll(CONC,WHITE_TRAV,k.cladding):CONC);
        if(clad && detail>=2) for(let z=zs+0.055;z<zTop;z+=0.055) {
          s+=seg(P(x-0.0333,y+0.0335,z),P(x+0.0333,y+0.0335,z),'#b99a70',0.32,0.48);
          s+=seg(P(x+0.0335,y-0.0333,z),P(x+0.0335,y+0.0333,z),'#b99a70',0.32,0.48);
        }
        return s;
      };
    const posts = [];
    for (let i = 0; i < 8; i++) {
      const y = hy0 + 0.03 + ((hy1 - hy0 - 0.06) * i) / 7;
      posts.push([hx0 + 0.03, y, "back"], [hx1 - 0.03, y, "front"]);
    }
    for (let i = 1; i < 13; i++) {
      const x = hx0 + 0.03 + ((hx1 - hx0 - 0.06) * i) / 13;
      posts.push([x, hy0 + 0.03, "back"], [x, hy1 - 0.03, "front"]);
    }
    // cladding goes on pillar by pillar, back to front
    const order = posts.map((p, i) => [p[0] + p[1], i]).sort((a, b) => a[0] - b[0]);
    const clad = new Set(order.slice(0, Math.round(cols * posts.length)).map(([, i]) => i));
    const behind = [],
      front = [];
    posts.forEach(([x, y, side], i) => (side === "back" ? behind : front).push({ depth: x + y, s: () => pillar(x, y, clad.has(i)) }));
    s += paintAK(behind.slice(0, Math.ceil(behind.length * cols)));
    // the inner hall's walls; on its front the bronze door and, in gold
    // leaf, the Address to the Youth (left) and the Tenth Year Speech (right)
    if(k.hall>0)s += box(P, cx0, cy0, cx1, cy1, zs, zWall, mixAll(CONC, ["#d3bd98", "#947b53", "#786140"], k.cladding));
    else for(let x=cx0+.08;x<cx1;x+=.32){
      s+=box(P,x-.025,cy0+.08,x+.025,cy0+.13,zs,zTop,CONC);
      s+=box(P,x-.025,cy1-.13,x+.025,cy1-.08,zs,zTop,CONC);
      if(frame>.5)s+=box(P,x-.027,cy0+.08,x+.027,cy1-.08,zTop-.04,zTop,CONC);
    }
    if (k.cladding >= 1 && detail >= 1) {
      s += poly([P(cx1 + 0.002, yc - 0.1, zs), P(cx1 + 0.002, yc + 0.1, zs), P(cx1 + 0.002, yc + 0.1, zs + 0.36), P(cx1 + 0.002, yc - 0.1, zs + 0.36)], GOLD);
      s += poly([P(cx1 + 0.004, yc - 0.085, zs), P(cx1 + 0.004, yc + 0.085, zs), P(cx1 + 0.004, yc + 0.085, zs + 0.345), P(cx1 + 0.004, yc - 0.085, zs + 0.345)], lit ? mix(BRONZE, "#ffd36e", 0.55) : BRONZE);
      if (detail >= 2) {
        s += seg(P(cx1 + 0.005, yc, zs), P(cx1 + 0.005, yc, zs + 0.345), "#5a3f20", 0.8);
        s += inscription(P, cx1 + 0.003, cy1 - 0.07, yc + 0.17, zs + 0.11, zs + 0.39, 7);
        s += inscription(P, cx1 + 0.003, yc - 0.17, cy0 + 0.07, zs + 0.11, zs + 0.39, 7);
      }
    }
    if (lahit && lahit[0] >= cx1) s += lahitSVG(P, ...lahit);
    s += paintAK(front.slice(0, Math.ceil(front.length * cols)));
    if (roof > 0) {
      // the colonnade's entablature, then the raised roof of the inner hall
      const e = 0.02,
        z1 = zc + (ze - zc) * clamp(roof * 2);
      s += box(P, hx0 - e, hy0 - e, hx1 + e, hy1 + e, zc, z1, roof < 1 ? CONC : trav);
      if (roof > 0.5) s += box(P, cx0 + 0.04, cy0 + 0.04, cx1 - 0.04, cy1 - 0.04, ze, ze + (za - ze) * clamp(roof * 2 - 1), roof < 1 ? CONC : ["#c9c3b3","#b2aa96","#a1967e"]);
      if (roof >= 1 && detail >= 2) {
        s += roofFeatures(P,AK);
        s += sawtooth(P, "y", hx1 + e + 0.001, hy0 - e, hy1 + e, ze - 0.012, trav) + sawtooth(P, "x", hy1 + e + 0.001, hx0 - e, hx1 + e, ze - 0.012, trav);
        s += sawtooth(P, "y", cx1 - 0.039, cy0 + 0.04, cy1 - 0.04, za - 0.01, trav, 0.03) + sawtooth(P, "x", cy1 - 0.039, cx0 + 0.04, cx1 - 0.04, za - 0.01, trav, 0.03);
        s += seg(P(hx1 + e + 0.002, hy0 - e, zc + 0.03), P(hx1 + e + 0.002, hy1 + e, zc + 0.03), trav[2], 1) + seg(P(hx0 - e, hy1 + e + 0.002, zc + 0.03), P(hx1 + e, hy1 + e + 0.002, zc + 0.03), trav[2], 1);
      }
    }
  }
  return s;
}
// Preview geometry derived from the user-supplied satellite references.
function roofFeatures(P,A){
  const {cx0,cx1,cy0,cy1,za}=A;
  const x0=cx0+.105,x1=cx1-.105,y0=cy0+.105,y1=cy1-.105,z=za+.002;
  let s=poly([P(x0,y0,z),P(x1,y0,z),P(x1,y1,z),P(x0,y1,z)],'#bdb8a9');
  const rim=.022;
  for(const [a,b,c,d]of [[x0,y0,x1,y0+rim],[x0,y1-rim,x1,y1],[x0,y0,x0+rim,y1],[x1-rim,y0,x1,y1]])
    s+=poly([P(a,b,z+.001),P(c,b,z+.001),P(c,d,z+.001),P(a,d,z+.001)],'#a39e8f');
  // Two faceted light-grey roof features; no material claim from the satellite photo.
  for(const [x,y,r,h]of [[-1.40,-.70,.145,.025],[-.94,-.70,.145,.025]]){
    const a=[x-r,y-r,z+.003],b=[x+r,y-r,z+.003],c=[x+r,y+r,z+.003],d=[x-r,y+r,z+.003],t=[x,y,z+h];
    for(const [u,v,color]of [[a,b,'#bccad0'],[b,c,'#d3dadd'],[c,d,'#dce3e3'],[d,a,'#b2bdc3']])s+=poly([P(...u),P(...v),P(...t)],color);
  }
  return s;
}
function ceremonyBorder(P){
  const {qx0,qx1,qy0,qy1}=AK,x0=qx0+.22,x1=qx1-.22,y0=qy0+.18,y1=qy1-.18,r=.18,w=.032;
  const loop=(pad)=>{
    const pts=[],rr=r-pad;
    for(const [cx,cy,start]of [[x1-r,y0+r,-Math.PI/2],[x1-r,y1-r,0],[x0+r,y1-r,Math.PI/2],[x0+r,y0+r,Math.PI]])
      for(let i=0;i<9;i++){const t=start+i/8*Math.PI/2;pts.push([cx+rr*Math.cos(t),cy+rr*Math.sin(t)]);}
    return pts;
  };
  const a=loop(0),b=loop(w);let s='';
  for(let i=0;i<a.length;i++){const j=(i+1)%a.length;s+=poly([P(...a[i],.007),P(...a[j],.007),P(...b[j],.007),P(...b[i],.007)],'#aca99f');}
  return s;
}
function gallerySVG(P,x0,y0,x1,y1,t,trav,inside){
  const alongX=x1-x0>y1-y0,H=.17*t,arcade=.13,posts=[];
  let s=box(P,x0,y0,x1,y1,0,.012,trav);
  if(alongX){
    const front=inside==='positive'?y1:y0,back0=inside==='positive'?y0:y0+arcade,back1=inside==='positive'?y1-arcade:y1;
    s+=box(P,x0,back0,x1,back1,.012,H,trav);
    const n=Math.max(2,Math.round((x1-x0)/.14));
    for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=front+(inside==='positive'?-.023:.023);posts.push({depth:x+y,s:()=>box(P,x-.022,y-.022,x+.022,y+.022,.012,H,WHITE_TRAV)});}
  }else{
    const front=x0;
    s+=box(P,x0+arcade,y0,x1,y1,.012,H,trav);
    const n=Math.max(2,Math.round((y1-y0)/.14));
    for(let i=0;i<=n;i++){const y=y0+(y1-y0)*i/n,x=front+.023;posts.push({depth:x+y,s:()=>box(P,x-.022,y-.022,x+.022,y+.022,.012,H,WHITE_TRAV)});}
  }
  s+=paintAK(posts);if(t<1)return s;
  s+=box(P,x0-.01,y0-.01,x1+.01,y1+.01,H,H+.018,['#c5bfaf','#b1a792','#a69981']);
  if(alongX){
    const ym=(y0+y1)/2;
    s+=poly([P(x0,y0,H+.018),P(x1,y0,H+.018),P(x1,ym,H+.062),P(x0,ym,H+.062)],'#c7c2b4');
    s+=poly([P(x0,ym,H+.062),P(x1,ym,H+.062),P(x1,y1,H+.018),P(x0,y1,H+.018)],'#b5ad9a');
  }else{
    const xm=(x0+x1)/2;
    s+=poly([P(x0,y0,H+.018),P(xm,y0,H+.062),P(xm,y1,H+.062),P(x0,y1,H+.018)],'#c7c2b4');
    s+=poly([P(xm,y0,H+.062),P(x1,y0,H+.018),P(x1,y1,H+.018),P(xm,y1,H+.062)],'#b5ad9a');
  }
  return s;
}
function monumentSVG(P0,k,lit=false,detail=2,time=0){
  const P=squeezed(P0),trav=lit?mixAll(TRAVERTINE,FLOODLIT,.22):TRAVERTINE;
  let s='';
  s+=poly([P(-2.55,-2.83,-.006),P(5.68,-2.83,-.006),P(5.68,1.46,-.006),P(-2.55,1.46,-.006)],'#b6bf95');
  s+=poly([P(1.87,1.08,-.006),P(3.72,1.08,-.006),P(3.72,10.02,-.006),P(1.87,10.02,-.006)],'#b6bf95');
  if(k.podium===0){
    s+=poly([P(AK.tx0,AK.ty0,.001),P(AK.tx1,AK.ty0,.001),P(AK.tx1,AK.ty1,.001),P(AK.tx0,AK.ty1,.001)],k.level>0?'#9e8058':'#d7c49d');
    for(const [x,y] of [[AK.tx0,AK.ty0],[AK.tx1,AK.ty0],[AK.tx1,AK.ty1],[AK.tx0,AK.ty1]]){
      s+=seg(P(x,y,0),P(x,y,.1),'#d2af55',1.4);
    }
    s+=seg(P(AK.tx0,AK.ty0,.07),P(AK.tx1,AK.ty0,.07),'#f6e6a8',.65);
    s+=seg(P(AK.tx0,AK.ty0,.07),P(AK.tx0,AK.ty1,.07),'#f6e6a8',.65);
    if(k.survey>.4){
      s+=seg(P(AK.tx1,AK.ty0,.07),P(AK.tx1,AK.ty1,.07),'#f6e6a8',.65);
      s+=seg(P(AK.tx0,AK.ty1,.07),P(AK.tx1,AK.ty1,.07),'#f6e6a8',.65);
    }
    if(k.blinding>0)s+=poly([P(AK.tx0,AK.ty0,.003),P(AK.tx0+(AK.tx1-AK.tx0)*k.blinding,AK.ty0,.003),P(AK.tx0+(AK.tx1-AK.tx0)*k.blinding,AK.ty1,.003),P(AK.tx0,AK.ty1,.003)],'#bdb8aa');
  }
  if(k.square>0){s+=squareSVG(P,clamp(k.square),detail,k.mosaics);if(k.square>=1)s+=ceremonyBorder(P);}
  if(k.road>0){
    const end=AK.qy1+(AK.roadEnd-AK.qy1)*k.road;
    s+=poly([P(AK.rx0,AK.qy1,.003),P(AK.rx1,AK.qy1,.003),P(AK.rx1,end,.003),P(AK.rx0,end,.003)],'#e3d7bd');
    if(detail>=1)for(let y=AK.qy1+.06;y<end;y+=.045){
      s+=seg(P(AK.rx0,y,.004),P(AK.rx1,y,.004),'#b9aa8c',.3,.55);
      if(detail>=2)for(const x of [AK.rx0+.11,AK.rx0+.23,AK.rx0+.34])s+=seg(P(x,y,.004),P(x,y+.045,.004),'#c2b397',.24,.5);
    }
  }
  const list=[];
  const add=(depth,draw)=>list.push({depth,s:draw});
  if(k.landscape>0)for(const [x,y,r]of PARK.slice(0,Math.ceil(PARK.length*k.landscape)))add(x+y,()=>tree(P,x,y,r));
  add(AK.tx1+AK.ty1,()=>hallSVG(P,k,trav,lit,detail));
  const built=(k.towers||0)*TOWERS.length;
  TOWERS.forEach(([x,y],i)=>{const t=clamp(built-i);if(t>0)add(x+y,()=>towerSVG(P,x,y,t,lit,detail,trav));});
  const por=clamp(k.galleries);
  if(por>0){
    // Topology follows the supplied plan: two paired openings and a double colonnade at the far end.
    for(const [x0,x1]of [[.14,2.35],[3.23,5.14]]) {
      add((x0+x1)/2+.90,()=>gallerySVG(P,x0,.70,x1,1.10,por,trav,'negative'));
      add((x0+x1)/2-2.30,()=>gallerySVG(P,x0,-2.50,x1,-2.10,por,trav,'positive'));
    }
    add(5.14-.70,()=>porticoSVG(P,4.94,-2.10,5.34,.70,por,trav,detail));
    // The exit stairs face the Road of Lions across the court; the flag is on that axis.
    add(2.79-2.55,()=>{
      let z='';
      for(let i=0;i<28;i++)z+=box(P,2.35,-2.73+.23*i/28,3.23,-2.10, -.085+.085*i/28,-.085+.085*(i+1)/28,WHITE_TRAV);
      return z;
    });
  }

  LIONS.slice(0,Math.floor((k.lions||0)*24+1e-9)).forEach(([x,y,d])=>add(x+y,()=>lionSVG(P,x,y,d,detail)));
  if(k.lions>=1){add(2.27+9.28,()=>groupSVG(P,2.27,9.28,false));add(3.31+9.28,()=>groupSVG(P,3.31,9.28,true));}
  // Relief panels flanking the 42 stairs: low podium walls rather than towers.
  if(k.reliefs>0)for(const y of [-1.65,.15])add(.2+y,()=>{
    let d=box(P,.08,y-.075,.65,y+.075,0,.16,trav);
    if(detail>=1)for(let j=0;j<12;j++){
      const x=.10+j*.044,h=.077+(j%3)*.008,Q=(xx,z)=>P(xx,y+.076,z);
      d+=poly([Q(x-.012,.035),Q(x-.01,h),Q(x-.02,h+.01),Q(x-.006,h+.025),Q(x+.007,h+.025),Q(x+.023,h+.006),Q(x+.01,h),Q(x+.016,.035)],'#b5986e');
      d+=circle(...Q(x,h+.035),ballR(P,x,y,h+.035,.009),'#b5986e');
      d+=seg(Q(x+.001,.038),Q(x+.004,h+.014),'#d7bb91',.42);
    }
    return d;
  });
  if(k.flag>=.5){
    const [px,py]=AK.pole,top=AK.poleTop;
    add(px+py+.05,()=>{
      let f='';
      for(let i=0;i<3;i++)f+=box(P,px-.065+i*.015,py-.065+i*.015,px+.065-i*.015,py+.065-i*.015,i*.012,(i+1)*.012,WHITE_TRAV);
      f+=seg(P(px,py,.036),P(px,py,top),'#a6a9a5',1.35)+seg(P(px-.003,py,.036),P(px-.003,py,top),'#f4eee1',.45);
      f+=circle(...P(px,py,top+.006),ballR(P,px,py,top,.006),GOLD);
      return f+(k.flag>=1 ? flagSVG(P,px,py,top-.02,.20,time*1.3) : '');
    });
  }
  return s+paintAK(list);
}

export function imeceBuildState(minutes) {
  let remaining = Math.max(0,Math.min(2000,minutes));
  const work={};
  for(const task of IMECE_TASKS){work[task.id]=clamp(remaining/task.minutes);remaining-=task.minutes;}
  return {level:work.excavate,raftRebar:work.reinforce,raft:work.raft,podium:work.podium,
    survey:work.survey,blinding:work.blinding,hall:work.hall,
    frame:work.hall ? 1 : work.frame, columns:work.columns,roof:work.roof,stairs:work.stairs,
    towers:work.towers,galleries:work.galleries,square:work.square,mosaics:work.mosaics,
    road:work['lion-road'],lions:work.lions,cladding:work.travertine,reliefs:work.reliefs,
    lahit:work.reliefs>=1?1:0,flag:work.flag,landscape:work.landscape,done:work.handover>=1};
}
export function drawImece(P, minutes, {lit=false,detail=2}={}) {
  const k=imeceBuildState(minutes);
  return monumentSVG(P,k,lit,detail);
}
