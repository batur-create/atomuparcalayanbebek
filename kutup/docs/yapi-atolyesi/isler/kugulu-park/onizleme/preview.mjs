// Isolated, low-detail approval study. No catalogue, economy, game or server hooks.
// Run from any directory: node <this file>. All sizes are proposed GAME sizes.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { projector, useSVG, poly, seg, ellipse, box, STONE, WOOD, spec, buildingSVG } from '../../../../../src/iso.js';
import { lathe, rectOutline } from '../../../../../src/kit.js';

useSVG();
const dir = fileURLToPath(new URL('.', import.meta.url));
const text = (x,y,label,size=18,color='#30312f') => `<text x="${x}" y="${y}" font-size="${size}" font-family="Arial,sans-serif" fill="${color}">${label}</text>`;
const ground = rectOutline(-8.75,-7.5,8.75,7.5);
// Approximate two connected lobes, read from supplied aerial/photo references;
// not a surveyed boundary. Exact pond edges remain an approval-stage simplification.
const controls=[[-5.7,-.4],[-5.4,-1.8],[-4.4,-2.7],[-2.7,-2.8],[-1.3,-2.5],[-.6,-1.65],[.65,-1.6],[1.9,-2.7],[3.7,-3.15],[5.1,-2.6],[5.75,-1.3],[5.1,.3],[5.6,1.5],[4.65,2.6],[3.2,2.8],[1.9,2],[1.15,.95],[0,1.3],[-1.5,2.5],[-3.65,2.5],[-5.1,1.65]];
function smooth(points){
  const out=[],n=points.length;
  for(let i=0;i<n;i++)for(let j=0;j<4;j++){
    const t=j/4,t2=t*t,t3=t2*t;
    const p0=points[(i+n-1)%n],p1=points[i],p2=points[(i+1)%n],p3=points[(i+2)%n];
    out.push([0,1].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3)));
  }
  return out;
}
const pond=smooth(controls);
const ring=(cx,cy,rx,ry,n=30)=>Array.from({length:n},(_,i)=>[cx+Math.cos(i/n*Math.PI*2)*rx,cy+Math.sin(i/n*Math.PI*2)*ry]);
const surface=(P,points,z,c)=>poly(points.map(([x,y])=>P(x,y,z)),c);
function walk(P,points,width,c){let s='';for(let i=1;i<points.length;i++)s+=seg(P(...points[i-1],.04),P(...points[i],.04),c,width);return s;}
function shelter(P,x,y){
  let s=box(P,x-.42,y-.32,x+.42,y+.32,.12,.75,WOOD);
  for(const dy of [-.4,.4])s+=poly([P(x-.52,y+dy,.76),P(x+.52,y+dy,.76),P(x+.52,y,1.04),P(x-.52,y,1.04)],dy>0?'#78634d':'#a39479');
  return s+poly([P(x-.18,y+.325,.13),P(x+.18,y+.325,.13),P(x+.18,y+.325,.5),P(x-.18,y+.325,.5)],'#4e4234');
}
function bench(P,x,y){
  let s='';for(const dx of [-.44,.44])s+=box(P,x+dx-.04,y-.12,x+dx+.04,y+.16,.05,.38,['#697468','#596557','#445041']);
  s+=box(P,x-.65,y-.19,x+.65,y+.24,.36,.45,WOOD);
  s+=box(P,x-.65,y+.18,x+.65,y+.25,.45,.85,WOOD);return s;
}
function tree(P,x,y,h=5,r=1.1){
  let s=box(P,x-.075,y-.075,x+.075,y+.075,0,h*.74,['#a69679','#7d715e','#635b4b']);
  for(const d of [-1,1])s+=seg(P(x,y,h*.5),P(x+d*r*.52,y+.15,h*.83),'#82745e',3);
  const c=['#9db582','#7d9d6a','#637f54'];
  s+=lathe(P,x,y,[[0,h*.53],[r*.85,h*.63],[r,h*.78],[r*.7,h*.95],[0,h]],c,{n:9});
  return s;
}
function swan(P,x,y,dark=false){
  const c=dark?'#3b3c38':'#fff9e8',p=P(x,y,.14),q=P(x+.3,y,.52),scale=Math.hypot(...[P(1,0,0)[0]-P(0,0,0)[0],P(1,0,0)[1]-P(0,0,0)[1]]);
  let s=ellipse(p[0],p[1]+scale*.12,scale*.4,scale*.15,'#b0c4b5',.65);
  s+=ellipse(p[0],p[1],scale*.28,scale*.13,c);
  s+=seg(P(x+.13,y,.17),P(x+.29,y,.45),c,scale*.075)+seg(P(x+.29,y,.45),q,c,scale*.065);
  s+=ellipse(q[0],q[1],scale*.075,scale*.065,c);
  return s+seg(q,P(x+.42,y,.5),dark?'#cb7760':'#c79a58',scale*.035);
}
function fountain(P,x,y,night){
  const a=P(x,y,.09),b=P(x,y,1.25);let s=seg(a,b,night?'#d4e1d3':'#ecf3e8',2.5,.85);
  for(const dx of [-.2,.2])s+=seg(b,P(x+dx,y,.3),'#edf4e9',1,.8);
  return s;
}
function cafe(P){
  let s=box(P,-6.9,-5.8,-3.2,-4.2,0,1.45,['#e2d5bd','#c4b89f','#a99c86']);
  s+=box(P,-6.98,-5.88,-3.12,-4.12,1.45,1.64,STONE);
  for(let x=-6.65;x<-3.3;x+=.6)s+=poly([P(x,-4.19,.35),P(x+.4,-4.19,.35),P(x+.4,-4.19,1.2),P(x,-4.19,1.2)],'#799597');
  return s;
}
function playground(P){
  let s=surface(P,rectOutline(4,3.7,7.5,6.15),.045,'#c2b6a2');
  for(const x of [4.7,5.8])for(const y of [4.3,5.3])s+=box(P,x-.045,y-.045,x+.045,y+.045,.05,1.7,WOOD);
  s+=box(P,4.65,4.25,5.85,5.35,.65,.76,WOOD);
  for(const dy of [-.65,.65])s+=poly([P(4.5,4.8+dy,1.72),P(6,4.8+dy,1.72),P(5.25,4.8,2.22)],'#8d9278');
  s+=seg(P(5.8,5.2,.72),P(6.8,5.8,.15),'#729da4',8);
  return s;
}
function statue(P,x,y){return box(P,x-.28,y-.28,x+.28,y+.28,.04,.3,STONE)+box(P,x-.1,y-.07,x+.1,y+.07,.3,1.28,['#9a8566','#806f54','#62583f']);}

function park(P,night=false){
  let s=box(P,-8.75,-7.5,8.75,7.5,-.2,0,['#b8c495','#9cac82','#899d73']);
  // Broad paths are intentionally schematic at this stage.
  const paving=night?'#b5b5a4':'#d9d4bf';
  for(const route of [[[0,7.5],[0,4.5],[2.4,3.6],[6.9,2.3],[7,-2.3],[4,-4.1],[-2,-3.9],[-7,-2.8],[-7,2.5],[-3,3.8],[0,4.5]],[[0,4.5],[-3.8,3.4],[-6,4.7],[-8.75,5]],[[4,-4.1],[3,-7.5]]])s+=walk(P,route,25,paving);
  s+=surface(P,pond.map(([x,y])=>[x*1.045,y*1.065]),.02,'#d1cbbb');
  s+=surface(P,pond,.03,night?'#446a64':'#799e8f');
  const islands=[[-2.65,-.45,1.03,.68],[3.4,-1.15,.83,.6]];
  for(const [x,y,rx,ry] of islands)s+=surface(P,ring(x,y,rx,ry),.09,'#d2cebb');
  // Back fence before island furniture; front fence after it.
  const fence=(i)=>{
    const [x,y]=pond[i],q=pond[(i+1)%pond.length];
    return seg(P(x,y,.08),P(x,y,.62),'#826347',1.25)+seg(P(x,y,.55),P(q[0],q[1],.55),'#997a54',1.2);
  };
  for(let i=0;i<pond.length;i++)if(pond[i][1]<0)s+=fence(i);
  s+=shelter(P,-2.95,-.45)+shelter(P,-2.1,-.4)+shelter(P,3.4,-1.15);
  for(const [x,y,d] of [[-4,.7,false],[.1,-.1,true],[3.5,.65,false]])s+=swan(P,x,y,d);
  s+=fountain(P,-3.7,-1.5,night)+fountain(P,3.4,1.5,night);
  for(let i=0;i<pond.length;i++)if(pond[i][1]>=0)s+=fence(i);
  const objects=[{d:-10.05,draw:()=>cafe(P)},{d:10.5,draw:()=>playground(P)},{d:7.3,draw:()=>statue(P,1.6,5.7)}];
  for(const [x,y] of [[-5.8,3.8],[-2,4.6],[3,4.6],[6.6,-3.6]])objects.push({d:x+y,draw:()=>bench(P,x,y)});
  const trees=[[-6.8,-6.1,5.1,1.15],[-1,-5.8,5.4,1.2],[2,-5.6,5.1,1.3],[6.6,-4.6,5.8,1.15],[-7.3,.4,5.3,1],[-5.8,5.5,4.8,1.05],[7.7,.5,5.3,1.15],[-2.6,-.45,4.5,.76],[3.4,-1.15,4.6,.75]];
  for(const [x,y,h,r] of trees)objects.push({d:x+y,draw:()=>tree(P,x,y,h,r)});
  for(const object of objects.sort((a,b)=>a.d-b.d))s+=object.draw();
  for(const [x,y] of [[-.9,5.4],[6.5,3],[-6,1.4]]){
    s+=seg(P(x,y,0),P(x,y,1.8),'#606b58',2);
    const p=P(x,y,1.8);s+=ellipse(p[0],p[1],3,4,night?'#f4d59a':'#d1cbb2');
  }
  return s;
}
const svg=(body,w=1400,h=900,night=false)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs><filter id="night"><feColorMatrix type="matrix" values=".53 0 0 0 0 0 .62 0 0 0 0 0 .61 0 0 0 0 0 1 0"/></filter></defs><rect width="${w}" height="${h}" fill="${night?'#253c36':'#f6f5f0'}"/>${body}</svg>`;
for(const night of [false,true]){
  const P=projector({cx:710,cy:470,s:31});
  let body=night?`<g filter="url(#night)">${park(P,night)}</g>`:park(P,night);
  body+=text(44,48,'KUĞULU PARK · HACİM ÖNİZLEMESİ',24,night?'#e7e7da':'#30312f');
  body+=text(44,79,'Fotoğraflardan yorumlanan yerleşim · düşük ayrıntı · üretim onayı öncesi',16,night?'#c3cebc':'#64665e');
  body+=text(44,844,'Önerilen oyun alanı: 28 × 24 m. Havuz kıyısı, ağaçlar ve donatı konumları yaklaşık.',17,night?'#c3cebc':'#64665e');
  body+=text(44,873,'Bu bir uygulama ekranı veya tamamlanmış model değildir. Ayrıntılar ve ışıklar sonraki üretim aşamasında.',16,night?'#c3cebc':'#64665e');
  writeFileSync(dir+(night?'gece.svg':'yakin.svg'),svg(body,1400,900,night));
}
const S=projector({cx:490,cy:400,s:22.5});
const H=(x,y,z)=>S(x+15,y+4,z);
let scale=park(S)+buildingSVG(H,spec('house',7,'ev'),7,{detail:2});
const W=(x,y,z)=>S(x+10,y+8,z);
scale+=box(W,-.12,-.1,.12,.1,0,.55,['#bd8d5e','#a57648','#865f3c'])+box(W,-.16,-.1,.16,.1,.55,.92,['#bd9168','#ab7c50','#936b42']);
scale+=ellipse(...W(0,0,1.05),3,3,'#c9a27d');
scale+=text(36,45,'AYNI ÖLÇEKTE PARK · MEVCUT EV · İNSAN',24);
scale+=text(36,76,'1 çizim birimi = 1,6 m · parkın ölçüsü öneridir; gerçek park boyutları değildir.',16,'#64665e');
scale+=text(980,600,'Mevcut iki katlı ev',18)+text(36,822,'Park: 28 × 24 m zemin önerisi; giriş yaklaşımı ve ağaç üst izdüşümü ayrıca ölçülecek.',17,'#64665e');
writeFileSync(dir+'olcek.svg',svg(scale,1400,850));
writeFileSync(dir+'README.md',`# Kuğulu Park önizlemesi v1\n\nBu dosyalar uygulama görüntüsü değildir. Mevcut iso.js / kit.js ilkelleriyle, katalog ve oyun bağlantısı eklemeden üretilmiş düşük ayrıntılı hacim denemesidir.\n\n- yakin.svg / yakin.png: gündüz, havuz ve ana işlevlerin yerleşim önerisi.\n- gece.svg / gece.png: sade gece ton/aydınlatma önerisi; gerçek aydınlatma projesi değil.\n- olcek.svg / olcek.png: mevcut ev ve temsilî insan yanında aynı fiziksel oyun ölçeği.\n\nKaynak fotoğraflar tek tek ölçülmedi; 28 × 24 m sınırı oyun tasarımı önerisidir. Tam kontur, kotlar, heykel biçimleri, kafe ve oyun donatısı ayrıntıları nihai üretim değildir. Ağaçlar ve çitler ayrıntı bütçesi nedeniyle sade; yakın modelde derinlik sırası, dokular ve mevsimler ayrıca tamamlanır. Çizimdeki renkler yalnız izole malzeme denemesidir; ürün arayüz jetonları değiştirilmedi.\n\nYeniden üretim: node docs/yapi-atolyesi/isler/kugulu-park/onizleme/preview.mjs\n`);
console.log('Generated isolated daytime, night and same-scale SVG studies.');
