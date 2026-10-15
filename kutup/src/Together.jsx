// Studying together and making sure messages are seen: who is at the desk
// right now, the tap-to-join banner from an invite, a coffee call that waits
// for an answer, and new board messages that reach you wherever you are.
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "./ui.jsx";
import { chime } from "./Sound.jsx";
import "./together.css";

const minutesLeft = (m, now) => Math.max(1, Math.ceil((m.focusEnd - (m.focusPausedAt || now)) / 60000));

/** Friends focusing right now, their minutes left and the imece they bring. */
export function DeskMates({ me, members, now, dark = false }) {
  const mates = members.filter((m) => m.id !== me?.id && m.focusEnd > now);
  if (!mates.length) return null;
  const focusing = me?.focusEnd > now;
  return (
    <div className={`desk-mates ${dark ? "dark" : ""}`}>
      <span className="desk-avatars">
        {mates.slice(0, 5).map((m) => (
          <Avatar key={m.id} member={m} size="tiny" />
        ))}
      </span>
      <span>
        {mates.length === 1 ? `${mates[0].name} odakta · ${minutesLeft(mates[0], now)} dk` : `${mates.length} arkadaşın odakta`}
        {focusing ? ` · imece +%${Math.min(20, mates.length * 5)}'e kadar` : " · katılırsan imece +%5"}
      </span>
    </div>
  );
}

/** "?join=<id>" from an invite notification: one tap joins that friend's session. */
export function JoinBanner({ friend, me, now, join, close }) {
  if (!friend || !(friend.focusEnd > now + 60000) || me?.focusEnd > now) return null;
  return (
    <div className="join-banner" role="status">
      <Avatar member={friend} size="small" />
      <span>
        <b>{friend.name}</b> {minutesLeft(friend, now)} dk odakta. Aynı anda bitirelim mi?
      </span>
      <button className="btn primary" onClick={join}>
        Katıl
      </button>
      <button className="icon-button" aria-label="Daveti kapat" onClick={close}>
        <X size={16} />
      </button>
    </div>
  );
}

const ANSWERS = ["Geliyorum ☕", "5 dk sonra geliyorum 🙏", "Şimdi olmaz, sonra"];
/** A coffee call addressed to me waits on screen (over everything) until I answer. */
export function CallOverlay({ data, me, reply, seen }) {
  const [dismissed, setDismissed] = useState([]);
  const call = me
    ? [...data.messages]
        .reverse()
        .find(
          (m) =>
            m.kind === "coffee" &&
            m.toMember === me.id &&
            Date.now() - m.created < 15 * 60000 &&
            !dismissed.includes(m.id) &&
            !data.messages.some((r) => r.replyTo === m.id && r.memberId === me.id),
        )
    : null;
  useEffect(() => {
    if (!call) return;
    chime();
    navigator.vibrate?.([200, 100, 200]);
  }, [call?.id]);
  if (!call) return null;
  const from = data.members.find((m) => m.id === call.memberId);
  return (
    <div className="call-overlay" role="alertdialog" aria-label="Kahve çağrısı">
      <div className="call-card">
        <Avatar member={from} size="large" />
        <h3>{from?.name || "Bir arkadaşın"} seni kahveye çağırıyor ☕</h3>
        <p>{call.text}</p>
        <div className="call-actions">
          {ANSWERS.map((t) => (
            <button key={t} className="btn" onClick={() => reply(call, t)}>
              {t}
            </button>
          ))}
        </div>
        <button
          className="text-button"
          onClick={() => {
            seen(call.created);
            setDismissed((d) => [...d, call.id]);
          }}
        >
          Gördüm, birazdan cevaplarım
        </button>
      </div>
    </div>
  );
}

/**
 * New board messages from friends, wherever you are: a banner for a few
 * seconds (tap to open the board), with a soft chime on the focus screen.
 */
export function MessageBanner({ data, me, onBoard, focusScreen, open }) {
  const [shown, setShown] = useState(null);
  const since = useRef(Date.now()),
    hide = useRef(0);
  useEffect(() => {
    const fresh = data.messages.filter((m) => m.kind !== "system" && m.memberId !== me?.id && m.created > since.current && !(m.kind === "coffee" && m.toMember === me?.id));
    if (!fresh.length) return;
    since.current = Math.max(...fresh.map((m) => m.created));
    if (onBoard && !focusScreen) return;
    setShown(fresh.at(-1));
    if (focusScreen) chime();
    clearTimeout(hide.current);
    hide.current = setTimeout(() => setShown(null), 9000);
  }, [data.messages]);
  useEffect(() => () => clearTimeout(hide.current), []);
  if (!shown) return null;
  const from = data.members.find((m) => m.id === shown.memberId);
  return (
    <button
      type="button"
      className="message-banner"
      onClick={() => {
        setShown(null);
        open();
      }}
    >
      <Avatar member={from} size="tiny" />
      <span>
        <b>{from?.name}</b> {shown.kind === "coffee" ? "☕ " : ""}
        {shown.text}
      </span>
    </button>
  );
}

/** Members (other than the author) who have read the board up to this message. */
export function seenBy(data, msg) {
  return data.members.filter((m) => m.id !== msg.memberId && (m.boardSeen || 0) >= msg.created);
}
