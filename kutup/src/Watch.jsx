// n40, dürüst dakika: what a watched session shows when you drift off. The
// rescue card for a cracked site, the "orada mısın?" card on a computer, the
// floating window that keeps the clock above every other app, and the lock
// guide a phone sees before a build starts.
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "./Modal.jsx";
import { isIOS, keepScreenOn, storage } from "./ui.jsx";
import { kindFor } from "../shared/village.js";
import { BUILD_LEAVE, COUNTDOWN, FREE_LEAVE, LEAVE_GRACE, RESCUE_WINDOW, modelOf, rescueMinutes } from "../shared/catalog.js";
import { floatWindow, onFloat } from "./float.js";

const minSec = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s} sn` : `${Math.floor(s / 60)} dk ${s % 60 ? `${s % 60} sn` : ""}`.trim();
};

/** The site cracked while you were away: save it once, or let it fall. */
export function RescueCard({ crack, rescue, letGo }) {
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now);
  const extra = rescueMinutes(crack.minutes);
  const left = (crack.at || now) + RESCUE_WINDOW - now;
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  // The rescue window closed with the card open: the site falls.
  useEffect(() => {
    if (left <= 0 && !busy) act(letGo);
  }, [left <= 0]);
  const act = async (fn) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };
  return (
    <Modal title="🩹 Binan çatladı" subtitle={`${minSec(crack.away)} uygulamanın dışındaydın.`} close={() => act(letGo)}>
      <p>
        Bir kez kurtarabilirsin. Uzakta geçen süre sayılmaz, üstüne <b>{extra} dk</b> ceza eklenir: binan o kadar geç biter.
      </p>
      <p className="form-footnote">Kurtarmak için {minSec(left)} kaldı.</p>
      <p className="form-footnote">Kurtarılan bina köyünde yamalı durur ve Pano'da “telefona dokunmadan” yazmaz. Bu inşaatta ikinci şans yok.</p>
      <button type="button" className="btn primary full" disabled={busy} onClick={() => act(rescue)}>
        Kurtar · +{extra} dk
      </button>
      <button type="button" className="btn outline full" disabled={busy} onClick={() => act(letGo)}>
        Bırak, yıkılsın
      </button>
    </Modal>
  );
}

/** Computer: nobody touched the mouse or keyboard for a while. */
export function HereCard({ asking, now, strict, here }) {
  const unanswered = asking < 0;
  const left = Math.max(0, Math.ceil((asking + 2 * 60000 - now) / 1000));
  return (
    <Modal
      title={unanswered ? "🔴 Uzaktaydın" : "⚠️ Orada mısın?"}
      subtitle={unanswered ? "Bu süre sayılmıyor." : "Bir süredir fare ya da klavye kullanılmadı."}
      close={here}
    >
      <p>
        {unanswered
          ? strict
            ? "Dönünce binana bakacağız: kısa sürdüyse kurtarabilirsin."
            : `Döndüğün an saymaya devam ederiz. ${FREE_LEAVE / 60000} dk'dan uzun sürerse seans biter.`
          : `${left} saniye içinde fareyi oynat ya da bas, yoksa bu süre sayılmaz. Kitaptan çalışıyorsan da bas, sorun yok.`}
      </p>
      <button type="button" className="btn primary full" onClick={here}>
        Buradayım
      </button>
    </Modal>
  );
}

/** The floating window's content, drawn into Chrome's picture-in-picture window. */
export function FloatPanel({ me, now, asking, crack, phoneGone, here }) {
  const [win, setWin] = useState(floatWindow);
  useEffect(() => onFloat(setWin), []);
  if (!win || !me?.focusEnd) return null;
  const left = Math.max(0, Math.ceil((me.focusEnd - (me.focusPausedAt || now)) / 1000));
  const total = (me.focusMinutes || 1) * 60;
  const item = me.focusStrict ? modelOf(me.focusModel, kindFor(me.focusMinutes)) : null;
  const alarm = !!asking || !!crack || !!phoneGone;
  // The first minute of a question is quiet (yellow); then red, shaking and loud.
  const soft = asking > 0 && now - asking < 60000;
  return createPortal(
    <div className={`float ${alarm ? (soft ? "soft" : "alarm") : ""}`} onClick={asking && !crack ? here : undefined}>
      <div className="top">{item ? `${item.emoji} ${item.name}` : "🎧 Serbest odak"}</div>
      <div className="clock">
        {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
      </div>
      <div className="bar">
        <i style={{ width: `${Math.min(100, Math.max(0, (1 - left / total) * 100))}%` }} />
      </div>
      {crack ? (
        <p>Binan çatladı! Kütüp'e dön.</p>
      ) : phoneGone ? (
        <p>📱 Telefonu eline aldın! Kütüp'e dön.</p>
      ) : alarm ? (
        <>
          <p>{asking < 0 ? "Uzaktaydın, süre sayılmıyor." : "Orada mısın?"}</p>
          <button type="button" onClick={here}>
            Buradayım
          </button>
        </>
      ) : (
        <p>{me.focusPausedAt ? "☕ Çay molası" : item ? "Şantiye seni bekliyor 👀" : "Uzakta geçen dakika sayılmaz"}</p>
      )}
    </div>,
    win.document.body,
  );
}

const android = () => /Android/i.test(navigator.userAgent);
const LOCK_SEEN = "kutup-kilit";

/**
 * Phone, before a build starts: the phone's own lock (Rehberli Erişim on an
 * iPhone, app pinning on Android) keeps every other app shut for the session,
 * and a focus mode lets only the calls you choose through. Kütüp cannot see
 * whether it is on; this explains it and asks. The full guide shows the first
 * time and whenever asked; after that a one-line reminder.
 */
export function LockSheet({ minutes, start, close, notifications, askNotifications }) {
  const [full, setFull] = useState(() => storage.get(LOCK_SEEN) !== "1");
  const [busy, setBusy] = useState(false);
  const blocked = notifications === "denied";
  const go = async () => {
    keepScreenOn(); // inside the tap, before anything is awaited
    setBusy(true);
    if (notifications === "default") await askNotifications();
    storage.set(LOCK_SEEN, "1");
    await start();
    setBusy(false);
  };
  const steps = isIOS
    ? [
        ["Rehberli Erişim'i aç", "Ayarlar → Erişilebilirlik → Rehberli Erişim. Bir parola koy."],
        ["Odak modu kur", "Ayarlar → Odak → + → Özel, adı “Kütüp”. Bildirimlerde sadece Kütüp'e izin ver (geri sayım ondan gelir), Aramalar'da Favoriler'e. Ayarlar → Ses ve Dokunuş → Dokunsal: Her zaman, yoksa sessizde titremez."],
        ["Kilitle", "Şimdi yan tuşa üç kez bas → Başlat, sonra aşağıdaki düğmeye dokun. Bitince yine üç kez bas, parolanı gir."],
      ]
    : android()
      ? [
          ["Uygulama sabitlemeyi aç", "Ayarlar → Güvenlik → Uygulama sabitleme (bazı telefonlarda “Ekran sabitleme”)."],
          ["Rahatsız Etmeyin'i ayarla", "Ayarlar → Bildirimler → Rahatsız Etmeyin. Yıldızlı kişilerin aramalarına ve Kütüp uygulamasına izin ver. Kütüp'ün bildirim ayarında ses ve titreşim açık olsun: geri sayım her saniye titrer."],
          ["Sabitle", "Son uygulamalar ekranında Kütüp'ün simgesine dokun → Sabitle, sonra aşağıdaki düğmeye dokun."],
        ]
      : [["Telefonunun kilidini aç", "Tek uygulamaya kilitleme (iPhone'da Rehberli Erişim, Android'de Uygulama sabitleme) ve sadece seçtiğin aramalara izin veren bir odak modu."]];
  return (
    <Modal title="🔒 Kilit modu" subtitle={`${minutes} dk boyunca telefon sadece Kütüp olsun.`} close={close} className="lock-sheet">
      {full ? (
        <>
          <ol className="lock-steps">
            {steps.map(([title, text]) => (
              <li key={title}>
                <b>{title}</b>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <p className="form-footnote">
            Kural: uygulamadan çıkarsan {LEAVE_GRACE / 1000} saniye sessiz payın var. Sonra bildirimde {COUNTDOWN} saniyelik geri sayım başlar{isIOS ? "" : ", telefon her saniye titrer"}. Bitince dönmediysen binan çatlar; {RESCUE_WINDOW / 60000} dk içinde dönersen bir kez kurtarabilirsin (+%20 süre). Çay molasında telefon serbest.
          </p>
        </>
      ) : (
        <p>
          Yan tuşa üç kez basıp kilitlemeyi unutma. Çıkarsan {LEAVE_GRACE / 1000} sn sonra geri sayım başlar, {BUILD_LEAVE / 1000} saniyede binan çatlar.{" "}
          <button type="button" className="text-button" onClick={() => setFull(true)}>
            Nasıl?
          </button>
        </p>
      )}
      {blocked ? (
        <p className="form-error">
          Bildirimler kapalı: çıkınca uyarı gelmez, binan sessizce çatlar.{" "}
          {isIOS ? "iPhone Ayarlar → Bildirimler → Kütüp'ten aç." : "Tarayıcının site ayarlarından Bildirimler'e izin ver."} O zamana kadar Serbest modla çalışabilirsin.
        </p>
      ) : notifications === "unsupported" && isIOS ? (
        <p className="form-footnote">Uyarı bildirimleri için Kütüp'ü ana ekrana ekle.</p>
      ) : null}
      <button type="button" className="btn primary full" disabled={busy || blocked} onClick={go}>
        {notifications === "default" ? "Bildirimlere izin ver ve başlat" : "Kilitledim, başlat"}
      </button>
    </Modal>
  );
}
