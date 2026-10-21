// The focus card of the Köy tab (timer, build or free mode, the team rhythm)
// and the coffee card. Split out of App.jsx (n29).
import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Expand, Headphones, PictureInPicture2, Play, SlidersHorizontal, Square } from "lucide-react";
import { minutesLabel } from "./api.js";
import { Busy, keepScreenOn, releaseScreen, screenAwake, storage } from "./ui.jsx";
import { KaraBuddy } from "./Kara.jsx";
import { kindFor } from "../shared/village.js";
import { BUILD_LEAVE, BY_ID, CHAIN_GAP, CLASSES, GRACE, HONEST_MIN, RHYTHMS, fits, minutesOf, modelOf, refundLater, refundNow, rhythmAt, rhythmEnd, streakBonus, teaBreakFor, wageFor } from "../shared/catalog.js";
import { BuildingThumb, CatalogModal } from "./Economy.jsx";
import { SoundButton, SoundPanel } from "./Sound.jsx";
import { enterFullscreen } from "./fullscreen.js";
import { DeskMates } from "./Together.jsx";
import { Ask } from "./Help.jsx";
import { Modal } from "./Modal.jsx";
import { LockSheet } from "./Watch.jsx";
import "./delivery.css";
import { closeBuildNotice } from "./buildNotices.js";
import { floatSupported, floatWindow, onFloat, primeFloat } from "./float.js";

// Each digit is its own element keyed by value, so only the digit that changed
// re-mounts and rolls in.
function Roll({ value }) {
  return String(value)
    .padStart(2, "0")
    .split("")
    .map((digit, i) => (
      <span className="roll" key={`${i}-${digit}`}>
        {digit}
      </span>
    ));
}
// A computer (mouse or trackpad) rather than a phone or tablet: build mode is
// gentler there, since other tabs and apps are where the studying happens.
export const onComputer = () => typeof matchMedia === "function" && !matchMedia("(pointer: coarse)").matches;
// The building picked for the next build-mode session (kept on this device).
export const pickedModel = () => (BY_ID[storage.get("kutup-model")] ? storage.get("kutup-model") : "kulube");
const clockTR = (t) => {
  const d = new Date(t + 3 * 3600000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};
const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
const notificationState = () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);
export function FocusCard({ me, members, now, requireMember, mutate, compact, onScreen, rhythm = null, outcome = null, onJoin, askNotifications,catalogSignal=0,consumeCatalogSignal }) {
  const [duration, setDuration] = useState(25),
    [busy, setBusy] = useState(false),
    [fidan, setFidan] = useState(() => storage.get("kutup-fidan-on") !== "0"),
    [relaxed, setRelaxed] = useState(() => storage.get("kutup-build-mode") === "relaxed"),
    [model, setModel] = useState(pickedModel),
    [picking, setPicking] = useState(false),
    [mixer, setMixer] = useState(false),
    [invite, setInvite] = useState(() => storage.get("kutup-invite") === "1"),
    [lock, setLock] = useState(false),
    [floating, setFloating] = useState(() => !!floatWindow());
  useEffect(() => onFloat((w) => setFloating(!!w)), []);
  useEffect(()=>{const open=()=>{if(!(me?.focusEnd>Date.now()))setPicking(true);};window.addEventListener("kutup:open-catalog",open);return()=>window.removeEventListener("kutup:open-catalog",open);},[me?.focusEnd]);
  const finishing = !!me?.focusEnd && me.focusEnd <= now;
  const running = !!me?.focusEnd && !finishing;
  // Build mode: the building sets the length. Free focus: you pick it. Under
  // the team rhythm the round does: the session ends at the shared break.
  const item = running && me.focusImece ? {...modelOf(null,kindFor(me.focusMinutes)),name:"Anıtkabir imecesi",cost:0,id:"anitkabir",emoji:"🇹🇷"} : running ? modelOf(me.focusModel, kindFor(me.focusMinutes)) : BY_ID[model];
  const round = rhythm && RHYTHMS[rhythm] ? rhythmAt(rhythm, now) : null,
    roundMinutes = round ? Math.floor((rhythmEnd(rhythm, now) - now) / 60000) : 0;
  const length = round ? roundMinutes : fidan ? minutesOf(item) : duration;
  const tooBig = !!round && fidan && !running && !fits(item, roundMinutes);
  const pausedAt = running ? me.focusPausedAt || 0 : 0,
    teaMax = running ? teaBreakFor(me.focusMinutes) : 0,
    teaLeft = pausedAt ? Math.max(0, pausedAt + teaMax - now) : 0;
  const seconds = running ? Math.max(0, Math.ceil((me.focusEnd - (pausedAt || now)) / 1000)) : length * 60;
  const progress = running ? 1 - seconds / ((me.focusMinutes || length) * 60) : 0;
  const growing = running && !!me?.focusStrict;
  const bricks = me?.bricks || 0,
    short = fidan && !running ? Math.max(0, item.cost - bricks) : 0;
  const early = growing && !me.focusPauseUsed && now - (me.focusEnd - me.focusMinutes * 60000) < GRACE;
  const ruin = me?.ruinUntil > now && me?.ruinRefund > 0 ? me.ruinRefund : 0;
  // A streak stays open for ten minutes after a finished session.
  const streakLeft = !running && !finishing && me?.chainEnd ? CHAIN_GAP - (now - me.chainEnd) : 0,
    streakNext = streakBonus((me?.chain || 0) + 1);
  const pick = (id) => {
    setModel(id);
    storage.set("kutup-model", id);
  };
  useEffect(()=>{if(catalogSignal>0){if(!(me?.focusEnd>Date.now()))setPicking(true);consumeCatalogSignal?.();}},[catalogSignal]);
  const tea = (action) =>
    mutate("/focus", { action }, action === "pause" ? `Çay molası ☕ İnşaat ${teaMax / 60000} dakika bekliyor; uygulamadan çıkabilirsin.` : "Molaya son, işçiler sahada! 🏗️");
  // The break runs out: back to work by itself.
  const resumed = useRef(0);
  useEffect(() => {
    if (pausedAt && teaLeft === 0 && resumed.current !== pausedAt) {
      resumed.current = pausedAt;
      tea("resume");
    }
  }, [pausedAt, teaLeft === 0]);
  const control = async () => {
    if (growing) {
      const cost = me.focusCost || 0,
        name = item.name.toLocaleLowerCase("tr");
      const warning = early
        ? `İlk 2 dakikadasın: vazgeçersen ${cost ? `${cost} 🧱 malzemenin tamamı geri gelir` : "hiçbir şey kaybetmezsin"}.`
        : cost
          ? `Pes edersen ${name} yıkılır ve bu seansın dakikaları yazılmaz.\n\n${refundNow(cost)} 🧱 hemen geri gelir; enkazı bir sonraki seansın kaldırınca ${refundLater(cost)} 🧱 daha. ${cost - refundNow(cost) - refundLater(cost)} 🧱 gider.`
          : `Pes edersen ${name} yıkılır ve bu seansın dakikaları yazılmaz.`;
      if (!confirm(`${warning}\n\nEmin misin?`)) return;
    }
    // A phone build starts behind the lock guide (n40, kilit modu).
    if (!running && fidan && !relaxed && !onComputer()) return setLock(true);
    if (running) {
      setBusy(true);
      const cancelled = await mutate(
        "/focus",
        { action: "cancel" },
        growing
          ? early
            ? "Vazgeçtin; malzeme kasana geri döndü. Hazır olunca yeniden."
            : "İnşaat çöktü 🧱 Bir dahakine sonuna kadar!"
          : (r) =>
              r?.stopped
                ? r.credited
                  ? `Seans bitti: görülen ${r.credited} dk yazıldı. 🌱`
                  : `Seans durdu. ${HONEST_MIN} dk'dan kısa sürdüğü için yazılmadı.`
                : "Seans durdu. Hazır olunca yeniden başla.",
      );
      if (cancelled && me.focusRelaxed) closeBuildNotice(me.id, me.focusEnd);
      setBusy(false);
      return;
    }
    return begin();
  };
  const begin = async () => {
    if (fidan && relaxed) releaseScreen();
    else keepScreenOn(); // needs the tap itself on some phones
    // A computer gets the floating window, the alarm sound and the idle check,
    // each asked for inside this tap.
    if (onComputer() && !(fidan && relaxed)) primeFloat();
    setBusy(true);
    await mutate(
      "/focus",
      { action: "start", minutes: length, strict: fidan, relaxed: fidan && relaxed, honest: !fidan, device: onComputer() ? "desk" : "phone", rhythm: !!round, invite, ...(fidan ? { model: item.id } : {}) },
      fidan
        ? relaxed ? `Rahat inşaat başladı 🌙 ${item.name} yükseliyor. Ekranı kilitleyebilirsin.` : `Temel atıldı 🏗️ ${item.name} yükseliyor. Uygulamada kal, ekran açık kalacak.`
        : "Dünya biraz beklesin. Şimdi odak zamanı. 🎧 Burada geçen her dakika sayılır.",
    );
    setBusy(false);
  };
  return (
    <section
      className={`focus-card ${compact ? "compact" : ""} ${running ? "running" : ""} ${growing ? "growing" : ""}`}
    >
      <div className="focus-card-header">
        <span>
          <Headphones size={18} /> ODAK MODU
        </span>
        <button type="button" className="brick-chip" aria-label={`Tuğla kasan: ${bricks} tuğla`} onClick={() => setPicking("wallet")}>
          🧱 {bricks}
        </button>
        {growing ? (
          <span className="focus-plant" aria-label={`${item.name} inşa ediliyor`}>
            {item.emoji}
          </span>
        ) : (
          <span className="focus-spark">✧</span>
        )}
      </div>
      <h2>
        {growing
          ? `${item.name} yükseliyor.`
          : running
            ? "Şu an kendin için."
            : "Bir küçük odak arası."}
      </h2>
      <div className="timer-wrap">
        {!compact && <KaraBuddy me={me} now={now} item={item} outcome={outcome} />}
        <svg className="timer-ring" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r="81"
            fill="none"
            stroke="rgba(255,255,255,.1)"
            strokeWidth="3"
          />
          <circle
            cx="90"
            cy="90"
            r="81"
            fill="none"
            stroke="var(--pop)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="509"
            strokeDashoffset={509 * (1 - progress)}
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div className="timer-digits">
          <b className="clock">
            <Roll value={Math.floor(seconds / 60)} />
            <i>:</i>
            <Roll value={seconds % 60} />
          </b>
          <span>
            {running && me.focusImece ? me.focusRelaxed ? "ortak görev · ekranı kilitleyebilirsin" : "ortak görev · seansı Kütüp açıkken tamamla" : growing
              ? me.focusRelaxed ? "🌙 rahat inşaat · ekranı kilitleyebilirsin" : onComputer()
                ? "🏗️ sekmeler serbest, bu sekmeyi kapatma"
                : `🏗️ çıkarsan ${BUILD_LEAVE / 1000} sn içinde dön`
              : running
                ? onComputer()
                  ? "sekmeler serbest, uzakta geçen dakika sayılmaz"
                  : "uygulamada kal, uzakta geçen dakika sayılmaz"
                : "dakika sadece kendine"}
          </span>
        </div>
      </div>
      {!compact && !running && !finishing && (
        <div className="studio-mode" role="group" aria-label="Çalışma şekli">
          {[
            [true, "🏗️", "İnşaat", "köye bina, tam maaş"],
            [false, "🎧", "Serbest", "bina yok, yarım maaş"],
          ].map(([on, icon, label, hint]) => (
            <button
              key={label}
              type="button"
              className={fidan === on ? "on" : ""}
              aria-pressed={fidan === on}
              onClick={() => {
                setFidan(on);
                storage.set("kutup-fidan-on", on ? "1" : "0");
              }}
            >
              <span aria-hidden="true">{icon}</span>
              <b>{label}</b>
              <small>{hint}</small>
            </button>
          ))}
        </div>
      )}
      {!running && !finishing && fidan && (
        <div className="build-mode-pick" role="group" aria-label="İnşaat şekli">
          {[[false, "Sıkı", "Kütüp açık kalsın · tam maaş"], [true, "Rahat", "Ekranı kilitle · yarım maaş"]].map(([value, label, hint]) => (
            <button key={label} type="button" aria-pressed={relaxed === value} onClick={() => { setRelaxed(value); storage.set("kutup-build-mode", value ? "relaxed" : "strict"); }}>
              <b>{value ? "☾" : "✳"} {label}</b><small>{hint}</small>
            </button>
          ))}
          <p>{relaxed ? "Ekranı kilitleyebilir, başka uygulamaya geçebilirsin; inşaat sürer, ara sıra bildirim gelir. Kimse izlemediği için maaş yarım, bina yine senin." : `Ekran açık kalır, pil biraz gider. Çıkarsan ${BUILD_LEAVE / 1000} sn içinde dön, yoksa binan çatlar. Tam maaş.`}</p>
          {relaxed && askNotifications && notificationState() !== "granted" && notificationState() !== "unsupported" && (
            <button type="button" className="build-notice-enable" onClick={() => requireMember(askNotifications)}>Aşama bildirimlerini aç</button>
          )}
        </div>
      )}
      {!running && !finishing && fidan && (
        <button type="button" className="build-pick" onClick={() => setPicking(true)}>
          <BuildingThumb id={item.id} size={62} />
          <span>
            <b>
              {item.emoji} {item.name}
            </b>
            <small>
              {CLASSES[item.class].label} · {length} dk · {item.cost ? `${item.cost} 🧱 malzeme` : "bedava"} · bitince +{wageFor(length, !relaxed)} 🧱
            </small>
          </span>
          <span className="build-pick-change">Değiştir</span>
        </button>
      )}
      {!running && !finishing && !fidan && (
        <>
          <div className="duration-options">
            {[25, 50, 75].map((n) => (
              <button
                key={n}
                className={duration === n ? "active" : ""}
                aria-pressed={duration === n}
                onClick={() => setDuration(n)}
              >
                {n} dk
              </button>
            ))}
          </div>
        </>
      )}
      {!compact && !running && !finishing && (
        <p className="mode-hint">
          {fidan
            ? relaxed ? "Süreyi biz tutarız. Dönünce şantiyenin hızlandırılmış yapımını izle ve binanı gör." : onComputer()
              ? "Bitince köyüne eklenir. Bu sekmeyi kapatma."
              : `Bitince köyüne eklenir. Çıkarsan ${BUILD_LEAVE / 1000} sn içinde dön.`
            : `Yapı yok: ${duration} dk → ${wageFor(duration, false)} 🧱. Uzakta geçen dakika sayılmaz.`}
          <Ask tab="focus" topic={fidan ? "leave" : "modes"} label={fidan ? "Uygulamadan çıkarsam ne olur?" : "Serbest ne demek?"} />
        </p>
      )}
      {round && !running && !finishing && (
        <p className="rhythm-note">
          {round.inBreak
            ? `☕ Ortak mola · yeni tur ${mmss(round.nextRound - now)} sonra (${round.label})`
            : `🕐 ${round.label} ritmi · bu turun bitişi ${clockTR(round.workEnd)} · şimdi başlarsan ${roundMinutes} dk`}
        </p>
      )}
      {!compact && !running && !finishing && (
        <div className="rhythm-chips" role="group" aria-label="Masa ritmi">
          <span>
            Masa ritmi
            <Ask tab="focus" topic="rhythm" label="Masa ritmi" />
          </span>
          {[[null, "Kapalı"], ...Object.entries(RHYTHMS).map(([id, r]) => [id, r.label])].map(([id, label]) => (
            <button
              key={label}
              type="button"
              className={(rhythm || null) === id ? "on" : ""}
              aria-pressed={(rhythm || null) === id}
              onClick={() => requireMember(() => mutate("/rhythm", { rhythm: id }, id ? `Masa ritmi ${label}: molalar artık ortak. ☕` : "Masa ritmi kapandı."))}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {growing && !me.focusRelaxed && !pausedAt && !me.focusPauseUsed && teaMax > 0 && (
        <button type="button" className="tea-button" onClick={() => tea("pause")}>
          ☕ Çay molası ver ({teaMax / 60000} dk, bir kez)
        </button>
      )}
      {growing && pausedAt > 0 && (
        <div className="tea-note">
          <span>☕ Çay molası · {mmss(teaLeft)} kaldı. Uygulamadan çıkabilirsin; inşaat yerinde bekliyor.</span>
          <button type="button" className="sound-pill on" onClick={() => tea("resume")}>
            Devam et
          </button>
        </div>
      )}
      {growing && !me.focusRelaxed && !onComputer() && (
        <p className={`awake-note ${screenAwake() ? "ok" : "warn"}`}>
          {screenAwake()
            ? "🔆 Ekran açık tutuluyor; telefonu önünde açık bırakabilirsin."
            : `⚠️ Bu telefon ekranı kendi kapatabilir: pil tasarrufunu kapat ya da ekran zaman aşımını uzat. Ekran kararırsa ${BUILD_LEAVE / 1000} saniye içinde dokun.`}
        </p>
      )}
      {streakLeft > 0 && streakNext > 0 && (
        <p className="streak-note">
          🔥 Seri {me.chain}: {Math.floor(streakLeft / 60000)}:{String(Math.floor((streakLeft % 60000) / 1000)).padStart(2, "0")} içinde başlarsan
          bu seans +%{Math.round(streakNext * 100)} maaş getirir.
        </p>
      )}
      {!running && !finishing && ruin > 0 && (
        <p className="ruin-note">Köyünde enkaz var. Bir sonraki seansın onu kaldırır ve +{ruin} 🧱 geri gelir.</p>
      )}
      {picking && (
        <CatalogModal
          bricks={bricks}
          selected={model}
          pick={pick}
          close={() => setPicking(false)}
          founder={me?.badge === "dev"}
          maxMinutes={round ? roundMinutes : 0}
          start={picking === "wallet" ? "wallet" : "shop"}
          // A building from the collection: fly to it on the village map.
          show={(id) => {
            setPicking(false);
            window.dispatchEvent(new CustomEvent("kutup:show-building", { detail: { model: id } }));
          }}
        />
      )}
      <Busy
        loading={busy || finishing}
        disabled={short > 0 || tooBig}
        className="btn focus-start"
        onClick={() => requireMember(control)}
      >
        {finishing ? null : running ? (
          <Square size={14} />
        ) : (
          <Play size={15} fill="currentColor" />
        )}
        {finishing
          ? "Dakikalar cebine yazılıyor…"
          : running
            ? growing
              ? early
                ? "Vazgeç (bedava)"
                : "Pes et (bina yıkılır)"
              : "Seansı durdur"
            : tooBig
              ? `Bu tura ${roundMinutes} dk kaldı · daha küçük yapı seç`
              : short > 0
              ? `${short} 🧱 eksik · başka yapı seç`
              : fidan
                ? `Temeli at ${item.emoji}`
                : "Hadi odaklanalım"}
      </Busy>
      <DeskMates me={me} members={members} now={now} onJoin={onJoin} />
      <div className="focus-tools">
        {!running && !finishing && (
          <button
            type="button"
            className={`sound-pill invite-chip ${invite ? "on" : ""}`}
            aria-pressed={invite}
            title="Başlayınca ekibe 'Katıl' bildirimi gider"
            onClick={() => {
              setInvite(!invite);
              storage.set("kutup-invite", invite ? "0" : "1");
            }}
          >
            📣 <span>Ekibi çağır</span>
          </button>
        )}
        <SoundButton />
        {running && onComputer() && floatSupported() && !floating && (
          <button type="button" className="sound-pill screen-pill" title="Sayaç her uygulamanın üstünde dursun" onClick={() => primeFloat()}>
            <PictureInPicture2 size={14} />
            <span>Yüzen pencere</span>
          </button>
        )}
        <button type="button" className="sound-pill icon-only" aria-label="Ses karışımı" onClick={() => setMixer(true)}>
          <SlidersHorizontal size={14} />
        </button>
        {onScreen && (
          <button
            type="button"
            className="sound-pill screen-pill"
            aria-label="Odak ekranı"
            onClick={() => {
              enterFullscreen(); // inside the tap, or browsers refuse
              onScreen();
            }}
          >
            <Expand size={14} />
            <span>Odak ekranı</span>
          </button>
        )}
      </div>
      {me?.focusToday > 0 && (
        <p className="focus-bottom">
          Bugün <b>{minutesLabel(me.focusToday)}</b> kendine ayırdın. Küçük adımlar da ilerlemedir.
        </p>
      )}
      {lock && (
        <LockSheet
          minutes={length}
          notifications={notificationState()}
          askNotifications={askNotifications || (async () => {})}
          close={() => setLock(false)}
          start={async () => {
            setLock(false);
            await begin();
          }}
        />
      )}
      {mixer && (
        <Modal title="Şehir biraz sussun." subtitle="Yağmur, kütüphane, şömine… ya da bir kara delik." close={() => setMixer(false)}>
          <SoundPanel />
        </Modal>
      )}
    </section>
  );
}
export function CoffeeCard({ requireMember, onCoffee }) {
  return (
    <section className="coffee-card">
      <div className="coffee-doodle">
        ☕<span>✧</span>
      </div>
      <div>
        <span className="eyebrow">DERS ARASI HAYAT</span>
        <h3>Bi’ kahve?</h3>
        <p>En iyi fikirler bazen molada gelir.</p>
      </div>
      <button className="coffee-button" onClick={() => requireMember(onCoffee)}>
        Ekibe seslen <ArrowUpRight size={17} />
      </button>
    </section>
  );
}
