// Başarımlar (n14): the badge case in Ben, a friend's badges on their card,
// and the small celebration when one is earned. Loaded on demand; the art is
// in achievementArt.js, the list and thresholds in shared/achievements.js.
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ACHIEVEMENTS, BY_KEY } from "../shared/achievements.js";
import { ART, SECRET } from "./achievementArt.js";
import { get, dateLabel } from "./api.js";
import { Burst, reducedMotion } from "./ui.jsx";
import { Modal } from "./Modal.jsx";
import "./achievements.css";

export function BadgeArt({ name, locked = false, size = 64 }) {
  return (
    <svg
      className={`badge-art ${locked ? "locked" : ""}`}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: name ? ART[name] : SECRET }}
    />
  );
}

function useBadges(memberId) {
  const [list, setList] = useState(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let gone = false;
    get(`/achievements/${memberId}`)
      .then((r) => !gone && setList(r.list))
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
    };
  }, [memberId]);
  return [list, failed];
}

const amount = (a, have) => (a.unit === "dk" ? `${Math.floor(have / 60)} / ${Math.round(a.need / 60)} saat` : `${have} / ${a.need} ${a.unit}`);

function Tile({ item, mine }) {
  const a = BY_KEY[item.key];
  const earned = item.at !== null;
  const secret = a.hidden && !earned;
  return (
    <li className={`badge-tile ${earned ? "earned" : "open"}`}>
      <BadgeArt name={secret ? null : item.key} locked={!earned} />
      <b>{secret ? "Gizli başarım" : a.name}</b>
      <small>{secret ? (mine ? "Bul bakalım." : "Henüz bulunmadı.") : earned ? dateLabel(item.at) : a.how}</small>
      {!earned && !secret && a.need > 1 && (
        <span className="badge-progress" role="img" aria-label={amount(a, item.have)}>
          <i style={{ width: `${Math.min(100, (item.have / a.need) * 100)}%` }} />
          <em>{amount(a, item.have)}</em>
        </span>
      )}
    </li>
  );
}

/** Ben → Başarımlar: every badge in list order, with progress toward the open ones. */
export function AchievementsModal({ me, close }) {
  const [list, failed] = useBadges(me.id);
  const earned = list ? list.filter((x) => x.at !== null).length : 0;
  return (
    <Modal
      title="Başarımlar"
      subtitle={list ? `${earned} / ${ACHIEVEMENTS.length} açıldı. Geçmişte yaptıkların da sayıldı. Açtıkların kişi kartında arkadaşlarına görünür.` : "Rozet dolabı açılıyor…"}
      close={close}
      className="badges-modal"
    >
      {failed && <p className="badge-empty">Şu an bakamadık. Biraz sonra yeniden dene.</p>}
      {list && (
        <ul className="badge-grid">
          {list.map((item) => (
            <Tile key={item.key} item={item} mine />
          ))}
        </ul>
      )}
    </Modal>
  );
}

/** A friend's card: the badges they have earned, newest first. */
export function AchievementShelf({ memberId }) {
  const [list] = useBadges(memberId);
  if (!list) return null;
  const earned = list.filter((x) => x.at !== null).sort((a, b) => b.at - a.at);
  return (
    <section className="badge-shelf" aria-label="Başarımlar">
      <h4>
        Başarımlar <span>{earned.length} / {ACHIEVEMENTS.length}</span>
      </h4>
      {earned.length ? (
        <ul>
          {earned.map((item) => (
            <li key={item.key} title={`${BY_KEY[item.key].name} · ${dateLabel(item.at)}`}>
              <BadgeArt name={item.key} size={44} />
              <small>{BY_KEY[item.key].name}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>İlk rozet yolda.</p>
      )}
    </section>
  );
}

/** The moment of earning: a small card above the tab bar, never in the way. */
export function AchievementCheer({ cheer, close, open }) {
  const keys = cheer.keys;
  const one = keys.length === 1 ? BY_KEY[keys[0]] : null;
  useEffect(() => {
    const timer = setTimeout(close, 12000);
    return () => clearTimeout(timer);
  }, [cheer.at]);
  return (
    <div className="badge-cheer" role="status">
      {!reducedMotion() && <Burst />}
      <span className="badge-cheer-art">
        {keys.slice(0, 3).map((key, i) => (
          <span key={key} style={{ "--i": i }}>
            <BadgeArt name={key} size={keys.length > 1 ? 46 : 56} />
          </span>
        ))}
      </span>
      <button type="button" className="badge-cheer-text" onClick={open}>
        <small>{cheer.first ? "Geçmişinden" : "Yeni başarım"}</small>
        <b>{cheer.first && keys.length > 1 ? `${keys.length} başarım açıldı` : one ? one.name : `${keys.length} başarım birden`}</b>
        <em>{one && !cheer.first ? one.how : "Hepsi Ben → Başarımlar'da."}</em>
      </button>
      <button type="button" className="icon-button badge-cheer-close" aria-label="Kapat" onClick={close}>
        <X size={18} />
      </button>
    </div>
  );
}
