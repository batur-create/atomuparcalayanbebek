import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Check, FastForward, LocateFixed, Minus, Pause, Play, Plus } from "lucide-react";
import { drawImece, drawImeceFlag } from "./imeceArt.js";
import { drawImeceLive } from "./imeceLive.js";
import { IMECE_TOUR_MS, imeceJobAt, imeceReplay, imeceReplayAt, imeceTourAt } from "./imeceMotion.js";
import { useImeceActivity, useImecePlayback } from "./useImecePlayback.js";
import { useCanvas, useSVG } from "./iso.js";
import { useZoom } from "./zoom.js";
import { Avatar } from "./ui.jsx";

const zones = {
  hall: { name: "Mozoleye yaklaş", bounds: [-2.60,-2.55,1.20,1.15], screen: [-2,-2.65,1.25,.45] },
  work: { name: "İş başına yaklaş" },
  court: { name: "Tören meydanı", bounds: [-2.60,-2.90,5.75,1.50] },
  road: { name: "Aslanlı Yol", bounds: [1.80,1.15,3.80,10.10] },
  all: { name: "Bütün yerleşim", bounds: [-2.60,-2.90,5.75,10.10] },
  flag: { name: "Türk bayrağı", bounds: [2.5,-3,3.5,-2], screen: [4.55,-1.09,5.05,-.69], after: 1925 },
};
const project=(x,y,z=0)=>[(x-y)*.866,(x+y)*.5-z];
const EMPTY=[];

export const ImeceScene = memo(function ImeceScene({ minutes, complete, crew=EMPTY, replay, onReplayDone }) {
  const canvas=useRef(null),live=useRef(null),plane=useRef(null),notified=useRef(null),liveTime=useRef(0);
  const pauseButton=useRef(null),continueButton=useRef(null),firstView=useRef(null);
  const [zone,setZone]=useState("hall"),[size,setSize]=useState([0,0]);
  const zoom=useZoom({wheel:false});
  const activity=useImeceActivity(zoom.box);
  const film=useImecePlayback(activity),{playback,elapsed,done,paused}=film;
  const touring=playback?.kind==="tour",building=playback?.kind==="build",playing=!!playback&&!done;
  const sample=building?imeceReplayAt(playback.plan,elapsed):null;
  const shownMinutes=sample?.minutes??minutes,job=imeceJobAt(shownMinutes);
  const stop=touring?imeceTourAt(elapsed):null;
  const viewZone=touring?stop.zone:building&&!done?"work":zone;
  const clothLive=shownMinutes>=1950;
  const people=useMemo(()=>building&&!done?crew:complete?EMPTY:crew.filter(p=>p.working),[crew,building,done,complete]);
  const peopleKey=people.map(p=>`${p.slot}:${p.working?.ends||0}`).join("|");
  const latest=useRef(null);
  latest.current={job,people,film,touring,playing,clothLive,building};

  useEffect(()=>{
    if(replay&&!replay.done){const plan=imeceReplay(replay.from,replay.to);film.start({kind:"build",plan,duration:plan.duration});zoom.reset();zoom.box.current?.scrollIntoView({block:"center",behavior:"auto"});}
    else if(!replay&&playback?.kind==="build")film.clear();
  },[replay?.key]);
  useEffect(()=>{
    if(building&&done&&notified.current!==playback.key){notified.current=playback.key;onReplayDone?.();}
  },[building,done,playback?.key,onReplayDone]);
  useEffect(()=>{
    if(playback)(done?continueButton:pauseButton).current?.focus({preventScroll:true});
  },[playback?.key,done]);
  useEffect(()=>{
    const el=zoom.box.current;
    const ro=new ResizeObserver(()=>{zoom.reset();setSize([el.clientWidth,el.clientHeight]);});
    ro.observe(el);return()=>ro.disconnect();
  },[]);

  const projection=useMemo(()=>{
    const [w,h]=size;if(!w||!h)return null;
    let limits=zones[viewZone].screen;
    if(viewZone==="work"){
      const [x,y]=project(...job.site);
      const wide=job.kind==="dig"||job.kind==="lift",half=wide?.62:.44;
      limits=[x-half,y-.40,x+half,y+.38];
    }else if(!limits){
      const [x0,y0,x1,y1]=zones[viewZone].bounds;
      const points=[project(x0,y0),project(x0,y1),project(x1,y0),project(x1,y1),project(x0,y0,1.1)];
      limits=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
    }
    const [left,top,right,bottom]=limits;
    const s=Math.min((w-28)/(right-left),(h-50)/(bottom-top))*zoom.view.s;
    const cx=w/2-(left+right)*s/2+zoom.view.x,cy=h/2-(top+bottom)*s/2+zoom.view.y;
    const P=(x,y,z=0)=>{const p=project(x,y,z);return[cx+p[0]*s,cy+p[1]*s];};
    return {w,h,s,P,dpr:Math.min(devicePixelRatio||1,2)};
  },[size,viewZone,viewZone==="work"?job.id:null,zoom.view]);

  useEffect(()=>{
    if(!projection)return;
    const frame=requestAnimationFrame(()=>{
      const {w,h,s,P,dpr}=projection,c=canvas.current,ctx=c.getContext("2d");
      c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.scale(dpr,dpr);
      ctx.fillStyle="#9db77f";ctx.fillRect(0,0,w,h);
      const start=performance.now();
      useCanvas(ctx,c=>c,Math.max(.32,Math.min(1.1,s/100)));
      try{drawImece(P,shownMinutes,{detail:s>40?2:1,flagCloth:false});}finally{useSVG();}
      c.dataset.renderMs=(performance.now()-start).toFixed(1);
      c.dataset.draws=String(Number(c.dataset.draws||0)+1);
    });
    return()=>cancelAnimationFrame(frame);
  },[shownMinutes,projection]);

  useEffect(()=>{
    if(!projection)return;
    const {w,h,s,P,dpr}=projection,c=live.current,ctx=c.getContext("2d");
    c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.scale(dpr,dpr);
    let frame,last=performance.now(),painted=0;
    const fps=matchMedia("(pointer:coarse)").matches?18:24;
    const moving=activity.visible&&activity.motion!=="still"&&!paused&&(activity.motion==="full"||playing);
    const draw=()=>{
      const state=latest.current;
      const actors=state.people.filter(p=>state.building||p.working?.ends>Date.now());
      ctx.clearRect(0,0,w,h);
      drawImeceLive(ctx,P,state.job,actors,liveTime.current);
      if(state.clothLive){
        useCanvas(ctx,c=>c,Math.max(.32,Math.min(1.1,s/100)));
        try{drawImeceFlag(P,liveTime.current);}finally{useSVG();}
      }
      if(state.touring&&state.playing&&activity.motion!=="still"){
        const t=(state.film.clock.current%3000)/3000;
        plane.current.style.transform=`scale(${1.015+t*.035})`;
      }else plane.current.style.transform="";
      c.dataset.frames=String(Number(c.dataset.frames||0)+1);
      c.dataset.actors=String(actors.length);
      return actors.length>0||state.clothLive||state.playing;
    };
    const alive=draw();
    c.dataset.state=moving&&alive?"running":activity.visible?"resting":"offscreen";
    if(!moving||!alive)return;
    const tick=now=>{
      liveTime.current+=(now-last)/1000*(building?1.8:1);last=now;
      if(now-painted>=1000/fps){painted=now;if(!draw()){c.dataset.state="resting";return;}}
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[projection,job.id,peopleKey,clothLive,activity.visible,activity.motion,paused,playing,building]);

  const startTour=()=>{if(!complete||playing)return;film.start({kind:"tour",duration:IMECE_TOUR_MS});zoom.reset();zoom.box.current?.scrollIntoView({block:"center",behavior:"auto"});};
  const leaveFilm=()=>{film.clear();firstView.current?.focus({preventScroll:true});};
  const activeNames=people.filter(p=>building||p.working?.ends>Date.now()).map(p=>p.name);
  const sceneComplete=shownMinutes>=2000&&complete;
  return <section className="imece-scene" aria-label="Bütün köylerin ortak Anıtkabir şantiyesi">
    {complete&&<div className="imece-opening"><div><span className="imece-eyebrow">DÖRT İMZA · TEK ESER</span><strong>Bu açılış hepimizin.</strong><p>Kara: “Birimizin değil, dördümüzün eseri. Gel, birlikte yürüyelim.”</p></div><button type="button" className="btn primary" disabled={playing} onClick={startTour}><Play size={17}/>{activity.motion==="still"?"Açılış defterini aç":touring&&done?"Açılışı yeniden izle":"Açılış turunu izle · 15 sn"}</button></div>}
    <div className="imece-views" role="group" aria-label="Anıtın görünümü">
      {Object.entries(zones).map(([key,z])=><button ref={key==="hall"?firstView:undefined} key={key} type="button" aria-pressed={viewZone===key} disabled={playing||shownMinutes<(z.after||0)} title={shownMinutes<(z.after||0)?"Bayrak direği son bölümde inşa edilecek":undefined} onClick={()=>{film.clear();setZone(key);zoom.reset();}}>{z.name}</button>)}
    </div>
    <div className="imece-canvas-wrap" ref={zoom.box} {...(!playing?zoom.handlers:{})}>
      <div className="imece-canvas-plane" ref={plane}>
        <canvas className="imece-static" ref={canvas} role="img" aria-label={`Anıtkabir ${sceneComplete?"tamamlandı":`şantiyesi: ${Math.floor(shownMinutes)} dakika ortak emek`}`} />
        <canvas className="imece-live" ref={live} aria-hidden="true" />
      </div>
      <span className="imece-site-label">{touring?"BİRLİKTE BAŞARDIK":building?"HIZLANDIRILMIŞ YAPIM":sceneComplete?"Hepimizin eseri":"ORTAK ŞANTİYE"} · {Math.floor(shownMinutes/20)}%</span>
      {!playing&&<div className="imece-map-tools">
        <button type="button" aria-label="Anıta yaklaş" onPointerDown={e=>e.stopPropagation()} onClick={zoom.zoomIn}><Plus size={19}/></button>
        <button type="button" aria-label="Anıttan uzaklaş" onPointerDown={e=>e.stopPropagation()} onClick={zoom.zoomOut}><Minus size={19}/></button>
        <button type="button" aria-label="Anıtı ortala" onPointerDown={e=>e.stopPropagation()} onClick={zoom.reset}><LocateFixed size={19}/></button>
      </div>}
      {touring&&<div className="imece-tour-caption" role="status"><span>{Math.min(5,Math.floor(elapsed/3000)+1)} / 5 · AÇILIŞ YÜRÜYÜŞÜ</span><strong>{stop.title}</strong><p>{stop.line}</p></div>}
    </div>
    {playback&&<div className="imece-playbar">
      <div><span className="imece-eyebrow">{done?"GÖSTERİ TAMAMLANDI":touring?"ORTAK AÇILIŞ":"EMEĞİNİN YAPIMI"}</span><strong>{done?touring?"Son taşında hepimiz varız.":"Emeğin şantiyede yerini aldı.":touring?stop.title:sample.job.name}</strong><div className="imece-film-meter" role="progressbar" aria-label="Gösterinin ilerlemesi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(elapsed/playback.duration*100)||0}><span style={{width:`${playback.duration?elapsed/playback.duration*100:100}%`}}/></div></div>
      {!done&&<button ref={pauseButton} type="button" className="btn outline" onClick={film.toggle}>{paused?<Play size={16}/>:<Pause size={16}/>} {paused?"Devam et":"Duraklat"}</button>}
      <button ref={continueButton} type="button" className="btn outline" onClick={done?leaveFilm:film.finish}>{done?<Check size={16}/>:<FastForward size={16}/>} {done?"Gezmeye devam et":"Gösteriyi atla"}</button>
    </div>}
    {!touring&&!sceneComplete&&<div className="imece-site-work"><span className="imece-eyebrow">{building?"YAPIM DEFTERİ":activeNames.length?"ŞU AN İŞ BAŞINDA":"ŞANTİYE DİNLENİYOR"}</span><strong>{job.name}</strong><p>{building||activeNames.length?job.cue:"Yeni seansı beklerken anıtı gezebilirsin. Birlikte çalışınca bu alandaki ekip yeniden iş başına geçer."}</p>{!!activeNames.length&&<small>{activeNames.join(" · ")}{!building?" · Katkı, seans tamamlanınca kaydedilir.":" · Kaydedilmiş emeğin hızlandırılmış yapımı."}</small>}</div>}
    {touring&&done&&<div className="imece-opening-credits"><span className="imece-eyebrow">EMEK DEFTERİ · 2.000 DAKİKA</span><h3>Bu eserde dördümüz varız.</h3><p>Kimse bir başkasının imzasını atmadı. Bu yapıyı birlikte tamamladık.</p><div>{crew.map(person=><article key={person.slot}><Avatar member={person}/><strong>{person.name}</strong><span>{person.minutes} dk emek</span><small>{person.role.name}</small></article>)}</div></div>}
    <p className="imece-map-help">İki parmakla yakınlaş; yakındayken sürükle. “İş başına yaklaş” ile el işçiliğini, “Aslanlı Yol” ile uzun aksı gez. Gösteri ekran dışında duraklar; çalışma süren devam eder.</p>
  </section>;
});
