// The small sheets of the app: where am I, invite, plan, coffee call and a
// friend's card. Split out of App.jsx (n29).
import React, { useState } from "react";
import { ArrowUpRight, CalendarDays, Check, Coffee, Copy, Flame, Map as MapIcon, MapPin, Plus, Send, Trophy } from "lucide-react";
import { STATUS, shortTime, dayInput, dayWord, sinceLabel, minutesLabel } from "./api.js";
import { Avatar, Busy } from "./ui.jsx";
import { MemberStats } from "./later.jsx";
import { Modal } from "./Modal.jsx";
import { Badge } from "./Home.jsx";
import { ROOMS, roomOf } from "../shared/rooms.js";

// The tayfa's two reading rooms at Milli Kütüphane (Adnan is home), plus break
// spots. Old free-text places still work through "Başka bir yer…".
const PLACES = [
  ...ROOMS.map((room) => [room.name, `${room.emoji} ${room.short}`]),
  ["Kafeterya", "☕ Kafeterya"],
  ["Bahçe", "🌳 Bahçe"],
];
const OTHER_PLACE = "Başka bir yer…";
export function PresenceModal({ me, coming, close, mutate, openMap }) {
  const known = !me.location || PLACES.some(([name]) => name === me.location);
  const [status, setStatus] = useState(coming ? "coming" : "here"),
    [location, setLocation] = useState(
      known ? me.location || PLACES[0][0] : OTHER_PLACE,
    ),
    [customPlace, setCustomPlace] = useState(known ? "" : me.location),
    [desk, setDesk] = useState(me.desk || ""),
    [arrival, setArrival] = useState("30 dakika içinde"),
    [busy, setBusy] = useState(false);
  const place = location === OTHER_PLACE ? customPlace.trim() : location;
  return (
    <Modal
      title={
        coming ? "Yolun kütübe mi düşüyor? 🛵" : "Bir sandalye de senin. 🪑"
      }
      subtitle="Ekibin nerede olduğunu bilsin. Konum takibi yok, söz sende."
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (
            await mutate(
              "/presence",
              { status, location: place, desk, arrival },
              status === "coming"
                ? "Ekibin geleceğini biliyor. Yolun açık olsun!"
                : "Ekibine haber verdik. İyi çalışmalar!",
            )
          )
            close();
          setBusy(false);
        }}
      >
        <div className="status-options">
          {["here", "coming", "break"].map((s) => (
            <button
              type="button"
              className={status === s ? "selected" : ""}
              key={s}
              onClick={() => setStatus(s)}
            >
              {s === "here" ? "📚" : s === "coming" ? "🛵" : "☕"}{" "}
              {STATUS[s][0]}
            </button>
          ))}
        </div>
        {status === "coming" ? (
          <label className="field-label">
            Ne zaman gelirsin?
            <select
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
            >
              {[
                "Şimdi çıkıyorum",
                "15 dakika içinde",
                "30 dakika içinde",
                "1 saat içinde",
                "Öğleden sonra",
                "Akşama doğru",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <span className="plan-step">
              Nerede çalışıyorsun? <small>genelde Adnan’dayız aga</small>
            </span>
            <div className="quick-messages place-chips" role="group" aria-label="Salon">
              {[...PLACES, [OTHER_PLACE, "Başka…"]].map(([name, label]) => (
                <button
                  type="button"
                  key={name}
                  aria-pressed={location === name}
                  className={location === name ? "selected" : ""}
                  onClick={() => setLocation(name)}
                >
                  {label}
                </button>
              ))}
            </div>
            {location === OTHER_PLACE && (
              <label className="field-label">
                Neresi?
                <input
                  required
                  maxLength={40}
                  value={customPlace}
                  onChange={(e) => setCustomPlace(e.target.value)}
                  placeholder="Örn. 2. kat koridor masaları"
                />
              </label>
            )}
            <label className="field-label">
              Masa / küçük tarif <span>isteğe bağlı</span>
              <input
                maxLength={16}
                value={desk}
                onChange={(e) => setDesk(e.target.value)}
                placeholder="24 veya pencere yanı"
              />
            </label>
            {openMap && roomOf(place) && (
              <button type="button" className="status-route map-pick" onClick={() => openMap(place)}>
                <MapIcon size={13} /> Masanı haritadan seç
              </button>
            )}
          </>
        )}
        <p className="form-footnote">
          Durumun 8 saat sonra otomatik kapanır. Çıkarken “Çıkış yap” demen
          yeter.
        </p>
        <Busy loading={busy} className="btn primary full" type="submit">
          Ekibe haber ver <ArrowUpRight size={17} />
        </Busy>
      </form>
    </Modal>
  );
}
export function InviteModal({ group, close, notify }) {
  const url = `${location.origin}/join/${group.invite}`;
  const shareText = `Kütüpte kim var diye sormaya son. ${group.name} ekibine gel! ✳`;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
      notify("Davet bağlantısı kopyalandı. Tayfaya yolla!");
    } catch {
      notify("Kopyalanamadı. Aşağıdaki bağlantıyı seçip kopyalayabilirsin.");
    }
  };
  return (
    <Modal
      title="Tayfayı topluyoruz. 🫶"
      subtitle="Bağlantıyı arkadaş grubuna at. İsimlerini seçip hemen katılsınlar."
      close={close}
    >
      <div className="invite-illustration">
        <span>🪐</span>
        <span>🍒</span>
        <span>🌱</span>
        <button type="button" className={copied ? "copied" : ""} onClick={copy} aria-label="Davet bağlantısını kopyala">
          {copied ? (
            <>
              <Check size={18} />
              <small>Kopyalandı</small>
            </>
          ) : (
            "+"
          )}
        </button>
      </div>
      <h3 className="invite-group">{group.name}</h3>
      <label className="field-label">
        Sizin özel davetiniz
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="Davet bağlantısı"
        />
      </label>
      <button className="btn primary full" onClick={copy}>
        {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
      </button>
      {navigator.share ? (
        <button
          className="btn outline full"
          onClick={() =>
            navigator
              .share({ title: `${group.name} · Kütüp`, text: shareText, url })
              .catch(() => {})
          }
        >
          <Send size={16} /> Arkadaşlarına gönder
        </button>
      ) : (
        <a
          className="btn outline full"
          href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          <Send size={16} /> WhatsApp’ta paylaş
        </a>
      )}
      <p className="form-footnote">
        Bu bağlantı ekibin anahtarı. Sadece katılmasını istediğin kişilerle
        paylaş.
      </p>
    </Modal>
  );
}
// A plan in three taps: a day, a time, go. The exact pickers stay one tap away.
const PLAN_TIMES = ["09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
const PLAN_NAMES = ["Sabah kulübü ☀️", "Öğleden sonra 📚", "Akşam kütüpü 🌙", "Sınav kampı 🔥"];
// Browsers hand back "10:00", "10:00:00" or "10:00:00.000"; read only what is
// needed, in Türkiye time (UTC+3 all year).
function planStart(date, time) {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date),
    clock = /^(\d{1,2}):(\d{2})/.exec(time);
  return day && clock ? Date.UTC(+day[1], +day[2] - 1, +day[3], +clock[1] - 3, +clock[2]) : NaN;
}
function untilWords(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} dk sonra`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} saat sonra`;
  return `${Math.round(hours / 24)} gün sonra`;
}
export function PlanModal({ close, mutate }) {
  const firstFree = (day) => PLAN_TIMES.find((t) => planStart(day, t) > Date.now() + 10 * 60000);
  const today = dayInput(),
    startDay = firstFree(today) ? today : dayInput(1);
  const [date, setDate] = useState(startDay),
    [time, setTime] = useState(firstFree(startDay) || "10:00"),
    [exact, setExact] = useState(false),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const days = Array.from({ length: 7 }, (_, offset) => {
    const value = dayInput(offset),
      at = Date.now() + offset * 86400000;
    const label =
      offset === 0
        ? "Bugün"
        : offset === 1
          ? "Yarın"
          : new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric", timeZone: "Europe/Istanbul" }).format(at);
    return [label, value];
  });
  const starts = planStart(date, time),
    past = Number.isFinite(starts) && starts < Date.now();
  const pickDay = (value) => {
    setDate(value);
    setError("");
    // Today, a time that already went by moves on to the next free one.
    if (planStart(value, time) < Date.now()) setTime(firstFree(value) || time);
  };
  return (
    <Modal
      title="Güzel bir plan var. 🗓️"
      subtitle="Bir gün, bir saat. Gerisi bir “ben de gelirim”e bakar."
      close={close}
    >
      <form
        className="plan-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!Number.isFinite(starts)) {
            setError("Gün ya da saat okunamadı. Bir daha seçer misin?");
            return;
          }
          if (past) {
            setError("Bu saat geçti bile. İleri bir saat seç. 🙂");
            return;
          }
          setError("");
          setBusy(true);
          const saved = await mutate("/plans", { starts, note }, "Plan panoda. Ekibin katılabilir! 🗓️", "POST", (message) =>
            setError(`Plan kaydedilemedi: ${message}`),
          );
          setBusy(false);
          if (saved) close();
        }}
      >
        <span className="plan-step">Hangi gün?</span>
        <div className="quick-messages plan-days" role="group" aria-label="Gün">
          {days.map(([label, value]) => (
            <button
              type="button"
              key={value}
              aria-pressed={date === value}
              className={date === value ? "selected" : ""}
              onClick={() => pickDay(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="plan-step">Saat kaçta?</span>
        <div className="quick-messages plan-times" role="group" aria-label="Saat">
          {PLAN_TIMES.map((value) => {
            const gone = planStart(date, value) < Date.now();
            return (
              <button
                type="button"
                key={value}
                disabled={gone}
                aria-pressed={time === value}
                className={time === value ? "selected" : ""}
                onClick={() => {
                  setTime(value);
                  setError("");
                }}
              >
                {value}
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={exact}
            className={exact || !PLAN_TIMES.includes(time) ? "selected" : ""}
            onClick={() => setExact(!exact)}
          >
            Başka saat
          </button>
        </div>
        {exact && (
          <div className="form-row plan-exact">
            <label className="field-label">
              Gün
              <input
                type="date"
                required
                min={dayInput()}
                max={dayInput(14)}
                value={date}
                onChange={(e) => pickDay(e.target.value)}
              />
            </label>
            <label className="field-label">
              Saat
              <input
                type="time"
                required
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setError("");
                }}
              />
            </label>
          </div>
        )}
        <label className="field-label">
          Planın adı <span>isteğe bağlı</span>
          <input
            maxLength={80}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn. Sabah erkenciler kulübü"
          />
        </label>
        <div className="quick-messages plan-names">
          {PLAN_NAMES.map((name) => (
            <button type="button" key={name} className={note === name ? "selected" : ""} onClick={() => setNote(name)}>
              {name}
            </button>
          ))}
        </div>
        <p className={`plan-summary ${past ? "late" : ""}`} aria-live="polite">
          <CalendarDays size={16} />
          {Number.isFinite(starts) ? (
            <>
              <b>
                {dayWord(starts)} · {shortTime(starts)}
              </b>
              <span>{past ? "bu saat geçti" : untilWords(starts - Date.now())}</span>
            </>
          ) : (
            <b>Bir gün ve saat seç</b>
          )}
        </p>
        <p className="form-footnote">
          <MapPin size={14} /> Milli Kütüphane · Türkiye saati. Bildirimi açık olanlara haber gider.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Busy loading={busy} disabled={past} className="btn primary full" type="submit">
          Takvime bırakalım <Plus size={17} />
        </Busy>
      </form>
    </Modal>
  );
}
export function CoffeeModal({ close, mutate }) {
  const [text, setText] = useState(
      "10 dakika sonra kafeteryada kahve? Gelen kalp atsın ☕",
    ),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Dersin en iyi arası. ☕"
      subtitle="Ekibe seslen. Bildirimleri açık olanlara da haber gitsin."
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (
            await mutate(
              "/messages",
              { text, kind: "coffee" },
              "Mola davetin panoya düştü. Kahveler hazır mı?",
            )
          )
            close();
          setBusy(false);
        }}
      >
        <label className="field-label">
          Nerede, ne zaman?
          <textarea
            required
            minLength={1}
            maxLength={280}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="quick-messages">
          {[
            "Kafeteryada kahve? ☕",
            "Bahçede 10 dk nefes? 🌿",
            "Yemek molası veren? 🍜",
          ].map((s) => (
            <button type="button" key={s} onClick={() => setText(s)}>
              {s}
            </button>
          ))}
        </div>
        <Busy loading={busy} className="btn primary full" type="submit">
          Tayfaya seslen <Coffee size={17} />
        </Busy>
      </form>
    </Modal>
  );
}
export function MemberModal({ member, now, close, mutate }) {
  const since = sinceLabel(member.since, now);
  return (
    <Modal title={member.name} close={close}>
      <div className="member-detail">
        <Avatar member={member} size="large" />
        <Badge status={member.status} />
        <h3>{member.note || "Küçük adımlar, büyük işler."}</h3>
        {member.crown && <p className="crown-line">👑 Geçen haftanın ustası</p>}
        <p>
          <MapPin size={16} />
          {member.status === "coming"
            ? member.arrival
            : member.status === "away"
              ? "Şimdilik kütüpte değil"
              : `${member.location || "Milli Kütüphane"}${member.desk ? ` · ${member.desk}` : ""}${since ? ` · ${since}` : ""}`}
        </p>
        <div className="detail-stats">
          <div className="detail-stat">
            <Flame size={20} />
            <strong>{minutesLabel(member.focusToday || 0)}</strong>
            <span>bugünün odağı</span>
          </div>
          <div className="detail-stat">
            <Trophy size={20} />
            <strong>{minutesLabel(member.focusWeek || 0)}</strong>
            <span>bu hafta</span>
          </div>
          <div className="detail-stat">
            <span aria-hidden="true">🏘️</span>
            <strong>{member.buildings || 0} bina</strong>
            <span>köyünde</span>
          </div>
        </div>
      </div>
      <MemberStats memberId={member.id} />
      <button
        className="btn primary full"
        onClick={async () => {
          if (
            await mutate(
              "/messages",
              {
                text: `${member.name}, bir kahve molası verelim mi? ☕`,
                kind: "coffee",
                to: member.id,
              },
              "Kahve davetin panoda!",
            )
          )
            close();
        }}
      >
        <Coffee size={17} /> Kahveye çağır
      </button>
      <p className="form-footnote">
        Davet ekip panosuna düşer; özel mesaj değildir.
      </p>
    </Modal>
  );
}
