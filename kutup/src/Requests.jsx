import { useNavigation, RouteLink } from "./Navigation.jsx";
// "Batur’a ilet": ideas, bugs and small talk that travel through stages Batur
// sets in his panel, shown to the sender as a cargo-style tracker.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Dices, Heart, Plus, Send, ShieldCheck } from "lucide-react";
import { api, get, FEEDBACK, dateLabel, shortTime } from "./api.js";
import {
  DECLINED,
  REQUEST_STEPS,
  statusLabel,
  statusLine,
} from "../shared/requests.js";
import { Burst, Busy, reducedMotion, storage } from "./ui.jsx";

// Starting points for people who don't know what to ask for.
const SPARKS = {
  idea: [
    ["Eğlenceli", "Haftanın en erken geleni için taç rozeti 👑 Sabah ilk “Ben geldim!” diyen bütün gün taçla gezsin."],
    ["Kütüp hayatı", "Kafeterya radarı ☕ Tek tuşla “kafeterya boş / sıra var” bilgisi bırakalım, kimse boşuna inmesin."],
    ["İşe yarar", "Sınav geri sayımı ⏳ Profilime “Finale 12 gün” yazabileyim, ekip görsün, moral versin."],
    ["Birlikte", "Birlikte çıkış 🚇 “20.00’de çıkıyorum, metroya beraber yürüyen?” diye çağrı atabilelim."],
    ["Eğlenceli", "Kahve çarkı 🎡 Molada kimin ısmarlayacağını uygulama çevirsin, itiraz yok."],
    ["Odak", "Seri sayacı 🔥 Üst üste kaç gün kütübe geldiğim görünsün, zinciri kırmak istemem."],
    ["İşe yarar", "Sessiz köşe uyarısı 🤫 Salonda gürültü varsa tek tuşla ekibe “şu masalar sakin” diyebilelim."],
    ["Odak", "Günün hedefi ✅ Sabah “bugün 3 ünite” yazayım, akşam tikleyeyim, ekip alkışlasın."],
    ["Eğlenceli", "Günün modu 😴📚🔥 İsmimin yanında bugünkü halim emoji olarak dursun."],
    ["Birlikte", "Ortak çalma listesi 🎶 Odak odasında herkesin şu an ne dinlediği görünsün."],
  ],
  bug: [
    ["Bildirim", "Bildirimleri açtım ama arkadaşım kütübe gelince bana bir şey düşmedi. iPhone, ana ekrandan açıyorum."],
    ["Durum", "“Ben geldim” dedim ama arkadaşlarımın ekranında hâlâ “Dışarıda” görünüyorum, 5 dakika bekledim."],
    ["Odak", "50 dakikalık seansı bitirdim ama haftalık tabloda dakikalarım görünmüyor."],
    ["Görünüm", "Telefonda plan kartındaki yazı taşıyor, saat okunmuyor. Android, Chrome."],
    ["Giriş", "Başka cihaza geçmek için kod aldım, 2 dakika içinde yazdım ama “geçersiz” dedi."],
  ],
  hello: [
    ["Teşekkür", "Bu uygulama yüzünden kütübe daha çok geliyorum, suç tamamen sende 😄"],
    ["Moral", "Bugün herkes aynı masadaydı, efsane gündü. Eline sağlık aga 🫶"],
    ["Rüşvet", "Bir özelliği öne alırsan bir sonraki molada çaylar benden 🍵"],
    ["Merak", "Bu siteyi nasıl yaptın? Bir gün bana da anlatır mısın?"],
  ],
  // n43: asking for a building that is not in the catalogue yet.
  build: [
    ["Ünlü yapı", "Ayasofya 🕌 Dev kubbesi ve pandantifleriyle; şantiyede kubbenin nasıl oturduğunu görmek isterim."],
    ["Ünlü yapı", "Tac Mahal 🤍 Beyaz mermer, dört minare ve önündeki uzun havuz."],
    ["Köprü", "Boğaz Köprüsü 🌉 Kuleler, ana kablolar ve asılı tabliye adım adım kurulsun."],
    ["Mühendislik", "Baraj 💧 Kemer baraj, arkasında göl; beton dökümü katman katman yükselsin."],
    ["Bizden", "Milli Kütüphane 📚 Kendi kütüphanemiz köyde de olsun, önünde merdivenleriyle."],
    ["Eğlenceli", "Dönme dolap 🎡 Köyün bir köşesinde yavaşça dönsün."],
    ["Ünlü yapı", "Kız Kulesi 🗼 Denizin ortasında, küçük adasıyla."],
  ],
};
const pick = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n);

export function ago(timestamp, now = Date.now()) {
  const minutes = Math.floor((now - timestamp) / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} sa önce`;
  if (minutes < 48 * 60) return "dün";
  return dateLabel(timestamp);
}

// ---- "new update" bookkeeping: what the sender last saw, per request ----
const SEEN_KEY = "kutup-requests-seen";
const fingerprint = (item) => `${item.status}|${item.reply || ""}`;
function seenMap() {
  try {
    return JSON.parse(storage.get(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}
export function freshIds(items) {
  const seen = seenMap();
  return items
    .filter((item) => item.id in seen && seen[item.id] !== fingerprint(item))
    .map((item) => item.id);
}
function markSeen(items) {
  storage.set(
    SEEN_KEY,
    JSON.stringify(Object.fromEntries(items.map((i) => [i.id, fingerprint(i)]))),
  );
}

export function RequestTracker({ item }) {
  const steps = REQUEST_STEPS[item.kind] || REQUEST_STEPS.idea;
  const declined = item.status === "declined";
  const at = declined
    ? Math.max(0, steps.findIndex(([s]) => s === "seen"))
    : Math.max(0, steps.findIndex(([s]) => s === item.status));
  const progress = steps.length > 1 ? at / (steps.length - 1) : 1;
  // Start empty and fill on the next frame so the rail visibly travels.
  const [shown, setShown] = useState(reducedMotion() ? progress : 0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(progress));
    return () => cancelAnimationFrame(frame);
  }, [progress]);
  const when = (status) =>
    [...(item.events || [])].reverse().find((e) => e.status === status)?.created;
  const [declinedLabel, declinedEmoji] = DECLINED[item.kind] || ["Kapandı", "🫶"];
  return (
    <div
      className={`tracker ${declined ? "declined" : ""} ${item.status === "new" ? "waiting" : ""} ${item.status === "done" ? "arrived" : ""}`}
      style={{ "--progress": shown, "--steps": steps.length }}
    >
      <div className="tracker-rail" aria-hidden="true">
        <i className="tracker-fill" />
        <span className="tracker-runner">
          {declined ? declinedEmoji : item.status === "done" ? steps[at][2] : "✉️"}
        </span>
      </div>
      <ol className="tracker-steps">
        {steps.map(([status, label, emoji], i) => (
          <li
            key={status}
            className={
              i < at || (declined && i === at)
                ? "passed"
                : i === at
                  ? "current"
                  : ""
            }
            aria-current={i === at && !declined ? "step" : undefined}
          >
            <span className="tracker-dot">{i <= at ? emoji : ""}</span>
            <b>{label}</b>
            {when(status) && i <= at && <small>{shortWhen(when(status))}</small>}
          </li>
        ))}
      </ol>
      <p className="tracker-line">
        {declined && (
          <span className="tracker-declined">
            {declinedEmoji} {declinedLabel}
          </span>
        )}
        {statusLine(item.kind, item.status)}
        {item.status === "new" && (
          <span className="waiting-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </p>
    </div>
  );
}
function shortWhen(timestamp) {
  const today = new Date().toDateString() === new Date(timestamp).toDateString();
  return today ? shortTime(timestamp) : dateLabel(timestamp);
}

function RequestCard({ item, fresh }) {
  const [emoji, title] = FEEDBACK[item.kind] || FEEDBACK.idea;
  const [label] = statusLabel(item.kind, item.status);
  const celebrate = fresh && ["accepted", "done"].includes(item.status);
  return (
    <article className={`request-card ${fresh ? "fresh" : ""}`}>
      {celebrate && <Burst />}
      <header>
        <span className="request-kind">
          {emoji} {title}
        </span>
        {fresh && <span className="request-new">Yeni gelişme · {label}</span>}
        <time>{ago(item.created)}</time>
      </header>
      <p className="request-text">{item.text}</p>
      <RequestTracker item={item} />
      {item.reply && (
        <div className="batur-reply">
          <span aria-hidden="true">👨‍💻</span>
          <p>
            <b>Batur’un notu</b>
            {item.reply}
          </p>
        </div>
      )}
    </article>
  );
}

export function FeedbackPage({ me, requireMember, notify, onSeen, startKind = "idea" }) {
  const detailId = useNavigation()?.route.feedbackRequest;
  const [loaded, setLoaded] = useState(false);
  const [kind, setKind] = useState(FEEDBACK[startKind] ? startKind : "idea"),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [phase, setPhase] = useState("form"),
    [mine, setMine] = useState([]),
    [fresh, setFresh] = useState([]),
    [sparks, setSparks] = useState(() => pick(SPARKS[FEEDBACK[startKind] ? startKind : "idea"], 3));
  const textarea = useRef(null);
  useEffect(() => {
    if (!me) return;
    get("/feedback")
      .then((items) => {
        setFresh(freshIds(items));
        markSeen(items);
        setMine(items);
        onSeen?.();
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [me?.id]);
  const chooseKind = (id) => {
    setKind(id);
    setSparks(pick(SPARKS[id], 3));
  };
  const send = (e) => {
    e.preventDefault();
    requireMember(async () => {
      setBusy(true);
      try {
        const { item } = await api("/feedback", { kind, text });
        const next = [item, ...mine];
        setMine(next);
        markSeen(next);
        setText("");
        if (reducedMotion()) setPhase("sent");
        else {
          setPhase("flying");
          setTimeout(() => setPhase("sent"), 1150);
        }
      } catch (e) {
        notify(e.message);
      } finally {
        setBusy(false);
      }
    });
  };
  const latest = mine[0];
  return (
    <div className="feedback-layout">
      <div>
        {detailId && <section className="panel">
          <h2>İstek takibi</h2>
          {mine.find(item => item.id === detailId) ? <RequestCard item={mine.find(item => item.id === detailId)} /> : <p>{loaded ? "Bu istek açık hesabında bulunamadı." : "İstek yükleniyor…"}</p>}
          <RouteLink className="text-button" href="/ben/batura-ilet">Bütün isteklerim</RouteLink>
        </section>}
        <section className={`feedback-card ${phase}`}>
          <div className="feedback-intro">
            <span className="feedback-stamp">
              Batur’a
              <br />
              <b>özel posta</b>
            </span>
            <span className={`envelope-art${fresh.length ? " wiggle" : ""}`}>💌</span>
            <span className="eyebrow">KÜTÜP’ÜN MUTFAĞI</span>
            <h2>
              “Aga, aklıma
              <br />
              bir şey geldi…”
            </h2>
            <p>
              Fikrin, derdin, iki güzel lafın. Gönder, Batur’un masasında hangi
              aşamada olduğunu buradan takip et.
            </p>
          </div>
          {phase === "flying" && (
            <div className="send-flight" aria-live="polite">
              <span className="flight-envelope">💌</span>
              <span className="flight-trail" />
              <p>Batur’un kutusuna uçuyor…</p>
            </div>
          )}
          {phase === "sent" && latest ? (
            <div className="feedback-success" aria-live="polite">
              <span className="postmark">
                Kutuya
                <br />
                düştü ✓
              </span>
              <h3>Yola çıktı! Buradan takip et.</h3>
              <RequestTracker item={latest} />
              <button className="btn outline" onClick={() => setPhase("form")}>
                Bir not daha bırak <Plus size={15} />
              </button>
            </div>
          ) : phase === "form" ? (
            <form className="feedback-form" onSubmit={send}>
              <label className="field-label">Ne getirdin?</label>
              <div className="feedback-types">
                {Object.entries(FEEDBACK).map(([id, [emoji, title]]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => chooseKind(id)}
                    aria-pressed={kind === id}
                    className={kind === id ? "selected" : ""}
                  >
                    <span>{emoji}</span>
                    {title}
                    {kind === id && <Check size={14} />}
                  </button>
                ))}
              </div>
              <div className="sparks">
                <div className="sparks-head">
                  <span>
                    {kind === "bug"
                      ? "Böyle anlatırsan Batur hemen bulur:"
                      : kind === "hello"
                        ? "Mesela şöyle bir şey:"
                        : kind === "build"
                          ? "Köyde görmek istediğin yapıyı yaz. Mesela:"
                          : "Aklına gelmedi mi? Şunlardan biriyle başla:"}
                  </span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setSparks(pick(SPARKS[kind], 3))}
                  >
                    <Dices size={15} /> Başka örnek
                  </button>
                </div>
                <div className="spark-list">
                  {sparks.map(([tag, example]) => (
                    <button
                      type="button"
                      key={example}
                      className="spark"
                      onClick={() => {
                        setText(example);
                        textarea.current?.focus();
                      }}
                    >
                      <small>{tag}</small>
                      {example}
                    </button>
                  ))}
                </div>
              </div>
              <label className="field-label" htmlFor="feedback-text">
                Anlat bakalım
              </label>
              <textarea
                id="feedback-text"
                ref={textarea}
                required
                minLength={5}
                maxLength={1200}
                rows={5}
                placeholder={FEEDBACK[kind][2]}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="feedback-form-meta">
                <span>
                  <ShieldCheck size={14} /> Sadece Batur görür.
                </span>
                <span>{text.length}/1200</span>
              </div>
              <Busy loading={busy} className="btn dark full" type="submit">
                Batur’a uçur <Send size={17} />
              </Busy>
            </form>
          ) : null}
        </section>
        {mine.length > 0 && (
          <section className="panel my-requests">
            <h3>Gönderdiklerin</h3>
            {mine.map((item) => (
              <div key={item.id}><RequestCard item={item} fresh={fresh.includes(item.id)} /><RouteLink className="catalog-inspect" href={`/ben/batura-ilet/istekler/${encodeURIComponent(item.id)}`}>Bu isteği aç →</RouteLink></div>
            ))}
          </section>
        )}
      </div>
      <aside className="feedback-aside">
        <p className="batur-sign">
          <span aria-hidden="true">👨‍💻</span> burayı yapan eleman
        </p>
        <h3>Selam, ben Batur.</h3>
        <p>
          Her isteği tek tek okuyorum. Açtığım an “İncelendi” olur; kabul
          edersem yapılıyor, bitince yayında yazar. Her adımda telefonuna haber
          gelir.
        </p>
        <ol className="request-journey line">
          {REQUEST_STEPS.idea.map(([status, label, emoji]) => (
            <li key={status}>
              <span>{emoji}</span>
              {label}
            </li>
          ))}
        </ol>
        <span className="handwritten">beraber güzelleştirelim ↙</span>
        <div className="feedback-promise">
          <Heart size={18} />
          <p>
            Kötü fikir yok.
            <br />
            Söylenmemiş fikir var.
          </p>
        </div>
      </aside>
    </div>
  );
}

// Badge count for the nav: requests whose stage or note changed since last look.
export function useRequestUpdates(session, tab) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!session) return setCount(0);
    const check = () =>
      get("/feedback")
        .then((items) => setCount(freshIds(items).length))
        .catch(() => {});
    check();
    const visible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [session?.memberId]);
  useEffect(() => {
    if (tab === "feedback") setCount(0);
  }, [tab]);
  return useMemo(() => ({ count, clear: () => setCount(0) }), [count]);
}
