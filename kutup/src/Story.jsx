import { createPortal } from "react-dom";
import { Breadcrumbs, useNavigation } from "./Navigation.jsx";
import { useDialogFocus } from "./Modal.jsx";
// "Haftanın hikâyesi" (n28): the team's week as full-screen story cards, the
// way phones tell stories. A tap on the right goes on, on the left goes back,
// holding pauses, a swipe down closes. Numbers slam in, lines follow beat by
// beat, stamps land; with reduced motion they simply fade in. "Paylaş" draws a
// library reader card (the team's, or on "Senin haftan" your own) as a PNG.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Share2, X } from "lucide-react";
import { get } from "./api.js";
import { Avatar } from "./ui.jsx";
import { KaraRig } from "./Kara.jsx";
import { BY_ID } from "../shared/catalog.js";
import { markStorySeen } from "./storyLink.jsx";
import "./story.css";

const DAY = 86400000;
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const LENGTH = { cover: 4200, outro: 6000 };

const dayMonth = (t, opts) => new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", ...opts }).format(new Date(t));
/** "12–18 Ekim", or "28 Eylül – 4 Ekim" across a month. */
export function weekLabel(start) {
  const end = start + 6 * DAY;
  return dayMonth(start, { month: "long" }) === dayMonth(end, { month: "long" })
    ? `${dayMonth(start, { day: "numeric" })}–${dayMonth(end, { day: "numeric", month: "long" })}`
    : `${dayMonth(start, { day: "numeric", month: "long" })} – ${dayMonth(end, { day: "numeric", month: "long" })}`;
}
/** Minutes as the big number and its unit: 510 → ["8,5", "saat"], 45 → ["45", "dakika"]. */
export function amount(min) {
  if (min < 60) return [String(min), "dakika"];
  const h = Math.round((min / 60) * 10) / 10;
  return [String(h).replace(".", ","), "saat"];
}
const said = (min) => amount(min).join(" ");
const hourLabel = (h) => `${String(h).padStart(2, "0")}.00`;

/** The cards this week has something to say on, in order. */
export function cardsOf(story, members) {
  const known = (x) => x && members.some((m) => m.id === x.id);
  const cards = ["cover", story.team.minutes ? "hours" : "quiet"];
  if (known(story.master)) cards.push("master");
  if (known(story.regular)) cards.push("regular");
  if (story.duo?.ids.every((id) => known({ id }))) cards.push("duo");
  if (known(story.owl) || known(story.lark)) cards.push("clock");
  if (known(story.streak) || known(story.longest)) cards.push("records");
  if (story.village) cards.push("village");
  if (story.me && story.me.minutes) cards.push("me");
  cards.push("outro");
  return cards;
}

// Each line comes in on its own beat ("tak, tuk, tuk").
const Beat = ({ i = 0, as: Tag = "p", className = "", children }) => (
  <Tag className={`st-beat ${className}`} style={{ "--i": i }}>
    {children}
  </Tag>
);
function Big({ min, i = 1, label }) {
  const [n, unit] = amount(min);
  return (
    <div className="st-big" style={{ "--i": i }}>
      <b className="st-slam">{n}</b>
      <span>{unit}</span>
      {label && <small>{label}</small>}
    </div>
  );
}
const Face = ({ member, i = 0, crown }) => (
  <div className={`st-face ${crown ? "crowned" : ""}`} style={{ "--i": i }}>
    <Avatar member={member} size="large" />
    {crown && (
      <span className="st-crown" aria-hidden="true">
        👑
      </span>
    )}
  </div>
);

function Card({ kind, story, who, group, me }) {
  const t = story.team;
  switch (kind) {
    case "cover":
      return (
        <div className="st-card st-night">
          <Beat i={0} className="st-eyebrow">
            {story.week.complete ? "GEÇEN HAFTA" : "BU HAFTA"} · {weekLabel(story.week.start)}
          </Beat>
          <Beat i={1} as="h2" className="st-title">
            Haftanın hikâyesi
          </Beat>
          <Beat i={2} className="st-lead">
            {group.name}, birlikte nasıl bir hafta geçirdiniz? Dokun, birlikte bakalım.
          </Beat>
          <div className="st-kara" aria-hidden="true">
            <KaraRig pose="idle" act="page" />
          </div>
        </div>
      );
    case "quiet":
      return (
        <div className="st-card st-paper">
          <Beat i={0} className="st-eyebrow">EKİPÇE ODAK</Beat>
          <Beat i={1} as="h2" className="st-title">
            Bu hafta sessiz geçti.
          </Beat>
          <Beat i={2} className="st-lead">
            Hiç odak oturumu yok. Olur böyle haftalar; pazartesi masa yine burada.
          </Beat>
        </div>
      );
    case "hours": {
      const top = Math.max(...t.days, 1),
        busiest = t.days.indexOf(Math.max(...t.days)),
        change = t.previous ? Math.round(((t.minutes - t.previous) / t.previous) * 100) : null;
      return (
        <div className="st-card st-studio">
          <Beat i={0} className="st-eyebrow">EKİPÇE ODAK</Beat>
          <Big min={t.minutes} i={1} />
          <Beat i={2} className="st-lead">
            {t.people} kişi, {t.sessions} oturum.{" "}
            {change === null
              ? "Geçen hafta odak yoktu; bu hafta açıldınız."
              : change >= 100
                ? `Geçen haftanın ${Math.round(t.minutes / t.previous)} katı.`
                : change === 0
                  ? "Geçen haftayla aynı."
                  : `Geçen haftadan %${Math.abs(change)} ${change > 0 ? "fazla" : "az"}.`}
          </Beat>
          <div className="st-bars" role="img" aria-label={`Günlere göre: ${t.days.map((m, i) => `${DAY_NAMES[i]} ${said(m)}`).join(", ")}`}>
            {t.days.map((m, i) => (
              <span key={i} className={i === busiest ? "top" : ""} style={{ "--i": i, "--h": m / top }}>
                <i />
                <small>{DAYS[i]}</small>
              </span>
            ))}
          </div>
          <Beat i={4} className="st-note">
            En yoğun gün {DAY_NAMES[busiest].toLocaleLowerCase("tr")}: {said(t.days[busiest])}.
          </Beat>
        </div>
      );
    }
    case "master": {
      const m = who(story.master.id);
      return (
        <div className="st-card st-hero">
          <Beat i={0} className="st-eyebrow">HAFTANIN USTASI</Beat>
          <Face member={m} i={1} crown />
          <Beat i={2} as="h2" className="st-title">
            {m.name}
          </Beat>
          <Big min={story.master.minutes} i={3} label="odak" />
          <Beat i={4} className="st-lead">
            {story.crowned ? "Tacı taktı, +50 🧱 ve bir plan kazandı." : story.week.complete ? "Haftayı en çok odakla kapattı." : "Şimdilik önde; hafta bitince taç onun olur."}
          </Beat>
        </div>
      );
    }
    case "regular": {
      const m = who(story.regular.id);
      return (
        <div className="st-card st-paper">
          <Beat i={0} className="st-eyebrow">KÜTÜBÜN MÜDAVİMİ</Beat>
          <Face member={m} i={1} />
          <Beat i={2} as="h2" className="st-title">
            {m.name}
          </Beat>
          <Beat i={3} className="st-lead">
            Bu hafta {story.regular.days} gün kütüpteydi{story.regular.visits > story.regular.days ? `, ${story.regular.visits} kez geldi.` : "."}
          </Beat>
          <div className="st-stamps" aria-hidden="true">
            {DAYS.map((d, i) => (
              <span key={d} style={{ "--i": i }} className={story.regular.on.includes(i) ? "on" : ""}>
                <small>{d}</small>
                {story.regular.on.includes(i) && <b>GELDİ</b>}
              </span>
            ))}
          </div>
          <Beat i={5} className="st-note">
            Ekip bu hafta kütübe toplam {t.visits} kez geldi.
          </Beat>
        </div>
      );
    }
    case "duo": {
      const [a, b] = story.duo.ids.map(who);
      return (
        <div className="st-card st-studio">
          <Beat i={0} className="st-eyebrow">HAFTANIN İKİLİSİ</Beat>
          <div className="st-pair">
            <Face member={a} i={1} />
            <span className="st-amp st-beat" style={{ "--i": 2 }} aria-hidden="true">
              &amp;
            </span>
            <Face member={b} i={2} />
          </div>
          <Beat i={3} as="h2" className="st-title">
            {a.name} & {b.name}
          </Beat>
          <Big min={story.duo.together} i={4} label="aynı anda odak" />
          <Beat i={5} className="st-lead">
            {story.duo.days} gün yan yana çalıştılar. O günlerde kişi başı günde {said(story.duo.daily)} odak: ekibin en verimli ikilisi.
          </Beat>
        </div>
      );
    }
    case "clock": {
      const owl = story.owl && who(story.owl.id),
        lark = story.lark && who(story.lark.id);
      return (
        <div className="st-card st-split">
          {lark && (
            <div className="st-half st-day">
              <Beat i={0} className="st-eyebrow">SABAH ERKENCİSİ</Beat>
              <Face member={lark} i={1} />
              <Beat i={2} as="h2" className="st-title">
                {lark.name}
              </Beat>
              <Beat i={3} className="st-lead">
                Dokuzdan önce {said(story.lark.minutes)} odak.
              </Beat>
            </div>
          )}
          {owl && (
            <div className="st-half st-night">
              <Beat i={lark ? 4 : 0} className="st-eyebrow">GECE KUŞU</Beat>
              <Face member={owl} i={lark ? 5 : 1} />
              <Beat i={lark ? 6 : 2} as="h2" className="st-title">
                {owl.name}
              </Beat>
              <Beat i={lark ? 7 : 3} className="st-lead">
                Akşam dokuzdan sonra {said(story.owl.minutes)} odak.
              </Beat>
            </div>
          )}
        </div>
      );
    }
    case "records": {
      const s = story.streak && who(story.streak.id),
        l = story.longest && who(story.longest.id);
      return (
        <div className="st-card st-studio">
          <Beat i={0} className="st-eyebrow">REKORLAR</Beat>
          {s && (
            <div className="st-record" style={{ "--i": 1 }}>
              <b className="st-slam">{story.streak.days}</b>
              <span>
                gün üst üste
                <small>
                  <Avatar member={s} size="tiny" /> {s.name}
                </small>
              </span>
            </div>
          )}
          {l && (
            <div className="st-record" style={{ "--i": s ? 3 : 1 }}>
              <b className="st-slam">{amount(story.longest.minutes)[0]}</b>
              <span>
                {amount(story.longest.minutes)[1]}, tek oturum
                <small>
                  <Avatar member={l} size="tiny" /> {l.name} · {DAY_NAMES[Math.floor((story.longest.at - story.week.start) / DAY)] || ""}
                </small>
              </span>
            </div>
          )}
          <Beat i={5} className="st-note">
            Bu hafta Pano'ya {t.messages} mesaj yazıldı.
          </Beat>
        </div>
      );
    }
    case "village": {
      const v = story.village,
        b = v.builder && who(v.builder.id),
        liked = v.liked && who(v.liked.id);
      return (
        <div className="st-card st-sky">
          <Beat i={0} className="st-eyebrow">KÖYDE BU HAFTA</Beat>
          {v.built > 0 ? (
            <div className="st-big" style={{ "--i": 1 }}>
              <b className="st-slam">{v.built}</b>
              <span>yeni bina</span>
            </div>
          ) : (
            <Beat i={1} as="h2" className="st-title">
              Köy bu hafta büyümedi
            </Beat>
          )}
          {b && (
            <Beat i={2} className="st-lead">
              En çok {b.name} inşa etti: {v.builder.n} bina.
            </Beat>
          )}
          {liked && (
            <Beat i={3} className="st-lead">
              En sevilen bina: {BY_ID[v.liked.model]?.emoji || "🏠"} {BY_ID[v.liked.model]?.name || "bir bina"} ({liked.name}), {v.liked.likes} kalp.
            </Beat>
          )}
          {v.monument && (
            <div className="st-stamp" style={{ "--i": 4 }}>
              ANIT TAMAM
              <small>ortak hedefe ulaşıldı</small>
            </div>
          )}
        </div>
      );
    }
    case "me": {
      const mine = story.me;
      return (
        <div className={`st-card st-mine ${me.color}`}>
          <Beat i={0} className="st-eyebrow">SENİN HAFTAN · BUNU YALNIZ SEN GÖRÜYORSUN</Beat>
          <Big min={mine.minutes} i={1} label="odak" />
          <ul className="st-list">
            <Beat as="li" i={2}>
              <span>Oturum</span>
              <b>{mine.sessions}</b>
            </Beat>
            <Beat as="li" i={3}>
              <span>Kütüpte</span>
              <b>{mine.visits} gün</b>
            </Beat>
            {mine.bestDay && (
              <Beat as="li" i={4}>
                <span>En iyi gün</span>
                <b>
                  {DAY_NAMES[mine.bestDay.day]} · {said(mine.bestDay.minutes)}
                </b>
              </Beat>
            )}
            {mine.peakHour !== null && (
              <Beat as="li" i={5}>
                <span>En verimli saat</span>
                <b>{hourLabel(mine.peakHour)}</b>
              </Beat>
            )}
            {mine.partner && who(mine.partner.id) && (
              <Beat as="li" i={6}>
                <span>Çalışma eşin</span>
                <b>
                  {who(mine.partner.id).name} · {mine.partner.days} gün
                </b>
              </Beat>
            )}
            {mine.streak > 1 && (
              <Beat as="li" i={7}>
                <span>Seri</span>
                <b>{mine.streak} gün</b>
              </Beat>
            )}
          </ul>
          <Beat i={8} className="st-note">
            Ekip odağındaki payın: %{mine.share}.
          </Beat>
        </div>
      );
    }
    default:
      return (
        <div className="st-card st-night">
          <Beat i={0} className="st-eyebrow">{weekLabel(story.week.start)}</Beat>
          <Beat i={1} as="h2" className="st-title">
            Haftaya görüşürüz.
          </Beat>
          <Beat i={2} className="st-lead">
            Masa yine burada, Kara çatıda. Bu haftayı ekiple paylaşmak istersen kartını çıkar.
          </Beat>
          <div className="st-kara" aria-hidden="true">
            <KaraRig pose="idle" act="slow-blink" />
          </div>
        </div>
      );
  }
}

// ---------- the shareable reader card (PNG) ----------
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h);
}
function fit(c, text, max, size, weight, family) {
  let s = size;
  do c.font = `${weight} ${s}px ${family}`;
  while (c.measureText(text).width > max && (s -= 2) > 20);
}
/** Draws a library reader card ("okuyucu kartı") for the week, 1080 × 1920. */
export async function readerCard({ story, group, who, me, personal }) {
  const W = 1080,
    H = 1920,
    canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  const display = '"Bricolage Grotesque Variable", "DM Sans", sans-serif',
    body = '"DM Sans", sans-serif';
  try {
    await Promise.all([document.fonts.load(`700 80px ${display}`), document.fonts.load(`500 32px ${body}`), document.fonts.load(`800 24px ${body}`)]);
  } catch {}
  const ink = css("--ink"),
    muted = css("--muted"),
    paper = css("--paper"),
    accent = css("--accent"),
    onAccent = css("--on-accent"),
    border = css("--border");
  // The page behind the card, then the card itself.
  c.fillStyle = css("--canvas");
  c.fillRect(0, 0, W, H);
  c.fillStyle = paper;
  c.strokeStyle = border;
  c.lineWidth = 3;
  roundRect(c, 80, 150, W - 160, H - 300, 48);
  c.fill();
  c.stroke();
  // The accent band with the card's name, and the punched hole.
  c.save();
  roundRect(c, 80, 150, W - 160, 210, [48, 48, 0, 0]);
  c.clip();
  c.fillStyle = accent;
  c.fillRect(80, 150, W - 160, 210);
  c.restore();
  c.fillStyle = css("--canvas");
  c.beginPath();
  c.arc(W - 170, 255, 26, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = onAccent;
  c.font = `800 26px ${body}`;
  c.letterSpacing = "4px";
  c.fillText("KÜTÜP · OKUYUCU KARTI", 140, 235);
  c.letterSpacing = "0px";
  fit(c, personal ? me.name : group.name, W - 400, 64, 700, display);
  c.fillText(personal ? me.name : group.name, 140, 315);

  let y = 470;
  c.fillStyle = muted;
  c.font = `800 26px ${body}`;
  c.letterSpacing = "3px";
  c.fillText(`${personal ? "SENİN HAFTAN" : "EKİPÇE ODAK"} · ${weekLabel(story.week.start).toLocaleUpperCase("tr")}`, 140, y);
  c.letterSpacing = "0px";
  const [n, unit] = amount(personal ? story.me.minutes : story.team.minutes);
  c.fillStyle = ink;
  c.font = `700 230px ${display}`;
  c.fillText(n, 130, y + 230);
  const nw = c.measureText(n).width;
  c.font = `700 64px ${display}`;
  c.fillText(unit, 150 + nw, y + 230);
  y += 330;

  // A stamp for each day of the week with focus.
  for (let i = 0; i < 7; i++) {
    const x = 175 + i * 122,
      on = personal ? story.me.on.includes(i) : story.team.days[i] > 0;
    c.strokeStyle = on ? accent : border;
    c.lineWidth = 4;
    c.setLineDash(on ? [] : [10, 9]);
    c.beginPath();
    c.arc(x, y, 46, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    if (on) {
      c.save();
      c.translate(x, y);
      c.rotate(-0.14);
      c.fillStyle = accent;
      c.font = `800 20px ${body}`;
      c.textAlign = "center";
      c.fillText("ODAK", 0, 8);
      c.restore();
    }
    c.fillStyle = muted;
    c.font = `600 24px ${body}`;
    c.textAlign = "center";
    c.fillText(DAYS[i], x, y + 86);
    c.textAlign = "left";
  }
  y += 190;

  // A few lines of the week, like entries in the card.
  const rows = [];
  if (personal) {
    const m = story.me;
    rows.push(["Oturum", String(m.sessions)], ["Kütüpte", `${m.visits} gün`]);
    if (m.bestDay) rows.push(["En iyi gün", `${DAY_NAMES[m.bestDay.day]} · ${said(m.bestDay.minutes)}`]);
    if (m.peakHour !== null) rows.push(["En verimli saat", hourLabel(m.peakHour)]);
    if (m.partner && who(m.partner.id)) rows.push(["Çalışma eşin", `${who(m.partner.id).name} · ${m.partner.days} gün`]);
    if (m.streak > 1) rows.push(["Seri", `${m.streak} gün`]);
  } else {
    const name = (x) => who(x?.id)?.name;
    if (name(story.master)) rows.push(["Haftanın Ustası", `${name(story.master)} · ${said(story.master.minutes)}`]);
    const duo = story.duo?.ids.map((id) => who(id)?.name);
    if (duo?.every(Boolean)) rows.push(["Haftanın ikilisi", `${duo.join(" & ")} · ${story.duo.days} gün`]);
    if (name(story.regular)) rows.push(["Kütübün müdavimi", `${name(story.regular)} · ${story.regular.days} gün`]);
    if (name(story.streak)) rows.push(["En uzun seri", `${name(story.streak)} · ${story.streak.days} gün`]);
    if (story.village?.built) rows.push(["Köyde", `${story.village.built} yeni bina${story.village.monument ? " · anıt tamam" : ""}`]);
    rows.push(["Ekip", `${story.team.people} kişi · ${story.team.sessions} oturum`]);
  }
  for (const [label, value] of rows.slice(0, 6)) {
    c.strokeStyle = border;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(140, y - 52);
    c.lineTo(W - 140, y - 52);
    c.stroke();
    c.fillStyle = muted;
    c.font = `500 30px ${body}`;
    c.fillText(label, 140, y);
    c.fillStyle = ink;
    fit(c, value, 520, 34, 700, body);
    c.textAlign = "right";
    c.fillText(value, W - 140, y);
    c.textAlign = "left";
    y += 104;
  }
  // The library's stamp in the corner.
  c.save();
  c.translate(W - 300, H - 300);
  c.rotate(-0.14);
  c.strokeStyle = accent;
  c.fillStyle = accent;
  c.lineWidth = 5;
  roundRect(c, -150, -52, 300, 104, 18);
  c.stroke();
  c.font = `800 34px ${body}`;
  c.textAlign = "center";
  c.fillText("KÜTÜP", 0, -2);
  c.font = `700 22px ${body}`;
  c.fillText(dayMonth(story.week.start + 6 * DAY, { day: "numeric", month: "short", year: "numeric" }).toLocaleUpperCase("tr"), 0, 32);
  c.restore();
  c.fillStyle = muted;
  c.font = `500 28px ${body}`;
  c.fillText(location.host, 140, H - 250);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function share(blob, name) {
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Haftanın hikâyesi" });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "saved";
}

/** The story itself, over everything. */
export function WeekStory({ data, me, close, week }) {
  const navigation = useNavigation();
  const dialog = useRef(null);
  useDialogFocus(dialog, close);
  const [story, setStory] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, retry] = useState(0);
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const press = useRef(null);
  const members = data.members;
  const who = useCallback((id) => members.find((m) => m.id === id), [members]);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    get(`/story${week ? `?week=${week}` : ""}`, controller.signal)
      .then((s) => {
        setStory(s);
        markStorySeen(s.week.start);
        if (navigation && !week) navigation.go(`/haftanin-hikayesi/${s.week.start}${navigation.route.search}`, { replace: true });
      })
      .catch((e) => e?.name !== "AbortError" && setFailed(true));
    return () => controller.abort();
  }, [week, attempt]);

  const cards = useMemo(() => (story ? cardsOf(story, members) : []), [story, members]);
  const kind = cards[at];
  const next = useCallback(() => (at + 1 < cards.length ? setAt(at + 1) : close()), [at, cards.length, close]);
  const back = useCallback(() => setAt(Math.max(0, at - 1)), [at]);

  useEffect(() => {
    const key = (e) => {
      if (e.defaultPrevented || e.target.closest?.("button, a, input, textarea, select")) return;
      if (e.key === "ArrowRight" || e.key === " ") next();
      else if (e.key === "ArrowLeft") back();
    };
    addEventListener("keydown", key);
    const html = document.documentElement;
    html.classList.add("story-open");
    return () => {
      removeEventListener("keydown", key);
      html.classList.remove("story-open");
    };
  }, [next, back, close]);

  const down = (e) => {
    if (e.button > 0 || e.target.closest("button")) return;
    press.current = { x: e.clientX, y: e.clientY, t: Date.now(), timer: setTimeout(() => setHeld(true), 180) };
  };
  const up = (e) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    clearTimeout(p.timer);
    setHeld(false);
    if (e.clientY - p.y > 90) return close(); // swipe down
    if (Date.now() - p.t > 180) return; // that was a hold
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX - box.left < box.width * 0.3) back();
    else next();
  };
  const cancel = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
    setHeld(false);
  };

  const shareCard = async () => {
    if (busy) return;
    setBusy(true);
    const personal = kind === "me";
    try {
      const blob = await readerCard({ story, group: data.group, who, me, personal });
      const result = await share(blob, `kutup-${personal ? "haftam" : "hafta"}-${new Date(story.week.start + 3 * 3600000).toISOString().slice(0, 10)}.png`);
      if (result === "saved") setToast("Kart resim olarak indirildi.");
    } catch {
      setToast("Kart hazırlanamadı. Bir daha dene.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const paused = held || busy;
  // The bar at the top reads on light cards too.
  const tone = kind === "village" || (kind === "clock" && story?.lark && who(story.lark.id)) ? "on-sky" : ["master", "regular", "quiet", "me"].includes(kind) ? "on-paper" : "";
  return createPortal(
    <div ref={dialog} tabIndex={-1} className={`week-story ${tone}`} role="dialog" aria-modal="true" aria-label="Haftanın hikâyesi">
      <div className="st-top">
        <div className="st-progress" aria-hidden="true">
          {cards.map((c, i) => (
            <span key={c} className={i < at ? "done" : i === at ? "now" : ""}>
              {i === at && (
                <i
                  key={`${c}-${at}`}
                  style={{ "--len": `${LENGTH[c] || 5600}ms`, animationPlayState: paused ? "paused" : "running" }}
                  onAnimationEnd={next}
                />
              )}
            </span>
          ))}
        </div>
        <div className="st-head">
          <Breadcrumbs className="story-breadcrumbs" />
          <button type="button" className="st-close" aria-label="Hikâyeyi kapat" onClick={close}>
            <X size={22} />
          </button>
        </div>
      </div>
      <div
        className={`st-stage ${paused ? "paused" : ""}`}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={cancel}
        onPointerLeave={cancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        {!story && !failed && <div className="st-card st-night st-wait">Hikâye hazırlanıyor…</div>}
        {failed && (
          <div className="st-card st-paper">
            <p className="st-lead">Hikâyeye ulaşılamadı. Bağlantını kontrol edip yeniden deneyebilirsin.</p><button type="button" className="btn primary" onClick={() => retry(n => n + 1)}>Tekrar dene</button>
          </div>
        )}
        {story && kind && <Card key={kind} kind={kind} story={story} who={who} group={data.group} me={me} />}
      </div>
      {story && (
        <div className="st-foot">
          <span className="st-count" aria-live="polite">
            {at + 1} / {cards.length}
          </span>
          <button type="button" className="st-share" onClick={shareCard} disabled={busy}>
            <Share2 size={17} />
            <span>{busy ? "Hazırlanıyor…" : kind === "me" ? "Kartımı paylaş" : "Paylaş"}</span>
          </button>
        </div>
      )}
      {toast && (
        <div className="st-toast" role="status">
          {toast}
        </div>
      )}
    </div>, document.body
  );
}
