// Six original Kütüp designs. The same geometry builds the site, catalogue
// portrait and canvas village; construction places real pieces, never fades a photo.
import { box, poly, seg, ellipse, LIT } from "./iso.js";
import { at, castShadow, domeProfile, lathe, progress, rectOutline } from "./kit.js";
const WOOD=["#c9a576","#a47b50","#815b3d"], STONE=["#dfd9c6","#bfb6a0","#a29680"],
  TEAL=["#86b3ac","#5d8c88","#436966"], TILE=["#b87961","#995c4b","#794738"],
  STEEL=["#8a9ba1","#62777e","#435860"], COPPER=["#b9946b","#94704f","#72513b"];
const quad=(P,x0,y0,x1,y1,z,color)=>poly([P(x0,y0,z),P(x1,y0,z),P(x1,y1,z),P(x0,y1,z)],color);
const plate=(P,x,y,z,w,h,color,side="y",opacity=1)=>poly(side==="y"?[P(x,y,z),P(x+w,y,z),P(x+w,y,z+h),P(x,y,z+h)]:[P(x,y,z),P(x,y+w,z),P(x,y+w,z+h),P(x,y,z+h)],color,opacity);
const beam=(P,a,b,width,color=WOOD)=>{
  // A projected timber/steel member, with a second edge for thickness.
  const t=seg(P(...a),P(...b),color[2],width+1.1);
  return t+seg(P(...a),P(...b),color[0],width);
};
function gable(P,x,y,L,W,z,peak,k,colors=TILE,detail=2){
  if(k<=0)return "";
  const end=x-L+2*L*k;
  let s=poly([P(x-L,y-W,z),P(end,y-W,z),P(end,y,peak),P(x-L,y,peak)],colors[2]);
  s+=poly([P(x-L,y,peak),P(end,y,peak),P(end,y+W,z),P(x-L,y+W,z)],colors[0]);
  s+=poly([P(end,y-W,z),P(end,y+W,z),P(end,y,peak)],colors[1]);
  if(detail>0)for(let t=.12;t<1;t+=.16)s+=seg(P(x-L,y+W*t,peak-(peak-z)*t),P(end,y+W*t,peak-(peak-z)*t),colors[1],.65);
  if(detail>1)for(let u=x-L+.2;u<end;u+=.3)s+=seg(P(u,y,peak+.01),P(u,y+W,z+.01),colors[1],.45);
  return s+seg(P(x-L,y,peak+.03),P(end,y,peak+.03),colors[1],1.3);
}
function window(P,x,y,z,w,h,lit,side="y",paper=false){
  let s=plate(P,x,y,z,w,h,WOOD[2],side);
  const offset=.06;
  s+=plate(P,side==="y"?x+offset:x+.004,side==="y"?y+.004:y+offset,z+offset,w-2*offset,h-2*offset,lit?LIT:paper?"#e7dfc9":"#99b8ba",side);
  const point=(u,v)=>side==="y"?P(x+u,y+.01,z+v):P(x+.01,y+u,z+v);
  s+=seg(point(w/2,0),point(w/2,h),WOOD[2],.7)+seg(point(0,h/2),point(w,h/2),WOOD[2],.7);
  return s;
}
function leaves(P,x,y,z,r){
  const colors=["#7d9a6c","#64885d","#50774f"];
  return lathe(P,x,y,[[0,z-r*.55],[r*.75,z-r*.4],[r,z],[r*.75,z+r*.5],[0,z+r*.75]],colors,{n:10});
}
function treehouse(P,k,lit,detail){
  let s=box(P,-1.7,-.9,-1.32,-.5,0,5.3,WOOD);
  s+=beam(P,[-1.5,-.7,3.5],[-2.1,-.45,5.5],2.2);
  s+=leaves(P,-1.65,-.8,5.55,1.25)+leaves(P,-2.2,-.25,5.25,.8)+leaves(P,-.8,-1.1,5.95,.8);
  const foot=k.base||0,frame=k.frame||0,walls=k.skin||0,roof=k.roof||0,fit=k.fit||0;
  for(const [x,y] of [[-1.1,-.75],[1.3,-.75],[-1.1,1.05],[1.3,1.05]])if(foot>0){
    s+=box(P,x-.18,y-.18,x+.18,y+.18,0,.22*foot,STONE);
    if(frame>0)s+=box(P,x-.065,y-.065,x+.065,y+.065,.22,.22+1.75*frame,WOOD);
  }
  if(frame>.7){s+=box(P,-1.5,-1.1,1.8,1.5,1.82,1.98,WOOD);
    for(let i=0;i<(detail?13:5);i++){const x=-1.45+i*(detail?.25:.65);s+=seg(P(x,-1.1,1.99),P(x,1.5,1.99),WOOD[2],.45);}}
  if(walls>0){s+=box(P,-1.1,-.75,1.1,.85,1.98,1.98+1.55*walls,WOOD);
    if(detail>0)for(let z=2.2;z<1.98+1.55*walls;z+=.22)s+=seg(P(-1.1,.854,z),P(1.1,.854,z),WOOD[2],.55);
    if(walls>.85)s+=window(P,-.85,.86,2.45,.65,.7,lit)+window(P,1.11,-.5,2.42,.75,.75,lit,"x");}
  s+=gable(P,0,0,1.45,1.15,3.5,4.5,roof,TEAL,detail);
  if(fit>0){
    for(const x of [-1.4,-.7,0,.7,1.7])s+=box(P,x-.04,1.4,x+.04,1.48,1.98,2.55,WOOD);
    s+=seg(P(-1.4,1.44,2.48),P(1.7,1.44,2.48),"#c4b488",1.1)+seg(P(-1.4,1.44,2.25),P(1.7,1.44,2.25),"#c4b488",.8);
    s+=plate(P,.25,.86,1.99,.55,1.25,"#645441");
    for(let i=0;i<8*fit;i++)s+=box(P,1.24,1.5+i*.12,1.75,1.6+i*.12,1.8-i*.23,1.91-i*.23,WOOD);
    s+=box(P,-1.25,1.03,-.65,1.3,1.99,2.21,TEAL);
  }
  return s;
}
function teahouse(P,k,lit,detail){
  let s=quad(P,-2,-1.8,2.1,2.2,.01,"#d2ccb7");
  if(detail)for(let i=0;i<12;i++)s+=seg(P(-1.9,1.45+i*.055,.02),P(.9,1.45+i*.055,.02),"#bdb59d",.45);
  for(const [x,y,r] of [[-1.6,1.5,.23],[1.55,-1.4,.3],[-1.7,-1.2,.15]])s+=lathe(P,x,y,[[r,.03],[r*.8,.24],[0,.32]],STONE,{n:7});
  if(k.base>0)s+=box(P,-1.5,-1.1,1.5,1.3,0,.32*k.base,STONE);
  if(k.frame>0){for(const [x,y] of [[-1.2,-.8],[1.2,-.8],[-1.2,1],[1.2,1]])s+=box(P,x-.055,y-.055,x+.055,y+.055,.32,.32+1.7*k.frame,WOOD);}
  if(k.skin>0){s+=box(P,-1.2,-.8,1.2,1,.32,.32+1.65*k.skin,["#e4dbc3","#d3c8ac","#b9ab8c"]);
    if(k.skin>.9){for(const x of [-1.05,-.3,.45])s+=window(P,x,1.01,.55,.65,1.2,lit,"y",true);s+=window(P,1.21,-.65,.6,1.3,1.15,lit,"x",true);}}
  if(k.roof>0){
    const rings=[[1.65,1.35,2.12],[1.35,1.05,2.02],[.5,.38,2.9],[.08,.08,3.05]];
    for(let j=0;j<3*k.roof;j++){
      const a=rings[j],b=rings[j+1];if(!b)break;
      for(const sy of [-1,1])s+=poly([P(-a[0],sy*a[1],a[2]),P(a[0],sy*a[1],a[2]),P(b[0],sy*b[1],b[2]),P(-b[0],sy*b[1],b[2])],sy>0?TEAL[0]:TEAL[2]);
      for(const sx of [-1,1])s+=poly([P(sx*a[0],-a[1],a[2]),P(sx*a[0],a[1],a[2]),P(sx*b[0],b[1],b[2]),P(sx*b[0],-b[1],b[2])],TEAL[1]);
      if(detail)for(let u=-.8;u<=.8;u+=.2)s+=seg(P(a[0]*u,a[1],a[2]+.01),P(b[0]*u,b[1],b[2]+.01),TEAL[2],.65);
    }
  }
  if(k.fit>0){for(let i=0;i<3;i++)s+=box(P,.4+i*.15,1.45+i*.22,.9+i*.15,1.64+i*.22,0,.07,STONE);
    s+=box(P,1.5,-.2,1.63,.1,.02,.9,WOOD);
    s+=lathe(P,1.56,-.05,[[.18,.75],[.23,.82],[.18,1.04],[0,1.15]],lit?[LIT,"#dfbd75","#9f8454"]:STONE,{n:8});
    s+=quad(P,-.65,.1,.35,.7,.33,"#aaa17a");}
  return s;
}
function watermill(P,k,lit,detail){
  let s=quad(P,-2.3,.95,2.5,2.15,.008,"#7cabb5");
  for(const y of [1,2.05])s+=box(P,-2.3,y,2.5,y+.12,0,.18,STONE);
  if(k.base>0)s+=box(P,-1.45,-1.2,1.45,1,0,.48*k.base,STONE);
  if(k.frame>0)for(const [x,y] of [[-1.3,-1.05],[1.3,-1.05],[-1.3,.9],[1.3,.9]])s+=box(P,x-.07,y-.07,x+.07,y+.07,.48,.48+2.2*k.frame,WOOD);
  if(k.skin>0){s+=box(P,-1.3,-1.05,1.3,.9,.48,.48+2.15*k.skin,["#dcd1b6","#c7b894","#aa9876"]);
    if(k.skin>.9){
      for(const x of [-1.25,0,1.25])s+=box(P,x-.04,.91,x+.04,.98,.48,2.63,WOOD);
      s+=beam(P,[-1.2,.99,.5],[0,.99,2.6],1.2)+beam(P,[0,.99,2.6],[1.2,.99,.5],1.2);
      s+=window(P,.3,.99,1.45,.6,.7,lit)+window(P,1.31,-.8,1.3,.65,.85,lit,"x");}}
  s+=gable(P,0,-.05,1.65,1.3,2.65,3.7,k.roof||0,TILE,detail);
  if(k.fit>0){
    // Axle and two rims in a vertical x/z plane, fixed to the stone bearings.
    const cx=-.45,y=1.48,cz=1.18,r=1.05;
    s+=beam(P,[cx,.7,cz],[cx,1.8,cz],2.5,WOOD);
    for(let i=0;i<24*k.fit;i++){
      const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
      for(const yy of [y-.16,y+.16]){
        s+=seg(P(cx+r*Math.cos(a),yy,cz+r*Math.sin(a)),P(cx+r*Math.cos(b),yy,cz+r*Math.sin(b)),WOOD[2],2.5);
        if(i%2===0)s+=seg(P(cx,yy,cz),P(cx+r*Math.cos(a),yy,cz+r*Math.sin(a)),WOOD[1],1.1);
      }
      s+=beam(P,[cx+r*Math.cos(a),y-.2,cz+r*Math.sin(a)],[cx+r*Math.cos(a),y+.2,cz+r*Math.sin(a)],2,WOOD);
    }
    s+=plate(P,1.31,.12,.5,.6,1.3,WOOD[2],"x");
    if(detail)for(let i=0;i<6;i++)s+=seg(P(-1.8+i*.65,1.5,.02),P(-1.5+i*.65,1.5,.02),"#d7e9e5",.8);
  }
  return s;
}
function station(P,k,lit,detail){
  let s="";
  if(k.base>0){s+=box(P,-2.25,-1.25,2.25,1.4,0,.3*k.base,STONE);
    for(const y of [1.72,2.25])s+=seg(P(-2.6,y,.07),P(2.6,y,.07),STEEL[2],1.6);
    for(let x=-2.5;x<2.6;x+=.25)s+=box(P,x,1.55,x+.1,2.42,0,.05,WOOD);}
  if(k.frame>0)for(const x of [-1.7,1.7])for(const y of [-.9,.6])s+=box(P,x-.07,y-.07,x+.07,y+.07,.3,.3+1.9*k.frame,WOOD);
  if(k.skin>0){s+=box(P,-1.7,-.9,1.7,.6,.3,.3+1.85*k.skin,["#e3c8a5","#cba781","#af8967"]);
    if(k.skin>.85){for(const x of [-1.35,.65])s+=window(P,x,.61,.8,.7,1,lit);s+=plate(P,-.25,.62,.31,.5,1.5,TEAL[2]);
      if(detail)for(let z=.5;z<2.1;z+=.22)s+=seg(P(-1.7,.615,z),P(1.7,.615,z),"#b69473",.45);}}
  s+=gable(P,0,-.15,1.96,1.05,2.2,3.3,k.roof||0,TILE,detail);
  if(k.fit>0){
    for(const x of [-1.8,1.8])s+=box(P,x-.045,1.15,x+.045,1.24,.3,2.05,STEEL);
    s+=poly([P(-2.05,.6,2.2),P(2.05,.6,2.2),P(2.05,1.4,2),P(-2.05,1.4,2)],TEAL[0]);
    s+=box(P,-.45,-.2,.45,.4,2.7,3.35,STONE)+gable(P,0,.1,.55,.45,3.35,3.7,1,TILE,detail);
    const c=P(0,.41,3.05),edge=P(.2,.41,3.05),r=Math.hypot(c[0]-edge[0],c[1]-edge[1]);
    s+=ellipse(c[0],c[1],r,r,lit?LIT:"#eee4cf")+seg(c,P(0,.415,3.21),STEEL[2],.85)+seg(c,P(.15,.415,3.05),STEEL[2],.85);
    for(const x of [-1.5,.8]){s+=box(P,x,.9,x+.6,1.12,.55,.64,WOOD);for(const xx of [x+.07,x+.5])s+=box(P,xx,.92,xx+.05,1.06,.3,.55,STEEL);}
  }
  return s;
}
function planetarium(P,k,lit,detail){
  let s="";
  if(k.base>0)s+=lathe(P,0,0,[[1.7,0],[1.7,.35*k.base]],STONE,{n:24});
  if(k.frame>0)for(let i=0;i<12*k.frame;i++){const a=i*Math.PI/6;const x=1.48*Math.cos(a),y=1.48*Math.sin(a);s+=box(P,x-.05,y-.05,x+.05,y+.05,.35,1.85,STEEL);}
  if(k.skin>0)s+=lathe(P,0,0,[[1.55,.35],[1.55,.35+1.45*k.skin]],TEAL,{n:24});
  if(k.roof>0){const prof=domeProfile(1.65,1.8,1.7,10);s+=lathe(P,0,0,prof,["#9299ae","#707a94","#555f7c"],{n:detail>1?32:20,upto:1.8+1.7*k.roof});
    for(const z of [1.87,2.35,2.9])if(z<1.8+1.7*k.roof){const r=1.65*Math.sqrt(1-((z-1.8)/1.7)**2);s+=lathe(P,0,0,[[r,z],[r,z+.035]],COPPER,{n:24});}}
  if(k.fit>0){
    s+=box(P,-.65,1,.65,1.9,0,1.15,STONE)+gable(P,0,1.45,.78,.58,1.15,1.5,1,COPPER,detail);
    s+=plate(P,-.29,1.91,.05,.58,.9,STEEL[2]);
    for(let i=0;i<8;i++){const a=.08+i*.18,x=1.56*Math.cos(a),y=1.56*Math.sin(a),z=.85+(i%3)*.18,c=P(x,y,z),r=Math.max(.6,Math.abs(P(x+.04,y,z)[0]-c[0]));s+=ellipse(c[0],c[1],r,r,lit?LIT:"#dbbf85");if(i>0)s+=seg(P(1.56*Math.cos(a-.18),1.56*Math.sin(a-.18),.85+((i-1)%3)*.18),c,COPPER[0],.65);}
    s+=box(P,1.6,.55,1.9,.85,0,.6,STONE);
    s+=lathe(P,1.75,.7,[[0,.68],[.2,.76],[.26,.94],[.2,1.12],[0,1.2]],COPPER,{n:12});
    const ring=Array.from({length:25},(_,i)=>{const a=i*Math.PI/12;return P(1.75+.4*Math.cos(a),.7+.32*Math.sin(a),.94+.1*Math.sin(a));});
    for(let i=1;i<ring.length;i++)s+=seg(ring[i-1],ring[i],COPPER[0],1.1);
  }
  return s;
}
function crystal(P,k,lit,detail){
  let s="";
  if(k.base>0)s+=box(P,-1.8,-1.4,1.8,1.4,0,.3*k.base,STONE);
  const pts=[[-1.55,-1.1],[1.55,-1.1],[1.55,1.1],[-1.55,1.1]];
  if(k.frame>0){for(const [x,y] of pts)s+=box(P,x-.045,y-.045,x+.045,y+.045,.3,.3+2.6*k.frame,STEEL);
    if(k.frame>.8){s+=beam(P,[-1.55,1.1,.3],[1.55,1.1,2.9],1.1,STEEL)+beam(P,[1.55,1.1,.3],[-1.55,1.1,2.9],1.1,STEEL);}}
  if(k.skin>0){
    // Books stand behind the glass, so the collection stays visible at night.
    if(k.skin>.5)for(const z of [.65,1.35,2.05]){
      s+=box(P,-1.4,-.75,1.4,-.5,z,z+.08,WOOD);
      if(detail)for(let i=0;i<13;i++){
        const color=["#b98b74","#809c94","#9894ad","#c0ad7e"][i%4];
        s+=box(P,-1.35+i*.2,-.68,-1.22+i*.2,-.5,z+.08,z+.35+(i%3)*.06,[color,color,color]);
      }
    }
    const top=.3+2.6*k.skin;
    s+=plate(P,-1.55,1.11,.3,3.1,top-.3,lit?"#b4c7b3":"#a5c6ca","y",.48);
    s+=plate(P,1.56,-1.1,.3,2.2,top-.3,lit?"#d2cba1":"#7da8b3","x",.48);
    // Slender mullions and diagonal braces remain in front of the glazing.
    for(let x=-1.55;x<=1.56;x+=.62)s+=seg(P(x,1.125,.3),P(x,1.125,top),STEEL[2],.8);
    if(k.skin>.9){s+=beam(P,[-1.55,1.13,.3],[1.55,1.13,2.9],1.1,STEEL)+beam(P,[1.55,1.13,.3],[-1.55,1.13,2.9],1.1,STEEL);}
  }
  if(k.roof>0){
    const a=P(-1.75,-1.3,2.9),b=P(1.75,-1.3,2.9),c=P(1.75,1.3,2.9),d=P(-1.75,1.3,2.9),peak=P(.15,-.15,4.5*k.roof+2.9*(1-k.roof));
    for(const [u,v,color] of [[a,b,"#94b8c5"],[b,c,"#739da9"],[c,d,"#c1d9d2"],[d,a,"#a5c6d0"]])s+=poly([u,v,peak],color)+seg(v,peak,STEEL[1],1.2);
    if(detail>0)s+=seg(P(-1.75,0,2.9),peak,"#edf2e5",.7);
  }
  if(k.fit>0){s+=plate(P,-.35,1.14,.3,.7,1.45,lit?LIT:"#e0d9bc");s+=seg(P(0,1.15,.3),P(0,1.15,1.75),STEEL[2],.8);
    for(const x of [-1.2,.65])s+=box(P,x,1.55,x+.55,1.85,0,.35,WOOD)+leaves(P,x+.27,1.7,.6,.3);
    s+=box(P,-.6,1.4,.6,1.75,0,.14,STONE);}
  return s;
}

function design({draw,height,wallTop,reach,labels,info,material="timber"}){
  const keys=["base","frame","skin","roof","fit","handover"],done=Object.fromEntries(keys.map(k=>[k,1]));
  return {
    system:"discovery",ridge:height-wallTop,
    info:Object.fromEntries(["base","frame","skin","roof","fit"].map((key,i)=>[key,info[i]])),
    spec:()=>({hw:reach-.35,h:wallTop-.3,floors:1,wall:{faces:STONE,grain:"#9c927f",pattern:"discovery"},roof:TEAL}),
    ground:["mobilize","layout"],
    steps:[
      {key:"base",label:labels[0],w:1.6,cost:3,stock:"stone"},
      {key:"frame",label:labels[1],w:2.2,cost:7,lift:true,liftAs:material==="steel"?"steelBeam":"studs",stock:material,inspect:"taşıyıcı bağlantıları ve şakul",next:"kaplamaya geçilebilir"},
      {key:"skin",label:labels[2],w:2.1,cost:6,stock:material},
    ],frameEnd:.65,
    later:[
      {key:"roof",label:labels[3],a:.65,b:.8,cost:5,lift:true,liftAs:"roofFrame",stock:material},
      {key:"fit",label:labels[4],a:.8,b:.93,cost:4,inspect:"son bağlantılar ve güvenli kullanım",next:"teslime hazır"},
      {key:"handover",label:"Çevre düzeni, son kontrol ve teslim",a:.93,b:1,cost:2},
    ],craneEnd:.82,shadowFrom:"frame",
    scene:(P,sp,plan,shown,lit)=>draw(P,progress(plan,shown),lit,2),
    shadow:(P,sp,t)=>castShadow(P,rectOutline(-reach,-reach,reach,reach),height*.35*t),
    building(P,sp,seed,{lit=false,detail=2,shadowP=P}={}){return(detail?castShadow(shadowP,rectOutline(-reach,-reach,reach,reach),height*.35):"")+draw(P,done,lit,detail);},
    workHeight:(sp,p,k)=>p.key==="frame"?wallTop*k:p.key==="roof"?wallTop+(height-wallTop)*k:p.key==="base"?.2:wallTop*.6,
    crew:(sp,p,k)=>[at(-.75,reach-.2,Math.max(0,(p.key==="roof"?wallTop:0)),p.key==="frame"?"hammer":"carry"),at(.75,reach,0,"carry")],
    metraj:(sp,p,k)=>p.key==="base"?{stone:k*2.8}:p.key==="frame"||p.key==="roof"?material==="steel"?{steel:k*(p.key==="frame"?.65:.3)}:{timber:k*(p.key==="frame"?1.2:.6)}:p.key==="skin"?{timber:k*.6}:{},
    items:(q,num)=>[`Taş ${num(q.stone||0)} m³`,material==="steel"?`Çelik ${num(q.steel,2)} t`:`Kereste ${num(q.timber,2)} m³`],
  };
}
export const DISCOVERY_BUILDINGS={
  treehouse:design({info:["Ağacın köklerine beton dökmek yerine kaideler kök bölgesinin dışında kurulur. Evin bütün ağırlığını bağımsız ayaklar taşır; ağacın gövdesine çivi çakılmaz.", "Dikmeler, çaprazlar ve taban kirişleri birleştirilir. Çaprazlar sallanmayı sınırlar; balkon henüz döşenmeden bağlantılar ve diklik kontrol edilir.", "Hafif ahşap duvarlar tabanın üzerinde kurulur. Pencere doğramaları takılır; suyun içeri yürümemesi için birleşimlere damlalık bırakılır.", "Mertekler ve hafif metal örtü takılır. Saçaklar ahşabı yağmurdan korur; ağaç büyürken çatının ona sürtünmemesi için gövde çevresinde boşluk bırakılır.", "Balkona dikmeler ve ip korkuluk, girişe basamaklar yapılır. Açıklıklar ve bağlantılar kontrol edilir; okuma bankı en son yerine konur."],draw:treehouse,height:6.9,wallTop:3.5,reach:2.8,labels:["Köklerden uzakta taş kaideler","Bağımsız ayaklar, çaprazlar ve balkon tabanı","Ahşap oda ve pencere doğramaları","Hafif ahşap çatı ve metal kaplama","İp korkuluk, basamaklar ve okuma bankı"]}),
  teahouse:design({info:["Taş kaide zeminden yükseltilir; ahşap taban nemli toprağa değmez. Alt boşluktan hava geçmesi kerestenin kuru kalmasına yardım eder.", "Ahşap dikmeler ve geçme kirişler çatıyı taşıyan çerçeveyi kurar. Paneller yük taşımadığı için önce bu çerçevenin sağlamlığı kontrol edilir.", "Shoji, ince ahşap ızgaranın üzerine gerilen yarı geçirgen paneldir. Işığı yumuşatır; dış cephedeki koruyucu katman ve saçak kâğıdı yağmurdan uzak tutar.", "Merteklerin uçları geniş saçak oluşturur. Kiremitler aşağıdan yukarı döşenir; üstteki kiremit alttakini örter, yağmur birleşimden içeri girmez.", "Taşlar yürüyüş yoluna sabitlenir, fener yerleştirilir ve çakıl bahçesi taranır. Yolun kaymaması, basamakların görünmesi ve aydınlatma kontrol edilir."],draw:teahouse,height:3.1,wallTop:2,reach:2.3,labels:["Taş kaide ve yükseltilmiş taban","Ahşap dikmeler ve geçme kirişler","Shoji çerçeveler ve kâğıt paneller","Kıvrık saçak, mertek ve kiremitler","Taş patika, fener ve zen bahçesi"]}),
  watermill:design({info:["Dere akışı kesilmeden çalışma alanı ayrılır, taş temeller ve kanal kenarları yapılır. Su yapı tabanına kaçırılmadan çarka ulaştırılmalıdır.", "Taş tabanın üstüne ahşap dikmeler ve çaprazlar kurulur. Çaprazlar çarkın titreşimi ile rüzgârdan gelen yatay kuvvetlere karşı çerçeveyi dengeler.", "Karkas arası hafif dolgu ile kapanır, kapı ve pencereler takılır. Ahşap ile taş birleşimlerinde nemin dışarı çıkabileceği ayrıntılar bırakılır.", "Merteklerin üstüne kiremit örtü yapılır. Saçak ve oluklar yağmuru kanala yönlendirirken duvarların sürekli ıslanmasını önler.", "Mil yatakları hizalanır; iki çark halkası, kollar ve su kanatları sırayla birleştirilir. Kanala sürtünme ve dönmeye engel bağlantı olup olmadığı kontrol edilir."],draw:watermill,height:3.75,wallTop:2.65,reach:2.5,labels:["Dere yatağının korunması ve taş temel","Ahşap karkas ve çapraz bağlantılar","Dolgu duvarlar ve doğramalar","Mertekler ve kiremit çatı","Mil, çark halkaları ve su kanatları"]}),
  station:design({info:["Taş peron kotuna getirilir, raylar traverslerin üstüne bağlanır. Traversler ray aralığını sabit tutar; peron kenarı ile ray arasında güvenli boşluk bırakılır.", "İstasyonun dikmeleri ve duvar hatılları kurulur. Hatıllar duvar parçalarını bağlar; geniş pencere ve kapı boşluklarının üstünü kirişler taşır.", "Tuğla dolgu ve doğramalar tamamlanır. Perona açılan giriş boşluğu korunur; yağmur suyunun kapı altında birikmemesi için eşik kotu ayarlanır.", "Ahşap çatı makasları ve kiremitler takılır. Oluklar yağmuru peronun yürüyüş çizgisinden uzağa götürür.", "İnce çelik direklere peron saçağı bağlanır, saat ve banklar yerleştirilir. Saçak bağlantıları ile peron geçişlerinin açık kalması son kez kontrol edilir."],draw:station,height:3.75,wallTop:2.2,reach:2.7,labels:["Taş peron ve traversli ray hattı","İstasyon taşıyıcıları ve duvar hatılları","Tuğla dolgu, kapı ve pencereler","Kiremit çatı, yağmur olukları","Peron saçağı, saat kulesi ve banklar"]}),
  planetarium:design({info:["Dairesel yapının tabanı ve çevre kaidesi aynı kotta hazırlanır. Çatıdan gelen kuvvetlerin temele düzenli dağılması için çevre ankrajları ölçülür.", "Çevre kolonları üstte çelik bir halka ile bağlanır. Bu halka kubbenin dışa açılma isteğini toplar; birleşimler kapanmadan önce kontrol edilir.", "Kavisli cepheye yalıtımlı paneller takılır. İçeride gökyüzü gösterisi yapılacağı için istenmeyen ışık ve su girişini önleyen katmanlar tamamlanır.", "Kubbe dilimleri halka üzerine sırayla bağlanır. Bakır kuşaklar birleşimleri örter; ısının etkisiyle uzayan metalin hareket edebileceği pay bırakılır.", "Giriş pavyonu ve aydınlatma kurulur, cepheye takımyıldız işaretleri ve küçük Satürn heykeli yerleştirilir. Kapılar ve güvenli çıkışlar kontrol edilir."],draw:planetarium,height:3.55,wallTop:1.8,reach:2.4,material:"steel",labels:["Dairesel temel ve taş kaide","Çevre kolonları ve çelik halka","Yalıtımlı dış kabuk panelleri","Kubbe dilimleri ve bakır kuşaklar","Giriş, takımyıldızlar ve Satürn heykeli"]}),
  crystallibrary:design({info:["Taş platform hazırlanır, çelik ayakların ankraj yuvaları ölçülür. Cephe suyu okuma salonuna yönelmesin diye giriş çevresinde dışa eğim bırakılır.", "Çelik kolonlar ve çaprazlar bağlanır. Çaprazlar cam panellere taşıyıcılık yüklemeden rüzgâr kuvvetlerini temele aktarır; cıvatalar kontrol edilir.", "Kitap rafları yerleştirilir, güvenli cam paneller ince kayıtlara oturtulur. Cam ile metal arasındaki contalar su sızmasını ve sert teması önler.", "Katlanan çatı yüzeyleri tek tek monte edilir. Köşe birleşimlerinin su tahliyesi ve cam panellerin taşınması için gereken mesnetler tamamlanır.", "Giriş kapıları, okuma ışıkları ve saksılar yerleştirilir. Cam kenarları, açık kaçış yolu ve gece aydınlatması kontrol edilince yapı teslim edilir."],draw:crystal,height:4.55,wallTop:2.9,reach:2.3,material:"steel",labels:["Taş platform ve ankraj yuvaları","Çelik kolonlar ve çapraz bağlantılar","Kitap rafları, cam cephe ve kayıtlar","Kristal çatı: katlanmış cam yüzeyler","Giriş, okuma ışıkları ve saksılar"]}),
};
