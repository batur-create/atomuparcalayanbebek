// n42, Kara'ya sor: help that only shows when someone asks for it.
//  - HelpButton: Kara's face in the top bar, on every screen. A tap opens the
//    sheet for the screen you are on.
//  - Ask: a small "?" beside a tricky word; it opens the sheet at that question.
//  - HelpSheet: Kara says what the screen is for in one line, then the
//    questions people actually have, each opening on a tap.
//  - Tour: five stops with a spotlight, offered once to someone who just joined.
//    Someone who already knows the app only meets the new button, once.
// Everything talks through one window event, so any screen can open help
// without threading props: openHelp({ tab, topic }).
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "./Modal.jsx";
import { KaraRig } from "./Kara.jsx";
import { reducedMotion, storage } from "./ui.jsx";
import { HELP, HELP_NEWS, HELP_TABS, TOUR } from "./helpTopics.js";
import "./help.css";

export const openHelp = (detail = {}) => window.dispatchEvent(new CustomEvent("kutup:help", { detail }));
export const TOUR_KEY = "kutup-tur";

// Kara's face, small enough for a button: velvet head, two black-hole eyes.
export function KaraFace({ size = 20 }) {
  return (
    <svg className="kara-face" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path className="kara-face-head" d="M4.6 10.4C4 6.6 4.3 3.4 5.6 2.6c1.1-.6 3.3 1.7 4.4 3h4c1.1-1.3 3.3-3.6 4.4-3 1.3.8 1.6 4 1 7.8.9 6-2.6 10.6-7.4 10.6S3.7 16.4 4.6 10.4Z" />
      <circle cx="9" cy="12.2" r="2.55" fill="#d9a24a" />
      <circle cx="15" cy="12.2" r="2.55" fill="#d9a24a" />
      <circle cx="9" cy="12.2" r="2.05" fill="#050507" />
      <circle cx="15" cy="12.2" r="2.05" fill="#050507" />
      <circle cx="8.3" cy="11.4" r=".6" fill="#fffdf8" />
      <circle cx="14.3" cy="11.4" r=".6" fill="#fffdf8" />
      <path d="M11.2 15.6h1.6l-.8.8Z" fill="#6b4d5b" />
    </svg>
  );
}

export function HelpButton({ tab }) {
  return (
    <button type="button" className="icon-button help-button" aria-label="Kara’ya sor: bu ekran ne işe yarar?" title="Kara’ya sor" onClick={() => openHelp({ tab })}>
      <KaraFace />
    </button>
  );
}

// The small "?" beside a word that needs explaining.
export function Ask({ tab, topic, label }) {
  return (
    <button
      type="button"
      className="ask-dot"
      aria-label={`Bu ne demek? ${label || ""}`.trim()}
      onClick={(e) => {
        e.stopPropagation();
        openHelp({ tab, topic });
      }}
    >
      ?
    </button>
  );
}

export function HelpSheet({ tab, topic, close, startTour, ask, news }) {
  const [at, setAt] = useState(HELP_TABS.includes(tab) ? tab : tab === "feedback" ? "me" : "home"),
    [open, setOpen] = useState(topic || null);
  const list = useRef(null);
  const section = HELP[at];
  useEffect(() => {
    if (!topic) return;
    const row = list.current?.querySelector(`[data-topic="${topic}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
  }, []);
  return (
    <Modal title="Kara’ya sor" close={close} className="help-sheet">
      <div className="help-kara">
        <div className="help-kara-art">
          <KaraRig pose="greet" />
        </div>
        <p className="help-say" key={at}>
          {section.intro}
        </p>
      </div>
      <div className="help-tabs" role="tablist" aria-label="Bölüm">
        {HELP_TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={at === id}
            className={at === id ? "on" : ""}
            onClick={() => {
              setAt(id);
              setOpen(null);
            }}
          >
            {HELP[id].label}
          </button>
        ))}
      </div>
      <div className="help-list" ref={list}>
        {section.items.map((item) => {
          const on = open === item.id;
          return (
            <div key={item.id} className={`help-item ${on ? "on" : ""}`} data-topic={item.id}>
              <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : item.id)}>
                <span>{item.q}</span>
                <i aria-hidden="true">{on ? "−" : "+"}</i>
              </button>
              {on && <p>{item.a}</p>}
            </div>
          );
        })}
      </div>
      <div className="help-foot">
        <button type="button" className="btn ghost" onClick={startTour}>
          Kısa turu izle
        </button>
        {news && (
          <button type="button" className="btn ghost" onClick={news}>
            Yenilikler
          </button>
        )}
        <button type="button" className="text-button" onClick={ask}>
          Cevap yok mu? Batur’a sor
        </button>
      </div>
    </Modal>
  );
}

// The first visible element for a stop, or null (then the card sits in the middle).
function targetOf(stop) {
  for (const sel of stop?.at || []) {
    const el = document.querySelector(sel);
    if (el && el.getClientRects().length) return el;
  }
  return null;
}

// steps: the stops; offer: ask first ("göstereyim mi?") without covering the app.
export function Tour({ steps, offer = false, done }) {
  const [step, setStep] = useState(offer ? -1 : 0),
    [box, setBox] = useState(null);
  const stop = steps[step];
  const finish = () => {
    storage.set(TOUR_KEY, "done");
    done();
  };
  const [tries, setTries] = useState(0);
  useLayoutEffect(() => {
    if (step < 0) return;
    const el = targetOf(stop);
    if (!el) {
      setBox(null);
      // Coming from another screen, the page may not be drawn yet: look again.
      if (tries < 6) {
        const again = setTimeout(() => setTries(tries + 1), 250);
        return () => clearTimeout(again);
      }
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "auto" });
    const measure = () => {
      const r = el.getBoundingClientRect(),
        pad = 6;
      setBox({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
    };
    measure();
    // The page may still be settling (a card animating in): measure again.
    const later = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(later);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, tries]);
  useEffect(() => {
    const key = (e) => e.key === "Escape" && finish();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  if (step < 0)
    return createPortal(
      <div className="tour-offer" role="dialog" aria-label="Kara’dan kısa tur">
        <div className="tour-kara">
          <KaraRig pose="greet" />
        </div>
        <div>
          <p>Selam, ben Kara! Kütüp’ü {steps.length} adımda göstereyim mi?</p>
          <div className="tour-row">
            <button type="button" className="btn primary" onClick={() => setStep(0)}>
              Göster
            </button>
            <button type="button" className="btn ghost" onClick={finish}>
              Gerek yok
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  const last = step === steps.length - 1,
    vh = window.innerHeight,
    vw = window.innerWidth,
    half = Math.min(380, vw - 32) / 2,
    below = box ? box.top + box.height + 190 < vh || box.top < vh / 2 : false;
  // Under the spot when there is room, else above it; across, as near to it as the screen allows.
  const card = box
    ? {
        ...(below ? { top: Math.min(box.top + box.height + 12, vh - 200) } : { bottom: Math.max(vh - box.top + 12, 12) }),
        left: Math.min(Math.max(box.left + box.width / 2, half + 16), vw - half - 16),
      }
    : { top: "50%", transform: "translateY(-50%)" };
  return createPortal(
    <div className="tour" role="dialog" aria-modal="true" aria-label="Kısa tur">
      <div className="tour-shade" onClick={finish} />
      {box ? <div className="tour-hole" style={box} /> : <div className="tour-dim" />}
      <div className="tour-card" style={card} key={step}>
        <div className="tour-kara">
          <KaraRig pose="greet" />
        </div>
        <div>
          <p aria-live="polite">{stop.text}</p>
          <div className="tour-row">
            {steps.length > 1 && (
              <span className="tour-dots" aria-label={`${step + 1}/${steps.length}`}>
                {steps.map((_, i) => (
                  <i key={i} className={i === step ? "on" : ""} />
                ))}
              </span>
            )}
            {!last && (
              <button type="button" className="text-button" onClick={finish}>
                Geç
              </button>
            )}
            <button type="button" className="btn primary" autoFocus onClick={() => (last ? finish() : (setTries(0), setStep(step + 1)))}>
              {last ? (steps.length > 1 ? "Bitir" : "Tamam") : "İleri"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Who meets what, once per device: someone who just joined is offered the
// tour; anyone else only meets the new button.
export const tourFor = (fresh) => (storage.get(TOUR_KEY) ? null : fresh ? { steps: TOUR, offer: true } : { steps: [HELP_NEWS] });
