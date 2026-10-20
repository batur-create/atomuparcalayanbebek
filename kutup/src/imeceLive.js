// Small, transparent Canvas layer. The detailed monument is cached underneath.
// Human height ~1.8 m; machines and work platforms share its 30 m world units.
import { imeceLiftAt } from "./imeceMotion.js";

const HELMETS = ["#edba45", "#81b5d3", "#e6a58b", "#a6c395"];
const INK = "#34403d", STEEL = "#83918c", GOLD = "#d4a638";
const mix = (a, b, t) => a.map((n, i) => n + (b[i] - n) * t);
const ease = t => t * t * (3 - 2 * t);

export function drawImeceLive(ctx, P, job, people, seconds) {
  if (!people.length) return;
  const unit = Math.abs(P(0,0,1)[1] - P(0,0,0)[1]);
  const point = (p) => P(...p);
  const line = (a,b,c=INK,w=.006) => {
    ctx.beginPath();ctx.moveTo(...point(a));ctx.lineTo(...point(b));
    ctx.strokeStyle=c;ctx.lineWidth=Math.max(.45,w*unit);ctx.lineCap="round";ctx.stroke();
  };
  const face = (pts,c) => {
    ctx.beginPath();ctx.moveTo(...point(pts[0]));for(const p of pts.slice(1))ctx.lineTo(...point(p));
    ctx.closePath();ctx.fillStyle=c;ctx.fill();
  };
  const box = (x,y,z,w,d,h,c="#d2bc91") => {
    face([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],c);
    face([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],"#ad9877");
    face([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],"#87765e");
  };
  const disk = (p,r,c) => {ctx.beginPath();ctx.arc(...point(p),Math.max(.4,r*unit),0,Math.PI*2);ctx.fillStyle=c;ctx.fill();};
  const {site,kind}=job;

  function scaffold() {
    const [x,y,z]=site, floor=z;
    // Footings rest on the terrace for hall work, on grade for small towers.
    const base=job.id==="towers"||job.id==="galleries"?0:.21;
    if(floor<=base+.05)return;
    for(const xx of [x-.23,x+.23])for(const yy of [y+.03,y+.20])line([xx,yy,base],[xx,yy,floor+.043],STEEL,.004);
    for(let at=base+.12;at<floor;at+=.13){
      for(const yy of [y+.03,y+.20]){
        line([x-.23,yy,at],[x+.23,yy,at],STEEL,.003);
        line([x-.23,yy,at-.12],[x+.23,yy,at],"#a4afaa",.002);
      }
    }
    box(x-.25,y+.01,floor-.008,.5,.21,.008,"#b6a581");
    line([x-.23,y+.20,floor+.035],[x+.23,y+.20,floor+.035],"#e6bd57",.004);
    // A fixed access ladder: a deck never floats in front of the facade.
    for(const xx of [x+.18,x+.22])line([xx,y+.21,base],[xx,y+.21,floor],STEEL,.003);
    for(let at=base+.03;at<floor;at+=.035)line([x+.18,y+.21,at],[x+.22,y+.21,at],STEEL,.002);
  }

  function crane() {
    const lift=imeceLiftAt(seconds,site),[x,y]=lift.base,H=1.22,apex=1.44;
    // Ballast, four outriggers, lattice mast, slew ring and glazed cab.
    box(x-.09,y-.09,0,.18,.18,.025,"#b9b4a5");
    for(const dx of [-1,1])for(const dy of [-1,1]){
      line([x,y,.025],[x+dx*.13,y+dy*.13,.018],GOLD,.014);
      box(x+dx*.13-.025,y+dy*.13-.025,0,.05,.05,.014,"#777c72");
    }
    for(const dx of [-.023,.023])for(const dy of [-.023,.023])line([x+dx,y+dy,.025],[x+dx,y+dy,H],GOLD,.005);
    for(let z=.04;z<H;z+=.10){
      line([x-.023,y+.023,z],[x+.023,y+.023,z+.10],"#b38322",.003);
      line([x+.023,y-.023,z],[x+.023,y+.023,z+.10],"#e4bf57",.003);
    }
    disk([x,y,H],.035,"#697570");
    const a=lift.angle, at=(r,z,side=0)=>[x+Math.cos(a)*r-Math.sin(a)*side,y+Math.sin(a)*r+Math.cos(a)*side,z];
    const length=Math.max(1.30,lift.reach+.12);
    for(const side of [-.024,.024]){
      line(at(-.33,H,side),at(length,H,side),GOLD,.006);
      line(at(-.33,H+.058,side),at(length,H+.058,side),GOLD,.005);
      for(let r=-.33;r<length-.1;r+=.11)line(at(r,H,side),at(Math.min(length,r+.11),H+.058,side),"#b68624",.0025);
    }
    line([x,y,H],[x,y,apex],GOLD,.006);
    line([x,y,apex],at(length-.07,H+.058),"#69736a",.002);
    line([x,y,apex],at(-.31,H+.058),"#69736a",.002);
    const cw=at(-.28,H+.02);box(cw[0]-.045,cw[1]-.045,cw[2],.09,.09,.085,"#969d91");
    const cab=at(.065,H-.08);box(cab[0]-.03,cab[1]-.03,cab[2],.06,.06,.075,"#d2a940");
    face([[cab[0]+.031,cab[1]-.023,cab[2]+.025],[cab[0]+.031,cab[1]+.023,cab[2]+.025],[cab[0]+.031,cab[1]+.023,cab[2]+.06],[cab[0]+.031,cab[1]-.023,cab[2]+.06]],"#6f9b9e");
    const top=at(lift.reach,H),h=lift.hook;
    line(top,h,"#45514b",.002);
    disk(h,.009,"#3b4641");
    if(lift.loaded){
      const roof=job.id==="roof",tall=job.id==="columns";
      const w=roof?.19:.10,d=.07,height=tall?.10:roof?.025:.055,z=h[2]-.16;
      for(const dx of [-w/2,w/2])for(const dy of [-d/2,d/2])line(h,[h[0]+dx,h[1]+dy,z+height],"#60685e",.002);
      box(h[0]-w/2,h[1]-d/2,z,w,d,height,"#d8c9a7");
    }else line(h,[h[0]+.009,h[1],h[2]-.018],"#3b4641",.004);
    // Materials remain in the laydown area when the hook returns empty.
    for(let i=0;i<3;i++)box(.50+i*.025,-.12,.012+i*.02,.12,.09,.018,"#c9c3ae");
  }

  function excavator() {
    const t=((seconds%9)+9)%9/9,base=[.05,1.12,0];
    const pit=[site[0],site[1],.015],dump=[.67,1.09,.18];
    let target;
    if(t<.25)target=mix([pit[0],pit[1],.13],pit,ease(t/.25));
    else if(t<.40)target=mix(pit,[pit[0],pit[1],.29],ease((t-.25)/.15));
    else if(t<.65)target=mix([pit[0],pit[1],.29],dump,ease((t-.40)/.25));
    else if(t<.78)target=dump;
    else target=mix(dump,[pit[0],pit[1],.13],ease((t-.78)/.22));
    for(const dy of [-.085,.055])box(base[0]-.12,base[1]+dy,.008,.24,.04,.04,"#4b5550");
    box(base[0]-.09,base[1]-.06,.047,.18,.12,.075,"#ddb449");
    box(base[0]-.08,base[1]-.06,.10,.075,.10,.075,"#688c8e");
    const shoulder=[base[0]+.05,base[1],.13],dx=target[0]-shoulder[0],dy=target[1]-shoulder[1],dist=Math.hypot(dx,dy),dz=target[2]-shoulder[2];
    // Two-link inverse kinematics in the boom's vertical plane.
    const a=.36,b=.30,reach=Math.min(a+b-.002,Math.max(.065,Math.hypot(dist,dz)));
    const theta=Math.atan2(dz,dist)+Math.acos(Math.max(-1,Math.min(1,(a*a+reach*reach-b*b)/(2*a*reach))));
    const elbow=[shoulder[0]+dx/(dist||1)*a*Math.cos(theta),shoulder[1]+dy/(dist||1)*a*Math.cos(theta),shoulder[2]+a*Math.sin(theta)];
    line(shoulder,elbow,GOLD,.025);line(elbow,target,GOLD,.019);
    line([shoulder[0],shoulder[1],shoulder[2]+.015],[elbow[0],elbow[1],elbow[2]-.025],"#bcc1b6",.007);
    disk(elbow,.017,"#6e694d");box(target[0]-.035,target[1]-.025,target[2]-.025,.07,.05,.036,"#7f714d");
    box(.52,1.02,.06,.32,.15,.11,"#b59856");
    for(const x of [.58,.79])for(const y of [1.02,1.17])disk([x,y,.045],.034,INK);
    if(t>=.65&&t<.78)for(let i=0;i<5;i++){
      const fall=((t-.65)*8+i*.17)%1;
      disk([dump[0]+Math.sin(i*3)*.02,dump[1]+Math.cos(i*4)*.02,dump[2]-.12*fall],.008,"#94754a");
    }
  }

  function supplies() {
    const [x,y,z]=site;
    if(kind==="concrete"){
      box(x+.23,y+.23,Math.max(0,z-.025),.14,.13,.075,"#c8bb95");
      const a=point([x+.28,y+.25,z+.07]),b=point([x+.10,y+.14,z+.03]),end=point([x+.025+Math.sin(seconds)*.012,y+.06,z+.02]);
      ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(b[0],b[1]+unit*.12,...end);ctx.strokeStyle="#535b50";ctx.lineWidth=Math.max(.7,.012*unit);ctx.stroke();
      line([x-.10,y+.11,z+.01],[x+.05,y+.11,z+.01],"#b8ac86",.014);
    }else if(kind==="rebar"){
      for(let i=0;i<7;i++)line([x+.15,y+.06+i*.008,z+.01],[x+.40,y+.06+i*.008,z+.01],"#805e46",.003);
      for(const at of [.20,.34])line([x+at,y+.05,z+.008],[x+at,y+.12,z+.008],"#b6a181",.004);
    }else if(kind==="survey"){
      const top=[x-.09,y-.09,z+.07];
      for(const [dx,dy]of [[-.025,0],[.025,0],[0,.028]])line([top[0]+dx,top[1]+dy,z],top,"#d1ae48",.004);
      box(top[0]-.015,top[1]-.012,top[2],.03,.024,.019,"#d7b34b");
      line([x+.18,y-.02,z],[x+.18,y-.02,z+.075],"#efeee2",.004);
      for(let i=0;i<4;i++)line([x+.18,y-.02,z+i*.018],[x+.18,y-.02,z+i*.018+.007],"#c85e43",.004);
    }else if(kind==="garden"){
      line([x+.03,y-.02,z],[x+.03,y-.02,z+.08],"#7c6c46",.006);
      disk([x+.03,y-.02,z+.11],.04,"#68935d");
      for(const dx of [-.035,.035])line([x+dx,y-.02,z],[x+.03,y-.02,z+.065],"#b9a67b",.003);
    }else if(kind!=="lift"&&kind!=="dig"&&kind!=="flag"&&kind!=="inspect"){
      for(let i=0;i<3;i++)box(x+.20,y+.05,z+i*.014,.10,.07,.014,kind==="mosaic"?["#a65b42","#c5a26b","#785b46"][i]:"#d2bf9d");
    }
  }

  function worker(person,i) {
    const t=seconds+i*.87, walkCycle=((t%8)+8)%8/8;
    const carrying=["stone","rebar","mosaic","masonry"].includes(kind)&&i===0;
    const walk=carrying&&walkCycle<.62,travel=walk?Math.sin(walkCycle/.62*Math.PI)*.15:0;
    const [sx,sy,sz]=site,x=sx+(i%2)*.11-.07,y=sy+.11+Math.floor(i/2)*.085+travel,z=sz;
    const [px,py]=point([x,y,z]),height=unit*.062;
    if(height<1.5)return;
    const squat=["mosaic","rebar","garden"].includes(kind)&&!walk;
    const bob=walk?Math.abs(Math.sin(t*6))*.025:Math.sin(t*1.7)*.006;
    const stride=walk?Math.sin(t*6)*.18:Math.sin(t*2)*.015;
    const chest=squat?-.43:-.68,head=squat?-.61:-.91;
    ctx.save();ctx.translate(px,py);ctx.scale(height,height);ctx.lineCap="round";ctx.lineJoin="round";
    ctx.fillStyle="rgba(41,54,40,.17)";ctx.beginPath();ctx.ellipse(0,.02,.23,.075,0,0,Math.PI*2);ctx.fill();
    const stroke=(pts,c,w)=>{ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();};
    stroke([[-.085,chest+.18],[squat?-.2:-.07,.0],[stride-.13,0]],INK,.09);
    stroke([[.07,chest+.18],[squat?.18:.06,-.15],[-stride+.11,0]],"#465c62",.09);
    ctx.fillStyle=HELMETS[person.slot%4];ctx.fillRect(-.14,chest+bob,.28,.28);
    ctx.fillStyle="#eee2aa";ctx.fillRect(-.14,chest+.13+bob,.28,.045);
    ctx.fillStyle="#d4ab80";ctx.beginPath();ctx.arc(.015,head+bob,.10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=HELMETS[person.slot%4];ctx.beginPath();ctx.ellipse(0,head-.05+bob,.135,.075,-.08,Math.PI,Math.PI*2);ctx.fill();
    stroke([[-.14,head-.035+bob],[.16,head-.045+bob]],"#f0d899",.035);
    const swing=walk?Math.sin(t*6)*.11:Math.sin(t*3)*.065;
    const hand=[.23+(squat?.02:0),chest+.17+(walk?0:swing)];
    stroke([[-.12,chest+.035],[.02,chest+.15],hand],"#d0aa7d",.065);
    stroke([[.12,chest+.035],[.20,chest+.12],hand],"#e2bf92",.065);
    if(carrying&&walk){ctx.fillStyle=kind==="mosaic"?"#ab6747":"#bdb298";ctx.fillRect(.10,chest+.12,.26,.13);}
    else if(["garden","dig"].includes(kind)){
      stroke([hand,[.34,-.02]],"#8d7850",.035);stroke([[.27,-.025],[.42,-.025]],"#707a6d",.07);
    }else if(kind==="survey"||kind==="inspect"){
      ctx.fillStyle="#efe0ad";ctx.fillRect(.17,chest+.10,.18,.21);stroke([[.20,chest+.16],[.30,chest+.16]],INK,.02);
    }else if(kind==="flag"){
      stroke([hand,[.35,-1.3]],"#c7b478",.02);
    }else if(!walk){
      stroke([hand,[.35,chest+.02+swing]],"#8c7456",.035);stroke([[.30,chest+.02+swing],[.41,chest+.02+swing]],"#78877c",.05);
    }
    ctx.restore();
  }

  if(job.scaffold)scaffold();
  if(kind==="dig")excavator();
  if(kind==="lift")crane();
  supplies();
  people.slice(0,4).map((p,i)=>({p,i,depth:site[0]+site[1]+i*.04})).sort((a,b)=>a.depth-b.depth).forEach(({p,i})=>worker(p,i));
}
