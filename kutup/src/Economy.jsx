// Tuğla in the app: the catalogue you pick a building from, the little
// building portraits, and the receipt that comes after every session.
import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, X } from "lucide-react";
import { BY_ID, CATALOG, CATEGORIES, CLASSES, REASONS, WEEKLY_DAYS, minutesOf, stateOf, wageFor } from "../shared/catalog.js";
import { buildingSVG, projector, spec } from "./iso.js";
import { dayWord, get, shortTime } from "./api.js";
import { reducedMotion } from "./ui.jsx";
import { Loading } from "./Illustrations.jsx";
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

// A small "no" for a card that cannot be picked yet (transform only; still
// when the motion setting rests).
const nope = (el) =>
  !reducedMotion() &&
  document.documentElement.dataset.motion !== "still" &&
  el?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "translateX(0)" }], { duration: 320, easing: "ease-out" });

/** The tuğla wallet: the balance, what is coming back and the latest movements. */
function WalletView({ wallet, bricks, back }) {
  const log = wallet?.log || [];
  return (
    <div className="wallet">
      <div className="wallet-balance">
        <span className="wallet-bricks" aria-hidden="true">
          🧱
        </span>
        <span>
          <b>{bricks}</b>
          <small>tuğla kasanda · odaklandıkça kazanılır, yapılara harcanır</small>
        </span>
      </div>
      {wallet?.ruin && <p className="wallet-ruin">Enkazını bir sonraki seansın kaldırınca +{wallet.ruin.refund} 🧱 geri gelir.</p>}
      <h3>Son hareketler</h3>
      {!wallet ? (
        <Loading text="Defter açılıyor…" />
      ) : log.length ? (
        <ul className="wallet-log">
          {log.slice(0, 20).map((r, i) => (
            <li key={i}>
              <span>
                {r.note || REASONS[r.reason] || r.reason}
                <small>
                  {dayWord(r.created)} {shortTime(r.created)}
                </small>
              </span>
              <b className={r.delta < 0 ? "minus" : ""}>{r.reason === "blueprint" || r.reason === "gift" ? "🎁" : `${r.delta > 0 ? "+" : ""}${r.delta} 🧱`}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="wallet-empty">Defter boş. İlk seansın bitince maaşın buraya yazılır.</p>
      )}
      <button type="button" className="btn primary full" onClick={back}>
        Kataloğa bak
      </button>
    </div>
  );
}

/** "Ne inşa ediyorsun?": every building by size, with its price and what it pays.
 *  Every card answers a tap: pick it, or hear what is missing (n27). */
export function CatalogModal({ bricks, selected, pick, close, maxMinutes = 0, start = "shop", founder = false, show }) {
  const [wallet, setWallet] = useState(null),
    [view, setView] = useState(start),
    [hint, setHint] = useState(null);
  const collection = view === "collection",
    walletView = view === "wallet";
  useEffect(() => {
    get("/wallet").then(setWallet).catch(() => {});
  }, []);
  const built = wallet?.built || {},
    unlocks = wallet?.unlocks || [];
  // Where each building stands for this member today.
  const now = Date.now(),
    state = (item) => stateOf(item, now, unlocks, founder);
  const shown = CATALOG.filter((item) => !["hidden", "soon"].includes(state(item)));
  const weekly = CATALOG.filter((item) => ["new", "soon"].includes(state(item)));
  const daysLeft = (item) => Math.max(1, Math.ceil((item.since + WEEKLY_DAYS * 86400000 - now) / 86400000));
  const owned = shown.filter((item) => built[item.id]).length;
  const say = (e, text) => {
    setHint(text);
    nope(e.currentTarget);
  };
  const shortWords = (short) => {
    const runs = Math.max(1, Math.ceil(short / wageFor(25)));
    return `${short} 🧱 eksik: ${runs === 1 ? "25 dakikalık bir seans" : `25 dakikalık ${runs} seans`} daha.`;
  };
  const card = (item) => {
    const cls = CLASSES[item.class],
      open = ["open", "new"].includes(state(item)),
      soon = state(item) === "soon",
      short = item.cost - bricks,
      tooLong = maxMinutes > 0 && minutesOf(item) > maxMinutes,
      net = wageFor(minutesOf(item)) - item.cost;
    if (soon)
      return (
        <button
          key={item.id}
          type="button"
          className="catalog-item unseen soon"
          aria-disabled="true"
          onClick={(e) => say(e, `${item.name} pazartesi açılıyor. O hafta katalogda olacak: ${cls.label.toLocaleLowerCase("tr")}, ${item.cost} 🧱.`)}
        >
          <span className="catalog-owned soon">Pazartesi</span>
          <BuildingThumb id={item.id} />
          <b>🔒 {item.name}</b>
          <small>Gelecek haftanın yapısı · {cls.label} · {item.cost} 🧱</small>
        </button>
      );
    if (collection)
      return built[item.id] ? (
        <button key={item.id} type="button" className="catalog-item" onClick={() => show?.(item.id)}>
          <span className="catalog-owned">✓ {built[item.id]}</span>
          <BuildingThumb id={item.id} />
          <b>
            {item.emoji} {item.name}
          </b>
          <small>{item.blurb}</small>
          {item.effect && <span className="catalog-effect">⚙️ {item.effect}</span>}
          <span className="catalog-go">
            <MapPin size={12} /> Köyde göster
          </span>
        </button>
      ) : (
        <button
          key={item.id}
          type="button"
          className="catalog-item unseen"
          aria-disabled="true"
          onClick={(e) => say(e, `${item.name} henüz köyünde yok. ${item.rare === true ? "Önce planını bulman gerek." : "Katalogdan seçip bir inşaat seansı bitirince buraya gelir."}`)}
        >
          <BuildingThumb id={item.id} />
          <b>🔒 {item.name}</b>
          <small>{`${cls.label} · ${item.cost ? `${item.cost} 🧱` : "bedava"}${item.rare === true ? " · plan gerekir" : ""}`}</small>
          {item.effect && <span className="catalog-effect">⚙️ {item.effect}</span>}
        </button>
      );
    const blocked = !open || short > 0 || tooLong;
    return (
      <button
        key={item.id}
        type="button"
        className={`catalog-item ${selected === item.id ? "active" : ""} ${open ? "" : "locked"} ${blocked ? "blocked" : ""}`}
        aria-disabled={blocked || undefined}
        aria-pressed={selected === item.id}
        onClick={(e) => {
          if (!open) return say(e, `${item.name} için planı bulman gerek: bitirdiğin her seansta %10 şans, 7/14/30 günlük seride garanti.`);
          if (short > 0) return say(e, shortWords(short));
          if (tooLong) return say(e, "Ritimde kalan süre bu yapıya yetmez. Daha küçük bir yapı seç ya da bir sonraki tura bırak.");
          pick(item.id);
          close();
        }}
      >
        {built[item.id] ? <span className="catalog-owned" title="Köyünde bu kadar var">✓ {built[item.id]}</span> : null}
        <BuildingThumb id={item.id} />
        <b>
          {open ? item.emoji : "🔒"} {item.name}
        </b>
        <small>
          {item.rare || item.since ? `${cls.label} · ${cls.minutes} dk · ` : `${CATEGORIES[item.category]} · `}
          {item.blurb}
        </small>
        {item.effect && <span className="catalog-effect">⚙️ {item.effect}</span>}
        <span className="catalog-price">
          <span>{item.cost ? `${item.cost} 🧱` : "Bedava"}</span>
          <em className={net < 0 ? "minus" : ""} title="Maaş eksi malzeme">
            net {net >= 0 ? "+" : ""}
            {net}
          </em>
        </span>
        {!open && <span className="catalog-short">Planı gerekiyor: her bitirdiğin seansta %10 şans, 7/14/30 günlük seride garanti</span>}
        {state(item) === "new" && <span className="catalog-new">Yeni! {daysLeft(item)} gün daha katalogda, sonra yalnız planla</span>}
        {open && short > 0 && <span className="catalog-short">{short} 🧱 eksik</span>}
        {open && tooLong && short <= 0 && <span className="catalog-short">Kalan süre yetmez</span>}
      </button>
    );
  };
  if (walletView)
    return (
      <Modal title="Tuğla kasan" subtitle="Seans bitince maaş yatar; inşaata başlarken malzeme ödenir." close={close}>
        <WalletView wallet={wallet} bricks={bricks} back={() => setView("shop")} />
      </Modal>
    );
  return (
    <Modal
      wide
      title={collection ? "Koleksiyonun" : "Ne inşa ediyorsun?"}
      subtitle={
        collection
          ? "Köyüne diktiğin her yapı burada; dokununca köyde gösterir. Siluetler henüz yapmadıkların."
          : "Malzemeyi başlarken ödersin; seans bitince maaşın yatar ve yapı köyüne eklenir."
      }
      close={close}
    >
      <div className="catalog-top">
        <button type="button" className="brick-pill" onClick={() => setView("wallet")}>
          Kasanda <b>{bricks} 🧱</b>
        </button>
        <button type="button" className={`brick-pill ${collection ? "on" : ""}`} aria-pressed={collection} onClick={() => (setHint(null), setView(collection ? "shop" : "collection"))}>
          Koleksiyon <b>
            {owned}/{shown.length}
          </b>{" "}
          {collection ? "· kataloğa dön" : "· göster"}
        </button>
        {unlocks.length > 0 && (
          <button type="button" className="brick-pill" onClick={() => document.querySelector(".catalog-class.rare")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            🎁 {unlocks.length} nadir plan
          </button>
        )}
      </div>
      {hint && (
        <p className="catalog-hint" role="status">
          {hint}
          <button type="button" className="icon-button" aria-label="Notu kapat" onClick={() => setHint(null)}>
            <X size={15} />
          </button>
        </p>
      )}
      {!collection && weekly.length > 0 && (
        <section className="catalog-class weekly">
          <h3>
            🗓️ Bu haftanın yapısı <small>her pazartesi yeni bir yapı</small>
          </h3>
          <div className="catalog-grid">{weekly.map(card)}</div>
        </section>
      )}
      {Object.entries(CLASSES).map(([key, cls]) => (
        <section key={key} className="catalog-class">
          <h3>
            {cls.label} · {cls.minutes} dk <small>maaş {wageFor(cls.minutes)} 🧱</small>
          </h3>
          <div className="catalog-grid">{shown.filter((item) => item.class === key && !item.rare && !item.since).map(card)}</div>
        </section>
      ))}
      <section className="catalog-class rare">
        <h3>
          ✨ Nadir yapılar <small>plan bulunca açılır</small>
        </h3>
        <div className="catalog-grid">{shown.filter((item) => item.rare || (item.since && (collection || state(item) !== "new"))).map(card)}</div>
      </section>
      <p className="catalog-rules">
        İşlevsel yapılar köyünde durdukça her seansına yardım eder. Yarıda bırakırsan malzemenin yarısı hemen, %30'u enkazı bir sonraki seansın kaldırınca geri gelir; %20 gider.
        İlk 2 dakikada vazgeçmek bedava.
      </p>
      {!collection && (
        <button
          type="button"
          className="catalog-ask"
          onClick={() => {
            close();
            window.dispatchEvent(new CustomEvent("kutup:ask", { detail: { kind: "build" } }));
          }}
        >
          <span aria-hidden="true">🏗️</span>
          <span>
            <strong>Aradığın yapı yok mu?</strong>
            <small>Yaz, Batur’a gitsin. Beğenirse kataloğa ekler.</small>
          </span>
          <ArrowRight size={16} />
        </button>
      )}
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
            <b className={r.delta < 0 ? "minus" : ""}>{r.reason === "blueprint" || r.reason === "gift" ? "🎁" : `${r.delta > 0 ? "+" : ""}${r.delta} 🧱`}</b>
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
