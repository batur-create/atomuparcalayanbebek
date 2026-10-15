import React, { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, MapPin, MessageCircle, X } from "lucide-react";
import { Modal } from "./Modal.jsx";
import { storage } from "./ui.jsx";
import "./mascot.css";
import { LiveMascot } from "./LiveMascot.jsx";

const lines = [
  "Masayı sen seç. Motivasyon benden.",
  "Bir sayfa daha. Sonra çay konusunda konuşabiliriz.",
  "Ben kitapların üstünde uyuyorum. Sen yöntemi biraz değiştir.",
  "Telefonu ters çevir. Merak etme, ben buradayım.",
];

export function Mascot({ size = 180, say, pose = "hello" }) {
  return <figure className="murekkep-figure"><LiveMascot size={size} pose={pose} />{say && <figcaption>{say}</figcaption>}</figure>;
}

export function MascotCard({ navigate, focusing = false }) {
  const [small, setSmall] = useState(() => storage.get("kutup.murekkep.small") === "yes");
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState(0);
  const [pose, setPose] = useState(focusing ? "read" : "hello");
  const [message, setMessage] = useState("");
  useEffect(() => { setPose(focusing ? "read" : "hello"); }, [focusing]);
  useEffect(() => {
    if (pose !== "hello" || small || open) return;
    const timer = setTimeout(() => setPose("sleep"), 45000);
    return () => clearTimeout(timer);
  }, [pose, line, small, open]);
  const react = (kind) => {
    if (pose === "sleep") setPose("hello");
    setLine((i) => (i + 1) % lines.length);
    setMessage(kind === "purr" ? "Mırrr… Tam orası. Biraz daha." : kind === "sass" ? "Tamam, tanıştık. Şimdi o kitabı açalım mı?" : "");
  };
  const collapse = (value) => {
    setSmall(value);
    storage.set("kutup.murekkep.small", value ? "yes" : "no");
  };
  return <>
    {small ? <button className="murekkep-peek" onClick={() => collapse(false)}>
      <LiveMascot size={48} pose="sleep" />
      <span>Kara burada.<small>Bir pati molası?</small></span>
      <ArrowUpRight size={17} />
    </button> : <section className="murekkep-card" aria-label="Kara ile tanış">
      <button className="murekkep-hide icon-button" aria-label="Kara kartını küçült" onClick={() => collapse(true)}><X size={16} /></button>
      <div className="murekkep-label"><span /> KÜTÜP’ÜN KADROLU KEDİSİ</div>
      <div className="murekkep-scene">
        <span className="murekkep-orbit" aria-hidden="true" />
        <span className="murekkep-star" aria-hidden="true">✳</span>
        <span className="murekkep-stamp" aria-hidden="true">pati onaylı</span>
        <LiveMascot size={255} pose={pose} interactive onReact={react} />
      </div>
      <p className="murekkep-hint">Dokun, selam versin. Basılı tut, gönlünü al.</p>
      <div className="murekkep-modes" aria-label="Kara’nın hâli">
        {[["hello", "Selam"], ["read", "Kitap"], ["sleep", "Şekerleme"]].map(([id, label]) => <button key={id} aria-pressed={pose === id} onClick={() => { setPose(id); setMessage(""); }}>{label}</button>)}
      </div>
      <div className="murekkep-copy">
        <h3>Ben Kara<span>.</span></h3>
        <p aria-live="polite">{message || (pose === "sleep" ? "Ben sadece gözlerimi dinlendiriyorum…" : pose === "read" ? "Sen kendi sayfana bak. Ben de benimkine." : lines[line])}</p>
        <button className="murekkep-hello" onClick={() => setOpen(true)}>Tanışalım mı? <ArrowUpRight size={17} /></button>
      </div>
    </section>}
    {open && <Modal title="Masada bir kişilik daha yer var." subtitle="Tamam, bir kedilik. Ben Kara; buranın gönüllü kütüphanecisiyim." close={() => setOpen(false)}>
      <div className="murekkep-intro">
        <Mascot size={160} />
        <div className="murekkep-tips">
          <p><MapPin size={19} /><span><strong>“Kütüpte kim var?” devri bitti.</strong>Gelince yerini işaretle, ekibin seni bulsun.</span></p>
          <p><BookOpen size={19} /><span><strong>Biraz odak, biraz bizim köy.</strong>Bir odak seansı başlat; emeğin köyde yerini alsın.</span></p>
          <p><MessageCircle size={19} /><span><strong>Burası biraz da senin.</strong>Fikirlerini Batur’a iletiler bölümüne bırak.</span></p>
        </div>
      </div>
      <button className="btn primary murekkep-start" onClick={() => { setOpen(false); navigate("focus"); }}>Hadi, masaya <ArrowUpRight size={17} /></button>
    </Modal>}
  </>;
}
