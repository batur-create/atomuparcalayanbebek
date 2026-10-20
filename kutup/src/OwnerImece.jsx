import React, { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { api, get } from "./api.js";
import { Avatar, Busy } from "./ui.jsx";
import { IMECE_ROLES } from "../shared/imece.js";
import "./imece.css";

export function OwnerImece({groups}) {
  const [state,setState]=useState(undefined),[selected,setSelected]=useState([]),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const [editing,setEditing]=useState(null),[replacement,setReplacement]=useState(""),[notice,setNotice]=useState("");
  const load=()=>{setError("");return get("/owner/imece").then(setState).catch(e=>setError(e.message));};
  useEffect(()=>{let alive=true;get("/owner/imece").then(s=>{if(alive)setState(s);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[]);
  const people=groups.flatMap(g=>g.members.map(m=>({...m,team:g.name})));
  const launch=async()=>{
    const names=selected.map(id=>people.find(m=>m.id===id)?.name).join(", ");
    if(!confirm(`Bir Taş da Senden başlatılsın mı?\n\nKadro: ${names}\nToplam 2.000 dakika. Herkes için 250 dakika kişisel görev. Takvim kilidi yok.\n\nSeçilen dört kişinin göreve katılacağını doğrula. Yanlış hesabı daha sonra Hesabı değiştir ile düzeltebilirsin.`))return;
    setBusy(true);setError("");try{setState(await api("/owner/imece",{members:selected}));}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const person=state?.crew.find(p=>p.slot===editing);
  const replace=async e=>{
    e.preventDefault();
    const next=people.find(p=>p.id===replacement);
    if(!person||!next||busy)return;
    if(!confirm(`${person.name} yerine ${next.name} (@${next.username||next.id} · ${next.team}) seçilsin mi?\n\nBu görev yerinin ${person.minutes} dk katkısı ve tamamlanan kişisel payları yeni hesapla devam eder. Önceki katkı teslim kayıtları korunur. Kişisel tuğla, bina ve çalışma geçmişi taşınmaz. Eski hesap kadrodan çıkar; dört kişi ve 2.000 dk hedefi değişmez.`))return;
    setBusy(true);setError("");setNotice("");
    try{setState(await api(`/owner/imece/crew/${person.slot}`,{memberId:replacement,rev:state.rev}));setEditing(null);setReplacement("");setNotice("Katılımcı hesabı güncellendi. Şantiyenin emeği ve görev ilerlemesi korundu.");}
    catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <section className="panel imece-owner"><span className="imece-eyebrow">BÜTÜN KÖYLERİN ORTAK PROJESİ</span><h2>Bir Taş da Senden</h2>
    {error&&<p className="form-error" role="alert">{error} <button className="text-button" onClick={load}>Yeniden oku</button></p>}
    {notice&&<p role="status">{notice}</p>}
    {state===undefined?<p>Şantiye okunuyor…</p>:state?<>
      <p>Proje {state.complete?"tamamlandı":"sürüyor"}: {state.minutes} / 2.000 dakika. Bu kayıt bütün köyler için ortaktır.</p>
      <div className="imece-owner-roster">{state.crew.map(p=><div className="imece-owner-person" key={p.slot}>
        <Avatar member={p}/><span className="imece-owner-person-info"><b>{p.name}</b><small>{p.minutes} dk katkı · {p.personal.reduce((n,x)=>n+x,0)} / 250 dk kişisel görev{!p.memberId?" · hesap ayrılmış":""}</small><small>{people.find(m=>m.id===p.memberId)?.username?`@${people.find(m=>m.id===p.memberId).username} · `:""}{people.find(m=>m.id===p.memberId)?.team}</small>{p.working&&<small>Önce şantiye seansını tamamla veya durdur.</small>}</span>
        {!state.complete&&<button className="btn outline" disabled={busy||!!p.working} aria-label={`${p.name} hesabını değiştir`} onClick={()=>{setEditing(p.slot);setReplacement("");setError("");setNotice("");}}>Hesabı değiştir</button>}
      </div>)}</div>
      {person&&!state.complete&&<form className="imece-owner-replace" onSubmit={replace}>
        <h3>{person.name} · hesabı düzelt</h3><p>Bu görev yerindeki {person.minutes} dk katkı ve kişisel paylar korunur; seçtiğin hesap kaldığı yerden devam eder. Kişisel tuğla, bina ve çalışma geçmişi aktarılmaz.</p>
        <label htmlFor="imece-replacement">Yeni katılımcı hesabı</label><select id="imece-replacement" value={replacement} onChange={e=>setReplacement(e.target.value)} disabled={busy} required><option value="">Doğru hesabı seç</option>{people.filter(p=>!state.crew.some(c=>c.memberId===p.id)).map(p=><option key={p.id} value={p.id}>{p.name} · @{p.username||p.id} · {p.team}</option>)}</select>
        <div className="imece-owner-replace-actions"><Busy className="btn primary" type="submit" loading={busy} disabled={!replacement}>Katılımcıyı güncelle</Busy><button className="btn outline" type="button" disabled={busy} onClick={()=>setEditing(null)}>Vazgeç</button></div>
      </form>}
      <p>Dört kişilik kadronun yanlış hesabını yalnız buradan düzeltebilirsin; katkı ve görev ilerlemesi korunur. Herkesin kişisel görevleri bitmeden açılış yapılmaz. Tamamlanan projenin kadrosu değiştirilemez.</p><button className="btn outline" disabled={busy} onClick={load}>Katkıları yenile</button>
    </>:<><p>Dört kişi seç; Kara her birine ayrı bir görev mektubu getirsin. Proje ancak bu düğmeye bastığında açılır. Seçilen görünen adlar, avatarlar ve katkılar ortak şantiyede bütün köylerden görülebilir.</p><p><b>Hedef:</b> 400 + 1.200 + 400 = 2.000 dk. <b>Kişisel pay:</b> herkes için 50 + 150 + 50 = 250 dk. Kalan 1.000 dk paylaşılır. Test veya terk edilmiş hesap seçme; yanlış hesabı daha sonra buradan düzeltebilirsin.</p><div className="imece-owner-roster">{people.map(p=><label key={p.id}><input type="checkbox" checked={selected.includes(p.id)} disabled={!selected.includes(p.id)&&selected.length===4} onChange={e=>setSelected(a=>e.target.checked?[...a,p.id]:a.filter(id=>id!==p.id))}/><Avatar member={p}/><span><b>{p.name}</b><small>{p.team}{selected.includes(p.id)?` · ${IMECE_ROLES[selected.indexOf(p.id)].name}`:""}</small></span></label>)}</div><Busy className="btn primary" loading={busy} disabled={selected.length!==4} onClick={launch}><Flag size={18}/>Dört ustayı göreve çağır · {selected.length}/4</Busy></>}
    <hr/><h3>Eski Anıtkabirler</h3><p>Otomatik kaldırılmaz. Ekipler → kişi → 🎁 → Köyü yolundan “Yalnız Anıtkabir” filtresiyle tek tek kaldırabilirsin. Tuğla ve odak dakikaları değişmez; kaldırılan yapının kendisi ve beğenileri silinir.</p>
  </section>;
}
