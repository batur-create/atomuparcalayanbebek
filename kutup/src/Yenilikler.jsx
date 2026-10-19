// Ben → Yenilikler (n41): every published version, newest first, in plain words.
// The list lives in yenilikler.js; each job adds its lines there.
import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Modal } from "./Modal.jsx";
import { YENILIKLER, tarihYazisi } from "./yenilikler.js";
import "./yenilikler.css";

export function YenilikModal({ gorulen, gordu, close }) {
  // What was new when the window opened stays marked while it is open.
  const [once] = useState(gorulen);
  useEffect(() => gordu(YENILIKLER[0].surum), []);
  const yeniMi = (s) => (once ? s.surum > once : s === YENILIKLER[0]);
  return (
    <Modal title="Yenilikler" subtitle="Her güncellemede neler değişti. En yenisi en üstte." close={close} className="news-modal">
      <ol className="news-list">
        {YENILIKLER.map((s, i) => (
          <li key={s.surum}>
            <details open={i < 2 || yeniMi(s)}>
              <summary>
                <span className="news-meta">
                  Sürüm {s.surum} · {tarihYazisi(s)}
                  {yeniMi(s) && <b className="news-new">Yeni</b>}
                </span>
                <strong>{s.baslik}</strong>
                <ChevronRight size={17} className="news-chevron" aria-hidden="true" />
              </summary>
              <ul>
                {s.maddeler.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
