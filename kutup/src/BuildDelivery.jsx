import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, FastForward } from "lucide-react";
import { ConstructionScene } from "./Village.jsx";
import { Modal } from "./Modal.jsx";
import { reducedMotion } from "./ui.jsx";
import { modelOf } from "../shared/catalog.js";
import "./delivery.css";

const REPLAY_MS = 18000;
export function BuildDelivery({ delivery, accept }) {
  const item = modelOf(delivery.model, delivery.kind);
  const [playing, setPlaying] = useState(() => !reducedMotion());
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const started = useRef(Date.now());
  const built = useRef({ type: "built", kind: delivery.kind, model: delivery.model, seed: delivery.seed, at: Date.now() });
  const run = useRef({ kind: delivery.kind, model: delivery.model, seed: delivery.seed, minutes: REPLAY_MS / 60000, endsAt: started.current + REPLAY_MS });
  useEffect(() => {
    if (!playing) return;
    const end = setTimeout(() => { built.current.at = Date.now(); setPlaying(false); }, REPLAY_MS);
    return () => clearTimeout(end);
  }, []);
  const finish = async (showVillage) => {
    if (busy) return;
    setBusy(true); setError("");
    try { await accept(showVillage); }
    catch (e) { setError(e.message || "Teslim kaydı güncellenemedi. Binan ve kazanımların güvende; tekrar deneyebilirsin."); setBusy(false); }
  };
  // n43: a building Batur gave as a present plays the same replay, as his gift.
  const gift = delivery.gift;
  return <Modal title={gift ? (playing ? "Batur sana bir yapı gönderdi." : "Hediyen köyde yerini aldı.") : playing ? "Bir şantiye böyle yükseldi." : "Emeğin köyde yerini aldı."}
    subtitle={gift ? `🎁 ${gift} · ${item.name}` : `${delivery.minutes} dakika rahat inşaat · ${item.name}`} close={() => finish(false)} className="build-delivery">
    <div className="delivery-label"><span>{playing ? <FastForward size={15} /> : <Check size={15} />}{playing ? "18 SANİYEDE ŞANTİYEN" : "TESLİME HAZIR"}</span><b>{item.emoji} {item.name}</b></div>
    <div className="delivery-scene">
      <ConstructionScene run={playing ? run.current : null} outcome={playing ? null : built.current} />
    </div>
    {gift
      ? <div className="delivery-reward"><span>Batur’dan</span><strong>🎁</strong><small>Bu yapı sana hediye; köyünde hep duracak.</small></div>
      : <div className="delivery-reward"><span>Çalışmanın karşılığı</span><strong>+{delivery.reward} 🧱</strong><small>Binan köyüne eklendi; kazanımların kasanda.</small></div>}
    {error && <p role="alert" className="delivery-error">{error}</p>}
    <div className="delivery-actions">
      {playing && <button type="button" className="btn" disabled={busy} onClick={() => finish(false)}>Atla ve teslim al</button>}
      <button type="button" className="btn primary" disabled={busy} onClick={() => finish(true)}>Köyde gör <ArrowUpRight size={16} /></button>
      {!playing && <button type="button" className="btn" disabled={busy} onClick={() => finish(false)}>Teslim aldım <Check size={16} /></button>}
    </div>
  </Modal>;
}
