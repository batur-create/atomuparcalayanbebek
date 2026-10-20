import React, { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { api, get } from "./api.js";
import { Avatar, Busy } from "./ui.jsx";
import { IMECE_ROLES } from "../shared/imece.js";
import "./imece.css";

export function OwnerImece({groups}) {
  const [state,setState]=useState(undefined),[selected,setSelected]=useState([]),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const load=()=>get("/owner/imece").then(setState).catch(e=>setError(e.message));
  useEffect(()=>{let alive=true;get("/owner/imece").then(s=>{if(alive)setState(s);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[]);
  const people=groups.flatMap(g=>g.members.map(m=>({...m,team:g.name})));
  const launch=async()=>{
    const names=selected.map(id=>people.find(m=>m.id===id)?.name).join(", ");
    if(!confirm(`Bir Taş da Senden başlatılsın mı?\n\nKadro: ${names}\nToplam 2.000 dakika. Herkes için 250 dakika kişisel görev. Takvim kilidi yok.\n\nKadro başlangıçtan sonra değişmez. Seçilen dört kişinin göreve katılacağını doğrula.`))return;
    setBusy(true);setError("");try{setState(await api("/owner/imece",{members:selected}));}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <section className="panel imece-owner"><span className="imece-eyebrow">BÜTÜN KÖYLERİN ORTAK PROJESİ</span><h2>Bir Taş da Senden</h2>
    {error&&<p className="form-error" role="alert">{error} <button className="text-button" onClick={load}>Yeniden oku</button></p>}
    {state===undefined?<p>Şantiye okunuyor…</p>:state?<><p>Proje {state.complete?"tamamlandı":"sürüyor"}: {state.minutes} / 2.000 dakika. Bu kayıt bütün köyler için ortaktır.</p><div className="imece-owner-roster">{state.crew.map(p=><label key={p.slot}><Avatar member={p}/><span><b>{p.name}</b><small>{p.minutes} dk katkı · {p.personal.reduce((n,x)=>n+x,0)} / 250 dk kişisel görev{!p.memberId?" · hesap ayrılmış; tamamlanmamış görev açılışı bekletir":""}</small></span></label>)}</div><p>Kadro ve hedef sabittir. Herkesin kişisel görevleri bitmeden açılış yapılmaz. Üyeyi uygulamadan çıkarmak, geçmiş ortak emeği silmez; tamamlanmamış kişisel görevi de bitmiş saymaz.</p><button className="btn outline" onClick={load}>Katkıları yenile</button></>:<><p>Dört kişi seç; Kara her birine ayrı bir görev mektubu getirsin. Proje ancak bu düğmeye bastığında açılır. Seçilen görünen adlar, avatarlar ve katkılar ortak şantiyede bütün köylerden görülebilir.</p><p><b>Hedef:</b> 400 + 1.200 + 400 = 2.000 dk. <b>Kişisel pay:</b> herkes için 50 + 150 + 50 = 250 dk. Kalan 1.000 dk paylaşılır. Başlangıçtan sonra kadro değişmez; test veya terk edilmiş hesap seçme.</p><div className="imece-owner-roster">{people.map(p=><label key={p.id}><input type="checkbox" checked={selected.includes(p.id)} disabled={!selected.includes(p.id)&&selected.length===4} onChange={e=>setSelected(a=>e.target.checked?[...a,p.id]:a.filter(id=>id!==p.id))}/><Avatar member={p}/><span><b>{p.name}</b><small>{p.team}{selected.includes(p.id)?` · ${IMECE_ROLES[selected.indexOf(p.id)].name}`:""}</small></span></label>)}</div><Busy className="btn primary" loading={busy} disabled={selected.length!==4} onClick={launch}><Flag size={18}/>Dört ustayı göreve çağır · {selected.length}/4</Busy></>}
    <hr/><h3>Eski Anıtkabirler</h3><p>Otomatik kaldırılmaz. Ekipler → kişi → 🎁 → Köyü yolundan “Yalnız Anıtkabir” filtresiyle tek tek kaldırabilirsin. Tuğla ve odak dakikaları değişmez; kaldırılan yapının kendisi ve beğenileri silinir.</p>
  </section>;
}
