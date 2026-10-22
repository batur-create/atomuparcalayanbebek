// Kuğulu Park, Ankara. A photographed place interpreted at the approved
// 28 × 24 m game size, not a surveyed or historical engineering reconstruction.
// One geometry for catalogue SVG, construction, delivery and village Canvas.
import { box, poly, seg, ellipse, WOOD, STONE, LIT } from './iso.js';
import { at, clamp, progress, lathe, castShadow, rectOutline } from './kit.js';

const GRASS = ['#a9bd83', '#90a96f', '#738f59'];
const BARK = ['#c4b9a3', '#9a8f79', '#786f5e'];
const PAVING = ['#dbd6c4', '#c2bba7', '#a69d88'];
const RAIL = ['#b38a59', '#947046', '#745437'];
const WATER = '#70958a', DEEP = '#426b64';
const CREAM = ['#e2d6c0', '#c8bba3', '#a99a81'];
const LEAVES = ['#8ba776', '#708f5e', '#54744c'];
export const PARK_SIZE = { width: 28, depth: 24, areaSource: 7743 };
const ring = (x, y, rx, ry, n = 32) => Array.from({ length: n }, (_, i) => [x + Math.cos(i * Math.PI * 2 / n) * rx, y + Math.sin(i * Math.PI * 2 / n) * ry]);
const LAND = ring(0, 0, 8.75, 7.5, 64);
const controls = [[-5.7,-.4],[-5.4,-1.8],[-4.4,-2.7],[-2.7,-2.8],[-1.3,-2.5],[-.6,-1.65],[.65,-1.6],[1.9,-2.7],[3.7,-3.15],[5.1,-2.6],[5.75,-1.3],[5.1,.3],[5.6,1.5],[4.65,2.6],[3.2,2.8],[1.9,2],[1.15,.95],[0,1.3],[-1.5,2.5],[-3.65,2.5],[-5.1,1.65]];
function smooth(points) {
  return points.flatMap((p, i) => Array.from({ length: 4 }, (_, j) => {
    const t=j/4, a=points[(i+points.length-1)%points.length], b=points[(i+1)%points.length], c=points[(i+2)%points.length];
    return [0,1].map(k => .5*(2*p[k]+(-a[k]+b[k])*t+(2*a[k]-5*p[k]+4*b[k]-c[k])*t*t+(-a[k]+3*p[k]-3*b[k]+c[k])*t*t*t));
  }));
}
export const PARK_POND = smooth(controls);
export const PARK_ISLANDS = [[-2.7,-.35,1.15,.82],[3.25,-1.08,.9,.68]];
export const PARK_LAMPS = [[-5.8,2.9],[-2,4.1],[1.5,4.5],[6,1.3],[5.5,-3.7],[-.6,-4.2]];
const TREES = [[-6,-4.2,5.5,1.2],[-.4,-5.4,5.2,1.25],[3,-5,5.8,1.3],[6.8,-2.8,5.2,1.05],[-7,.7,5.1,1.2],[-5.5,4.3,4.7,1.1],[-2.4,5.8,4.8,1.05],[7,1.8,5.2,1.1],[-2.7,-.35,5,.85],[3.25,-1.08,4.8,.82]];
const BENCHES = [[-5.8,2.9],[-3.8,3.5],[-1,4.3],[2.4,3.5],[6.5,-2.6],[-6,-2.7]];
const ROUTES = [[[-.1,7.5],[-.1,5],[1,3.6],[3.7,3.3],[6.4,1.6],[6.7,-1.8],[4.5,-3.8],[1.2,-3.8],[-1.2,-3.5],[-4.5,-3.5],[-6.7,-2],[-6.7,1.5],[-4.5,3.5],[-1,4.3],[-.1,5]], [[-6.7,1.5],[-8.6,1]], [[1.2,-3.8],[2,-7.25]]];
const surface = (P, pts, z, color, opacity=1) => poly(pts.map(([x,y])=>P(x,y,z)),color,opacity);
function ribbon(P, pts, width, color, amount=1, z=.065) {
  let s='';
  for(let i=1;i<pts.length;i++) {
    const t=clamp(amount*(pts.length-1)-(i-1)); if(!t) break;
    const [x,y]=pts[i-1], end=[x+(pts[i][0]-x)*t,y+(pts[i][1]-y)*t];
    const dx=end[0]-x,dy=end[1]-y,d=Math.hypot(dx,dy)||1,nx=-dy/d*width/2,ny=dx/d*width/2;
    s+=surface(P,[[x+nx,y+ny],[end[0]+nx,end[1]+ny],[end[0]-nx,end[1]-ny],[x-nx,y-ny]],z,color);
  }
  return s;
}
const loop = pts => [...pts,pts[0]];
function fence(P, amount, detail=2, front=null, crop=null) {
  let s=''; const n=detail===0?28:detail===1?52:PARK_POND.length;
  for(let j=0;j<n*amount;j++) {
    const i=Math.floor(j/n*PARK_POND.length),a=PARK_POND[i],b=PARK_POND[(i+Math.ceil(PARK_POND.length/n))%PARK_POND.length];
    if(front!==null && (a[0]+a[1]>0)!==front) continue;
    if(crop){
      const pts=[P(...a,.05),P(...a,.72),P(...b,.05),P(...b,.72)];
      const bounds=[Math.min(...pts.map(p=>p[0]))-2,Math.min(...pts.map(p=>p[1]))-2,Math.max(...pts.map(p=>p[0]))+2,Math.max(...pts.map(p=>p[1]))+2];
      if(!overlap(bounds,crop))continue;
    }
    s+=box(P,a[0]-.025,a[1]-.025,a[0]+.025,a[1]+.025,.13,.69,RAIL);
    s+=seg(P(...a,.64),P(...b,.64),RAIL[1],1.3);
    if(detail>1) s+=seg(P(...a,.28),P(...b,.28),RAIL[2],.8);
  }
  return s;
}
function tree(P,x,y,h,r,detail=2,winter=false) {
  let s=lathe(P,x,y,[[.13,0],[.11,h*.45],[.055,h*.85]],BARK,{n:5});
  for(const sign of [-1,1]) {
    s+=seg(P(x,y,h*.4),P(x+sign*r*.55,y+.1,h*.8),BARK[2],detail?2.6:1.5);
    if(detail>0) s+=seg(P(x+sign*r*.3,y+.05,h*.64),P(x+sign*r*.75,y-.3,h*.9),BARK[1],1.4);
  }
  if(!winter) {
    const clusters=detail===0?[[0,0,1]]:[[0,0,1],[-.55,.1,.66],[.5,.2,.65],[.1,-.4,.7]];
    for(const [dx,dy,k] of clusters)s+=lathe(P,x+dx*r,y+dy*r,[[0,h*.62],[r*k*.85,h*.7],[r*k,h*.82],[r*k*.65,h*.97],[0,h*1.04]],LEAVES,{n:detail>1?8:6});
  }
  return s;
}
function birdHouse(P,x,y,amount,detail) {
  if(!amount)return '';
  const h=.7*clamp(amount*1.4);
  let s=box(P,x-.42,y-.32,x+.42,y+.32,.13,.13+h,WOOD);
  if(detail>0)for(let z=.23;z<.13+h;z+=.14)s+=seg(P(x-.42,y+.325,z),P(x+.42,y+.325,z),WOOD[2],.55);
  if(amount>.7)for(const sign of [-1,1])s+=poly([P(x-.5,y+sign*.41,.83),P(x+.5,y+sign*.41,.83),P(x+.5,y,1.13),P(x-.5,y,1.13)],sign>0?'#9b8b70':'#786b57');
  if(amount>.9)s+=surface(P,rectOutline(x-.16,y+.33,x+.16,y+.335),.14,WOOD[2])+poly([P(x-.16,y+.335,.14),P(x+.16,y+.335,.14),P(x+.16,y+.335,.53),P(x-.16,y+.335,.53)],'#534834');
  return s;
}
function bench(P,x,y,amount=1,detail=2) {
  if(!amount)return '';
  let s='';for(const dx of [-.45,.45])s+=box(P,x+dx-.035,y-.14,x+dx+.035,y+.18,.08,.4,['#6f7768','#596050','#414b3c']);
  for(let i=0;i<(detail>0?3:1);i++)s+=box(P,x-.66,y-.18+i*.13,x+.66,y-.06+i*.13,.4,.46,WOOD);
  if(amount>.4)for(const z of [.6,.78])s+=box(P,x-.66,y+.2,x+.66,y+.26,z,z+.11,WOOD);
  return s;
}
function cafe(P,k,lit,detail) {
  if(!k)return '';
  let s=box(P,-5.5,-5.5,-1.6,-3.8,.04,.18,STONE);
  const h=Math.min(2.3,k*3);
  s+=box(P,-5.2,-5.3,-1.9,-4,.18,.18+h,CREAM);
  if(k>.4)for(const x of [-4.95,-4.1,-3.25,-2.4]){
    s+=poly([P(x,-3.99,.45),P(x+.56,-3.99,.45),P(x+.56,-3.99,1.45),P(x,-3.99,1.45)],lit?LIT:'#759b9b');
    if(detail>0)s+=seg(P(x+.28,-3.98,.45),P(x+.28,-3.98,1.45),'#716b5a',.8);
  }
  if(k>.75){s+=box(P,-5.3,-5.4,-1.8,-3.9,2.48,2.61,STONE);s+=box(P,-4.7,-4.9,-2.2,-4.05,2.61,2.81,CREAM);}
  if(k>.9){
    s+=poly([P(-5.35,-3.95,1.7),P(-1.7,-3.95,1.7),P(-1.7,-3.15,1.4),P(-5.35,-3.15,1.4)],'#8e6f59');
    if(detail>0)for(const x of [-4.8,-3.8,-2.8]){s+=lathe(P,x,-3.3,[[.04,.09],[.04,.51],[.26,.52],[.26,.58]],WOOD,{n:8});}
  }
  return s;
}
function playground(P,k,detail) {
  if(!k)return '';
  let s=surface(P,rectOutline(3.45,3.3,6.2,5.4),.08,'#b5ab97');
  for(const x of [4.1,5.15])for(const y of [3.8,4.75])s+=box(P,x-.045,y-.045,x+.045,y+.045,.09,.09+1.5*k,WOOD);
  if(k>.35)s+=box(P,4.05,3.75,5.2,4.8,.75,.86,WOOD);
  if(k>.6){
    for(const [a,b] of [[[3.95,3.65],[5.3,3.65]],[[3.95,4.9],[5.3,4.9]]])s+=poly([P(...a,1.68),P(...b,1.68),P(4.625,(a[1]+4.275)/2,2.08)],'#8c9176');
    s+=poly([P(5.15,4.7,.87),P(5.55,4.7,.87),P(6.15,5.1,.12),P(5.75,5.1,.12)],'#659caa');
    s+=seg(P(5.15,4.7,.96),P(5.75,5.1,.22),'#8db7bf',1.8)+seg(P(5.55,4.7,.96),P(6.15,5.1,.22),'#8db7bf',1.8);
    for(let i=0;i<5;i++)s+=box(P,3.9,4.8+i*.12,4.25,4.94+i*.12,.1,.71-i*.13,WOOD);
  }
  if(detail>0)for(let i=0;i<11*k;i++){
    const x=3.5+i*.25,c=['#9da875','#d1b36a','#b88883','#7f9eb0'][i%4];
    s+=box(P,x,3.3,x+.06,3.36,.08,.62,[c,c,c]);
  }
  return s;
}
function statue(P,x,y,type,detail) {
  let s=box(P,x-.24,y-.24,x+.24,y+.24,.08,.28,STONE);
  const bronze=['#9a8968','#807356','#625c43'];
  if(type===0){
    s+=box(P,x-.07,y-.04,x+.07,y+.04,.28,.7,bronze)+box(P,x-.14,y-.07,x+.14,y+.07,.7,1.03,bronze);
    s+=lathe(P,x,y,[[.07,1.03],[.1,1.12],[.05,1.23]],bronze,{n:6});
    s+=seg(P(x+.08,y,.93),P(x+.3,y,1.07),bronze[2],1.6);
  }else if(type===1){
    for(const sign of [-1,1])s+=lathe(P,x+sign*.1,y,[[.04,.28],[.1,.68],[.08,.93],[0,1.1]],bronze,{n:6});
  }else{
    s+=seg(P(x-.14,y,.3),P(x-.14,y,1.05),bronze[2],2)+seg(P(x+.13,y,.3),P(x+.13,y,.83),bronze[2],2);
    if(detail)s+=seg(P(x-.14,y,.82),P(x+.13,y,.75),bronze[0],2);
  }
  return s;
}
function lamp(P,x,y,lit) {
  let s=box(P,x-.045,y-.045,x+.045,y+.045,.08,1.92,['#747e68','#58634e','#424c3b']);
  s+=box(P,x-.12,y-.12,x+.12,y+.12,1.9,2.07,['#8d8e71','#73795e','#5b654e']);
  s+=lathe(P,x,y,[[.08,1.92],[.1,2.02],[.08,2.14]],lit?[LIT,'#e6cb89','#c3a267']:['#d2d0b7','#b3b49b','#959a80'],{n:6});
  return s;
}
function lightPools(P,k,detail) {
  let s='';for(const [x,y] of PARK_LAMPS.slice(0,Math.ceil(k*PARK_LAMPS.length))) {
    s+=surface(P,ring(x,y,.85,.85,detail>1?20:12),.083,'#f2d599',.16);
    s+=surface(P,ring(x,y,.42,.42,12),.084,'#ffe7b0',.17);
  }
  return s;
}
function properties(P,k,lit,detail,winter=false) {
  const props=[];
  // Bounds are arithmetic from the projector basis. Sending artificial box
  // corners through P would pollute the drawing-based geometry measurement.
  const o=P(0,0,0),ex=P(1,0,0),ey=P(0,1,0),ez=P(0,0,1);
  const project=(x,y,z)=>[0,1].map(i=>o[i]+(ex[i]-o[i])*x+(ey[i]-o[i])*y+(ez[i]-o[i])*z);
  const add=(x,y,draw,r=1.5,h=2)=>{
    const points=[];for(const dx of [-r,r])for(const dy of [-r,r])for(const z of [0,h])points.push(project(x+dx,y+dy,z));
    props.push({d:x+y,draw,bounds:[Math.min(...points.map(p=>p[0]))-3,Math.min(...points.map(p=>p[1]))-3,Math.max(...points.map(p=>p[0]))+3,Math.max(...points.map(p=>p[1]))+3]});
  };
  // Mature trees predate the work: they are protected, never grown instantly.
  for(const t of TREES)add(t[0],t[1],()=>tree(P,...t,detail,winter),t[3]*1.6,t[2]*1.06);
  add(-3.5,-4.65,()=>cafe(P,k.cafe||0,lit,detail),2.2,2.9);
  add(4.8,4.3,()=>playground(P,k.play||0,detail),2.1,2.2);
  for(const [i,p] of [[-3.2,-.3],[-2.15,-.3],[3.25,-1.08]].entries())add(...p,()=>birdHouse(P,...p,clamp((k.furnish||0)*3-i),detail));
  for(const [i,p] of BENCHES.entries())add(...p,()=>bench(P,...p,clamp((k.furnish||0)*6-i),detail));
  for(const [i,p] of [[1,5.3],[-5.6,-1.6],[4.9,-4.4]].entries())if((k.furnish||0)>(i+.5)/3)add(...p,()=>statue(P,...p,i,detail));
  for(const [i,p] of PARK_LAMPS.entries())if((k.lights||0)>(i+.3)/6)add(...p,()=>lamp(P,...p,lit));
  return props.sort((a,b)=>a.d-b.d);
}
const COMPLETE=Object.fromEntries(['earth','drain','basin','seal','rim','paths','cafe','play','boundary','furnish','lights','landscape','water','handover'].map(x=>[x,1]));

function drawPark(P,k,lit,detail,live=false,winter=false) {
  let s=surface(P,LAND,-.01,winter?'#e3e5d9':GRASS[1]);
  if(detail>0)s+=ribbon(P,loop(LAND),.12,PAVING[2]);
  if(k.earth>0) {
    s+=surface(P,PARK_POND,-.01,'#977c59');
    s+=surface(P,PARK_POND.map(([x,y])=>[x*.97,y*.97]),-.38*clamp(k.earth),'#715c43');
  }
  if(k.drain>0)for(const y of [-2.1,1.5])s+=ribbon(P,[[-4.7,y],[4.5,y]],.09,'#668e99',k.drain,-.3);
  if(k.basin>0)s+=surface(P,PARK_POND.slice(0,Math.max(3,Math.ceil(PARK_POND.length*k.basin))),-.15,'#adae9f');
  if(k.seal>0)s+=surface(P,PARK_POND.slice(0,Math.max(3,Math.ceil(PARK_POND.length*k.seal))),-.135,'#64786c');
  if(k.rim>0)s+=ribbon(P,loop(PARK_POND),.22,PAVING[0],k.rim,.07);
  if(k.paths>0)for(const r of ROUTES) {
    s+=ribbon(P,r,.95,winter?'#eeeede':PAVING[0],k.paths);
    if(detail>0)s+=ribbon(P,r,.05,PAVING[2],k.paths,.068);
    if(detail>1)for(let i=1;i<r.length;i++){
      const a=r[i-1],b=r[i],dist=Math.hypot(b[0]-a[0],b[1]-a[1]);
      for(let t=.3;t<dist*k.paths;t+=.35){const x=a[0]+(b[0]-a[0])*t/dist,y=a[1]+(b[1]-a[1])*t/dist;s+=seg(P(x-.13,y-.13,.07),P(x+.13,y+.13,.07),PAVING[1],.4);}
    }
  }
  if(k.water>0) {
    s+=surface(P,PARK_POND,-.12+.17*k.water,lit?DEEP:WATER);
    if(detail>0)for(let i=0;i<20;i++){const x=-4.9+(i%10)*.98,y=-1.5+Math.floor(i/10)*2.2;if(parkWaterContains(x,y))s+=seg(P(x,y,.055),P(x+.26,y,.055),lit?'#a9b79c':'#b3c9b4',.55,.5);}
  }
  for(const [x,y,rx,ry] of PARK_ISLANDS){
    s+=surface(P,ring(x,y,rx+.08,ry+.08),.06,PAVING[2])+surface(P,ring(x,y,rx,ry),.08,PAVING[0]);
    if(detail>1)for(let i=0;i<16;i++){const a=i*Math.PI/8;s+=seg(P(x+Math.cos(a)*rx*.7,y+Math.sin(a)*ry*.7,.085),P(x+Math.cos(a)*rx,y+Math.sin(a)*ry,.085),PAVING[1],.45);}
  }
  if(k.landscape>0&&detail>0)for(let i=0;i<24*k.landscape;i++) {
    const a=i*2.399,x=Math.cos(a)*6.8,y=Math.sin(a)*5.6;
    if(parkWaterContains(x,y))continue;
    s+=lathe(P,x,y,[[.24,.03],[.25,.17],[0,.34]],GRASS,{n:6});
    if(detail>1)s+=seg(P(x,y,.18),P(x+.1,y,.29),'#d6c78d',1.4);
  }
  if(lit&&k.lights>0)s+=lightPools(P,k.lights,detail);
  if(lit&&k.water>0&&detail>0)for(const [x,y] of [[-4.5,1.1],[4.7,.8]])for(let i=0;i<4;i++)s+=seg(P(x-.2-i*.04,y+i*.09,.058),P(x+.2+i*.04,y+i*.09,.058),'#edce88',1,.18);
  s+=fence(P,k.boundary||0,detail,false);
  const props=properties(P,k,lit,detail,winter);
  const birds=k.handover>0 ? (live?[]:parkWaterState(0).birds) : [];
  const objects=[...props,...birds.map(b=>({d:b.x+b.y,draw:()=>drawBird(P,b,detail)}))].sort((a,b)=>a.d-b.d);
  for(const obj of objects)s+=obj.draw();
  if(!live&&k.water>=1)s+=drawJets(P,0,detail,lit);
  s+=fence(P,k.boundary||0,detail,true);
  return s;
}

export function parkWaterContains(x,y) {
  let inside=false;
  for(let i=0,j=PARK_POND.length-1;i<PARK_POND.length;j=i++){
    const a=PARK_POND[i],b=PARK_POND[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside&&!PARK_ISLANDS.some(([cx,cy,rx,ry])=>((x-cx)/(rx+.15))**2+((y-cy)/(ry+.15))**2<1);
}
/** Pure visual clock; never updates focus, rewards, DB or construction progress. */
export function parkWaterState(time=0,seed=0) {
  const birds=[];
  for(let i=0;i<4;i++){
    const left=i<2,a=time*(left?.035:.045)+(i%2)*Math.PI+seed*.13;
    const x=(left?-3:3.35)+Math.cos(a)*(left?1.75:1.05),y=(left?-.1:1.05)+Math.sin(a)*(left?1.45:.65);
    birds.push({x,y,angle:Math.atan2(Math.cos(a)*(left?1.45:.65),-Math.sin(a)*(left?1.75:1.05)),dark:i===1||i===2,duck:false});
  }
  for(let i=0;i<2;i++){const a=time*.05+i*2+seed*.07;birds.push({x:-.12+Math.cos(a)*.35,y:-.25+Math.sin(a)*.3,angle:a+Math.PI/2,dark:true,duck:true});}
  return {birds,jets:[[-4,-1.2],[4.1,.85]]};
}
function drawBird(P,b,detail) {
  const c=b.dark?'#42443e':'#faf5df',size=b.duck?.55:1;
  const dir=[Math.cos(b.angle),Math.sin(b.angle)],base=P(b.x,b.y,.12);
  const unit=Math.hypot(P(1,0,0)[0]-P(0,0,0)[0],P(1,0,0)[1]-P(0,0,0)[1]);
  let s=ellipse(base[0],base[1]+unit*.09,unit*.37*size,unit*.13*size,'#b0c5b1',.28);
  s+=surface(P,ring(b.x,b.y,.29*size,.17*size,12),.13,c);
  const neck=[b.x+dir[0]*.19*size,b.y+dir[1]*.19*size],head=[b.x+dir[0]*.26*size,b.y+dir[1]*.26*size];
  s+=seg(P(...neck,.14),P(...head,(b.duck?.28:.57)*size),c,Math.max(.65,unit*.06*size));
  const q=P(...head,(b.duck?.29:.58)*size);s+=ellipse(q[0],q[1],unit*.075*size,unit*.067*size,c);
  s+=seg(P(...head,.56*size),P(head[0]+dir[0]*.14*size,head[1]+dir[1]*.14*size,.54*size),b.dark?'#c77862':'#d0a267',Math.max(.6,unit*.03*size));
  if(detail>1){const wing=P(b.x-dir[0]*.03,b.y-dir[1]*.03,.18);s+=seg([wing[0]-unit*.1,wing[1]], [wing[0]+unit*.08,wing[1]-unit*.04],b.dark?'#666b5c':'#d9d9be',.7);}
  return s;
}
function drawJets(P,time,detail,lit) {
  if(detail===0)return '';
  let s='';
  for(const [i,[x,y]] of parkWaterState().jets.entries()){
    for(let j=-2;j<=2;j++){
      const phase=time*2+i+j*.3,h=1.05+Math.sin(phase)*.08;
      s+=seg(P(x+j*.04,y,.07),P(x+j*.025,y,h-Math.abs(j)*.13),lit?'#e8dba9':'#d9e8d9',j? .7:1.5,.75);
      if(detail>1)s+=seg(P(x+j*.025,y,h-Math.abs(j)*.13),P(x+j*.11,y+.07,.16),'#b5d1bf',.55,.55);
    }
  }
  return s;
}
/** Only this park's small water sprites move. Static park geometry stays cached.
 * Foreground objects are masked to each sprite's small screen box, on both
 * SVG and Canvas, so a swimming bird cannot paint over an island tree/house.
 */
const clipIds=new WeakMap();let clipSerial=0;
export function drawParkMotion(P,{time=0,seed=0,detail=2,lit=false,ctx=null,uid='park',water=true,birds=true}={}) {
  if(detail===0)return '';
  if(!ctx){if(!clipIds.has(P))clipIds.set(P,`${uid}-${++clipSerial}`);uid=clipIds.get(P);}
  const state=parkWaterState(time,seed),props=properties(P,COMPLETE,lit,detail);
  const sprites=birds?state.birds.map(b=>({x:b.x,y:b.y,h:.8,r:.6,draw:()=>drawBird(P,b,detail)})):[];
  if(water)for(const [x,y] of state.jets)sprites.push({x,y,h:1.3,r:.45,draw:()=>drawJetsAt(P,time,detail,lit,x,y)});
  let out='';
  for(const [i,b] of sprites.entries()){
    const q=P(b.x,b.y,.06),unit=Math.hypot(P(1,0,0)[0]-P(0,0,0)[0],P(1,0,0)[1]-P(0,0,0)[1]);
    const x=q[0]-unit*b.r,y=q[1]-unit*b.h,w=unit*b.r*2,h=unit*(b.h+.35);
    if(ctx){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();}
    let s=b.draw();
    // Most trees are behind the water. Redraw just nearer island objects
    // within the sprite clip, not the whole park, paving or background.
    const crop=[x,y,x+w,y+h];
    for(const p of props)if(p.d>b.x+b.y&&overlap(p.bounds,crop))s+=p.draw();
    s+=fence(P,1,detail,true,crop);
    if(ctx)ctx.restore();
    else out+=`<clipPath id="${uid}-${i}"><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}"/></clipPath><g clip-path="url(#${uid}-${i})">${s}</g>`;
  }
  return out;
}
const overlap=(a,b)=>a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3];
function drawJetsAt(P,time,detail,lit,x,y){
  // Translate the single jet origin to one of the two photographed water lobes.
  let s='';for(let j=-2;j<=2;j++){
    const h=1.05+Math.sin(time*2+x+j*.3)*.08;
    s+=seg(P(x+j*.035,y,.07),P(x+j*.02,y,h-Math.abs(j)*.14),lit?'#e8dba9':'#d9e8d9',j?.7:1.5,.75);
    if(detail>1)s+=seg(P(x+j*.02,y,h-Math.abs(j)*.14),P(x+j*.13,y+.06,.17),'#b5d1bf',.55,.55);
  }return s;
}

const INFO={
  mobilize:'Çalışma alanı ayrılır; olgun ağaçların kök bölgeleri korunur. Parkın tamamı kazılmaz, kuşlar şantiye alanına alınmaz.',
  layout:'Havuz kıvrımı, adalar, yollar ve girişler zeminde işaretlenir. Bu minyatür gerçek parkın yerleşim ilişkilerini küçülterek yorumlar.',
  earth:'Yalnız havuz ve tesisat güzergâhları kontrollü kazılır. Korunan ağaçların çevresinde çalışma payı bırakılır.',
  drain:'Boşaltma, su devri ve fıskiye hatları hazırlanır. Boruların eğimi ve bakım erişimi kapatılmadan kontrol edilir.',
  basin:'Havuz tabanı ve kenarlarının taşıyıcı kabuğu hazırlanır. Bu, bütün parkın altına dökülen bir bina temeli değildir.',
  seal:'Su tutan yüzeylere yalıtım uygulanır; ek ve boru geçişleri ayrıca kontrol edilir. Su denemesi öncesi koruyucu katman tamamlanır.',
  rim:'Kavisli taş kıyı ve adaların kenarları bölüm bölüm tamamlanır. Suya bakan yüzlerde keskin ve takılmaya neden olacak kenar bırakılmaz.',
  paths:'Taş yürüyüş yolları ve giriş bağlantıları döşenir. Yol suya girmez; yüzey suyu havuzun içine kir taşımayacak biçimde uzaklaştırılır.',
  cafe:'Kafeteryanın küçük kütlesi, açıklıkları, örtüsü ve terası tamamlanır. Cephe, fotoğraflardan okunabilen ölçüde sadeleştirilmiştir.',
  play:'Oyun platformu, kaydırak ve renkli sınır elemanları kurulur. Bağlantılar, düşme alanı ve yoldan erişim kontrol edilir.',
  boundary:'Ahşap havuz çiti kıyının kıvrımını izler. Direkler ve yatay bağlar sırayla yerlerine takılır.',
  furnish:'Kuğu evleri adalara, banklar yolların kenarına ve heykeller küçük kaidelerine yerleştirilir. Geçişler açık bırakılır.',
  lights:'Park lambaları ve kafeteryanın ışıkları bağlanır. Suya yakın elektrik donanımının korunması ve gece geçişlerinin aydınlığı kontrol edilir.',
  landscape:'Korunan ağaçların çevresine çalılar ve yer örtücüler eklenir. Yetişkin ağaçlar bir anda büyütülmez; parkın mevcut dokusu korunur.',
  water:'Sızdırmazlık, su devri ve fıskiyeler denenir; havuz yavaşça doldurulur. Kuğular ancak su ve çevre güvenli olduğunda görünür.',
  handover:'Yollar, ahşap çitler, gece ışıkları ve su sistemi son kez denetlenir. Geçici şantiye elemanları kaldırılır, Kuğulu Park teslim edilir.',
};
const first=[['mobilize','Ağaç koruma ve şantiye kurulumu',.7,2],['layout','Havuz ve yolların aplikasyonu',.7,1],['earth','Kontrollü havuz kazısı',1.5,5],['drain','Drenaj ve su devri hatları',1.1,5],['basin','Havuz tabanı ve kıyı kabuğu',1.4,8],['seal','Sızdırmazlık ve koruyucu katman',1,7],['rim','Taş kıyı ve adacıklar',1.3,7],['paths','Taş yollar ve açık girişler',1.4,8],['cafe','Kafeterya ve gölgeli teras',1.3,9],['play','Oyun alanı ve kaydırak',1,5]];
export const KUGULU_PARK={
  system:'landscape',ridge:3.2,ground:[],garden:false,shadowFrom:'earth',frameEnd:.65,
  spec:()=>({hw:8.75,h:2.5,floors:1,wall:{faces:STONE,pattern:'landscape'},roof:CREAM,lit:true}),
  steps:first.map(([key,label,w,cost])=>({key,label,w,cost})),
  later:[['boundary','Kıvrımlı ahşap havuz çiti',.65,.73,5],['furnish','Kuğu evleri, banklar ve heykeller',.73,.79,7],['lights','Park lambaları ve gece aydınlatması',.79,.84,6],['landscape','Korunan ağaçlar ve peyzaj',.84,.90,5],['water','Su dolumu ve fıskiye denemesi',.90,.97,4],['handover','Son kontrol ve kuğularla teslim',.97,1,3]].map(([key,label,a,b,cost])=>({key,label,a,b,cost})),
  info:INFO,
  siteBase:(P,sp,plan,shown)=>{
    const k=progress(plan,shown);let rest='',front='';
    // Temporary works follow the landscape boundary, not a square house pit.
    if(k.handover<1)for(let i=0;i<32*(k.mobilize||0);i++){
      const a=LAND[(i*2)%64],b=LAND[(i*2+2)%64];
      const s=seg(P(...a,.05),P(...a,.82),'#7b8677',1.3)+seg(P(...a,.8),P(...b,.8),'#a6b09d',1);
      if(a[0]+a[1]>0)front+=s;else rest+=s;
    }
    if(k.mobilize>.4&&k.handover<1)rest+=box(P,-7.3,-2.9,-6.3,-2.1,.03,.65,CREAM);
    if(k.layout>0&&k.paths<1)rest+=ribbon(P,[[-.1,7.1],[-.1,5.2]],.045,'#d4b36f',k.layout);
    return {yard:'',rest,front};
  },
  shadow:(P,sp,t)=>castShadow(P,LAND,1.5*t),
  scene:(P,sp,plan,shown,lit)=>drawPark(P,progress(plan,shown),lit,2,true),
  // A separate small layer in ConstructionScene; the expensive park is static.
  motion:(P,sp,plan,shown,lit,time)=>{
    const k=progress(plan,shown);
    if(k.earth>0&&k.earth<1)return excavator(P,time);
    return k.water>=1?drawParkMotion(P,{time,lit,water:true,birds:k.handover>0,uid:'park-scene'}):'';
  },
  building:(P,sp,seed,{lit=false,detail=2,shadowP=P,live=false,winter=false}={})=>castShadow(shadowP,LAND,1.5)+drawPark(P,COMPLETE,lit,detail,true,winter)+(live?'':drawParkMotion(P,{lit,detail,uid:'park-portrait'})),
  workHeight:()=>0,
  crew:(sp,p,k)=>{
    const by={earth:[[-5.8,-.5,-.2,'shovel'],[-3.8,-2.9,0,'shovel']],drain:[[-3.8,-2.1,-.2,'hammer'],[2.1,1.5,-.2,'carry']],basin:[[-4.4,-1.8,-.1,'trowel'],[4,-1.9,-.1,'trowel']],seal:[[-4.2,-1,-.1,'roller'],[3.8,1.4,-.1,'roller']],rim:[[-5.3,.6,0,'trowel'],[4.8,2,0,'carry']],paths:[[0,5.2,0,'trowel'],[-6.5,2,0,'carry']],cafe:[[-3.6,-3.6,0,'hammer'],[-2,-4.6,0,'carry']],play:[[4,5.2,0,'hammer'],[6.3,3.6,0,'carry']],boundary:[[-5.4,1,0,'hammer'],[4.7,2.9,0,'hammer']],furnish:[[-2.6,-.35,.08,'hammer'],[2.5,4,0,'carry']],lights:[[1.5,4.6,0,'hammer'],[6.2,1.4,0,'carry']],landscape:[[-4.8,4.3,0,'shovel'],[5,-4.2,0,'shovel']],water:[[6,.1,0,'survey'],[-5,3,0,'none']],handover:[[.2,6,0,'none']]};
    return by[p.key]||[at(-2,5,0,'survey')];
  },
  metraj:(sp,p,k)=>({paving:({rim:45,paths:135}[p.key]||0)*k,timber:({boundary:1.2,furnish:.8,cafe:.5,play:.7}[p.key]||0)*k}),
  items:(q,num)=>[`Tahminî taş ${num(q.paving||0)} m²`,`Ahşap ${num(q.timber||0)} m³`],
};

function excavator(P,time){
  const Q=(x,y,z)=>P(x-5.4,y-2.65,z),yellow=['#d9b65f','#bd9746','#9a7837'];
  let s='';for(const y of [-.32,.25])s+=box(Q,-.48,y,.48,y+.16,.04,.23,['#666c5f','#4e5649','#384132']);
  s+=box(Q,-.36,-.28,.35,.38,.23,.46,yellow)+box(Q,-.36,-.25,.03,.25,.46,.96,yellow);
  s+=poly([Q(.035,-.22,.55),Q(.035,.2,.55),Q(.035,.2,.88),Q(.035,-.22,.88)],'#78959a');
  const bend=.68+Math.sin(time*1.1)*.16;
  s+=seg(Q(.18,0,.47),Q(.8,.3,1.1),yellow[2],5)+seg(Q(.8,.3,1.1),Q(1.25,.7,bend),yellow[0],4);
  s+=poly([Q(1.2,.62,bend),Q(1.5,.78,bend-.28),Q(1.28,.88,bend-.33),Q(1.1,.73,bend-.16)],yellow[2]);
  return s;
}
