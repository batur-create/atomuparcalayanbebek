// n25 "Hesaplarım": the accounts signed in on this device, Instagram style.
// One account is one team; a tap on another opens it. The session tokens stay
// in HttpOnly cookies: this list only carries names, faces and teams.
import React, { useEffect, useState } from "react";
import { m } from "motion/react";
import { ArrowLeftRight, Check, ChevronRight, DoorOpen, Plus } from "lucide-react";
import { get } from "./api.js";
import { Avatar } from "./ui.jsx";
import { Modal } from "./Modal.jsx";

// The last list, so the Ben page does not jump each time it opens.
let cached = null;
export function useAccounts(memberId) {
  const [list, setList] = useState(() => (cached?.memberId === memberId ? cached.list : null));
  useEffect(() => {
    let gone = false;
    get("/accounts")
      .then((d) => {
        cached = { memberId, list: d };
        if (!gone) setList(d);
      })
      .catch(() => {});
    return () => {
      gone = true;
    };
  }, [memberId]);
  return list;
}

function AccountRow({ account, onClick }) {
  return (
    <m.button
      whileTap={{ scale: 0.98 }}
      type="button"
      className={`home-door account-row ${account.current ? "current" : ""}`}
      onClick={onClick}
      aria-label={account.current ? `${account.name}, ${account.team}: şu an açık, profili aç` : `${account.name}, ${account.team} hesabına geç`}
    >
      <i className="account-face">
        <Avatar member={account} size="small" />
        {account.current && (
          <b className="account-on" aria-hidden="true">
            <Check size={11} strokeWidth={3} />
          </b>
        )}
      </i>
      <span>
        <strong>{account.name}</strong>
        <small>{account.current ? `${account.team} · şu an açık` : account.team}</small>
      </span>
      {account.current ? <ChevronRight size={17} /> : <ArrowLeftRight size={17} className="account-swap" />}
    </m.button>
  );
}

// The list itself: this account (a tap opens its profile), the others (a tap
// switches), adding one, and signing this device out of the open one.
export function AccountList({ list, onSwitch, onProfile, onAdd, onSignOut }) {
  const accounts = list?.accounts || [];
  const full = accounts.length >= (list?.max || 5);
  return (
    <div className="me-rows account-list">
      {accounts.map((a) => (
        <AccountRow key={a.id} account={a} onClick={() => (a.current ? onProfile() : onSwitch(a))} />
      ))}
      <m.button whileTap={{ scale: 0.98 }} type="button" className="home-door" onClick={() => onAdd(full)}>
        <i className="door-icon">
          <Plus size={18} />
        </i>
        <span>
          <strong>Hesap ekle</strong>
          <small>{full ? `Bu cihazda en fazla ${list.max} hesap olur` : "Başka ekipteki hesabınla gir"}</small>
        </span>
        <ChevronRight size={17} />
      </m.button>
      {onSignOut && (
        <m.button whileTap={{ scale: 0.98 }} type="button" className="home-door" onClick={onSignOut}>
          <i className="door-icon">
            <DoorOpen size={18} />
          </i>
          <span>
            <strong>Bu cihazda çıkış yap</strong>
            <small>{accounts.length > 1 ? "Profilin kalır; diğer hesabın açılır" : "Profilin kalır; şifrenle geri girersin"}</small>
          </span>
          <ChevronRight size={17} />
        </m.button>
      )}
    </div>
  );
}

// Desktop: the same switcher from the side bar's profile row.
export function AccountsModal({ memberId, close, openMe, ...actions }) {
  const list = useAccounts(memberId);
  return (
    <Modal title="Hesaplarım" subtitle="Her hesap kendi ekibinde. Dokun, o ekibe geç." close={close}>
      <AccountList list={list} {...actions} />
      <button type="button" className="btn outline full account-me" onClick={openMe}>
        Ben sayfasını aç
      </button>
    </Modal>
  );
}
