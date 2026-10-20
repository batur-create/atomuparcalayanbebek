import React, { memo, useEffect, useRef, useState } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { drawImece } from "./imeceArt.js";
import { useCanvas, useSVG } from "./iso.js";
import { useZoom } from "./zoom.js";

const zones = {
  hall: { name: "Mozoleye yaklaş", bounds: [-2.60,-2.55,1.20,1.15], screen: [-2,-2.65,1.25,.45] },
  court: { name: "Tören meydanı", bounds: [-2.60,-2.90,5.75,1.50] },
  all: { name: "Bütün yerleşim", bounds: [-2.60,-2.90,5.75,10.10] },
  flag: { name: "Türk bayrağı", bounds: [2.5,-3,3.5,-2], screen: [4.55,-1.09,5.05,-.69], after: 1925 },
};
const project=(x,y,z=0)=>[(x-y)*.866,(x+y)*.5-z];
export const ImeceScene = memo(function ImeceScene({ minutes, complete }) {
  const canvas=useRef(null), [zone,setZone]=useState("hall"), [size,setSize]=useState([0,0]);
  const zoom=useZoom({wheel:false});
  useEffect(()=>{
    const el=zoom.box.current;
    const ro=new ResizeObserver(()=>{zoom.reset();setSize([el.clientWidth,el.clientHeight]);});
    ro.observe(el); return()=>ro.disconnect();
  },[]);
  useEffect(()=>{
    const [w,h]=size;
    if(!w||!h)return;
    const frame=requestAnimationFrame(()=>{
      const c=canvas.current,dpr=Math.min(devicePixelRatio||1,2),ctx=c.getContext("2d");
      c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.scale(dpr,dpr);
      ctx.fillStyle="#9db77f";ctx.fillRect(0,0,w,h);
      const [x0,y0,x1,y1]=zones[zone].bounds;
      const points=[project(x0,y0),project(x0,y1),project(x1,y0),project(x1,y1),project(x0,y0,1.1)];
      const [left,top,right,bottom]=zones[zone].screen||[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
      const s=Math.min((w-28)/(right-left),(h-50)/(bottom-top))*zoom.view.s;
      const cx=w/2-(left+right)*s/2+zoom.view.x,cy=h/2-(top+bottom)*s/2+zoom.view.y;
      const P=(x,y,z)=>{const p=project(x,y,z);return [cx+p[0]*s,cy+p[1]*s];};
      const start=performance.now();
      useCanvas(ctx,c=>c,Math.max(.32,Math.min(1.1,s/100)));
      try{drawImece(P,minutes,{detail:s>40?2:1});}finally{useSVG();}
      c.dataset.renderMs=(performance.now()-start).toFixed(1);
    });
    return()=>cancelAnimationFrame(frame);
  },[minutes,zone,size,zoom.view]);
  return <section className="imece-scene" aria-label="Bütün köylerin ortak Anıtkabir şantiyesi">
    <div className="imece-views" role="group" aria-label="Anıtın görünümü">
      {Object.entries(zones).map(([key,z])=><button key={key} type="button" aria-pressed={zone===key} disabled={minutes<(z.after||0)} title={minutes<(z.after||0)?"Bayrak direği son bölümde inşa edilecek":undefined} onClick={()=>{setZone(key);zoom.reset();}}>{z.name}</button>)}
    </div>
    <div className="imece-canvas-wrap" ref={zoom.box} {...zoom.handlers}>
      <canvas ref={canvas} aria-label={`Anıtkabir ${complete?"tamamlandı":`şantiyesi: ${minutes} dakika ortak emek`}`} />
      <span className="imece-site-label">{complete?"Hepimizin eseri":"ORTAK ŞANTİYE"} · {Math.floor(minutes/20)}%</span>
      <div className="imece-map-tools">
        <button type="button" aria-label="Anıta yaklaş" onPointerDown={e=>e.stopPropagation()} onClick={zoom.zoomIn}><Plus size={19}/></button>
        <button type="button" aria-label="Anıttan uzaklaş" onPointerDown={e=>e.stopPropagation()} onClick={zoom.zoomOut}><Minus size={19}/></button>
        <button type="button" aria-label="Anıtı ortala" onPointerDown={e=>e.stopPropagation()} onClick={zoom.reset}><LocateFixed size={19}/></button>
      </div>
    </div>
    <p className="imece-map-help">İki parmakla yakınlaş; yakındayken sürükle. Aslanlı Yol için “Bütün yerleşim”i aç. Bu alan bütün köylerde aynı şantiyeyi gösterir.</p>
  </section>;
});
