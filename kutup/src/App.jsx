import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Coffee,
  Copy,
  DoorOpen,
  Flame,
  Headphones,
  Heart,
  House,
  KeyRound,
  LayoutGrid,
  LoaderCircle,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Play,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Square,
  Trash2,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  api,
  get,
  THEMES,
  STATUS,
  shortTime,
  dayInput,
  dayWord,
  sinceLabel,
  minutesLabel,
} from "./api.js";
import {
  Avatar,
  Busy,
  Empty,
  pushKey,
  keepScreenOn,
  pushSupported,
  reducedMotion,
  releaseScreen,
  storage,
  isIOS,
  standalone,
} from "./ui.jsx";
import { FeedbackPage, useRequestUpdates } from "./Requests.jsx";
import { OwnerPage } from "./Owner.jsx";
import { openBlackHole } from "./BlackHole.jsx";
import { KINDS, kindFor } from "./Village.jsx";
import { VillageNow, VillagePanel, useVillage } from "./VillageMap.jsx";
import { Modal } from "./Modal.jsx";
import { Welcome, Onboard, ProfileModal } from "./Account.jsx";
import { mergeState } from "./sync.js";

const nav = [
  { id: "home", label: "Kütüphanem", short: "Kütüp", icon: LayoutGrid },
  { id: "plans", label: "Planlar", short: "Planlar", icon: CalendarDays },
  { id: "focus", label: "Kütüp köyü", short: "Köy", icon: House },
  { id: "board", label: "Bizim pano", short: "Pano", icon: MessageCircle },
];
const TABS = ["home", "plans", "focus", "board", "feedback"];
const startParams = new URLSearchParams(location.search);
let introPlayed = false;
// Nothing is shown before signing in: no sample people, no sample village.
const EMPTY = { group: { name: "", invite: "", rev: 0 }, members: [], messages: [], plans: [] };
// Browser push steps (service worker start-up, subscribing) can hang without
// ever failing; give each a deadline so the bell always answers.
const within = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { name: "TimeoutError" })), ms)),
  ]);
const sameKey = (buffer, key) => {
  if (!buffer) return true;
  const bytes = new Uint8Array(buffer);
  return bytes.length === key.length && bytes.every((b, i) => b === key[i]);
};
function Icon({ name: Component, ...props }) {
  return <Component size={19} strokeWidth={1.8} {...props} />;
}
function Badge({ status }) {
  return (
    <span className={`status ${status}`}>
      <i />
      {STATUS[status]?.[0] || status}
    </span>
  );
}
function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 300 235">
        <ellipse
          cx="165"
          cy="209"
          rx="115"
          ry="10"
          fill="#c9c3ed"
          opacity=".5"
        />
        <g className="art-book-a">
          <g transform="rotate(-9 146 170)">
            <rect x="66" y="165" width="155" height="31" rx="5" fill="#6d5bd3" />
            <path d="M75 170h139v19H75z" fill="#fffbed" />
            <path d="M85 175h125M85 181h125" stroke="#ddd6bf" strokeWidth="2" />
            <path d="M72 166v29" stroke="#483b91" strokeWidth="6" />
          </g>
        </g>
        <g className="art-book-b">
          <g transform="rotate(6 150 152)">
            <rect x="80" y="135" width="160" height="27" rx="4" fill="#f48259" />
            <path d="M88 141h146v14H88z" fill="#fff9e9" />
            <path d="M100 147h127" stroke="#e3ddc4" strokeWidth="2" />
            <path d="M87 136v24" stroke="#d46743" strokeWidth="5" />
          </g>
        </g>
        <g className="art-open">
          <path
            d="M90 63q37-10 71 10v76q-39-18-71-9z"
            fill="#fffdf4"
            stroke="#b7afd7"
            strokeWidth="1.5"
          />
          <path
            d="M161 73q33-20 70-11v77q-37-7-70 10z"
            fill="#f9f6e9"
            stroke="#b7afd7"
            strokeWidth="1.5"
          />
          <path d="M161 74v74" stroke="#ded8c7" strokeWidth="3" />
          <path
            className="art-lines"
            d="M103 78q19-3 43 7m-43 6q19-3 43 7m-43 6q19-3 32 3m43-20q20-9 39-9m-39 23q20-9 39-9m-39 23q20-9 29-9"
            stroke="#bcb6cf"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M189 64v39l8-7 8 4V60" fill="#a3be73" />
        </g>
        <g className="art-cup">
        <g transform="rotate(-13 67 123)">
          <path d="M36 109h45l-5 55q-17 12-34 0z" fill="#d4e996" />
          <ellipse cx="58" cy="109" rx="26" ry="6" fill="#9db75c" />
          <ellipse cx="58" cy="108" rx="19" ry="3" fill="#4f4135" />
          <path d="M45 136h29" stroke="#f5ffe5" strokeWidth="13" />
          <path
            d="M49 139q8 8 16 0"
            stroke="#59653d"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M50 91q-7-11 0-17m13 13q-7-11 0-17"
            stroke="#fffdf8"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        </g>
        <g fill="#6854c8">
          <path className="art-spark" d="m238 41 3 10 10 3-10 4-3 10-4-10-10-4 10-3z" />
          <path className="art-spark late" d="m47 50 2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
        </g>
        <path
          d="m252 111 6-10m4 21 10-2M110 34l-3-12m-5 17-10-7"
          stroke="#8672c6"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="261" cy="169" r="5" fill="#f38b68" />
        <circle cx="71" cy="41" r="3" fill="#f38b68" />
      </svg>
      <span className="art-note">birlikte, daha kolay.</span>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null),
    [data, setData] = useState(EMPTY),
    [loading, setLoading] = useState(true);
  const sessionEpoch = useRef(0);
  const updateData = (incoming) => setData((previous) => mergeState(previous, incoming));
  const [tab, setTab] = useState(
      TABS.includes(startParams.get("tab")) ? startParams.get("tab") : "home",
    ),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [connected, setConnected] = useState(true);
  const [filter, setFilter] = useState("all"),
    [mobileMenu, setMobileMenu] = useState(false),
    [theme, setTheme] = useState(() => {
      const saved = storage.get("kutup-theme");
      return THEMES.includes(saved) ? saved : "lilac";
    });
  const [invite, setInvite] = useState(
      location.pathname.startsWith("/join/")
        ? location.pathname.split("/")[2]
        : "",
    ),
    [inviteInfo, setInviteInfo] = useState(null);
  const [notificationOn, setNotificationOn] = useState(false),
    [notificationWorking, setNotificationWorking] = useState(false),
    [now, setNow] = useState(Date.now());
  const notificationBusy = useRef(false);
  const ownerPage = location.pathname === "/batur";
  const requestUpdates = useRequestUpdates(session, tab);
  // The opening sequence plays once per visit, never when switching tabs.
  const [intro, setIntro] = useState(() => {
    const play = !introPlayed && !reducedMotion();
    introPlayed = true;
    return play;
  });
  useEffect(() => {
    if (!intro) return;
    const timer = setTimeout(() => setIntro(false), 2600);
    return () => clearTimeout(timer);
  }, []);
  // Batur's door: seven quick taps on a ✳ with the last one held, or typing
  // "batur" anywhere outside a text field, opens a black hole. It only shows
  // the door; the panel still asks for the key (or the remembered owner cookie).
  useEffect(() => {
    let taps = [],
      hold = 0,
      note = 0,
      typed = "";
    const open = () => {
      navigator.vibrate?.(40);
      openBlackHole();
    };
    const down = (e) => {
      // A long press on the footer's signature reveals Batur's hidden note.
      if (e.target.closest?.("[data-note]"))
        note = setTimeout(() => {
          navigator.vibrate?.([30, 60, 30]);
          notify("Batur’dan gizli not: Bunu sizin için yaptım. Aynı masada olmasak da aynı yoldayız. Bir sonraki kahve benden. ☕✳", 9000);
        }, 700);
      if (!e.target.closest?.("[data-door]")) return;
      const now = Date.now();
      taps = taps.filter((t) => now - t < 4000);
      if (taps.length >= 6) hold = setTimeout(open, 650);
      taps.push(now);
    };
    const up = () => {
      clearTimeout(hold);
      clearTimeout(note);
    };
    const key = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      typed = (typed + (e.key.length === 1 ? e.key.toLocaleLowerCase("tr") : "")).slice(-5);
      if (typed === "batur") open();
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    const hour = new Date(Date.now() + 3 * 3600000).getUTCHours();
    const night = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
    if (hour >= 3 && hour < 5 && storage.get("kutup-owl") !== night) {
      storage.set("kutup-owl", night);
      setTimeout(() => notify("Saat kaç olmuş! Uyu artık 🦉 Kitaplar sabah da burada.", 7000), 1500);
    }
  }, [session?.memberId]);
  // The last build-mode session's ending, replayed on the construction site.
  const [buildOutcome, setBuildOutcome] = useState(null);
  // Friends who just switched to "Kütüpte" get a short glow on their card.
  const [arrived, setArrived] = useState([]);
  const lastStatus = useRef(null);
  useEffect(() => {
    if (!session) {
      lastStatus.current = null;
      return;
    }
    const previous = lastStatus.current;
    lastStatus.current = new Map(data.members.map((m) => [m.id, m.status]));
    if (!previous) return;
    const fresh = data.members
      .filter((m) => m.status === "here" && previous.get(m.id) !== "here")
      .map((m) => m.id);
    if (!fresh.length) return;
    setArrived((list) => [...list, ...fresh]);
    setTimeout(
      () => setArrived((list) => list.filter((id) => !fresh.includes(id))),
      4200,
    );
  }, [data, session]);
  const me = data.members.find((m) => m.id === session?.memberId);
  const { village, like, error: villageError, retry: retryVillage } = useVillage(session, data.group.villageRev);
  const here = data.members.filter((m) => ["here", "break"].includes(m.status));
  const focusMembers = data.members.filter((m) => m.focusEnd > now);
  const toastTimer = useRef(),
    finishInFlight = useRef(false),
    revision = useRef(null),
    lastFocus = useRef(null);
  const notify = (message, ms = 4500) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), ms);
  };
  const signedOut = (message) => {
    sessionEpoch.current++;
    setSession(null);
    setData(EMPTY);
    setNotificationOn(false);
    if (message) notify(message);
  };
  useEffect(() => {
    revision.current = data.group?.rev ?? null;
  }, [data]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.set("kutup-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (ownerPage) {
      setLoading(false);
      return;
    }
    get("/session")
      .then((d) => {
        setSession({
          memberId: d.memberId,
          username: d.username || null,
          pushPublicKey: d.pushPublicKey,
          live: d.live,
        });
        setData(d);
        if (startParams.get("action") === "here") setModal("presence");
      })
      .catch((e) => {
        if (e.status !== 401)
          notify("Sunucuya ulaşılamıyor. Bağlantın gelince sayfayı yeniden açabilirsin.");
        else if (standalone && !invite) setModal("onboard");
      })
      .finally(() => {
        setLoading(false);
        if (startParams.has("tab") || startParams.has("action"))
          history.replaceState({}, "", location.pathname);
      });
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (invite)
      get(`/invites/${encodeURIComponent(invite)}`)
        .then((info) => {
          setInviteInfo(info);
          setModal("onboard");
        })
        .catch((e) => {
          notify(e.message);
          setInvite("");
          history.replaceState({}, "", "/");
        });
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(toastTimer.current);
    };
  }, []);
  // Live updates: Server-Sent Events on the Node host; on Cloudflare / ChatGPT Sites
  // a light revision poll (only a number travels when nothing changed).
  useEffect(() => {
    if (!session) return;
    let source, timer, ticks = 0, gone = false, inFlight = false;
    const controller = new AbortController();
    // One poll at a time, but never forever: a request stalled by a network
    // switch or a suspended phone is cut after 15 s so syncing carries on.
    const refresh = async (full) => {
      if (gone || inFlight) return;
      inFlight = true;
      const attempt = new AbortController();
      const stop = () => attempt.abort();
      controller.signal.addEventListener("abort", stop, { once: true });
      const timeout = setTimeout(stop, 15000);
      try {
        const known = revision.current;
        const d = await get(
          full || known === null ? "/state" : `/state?rev=${known}`,
          attempt.signal,
        );
        if (gone) return;
        if (!d.unchanged) updateData(d);
        setConnected(true);
      } catch (e) {
        if (gone) return;
        if (e.status === 401)
          signedOut("Bu cihazdaki oturum kapandı. Yeniden katılabilirsin.");
        else setConnected(false);
      } finally {
        clearTimeout(timeout);
        controller.signal.removeEventListener("abort", stop);
        inFlight = false;
      }
    };
    if (session.live === "sse" && "EventSource" in window) {
      source = new EventSource("/api/events");
      source.addEventListener("state", (event) => {
        if (gone) return;
        updateData(JSON.parse(event.data));
        setConnected(true);
      });
      source.onerror = () => setConnected(false);
      timer = setInterval(() => refresh(true), 60000);
    } else
      timer = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        refresh(++ticks % 12 === 0);
      }, 5000);
    // The bell mirrors this device's real state: a live subscription, permission
    // still granted, and not switched off here. The first check also re-registers
    // the subscription so the server binds it to this device.
    let registered = false;
    const checkPush = () => {
      if (!pushSupported || notificationBusy.current) return;
      within(navigator.serviceWorker.ready, 8000)
        .then((r) => r.pushManager?.getSubscription())
        .then(async (s) => {
          if (gone || notificationBusy.current) return;
          const off = !!storage.get("kutup-push-off");
          const on = !!s && Notification.permission === "granted" && !off;
          if (s && !registered) {
            registered = true;
            // Re-register a live one; repeat a switch-off the server may have missed.
            const sync = on
              ? api("/push", { subscription: s.toJSON() })
              : off
                ? api("/push", { endpoint: s.endpoint }, "DELETE")
                : null;
            await sync?.catch(() => (registered = false));
          }
          if (!gone) setNotificationOn(on);
        })
        .catch(() => {});
    };
    const visible = () => {
      if (document.visibilityState !== "visible") return;
      refresh(true);
      checkPush();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", visible);
    checkPush();
    return () => {
      gone = true;
      controller.abort();
      source?.close();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", visible);
    };
  }, [session?.memberId]);
  // The server credits finished sessions; this only nudges it when our own ends.
  useEffect(() => {
    if (me?.focusEnd && me.focusEnd <= now && !finishInFlight.current) {
      finishInFlight.current = true;
      const epoch = sessionEpoch.current;
      api("/focus", { action: "finish" })
        .then((r) => epoch === sessionEpoch.current && r.state && updateData(r.state))
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            finishInFlight.current = false;
          }, 10000);
        });
    }
  }, [me?.focusEnd, now]);
  useEffect(() => {
    if (me?.focusEnd) {
      lastFocus.current = {
        end: me.focusEnd,
        minutes: me.focusMinutes,
        strict: !!me.focusStrict,
        kind: kindFor(me.focusMinutes),
        seed: me.focusSeed,
        week: me.focusWeek || 0,
      };
      return;
    }
    const done = lastFocus.current;
    lastFocus.current = null;
    if (!done) return;
    const outcome = (type) =>
      setBuildOutcome({ type, kind: done.kind, seed: done.seed, at: Date.now() });
    if (done.end > Date.now() + 2000) {
      if (done.strict) outcome("collapsed"); // gave up or left the app
      return;
    }
    if ((me?.focusWeek || 0) > done.week) {
      if (done.strict) outcome("built");
      notify(
        done.strict
          ? `${KINDS[done.kind].label} bitti! ${KINDS[done.kind].emoji} Köyüne eklendi.`
          : `İşte bu! ${done.minutes} dakika cebinde. Şimdi bir nefes. 🌱`,
      );
      navigator.vibrate?.([120, 80, 120]);
    } else if (done.strict) {
      outcome("collapsed");
      notify("İnşaat çöktü 🧱 Bu sefer telefon kazandı.");
    }
  }, [me?.focusEnd]);
  const buildRun = useMemo(
    () =>
      me?.focusStrict && me.focusEnd > Date.now()
        ? { endsAt: me.focusEnd, minutes: me.focusMinutes, kind: kindFor(me.focusMinutes), seed: me.focusSeed }
        : null,
    [me?.focusStrict, me?.focusEnd, me?.focusMinutes, me?.focusSeed],
  );
  // Build mode: keep the screen on, report presence, and let the building collapse
  // if the app is left for more than a few seconds (switching apps, closing the tab).
  const strictEnd = me?.focusStrict && me.focusEnd > Date.now() ? me.focusEnd : 0;
  useEffect(() => {
    if (!strictEnd) return releaseScreen();
    const GRACE = 10000;
    const epoch = sessionEpoch.current;
    const SEEN = "kutup-fidan";
    let hiddenAt = null,
      gone = false;
    const remember = () =>
      storage.set(SEEN, JSON.stringify({ end: strictEnd, at: Date.now() }));
    const wither = async () => {
      if (gone) return;
      gone = true;
      releaseScreen();
      try {
        const r = await api("/focus", { action: "wither" });
        if (epoch !== sessionEpoch.current) return;
        if (r.state) updateData(r.state);
      } catch {}
      if (epoch !== sessionEpoch.current) return;
      notify("İnşaatın çöktü 🧱 Uygulamadan çıkınca yıkılır. Bir dahakine!");
      navigator.vibrate?.(300);
    };
    const beat = () => {
      remember();
      api("/focus", { action: "beat" }).catch(() => {});
    };
    // Coming back to a session that kept running while the app was closed.
    try {
      const seen = JSON.parse(storage.get(SEEN) || "null");
      if (seen?.end === strictEnd && Date.now() - seen.at > GRACE) {
        wither();
        return;
      }
    } catch {}
    keepScreenOn();
    beat();
    const pulse = setInterval(() => {
      if (document.visibilityState === "visible") beat();
    }, 20000);
    // A local "still here" mark every few seconds, so a page reload is not
    // mistaken for leaving the app.
    const mark = setInterval(() => {
      if (document.visibilityState === "visible") remember();
    }, 3000);
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        remember();
        return;
      }
      const away = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = null;
      if (away > GRACE) return wither();
      if (away > 1500) notify("Az kalsın! Şantiye seni bekledi 🏗️");
      keepScreenOn();
      beat();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(pulse);
      clearInterval(mark);
      document.removeEventListener("visibilitychange", visibility);
      releaseScreen();
    };
  }, [strictEnd]);
  const focusLeft = me?.focusEnd > now ? Math.ceil((me.focusEnd - now) / 1000) : 0;
  useEffect(() => {
    document.title = focusLeft
      ? `${String(Math.floor(focusLeft / 60)).padStart(2, "0")}:${String(focusLeft % 60).padStart(2, "0")} · odakta · Kütüp`
      : "Kütüp — aynı masa, aynı motivasyon.";
  }, [focusLeft]);
  const requireMember = (action) => {
    if (!session) {
      setModal("onboard");
      return;
    }
    action();
  };
  const mutate = async (path, body, success, method = "POST") => {
    const epoch = sessionEpoch.current;
    try {
      const result = await api(path, body, method);
      const state = result.state || (await get("/state"));
      if (epoch !== sessionEpoch.current) return false;
      updateData(state);
      const said = path === "/messages" ? String(body?.text || "") : "";
      if (/\p{L}{3}/u.test(said) && said === said.toLocaleUpperCase("tr") && said !== said.toLocaleLowerCase("tr"))
        notify("Şşşt! Burası kütüphane 🤫");
      else if (success) notify(success);
      return result;
    } catch (e) {
      if (epoch !== sessionEpoch.current) return false;
      if (e.status === 401)
        signedOut("Bu cihazdaki oturum kapandı. Yeniden katılabilirsin.");
      else notify(e.message);
      return false;
    }
  };
  const navigate = (id) => {
    setTab(id);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const joinSuccess = (d, welcome = "Ekibine hoş geldin. Şimdi güzel şeyler olur. ✨") => {
    sessionEpoch.current++;
    setSession({
      memberId: d.memberId,
      username: d.username || null,
      pushPublicKey: d.pushPublicKey,
      live: d.live,
    });
    setData(d);
    setConnected(true);
    setModal(null);
    setInvite("");
    setInviteInfo(null);
    history.replaceState({}, "", "/");
    notify(welcome);
  };
  // The bell: one tap, one answer. Every step has a deadline and its own message,
  // and turning on ends with a real test notification on this device.
  async function enableNotifications() {
    if (notificationBusy.current) return;
    if (!pushSupported) {
      notify(
        isIOS && !standalone
          ? "iPhone’da önce Safari’de Paylaş → Ana Ekrana Ekle, sonra Kütüp’ü ana ekrandan aç."
          : "Bu tarayıcı bildirim desteklemiyor. Chrome veya Safari ile dene.",
        7000,
      );
      return;
    }
    notificationBusy.current = true;
    setNotificationWorking(true);
    try {
      if (notificationOn) await notificationsOff();
      else await notificationsOn();
    } finally {
      notificationBusy.current = false;
      setNotificationWorking(false);
    }
  }
  async function notificationsOff() {
    // Off on this device at once; telling the server is best effort (a stale
    // subscription is dropped on its next push, and the next visit retries).
    storage.set("kutup-push-off", "1");
    setNotificationOn(false);
    try {
      const registration = await within(navigator.serviceWorker.ready, 8000);
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await api("/push", { endpoint: sub.endpoint }, "DELETE").catch(() => {});
        // Batur’s owner alerts share this browser subscription; keep it for them.
        if (!storage.get("kutup-owner-push")) await sub.unsubscribe().catch(() => {});
      }
    } catch {}
    notify("Bildirimler kapandı. Zile dokunup istediğin an açabilirsin.");
  }
  async function notificationsOn() {
    // The permission prompt has to open straight from the tap (Safari insists),
    // so nothing is awaited before it.
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") {
      notify(
        permission === "denied"
          ? isIOS
            ? "Bildirim izni kapalı. iPhone Ayarlar → Bildirimler → Kütüp’ten açıp tekrar dene."
            : "Bildirim izni engelli. Adres çubuğundaki site ayarlarından Bildirimler’i “İzin ver” yapıp tekrar dene."
          : "İzin vermedin, bildirimler kapalı kaldı. Fikrin değişirse zile tekrar dokun.",
        8000,
      );
      return;
    }
    let registration;
    try {
      registration = await within(
        navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready),
        10000,
      );
    } catch {
      notify("Bildirim servisi başlatılamadı. Sayfayı yenileyip tekrar dene.", 7000);
      return;
    }
    const key = pushKey(session.pushPublicKey);
    let sub;
    try {
      sub = await registration.pushManager.getSubscription();
      // A subscription made for another server key can never receive our pushes.
      if (sub && !sameKey(sub.options?.applicationServerKey, key)) {
        await sub.unsubscribe().catch(() => {});
        sub = null;
      }
      sub ||= await within(
        registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }),
        15000,
      );
    } catch (e) {
      notify(
        e.name === "NotAllowedError"
          ? "Bildirim izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene."
          : e.name === "TimeoutError" || e.name === "AbortError"
            ? "Telefonun bildirim servisine ulaşılamadı. İnternetini kontrol edip tekrar dene. Brave kullanıyorsan ayarlardan “Google bildirim servisi”ni aç."
            : "Bu tarayıcı bildirim aboneliği açamadı. Chrome ya da Safari ile dene.",
        8000,
      );
      return;
    }
    try {
      const result = await api("/push", { subscription: sub.toJSON(), test: true });
      storage.set("kutup-push-off", "");
      setNotificationOn(true);
      notify(
        result.test
          ? "Bildirimler açık! Çalıştığını gör diye sana bir deneme bildirimi yolladım 🔔"
          : "Bildirimler açık! Biri gelince ilk sen duyacaksın 🔔",
        6000,
      );
    } catch (e) {
      if (e.status === 401) return signedOut("Bu cihazdaki oturum kapandı. Yeniden giriş yap.");
      notify(e.status === 0 ? "İnternet yok gibi. Bağlanınca zile tekrar dokun." : e.message, 7000);
    }
  }
  if (ownerPage) return <OwnerPage />;
  if (loading)
    return (
      <div className="loading-screen">
        <span className="brand">
          kütüp<span data-door="">✳</span>
        </span>
        <p>Bir sandalye çekiyoruz…</p>
        <LoaderCircle className="spin" />
      </div>
    );
  if (!session)
    return (
      <>
        <Welcome invite={invite} inviteInfo={inviteInfo} open={(next) => setModal(next)} />
        {(modal === "onboard" || modal === "login") && (
          <Onboard
            invite={invite}
            inviteInfo={inviteInfo}
            start={modal === "login" ? "code" : undefined}
            close={() => setModal(null)}
            onSuccess={joinSuccess}
            existing={false}
          />
        )}
        {toast && (
          <div role="status" className="toast welcome-toast">
            <span>✦</span>
            {toast}
            <button aria-label="Mesajı kapat" onClick={() => setToast("")}>
              <X size={15} />
            </button>
          </div>
        )}
      </>
    );
  const visibleMembers = data.members.filter(
    (m) =>
      filter === "all" ||
      (filter === "here"
        ? ["here", "break"].includes(m.status)
        : m.status === filter),
  );
  return (
    <div
      className={`app-shell ${intro ? "intro" : ""} ${
        data.messages.some((m) => m.kind !== "system" && m.text.trim().toLocaleLowerCase("tr") === "çay" && now - m.created < 60000)
          ? "tea-time"
          : ""
      }`}
    >
      {mobileMenu && (
        <div className="sidebar-scrim" onClick={() => setMobileMenu(false)} />
      )}
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Kütüp ana sayfa"
        >
          kütüp<span data-door="">✳</span>
        </button>
        <div className="group-switch">
          <span className="group-symbol">✷</span>
          <div>
            <strong>{data.group.name}</strong>
            <small>
              {session
                ? `${data.members.length} kişilik güzel bir ekip`
                : "Senin ekibin, senin köşen"}
            </small>
          </div>
          <ChevronRight size={16} />
        </div>
        <span className="nav-caption">BİZİM ALAN</span>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "plans" && data.plans.length > 0 && (
                <b>{data.plans.length}</b>
              )}
              {item.id === "focus" && focusMembers.length > 0 && (
                <span className="nav-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <button
          className={`nav-item feedback-nav ${tab === "feedback" ? "active" : ""}`}
          onClick={() => navigate("feedback")}
        >
          <Send size={19} />
          <span>Batur’a ilet</span>
          {requestUpdates.count ? (
            <b aria-label={`${requestUpdates.count} yeni gelişme`}>
              {requestUpdates.count}
            </b>
          ) : (
            <span className="tiny-star">✧</span>
          )}
        </button>
        <button
          className="nav-item"
          onClick={() => requireMember(() => setModal("profile"))}
        >
          <Settings2 size={19} />
          <span>Benim köşem</span>
        </button>
        <div className="sidebar-bottom">
          <div className="library-note">
            <BookOpen size={24} />
            <div>
              <strong>Milli Kütüphane</strong>
              <span>Ankara’da bir çalışma bahanesi.</span>
            </div>
            <span className="note-doodle">↗</span>
          </div>
          <button
            className="sidebar-profile"
            onClick={() => requireMember(() => setModal("profile"))}
          >
            <Avatar member={me} size="small" />
            <span>
              <strong>{me?.name || "Senin yerin hazır"}</strong>
              <small>
                {me ? "Profilini güzelleştir" : "Ekibine katıl, yerini al"}
              </small>
            </span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileMenu(true)}
              aria-label="Menüyü aç"
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Bizim alan <ChevronRight size={13} />{" "}
              <strong>
                {tab === "feedback"
                  ? "Batur’a ilet"
                  : nav.find((x) => x.id === tab)?.label}
              </strong>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="today-label">
              {new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                weekday: "long",
                timeZone: "Europe/Istanbul",
              })}
            </span>
            <button
              className={`icon-button notification-button ${notificationOn ? "enabled" : ""} ${notificationWorking ? "working" : ""}`}
              aria-busy={notificationWorking}
              aria-pressed={notificationOn}
              aria-label={
                notificationOn ? "Bildirimleri kapat" : "Bildirimleri aç"
              }
              onClick={() => requireMember(enableNotifications)}
            >
              {notificationOn ? <BellRing size={19} /> : <Bell size={19} />}
              <i />
            </button>
            <button
              className="btn invite-btn"
              onClick={() =>
                session ? setModal("invite") : setModal("onboard")
              }
            >
              <Plus size={16} />
              <span>
                {session
                  ? "Arkadaşını çağır"
                  : invite
                    ? "Ekibe katıl"
                    : "Ekibini kur"}
              </span>
            </button>
          </div>
        </header>
        {!session && (
          <div className="demo-banner">
            <Sparkles size={15} />
            <span>
              {invite
                ? `Bunlar örnek kişiler. ${inviteInfo?.name || "Ekibin"} seni bekliyor; katılınca gerçek ekibini görürsün.`
                : "Bir küçük ön izleme. Gerçek hikâye senin ekibinle başlasın."}
            </span>
            <button onClick={() => setModal("onboard")}>
              {invite ? "Ekibe katıl" : "Yerini al"} <ArrowUpRight size={14} />
            </button>
          </div>
        )}
        {session && !connected && (
          <div className="connection-banner">
            <LoaderCircle size={14} className="spin" /> Canlı bağlantı
            yenileniyor. Durumlar yeniden eşitlenecek.
          </div>
        )}
        <div className="page-content">
          <div className="tab-stage" key={tab}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {tab === "home"
                  ? "GÜZEL BİR ÇALIŞMA GÜNÜ"
                  : tab === "feedback"
                    ? "BU PLATFORM BİRAZ DA SENİN"
                    : "EKİPLE HER ŞEY DAHA İYİ"}
              </div>
              <h1>
                {tab === "home" ? (
                  <>
                    Selam{me ? `, ${me.name}` : ", kütüp tayfa"}{" "}
                    <span className="wave">✌️</span>
                  </>
                ) : tab === "plans" ? (
                  "Birlikte planlayalım."
                ) : tab === "focus" ? (
                  "Odaklan, köy büyüsün."
                ) : tab === "board" ? (
                  "Bizim küçük köşe."
                ) : (
                  "Söz sende."
                )}
              </h1>
              <p>
                {tab === "home"
                  ? "Kim nerede, kim geliyor? Hepsi burada."
                  : tab === "plans"
                    ? "“Yarın geliyor musun?” mesajının yerini burası alsın."
                    : tab === "focus"
                      ? "Her seans köye bir bina. Kulaklıkları tak, telefonu bırak."
                      : tab === "board"
                        ? "Yer tutmalar, küçük notlar, büyük motivasyonlar."
                        : "Fikirler, takılan şeyler, güzel iki kelime. Hepsi Batur’a."}
              </p>
            </div>
            {tab === "home" && (
              <div className="live-chip">
                <span className={session ? "live-dot" : "demo-dot"} />
                {session ? "Anlık olarak birlikteyiz" : "Ekibinden bir kesit"}
              </div>
            )}
            {tab === "plans" && (
              <button
                className="btn primary"
                onClick={() => requireMember(() => setModal("plan"))}
              >
                <Plus size={18} /> Plan yap
              </button>
            )}
          </div>
          {tab === "home" && session && !notificationOn && (
            <SetupCard enable={enableNotifications} busy={notificationWorking} />
          )}
          {tab === "home" && session && !session.username && (
            <button className="account-nudge" onClick={() => setModal("profile")}>
              <KeyRound size={18} />
              <span>
                <strong>Hesabını koru</strong>
                <small>Kullanıcı adı ve şifre belirle; başka bir telefondan ya da tarayıcıdan girince profilin seni beklesin.</small>
              </span>
              <ArrowRight size={16} />
            </button>
          )}
          {tab === "home" && (
            <div className="dashboard-grid">
              <section className="hero-card">
                <div className="hero-copy">
                  <span className="hero-location">
                    <MapPin size={13} /> MİLLİ KÜTÜPHANE, ANKARA
                  </span>
                  <h2 className="kinetic" aria-label="Aynı masa. Aynı motivasyon.">
                    <span className="line" aria-hidden="true">
                      <span>Aynı masa.</span>
                    </span>
                    <span className="line" aria-hidden="true">
                      <span>
                        Aynı motivasyon<b className="dot">.</b>
                      </span>
                    </span>
                  </h2>
                  <p>
                    Kütüphane daha iyi bir yer.
                    <br />
                    Özellikle seninkiler de oradaysa.
                  </p>
                  <div className="hero-buttons">
                    <button
                      className="btn dark"
                      onClick={() => requireMember(() => setModal("presence"))}
                    >
                      {me?.status === "here" ? (
                        <Check size={18} />
                      ) : (
                        <MapPin size={18} />
                      )}
                      {me?.status === "here"
                        ? "Yerimi güncelle"
                        : "Ben geldim!"}
                      <ArrowUpRight size={17} />
                    </button>
                    <button
                      className="hero-secondary"
                      onClick={() => requireMember(() => setModal("coming"))}
                    >
                      Yoldayım <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="hero-company">
                    <div className="avatar-stack">
                      {here.slice(0, 3).map((m) => (
                        <Avatar key={m.id} member={m} size="tiny" />
                      ))}
                    </div>
                    <span>
                      {here.length ? (
                        <>
                          <strong>{here.length} kişi</strong> yerini aldı bile.
                        </>
                      ) : (
                        "İlk sandalye seni bekliyor."
                      )}
                    </span>
                  </div>
                </div>
                <HeroArt />
                <span className="hero-sticker">
                  ders arası
                  <br />
                  <b>hayat ✷</b>
                </span>
              </section>
              <VillageNow
                me={me}
                members={data.members}
                groupId={data.group.id}
                village={village}
                onOpen={() => navigate("focus")}
              />
              <FocusCard
                me={me}
                members={focusMembers}
                now={now}
                requireMember={requireMember}
                mutate={mutate}
                compact
              />
              <section className="members-section">
                <div className="section-heading">
                  <h2>
                    Bugün kimler var? <span>{data.members.length}</span>
                  </h2>
                  {me && me.status !== "away" && (
                    <button
                      className="text-button"
                      onClick={() =>
                        mutate(
                          "/presence",
                          { status: "away" },
                          "Bugünlük bu kadar. Yarın görüşürüz! 👋",
                        )
                      }
                    >
                      <DoorOpen size={15} /> Çıkış yap
                    </button>
                  )}
                </div>
                <div className="filter-row">
                  {[
                    ["all", "Herkes", data.members.length],
                    ["here", "Kütüpte", here.length],
                    [
                      "coming",
                      "Yolda",
                      data.members.filter((m) => m.status === "coming").length,
                    ],
                  ].map(([id, label, count]) => (
                    <button
                      key={id}
                      className={`filter-chip ${filter === id ? "selected" : ""}`}
                      onClick={() => setFilter(id)}
                    >
                      {id !== "all" && <i className={id} />}
                      {label}
                      <span>{count}</span>
                    </button>
                  ))}
                  <span className="filter-live">
                    {session ? "canlı" : "örnek ekip"} <span />
                  </span>
                </div>
                <div className="member-grid">
                  {visibleMembers.map((m, i) => (
                    <MemberCard
                      key={m.id}
                      index={i}
                      arrived={arrived.includes(m.id)}
                      member={m}
                      mine={m.id === me?.id}
                      now={now}
                      onClick={() =>
                        m.id === me?.id
                          ? setModal("profile")
                          : requireMember(() => setModal({ member: m }))
                      }
                    />
                  ))}
                </div>
                {!visibleMembers.length && (
                  <Empty emoji="🪑" title="Şimdilik sakin.">
                    İlk gelenin haberi buraya düşecek.
                  </Empty>
                )}
              </section>
              <div className="right-stack">
                <CoffeeCard
                  requireMember={requireMember}
                  onCoffee={() => setModal("coffee")}
                />
                <section className="panel small-plans">
                  <div className="section-heading">
                    <h2>Ufukta ne var?</h2>
                    <CalendarDays size={18} />
                  </div>
                  {data.plans.slice(0, 2).map((p) => (
                    <PlanMini
                      key={p.id}
                      plan={p}
                      members={data.members}
                      onClick={() => navigate("plans")}
                    />
                  ))}
                  {!data.plans.length && (
                    <p className="muted small">
                      Takvim boş. İlk “yarın buluşuruz” senden gelsin.
                    </p>
                  )}
                  <button
                    className="text-button accent"
                    onClick={() => requireMember(() => setModal("plan"))}
                  >
                    <Plus size={15} /> Bir plan bırak
                  </button>
                </section>
              </div>
              <Board
                data={data}
                me={me}
                requireMember={requireMember}
                mutate={mutate}
                compact
              />
              <section className="tiny-love">
                <span>✳</span>
                <h3>Burası bizim.</h3>
                <p>
                  “Şu da olsa güzel olurdu” dediğin her şeyi duymak isteriz.
                </p>
                <button
                  className="text-button"
                  onClick={() => navigate("feedback")}
                >
                  Batur’a bir not bırak <ArrowUpRight size={16} />
                </button>
              </section>
            </div>
          )}
          {tab === "plans" && (
            <Plans
              data={data}
              me={me}
              requireMember={requireMember}
              mutate={mutate}
              open={() => setModal("plan")}
            />
          )}
          {tab === "focus" && (
            <div className="focus-page">
              <FocusCard
                me={me}
                members={focusMembers}
                now={now}
                requireMember={requireMember}
                mutate={mutate}
              />
              <div className="focus-side">
                <VillagePanel
                  me={me}
                  members={data.members}
                  groupId={data.group.id}
                  village={village}
                  like={like}
                  error={villageError}
                  retry={retryVillage}
                  run={buildRun}
                  outcome={buildOutcome}
                  notify={notify}
                  session={session}
                />
                <AmbientSound />
                <WeekBoard members={data.members} me={me} />
                <section className="panel">
                  <div className="section-heading">
                    <h2>Beraber odaktayız</h2>
                    <span className="count-tag">{focusMembers.length}</span>
                  </div>
                  {focusMembers.length ? (
                    focusMembers.map((m) => (
                      <div className="focus-friend" key={m.id}>
                        <Avatar member={m} size="small" />
                        <div>
                          <strong>
                            {m.name}
                            {m.id === me?.id ? " (sen)" : ""}
                            {m.focusStrict ? " 🏗️" : ""}
                          </strong>
                          <small>
                            {Math.ceil((m.focusEnd - now) / 60000)} dakika kaldı
                          </small>
                        </div>
                        {m.id !== me?.id && !me?.focusEnd && (
                          <button
                            className="btn small-btn"
                            onClick={() =>
                              requireMember(() =>
                                mutate(
                                  "/focus",
                                  {
                                    action: "start",
                                    joinMember: m.id,
                                    strict: storage.get("kutup-fidan-on") !== "0",
                                  },
                                  "Aynı ritimdesiniz. İyi çalışmalar!",
                                ),
                              )
                            }
                          >
                            Katıl
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <Empty emoji="🎧" title="İlk seans senden.">
                      Sen başlayınca ekibin de sana katılabilir.
                    </Empty>
                  )}
                </section>
                <section className="focus-tip">
                  <span>🌱</span>
                  <p>
                    Bugün <strong>{me?.focusToday || 0} dakika</strong> kendine
                    yatırım yaptın. Küçük adımlar da ilerlemedir.
                  </p>
                </section>
              </div>
            </div>
          )}
          {tab === "board" && (
            <div className="board-page">
              <Board
                data={data}
                me={me}
                requireMember={requireMember}
                mutate={mutate}
              />
              <div className="right-stack">
                <CoffeeCard
                  requireMember={requireMember}
                  onCoffee={() => setModal("coffee")}
                />
                <div className="panel board-guideline">
                  <span>🫶</span>
                  <h3>İyi ki aynı ekipteyiz.</h3>
                  <p>
                    Pano ekibine özel. Bir not bırak, kahveye seslen ya da
                    arkadaşının mesajına kalp at.
                  </p>
                  <p className="small muted">
                    Son 50 mesaj ve son 25 hareket burada görünür.
                  </p>
                </div>
              </div>
            </div>
          )}
          {tab === "feedback" && (
            <FeedbackPage
              me={me}
              requireMember={requireMember}
              notify={notify}
              onSeen={requestUpdates.clear}
            />
          )}
          </div>
          <footer className="page-footer">
            <span>
              Biraz çalışma, biraz muhabbet. <span data-door="">kütüp ✳</span>
            </span>
            <span data-note="">Batur’dan, bizim tayfaya.</span>
          </footer>
        </div>
      </main>
      <nav className="mobile-bottom" aria-label="Bölümler">
        {nav.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "active" : ""}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => navigate(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.short}</span>
          </button>
        ))}
        <button
          className={tab === "feedback" ? "active" : ""}
          aria-current={tab === "feedback" ? "page" : undefined}
          onClick={() => navigate("feedback")}
        >
          <Send size={19} />
          <span>Batur’a</span>
          {requestUpdates.count > 0 && <i className="nav-badge" aria-hidden="true" />}
        </button>
      </nav>
      {modal === "onboard" && (
        <Onboard
          invite={invite}
          inviteInfo={inviteInfo}
          close={() => setModal(null)}
          onSuccess={joinSuccess}
          existing={!!session}
        />
      )}
      {modal === "profile" && me && (
        <ProfileModal
          me={me}
          username={session?.username}
          onAccount={(username) => setSession((s) => ({ ...s, username }))}
          theme={theme}
          setTheme={setTheme}
          close={() => setModal(null)}
          mutate={mutate}
          notify={notify}
          onLeft={() => {
            setModal(null);
            signedOut("Ekipten ayrıldın. Kapımız hep açık. 🫶");
          }}
        />
      )}
      {(modal === "presence" || modal === "coming") && me && (
        <PresenceModal
          me={me}
          coming={modal === "coming"}
          close={() => setModal(null)}
          mutate={mutate}
        />
      )}
      {modal === "invite" && (
        <InviteModal
          group={data.group}
          close={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal === "plan" && (
        <PlanModal close={() => setModal(null)} mutate={mutate} />
      )}
      {modal === "coffee" && (
        <CoffeeModal close={() => setModal(null)} mutate={mutate} />
      )}
      {modal?.member && (
        <MemberModal
          member={
            data.members.find((m) => m.id === modal.member.id) || modal.member
          }
          now={now}
          close={() => setModal(null)}
          mutate={mutate}
        />
      )}
      {toast && (
        <div role="status" className="toast">
          <span>✦</span>
          {toast}
          <button aria-label="Mesajı kapat" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

// Each digit is its own element keyed by value, so only the digit that changed
// re-mounts and rolls in.
function Roll({ value }) {
  return String(value)
    .padStart(2, "0")
    .split("")
    .map((digit, i) => (
      <span className="roll" key={`${i}-${digit}`}>
        {digit}
      </span>
    ));
}
function MemberCard({ member: m, mine, now, onClick, index = 0, arrived = false }) {
  return (
    <button
      className={`member-card ${m.color} ${arrived ? "arrived" : ""}`}
      style={{ "--i": index }}
      onClick={onClick}
    >
      <div className="member-card-top">
        <Avatar member={m} />
        <Badge status={m.status} />
      </div>
      <div className="member-name">
        <h3>{m.name}</h3>
        {mine && <span>sen</span>}
        {m.focusEnd > now &&
          (m.focusStrict ? (
            <span className="member-plant" title="İnşaat modunda odakta">
              🏗️
            </span>
          ) : (
            <Headphones size={16} />
          ))}
      </div>
      {m.badge === "dev" && (
        <p className="dev-tag" title="Kütüp’ü yapan kişi">✦ Kurucu · Olay ufku bekçisi</p>
      )}
      <p className="member-note">
        {m.note || "Bu masada güzel şeyler olacak."}
      </p>
      {(m.status === "here" || m.status === "break") && (
        <p className="member-since">
          {m.since && now - m.since >= 60000
            ? `${m.status === "here" ? "burada" : "molada"} · ${minutesLabel(Math.floor((now - m.since) / 60000))}`
            : m.status === "here"
              ? "şimdi geldi ✨"
              : "molaya yeni çıktı"}
        </p>
      )}
      <div className="member-card-bottom">
        {m.status === "coming" ? (
          <>
            <span>🛵</span>
            <span>{m.arrival || "Birazdan burada"}</span>
          </>
        ) : m.status === "away" ? (
          <>
            <Moon size={14} />
            <span>Henüz yerini almadı</span>
          </>
        ) : (
          <>
            <MapPin size={14} />
            <span>
              {m.location || "Milli Kütüphane"}
              {m.desk ? ` · ${m.desk}` : ""}
            </span>
          </>
        )}
        <ArrowUpRight size={14} />
      </div>
    </button>
  );
}
function FocusCard({ me, members, now, requireMember, mutate, compact }) {
  const [duration, setDuration] = useState(25),
    [busy, setBusy] = useState(false),
    [fidan, setFidan] = useState(() => storage.get("kutup-fidan-on") !== "0");
  const finishing = !!me?.focusEnd && me.focusEnd <= now;
  const running = !!me?.focusEnd && !finishing,
    seconds = running
      ? Math.max(0, Math.ceil((me.focusEnd - now) / 1000))
      : duration * 60;
  const progress = running
    ? 1 - seconds / ((me.focusMinutes || duration) * 60)
    : 0;
  const growing = running && !!me?.focusStrict;
  const building = KINDS[kindFor(running ? me.focusMinutes : duration)];
  const control = async () => {
    if (
      growing &&
      !confirm("Pes edersen bina yıkılır ve bu seansın dakikaları yazılmaz. Emin misin?")
    )
      return;
    if (!running && fidan) keepScreenOn(); // needs the tap itself on some phones
    setBusy(true);
    await mutate(
      "/focus",
      { action: running ? "cancel" : "start", minutes: duration, strict: fidan },
      running
        ? growing
          ? "İnşaat çöktü 🧱 Bir dahakine sonuna kadar!"
          : "Seans durdu. Hazır olunca yeniden başla."
        : fidan
          ? `Temel atıldı 🏗️ ${building.label} yükseliyor. Uygulamada kal, ekran açık kalacak.`
          : "Dünya biraz beklesin. Şimdi odak zamanı. 🎧",
    );
    setBusy(false);
  };
  return (
    <section
      className={`focus-card ${compact ? "compact" : ""} ${running ? "running" : ""} ${growing ? "growing" : ""}`}
    >
      <div className="focus-card-header">
        <span>
          <Headphones size={18} /> ODAK MODU
        </span>
        {growing ? (
          <span className="focus-plant" aria-label={`${building.label} inşa ediliyor`}>
            {building.emoji}
          </span>
        ) : (
          <span className="focus-spark">✧</span>
        )}
      </div>
      <h2>
        {growing
          ? `${building.label} yükseliyor.`
          : running
            ? "Şu an kendin için."
            : "Bir küçük odak arası."}
      </h2>
      <div className="timer-wrap">
        <svg className="timer-ring" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r="81"
            fill="none"
            stroke="rgba(255,255,255,.1)"
            strokeWidth="3"
          />
          <circle
            cx="90"
            cy="90"
            r="81"
            fill="none"
            stroke="#d6ef9e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="509"
            strokeDashoffset={509 * (1 - progress)}
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div className="timer-digits">
          <b className="clock">
            <Roll value={Math.floor(seconds / 60)} />
            <i>:</i>
            <Roll value={seconds % 60} />
          </b>
          <span>
            {growing
              ? "🏗️ uygulamadan çıkma, yıkılır"
              : running
                ? "sen, işin ve biraz sessizlik"
                : "dakika sadece kendine"}
          </span>
        </div>
      </div>
      {!running && !finishing && (
        <div className="duration-options">
          {[25, 50, 75].map((n) => (
            <button
              key={n}
              className={duration === n ? "active" : ""}
              aria-pressed={duration === n}
              onClick={() => setDuration(n)}
            >
              {n} dk
            </button>
          ))}
        </div>
      )}
      {!compact && !running && !finishing && (
        <button
          type="button"
          className={`fidan-toggle ${fidan ? "on" : ""}`}
          aria-pressed={fidan}
          onClick={() => {
            setFidan(!fidan);
            storage.set("kutup-fidan-on", fidan ? "0" : "1");
          }}
        >
          <span aria-hidden="true">{fidan ? building.emoji : "🏗️"}</span>
          <span>
            <b>İnşaat modu {fidan ? "açık" : "kapalı"}</b>
            <small>
              {fidan
                ? `${duration} dk sonunda köyüne bir ${building.label.toLocaleLowerCase("tr")} eklenir. Ekran açık kalır; 10 saniyeden uzun çıkarsan yıkılır.`
                : "Odaklandıkça bir bina yükselir: 25 dk kulübe, 50 dk iki katlı ev, 75 dk kule. Bitenler köyüne kalır."}
            </small>
          </span>
        </button>
      )}
      <Busy
        loading={busy || finishing}
        className="btn focus-start"
        onClick={() => requireMember(control)}
      >
        {finishing ? null : running ? (
          <Square size={14} />
        ) : (
          <Play size={15} fill="currentColor" />
        )}
        {finishing
          ? "Dakikalar cebine yazılıyor…"
          : running
            ? growing
              ? "Pes et (bina yıkılır)"
              : "Seansı durdur"
            : fidan
              ? `Temeli at ${building.emoji}`
              : "Hadi odaklanalım"}
      </Busy>
      <p className="focus-bottom">
        {members.length ? (
          <>
            <span className="mini-live" /> {members.length} kişi şu an odakta.
            Sen de var mısın?
          </>
        ) : (
          "Küçük bir başlangıç, büyük bir iyi his."
        )}
      </p>
    </section>
  );
}
function CoffeeCard({ requireMember, onCoffee }) {
  return (
    <section className="coffee-card">
      <div className="coffee-doodle">
        ☕<span>✧</span>
      </div>
      <div>
        <span className="eyebrow">DERS ARASI HAYAT</span>
        <h3>Bi’ kahve?</h3>
        <p>En iyi fikirler bazen molada gelir.</p>
      </div>
      <button className="coffee-button" onClick={() => requireMember(onCoffee)}>
        Ekibe seslen <ArrowUpRight size={17} />
      </button>
    </section>
  );
}
function PlanMini({ plan, members, onClick }) {
  const date = new Date(plan.starts);
  return (
    <button className="plan-mini" onClick={onClick}>
      <div className="date-square">
        <span>
          {date.toLocaleDateString("tr-TR", {
            month: "short",
            timeZone: "Europe/Istanbul",
          })}
        </span>
        <b>
          {date.toLocaleDateString("tr-TR", {
            day: "numeric",
            timeZone: "Europe/Istanbul",
          })}
        </b>
      </div>
      <div>
        <strong>{plan.note || "Kütüpte buluşalım"}</strong>
        <small>
          {dayWord(plan.starts)} {shortTime(plan.starts)} ·{" "}
          {plan.attendees.length} kişi geliyor
        </small>
      </div>
      <ChevronRight size={15} />
    </button>
  );
}
function Board({ data, me, requireMember, mutate, compact }) {
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false);
  const messages = compact
    ? data.messages.filter((m) => m.kind !== "system").slice(-3)
    : data.messages;
  const send = async (e) => {
    e.preventDefault();
    requireMember(async () => {
      if (!text.trim()) return;
      setBusy(true);
      if (await mutate("/messages", { text })) setText("");
      setBusy(false);
    });
  };
  return (
    <section className={`panel board ${compact ? "compact-board" : ""}`}>
      <div className="section-heading">
        <h2>
          Bizim pano <span className="scribble">✎</span>
        </h2>
        <span className="private-label">
          <Users size={13} /> Sadece bizim ekip
        </span>
      </div>
      <div className="messages">
        {messages.map((msg) => {
          const m = data.members.find((x) => x.id === msg.memberId);
          return msg.kind === "system" ? (
            <div key={msg.id} className="system-message">
              <span>✦</span>
              <p>
                <strong>{m?.name}</strong> {msg.text}
              </p>
              <time>{shortTime(msg.created)}</time>
            </div>
          ) : (
            <article
              key={msg.id}
              className={`message ${msg.kind === "coffee" ? "coffee-message" : ""}`}
            >
              <Avatar member={m} size="small" />
              <div>
                <div className="message-meta">
                  <strong>{m?.name}</strong>
                  {m?.badge === "dev" && <span className="dev-mark" title="Geliştirici">✦</span>}
                  <time>{shortTime(msg.created)}</time>
                  {msg.kind === "coffee" && <span>mola daveti ☕</span>}
                </div>
                <p>{msg.text}</p>
                <button
                  className={`reaction ${msg.reactions.includes(me?.id) ? "reacted" : ""}`}
                  aria-label={`${m?.name} mesajına kalp ${msg.reactions.includes(me?.id) ? "kaldır" : "bırak"}`}
                  onClick={() =>
                    requireMember(() => mutate(`/messages/${msg.id}/react`, {}))
                  }
                >
                  <Heart
                    size={12}
                    fill={
                      msg.reactions.includes(me?.id) ? "currentColor" : "none"
                    }
                  />
                  {msg.reactions.length || "İlk kalp"}
                </button>
              </div>
            </article>
          );
        })}
        {!messages.length && (
          <Empty emoji="💌" title="Pano ilk notunu bekliyor.">
            Bir “selam” güzel bir başlangıç.
          </Empty>
        )}
      </div>
      <form className="message-form" onSubmit={send}>
        <Avatar member={me} size="tiny" />
        <input
          aria-label="Panoya mesaj"
          placeholder={
            me
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
function Plans({ data, me, requireMember, mutate, open }) {
  return (
    <div className="plans-page">
      <div className="plans-main">
        {data.plans.length ? (
          data.plans.map((plan) => {
            const owner = data.members.find((m) => m.id === plan.memberId),
              joined = plan.attendees.includes(me?.id);
            return (
              <article key={plan.id} className="plan-card">
                <div className="plan-date">
                  <b>
                    {new Date(plan.starts).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      timeZone: "Europe/Istanbul",
                    })}
                  </b>
                  <span>
                    {new Date(plan.starts).toLocaleDateString("tr-TR", {
                      month: "long",
                      timeZone: "Europe/Istanbul",
                    })}
                  </span>
                </div>
                <div className="plan-content">
                  <span className="eyebrow">
                    {dayWord(plan.starts)} · {shortTime(plan.starts)}
                  </span>
                  <h2>{plan.note || "Kütüpte buluşalım"}</h2>
                  <p>
                    <Avatar member={owner} size="tiny" /> {owner?.name} planladı{" "}
                    <span>· Milli Kütüphane</span>
                  </p>
                  <div className="plan-attendees">
                    <div className="avatar-stack">
                      {plan.attendees.slice(0, 5).map((id) => (
                        <Avatar
                          key={id}
                          member={data.members.find((x) => x.id === id)}
                          size="tiny"
                        />
                      ))}
                    </div>
                    <span>{plan.attendees.length} kişi varım dedi</span>
                  </div>
                </div>
                <div className="plan-actions">
                  {plan.memberId === me?.id ? (
                    <button
                      className="icon-button"
                      aria-label="Planı sil"
                      onClick={() => {
                        if (confirm("Bu planı kaldırmak istiyor musun?"))
                          mutate(
                            `/plans/${plan.id}`,
                            {},
                            "Plan kaldırıldı.",
                            "DELETE",
                          );
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  ) : (
                    <button
                      className={`btn ${joined ? "joined" : "primary"}`}
                      onClick={() =>
                        requireMember(() =>
                          mutate(
                            `/plans/${plan.id}/join`,
                            {},
                            joined
                              ? "Plandan ayrıldın."
                              : "Sen de varsın. Harika!",
                          ),
                        )
                      }
                    >
                      {joined ? <Check size={16} /> : <Plus size={16} />}
                      {joined ? "Ben de varım" : "Ben de gelirim"}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <section className="panel">
            <Empty emoji="🗓️" title="Takvim henüz boş.">
              Güzel bir çalışma günü kendiliğinden planlanmaz.
            </Empty>
            <button
              className="btn primary centered"
              onClick={() => requireMember(open)}
            >
              <Plus size={17} /> İlk planı yap
            </button>
          </section>
        )}
      </div>
      <aside className="plans-note">
        <span>🛵</span>
        <h2>
          Bir “ben de”
          <br />
          her şeyi değiştirir.
        </h2>
        <p>
          Önümüzdeki iki hafta için plan yap. İsteyen katılsın, kimlerin
          geleceği baştan belli olsun.
        </p>
        <small>Saatler Türkiye saatine göredir.</small>
      </aside>
    </div>
  );
}
const PLACES = [
  "Zemin · Genel salon",
  "1. kat · Sessiz salon",
  "2. kat · Okuma salonu",
  "Grup çalışma alanı",
  "Kafeterya",
  "Bahçe",
];
const OTHER_PLACE = "Başka bir yer…";
function PresenceModal({ me, coming, close, mutate }) {
  const known = !me.location || PLACES.includes(me.location);
  const [status, setStatus] = useState(coming ? "coming" : "here"),
    [location, setLocation] = useState(
      known ? me.location || "1. kat · Sessiz salon" : OTHER_PLACE,
    ),
    [customPlace, setCustomPlace] = useState(known ? "" : me.location),
    [desk, setDesk] = useState(me.desk || ""),
    [arrival, setArrival] = useState("30 dakika içinde"),
    [busy, setBusy] = useState(false);
  const place = location === OTHER_PLACE ? customPlace.trim() : location;
  return (
    <Modal
      title={
        coming ? "Yolun kütübe mi düşüyor? 🛵" : "Bir sandalye de senin. 🪑"
      }
      subtitle="Ekibin nerede olduğunu bilsin. Konum takibi yok, söz sende."
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (
            await mutate(
              "/presence",
              { status, location: place, desk, arrival },
              status === "coming"
                ? "Ekibin geleceğini biliyor. Yolun açık olsun!"
                : "Ekibine haber verdik. İyi çalışmalar!",
            )
          )
            close();
          setBusy(false);
        }}
      >
        <div className="status-options">
          {["here", "coming", "break"].map((s) => (
            <button
              type="button"
              className={status === s ? "selected" : ""}
              key={s}
              onClick={() => setStatus(s)}
            >
              {s === "here" ? "📚" : s === "coming" ? "🛵" : "☕"}{" "}
              {STATUS[s][0]}
            </button>
          ))}
        </div>
        {status === "coming" ? (
          <label className="field-label">
            Ne zaman gelirsin?
            <select
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
            >
              {[
                "Şimdi çıkıyorum",
                "15 dakika içinde",
                "30 dakika içinde",
                "1 saat içinde",
                "Öğleden sonra",
                "Akşama doğru",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="field-label">
              Nerede çalışıyorsun?
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {[...PLACES, OTHER_PLACE].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            {location === OTHER_PLACE && (
              <label className="field-label">
                Neresi?
                <input
                  required
                  maxLength={40}
                  value={customPlace}
                  onChange={(e) => setCustomPlace(e.target.value)}
                  placeholder="Örn. 3. kat · Süreli yayınlar"
                />
              </label>
            )}
            <label className="field-label">
              Masa / küçük tarif <span>isteğe bağlı</span>
              <input
                maxLength={16}
                value={desk}
                onChange={(e) => setDesk(e.target.value)}
                placeholder="24 veya pencere yanı"
              />
            </label>
          </>
        )}
        <p className="form-footnote">
          Durumun 8 saat sonra otomatik kapanır. Çıkarken “Çıkış yap” demen
          yeter.
        </p>
        <Busy loading={busy} className="btn primary full" type="submit">
          Ekibe haber ver <ArrowUpRight size={17} />
        </Busy>
      </form>
    </Modal>
  );
}
function InviteModal({ group, close, notify }) {
  const url = `${location.origin}/join/${group.invite}`;
  const shareText = `Kütüpte kim var diye sormaya son. ${group.name} ekibine gel! ✳`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify("Davet bağlantısı kopyalandı. Tayfaya yolla!");
    } catch {
      notify("Kopyalanamadı. Aşağıdaki bağlantıyı seçip kopyalayabilirsin.");
    }
  };
  return (
    <Modal
      title="Tayfayı topluyoruz. 🫶"
      subtitle="Bağlantıyı arkadaş grubuna at. İsimlerini seçip hemen katılsınlar."
      close={close}
    >
      <div className="invite-illustration">
        <span>🪐</span>
        <span>🍒</span>
        <span>🌱</span>
        <span>+</span>
      </div>
      <h3 className="invite-group">{group.name}</h3>
      <label className="field-label">
        Sizin özel davetiniz
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="Davet bağlantısı"
        />
      </label>
      <button className="btn primary full" onClick={copy}>
        <Copy size={17} /> Bağlantıyı kopyala
      </button>
      {navigator.share ? (
        <button
          className="btn outline full"
          onClick={() =>
            navigator
              .share({ title: `${group.name} · Kütüp`, text: shareText, url })
              .catch(() => {})
          }
        >
          <Send size={16} /> Arkadaşlarına gönder
        </button>
      ) : (
        <a
          className="btn outline full"
          href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          <Send size={16} /> WhatsApp’ta paylaş
        </a>
      )}
      <p className="form-footnote">
        Bu bağlantı ekibin anahtarı. Sadece katılmasını istediğin kişilerle
        paylaş.
      </p>
    </Modal>
  );
}
function PlanModal({ close, mutate }) {
  const [date, setDate] = useState(dayInput(1)),
    [time, setTime] = useState("10:00"),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const days = [
    ["Bugün", dayInput()],
    ["Yarın", dayInput(1)],
    ["Öbür gün", dayInput(2)],
  ];
  return (
    <Modal
      title="Güzel bir plan var. 🗓️"
      subtitle="Bir zaman seç. Gerisi bir “ben de gelirim”e bakar."
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const starts = new Date(`${date}T${time}:00+03:00`).getTime();
          if (!Number.isFinite(starts) || starts < Date.now()) {
            setError("Bu saat geçti bile. İleri bir saat seç. 🙂");
            return;
          }
          setError("");
          setBusy(true);
          if (await mutate("/plans", { starts, note }, "Plan panoda. Ekibin katılabilir!"))
            close();
          setBusy(false);
        }}
      >
        <div className="quick-messages day-chips">
          {days.map(([label, value]) => (
            <button
              type="button"
              key={label}
              aria-pressed={date === value}
              className={date === value ? "selected" : ""}
              onClick={() => setDate(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="form-row">
          <label className="field-label">
            Hangi gün?
            <input
              type="date"
              required
              min={dayInput()}
              max={dayInput(14)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="field-label">
            Saat kaçta?
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <label className="field-label">
          Planın adı <span>isteğe bağlı</span>
          <input
            maxLength={80}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn. Sabah erkenciler kulübü"
          />
        </label>
        <p className="form-footnote">
          <MapPin size={14} /> Milli Kütüphane · Saatler Türkiye saatine göre.
          Bildirimi açık olanlara haber gider.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Busy loading={busy} className="btn primary full" type="submit">
          Takvime bırakalım <Plus size={17} />
        </Busy>
      </form>
    </Modal>
  );
}
function CoffeeModal({ close, mutate }) {
  const [text, setText] = useState(
      "10 dakika sonra kafeteryada kahve? Gelen kalp atsın ☕",
    ),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Dersin en iyi arası. ☕"
      subtitle="Ekibe seslen. Bildirimleri açık olanlara da haber gitsin."
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (
            await mutate(
              "/messages",
              { text, kind: "coffee" },
              "Mola davetin panoya düştü. Kahveler hazır mı?",
            )
          )
            close();
          setBusy(false);
        }}
      >
        <label className="field-label">
          Nerede, ne zaman?
          <textarea
            required
            minLength={1}
            maxLength={280}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="quick-messages">
          {[
            "Kafeteryada kahve? ☕",
            "Bahçede 10 dk nefes? 🌿",
            "Yemek molası veren? 🍜",
          ].map((s) => (
            <button type="button" key={s} onClick={() => setText(s)}>
              {s}
            </button>
          ))}
        </div>
        <Busy loading={busy} className="btn primary full" type="submit">
          Tayfaya seslen <Coffee size={17} />
        </Busy>
      </form>
    </Modal>
  );
}
function MemberModal({ member, now, close, mutate }) {
  const since = sinceLabel(member.since, now);
  return (
    <Modal title={member.name} close={close}>
      <div className="member-detail">
        <Avatar member={member} size="large" />
        <Badge status={member.status} />
        <h3>{member.note || "Küçük adımlar, büyük işler."}</h3>
        <p>
          <MapPin size={16} />
          {member.status === "coming"
            ? member.arrival
            : member.status === "away"
              ? "Şimdilik kütüpte değil"
              : `${member.location || "Milli Kütüphane"}${member.desk ? ` · ${member.desk}` : ""}${since ? ` · ${since}` : ""}`}
        </p>
        <div className="detail-stats">
          <div className="detail-stat">
            <Flame size={20} />
            <strong>{minutesLabel(member.focusToday || 0)}</strong>
            <span>bugünün odağı</span>
          </div>
          <div className="detail-stat">
            <Trophy size={20} />
            <strong>{minutesLabel(member.focusWeek || 0)}</strong>
            <span>bu hafta</span>
          </div>
          <div className="detail-stat">
            <span aria-hidden="true">🏘️</span>
            <strong>{member.buildings || 0} bina</strong>
            <span>köyünde</span>
          </div>
        </div>
      </div>
      <button
        className="btn primary full"
        onClick={async () => {
          if (
            await mutate(
              "/messages",
              {
                text: `${member.name}, bir kahve molası verelim mi? ☕`,
                kind: "coffee",
              },
              "Kahve davetin panoda!",
            )
          )
            close();
        }}
      >
        <Coffee size={17} /> Kahveye çağır
      </button>
      <p className="form-footnote">
        Davet ekip panosuna düşer; özel mesaj değildir.
      </p>
    </Modal>
  );
}
function AmbientSound() {
  const [playing, setPlaying] = useState(false),
    audio = useRef(null);
  useEffect(
    () => () => {
      audio.current?.close();
    },
    [],
  );
  const toggle = () => {
    if (playing) {
      audio.current?.close();
      audio.current = null;
      setPlaying(false);
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext(),
      buffer = context.createBuffer(
        1,
        context.sampleRate * 4,
        context.sampleRate,
      ),
      output = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < output.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      output[i] = last * 3.5;
    }
    const source = context.createBufferSource(),
      gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0.23;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    audio.current = context;
    setPlaying(true);
  };
  return (
    <section className="ambient-card">
      <span>🌧️</span>
      <div>
        <h3>Şehir biraz sussun.</h3>
        <p>Yumuşak bir arka plan sesi.</p>
      </div>
      <button
        aria-label={playing ? "Ortam sesini kapat" : "Ortam sesini aç"}
        aria-pressed={playing}
        className={`icon-button ${playing ? "playing" : ""}`}
        onClick={toggle}
      >
        {playing ? <Volume2 size={21} /> : <VolumeX size={21} />}
      </button>
    </section>
  );
}
// Getting notifications working is the whole point of Kütüp, so the home screen
// walks people through it until they turn it on (or hide the card).
function SetupCard({ enable, busy }) {
  const [hidden, setHidden] = useState(storage.get("kutup-setup-hidden") === "1");
  if (hidden || (!pushSupported && !isIOS)) return null;
  const needsHomeScreen = isIOS && !standalone;
  return (
    <section className="setup-card">
      <span className="setup-emoji">{needsHomeScreen ? "📲" : "🔔"}</span>
      <div>
        <strong>
          {needsHomeScreen
            ? "iPhone’da bildirim için bir adım var."
            : "Biri kütübe gelince haberin olsun."}
        </strong>
        <p>
          {needsHomeScreen ? (
            <>
              Safari’de <b>Paylaş</b> → <b>Ana Ekrana Ekle</b>. Sonra Kütüp’ü
              ana ekrandan aç, kullanıcı adınla giriş yap ve 🔔’a bas.
            </>
          ) : (
            "Arkadaşın gelince, kahveye çağırınca ya da plan yapınca telefonuna düşsün."
          )}
        </p>
      </div>
      {!needsHomeScreen && (
        <Busy loading={busy} className="btn primary" onClick={() => enable()}>
          {!busy && <Bell size={16} />} Bildirimleri aç
        </Busy>
      )}
      <button
        className="icon-button setup-close"
        aria-label="Bu kartı gizle"
        onClick={() => {
          storage.set("kutup-setup-hidden", "1");
          setHidden(true);
        }}
      >
        <X size={17} />
      </button>
    </section>
  );
}
function WeekBoard({ members, me }) {
  const ranked = members
    .filter((m) => m.focusWeek > 0)
    .sort((a, b) => b.focusWeek - a.focusWeek);
  const top = ranked[0]?.focusWeek || 1;
  return (
    <section className="panel week-board">
      <div className="section-heading">
        <h2>Haftanın odak tablosu</h2>
        <Trophy size={18} />
      </div>
      {ranked.length ? (
        <ol>
          {ranked.map((m, i) => (
            <li key={m.id} className={m.id === me?.id ? "mine" : ""}>
              <span className="week-rank">{["🥇", "🥈", "🥉"][i] || i + 1}</span>
              <Avatar member={m} size="tiny" />
              <strong>
                {m.name}
                {m.id === me?.id ? " (sen)" : ""}
              </strong>
              <span className="week-bar" aria-hidden="true">
                <i style={{ width: `${Math.max(6, (m.focusWeek / top) * 100)}%` }} />
              </span>
              <small>
                {minutesLabel(m.focusWeek)}
                {m.buildsWeek > 0 && (
                  <span className="week-trees" title={`Bu hafta ${m.buildsWeek} bina`}>
                    {" "}
                    🏠{m.buildsWeek > 1 ? `×${m.buildsWeek}` : ""}
                  </span>
                )}
              </small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted small">
          Bu hafta henüz biten seans yok. İlk 25 dakika tabloyu açar. 🌱
        </p>
      )}
      <p className="week-note">Pazartesi sıfırlanır · tamamlanan seanslar sayılır</p>
    </section>
  );
}
