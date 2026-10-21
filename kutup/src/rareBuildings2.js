// Six more original, staged buildings. Architectural geometry is shared by
// catalogue SVG, the construction scene and the village's static Canvas tiles.
import {box,poly,seg,LIT} from './iso.js';
import {lathe} from './kit.js';
import {design,WOOD,STONE,TEAL,TILE,STEEL,COPPER,gable,window,plate,quad,beam} from './rareBuildings.js';
const SAND=['#e4d3ad','#c9b68c','#ad966f'],ROCK=['#d2bfa1','#b7a087','#957f6b'];
function arch(P,x,y,z,w,h,lit=false,side='y',detail=2){
  const point=(u,v)=>side==='y'?P(x+u,y,z+v):P(x,y+u,z+v),r=w/2,spring=h-r;
  const outline=[point(0,0),point(w,0),point(w,spring)];
  for(let i=1;i<=12;i++){const a=i*Math.PI/12;outline.push(point(r+r*Math.cos(a),spring+r*Math.sin(a)));}
  let s=poly(outline,lit?LIT:'#62574a');
  if(detail>0){
    for(let i=0;i<=8;i++){const a=i*Math.PI/8;s+=seg(point(r+r*Math.cos(a),spring+r*Math.sin(a)),point(r+(r+.12)*Math.cos(a),spring+(r+.12)*Math.sin(a)),SAND[2],.65);}
    s+=seg(point(w/2,.04),point(w/2,h-.1),WOOD[2],.65);
  }
  return s;
}
function courses(P,x0,y0,x1,y1,z,h,detail){
  let s='';if(!detail)return s;
  for(let zz=z+.24;zz<z+h;zz+=.26){s+=seg(P(x0,y1+.005,zz),P(x1,y1+.005,zz),SAND[2],.45)+seg(P(x1+.005,y0,zz),P(x1+.005,y1,zz),SAND[2],.45);
    if(detail>1)for(let x=x0+.15+(Math.round(zz*4)%2)*.22;x<x1;x+=.5)s+=seg(P(x,y1+.006,zz),P(x,y1+.006,Math.min(z+h,zz+.24)),SAND[2],.4);
  }return s;
}
function cappadocia(P,k,lit,detail){
  let s=quad(P,-2.6,-1.7,2.7,2,.015,'#c4b18d');
  // The geology predates the project; the work is conservation and carving.
  for(const [x,y,r,h] of [[-1.25,-.65,.85,3.7],[1.2,-.55,.7,3.2],[.1,.6,1,2.65]]){
    s+=lathe(P,x,y,[[r,0],[r*.95,.45],[r*.62,h*.6],[r*.29,h*.87],[.16,h]],ROCK,{n:11});
    s+=lathe(P,x,y,[[r*.55,h*.82],[r*.58,h*.88],[0,h+.4]],[ROCK[2],ROCK[1],ROCK[2]],{n:11});
    if(k.frame>0)s+=arch(P,x-.27,y+r*.62,.25,.54,Math.min(1.1,.2+k.frame),false,'y',detail);
    if(k.skin>.4)s+=arch(P,x-.19,y+r*.47,1.45,.38,.58,lit,'y',detail);
    if(detail>1)for(let i=1;i<6;i++){const z=.15+i*.37,rad=r*(1-.75*z/h);s+=seg(P(x-rad*.55,y+rad*.8,z),P(x+rad*.55,y+rad*.8,z+.03),ROCK[1],.4);}
  }
  if(k.roof>0)s+=box(P,-.7,1.25,.8,1.55,1.3,1.42,SAND);
  if(k.fit>0){for(let i=0;i<4;i++)s+=box(P,.7,1.3+i*.16,1.25,1.5+i*.16,0,.3-i*.07,SAND);s+=box(P,-1.8,1.15,-1.25,1.55,0,.3,WOOD);}
  return s;
}
function floating(P,k,lit,detail){
  let s=quad(P,-2.7,-2.1,2.65,2.25,-.05,'#8db6be');
  if(detail)for(let i=0;i<8;i++)s+=seg(P(-2.3+i*.57,1.65,-.04),P(-2.05+i*.57,1.65,-.04),'#cfdfd8',.6);
  if(k.base>0){for(const y of [-.9,.9])s+=box(P,-1.8,y-.32,1.8,y+.32,-.12,.27*k.base,STEEL);s+=box(P,-2,-1.45,2,1.65,.27,.42,WOOD);}
  if(k.frame>0)for(const x of [-1.25,1.25])for(const y of [-.95,.85])s+=box(P,x-.05,y-.05,x+.05,y+.05,.42,.42+1.7*k.frame,WOOD);
  if(k.skin>0){s+=box(P,-1.25,-.95,1.25,.85,.42,.42+1.7*k.skin,TEAL);if(k.skin>.85)s+=window(P,-.95,.86,.8,.85,.95,lit)+window(P,1.26,-.7,.8,1.25,.95,lit,'x');}
  s+=gable(P,0,-.05,1.55,1.2,2.12,3,k.roof||0,TILE,detail);
  if(k.fit>0){
    for(const x of [-1.9,-1.1,-.3,.5,1.8])s+=box(P,x-.035,1.5,x+.035,1.56,.42,1.04,WOOD);
    s+=seg(P(-1.9,1.53,1.02),P(1.8,1.53,1.02),WOOD[0],1.1);
    s+=box(P,1.9,.3,3,.95,.24,.36,WOOD);
    for(const y of [-1.3,1.4]){s+=box(P,2.05,y-.05,2.15,y+.05,-.18,.9,WOOD);s+=seg(P(1.8,y,.5),P(2.1,y,.76),WOOD[2],.9);}
    s+=poly([P(-.8,.15,2.8),P(.55,.15,2.8),P(.55,1,2.3),P(-.8,1,2.3)],STEEL[2]);
    if(detail)for(let i=1;i<4;i++)s+=seg(P(-.8+i*.34,.15,2.81),P(-.8+i*.34,1,2.31),STEEL[0],.5);
  }return s;
}
function suspension(P,k,lit,detail){
  let s=quad(P,-3.5,-1.6,3.5,1.6,-.06,'#89afb8');
  if(k.base>0){for(const x of [-1.8,1.8])for(const y of [-.65,.65])s+=box(P,x-.2,y-.18,x+.2,y+.18,-.06,.3*k.base,STONE);for(const x of [-3.5,3.5])for(const y of [-.62,.62])s+=box(P,x-.18,y-.18,x+.18,y+.18,-.02,.65*k.base,STONE);}
  if(k.frame>0)for(const x of [-1.8,1.8]){
    for(const y of [-.65,.65])s+=box(P,x-.09,y-.09,x+.09,y+.09,.3,.3+3.7*k.frame,STEEL);
    if(k.frame>.85)s+=box(P,x-.1,-.73,x+.1,.73,3.65,3.85,STEEL);
  }
  if(k.skin>0)for(const y of [-.62,.62]){
    const points=[];for(let i=0;i<=24*k.skin;i++){const x=-1.8+i*.15;points.push([x,y,4-1.55*(1-(x/1.8)**2)]);}
    for(let i=1;i<points.length;i++)s+=seg(P(...points[i-1]),P(...points[i]),STEEL[2],1.5);
    if(k.skin>.95)for(const sign of [-1,1])s+=seg(P(sign*1.8,y,4),P(sign*3.5,y,.65),STEEL[2],1.3);
    if(detail>0)for(let x=-1.65;x<=Math.min(1.65,-1.8+3.6*k.skin);x+=.3)s+=seg(P(x,y,4-1.55*(1-(x/1.8)**2)),P(x,y,1.25),STEEL[1],.6);
  }
  if(k.roof>0){const x=-3.25+6.5*k.roof;s+=box(P,-3.25,-.56,x,.56,1.05,1.23,WOOD);if(detail)for(let a=-3.2;a<x;a+=.18)s+=seg(P(a,-.54,1.24),P(a,.54,1.24),WOOD[2],.5);}
  if(k.fit>0)for(const y of [-.58,.58]){s+=seg(P(-3.2,y,1.8),P(3.2,y,1.8),STEEL[0],1);for(let x=-3.1;x<3.2;x+=.4)s+=seg(P(x,y,1.23),P(x,y,1.8),STEEL[1],.65);}
  return s;
}
function mardin(P,k,lit,detail){
  let s='';if(k.base>0)s+=box(P,-1.85,-1.45,1.9,1.75,0,.2*k.base,SAND);
  if(k.frame>0){s+=box(P,-1.55,-1.2,1.55,.15,.2,.2+3.25*k.frame,SAND);s+=box(P,-1.55,.15,1.55,1.45,.2,.2+1.7*k.frame,SAND);}
  if(k.skin>0){
    s+=courses(P,-1.55,-1.2,1.55,.15,.2,3.25,detail)+courses(P,-1.55,.15,1.55,1.45,.2,1.7,detail);
    if(k.skin>.5){for(const x of [-1.25,-.28,.69])s+=arch(P,x,1.46,.28,.58,1.15,lit,'y',detail);for(const y of [-.95,-.18,.6])s+=arch(P,1.56,y,.4,.5,.9,lit,'x',detail);for(const x of [-1.15,0,.9])s+=arch(P,x,.16,2.35,.5,.82,lit,'y',detail);}
  }
  if(k.roof>0){s+=box(P,-1.7,-1.35,1.7,.28,3.45,3.58,SAND)+box(P,-1.7,.2,1.7,1.6,1.9,2.03,SAND);
    for(const x of [-1.64,1.58])s+=box(P,x,.28,x+.07,1.57,2.03,2.38,SAND);
    s+=box(P,-1.65,1.5,1.65,1.58,2.03,2.38,SAND);
    if(detail>1)for(let x=-1.55;x<1.65;x+=.22)s+=seg(P(x,1.585,2.08),P(x,1.585,2.31),SAND[2],.5);
  }
  if(k.fit>0){for(let i=0;i<8;i++)s+=box(P,-1.75,1.2-i*.17,-1.35,1.38-i*.17,.1,.35+i*.23,SAND);}
  return s;
}
function caravanserai(P,k,lit,detail){
  let s='';if(k.base>0){s+=box(P,-2.5,-2,2.5,2,0,.18*k.base,SAND);s+=quad(P,-1.45,-1.05,1.45,1.05,.185,'#bcb49c');}
  if(k.frame>0){
    for(const [x0,y0,x1,y1] of [[-2.35,-1.85,2.35,-1.05],[-2.35,-1.05,-1.5,1.8],[1.5,-1.05,2.35,1.8],[-1.5,1.05,-.45,1.8],[.45,1.05,1.5,1.8]])s+=box(P,x0,y0,x1,y1,.18,.18+1.75*k.frame,SAND);
  }
  if(k.skin>0){
    for(const x of [-1.2,-.4,.4])s+=arch(P,x,-1.04,.22,.65,1.15,lit,'y',detail);
    for(const y of [-.8,.05,.9])s+=arch(P,2.36,y,.25,.55,1.1,lit,'x',detail);
    if(detail)s+=courses(P,1.5,-1.05,2.35,1.8,.18,1.75,detail);
    s+=box(P,-.64,1.05,-.45,1.9,.18,2.45,SAND)+box(P,.45,1.05,.64,1.9,.18,2.45,SAND)+box(P,-.64,1.05,.64,1.9,1.65,2.45,SAND);
    s+=arch(P,-.44,1.91,.2,.88,1.7,false,'y',detail);
  }
  if(k.roof>0){for(const [x0,y0,x1,y1] of [[-2.48,-1.98,2.48,-1.02],[-2.48,-1.02,-1.48,1.94],[1.48,-1.02,2.48,1.94],[-1.48,1.05,-.64,1.94],[.64,1.05,1.48,1.94]])s+=box(P,x0,y0,x1,y1,1.93,2.08,SAND);s+=box(P,-.75,1.01,.75,2.02,2.45,2.58,SAND);}
  if(k.fit>0){s+=lathe(P,0,0,[[.38,.2],[.38,.4],[.28,.5]],SAND,{n:12});s+=quad(P,-.2,-.2,.2,.2,.45,'#91b7bd');for(const x of [-1.35,1])s+=box(P,x,.4,x+.3,.7,.19,.35,WOOD);}
  return s;
}
function atakule(P,k,lit,detail){
  let s='';if(k.base>0){s+=lathe(P,0,0,[[1.45,0],[1.45,.22*k.base],[.9,.4*k.base]],STONE,{n:24});s+=box(P,-1.8,.25,1.8,1.55,0,.3*k.base,STONE);}
  if(k.frame>0)s+=lathe(P,0,0,[[.67,.25],[.49,.3+2.7*k.frame],[.34,.3+7.55*k.frame]],STONE,{n:20});
  if(k.skin>0){for(const a of [0,.9,1.8,2.7,3.6,4.5]){const x=.4*Math.cos(a),y=.4*Math.sin(a);s+=seg(P(x,y,2.3),P(x*.8,y*.8,7.8),STONE[2],.5);}s+=plate(P,-.25,.68,.35,.5,1,lit?LIT:STEEL[2]);}
  if(k.roof>0){
    const cap=k.roof;
    s+=lathe(P,0,0,[[.36,7.8],[1.25,8.25],[1.52,8.45]],STONE,{n:24});
    if(cap>.25)s+=lathe(P,0,0,[[1.52,8.45],[1.68,8.75],[1.62,9.1],[1.4,9.35]],lit?[LIT,'#e1d3a8','#bfb89b']:['#9cb2b6','#7e999f','#607d85'],{n:24});
    if(cap>.55){s+=lathe(P,0,0,[[1.4,9.32],[1.62,9.3],[1.62,9.45],[1.2,9.95],[.22,10.2]],STONE,{n:24});
      if(detail)for(let i=0;i<24;i++){const a=i*Math.PI/12;s+=seg(P(1.52*Math.cos(a),1.52*Math.sin(a),8.45),P(1.62*Math.cos(a),1.62*Math.sin(a),9.1),STEEL[2],.6);}}
  }
  if(k.fit>0){s+=lathe(P,0,0,[[.13,10.2],[.09,10.45],[.035,10.8]],STEEL,{n:8});s+=box(P,-.65,1.1,.65,1.8,.3,.95,STONE);s+=window(P,-.5,1.81,.4,1,.48,lit);for(let i=0;i<4;i++)s+=box(P,-.8,1.9+i*.15,.8,2.08+i*.15,0,.28-i*.06,STONE);}
  return s;
}
const make=(draw,height,wallTop,reach,material,labels,info)=>design({draw,height,wallTop,reach,material,labels,info});
export const MORE_DISCOVERY_BUILDINGS={
  cappadocia:make(cappadocia,4.1,2.65,2.8,'stone',['Doğal kaya ve koruma sınırları','Kontrollü kaya oyma ve odalar','Kemer ağızları ve ahşap doğramalar','Taş saçak ve suyun uzaklaştırılması','Terastaki basamaklar ve gece ışıkları'],['Peribacası inşa edilmez; doğal kaya kütlesini koruyarak çalışılır.','Oyma kontrollü ilerler; üstteki kaya örtüsü ve yan duvarlar yeterli kalınlıkta bırakılır.','Kemerli açıklıklar ve doğramalar mevcut kayayı zorlamadan yerleştirilir.','Yağmur açıklıklardan uzaklaştırılır; doğal siluete yeni bir ağır çatı bindirilmez.','Basamak, korkuluk ve aydınlatma güvenli kullanıma hazırlanır.']),
  floating:make(floating,3.05,2.12,3.1,'timber',['Yüzer pontonlar ve ahşap platform','Hafif ahşap taşıyıcılar','Yalıtımlı cephe ve geniş pencereler','Hafif çatı ve su yalıtımı','Bağlama halatları, iskele ve güneş paneli'],['Ağırlık suya pontonlarla aktarılır; yüzer taban tek parça gibi bağlanır.','Hafif çerçeve ağırlık merkezini aşağıda tutar.','Cephe birleşimleri yağmur ve sıçrayan suya karşı kapatılır.','Ağır beton yerine hafif ve yalıtımlı örtü kullanılır.','Bağlar evin su seviyesiyle hareketine pay bırakır; kıyı geçişi ve korkuluklar kontrol edilir.']),
  suspension:make(suspension,4.05,3.7,3.6,'steel',['Kule temelleri ve ankraj blokları','İki çelik kule ve üst bağlantılar','Ana kablolar ve düşey askılar','Askılara bağlı ahşap yaya tabliyesi','Korkuluklar ve yük denemesi'],['Kule ve kablo çekmesi için iki kıyıda temeller hazırlanır.','Kuleler diklik kontrolüyle yükselir.','Ana kablonun eğrisi ve askıların boyları birlikte ayarlanır.','Tabliye kablolara asılarak bölüm bölüm birleştirilir; suyun üstüne dolgu yapılmaz.','Yaya korkulukları ve bağlantılar kontrol edilir, yük denemesi sonrası açılır.']),
  mardin:make(mardin,3.6,3.45,2,'stone',['Taş temel ve kot farkları','Alt ve üst kat yığma duvarlar','Kemerli açıklıklar ve taş derzleri','Düz dam ve teras korkulukları','Dış merdiven ve ince taş işçiliği'],['Sarı kalker temeller eğimli yerleşime uydurulur.','Kalın duvarlar üst kattaki yükü temele indirir.','Kemer taşları yükü yan ayaklara aktarır; üzengi ve kilit taşı yerinde tutulur.','Düz damda yağmur suyu için eğim ve tahliye bırakılır.','Sokak ile terasın ilişkisini dış merdiven kurar; ince derzler ve korkuluklar tamamlanır.']),
  caravanserai:make(caravanserai,2.6,1.93,2.7,'stone',['Taş temel ve açık avlu döşemesi','Avluyu çevreleyen kalın duvarlar','Revaklar ve anıtsal taçkapı','Tonoz üst örtüleri ve taş saçaklar','Avlu çeşmesi ve dinlenme sekileri'],['Açık avlu yapı kütlesiyle doldurulmaz; yağmur suyu eğimleri önceden çözülür.','Yolcuların odaları ve depolar avlu çevresinde yükselir.','Kemer ve taçkapı taşları geçici desteklerle yerleştirilir.','Tonozlardan gelen yatay etkiler kalın yan duvarlarla dengelenir.','Çeşme ve sekiler avluyu ortak bir dinlenme yerine dönüştürür.']),
  atakule:make(atakule,10.8,7.85,2.5,'concrete',['Derin temel ve giriş platformu','Betonarme çekirdeğin yükseltilmesi','Çekirdek derzleri ve servis açıklıkları','Seyir katı, cam kuşak ve döner restoran','Üst başlık, anten ve giriş basamakları'],['Yüksek ve ince kulenin yükleri temel üzerinden zemine aktarılır.','Çekirdek kademelerle yükselir; beton ve donatı sürekliliği kontrol edilir.','Düşey hatlar, servis geçişleri ve dış yüzey tamamlanır.','Seyir ve restoran katı çekirdeğe bağlı halka üzerinde kurulur; camın taşıyıcılığı yoktur.','Ankara siluetindeki ince gövde ve geniş seyir başlığı korunur; son bağlantılar kontrol edilir.']),
};
