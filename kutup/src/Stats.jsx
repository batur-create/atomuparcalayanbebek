// A member's statistics on their card: focus over time, streaks, the library,
// building and tuğla. Everyone in the team can see everyone's.
import React, { useEffect, useState } from "react";
import { CATALOG } from "../shared/catalog.js";
import { get, minutesLabel } from "./api.js";
import "./stats.css";

const dayNumber = new Intl.DateTimeFormat("tr-TR", { day: "numeric", timeZone: "Europe/Istanbul" });
const dayMonth = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" });
const hours = (minutes) => (minutes >= 600 ? `${Math.round(minutes / 60)} sa` : minutesLabel(minutes));
const clock = (minute) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export function MemberStats({ memberId }) {
  const [s, setStats] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    get(`/stats/${memberId}`)
      .then((data) => alive && setStats(data))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [memberId]);
  if (error) return <p className="stats-note">{error}</p>;
  if (!s) return <p className="stats-note">İstatistikler geliyor…</p>;
  const f = s.focus,
    top = Math.max(30, ...f.last14.map(([, m]) => m)),
    owned = Object.keys(s.builds.models).filter((id) => CATALOG.some((item) => item.id === id)).length;
  return (
    <section className="member-stats" aria-label="İstatistikler">
      <h4>İstatistikler</h4>
      <div className="stats-grid">
        <div>
          <b>{hours(f.total)}</b>
          <span>toplam odak</span>
        </div>
        <div>
          <b>{f.sessions}</b>
          <span>seans</span>
        </div>
        <div>
          <b>{f.streak.current} gün</b>
          <span>seri · en iyi {f.streak.best}</span>
        </div>
        <div>
          <b>{hours(f.month)}</b>
          <span>son 30 gün</span>
        </div>
      </div>
      <div className="stats-bars" role="img" aria-label={`Son 14 gün: ${f.last14.map(([at, m]) => `${dayMonth.format(at)} ${m} dk`).join(", ")}`}>
        {f.last14.map(([at, m], i) => (
          <div key={at} className={i === 13 ? "today" : ""} title={`${dayMonth.format(at)} · ${minutesLabel(m)}`}>
            <i style={{ height: `${m ? Math.max(6, Math.round((m / top) * 100)) : 0}%` }} />
            <span>{dayNumber.format(at)}</span>
          </div>
        ))}
      </div>
      <ul className="stats-list">
        {f.bestDay && (
          <li>
            🏆 En iyi gün <b>{dayMonth.format(f.bestDay.at)} · {minutesLabel(f.bestDay.minutes)}</b>
          </li>
        )}
        {f.peakHour != null && (
          <li>
            ⏰ En verimli saat <b>{clock(f.peakHour * 60)}–{clock(((f.peakHour + 1) % 24) * 60)}</b>
          </li>
        )}
        {f.longest > 0 && (
          <li>
            ⏱️ En uzun seans <b>{f.longest} dk</b> · ortalama {f.average} dk
          </li>
        )}
        {s.builds.success != null && (
          <li>
            🏗️ İnşaat başarısı <b>%{s.builds.success}</b> ({f.strict}/{f.strict + s.builds.collapses}) · {s.builds.total} bina · koleksiyon {owned}/{CATALOG.length}
            {s.builds.likes ? ` · ${s.builds.likes} ❤️` : ""}
          </li>
        )}
        <li>
          📚 Kütüpte <b>{s.library.days} gün</b>
          {s.library.minutes ? ` · ~${hours(s.library.minutes)}` : ""}
          {s.library.room ? ` · favori salon ${s.library.room}` : ""}
          {s.library.usualArrival != null ? ` · genelde ${clock(s.library.usualArrival)} gibi gelir` : ""}
        </li>
        <li>
          🧱 Kasada <b>{s.bricks.balance}</b> · maaş {s.bricks.earned} · malzeme {s.bricks.spent}
        </li>
        <li>
          💬 {s.social.messages} mesaj · {s.social.plans} plan açtı · {s.social.joined} plana katıldı
        </li>
      </ul>
    </section>
  );
}
