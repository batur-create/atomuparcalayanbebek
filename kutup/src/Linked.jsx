// n50 "Bağlı hesaplar": one person, several accounts (one per team) on this
// device. A session started here can start in the others too, each with its
// own building and bricks; the server keeps them one session from then on
// (server/app.js, followLinked). This file is the picker before the start,
// the start of the others, and the one panel that follows them all.
// Batur's only for now: the list comes from his panel (/owner/linked).
import React, { useEffect, useState } from "react";
import { api, get } from "./api.js";
import { Avatar, storage } from "./ui.jsx";
import { CATALOG, classFor, fits, modelOf, stateOf } from "../shared/catalog.js";
import { kindFor } from "../shared/village.js";
import { ownerPlaceIn } from "./koy2/browserPlan.js";
import { deviceId } from "./device.js";

const KEY = "kutup-linked";
const OFF = "off";
// The last answer, shared by the picker, the panel and the account switcher.
let cached = null;
export const linkedAccounts = () => cached?.accounts || [];

/** This device's accounts and their sessions; null while unknown or not Batur's. */
export function useLinked(me, now) {
  const [list, setList] = useState(cached);
  const running = me?.focusEnd > now;
  const linked = running && !!me?.focusLink;
  const load = () =>
    get("/owner/linked")
      .then((d) => {
        cached = d;
        setList(d);
      })
      .catch((e) => {
        if (e.status === 401 || e.status === 403) {
          cached = { accounts: [], closed: true };
          setList(cached);
        }
      });
  useEffect(() => {
    if (!me?.id || cached?.closed) return;
    load();
  }, [me?.id, me?.focusEnd, me?.focusLink, me?.focusCrackedAt, me?.focusPausedAt, me?.focusRescued]);
  // While the link runs, a slow look at the others now and then.
  useEffect(() => {
    if (!linked) return;
    const timer = setInterval(() => document.visibilityState === "visible" && load(), 60000);
    return () => clearInterval(timer);
  }, [linked]);
  return { list: list?.closed ? null : list, reload: load };
}

// The buildings an account could build in a session of `minutes`: the same
// size class, open to it, paid from its own bricks.
function buildable(account, minutes, now) {
  const size = classFor(minutes);
  return CATALOG.filter(
    (item) =>
      item.id !== "anitkabir" &&
      item.class === size &&
      fits(item, minutes) &&
      item.cost <= (account.bricks || 0) &&
      ["open", "new"].includes(stateOf(item, now, account.plans || [], account.badge === "dev")),
  );
}
const saved = () => {
  try {
    return JSON.parse(storage.get(KEY) || "{}") || {};
  } catch {
    return {};
  }
};

/**
 * The other accounts' choices for the next start: { [memberId]: model id,
 * "" (focus without a building) or "off" }. Remembered on this device.
 */
export function useLinkChoice() {
  const [choice, setChoice] = useState(saved);
  const set = (id, value) =>
    setChoice((old) => {
      const next = { ...old, [id]: value };
      storage.set(KEY, JSON.stringify(next));
      return next;
    });
  return [choice, set];
}

/** Who joins, and with what, given the leader's mode and the remembered choices. */
export function linkPlan(list, me, choice, { build, model, minutes, now }) {
  if (!list?.accounts) return [];
  const myTeam = list.accounts.find((a) => a.current)?.groupId;
  return list.accounts
    .filter((a) => !a.current)
    .map((account) => {
      const options = build ? buildable(account, minutes, now) : [];
      const wanted = choice[account.id];
      const busy = account.focusEnd > now;
      const sameTeam = account.groupId === myTeam;
      let pick = wanted === OFF ? OFF : build ? (options.some((o) => o.id === wanted) ? wanted : wanted === "" ? "" : null) : "";
      // Nothing remembered: the same building if it can, else the plain one of
      // that size, else focus without a building.
      if (pick === null) pick = options.find((o) => o.id === model)?.id ?? options.find((o) => o.cost === 0)?.id ?? "";
      return { account, options, pick: busy || sameTeam ? OFF : pick, busy, sameTeam };
    });
}

/** The picker under the start button: one row per other account. */
export function LinkedPicker({ rows, build, minutes, onChange }) {
  if (!rows.length) return null;
  const joining = rows.filter((r) => r.pick !== OFF).length;
  return (
    <div className="linked-picker">
      <p className="linked-title">
        🔗 Diğer hesaplarım da çalışsın <small>{joining ? `${joining} hesap katılacak · aynı anda biter` : "kimse katılmıyor"}</small>
      </p>
      {rows.map(({ account, options, pick, busy, sameTeam }) => (
        <label key={account.id} className={`linked-row ${pick === OFF ? "off" : ""}`}>
          <i className="linked-face"><Avatar member={account} size="small" /></i>
          <span>
            <strong>{account.name}</strong>
            <small>
              {account.team} · 🧱 {account.bricks || 0}
            </small>
          </span>
          {busy || sameTeam ? (
            <em>{busy ? "şu an seansta" : "bu ekiple aynı"}</em>
          ) : (
            <select value={pick} onChange={(e) => onChange(account.id, e.target.value)} aria-label={`${account.name} hesabı`}>
              <option value={OFF}>Katılmasın</option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.emoji} {item.name} · {item.cost ? `${item.cost} 🧱` : "bedava"}
                </option>
              ))}
              <option value="">🎧 Binasız odak{build ? "" : ` · ${minutes} dk`}</option>
            </select>
          )}
        </label>
      ))}
      {build && rows.some((r) => r.pick === "" && !r.busy && !r.sameTeam) && <p className="linked-note">Binasız katılan hesap, uygulamada görülen dakikaları yazar.</p>}
    </div>
  );
}

const requestKey = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => (b % 36).toString(36)).join("");

/** Starts the chosen accounts beside the session just begun here; returns a line to show. */
export async function startLinked(rows) {
  const joining = rows.filter((r) => r.pick !== OFF);
  if (!joining.length) return "";
  const done = [],
    failed = [];
  for (const { account, pick } of joining) {
    try {
      // A planned (v2) village: this browser finds the plot, the server checks it.
      const village = pick && account.v2 ? await ownerPlaceIn(get, account.groupId, { subject: { type: "site", id: "new" }, model: pick, owner: account.id, created: Date.now() }) : null;
      await api("/owner/linked/start", { memberId: account.id, deviceId: deviceId(), requestKey: requestKey(), ...(pick ? { model: pick } : {}), ...(village ? { village } : {}) });
      done.push(account.name);
    } catch (e) {
      failed.push(`${account.name}: ${e.message}`);
    }
  }
  return [done.length ? `🔗 ${done.join(", ")} de başladı.` : "", failed.length ? `Başlamayanlar: ${failed.join(" · ")}` : ""].filter(Boolean).join(" ");
}

/** The other accounts of the running link (the open one is the card itself). */
export const linkMembers = (list, me, now) =>
  me?.focusLink && list?.accounts ? list.accounts.filter((a) => !a.current && a.focusLink === me.focusLink && a.focusEnd > 0) : [];

/** The one panel: every account of the link, its building and how far it is. */
export function LinkedSites({ list, me, now }) {
  const others = linkMembers(list, me, now);
  if (!others.length) return null;
  const mine = list.accounts.find((a) => a.current);
  const rows = [mine && { ...mine, ...me, name: mine.name, team: mine.team }, ...others].filter(Boolean);
  return (
    <div className="linked-sites" aria-label="Bağlı şantiyeler">
      <p className="linked-title">
        🔗 Bağlı şantiyeler <small>{rows.length} hesap · tek seans</small>
      </p>
      {rows.map((a) => {
        const item = a.focusStrict ? modelOf(a.focusModel, kindFor(a.focusMinutes)) : null;
        const pausedAt = a.focusPausedAt || 0;
        const left = Math.max(0, a.focusEnd - (pausedAt || now));
        const progress = a.focusMinutes ? Math.min(1, Math.max(0, 1 - left / (a.focusMinutes * 60000))) : 0;
        const state = a.focusCrackedAt > 0 ? "🩹 çatladı" : pausedAt ? "☕ molada" : left <= 0 ? "✓ bitti" : item ? "yükseliyor" : "odakta";
        return (
          <div key={a.id} className={`linked-site ${a.focusCrackedAt > 0 ? "cracked" : ""}`}>
            <i className="linked-face"><Avatar member={a} size="small" /></i>
            <span>
              <strong>
                {item ? `${item.emoji} ${item.name}` : "🎧 Odak"} <small>· {a.name}</small>
              </strong>
              <i className="linked-bar" aria-hidden="true">
                <b style={{ width: `${Math.round(progress * 100)}%` }} />
              </i>
              <small>
                {a.team} · {state} · %{Math.round(progress * 100)}
              </small>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** How the other accounts of a link that just ended came out, in one line. */
export function linkedOutcome(list, end) {
  const runs = (list?.accounts || []).filter((a) => !a.current && a.last && Math.abs(a.last.ends - end) < 20 * 60000);
  if (!runs.length) return "";
  const word = (r) => (r.status === "completed" ? "✓" : r.status === "running" ? "…" : r.status === "failed" ? "🧱" : "✗");
  return `🔗 ${runs.map((a) => `${a.name} ${a.last.model ? modelOf(a.last.model).emoji : "🎧"} ${word(a.last)}`).join(" · ")}`;
}
