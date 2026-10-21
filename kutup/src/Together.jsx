// Studying together and making sure messages are seen: who is at the desk
// right now, the tap-to-join banner from an invite, a coffee call that waits
// for an answer, and new board messages that reach you wherever you are.
import React, { useEffect, useRef, useState } from "react";
import {relaxedChoice} from "./device.js";
import { X } from "lucide-react";
import { Avatar,Busy,storage } from "./ui.jsx";
import {get,shortTime} from "./api.js";
import {Modal} from "./Modal.jsx";
import { chime } from "./Sound.jsx";
import { JOIN_LEAD,HONEST_MIN,modelOf } from "../shared/catalog.js";
import "./together.css";
import {ScreenOffOption} from "./ScreenOffOption.jsx";

const minutesLeft = (m, now) => Math.max(1, Math.ceil((m.focusEnd - (m.focusPausedAt || now)) / 60000));

export const focusWork=m=>m.focusImece?"Anıtkabir görevi":m.focusStrict?modelOf(m.focusModel).name:"Odak çalışması";
export function SiteRoster({me,members,now,onlySites=false,dark=false,onJoin}){
  const active=members.filter(m=>m.focusEnd>now&&(!onlySites||m.focusStrict||m.focusImece));
  if(!active.length)return null;
  return <ul className={`site-roster ${dark?"dark":""}`} aria-label="Kim ne inşa ediyor">{active.map(m=><li key={m.id}>
    <Avatar member={m} size="tiny"/><span><b>{m.name}{m.id===me?.id?" · sen":""}</b><small>{focusWork(m)} · {m.focusPausedAt?"Çay molası":`${minutesLeft(m,now)} dk kaldı`}</small></span>
    {onJoin&&m.id!==me?.id&&!(me?.focusEnd>now)&&!m.focusPausedAt&&(m.focusImece||m.focusEnd-now>=HONEST_MIN*60000)&&<button type="button" className="join" onClick={()=>onJoin(m)}>{m.focusImece?"Göreve bak":"Katılımı seç"}</button>}
  </li>)}</ul>;
}
/** One roster supplies the focus card, full screen and village. */
export function DeskMates({me,members,now,dark=false,onJoin}){
  const mates=members.filter(m=>m.id!==me?.id&&m.focusEnd>now);
  if(!mates.length)return null;
  return <div className={`desk-mates ${dark?"dark":""}`}><span>{mates.length} arkadaşın odakta{me?.focusEnd>now?` · imece +%${Math.min(20,mates.length*5)}’e kadar`:""}</span><SiteRoster me={me} members={mates} now={now} dark onJoin={onJoin}/></div>;
}

/** Invites and roster buttons open the same explicit join confirmation. */
export function JoinBanner({friend,me,now,join,close,onImece}){
  const [quote,setQuote]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[model,setModel]=useState(""),[build,setBuild]=useState(true),[relaxed,setRelaxed]=useState(()=>relaxedChoice(me)),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    setQuote(null);setError("");
    if(!friend||!me)return;
    const controller=new AbortController();
    get(`/focus/join/${encodeURIComponent(friend.id)}`,controller.signal).then(q=>{setQuote(q);setModel(q.models.find(m=>m.id===storage.get("kutup-model"))?.id||q.models[0]?.id||"");setBuild(q.models.length>0&&storage.get("kutup-fidan-on")!=="0");}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
    return()=>controller.abort();
  },[friend?.id,friend?.focusEnd,friend?.focusPausedAt,me?.id,attempt]);
  if(!friend||!me||me.focusEnd>now)return null;
  const remaining=Math.max(0,Math.floor((friend.focusEnd-now)/60000));
  const models=quote?.models.filter(m=>m.minutes<=remaining)||[];
  const item=models.find(m=>m.id===model),canBuild=build&&!!item;
  return <Modal title="Birlikte odaklan" subtitle={`${friend.name} için katılım seçimi`} close={busy?()=>{}:close}>
    {error&&<p className="form-error" role="alert">{error} <button className="text-button" onClick={()=>setAttempt(n=>n+1)}>Yeniden oku</button></p>}
    {!quote&&!error?<p>Arkadaşının seansı okunuyor…</p>:quote?.imece?<><p>Bu bir Anıtkabir görevi. Zamanlayıcısına katılmak, senin kişisel görevini başlatmaz.</p><p>Şantiyede kendi 25, 50 veya 75 dakikalık görevini seç; katkın kendi hesabına yazılır.</p><button className="btn primary" onClick={onImece}>Anıtkabir görevimi aç</button></>:quote?.paused?<p>Arkadaşın çay molasında. Seansına döndüğünde yeniden katılabilirsin.</p>:quote&&remaining<HONEST_MIN?<p>20 dakikadan az kaldı. Köyden yeni bir 25 dakikalık seans başlatabilirsin; kısa süreden tamamlanmış bina veya ödül üretilmez.</p>:quote?<form className="join-choice" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await join({end:quote.friend.end,strict:canBuild,model:item?.id,relaxed});}finally{setBusy(false);}}}>
      <p><b>{friend.name}</b> ile aynı anda, saat <b>{shortTime(quote.friend.end)}</b> biteceksiniz. Sana kalan süre <b>{remaining} dk</b>.</p>
      <fieldset><legend>Sen ne yapacaksın?</legend><label><input type="radio" name="join-mode" checked={!build} onChange={()=>setBuild(false)}/>Yalnız odak · kişisel bina yapılmaz</label><label><input type="radio" name="join-mode" checked={build} disabled={!models.length} onChange={()=>setBuild(true)}/>Kendi binamı inşa et</label></fieldset>
      {build&&models.length>0?<><label htmlFor="join-model">Kendi yapın</label><select id="join-model" value={model} onChange={e=>setModel(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name} · en az {m.minutes} dk · {m.cost} tuğla</option>)}</select><ScreenOffOption relaxed={relaxed} onChange={setRelaxed} disabled={busy}/></>:!models.length?<p>Kalan süreye, tuğlana ve planlarına uygun bina yok. Yalnız odaklanabilir veya ayrı bir inşaat başlatabilirsin.</p>:null}
      <p className="join-summary">{canBuild?`${item.name} sana ait olacak. ${item.cost} tuğla şimdi ödenir; ${remaining} dk boyunca ${relaxed?"ekran kapalıyken de":"Kütüp açıkken"} çalışıp seansı tamamlaman gerekir. Arkadaşının binası kopyalanmaz.`:"Yalnız izlenen odak dakikaların kaydedilir. En az 20 dakika tamamlamalısın; malzeme ücreti ve kişisel bina yok."}</p>
      <Busy type="submit" className="btn primary full" loading={busy} disabled={build&&!item}>{canBuild?`${item.cost} tuğla öde ve katıl`:"Yalnız odaklanarak katıl"}</Busy>
    </form>:null}
  </Modal>;
}

const ANSWERS = ["Geliyorum ☕", "5 dk sonra geliyorum 🙏", "Şimdi olmaz, sonra"];
/** A coffee call addressed to me waits on screen (over everything) until I answer. */
export function CallOverlay({ data, me, reply, seen }) {
  const [dismissed, setDismissed] = useState([]);
  const call = me
    ? [...data.messages]
        .reverse()
        .find(
          (m) =>
            m.kind === "coffee" &&
            m.toMember === me.id &&
            Date.now() - m.created < 15 * 60000 &&
            !dismissed.includes(m.id) &&
            !data.messages.some((r) => r.replyTo === m.id && r.memberId === me.id),
        )
    : null;
  useEffect(() => {
    if (!call) return;
    chime();
    navigator.vibrate?.([200, 100, 200]);
  }, [call?.id]);
  if (!call) return null;
  const from = data.members.find((m) => m.id === call.memberId);
  return (
    <div className="call-overlay" role="alertdialog" aria-label="Kahve çağrısı">
      <div className="call-card">
        <Avatar member={from} size="large" />
        <h3>{from?.name || "Bir arkadaşın"} seni kahveye çağırıyor ☕</h3>
        <p>{call.text}</p>
        <div className="call-actions">
          {ANSWERS.map((t) => (
            <button key={t} className="btn" onClick={() => reply(call, t)}>
              {t}
            </button>
          ))}
        </div>
        <button
          className="text-button"
          onClick={() => {
            seen(call.created);
            setDismissed((d) => [...d, call.id]);
          }}
        >
          Gördüm, birazdan cevaplarım
        </button>
      </div>
    </div>
  );
}

/**
 * New board messages from friends, wherever you are: a banner for a few
 * seconds (tap to open the board), with a soft chime on the focus screen.
 */
export function MessageBanner({ data, me, onBoard, onHome, focusScreen, open }) {
  const [shown, setShown] = useState(null);
  const since = useRef(Date.now()),
    hide = useRef(0);
  useEffect(() => {
    const fresh = data.messages.filter((m) => m.kind !== "system" && m.memberId !== me?.id && m.created > since.current && !(m.kind === "coffee" && m.toMember === me?.id));
    if (!fresh.length) return;
    since.current = Math.max(...fresh.map((m) => m.created));
    // On the board you see it; on the home tab Kara brings it.
    if ((onBoard || onHome) && !focusScreen) return;
    setShown(fresh.at(-1));
    if (focusScreen) chime();
    clearTimeout(hide.current);
    hide.current = setTimeout(() => setShown(null), 9000);
  }, [data.messages]);
  useEffect(() => () => clearTimeout(hide.current), []);
  if (!shown) return null;
  const from = data.members.find((m) => m.id === shown.memberId);
  return (
    <button
      type="button"
      className="message-banner"
      onClick={() => {
        setShown(null);
        open();
      }}
    >
      <Avatar member={from} size="tiny" />
      <span>
        <b>{from?.name}</b> {shown.kind === "coffee" ? "☕ " : ""}
        {shown.text}
      </span>
    </button>
  );
}

/** Members (other than the author) who have read the board up to this message. */
export function seenBy(data, msg) {
  return data.members.filter((m) => m.id !== msg.memberId && (m.boardSeen || 0) >= msg.created);
}
