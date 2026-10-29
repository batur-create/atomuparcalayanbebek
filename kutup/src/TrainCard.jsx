// n51: the village train up close: a notice when one is coming, a card with
// what it is and when the next ones run, a camera that rides along, a whistle.
import React, { useEffect, useRef, useState } from "react";
import { Megaphone, Navigation, TrainFront, X } from "lucide-react";
import { KIND_NAMES, LOADS } from "./koy2/train.js";

const clock = (ms) => new Date(ms).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
const secs = (ms) => {
  const s = Math.max(1, Math.round(ms / 1000));
  return s >= 90 ? `${Math.round(s / 60)} dk` : `${s} sn`;
};

/** Looks at the village's train once a second (only while the page is shown). */
export function useTrainStatus(train) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (!train) return setStatus(null);
    const look = () => {
      if (document.visibilityState === "hidden") return;
      const next = train.status(Date.now());
      setStatus((old) => (old && next && old.n === next.n && old.state === next.state && Math.abs(old.eta - next.eta) < 900 && Math.abs(old.leaves - next.leaves) < 900 ? old : next));
    };
    look();
    const timer = setInterval(look, 1000);
    return () => clearInterval(timer);
  }, [train]);
  return status;
}

const lineOf = (st) => {
  if (!st) return "";
  const name = KIND_NAMES[st.kind];
  if (st.state === "standing") return `${name} durakta${st.kind === "malzeme" ? ", yükünü indiriyor" : ""} · ${secs(st.leaves)} sonra kalkıyor`;
  if (st.state === "leaving") return `${name} duraktan ayrılıyor`;
  if (st.state === "passing") return `${name} köyün önünden geçiyor`;
  return `${name} geliyor · ${secs(st.eta)} sonra durakta`;
};

/** The notice over the map: a train is on its way, standing or passing. */
export function TrainNotice({ status, onOpen, onDismiss }) {
  if (!status || status.state === "leaving") return null;
  if (status.state === "coming" && status.eta > 60000) return null;
  return (
    <div className="train-notice" role="status">
      <TrainFront size={16} aria-hidden="true" />
      <span>{lineOf(status)}</span>
      <button className="text-button" onClick={onOpen}>Bak</button>
      <button className="icon-button" aria-label="Bildirimi kapat" onClick={onDismiss}>
        <X size={14} />
      </button>
    </div>
  );
}

/** The card: what is on the line, the next ones, follow and whistle. */
export function TrainCard({ train, status, following, onFollow, onHonk, onGoStop, close }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(timer);
  }, []);
  const table = train.timetable(Date.now(), 5).filter((x) => !status || x.n !== status.n);
  const loads = status?.cars.filter((c) => LOADS[c]).map((c) => LOADS[c]);
  return (
    <div className="building-card train-card" role="dialog" aria-label="Tren bilgisi">
      <button className="icon-button building-card-close" aria-label="Kartı kapat" onClick={close}>
        <X size={16} />
      </button>
      <div className="building-card-head">
        <span className="building-card-emoji" aria-hidden="true">🚂</span>
        <div>
          <strong>{status ? KIND_NAMES[status.kind] : "Köy treni"}</strong>
          <small>{status ? lineOf(status) : table[0] ? `Şu an hatta tren yok · sıradaki ${clock(table[0].at)}` : "Şu an hatta tren yok"}</small>
        </div>
      </div>
      {status && (
        <p className="train-facts">
          {status.cars.length === 1 ? "Lokomotif" : `Lokomotif + ${status.cars.length - 1} vagon`}
          {status.kind === "yolcu" || status.kind === "kisa" ? " · yolcu alıp indiriyor" : ""}
          {loads?.length ? ` · ${loads.join(", ")} getiriyor${status.site ? "; yükler şantiyeye taşınır" : "; şantiye yok, yükler meydana gider"}` : ""}
          {status.kind === "yuk" ? " · durmaz, köyün önünden yavaşça geçer" : ""}
        </p>
      )}
      <div className="train-actions">
        {status ? (
          <>
            <button className="text-button" onClick={() => onFollow(!following)}>
              <Navigation size={14} aria-hidden="true" /> {following ? "Takibi bırak" : "Treni takip et"}
            </button>
            <button className="text-button" onClick={onHonk}>
              <Megaphone size={14} aria-hidden="true" /> Düdük çal
            </button>
          </>
        ) : (
          onGoStop && (
            <button className="text-button" onClick={onGoStop}>
              <Navigation size={14} aria-hidden="true" /> Durağa git
            </button>
          )
        )}
      </div>
      {table.length > 0 && (
        <ul className="train-table" aria-label="Sıradaki trenler">
          {table.slice(0, 3).map((x) => (
            <li key={x.n}>
              <b>{clock(x.at)}</b> {KIND_NAMES[x.kind]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
