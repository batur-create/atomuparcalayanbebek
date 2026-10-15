import React, { useState } from "react";
import { ArrowUpRight, BookOpen, MapPin, MessageCircle, X } from "lucide-react";
import { Modal } from "./Modal.jsx";
import { storage } from "./ui.jsx";
import "./mascot.css";

const lines = [
  "Masayı sen seç. Motivasyon benden.",
  "Bir sayfa daha. Sonra çay konusunda konuşabiliriz.",
  "Ben kitapların üstünde uyuyorum. Sen yöntemi biraz değiştir.",
  "Telefonu ters çevir. Merak etme, ben buradayım.",
];

export function Mascot({ size = 180, say }) {
  return <figure className="murekkep-figure">
    <img src="/murekkep.webp" width={size} height={size} alt="Mor atkılı, gözlüklü kütüphane kedisi Mürekkep" loading="lazy" decoding="async" />
    {say && <figcaption>{say}</figcaption>}
  </figure>;
}

export function MascotCard({ navigate }) {
  const [small, setSmall] = useState(() => storage.get("kutup.murekkep.small") === "yes");
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState(0);
  const collapse = (value) => {
    setSmall(value);
    storage.set("kutup.murekkep.small", value ? "yes" : "no");
  };
  return <>
    {small ? <button className="murekkep-peek" onClick={() => collapse(false)}>
      <img src="/murekkep.webp" width="48" height="48" alt="" />
      <span>Mürekkep burada.<small>Bir pati molası?</small></span>
      <ArrowUpRight size={17} />
    </button> : <section className="murekkep-card" aria-label="Mürekkep ile tanış">
      <button className="murekkep-hide icon-button" aria-label="Mürekkep kartını küçült" onClick={() => collapse(true)}><X size={16} /></button>
      <div className="murekkep-label"><span /> KÜTÜP’ÜN KADROLU KEDİSİ</div>
      <div className="murekkep-scene">
        <span className="murekkep-orbit" aria-hidden="true" />
        <span className="murekkep-star" aria-hidden="true">✳</span>
        <span className="murekkep-stamp" aria-hidden="true">pati onaylı</span>
        <button className="murekkep-pet" aria-label="Mürekkep’e selam ver" onClick={() => setLine((i) => (i + 1) % lines.length)}>
          <Mascot size={216} />
        </button>
      </div>
      <div className="murekkep-copy">
        <h3>Ben Mürekkep<span>.</span></h3>
        <p aria-live="polite">{lines[line]}</p>
        <button className="murekkep-hello" onClick={() => setOpen(true)}>Tanışalım mı? <ArrowUpRight size={17} /></button>
      </div>
    </section>}
    {open && <Modal title="Masada bir kişilik daha yer var." subtitle="Tamam, bir kedilik. Ben Mürekkep; buranın gönüllü kütüphanecisiyim." close={() => setOpen(false)}>
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
