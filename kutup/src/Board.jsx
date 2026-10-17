// Pano: the team board with notes, replies, hearts and who has seen them.
// Split out of App.jsx (n29).
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, m as M } from "motion/react";
import { ArrowUpRight, Heart, Reply, Users, X } from "lucide-react";
import { shortTime } from "./api.js";
import { Avatar, Busy, Empty } from "./ui.jsx";
import { seenBy } from "./Together.jsx";
import { EmptyState } from "./Illustrations.jsx";
import { FaceButton } from "./Home.jsx";

export function Board({ data, me, requireMember, mutate, compact, openTeam, openMember, openPlans }) {
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    // Any message can be answered (n18): the reply quotes it and pings its author.
    [replyTo, setReplyTo] = useState(null),
    // A double tap on a message leaves a heart, with a big heart popping on it.
    [burst, setBurst] = useState(null);
  const form = useRef(null),
    list = useRef(null),
    input = useRef(null),
    count = useRef(0),
    lastTap = useRef({ id: null, at: 0 });
  const answer = (msg) =>
    requireMember(() => {
      setReplyTo(msg);
      requestAnimationFrame(() => input.current?.focus());
    });
  const heart = (msg) =>
    requireMember(() => {
      setBurst({ id: msg.id, at: Date.now() });
      if (!msg.reactions.includes(me?.id)) mutate(`/messages/${msg.id}/react`, {});
    });
  const tap = (e, msg) => {
    if (e.pointerType === "mouse" || e.target.closest("button, a")) return;
    const t = Date.now(),
      last = lastTap.current;
    lastTap.current = { id: msg.id, at: t };
    if (last.id === msg.id && t - last.at < 380) heart(msg);
  };
  // The board opens at its newest message, and follows new ones while you are near the end.
  useEffect(() => {
    if (compact) return;
    // The messages scroll in their own box: its end is the newest message.
    const box = list.current;
    const near = !box || box.scrollHeight - box.scrollTop - box.clientHeight < 220;
    const toEnd = (behavior) => {
      if (list.current) list.current.scrollTo({ top: list.current.scrollHeight, behavior });
      form.current?.scrollIntoView({ block: "center", behavior });
    };
    if (count.current === 0) {
      // The page is still filling in when the board opens: land on the end, and stay there.
      const timers = [0, 250, 700, 1500].map((ms) => setTimeout(() => toEnd("auto"), ms));
      count.current = data.messages.length || -1;
      return () => timers.forEach(clearTimeout);
    }
    if (near) requestAnimationFrame(() => toEnd("smooth"));
    count.current = data.messages.length;
  }, [data.messages.length]);
  const lastSix = new Set(data.messages.filter((m) => m.kind !== "system").slice(-6).map((m) => m.id));
  const messages = compact
    ? data.messages.filter((m) => m.kind !== "system").slice(-3)
    : data.messages;
  const send = async (e) => {
    e.preventDefault();
    requireMember(async () => {
      if (!text.trim()) return;
      setBusy(true);
      if (await mutate("/messages", replyTo ? { text, replyTo: replyTo.id } : { text })) {
        setText("");
        setReplyTo(null);
      }
      setBusy(false);
    });
  };
  return (
    <section className={`panel board ${compact ? "compact-board" : ""}`}>
      <div className="section-heading">
        <h2>
          Bizim pano{" "}
          <button type="button" className="scribble" aria-label="Panoya yaz" onClick={() => requireMember(() => input.current?.focus())}>
            ✎
          </button>
        </h2>
        <button type="button" className="private-label" onClick={openTeam}>
          <Users size={13} /> Sadece bizim ekip
        </button>
      </div>
      <div className="messages" ref={list}>
        <AnimatePresence initial={false}>
        {messages.map((msg) => {
          const m = data.members.find((x) => x.id === msg.memberId);
          const mine = msg.memberId === me?.id,
            hearted = msg.reactions.includes(me?.id);
          // A line from the board's own voice goes where it points: a new plan
          // to the plans, anything else to the card of the person it is about.
          const planLine = /plan/i.test(msg.text);
          return msg.kind === "system" ? (
            <M.button
              type="button"
              key={msg.id}
              className="system-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              disabled={!planLine && !m}
              onClick={() => (planLine ? openPlans?.() : m && openMember?.(m))}
            >
              <span>✦</span>
              <p>
                <strong>{m?.name}</strong> {msg.text}
              </p>
              <time>{shortTime(msg.created)}</time>
            </M.button>
          ) : (
            <M.article
              key={msg.id}
              className={`message ${m?.color || "lilac"} ${mine ? "mine" : ""} ${msg.kind === "coffee" ? "coffee-message" : ""}`}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              onPointerUp={(e) => tap(e, msg)}
              onDoubleClick={(e) => !e.target.closest("button, a") && heart(msg)}
            >
              {m ? <FaceButton member={m} size="small" onOpen={openMember} /> : <Avatar member={m} size="small" />}
              <div className="bubble">
                <div className="message-meta">
                  <strong>{m?.name}</strong>
                  {m?.badge === "dev" && <span className="dev-mark" title="Geliştirici">✦</span>}
                  <time>{shortTime(msg.created)}</time>
                  {msg.kind === "coffee" && <span>{msg.toMember ? `kahve çağrısı → ${data.members.find((x) => x.id === msg.toMember)?.name || "?"} ☕` : "mola daveti ☕"}</span>}
                </div>
                {msg.replyTo &&
                  (() => {
                    const original = data.messages.find((x) => x.id === msg.replyTo);
                    return original ? (
                      <div className="reply-quote">
                        ↪ {data.members.find((x) => x.id === original.memberId)?.name}: {original.text.slice(0, 60)}
                      </div>
                    ) : null;
                  })()}
                <p>{msg.text}</p>
                {!compact &&
                  lastSix.has(msg.id) &&
                  (() => {
                    const seen = seenBy(data, msg);
                    return seen.length ? <div className="seen-by">👀 {seen.length >= data.members.length - 1 ? "herkes gördü" : `${seen.map((x) => x.name).join(", ")} gördü`}</div> : null;
                  })()}
                <div className="message-actions">
                  <M.button
                    whileTap={{ scale: 0.85 }}
                    className={`reaction ${hearted ? "reacted" : ""}`}
                    aria-label={`${m?.name} mesajına kalp ${hearted ? "kaldır" : "bırak"}`}
                    onClick={() => requireMember(() => mutate(`/messages/${msg.id}/react`, {}))}
                  >
                    <Heart size={12} fill={hearted ? "currentColor" : "none"} />
                    {msg.reactions.length || "İlk kalp"}
                  </M.button>
                  {!compact && (
                    <M.button whileTap={{ scale: 0.9 }} className="reply-button" aria-label={`${m?.name} mesajına cevap ver`} onClick={() => answer(msg)}>
                      <Reply size={12} /> Yanıtla
                    </M.button>
                  )}
                </div>
                <AnimatePresence>
                  {burst?.id === msg.id && (
                    <M.span
                      key={burst.at}
                      className="heart-burst"
                      aria-hidden="true"
                      initial={{ scale: 0.2, opacity: 0 }}
                      animate={{ scale: [0.2, 1.35, 1], opacity: [0, 1, 1] }}
                      exit={{ scale: 1.6, opacity: 0, transition: { duration: 0.3 } }}
                      transition={{ duration: 0.45 }}
                      onAnimationComplete={() => setTimeout(() => setBurst((x) => (x?.at === burst.at ? null : x)), 250)}
                    >
                      ♥
                    </M.span>
                  )}
                </AnimatePresence>
              </div>
            </M.article>
          );
        })}
        </AnimatePresence>
        {!compact && !messages.some((x) => x.kind !== "system") && (
          <EmptyState art="board" title="Pano ilk notunu bekliyor.">
            Bir “selam” güzel bir başlangıç. Kahve çağrısı da buraya düşer.
          </EmptyState>
        )}
        {compact && !messages.length && (
          <Empty emoji="💌" title="Pano ilk notunu bekliyor.">
            Bir “selam” güzel bir başlangıç.
          </Empty>
        )}
      </div>
      <AnimatePresence>
        {replyTo && (
          <M.div className="reply-chip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <span>
              <Reply size={13} /> <b>{data.members.find((x) => x.id === replyTo.memberId)?.name || "Biri"}</b> · {replyTo.text.slice(0, 70)}
            </span>
            <button type="button" aria-label="Cevabı bırak" onClick={() => setReplyTo(null)}>
              <X size={14} />
            </button>
          </M.div>
        )}
      </AnimatePresence>
      <form className="message-form" onSubmit={send} ref={form}>
        <Avatar member={me} size="tiny" />
        <input
          ref={input}
          aria-label="Panoya mesaj"
          placeholder={
            replyTo
              ? "Cevabını yaz…"
              : me
                ? "Ekibe küçük bir not bırak…"
                : "Kendi ekibinle muhabbete başla…"
          }
          value={text}
          maxLength={280}
          onChange={(e) => setText(e.target.value)}
        />
        <Busy
          loading={busy}
          className="send-button"
          aria-label="Mesajı gönder"
          type="submit"
        >
          <ArrowUpRight size={19} />
        </Busy>
      </form>
    </section>
  );
}
