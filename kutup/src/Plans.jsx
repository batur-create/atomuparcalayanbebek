// Every entry point opens this meeting card. Personal arrival is an answer,
// never another copy of the meeting or a separate presence system.
import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, MapPin, Send } from "lucide-react";
import { get, dayWord, shortTime, dayInput } from "./api.js";
import { Avatar, Busy } from "./ui.jsx";
import { Modal } from "./Modal.jsx";
import { sharePlan, savePlanCalendar } from "./planShare.js";
import { planAnswer, planClock, planDate, planDay, planDeadline, planStamp, planWhen } from "../shared/plans.js";
import "./plans.css";
const TIMES=["09:00","10:00","12:00","14:00","16:00","18:00","20:00"];
const LABELS={yes:"Varım",no:"Gelemem",maybe:"Kararsızım",pending:"Yeniden onay bekliyor"};

export function PlanModal({close,mutate,onSaved,data,plan,onReload}){
  const nextToday=TIMES.find(t=>planStamp(dayInput(),t)>Date.now()+600000);
  const [base]=useState(plan),[date,setDate]=useState(()=>plan?planDate(plan.starts):dayInput(nextToday?0:1)),[time,setTime]=useState(()=>plan?planClock(plan.starts):nextToday||TIMES[0]);
  const [end,setEnd]=useState(()=>plan?.ends?planClock(plan.ends):""),[endDate,setEndDate]=useState(()=>plan?.ends?planDate(plan.ends):dayInput());
  const [note,setNote]=useState(plan?.note||""),[separate,setSeparate]=useState(false),[remind,setRemind]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [similar,setSimilar]=useState([]),[chosen,setChosen]=useState("");
  const requestKey=useRef(crypto.randomUUID());
  const starts=planStamp(date,time),ends=end?planStamp(endDate<date?date:endDate,end):0;
  useEffect(()=>{
    if(base||!date)return;
    const ac=new AbortController();let valid=true;
    get(`/plans?day=${encodeURIComponent(date)}`,ac.signal).then(r=>{
      if(!valid)return;const list=r.plans.filter(p=>!p.cancelled&&planDeadline(p)>Date.now());setSimilar(list);setChosen(old=>list.some(p=>p.id===old)?old:list[0]?.id||"");
    }).catch(()=>{if(valid)setSimilar([]);});
    return()=>{valid=false;ac.abort();};
  },[date,base,data?.group?.rev]);
  const joining=!base&&!separate&&similar.find(p=>p.id===chosen);
  const submit=async e=>{
    e.preventDefault();if(busy)return;setError("");
    if(!Number.isFinite(starts)||end&&!Number.isFinite(ends)){setError("Gün ve saatleri kontrol et.");return;}
    if((!base||starts!==base.starts)&&starts<Date.now()-60000){setError("İleri bir saat seç.");return;}
    if(ends&&(ends<=starts||ends>starts+86400000)){setError("Bitiş, başlangıçtan sonra ve en fazla bir gün içinde olmalı.");return;}
    setBusy(true);
    const body=joining?{answer:"yes",arrival:starts,schedule:joining.schedule,remind}:{starts,ends,note,separate,remind,requestKey:requestKey.current,...(base?{rev:base.rev}:{})};
    const result=await mutate(joining?`/plans/${joining.id}/answer`:base?`/plans/${base.id}`:"/plans",body,"",base?"PATCH":"POST",setError);
    setBusy(false);if(result)onSaved?.(joining?.id||result.id||base?.id,!!result.created);
  };
  return <Modal title={base?"Buluşmayı düzenle":"Kütüp’te buluşalım"} subtitle={base?"Aynı bağlantı kalır. Saat değişirse katılanlar yeniden onaylar.":"Buluşma ortak, geliş saatin sana özel."} close={close} className="meetup-modal">
    <form className="meetup-form" onSubmit={submit}>
      <fieldset className="meetup-days"><legend>Hangi gün?</legend>{Array.from({length:7},(_,i)=>{const d=dayInput(i);return<button type="button" key={d} aria-pressed={date===d} onClick={()=>{setDate(d);setEndDate(d);}}>{i===0?"Bugün":i===1?"Yarın":dayWord(planStamp(d,"12:00"))}</button>;})}</fieldset>
      <div className="form-row"><label className="field-label">Gün<input type="date" min={base?planDate(base.starts):dayInput()} max={dayInput(14)} required value={date} onChange={e=>{setDate(e.target.value);setEndDate(e.target.value);}}/></label><label className="field-label">{joining?"Sen kaçta geleceksin?":"Başlangıç saati"}<input type="time" required value={time} onChange={e=>setTime(e.target.value)}/></label></div>
      <div className="meetup-times" role="group" aria-label="Hızlı saat seçimi">{TIMES.map(t=><button type="button" key={t} aria-pressed={time===t} onClick={()=>setTime(t)}>{t}</button>)}</div>
      {!!similar.length&&!base&&<div className="meetup-similar"><strong>O gün zaten buluşuyoruz.</strong><p>Yeni bir plan açmadan kendi geliş saatinle katılabilirsin.</p>{similar.map(p=><label key={p.id}><input type="radio" name="meeting" checked={!separate&&chosen===p.id} onChange={()=>{setChosen(p.id);setSeparate(false);}}/><span>{p.note||"Kütüpte buluşalım"}<small>{shortTime(p.starts)}{p.ends?`–${shortTime(p.ends)}`:" itibarıyla"} · {p.attendees.length} kişi</small></span></label>)}<label><input type="checkbox" checked={separate} onChange={e=>setSeparate(e.target.checked)}/>Bu ayrı bir buluşma; farklı bir çalışma grubu kuruyorum.</label></div>}
      {!joining&&<><label className="field-label">Buluşmanın adı <span>{separate?"ayrı buluşma için gerekli":"isteğe bağlı"}</span><input maxLength={80} required={separate} value={note} onChange={e=>setNote(e.target.value)} placeholder="Örn. Sınav kampı"/></label><label className="meetup-check"><input type="checkbox" checked={!!end} onChange={e=>{setEnd(e.target.checked?"18:00":"");setEndDate(date);}}/>Bitiş saati belli</label>{!!end&&<div className="form-row"><label className="field-label">Bitiş günü<input type="date" min={date} required value={endDate<date?date:endDate} onChange={e=>setEndDate(e.target.value)}/></label><label className="field-label">Bitiş saati<input type="time" required value={end} onChange={e=>setEnd(e.target.value)}/></label></div>}</>}
      {!base&&<label className="meetup-check"><input type="checkbox" checked={remind} onChange={e=>setRemind(e.target.checked)}/>Gelişimden 30 dakika önce bir kez hatırlat</label>}
      {Number.isFinite(starts)&&<p className="meetup-summary"><CalendarDays size={18}/>{planWhen(starts)}{joining?" · senin gelişin":""}</p>}
      <p className="form-footnote"><MapPin size={14}/> Milli Kütüphane · Türkiye saati. {base?"Yalnız açıklamayı değiştirmek cevapları sıfırlamaz.":"Hatırlatma, bu hesapta bildirimleri açık cihazlara gider."}</p>
      {error&&<p className="form-error" role="alert">{error}{base&&onReload&&<button type="button" className="text-button" onClick={onReload}>Güncel kartı aç</button>}</p>}
      <Busy type="submit" className="btn primary full" loading={busy}>{joining?`${time}’da katıl`:base?"Değişiklikleri kaydet":"Buluşmayı oluştur"}</Busy>
    </form>
  </Modal>;
}

function AnswerForm({plan,me,mutate,reload}){
  const mine=planAnswer(plan,me.id),[answer,setAnswer]=useState(mine?.answer==="pending"?"yes":mine?.answer||"yes");
  const [date,setDate]=useState(planDate(mine?.arrival||plan.starts)),[time,setTime]=useState(planClock(mine?.arrival||plan.starts));
  const [remind,setRemind]=useState(!!mine?.remind),[note,setNote]=useState(mine?.note||""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{
    setAnswer(mine?.answer==="pending"?"yes":mine?.answer||"yes");setDate(planDate(mine?.arrival||plan.starts));setTime(planClock(mine?.arrival||plan.starts));setNote(mine?.note||"");setRemind(!!mine?.remind);
  },[plan.id,plan.schedule,mine?.answer,mine?.arrival,mine?.note,mine?.remind]);
  const save=async(choice=answer)=>{
    if(busy)return;setBusy(true);setError("");
    const result=await mutate(`/plans/${plan.id}/answer`,{answer:choice,arrival:planStamp(date,time),schedule:plan.schedule,remind,note},"Katılımın güncellendi.","POST",setError);
    setBusy(false);if(result)await reload();
  };
  return <section className="meetup-answer">
    <h3>Sen nasıl katılıyorsun?</h3>
    {mine&&<p className="meetup-current">{mine.answer==="pending"?"Buluşmanın saati değişti. Önceki cevabını yeniden onayla.":mine.answer==="yes"?`Kaydedilen gelişin: ${shortTime(mine.arrival)}`:`Kaydedilen cevabın: ${LABELS[mine.answer]}`}</p>}
    <div role="group" aria-label="Katılım cevabın" className="meetup-choices">{["yes","no","maybe"].map(v=><button type="button" key={v} aria-pressed={answer===v} onClick={()=>setAnswer(v)}>{LABELS[v]}</button>)}</div>
    {answer==="yes"&&<><div className="meetup-arrival-presets"><button type="button" className="text-button" onClick={()=>{setDate(planDate(plan.starts));setTime(planClock(plan.starts));}}>Plan saatinde · {shortTime(plan.starts)}</button><span>Başka saatte geliyorsan aşağıdan seç.</span></div><div className="form-row"><label className="field-label">Geliş günü<input type="date" min={planDate(plan.starts)} max={planDate(planDeadline(plan)-1)} required value={date} onChange={e=>setDate(e.target.value)}/></label><label className="field-label">Geliş saatin<input type="time" value={time} required onChange={e=>setTime(e.target.value)}/></label></div><label className="meetup-check"><input type="checkbox" checked={remind} onChange={e=>setRemind(e.target.checked)}/>Gelişimden 30 dakika önce bir kez hatırlat</label><p className="meetup-help">Buluşma saati değişmez; arkadaşların senin kaçta katılacağını görür. Bildirimlerin açıksa hatırlatma gelir.</p></>}
    <label className="field-label">Kısa not <span>isteğe bağlı</span><input maxLength={80} placeholder="Örn. Dersten çıkınca geleceğim" value={note} onChange={e=>setNote(e.target.value)}/></label>
    {error&&<p className="form-error" role="alert">{error} <button className="text-button" type="button" onClick={reload}>Kartı yenile</button></p>}
    <Busy className="btn primary full" loading={busy} onClick={()=>save()}>{answer==="yes"?`Varım · ${time}’da geliyorum`:answer==="no"?"Gelemeyeceğimi bildir":"Kararsızım olarak kaydet"}</Busy>
    {mine&&<button type="button" className="text-button" disabled={busy} onClick={()=>save("clear")}>Yanıtımı geri al</button>}
  </section>;
}

export function PlanCardModal({planId,fresh,data,me,close,mutate,notify}){
  const [result,setResult]=useState(null),[error,setError]=useState(""),[editing,setEditing]=useState(false),[copied,setCopied]=useState(false),[busy,setBusy]=useState(false);
  const request=useRef(null),epoch=useRef(0);
  const cached=data.plans.find(p=>p.id===planId),plan=result?.id===planId?result:cached;
  const reload=async()=>{
    request.current?.abort();const ac=new AbortController();request.current=ac;const turn=++epoch.current;
    try{const p=await get(`/plans/${encodeURIComponent(planId)}`,ac.signal);if(turn===epoch.current&&!ac.signal.aborted){setResult(p);setError("");}}
    catch(e){if(turn===epoch.current&&!ac.signal.aborted)setError(e.status===404?"Bu buluşmaya ulaşılamadı. Bağlantı başka bir ekibe ait olabilir veya kaldırılmış olabilir.":e.message);}
  };
  useEffect(()=>{reload();return()=>{++epoch.current;request.current?.abort();};},[planId,data.group.rev]);
  if(!me)return null;
  if(!plan)return <Modal title="Kütüp buluşması" close={close}><p role={error?"alert":"status"}>{error||"Buluşma okunuyor…"}</p>{error&&<button className="btn outline" onClick={reload}>Yeniden dene</button>}</Modal>;
  const owner=data.members.find(p=>p.id===plan.memberId),mine=planAnswer(plan,me.id),ended=Date.now()>=planDeadline(plan),cancelled=!!plan.cancelled;
  if(editing)return <PlanModal plan={plan} data={data} close={()=>setEditing(false)} mutate={mutate} onReload={()=>{setEditing(false);reload();}} onSaved={()=>{setEditing(false);reload();}}/>;
  const share=async()=>{const r=await sharePlan(plan,owner);if(r==="copied"){setCopied(true);notify("Buluşma bağlantısı kopyalandı.");}else if(r==="failed")notify("Paylaşılamadı. Bir daha dene.");};
  const cancel=async()=>{
    if(busy||!confirm("Buluşmayı iptal edelim mi? Katılanlara haber gider; aynı bağlantı iptal bilgisini göstermeye devam eder."))return;
    setBusy(true);const r=await mutate(`/plans/${plan.id}`,{rev:plan.rev},"Buluşma iptal edildi.","DELETE",setError);setBusy(false);if(r)await reload();
  };
  const groups=[["yes","Katılıyor"],["maybe","Kararsız"],["pending","Henüz netleşmedi"],["no","Gelemiyor"]];
  return <Modal title={cancelled?"Buluşma iptal edildi":ended?"Buluşma sona erdi":fresh?"Buluşma hazır":"Kütüp buluşması"} subtitle="Ortak buluşma, kişiye özel geliş saati." close={close} className="meetup-modal">
    <div className="meetup-title"><span className="meetup-calendar"><CalendarDays size={27}/></span><div><h3>{plan.note||"Kütüpte buluşalım"}</h3><p>{planWhen(plan.starts)}{plan.ends?` → ${planWhen(plan.ends)}`:" itibarıyla"}</p><small>Milli Kütüphane · {owner?.name||"Arkadaşın"} planladı</small></div></div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    {cancelled?<p className="meetup-summary">Bu bağlantı korunuyor. Bu buluşma için yola çıkma; yeni buluşmaları ana sayfadan görebilirsin.</p>:ended?<p className="meetup-summary">Eski katılımlar burada duruyor. Yeni bir gün için ana sayfadan buluşma oluşturabilirsin.</p>:<AnswerForm plan={plan} me={me} mutate={mutate} reload={reload}/>}
    <section className="meetup-roster"><h3>Kim, kaçta geliyor?</h3>{groups.map(([value,label])=>{
      const people=data.members.map(person=>({person,response:planAnswer(plan,person.id)})).filter(({response})=>(response?.answer||"pending")===value).sort((a,b)=>(a.response?.arrival||0)-(b.response?.arrival||0));
      return people.length?<div key={value}><h4>{label} · {people.length}</h4>{people.map(({person,response})=><article key={person.id}><Avatar member={person} size="tiny"/><div><strong>{person.name}{person.id===me.id?" · sen":""}</strong><small>{value==="yes"?`${shortTime(response.arrival)}’da katılıyor`:value==="pending"?(response?"Saat değişti, yeniden onay bekleniyor":"Henüz cevaplamadı"):LABELS[value]}{response?.note?` · ${response.note}`:""}</small></div>{value==="yes"&&<time>{shortTime(response.arrival)}</time>}</article>)}</div>:null;
    })}</section>
    {!cancelled&&!ended&&<div className="meetup-actions"><button type="button" className="btn outline" onClick={share}>{copied?<Check size={16}/>:<Send size={16}/>} {copied?"Kopyalandı":"Gruba gönder"}</button><button type="button" className="btn outline" onClick={()=>savePlanCalendar(plan,owner,mine?.answer==="yes"?mine.arrival:plan.starts)}><CalendarDays size={16}/>Takvime ekle</button>{mine?.answer==="yes"&&planDay(mine.arrival)===planDay(Date.now())&&<><button className="btn outline" onClick={()=>window.dispatchEvent(new CustomEvent("kutup:presence",{detail:{coming:true}}))}>Yoldayım</button><button className="btn outline" onClick={()=>window.dispatchEvent(new CustomEvent("kutup:presence",{detail:{coming:false}}))}>Geldim</button></>}</div>}
    {plan.memberId===me.id&&!cancelled&&!ended&&<div className="meetup-manage"><button type="button" className="text-button" onClick={()=>setEditing(true)}>Buluşmayı düzenle</button><Busy className="text-button" loading={busy} onClick={cancel}>Buluşmayı iptal et</Busy></div>}
  </Modal>;
}
