import React, { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { api, get } from "./api.js";
import { Avatar, Busy } from "./ui.jsx";
import { IMECE_ROLES } from "../shared/imece.js";
import "./imece.css";

export function OwnerImece({groups}) {
  const [state,setState]=useState(undefined),[selected,setSelected]=useState([]),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const [editing,setEditing]=useState(null),[replacement,setReplacement]=useState(""),[notice,setNotice]=useState(""),[destination,setDestination]=useState("");
  const [groupId,setGroupId]=useState(()=>groups[0]?.id||"");
  const endpoint=`/owner/imece?group=${encodeURIComponent(groupId)}`;
  const load=async()=>{setBusy(true);setError("");try{setState(await get(endpoint));}catch(e){setError(e.message);}finally{setBusy(false);}};
  useEffect(()=>{if(!groupId&&groups[0])setGroupId(groups[0].id);},[groups,groupId]);
  useEffect(()=>{let alive=true;setState(undefined);setSelected([]);setEditing(null);setNotice("");setError("");setBusy(true);get(endpoint).then(s=>{if(alive)setState(s);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};},[endpoint]);
  const people=groups.filter(g=>g.id===groupId).flatMap(g=>g.members.map(m=>({...m,team:g.name})));
  const launch=async()=>{
    const names=selected.map(id=>people.find(m=>m.id===id)?.name).join(", ");
    if(!confirm(`Bir Taş da Senden başlatılsın mı?\n\nKadro: ${names}\nToplam 2.000 dakika. Herkes için 250 dakika kişisel görev. Takvim kilidi yok.\n\nSeçilen dört kişinin göreve katılacağını doğrula. Yanlış hesabı daha sonra Hesabı değiştir ile düzeltebilirsin.`))return;
    setBusy(true);setError("");try{setState(await api("/owner/imece",{members:selected,groupId}));}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const assign=async target=>{
    if(!target||!state||busy)return;
    const team=groups.find(g=>g.id===target);
    if(!confirm(`Bu projeyi ${team?.name} ekibine bağlayalım mı?\n\n${state.minutes} dk katkı, görev payları ve çizim aynen korunur. Hesapların ekipleri değişmez; gerekiyorsa bu ekipten doğru hesapları sonra seç. Var olan başka bir projenin üstüne yazılmaz.`))return;
    setBusy(true);setError("");try{setState(await api("/owner/imece/assign",{projectId:state.id,groupId:target,rev:state.rev}));setGroupId(target);setNotice("Projenin ekibi güncellendi. Yapılan işler korundu.");}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const person=state?.crew.find(p=>p.slot===editing);
  const replace=async e=>{
    e.preventDefault();
    const next=people.find(p=>p.id===replacement);
    if(!person||!next||busy)return;
    if(!confirm(`${person.name} yerine ${next.name} (@${next.username||next.id} · ${next.team}) seçilsin mi?\n\nBu görev yerinin ${person.minutes} dk katkısı ve tamamlanan kişisel payları yeni hesapla devam eder. Önceki katkı teslim kayıtları korunur. Kişisel tuğla, bina ve çalışma geçmişi taşınmaz. Eski hesap kadrodan çıkar; dört kişi ve 2.000 dk hedefi değişmez.`))return;
    setBusy(true);setError("");setNotice("");
    try{setState(await api(`/owner/imece/crew/${person.slot}`,{memberId:replacement,rev:state.rev,groupId}));setEditing(null);setReplacement("");setNotice("Katılımcı hesabı güncellendi. Şantiyenin emeği ve görev ilerlemesi korundu.");}
    catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <section className="panel imece-owner"><span className="imece-eyebrow">EKİBİN ORTAK PROJESİ</span><h2>Bir Taş da Senden</h2><label htmlFor="imece-team">Ekip</label><select id="imece-team" className="imece-team-picker" value={groupId} disabled={busy} onChange={e=>setGroupId(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name} · {g.members.length} kişi · {g.id.slice(0,6)}</option>)}</select>
    {error&&<p className="form-error" role="alert">{error} <button className="text-button" onClick={load}>Yeniden oku</button></p>}
    {notice&&<p role="status">{notice}</p>}
    {state===undefined?<p>Şantiye okunuyor…</p>:state?<>
      <p>Proje {state.complete?"tamamlandı":"sürüyor"}: {state.minutes} / 2.000 dakika. Bu proje yalnız seçili ekibe aittir.</p>
      {!state.groupId?<div className="imece-owner-replace"><strong>Önceki projenin emeği burada korunuyor.</strong><p>Otomatik ekip seçmedik. Önce yukarıdan doğru ekibi seç; ardından projeyi bağla. Görevli hesapları sonra düzeltebilirsin.</p><Busy className="btn primary" loading={busy} onClick={()=>assign(groupId)}>Bu ekibe bağla · emeği koru</Busy></div>:<details className="imece-owner-replace"><summary>Projenin ekibi yanlış mı?</summary><p>Yapılan işleri koruyarak başka bir ekibe bağlayabilirsin. Üyeler taşınmaz; iki proje birleştirilmez.</p><label htmlFor="imece-destination">Doğru ekip</label><select id="imece-destination" value={destination} onChange={e=>setDestination(e.target.value)}><option value="">Ekip seç</option>{groups.filter(g=>g.id!==state.groupId).map(g=><option key={g.id} value={g.id}>{g.name} · {g.id.slice(0,6)}</option>)}</select><Busy className="btn outline" loading={busy} disabled={!destination} onClick={()=>assign(destination)}>Projeyi bu ekibe bağla</Busy></details>}
      <div className="imece-owner-roster">{state.crew.map(p=><div className="imece-owner-person" key={p.slot}>
        <Avatar member={p}/><span className="imece-owner-person-info"><b>{p.name}</b><small>{p.minutes} dk katkı · {p.personal.reduce((n,x)=>n+x,0)} / 250 dk kişisel görev{!p.memberId?" · hesap ayrılmış":!p.eligible?" · başka ekipten; hesabı düzelt":""}</small><small>{people.find(m=>m.id===p.memberId)?.username?`@${people.find(m=>m.id===p.memberId).username} · `:""}{people.find(m=>m.id===p.memberId)?.team}</small>{p.working&&<small>Önce şantiye seansını tamamla veya durdur.</small>}</span>
        {!state.complete&&<button className="btn outline" disabled={busy||!!p.working||!state.groupId} aria-label={`${p.name} hesabını değiştir`} onClick={()=>{setEditing(p.slot);setReplacement("");setError("");setNotice("");}}>Hesabı değiştir</button>}
      </div>)}</div>
      {person&&!state.complete&&<form className="imece-owner-replace" onSubmit={replace}>
        <h3>{person.name} · hesabı düzelt</h3><p>Bu görev yerindeki {person.minutes} dk katkı ve kişisel paylar korunur; seçtiğin hesap kaldığı yerden devam eder. Kişisel tuğla, bina ve çalışma geçmişi aktarılmaz.</p>
        <label htmlFor="imece-replacement">Yeni katılımcı hesabı</label><select id="imece-replacement" value={replacement} onChange={e=>setReplacement(e.target.value)} disabled={busy} required><option value="">Doğru hesabı seç</option>{people.filter(p=>!state.crew.some(c=>c.memberId===p.id)).map(p=><option key={p.id} value={p.id}>{p.name} · @{p.username||p.id} · {p.team}</option>)}</select>
        <div className="imece-owner-replace-actions"><Busy className="btn primary" type="submit" loading={busy} disabled={!replacement}>Katılımcıyı güncelle</Busy><button className="btn outline" type="button" disabled={busy} onClick={()=>setEditing(null)}>Vazgeç</button></div>
      </form>}
      <p>Dört kişilik kadronun yanlış hesabını yalnız buradan düzeltebilirsin; katkı ve görev ilerlemesi korunur. Herkesin kişisel görevleri bitmeden açılış yapılmaz. Tamamlanan projenin kadrosu değiştirilemez.</p><button className="btn outline" disabled={busy} onClick={load}>Katkıları yenile</button>
    </>:<><p>Bu ekipten dört kişi seç; Kara her birine ayrı bir görev mektubu getirsin. Proje ancak bu düğmeye bastığında açılır. Seçilen görünen adlar, avatarlar ve katkılar yalnız kendi ekibinin şantiyesinde görünür.</p><p><b>Hedef:</b> 400 + 1.200 + 400 = 2.000 dk. <b>Kişisel pay:</b> herkes için 50 + 150 + 50 = 250 dk. Kalan 1.000 dk paylaşılır. Test veya terk edilmiş hesap seçme; yanlış hesabı daha sonra buradan düzeltebilirsin.</p><div className="imece-owner-roster">{people.map(p=><label key={p.id}><input type="checkbox" checked={selected.includes(p.id)} disabled={!selected.includes(p.id)&&selected.length===4} onChange={e=>setSelected(a=>e.target.checked?[...a,p.id]:a.filter(id=>id!==p.id))}/><Avatar member={p}/><span><b>{p.name}</b><small>{p.team}{selected.includes(p.id)?` · ${IMECE_ROLES[selected.indexOf(p.id)].name}`:""}</small></span></label>)}</div><Busy className="btn primary" loading={busy} disabled={selected.length!==4} onClick={launch}><Flag size={18}/>Dört ustayı göreve çağır · {selected.length}/4</Busy></>}
    <hr/><h3>Eski Anıtkabirler</h3><p>Otomatik kaldırılmaz. Ekipler → kişi → 🎁 → Köyü yolundan “Yalnız Anıtkabir” filtresiyle tek tek kaldırabilirsin. Tuğla ve odak dakikaları değişmez; kaldırılan yapının kendisi ve beğenileri silinir.</p>
  </section>;
}
