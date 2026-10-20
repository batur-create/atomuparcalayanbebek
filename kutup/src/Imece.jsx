import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Flag, Hammer, Users } from "lucide-react";
import { api, get } from "./api.js";
import { Avatar, Busy, keepScreenOn, releaseScreen, reducedMotion, storage } from "./ui.jsx";
import { KaraSpot } from "./Kara.jsx";
import { Modal } from "./Modal.jsx";
import { Loading } from "./Illustrations.jsx";
import { IMECE_PERSONAL, IMECE_PHASES } from "../shared/imece.js";
import "./imece.css";

const ImeceScene=lazy(()=>import("./ImeceScene.jsx").then(m=>({default:m.ImeceScene})));
const sum=a=>a.reduce((n,x)=>n+x,0);
const time=n=>n>=60?`${Math.floor(n/60)} sa${n%60?` ${n%60} dk`:""}`:`${n} dk`;
function Meter({value,max,label}){
  return <div className="imece-meter" role="progressbar" aria-label={label} aria-valuenow={Math.min(value,max)} aria-valuemin={0} aria-valuemax={max}><span style={{width:`${Math.min(100,value/max*100)}%`}}/></div>;
}

export function ImeceEntry({me,now,mutate,signal=0,consumeSignal}){
  const [result,setResult]=useState(null),[error,setError]=useState(""),[open,setOpen]=useState(()=>signal>0||new URLSearchParams(location.search).has("imece"));
  const [busy,setBusy]=useState(false),[duration,setDuration]=useState(25),[relaxed,setRelaxed]=useState(true),[intro,setIntro]=useState(true);
  const [replay,setReplay]=useState(null);
  const replayDone=useCallback(()=>setReplay(r=>r?{...r,done:true}:r),[]);
  const controller=useRef(null),epoch=useRef(0),shown=useRef(false);
  const memberId=me?.id;
  const load=useCallback(async()=>{
    if(!memberId||document.hidden)return;
    controller.current?.abort(); const ac=new AbortController();controller.current=ac;
    const turn=epoch.current;
    try{
      const data=await get("/imece",ac.signal);
      if(ac.signal.aborted||turn!==epoch.current)return;
      setResult({memberId,data});setError("");
      if(data?.slot>=0&&!shown.current&&!document.querySelector('[role="dialog"]')&&(data.delivery||!storage.get(`kutup-imece-intro:${memberId}:${data.started}`))){
        shown.current=true;setIntro(!storage.get(`kutup-imece-intro:${memberId}:${data.started}`));setOpen(true);
      }
    }catch(e){if(!ac.signal.aborted&&turn===epoch.current)setError(e.message||"Şantiye okunamadı.");}
  },[memberId]);
  useEffect(()=>{
    epoch.current++;shown.current=false;setResult(null);setError("");setReplay(null);
    load();const timer=setInterval(load,15000);
    document.addEventListener("visibilitychange",load);window.addEventListener("online",load);
    return()=>{epoch.current++;controller.current?.abort();clearInterval(timer);document.removeEventListener("visibilitychange",load);window.removeEventListener("online",load);};
  },[load]);
  useEffect(()=>{load();},[me?.focusEnd]);
  useEffect(()=>{if(signal>0){setOpen(true);consumeSignal?.();}},[signal]);
  const data=result?.memberId===memberId?result.data:null;
  if(!memberId)return null;
  if(!data)return error?<section className="imece-entry"><p>{error}</p><button className="btn outline" onClick={load}>Şantiyeyi yeniden oku</button></section>:null;
  const mine=data.slot>=0?data.crew[data.slot]:null,personal=mine?sum(mine.personal):0;
  const phase=data.phase<0?IMECE_PHASES[2]:IMECE_PHASES[data.phase];
  const current=data.tasks.find(t=>!t.complete);
  const running=me.focusEnd>now,working=running&&!!me.focusImece;
  const choices=[25,50,75].filter(n=>n<=data.capacity.available);
  const length=choices.includes(duration)?duration:choices[0]||25;
  const close=()=>{setOpen(false);setReplay(null);storage.set(`kutup-imece-intro:${memberId}:${data.started}`,"1");};
  const accept=async()=>{setBusy(true);setError("");try{await api("/imece/seen",{through:replay?.through??data.delivery?.through});setReplay(null);await load();}catch(e){setError(e.message);}finally{setBusy(false);}};
  const begin=async()=>{
    setBusy(true);
    if(relaxed)releaseScreen();else keepScreenOn();
    try{
      const r=await mutate("/focus",{action:"start",imece:true,minutes:length,relaxed,device:matchMedia("(pointer:coarse)").matches?"phone":"desk"},`Kara: ${length} dakikalık görev başladı. ${relaxed?"Ekranı kilitleyebilirsin; dönüşte emeğini birlikte göreceğiz.":"Kütüp açık kalsın; seçtiğin seansı tamamlayalım."}`);
      if(r){setIntro(false);storage.set(`kutup-imece-intro:${memberId}:${data.started}`,"1");}
      await load();
    }finally{setBusy(false);}
  };
  const karaLine=data.complete
    ? mine ? `${me.name}, bu kez hepimiz bitirdik. Şu yapıya bak: senin de ${mine.minutes} dakikalık emeğin var. Bu defter burada kalacak.` : "Dört ustanın ortak emeği tamamlandı. Anıtkabir'i ve katkı defterini birlikte gezelim."
    : !mine?"Bütün köylerin ortak Anıtkabir şantiyesine hoş geldin. Dört ustanın emeği burada birleşiyor; yapılan işleri birlikte gezebiliriz."
    : intro?`${me.name}, ortak bir vatani görevimiz var. Anıtkabir'i dört kişi birlikte inşa edeceğiz. ${mine.role.line} Senin kişisel görevin 250 dakika; bugün 25 dakikayla başlayabiliriz.`
    : working?`${me.name}, şu anki görevini ben takip ediyorum. ${me.focusRelaxed?"Rahat seansın bitince dön; hangi işin ilerlediğini göstereceğim.":"Seansını tamamla; birlikte bir parçayı daha yerine koyacağız."}`
    : data.capacity.available<25?`${me.name}, bu bölümde üstüne düşeni yaptın. Sıradaki bölüm için arkadaşlarının kişisel görevleri bekleniyor. Şantiye defterinden birlikte nereye geldiğimize bak.`
    : `${me.name}, ${phase.name} bölümündeyiz. ${personal>=250?"Kişisel görevlerini tamamladın; şimdi ortak işleri paylaşabilirsin.":`Kişisel görevinde ${Math.max(0,250-personal)} dakika kaldı.`} Hazırsan bir seans daha, sonra çay.`;
  return <>
    <button type="button" className="imece-entry" onClick={()=>setOpen(true)}>
      <span className="imece-entry-icon"><Flag size={25}/></span>
      <span className="imece-entry-copy"><small>BÜTÜN KÖYLER · TEK ESER</small><strong>Bir Taş da Senden</strong><span>{data.complete?"Anıtkabir tamamlandı. Emeğimizi gezelim.":`${data.minutes} / 2.000 dk · ${phase.name}`}</span></span>
      <span className="imece-entry-action">{data.complete?"Anıta git":mine?"Görevimi gör":"Şantiyeyi gez"}<ArrowRight size={18}/></span>
    </button>
    {open&&<Modal title="Bir Taş da Senden" subtitle="Bir kişi bitiremez. Son taşında hepimizin emeği olacak." close={close} wide className="imece-modal">
      <div className="imece-kara"><div onClick={()=>setIntro(v=>!v)}><KaraSpot base="build" lines={[{text:karaLine}]} context={{id:`imece-${memberId}`,surface:"ledge"}}/></div><div><span className="imece-eyebrow">KARA’DAN {intro?"GÖREV MEKTUBU":"ŞANTİYE NOTU"}</span><p>{karaLine}</p><button className="text-button" onClick={()=>{setIntro(v=>!v);document.querySelector(intro?"#imece-mission":".imece-kara")?.scrollIntoView({behavior:reducedMotion()?"auto":"smooth",block:"start"});}}>{intro?"Anladım, görevime bakalım":"Kara, görevi tekrar anlat"}</button></div></div>
      <div className="imece-totals"><div><small>Ortak emek</small><strong>{time(data.minutes)} <span>/ 33 sa 20 dk</span></strong><Meter value={data.minutes} max={2000} label="Anıtkabir ortak çalışma hedefi"/></div><div><small>Senin kişisel görevin</small><strong>{mine?`${personal} / ${IMECE_PERSONAL} dk`:"Şantiye ziyaretçisi"}</strong><Meter value={personal} max={250} label="Kişisel zorunlu görev"/></div></div>
      {error&&<p className="form-error" role="alert">{error} <button className="text-button" onClick={load}>Yeniden dene</button></p>}
      {data.delivery&&<div className="imece-delivery" role="status"><strong>Kara: {data.delivery.minutes} dakikalık yeni emeğin şantiyede!</strong><p>Senin katkını ve ardından yapılan ortak işleri hızlandırılmış olarak izleyebilirsin. Süre zaten kaydedildi; izlemek ya da atlamak ikinci kez ödül vermez.</p>{!replay||replay.done?<button type="button" className="btn primary" onClick={()=>setReplay({...data.delivery,key:performance.now(),done:false})}>{replay?.done?"Yapımı tekrar izle":"Emeğimizin yükselişini izle"}</button>:<p>Katkından bugüne şantiye · hızlandırılmış yapım</p>}<Busy className="btn outline" loading={busy} onClick={accept}>{replay?.done?"Emeğimi teslim aldım":"Atla ve teslim al"}</Busy></div>}
      <Suspense fallback={<Loading text="Ortak şantiye kuruluyor…"/>}><ImeceScene minutes={data.minutes} complete={data.complete} crew={data.crew} replay={replay} onReplayDone={replayDone}/></Suspense>
      {data.complete?<div className="imece-complete"><Flag size={28}/><h3>Son taşında hepimiz varız.</h3><p>Dört kişisel görev de tamamlandı. Aşağıdaki emek defteri ve Anıtkabir artık ortak hatıramız.</p></div>:<section className="imece-mission" id="imece-mission">
        <span className="imece-eyebrow">{mine?mine.role.name:"ORTAK ŞANTİYE"}</span><h3>{current?.name}</h3><p>{current?.action}</p><p className="imece-why">{current?.why}</p>
        {working?<div className="imece-working" role="status"><Hammer size={20}/><div><strong>Görevin sürüyor · {Math.max(0,Math.ceil((me.focusEnd-now)/60000))} dk kaldı</strong><p>{me.focusRelaxed?"Ekranı kapatabilirsin. Sunucudaki süre devam eder; geri geldiğinde katkın yazılır.":"Kütüp açık kalsın. Seansın tamamı uygulamada görülürse seçilen görev yazılır."}</p><button className="text-button" disabled={busy} onClick={async()=>{if(!confirm("Bu görev seansını durduralım mı? Önceki katkılarınız korunur; bu seans projeye yazılmaz."))return;setBusy(true);try{await mutate("/focus",{action:"cancel"},"Görev durdu. Önceki ortak emeğiniz korunuyor.");await load();}finally{setBusy(false);}}}>Bu seansı durdur</button></div></div>
          : !mine?<p className="imece-explain">Bu projenin kadrosunu Batur dört kişi olarak belirledi. Şantiyeyi ve katkı defterini gezebilirsin.</p>
          : running?<p className="imece-explain">Şu an başka bir odak seansın var. Onu tamamlayınca ortak göreve başlayabilirsin.</p>
          : choices.length===0?<p className="imece-explain">Bu bölümde sana açık iş kalmadı. Arkadaşlarının kişisel görevleri tamamlanınca yeni bölüm kendiliğinden açılacak. Bu sırada kişisel köyünde çalışabilirsin.</p>
          : <><div className="imece-start-options"><fieldset><legend>1 · Kaç dakika çalışacaksın?</legend>{choices.map(n=><button key={n} type="button" aria-pressed={length===n} onClick={()=>setDuration(n)}>{n} dk</button>)}</fieldset><fieldset><legend>2 · Telefon nasıl dursun?</legend>{[[true,"Rahat","Ekranı kapatabilirsin"],[false,"Takipli","Kütüp açık kalsın"]].map(([v,label,hint])=><button key={label} type="button" aria-pressed={relaxed===v} onClick={()=>setRelaxed(v)}><b>{label}</b><small>{hint}</small></button>)}</fieldset></div><p className="imece-explain">Önce bu bölümdeki kişisel payın tamamlanır; fazlası ortak işe gider. Seansı bitirince süre yazılır. Malzeme ücreti yok; kişisel bina yapılmaz. Her iki seçenekte de yarım maaş ve mevcut seans bonusları geçerlidir.</p><Busy className="btn primary full imece-start" loading={busy} onClick={begin}><Hammer size={18}/>Ben de bir taş koyayım · {length} dk</Busy></>}
      </section>}
      <section className="imece-log"><h3><Users size={20}/> Dört usta, tek eser</h3><p>Herkesin kişisel payı üç bölümde 50 + 150 + 50 dakika. Kalan 1.000 dakikayı paylaşabilirsiniz. Birinin fazla emeği diğerinin imzasının yerine geçmez.</p><div className="imece-crew">{data.crew.map(person=><article key={person.slot}><Avatar member={person}/><div><strong>{person.name}{person.slot===data.slot?" · sen":""}</strong><small>{person.role.name} · {time(person.minutes)} katkı</small><Meter value={sum(person.personal)} max={250} label={`${person.name}: kişisel görev`}/><span>{sum(person.personal)===250?<><Check size={13}/> Kişisel görev tamam</>:`${sum(person.personal)} / 250 dk kişisel görev`}{!person.memberId?" · hesap ayrılmış, görev bekliyor":person.working?" · şu an çalışıyor":""}</span></div></article>)}</div></section>
      <section className="imece-plan"><h3>Şantiye defteri · iş sırası</h3>{IMECE_PHASES.map((p,i)=><details key={p.id} open={i===data.phase}><summary><span>{data.phases[i].complete?<Check size={17}/>:<span className="imece-phase-number">{i+1}</span>}<b>{p.name}</b></span><span>{data.phases[i].minutes} / {p.goal} dk</span></summary><p>{p.story}</p><p className="imece-explain">Bu bölümde herkes {p.personal} dakika kişisel görev yapar. Hem toplam iş hem dört kişisel pay bitince sıradaki bölüm açılır.</p><ol>{data.tasks.filter(t=>t.phase===i).map(task=><li key={task.id} className={task.complete?"done":""}><div><strong>{task.complete?<Check size={14}/>:null}{task.name}</strong><span>{task.credited} / {task.minutes} dk</span></div><p>{task.action}</p><small>{task.why}</small></li>)}</ol></details>)}</section>
      <div className="imece-history"><h3>Şantiyeden son izler</h3>{data.recent.length?data.recent.map((r,i)=><p key={`${r.created}-${i}`}><span>{data.crew[r.slot].name}</span> · {r.minutes} dk emek · {IMECE_PHASES[r.phase].name}{r.personal>0?` · ${r.personal} dk kişisel imza`:""}</p>):<p>İlk satır henüz yazılmadı. İlk taşı sen koyabilirsin.</p>}</div>
    </Modal>}
  </>;
}
