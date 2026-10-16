// The "Ben" tab (n17): everything about me in one place, so nothing hides behind
// a menu. Profile, look and stats; inviting a friend and writing to Batur; account.
import React, { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { ChartColumn, ChevronRight, KeyRound, LogOut, Palette, Send, UserRound, UserRoundPlus } from "lucide-react";
import { Avatar } from "./ui.jsx";
import { MemberStats } from "./Stats.jsx";

function Row({ icon: Icon, title, sub, onClick, href, danger, count, open }) {
  const Tag = href ? m.a : m.button;
  return (
    <Tag whileTap={{ scale: 0.98 }} className={`home-door ${danger ? "danger" : ""}`} onClick={onClick} href={href} aria-expanded={open}>
      <i className="door-icon">
        <Icon size={18} />
        {count > 0 && <b className="me-count" aria-label={`${count} yeni gelişme`} />}
      </i>
      <span>
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
      <ChevronRight size={17} style={open ? { rotate: "90deg" } : undefined} />
    </Tag>
  );
}

export function MePage({ me, requests, setModal, navigate, leave }) {
  const [stats, setStats] = useState(false);
  if (!me) return null;
  return (
    <div className="me-page">
      <m.button whileTap={{ scale: 0.98 }} className="me-card" onClick={() => setModal("profile")}>
        <Avatar member={me} />
        <span>
          <b>{me.name}</b>
          <small>{me.note || "Profilini, rengini ve hesabını buradan yönet."}</small>
        </span>
      </m.button>
      <div className="me-label">SEN</div>
      <div className="me-rows">
        <Row icon={UserRound} title="Profilim" sub="Ad, karakter, renk, masa notu" onClick={() => setModal("profile")} />
        <Row icon={Palette} title="Görünüm" sub="Tema rengi · gündüz / gece" onClick={() => setModal("look")} />
        <Row icon={ChartColumn} title="İstatistiklerim" sub="Odak saati, seri, binalar" open={stats} onClick={() => setStats(!stats)} />
        <AnimatePresence initial={false}>
          {stats && (
            <m.div className="me-stats" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div>
                <MemberStats memberId={me.id} />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
      <div className="me-label">EKİP</div>
      <div className="me-rows">
        <Row icon={UserRoundPlus} title="Arkadaşını ekibe ekle" sub="Davet bağlantısını paylaş" onClick={() => setModal("invite")} />
        <Row icon={Send} title="Batur’a ilet" sub={requests ? `${requests} yeni gelişme var` : "Fikir, hata ya da iki çift laf"} count={requests} onClick={() => navigate("feedback")} />
      </div>
      <div className="me-label">HESAP</div>
      <div className="me-rows">
        <Row icon={KeyRound} title="Hesap ve cihazlar" sub="Kullanıcı adı, şifre, başka cihazda aç" onClick={() => setModal("account")} />
        {me.badge === "dev" && <Row icon={({ size }) => <span style={{ fontSize: size }}>✳</span>} title="Komuta merkezi" sub="Batur’un paneli" href="/batur" />}
        <Row icon={LogOut} title="Ekipten ayrıl" sub="Profilin, binaların ve mesajların silinir" danger onClick={leave} />
      </div>
    </div>
  );
}
