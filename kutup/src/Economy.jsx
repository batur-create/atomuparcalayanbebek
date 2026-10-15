// Tuğla in the app: the catalogue you pick a building from, the little
// building portraits, and the receipt that comes after every session.
import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { BY_ID, CATALOG, CATEGORIES, CLASSES, REASONS, minutesOf, wageFor } from "../shared/catalog.js";
import { buildingSVG, projector, spec } from "./iso.js";
import { get } from "./api.js";
import { Modal } from "./Modal.jsx";
import "./economy.css";

const portraits = new Map();
/** A catalogue building, drawn small, as it will stand in the village. */
export function BuildingThumb({ id, size = 92 }) {
  const item = BY_ID[id] || BY_ID.kulube;
  const html = useMemo(() => {
    if (!portraits.has(item.id)) {
      const P = projector({ cx: 60, cy: 76, s: { tower: 7.1, house: 7.4, cottage: 8.8 }[item.kind] });
      portraits.set(item.id, `<svg viewBox="0 0 120 100" aria-hidden="true">${buildingSVG(P, spec(item.kind, 7, item.id), 7)}</svg>`);
    }
    return portraits.get(item.id);
  }, [item.id]);
  return <span className="building-thumb" style={{ width: size }} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** "Ne inşa ediyorsun?": every building by size, with its price and what it pays. */
export function CatalogModal({ bricks, selected, pick, close, maxMinutes = 0, start = "shop" }) {
  const [wallet, setWallet] = useState(null),
    [view, setView] = useState(start);
  const collection = view === "collection";
  useEffect(() => {
    get("/wallet").then(setWallet).catch(() => {});
  }, []);
  const built = wallet?.built || {};
  const owned = CATALOG.filter((item) => built[item.id]).length;
  return (
    <Modal
      wide
      title={collection ? "Koleksiyonun" : "Ne inşa ediyorsun?"}
      subtitle={
        collection
          ? "Köyüne diktiğin her yapı burada. Siluetler henüz yapmadıkların."
          : "Malzemeyi başlarken ödersin; seans bitince maaşın yatar ve yapı köyüne eklenir."
      }
      close={close}
    >
      <div className="catalog-top">
        <span className="brick-pill">Kasanda <b>{bricks} 🧱</b></span>
        <button type="button" className={`brick-pill ${collection ? "on" : ""}`} aria-pressed={collection} onClick={() => setView(collection ? "shop" : "collection")}>
          Koleksiyon <b>{owned}/{CATALOG.length}</b> {collection ? "· kataloğa dön" : "· göster"}
        </button>
      </div>
      {Object.entries(CLASSES).map(([key, cls]) => (
        <section key={key} className="catalog-class">
          <h3>
            {cls.label} · {cls.minutes} dk <small>maaş {wageFor(cls.minutes)} 🧱</small>
          </h3>
          <div className="catalog-grid">
            {CATALOG.filter((item) => item.class === key).map((item) => {
              const short = item.cost - bricks,
                tooLong = maxMinutes > 0 && minutesOf(item) > maxMinutes,
                net = wageFor(minutesOf(item)) - item.cost;
              if (collection)
                return (
                  <div key={item.id} className={`catalog-item ${built[item.id] ? "" : "unseen"}`}>
                    {built[item.id] ? <span className="catalog-owned">✓ {built[item.id]}</span> : null}
                    <BuildingThumb id={item.id} />
                    <b>
                      {built[item.id] ? item.emoji : "❔"} {item.name}
                    </b>
                    <small>{built[item.id] ? item.blurb : `${cls.label} · ${item.cost ? `${item.cost} 🧱` : "bedava"}`}</small>
                    {item.effect && <span className="catalog-effect">⚙️ {item.effect}</span>}
                  </div>
                );
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`catalog-item ${selected === item.id ? "active" : ""}`}
                  disabled={short > 0 || tooLong}
                  aria-pressed={selected === item.id}
                  onClick={() => {
                    pick(item.id);
                    close();
                  }}
                >
                  {built[item.id] ? <span className="catalog-owned" title="Köyünde bu kadar var">✓ {built[item.id]}</span> : null}
                  <BuildingThumb id={item.id} />
                  <b>
                    {item.emoji} {item.name}
                  </b>
                  <small>
                    {CATEGORIES[item.category]} · {item.blurb}
                  </small>
                  {item.effect && <span className="catalog-effect">⚙️ {item.effect}</span>}
                  <span className="catalog-price">
                    <span>{item.cost ? `${item.cost} 🧱` : "Bedava"}</span>
                    <em className={net < 0 ? "minus" : ""} title="Maaş eksi malzeme">net {net >= 0 ? "+" : ""}{net}</em>
                  </span>
                  {short > 0 && <span className="catalog-short">{short} 🧱 eksik</span>}
                  {tooLong && short <= 0 && <span className="catalog-short">Kalan süre yetmez</span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <p className="catalog-rules">
        İşlevsel yapılar köyünde durdukça her seansına yardım eder. Yarıda bırakırsan malzemenin yarısı hemen, %30'u enkazı bir sonraki seansın kaldırınca geri gelir; %20 gider.
        İlk 2 dakikada vazgeçmek bedava.
      </p>
    </Modal>
  );
}

const TITLES = {
  cancelled: "Vazgeçildi · malzeme iade",
  built: "Maaş fişi",
  plain: "Maaş fişi · serbest çalışma",
  collapsed: "Yarım kalan inşaat",
};
/** The receipt of one session (materials, wage, bonuses, refunds), shown once it is settled. */
export function ReceiptCard({ receipt, close, next = null, onContinue }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true,
      timer;
    // The server settles the session a moment after it ends; ask again until it has.
    const load = (tries) =>
      get(`/wallet?session=${receipt.end}`)
        .then((w) => {
          if (!alive) return;
          if (!w.receipt.some((r) => r.reason !== "cost") && tries > 0) timer = setTimeout(() => load(tries - 1), 1500);
          else if (w.receipt.length) setData(w);
          else close();
        })
        .catch(() => alive && close());
    timer = setTimeout(() => load(4), receipt.delay || 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [receipt.end]);
  if (!data) return null;
  const total = data.receipt.reduce((t, r) => t + r.delta, 0);
  return (
    <aside className="receipt-card" role="status" aria-live="polite">
      <button className="icon-button" aria-label="Fişi kapat" onClick={close}>
        <X size={17} />
      </button>
      <h3>🧾 {TITLES[receipt.type] || TITLES.built}</h3>
      <ul>
        {data.receipt.map((r, i) => (
          <li key={i}>
            <span>{r.note || REASONS[r.reason]}</span>
            <b className={r.delta < 0 ? "minus" : ""}>
              {r.delta > 0 ? "+" : ""}
              {r.delta} 🧱
            </b>
          </li>
        ))}
      </ul>
      <p className="receipt-total">
        <span>Net</span>
        <b className={total < 0 ? "minus" : ""}>
          {total > 0 ? "+" : ""}
          {total} 🧱
        </b>
      </p>
      <p className="receipt-balance">
        Kasada {data.bricks} 🧱
        {data.ruin ? ` · Enkazını bir sonraki seansın kaldırınca +${data.ruin.refund} 🧱 daha gelir.` : ""}
      </p>
      {next != null && onContinue && (
        <button type="button" className="btn receipt-continue" onClick={onContinue}>
          🔥 +25 dk devam{next > 0 ? ` · seri +%${Math.round(next * 100)}` : ""}
        </button>
      )}
    </aside>
  );
}
