// Kütüp'ten haberler (n43): what used to wait behind Ben comes to the home page.
// A new version's notes sit on everyone's home page until read or closed, a
// line Batur sent to the whole team stays there for three days, and a short
// row of doors leads to the things people did not know were there.
import React, { useState } from "react";
import { m } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { storage } from "./ui.jsx";
import { shortTime, dateLabel } from "./api.js";

/** The newest version's notes, until opened or closed (yenilik from useYenilik). */
export function NewsCard({ yenilik, open }) {
  const son = yenilik?.son;
  if (!yenilik?.yeni || !son) return null;
  return (
    <m.section className="news-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
      <button type="button" className="news-card-main" onClick={open}>
        <span className="news-card-eyebrow">
          ✨ Yeni sürüm · Sürüm {son.surum}
          {yenilik.gorulen > 0 && son.surum - yenilik.gorulen > 1 ? ` · ${son.surum - yenilik.gorulen} sürümdür bakmadın` : ""}
        </span>
        <strong>{son.baslik}</strong>
        <ul>
          {son.maddeler.slice(0, 2).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <span className="news-card-more">
          {son.maddeler.length > 2 ? `${son.maddeler.length - 2} yenilik daha · hepsini oku` : "Yeniliklere bak"} <ArrowRight size={14} />
        </span>
      </button>
      <button type="button" className="icon-button news-card-close" aria-label="Okudum, kapat" onClick={() => yenilik.gordu(son.surum)}>
        <X size={17} />
      </button>
    </m.section>
  );
}

const ANNOUNCE_KEY = "kutup-duyuru-kapali";
const ANNOUNCE_DAYS = 3;
/** Batur's latest line to the team (a board message of kind "announce"). */
export function AnnounceCard({ messages, now, openBoard }) {
  const [closed, setClosed] = useState(() => storage.get(ANNOUNCE_KEY) || "");
  const last = [...(messages || [])].reverse().find((x) => x.kind === "announce");
  if (!last || last.id === closed || now - last.created > ANNOUNCE_DAYS * 86400000) return null;
  const close = () => {
    storage.set(ANNOUNCE_KEY, last.id);
    setClosed(last.id);
  };
  return (
    <m.section className="announce-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
      <button type="button" className="announce-card-main" onClick={openBoard}>
        <span className="announce-card-eyebrow">
          📣 Batur’dan duyuru · {dateLabel(last.created)} {shortTime(last.created)}
        </span>
        <p>{last.text}</p>
      </button>
      <button type="button" className="icon-button news-card-close" aria-label="Duyuruyu kapat" onClick={close}>
        <X size={17} />
      </button>
    </m.section>
  );
}

/** Doors to the things that live in Ben, so everyone finds them. */
export function Shortcuts({ items }) {
  return (
    <nav className="home-shortcuts" aria-label="Kütüp'te neler var">
      <span className="home-shortcuts-title">Kütüp’te neler var?</span>
      <div>
        {items.map(([emoji, label, go, dot]) => (
          <m.button whileTap={{ scale: 0.95 }} type="button" key={label} onClick={go}>
            <span aria-hidden="true">{emoji}</span>
            {label}
            {dot && <b className="home-shortcut-dot" aria-label="yeni" />}
          </m.button>
        ))}
      </div>
    </nav>
  );
}
