// The "Ben" tab (n17): everything about me in one place, so nothing hides behind
// a menu. Profile, look and stats; inviting a friend and writing to Batur; account.
import React, { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { ChartColumn, ChevronRight, DoorOpen, KeyRound, LogOut, Palette, Plus, Send, UserRound, UserRoundPlus, Users } from "lucide-react";
import { Avatar } from "./ui.jsx";
import { MemberStats } from "./later.jsx";
import { Modal } from "./Modal.jsx";
import { minutesLabel } from "./api.js";
import { Badge, Reveal } from "./Home.jsx";
import { AccountList, useAccounts } from "./Accounts.jsx";

const hours = (min) => (min >= 60 ? `${Math.round((min / 60) * 10) / 10} sa` : `${min} dk`);

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

export function MePage({ me, group, size, requests, setModal, navigate, leave, accounts: actions }) {
  const [stats, setStats] = useState(false);
  // n25: with more than one account on this device, they come first.
  const accounts = useAccounts(me?.id);
  const several = accounts?.accounts.length > 1;
  if (!me) return null;
  return (
    <div className="me-page">
      <div className={`me-card ${me.color}`}>
        <m.button whileTap={{ scale: 0.98 }} type="button" className="me-card-main" onClick={() => setModal("profile")}>
          <Avatar member={me} />
          <span>
            <b>{me.name}</b>
            <small>{me.note || "Profilini, rengini ve hesabını buradan yönet."}</small>
          </span>
        </m.button>
        <m.button
          whileTap={{ scale: 0.98 }}
          type="button"
          className="me-stats-row"
          aria-label="İstatistiklerim"
          aria-expanded={stats}
          onClick={() => {
            setStats(true);
            setTimeout(() => document.querySelector(".me-stats")?.scrollIntoView({ behavior: "smooth", block: "center" }), 380);
          }}
        >
          <span className="me-stat">
            <b>{hours(me.focusToday || 0)}</b>
            <small>bugün odak</small>
          </span>
          <span className="me-stat">
            <b>{hours(me.focusWeek || 0)}</b>
            <small>bu hafta</small>
          </span>
          <span className="me-stat">
            <b>{me.buildings || 0}</b>
            <small>bina</small>
          </span>
        </m.button>
      </div>
      {several && (
        <>
          <div className="me-label">HESAPLARIM</div>
          <Reveal>
            <AccountList list={accounts} onProfile={() => setModal("profile")} onSwitch={actions.onSwitch} onAdd={actions.onAdd} />
          </Reveal>
        </>
      )}
      <div className="me-label">SEN</div>
      <Reveal className="me-rows">
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
      </Reveal>
      <div className="me-label">EKİP</div>
      <Reveal className="me-rows" delay={0.05}>
        <Row icon={Users} title={group?.name || "Ekibimiz"} sub={`${size} kişi · kim nerede, haftanın odağı`} onClick={() => setModal("team")} />
        <Row icon={UserRoundPlus} title="Arkadaşını ekibe ekle" sub="Davet bağlantısını paylaş" onClick={() => setModal("invite")} />
        <Row icon={Send} title="Batur’a ilet" sub={requests ? `${requests} yeni gelişme var` : "Fikir, hata ya da iki çift laf"} count={requests} onClick={() => navigate("feedback")} />
      </Reveal>
      <div className="me-label">HESAP</div>
      <Reveal className="me-rows" delay={0.1}>
        <Row icon={KeyRound} title="Hesap ve cihazlar" sub="Kullanıcı adı, şifre, başka cihazda aç" onClick={() => setModal("account")} />
        {accounts && !several && <Row icon={Plus} title="Hesap ekle" sub="Başka ekibin mi var? O hesapla da gir" onClick={() => actions.onAdd(false)} />}
        <Row icon={DoorOpen} title="Bu cihazda çıkış yap" sub={several ? "Profilin kalır; diğer hesabın açılır" : "Profilin kalır; şifrenle geri girersin"} onClick={actions.onSignOut} />
        {me.badge === "dev" && <Row icon={({ size }) => <span style={{ fontSize: size }}>✳</span>} title="Komuta merkezi" sub="Batur’un paneli" href="/batur" />}
        <Row icon={LogOut} title="Ekipten ayrıl" sub="Profilin, binaların ve mesajların silinir" danger onClick={leave} />
      </Reveal>
    </div>
  );
}

// The team card (side bar → team name): the full name, who is where, the week
// together, and a way to bring a friend in.
const RANK = { here: 0, break: 0, coming: 1 };
export function TeamModal({ data, me, now, close, invite, openMember }) {
  const members = [...data.members].sort((a, b) => (RANK[a.status] ?? 2) - (RANK[b.status] ?? 2));
  const total = data.members.reduce((t, x) => t + (x.focusWeek || 0), 0),
    goal = data.week?.goal || 600,
    here = data.members.filter((x) => x.status === "here" || x.status === "break").length;
  const line = (x) =>
    x.focusEnd > now
      ? `odakta · ${Math.max(1, Math.ceil((x.focusEnd - now) / 60000))} dk kaldı`
      : x.status === "coming"
        ? `yolda · ${x.arrival || "birazdan"}`
        : x.status === "here" || x.status === "break"
          ? `${x.location || "Milli Kütüphane"}${x.since ? ` · ${minutesLabel(Math.max(1, Math.floor((now - x.since) / 60000)))}` : ""}`
          : `bu hafta ${hours(x.focusWeek || 0)} odak`;
  return (
    <Modal title={data.group.name} subtitle={`${data.members.length} kişilik ekip · şu an ${here} kişi kütüpte`} close={close}>
      <div className="team-week">
        <span>
          Bu hafta ekipçe <b>{hours(total)}</b> odak · anıt %{Math.min(100, Math.round((total / goal) * 100))}
        </span>
        <span className="tile-bar">
          <i style={{ width: `${Math.min(100, (total / goal) * 100)}%` }} />
        </span>
      </div>
      <ul className="team-list">
        {members.map((x, i) => (
          <m.li key={x.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24, delay: Math.min(i, 8) * 0.04 }}>
            <button type="button" className="team-row" onClick={() => openMember(x)}>
            <Avatar member={x} size="small" />
            <span>
              <strong>
                {x.name}
                {x.id === me?.id ? " (sen)" : ""}
                {x.crown ? " 👑" : ""}
              </strong>
              <small>{line(x)}</small>
            </span>
            <Badge status={x.status} />
            </button>
          </m.li>
        ))}
      </ul>
      <button type="button" className="btn primary full" onClick={invite}>
        <UserRoundPlus size={17} /> Arkadaşını ekibe ekle
      </button>
    </Modal>
  );
}
