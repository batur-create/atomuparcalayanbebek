import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, m as M } from "motion/react";
// Motion's animation and layout engine loads after the first paint.
const motionFeatures = () => import("./motionFeatures.js").then((r) => r.default);
import {
  ArrowUpRight,
  Expand,
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
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
  Reply,
  Send,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  api,
  get,
  themeOf,
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
  screenAwake,
  storage,
  isIOS,
  standalone,
} from "./ui.jsx";
import { FeedbackPage, useRequestUpdates } from "./Requests.jsx";
import { OwnerPage } from "./Owner.jsx";
import { KaraBuddy } from "./Kara.jsx";
import { openBlackHole } from "./BlackHole.jsx";
import { kindFor } from "./Village.jsx";
import { BY_ID, CHAIN_GAP, CLASSES, GRACE, RHYTHMS, fits, minutesOf, modelOf, refundLater, refundNow, rhythmAt, rhythmEnd, streakBonus, teaBreakFor, wageFor } from "../shared/catalog.js";
import { BuildingThumb, CatalogModal, ReceiptCard } from "./Economy.jsx";
import { MemberStats } from "./Stats.jsx";
import { SoundButton, SoundPanel, useSoundFollowsFocus } from "./Sound.jsx";
import { FocusScreen, enterFullscreen } from "./FocusScreen.jsx";
import { CallOverlay, DeskMates, JoinBanner, MessageBanner, seenBy } from "./Together.jsx";
import { VillagePanel, useVillage } from "./VillageMap.jsx";
import { Modal } from "./Modal.jsx";
import { SignIn, ProfileModal, LookModal, AccountModal, ModeButton, leaveTeam } from "./Account.jsx";
import { Entry } from "./Entry.jsx";
import { EmptyState, IosGuide, Loading } from "./Illustrations.jsx";
import { Home, Badge, Kinetic, FaceButton } from "./Home.jsx";
import { MePage, TeamModal } from "./MePage.jsx";
import { useMotionPref } from "./motionPref.js";
import { darkAt } from "./villageWorld.js";
import { mergeState } from "./sync.js";
import { paintBar, useColorMode } from "./colorMode.js";

// Four tabs (n17): who is where (with plans), the village, the board, and me.
// Old "?tab=plans" links (plan notifications) open the plans on the home page.
const nav = [
  { id: "home", label: "Kütüp", icon: LayoutGrid },
  { id: "focus", label: "Köy", icon: House },
  { id: "board", label: "Pano", icon: MessageCircle },
  { id: "me", label: "Ben", icon: CircleUserRound },
];
const TABS = ["home", "focus", "board", "me", "feedback"];
const PAGE = {
  focus: ["EKİPLE HER ŞEY DAHA İYİ", "Odaklan, köy büyüsün.", "Her seans köye bir bina. Kulaklıkları tak, telefonu bırak."],
  board: ["EKİPLE HER ŞEY DAHA İYİ", "Bizim küçük köşe.", "Yer tutmalar, küçük notlar, büyük motivasyonlar."],
  me: ["TAM SENLİK BİR KÖŞE", "Ben.", "Profilin, görünümün, hesabın. Bir de Batur’a iletmek istediklerin."],
  feedback: ["BU PLATFORM BİRAZ DA SENİN", "Söz sende.", "Fikirler, takılan şeyler, güzel iki kelime. Hepsi Batur’a."],
};
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
    [theme, setTheme] = useState(() => themeOf(storage.get("kutup-theme")));
  const [mode, setMode] = useColorMode();
  const [motionPick, setMotion, motion] = useMotionPref();
  const [invite, setInvite] = useState(
      location.pathname.startsWith("/join/")
        ? location.pathname.split("/")[2]
        : "",
    ),
    [inviteInfo, setInviteInfo] = useState(null),
    [entryStart, setEntryStart] = useState(0);
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
  // Batur's door: holding a ✳ for a moment, or typing "batur" anywhere
  // outside a text field, opens a black hole. It only shows
  // the door; the panel still asks for the key (or the remembered owner cookie).
  useEffect(() => {
    let hold = 0,
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
      clearTimeout(hold);
      hold = setTimeout(open, 1200);
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
  const [receipt, setReceipt] = useState(null);
  const [focusScreen, setFocusScreen] = useState(false);
  // An invite notification opens "/?join=<friend>": offer to join their session.
  const [joinAsk, setJoinAsk] = useState(() => startParams.get("join"));
  const togetherRef = useRef(false),
    seenSent = useRef(0),
    friendsBefore = useRef(new Map());
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
    const friend = data.members.find((m) => fresh.includes(m.id) && m.id !== session.memberId);
    // On the home tab Kara says it from the library roof.
    if (friend && tab !== "home") notify(`📍 ${friend.name} kütübe geldi · ${friend.location || "Milli Kütüphane"}`, 3500);
    setArrived((list) => [...list, ...fresh]);
    setTimeout(
      () => setArrived((list) => list.filter((id) => !fresh.includes(id))),
      4200,
    );
  }, [data, session]);
  const me = data.members.find((m) => m.id === session?.memberId);
  const { village, like, error: villageError, retry: retryVillage } = useVillage(session, data.group.villageRev);
  useSoundFollowsFocus(!!me?.focusEnd && me.focusEnd > now);
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
    paintBar();
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
        })
        .catch((e) => {
          notify(e.message);
          setInvite("");
          history.replaceState({}, "", "/");
        });
    return () => clearTimeout(toastTimer.current);
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
      const item = modelOf(me.focusModel, kindFor(me.focusMinutes));
      lastFocus.current = {
        end: me.focusEnd,
        minutes: me.focusMinutes,
        strict: !!me.focusStrict,
        kind: item.kind,
        model: item.id,
        seed: me.focusSeed,
        week: me.focusWeek || 0,
        cost: me.focusCost || 0,
      };
      return;
    }
    const done = lastFocus.current;
    lastFocus.current = null;
    if (!done) return;
    const item = BY_ID[done.model];
    const outcome = (type) =>
      setBuildOutcome({ type, kind: done.kind, model: done.model, seed: done.seed, at: Date.now() });
    if (done.end > Date.now() + 2000) {
      // Gave up or left the app; in the first two minutes nothing collapses.
      const early = Date.now() - (done.end - done.minutes * 60000) < GRACE + 5000;
      if (done.strict && !early) outcome("collapsed");
      if (done.strict && done.cost) setReceipt({ end: done.end, type: early ? "cancelled" : "collapsed", at: Date.now() });
      return;
    }
    if ((me?.focusWeek || 0) > done.week) {
      if (done.strict) outcome("built");
      notify(
        done.strict
          ? `${item.name} bitti! ${item.emoji} Köyüne eklendi.`
          : `İşte bu! ${done.minutes} dakika cebinde. Şimdi bir nefes. 🌱`,
      );
      navigator.vibrate?.([120, 80, 120]);
      // The receipt waits for the handover ceremony to get going.
      setReceipt({ end: done.end, type: done.strict ? "built" : "plain", delay: done.strict ? 2600 : 600, at: Date.now(), together: togetherRef.current });
    } else if (done.strict) {
      outcome("collapsed");
      notify("İnşaat çöktü 🧱 Bu sefer telefon kazandı.");
      setReceipt({ end: done.end, type: "collapsed", delay: 1200, at: Date.now() });
    }
  }, [me?.focusEnd]);
  const buildRun = useMemo(
    () =>
      me?.focusStrict && me.focusEnd > Date.now()
        ? { endsAt: me.focusEnd, minutes: me.focusMinutes, pausedAt: me.focusPausedAt || 0, ...(({ kind, id }) => ({ kind, model: id }))(modelOf(me.focusModel, kindFor(me.focusMinutes))), seed: me.focusSeed }
        : null,
    [me?.focusStrict, me?.focusEnd, me?.focusMinutes, me?.focusSeed, me?.focusModel, me?.focusPausedAt],
  );
  // Build mode: keep the screen on, report presence, and let the building collapse
  // when the session is abandoned. On a phone that means leaving the app for
  // more than a minute (with a notification when you leave and at 30 seconds);
  // on a computer other tabs and apps are part of studying, so only closing the
  // tab or the computer going to sleep for a while brings it down.
  const strictEnd = me?.focusStrict && me.focusEnd > Date.now() ? me.focusEnd : 0;
  // While on a tea break (and until it would have ended) leaving the app is fine.
  const pauseUntil = useRef(0);
  pauseUntil.current = me?.focusPausedAt ? me.focusPausedAt + teaBreakFor(me.focusMinutes) : pauseUntil.current;
  useEffect(() => {
    if (!strictEnd) return releaseScreen();
    const desk = onComputer();
    const GRACE = desk ? 120000 : 60000;
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
    // On a computer the tab keeps reporting while hidden (browsers slow such
    // timers to about once a minute, well inside the server's 90 seconds).
    const pulse = setInterval(() => {
      if (desk || document.visibilityState === "visible") beat();
    }, 20000);
    // A local "still here" mark every few seconds, so a page reload is not
    // mistaken for leaving the app.
    const mark = setInterval(() => {
      if (desk || document.visibilityState === "visible") remember();
    }, 3000);
    // Phone: a notification the moment you leave, another at 30 seconds.
    let reminder = 0;
    const warn = (body) =>
      navigator.serviceWorker?.getRegistration?.().then((r) =>
        r?.showNotification("🏗️ Şantiyen seni bekliyor", { body, tag: "kutup-build", renotify: true, requireInteraction: true, data: { url: location.href } }),
      ).catch(() => {});
    const unwarn = () => {
      clearTimeout(reminder);
      navigator.serviceWorker?.getRegistration?.().then((r) => r?.getNotifications({ tag: "kutup-build" })).then((list) => list?.forEach((n) => n.close())).catch(() => {});
    };
    const visibility = () => {
      if (desk) {
        if (document.visibilityState === "visible") beat();
        return;
      }
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        remember();
        if (pauseUntil.current > Date.now()) return;
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          warn("1 dakika içinde dönmezsen inşaatın yıkılır. Dokun, hemen dön.");
          reminder = setTimeout(() => warn("Son 30 saniye! Dönmezsen inşaat yıkılacak."), 30000);
        }
        return;
      }
      unwarn();
      const away = hiddenAt ? Date.now() - Math.max(hiddenAt, pauseUntil.current) : 0;
      hiddenAt = null;
      if (away > GRACE) return wither();
      if (away > 1500) notify("Az kalsın! Şantiye seni bekledi 🏗️");
      keepScreenOn();
      beat();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      unwarn();
      clearInterval(pulse);
      clearInterval(mark);
      document.removeEventListener("visibilitychange", visibility);
      releaseScreen();
    };
  }, [strictEnd]);
  const focusLeft = me?.focusEnd > now ? Math.ceil((me.focusEnd - (me.focusPausedAt || now)) / 1000) : 0;
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
  // onError: show the failure where the person is looking (e.g. inside a form)
  // instead of a toast that may sit behind it.
  const mutate = async (path, body, success, method = "POST", onError) => {
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
      else if (onError) onError(e.message);
      else notify(e.message);
      return false;
    }
  };
  const navigate = (id) => {
    setTab(id);
    if (id !== "board") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [markSpin, setMarkSpin] = useState(false);
  const topTap = () => {
    setMarkSpin(true);
    if (window.scrollY > 40) window.scrollTo({ top: 0, behavior: "smooth" });
    else if (tab !== "home") navigate("home");
  };
  // A plan notification ("?tab=plans") lands on the plans part of the home page.
  useEffect(() => {
    if (startParams.get("tab") !== "plans" || !session) return;
    const timer = setTimeout(() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "center" }), 700);
    return () => clearTimeout(timer);
  }, [!!session]);
  const dark = darkAt(mode, now);
  // The clock re-draws the whole app, so it ticks every second only while a
  // second can show (a running timer, the village tab, the focus screen) and
  // every 15 seconds otherwise. Coming back to the app refreshes it at once.
  const fastClock = tab === "focus" || focusScreen || me?.focusEnd > now || !!data.group.rhythm;
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), fastClock ? 1000 : 15000);
    const wake = () => document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", wake);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [fastClock]);
  // Tabs slide in from the side they sit on.
  const order = { home: 0, focus: 1, board: 2, me: 3, feedback: 4 };
  const lastTab = useRef(tab),
    slide = useRef(1);
  if (lastTab.current !== tab) {
    slide.current = (order[tab] ?? 0) >= (order[lastTab.current] ?? 0) ? 1 : -1;
    lastTab.current = tab;
  }
  const leave = () => me && leaveTeam(me, notify, () => signedOut("Ekipten ayrıldın. Kapımız hep açık. 🫶"));
  // Joining a friend's timer builds the picked building if it fits, a cottage otherwise.
  const joinFriend = (m) =>
    m &&
    requireMember(async () => {
      const strict = storage.get("kutup-fidan-on") !== "0",
        picked = BY_ID[pickedModel()];
      if (strict) keepScreenOn();
      await mutate(
        "/focus",
        { action: "start", joinMember: m.id, strict, model: fits(picked, Math.floor((m.focusEnd - Date.now()) / 60000)) && picked.cost <= (me?.bricks || 0) ? picked.id : "kulube" },
        "Aynı ritimdesiniz. İyi çalışmalar! 🤝",
      );
      setJoinAsk(null);
    });
  // Unread board messages, and telling friends how far I have read.
  const unread = me ? data.messages.filter((m) => m.kind !== "system" && m.memberId !== me.id && m.created > (me.boardSeen || 0)).length : 0;
  useEffect(() => {
    if (tab !== "board" || !me || document.visibilityState !== "visible") return;
    const latest = Math.max(0, ...data.messages.filter((m) => m.kind !== "system").map((m) => m.created));
    if (latest > (me.boardSeen || 0) && latest > seenSent.current) {
      seenSent.current = latest;
      api("/seen", { at: latest }).catch(() => {});
    }
  }, [tab, data.messages, me?.boardSeen]);
  // While I focus, a friend finishing, giving up or sitting down is worth a word.
  if (me?.focusEnd > 0) togetherRef.current = data.members.some((o) => o.id !== me.id && o.focusEnd === me.focusEnd);
  useEffect(() => {
    const before = friendsBefore.current,
      next = new Map(),
      focusing = me?.focusEnd > Date.now();
    for (const m of data.members) {
      if (m.id === me?.id) continue;
      next.set(m.id, { end: m.focusEnd, strict: m.focusStrict });
      const was = before.get(m.id);
      if (!was || !focusing) continue;
      if (was.end > 0 && !m.focusEnd)
        notify(was.end <= Date.now() + 5000 ? `🎉 ${m.name} seansını bitirdi` : was.strict ? `🧱 ${m.name}: inşaat çöktü` : `${m.name} seansı bıraktı`, 3500);
      else if (!was.end && m.focusEnd > Date.now()) notify(`🎧 ${m.name} masaya oturdu · ${Math.ceil((m.focusEnd - Date.now()) / 60000)} dk`, 3500);
    }
    friendsBefore.current = next;
  }, [data.members]);
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
        <Loading big text="Bir sandalye çekiyoruz…" />
      </div>
    );
  if (!session)
    return (
      <LazyMotion features={motionFeatures} strict>
      <MotionConfig reducedMotion={motionPick === "still" ? "always" : motionPick ? "never" : "user"}>
        <Entry invite={invite} inviteInfo={inviteInfo} open={(next) => setModal(next)} onSuccess={joinSuccess} now={now} dark={dark} start={entryStart} />
        {(modal === "onboard" || modal === "login") && (
          <SignIn invite={invite} close={() => setModal(null)} onSuccess={joinSuccess} onNew={() => (setModal(null), setEntryStart((n) => n + 1))} />
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
      </MotionConfig>
      </LazyMotion>
    );
  const visibleMembers = data.members.filter(
    (m) =>
      filter === "all" ||
      (filter === "here"
        ? ["here", "break"].includes(m.status)
        : m.status === filter),
  );
  return (
    <LazyMotion features={motionFeatures} strict>
    <MotionConfig reducedMotion={motionPick === "still" ? "always" : motionPick ? "never" : "user"}>
    <div
      className={`app-shell ${intro ? "intro" : ""} ${
        data.messages.some((m) => m.kind !== "system" && m.text.trim().toLocaleLowerCase("tr") === "çay" && now - m.created < 60000)
          ? "tea-time"
          : ""
      }`}
    >
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Kütüp ana sayfa"
        >
          kütüp<span data-door="">✳</span>
        </button>
        <M.button whileTap={{ scale: 0.97 }} className="group-switch" title={data.group.name} onClick={() => requireMember(() => setModal("team"))}>
          <span className="group-symbol">✷</span>
          <div>
            <strong>{data.group.name}</strong>
            <small>
              {session
                ? `${data.members.length} kişilik güzel bir ekip`
                : "Senin ekibin, senin köşen"}
            </small>
          </div>
        </M.button>
        <span className="nav-caption">BİZİM ALAN</span>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id || (item.id === "me" && tab === "feedback") ? "active" : ""}`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "board" && unread > 0 && <b className="nav-count" aria-label={`${unread} okunmamış mesaj`}>{unread}</b>}
              {item.id === "me" && requestUpdates.count > 0 && <b className="nav-count" aria-label={`${requestUpdates.count} yeni gelişme`}>{requestUpdates.count}</b>}
              {item.id === "focus" && focusMembers.length > 0 && (
                <span className="nav-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a
            className="library-note"
            href="https://www.google.com/maps/search/?api=1&query=Milli+K%C3%BCt%C3%BCphane+Ankara"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Milli Kütüphane yol tarifi (haritada açılır)"
          >
            <BookOpen size={24} />
            <div>
              <strong>Milli Kütüphane</strong>
              <span className="library-live">{here.length ? `Şu an ${here.length} kişi burada` : "Ankara’da bir çalışma bahanesi."}</span>
              <span className="library-go">
                <MapPin size={13} /> Yol tarifi
              </span>
            </div>
          </a>
          <button
            className="sidebar-profile"
            onClick={() => requireMember(() => navigate("me"))}
          >
            <Avatar member={me} size="small" />
            <span>
              <strong>{me?.name || "Senin yerin hazır"}</strong>
              <small>
                {me ? "Profilini güzelleştir" : "Ekibine katıl, yerini al"}
              </small>
            </span>
            <ChevronRight size={18} />
          </button>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            {/* n27: the page's name with the mark; a tap goes back to the top,
                or (already at the top) to the home page. */}
            <button type="button" className={`page-title ${markSpin ? "spin" : ""}`} onClick={topTap} onAnimationEnd={() => setMarkSpin(false)}>
              <span className="page-mark" aria-hidden="true">
                ✳
              </span>
              <strong>{tab === "feedback" ? "Batur’a ilet" : nav.find((x) => x.id === tab)?.label}</strong>
            </button>
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
            <ModeButton mode={mode} setMode={setMode} />
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
          </div>
        </header>
        {session && !connected && (
          <div className="connection-banner">
            <LoaderCircle size={14} className="spin" /> Canlı bağlantı
            yenileniyor. Durumlar yeniden eşitlenecek.
          </div>
        )}
        <div className="page-content">
          <AnimatePresence mode="wait" initial={false} custom={slide.current}>
          <M.div
            className="tab-stage"
            key={tab}
            custom={slide.current}
            variants={{
              enter: (d) => ({ opacity: 0, x: 34 * d }),
              show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 380, damping: 34 } },
              leave: (d) => ({ opacity: 0, x: -22 * d, transition: { duration: 0.12, ease: "easeIn" } }),
            }}
            initial="enter"
            animate="show"
            exit="leave"
          >
          {tab !== "home" && (
            <div className="page-heading">
              <div>
                {tab === "feedback" && (
                  <button className="text-button back-link" onClick={() => navigate("me")}>
                    <ChevronLeft size={15} /> Ben
                  </button>
                )}
                <div className="eyebrow">{PAGE[tab][0]}</div>
                <Kinetic as="h1" when="mount" delay={0.08} text={PAGE[tab][1]} />
                <p>{PAGE[tab][2]}</p>
              </div>
            </div>
          )}
          {tab === "home" && (
            <Home
              data={data}
              me={me}
              now={now}
              dark={dark}
              intro={intro}
              arrived={arrived}
              filter={filter}
              setFilter={setFilter}
              unread={unread}
              setModal={setModal}
              requireMember={requireMember}
              mutate={mutate}
              navigate={navigate}
              village={village}
              extras={
                <>
                  {session && !notificationOn && <SetupCard enable={enableNotifications} busy={notificationWorking} />}
                  {session && !session.username && (
                    <button className="account-nudge" onClick={() => setModal("account")}>
                      <KeyRound size={18} />
                      <span>
                        <strong>Hesabını koru</strong>
                        <small>Kullanıcı adı ve şifre belirle; başka bir telefondan ya da tarayıcıdan girince profilin seni beklesin.</small>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </>
              }
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
                onScreen={() => setFocusScreen(true)}
                rhythm={data.group.rhythm}
                outcome={buildOutcome}
                onJoin={joinFriend}
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
                  week={data.week}
                />
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
                openTeam={() => setModal("team")}
                openMember={(x) => (x.id === me?.id ? navigate("me") : setModal({ member: x }))}
                openPlans={() => {
                  navigate("home");
                  setTimeout(() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "center" }), 450);
                }}
              />
              <div className="right-stack">
                <CoffeeCard
                  requireMember={requireMember}
                  onCoffee={() => setModal("coffee")}
                />
                <div className="board-guideline board-note">
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
          {tab === "me" && (
            <MePage me={me} group={data.group} size={data.members.length} requests={requestUpdates.count} setModal={setModal} navigate={navigate} leave={leave} />
          )}
          {tab === "feedback" && (
            <FeedbackPage
              me={me}
              requireMember={requireMember}
              notify={notify}
              onSeen={requestUpdates.clear}
            />
          )}
          </M.div>
          </AnimatePresence>
          <footer className="page-footer">
            <span>
              Biraz çalışma, biraz muhabbet. <span data-door="">kütüp ✳</span>
            </span>
            <span data-note="">Batur’dan, bizim tayfaya.</span>
          </footer>
        </div>
      </main>
      <nav className="mobile-bottom" aria-label="Bölümler">
        {nav.map((item) => {
          const active = tab === item.id || (item.id === "me" && tab === "feedback");
          return (
            <button
              key={item.id}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              {active && <M.span layoutId="tab-pill" className="tab-pill" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <M.span key={active ? "on" : "off"} className="tab-icon" initial={active ? { y: -4, scale: 1.12 } : false} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 14 }}>
                <Icon name={item.icon} />
              </M.span>
              <span>{item.label}</span>
              {item.id === "board" && unread > 0 && <i className="nav-badge" aria-hidden="true" />}
              {item.id === "me" && requestUpdates.count > 0 && <i className="nav-badge" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>
      {modal === "profile" && me && <ProfileModal me={me} close={() => setModal(null)} mutate={mutate} />}
      {modal === "look" && <LookModal theme={theme} setTheme={setTheme} mode={mode} setMode={setMode} motion={motion} setMotion={setMotion} close={() => setModal(null)} />}
      {modal === "team" && (
        <TeamModal data={data} me={me} now={now} close={() => setModal(null)} invite={() => setModal("invite")} openMember={(x) => (x.id === me?.id ? (setModal(null), navigate("me")) : setModal({ member: x }))} />
      )}
      {modal === "account" && (
        <AccountModal
          username={session?.username}
          onAccount={(username) => setSession((x) => ({ ...x, username }))}
          notify={notify}
          close={() => setModal(null)}
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
      {focusScreen && <FocusScreen me={me} members={data.members} now={now} run={buildRun} outcome={buildOutcome} close={() => setFocusScreen(false)} />}
      <JoinBanner
        friend={data.members.find((x) => x.id === joinAsk)}
        me={me}
        now={now}
        join={() => joinFriend(data.members.find((x) => x.id === joinAsk))}
        close={() => {
          setJoinAsk(null);
          history.replaceState(null, "", location.pathname);
        }}
      />
      <CallOverlay data={data} me={me} reply={(call, text) => mutate("/messages", { text, replyTo: call.id }, "Cevabın gitti ☕")} seen={(at) => api("/seen", { at }).catch(() => {})} />
      {me && (
        <MessageBanner
          data={data}
          me={me}
          onBoard={tab === "board"}
          onHome={tab === "home"}
          focusScreen={focusScreen}
          open={() => {
            setFocusScreen(false);
            navigate("board");
          }}
        />
      )}
      {receipt && (
        <ReceiptCard
          key={receipt.at}
          receipt={receipt}
          close={() => setReceipt(null)}
          next={receipt.type === "built" || receipt.type === "plain" ? streakBonus((me?.chain || 0) + 1) : null}
          onContinue={async () => {
            // Keep the streak going: 25 more minutes, building the picked small
            // building if it is affordable, a cottage otherwise.
            const strict = storage.get("kutup-fidan-on") !== "0",
              picked = BY_ID[pickedModel()],
              model = picked.class === "small" && picked.cost <= (me?.bricks || 0) ? picked.id : "kulube";
            if (strict) keepScreenOn();
            setReceipt(null);
            await mutate(
              "/focus",
              { action: "start", minutes: 25, strict, ...(strict ? { model } : {}), ...(receipt.together ? { invite: true } : {}) },
              strict ? `Seri sürüyor 🔥 ${BY_ID[model].name} için temel atıldı.` : "Seri sürüyor 🔥 25 dakika daha.",
            );
          }}
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
    </MotionConfig>
    </LazyMotion>
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
// A computer (mouse or trackpad) rather than a phone or tablet: build mode is
// gentler there, since other tabs and apps are where the studying happens.
const onComputer = () => typeof matchMedia === "function" && !matchMedia("(pointer: coarse)").matches;
// The building picked for the next build-mode session (kept on this device).
const pickedModel = () => (BY_ID[storage.get("kutup-model")] ? storage.get("kutup-model") : "kulube");
const clockTR = (t) => {
  const d = new Date(t + 3 * 3600000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};
const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
function FocusCard({ me, members, now, requireMember, mutate, compact, onScreen, rhythm = null, outcome = null, onJoin }) {
  const [duration, setDuration] = useState(25),
    [busy, setBusy] = useState(false),
    [fidan, setFidan] = useState(() => storage.get("kutup-fidan-on") !== "0"),
    [model, setModel] = useState(pickedModel),
    [picking, setPicking] = useState(false),
    [mixer, setMixer] = useState(false),
    [invite, setInvite] = useState(() => storage.get("kutup-invite") === "1");
  const finishing = !!me?.focusEnd && me.focusEnd <= now;
  const running = !!me?.focusEnd && !finishing;
  // Build mode: the building sets the length. Free focus: you pick it. Under
  // the team rhythm the round does: the session ends at the shared break.
  const item = running ? modelOf(me.focusModel, kindFor(me.focusMinutes)) : BY_ID[model];
  const round = rhythm && RHYTHMS[rhythm] ? rhythmAt(rhythm, now) : null,
    roundMinutes = round ? Math.floor((rhythmEnd(rhythm, now) - now) / 60000) : 0;
  const length = round ? roundMinutes : fidan ? minutesOf(item) : duration;
  const tooBig = !!round && fidan && !running && !fits(item, roundMinutes);
  const pausedAt = running ? me.focusPausedAt || 0 : 0,
    teaMax = running ? teaBreakFor(me.focusMinutes) : 0,
    teaLeft = pausedAt ? Math.max(0, pausedAt + teaMax - now) : 0;
  const seconds = running ? Math.max(0, Math.ceil((me.focusEnd - (pausedAt || now)) / 1000)) : length * 60;
  const progress = running ? 1 - seconds / ((me.focusMinutes || length) * 60) : 0;
  const growing = running && !!me?.focusStrict;
  const bricks = me?.bricks || 0,
    short = fidan && !running ? Math.max(0, item.cost - bricks) : 0;
  const early = growing && !me.focusPauseUsed && now - (me.focusEnd - me.focusMinutes * 60000) < GRACE;
  const ruin = me?.ruinUntil > now && me?.ruinRefund > 0 ? me.ruinRefund : 0;
  // A streak stays open for ten minutes after a finished session.
  const streakLeft = !running && !finishing && me?.chainEnd ? CHAIN_GAP - (now - me.chainEnd) : 0,
    streakNext = streakBonus((me?.chain || 0) + 1);
  const pick = (id) => {
    setModel(id);
    storage.set("kutup-model", id);
  };
  const tea = (action) =>
    mutate("/focus", { action }, action === "pause" ? `Çay molası ☕ İnşaat ${teaMax / 60000} dakika bekliyor; uygulamadan çıkabilirsin.` : "Molaya son, işçiler sahada! 🏗️");
  // The break runs out: back to work by itself.
  const resumed = useRef(0);
  useEffect(() => {
    if (pausedAt && teaLeft === 0 && resumed.current !== pausedAt) {
      resumed.current = pausedAt;
      tea("resume");
    }
  }, [pausedAt, teaLeft === 0]);
  const control = async () => {
    if (growing) {
      const cost = me.focusCost || 0,
        name = item.name.toLocaleLowerCase("tr");
      const warning = early
        ? `İlk 2 dakikadasın: vazgeçersen ${cost ? `${cost} 🧱 malzemenin tamamı geri gelir` : "hiçbir şey kaybetmezsin"}.`
        : cost
          ? `Pes edersen ${name} yıkılır ve bu seansın dakikaları yazılmaz.\n\n${refundNow(cost)} 🧱 hemen geri gelir; enkazı bir sonraki seansın kaldırınca ${refundLater(cost)} 🧱 daha. ${cost - refundNow(cost) - refundLater(cost)} 🧱 gider.`
          : `Pes edersen ${name} yıkılır ve bu seansın dakikaları yazılmaz.`;
      if (!confirm(`${warning}\n\nEmin misin?`)) return;
    }
    if (!running && fidan) keepScreenOn(); // needs the tap itself on some phones
    setBusy(true);
    await mutate(
      "/focus",
      running ? { action: "cancel" } : { action: "start", minutes: length, strict: fidan, rhythm: !!round, invite, ...(fidan ? { model: item.id } : {}) },
      running
        ? growing
          ? early
            ? "Vazgeçtin; malzeme kasana geri döndü. Hazır olunca yeniden."
            : "İnşaat çöktü 🧱 Bir dahakine sonuna kadar!"
          : "Seans durdu. Hazır olunca yeniden başla."
        : fidan
          ? `Temel atıldı 🏗️ ${item.name} yükseliyor. Uygulamada kal, ekran açık kalacak.`
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
        <button type="button" className="brick-chip" aria-label={`Tuğla kasan: ${bricks} tuğla`} onClick={() => setPicking("wallet")}>
          🧱 {bricks}
        </button>
        {growing ? (
          <span className="focus-plant" aria-label={`${item.name} inşa ediliyor`}>
            {item.emoji}
          </span>
        ) : (
          <span className="focus-spark">✧</span>
        )}
      </div>
      <h2>
        {growing
          ? `${item.name} yükseliyor.`
          : running
            ? "Şu an kendin için."
            : "Bir küçük odak arası."}
      </h2>
      <div className="timer-wrap">
        {!compact && <KaraBuddy me={me} now={now} item={item} outcome={outcome} />}
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
            stroke="var(--pop)"
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
              ? onComputer()
                ? "🏗️ sekmeler serbest, bu sekmeyi kapatma"
                : "🏗️ çıkarsan 1 dk içinde dön"
              : running
                ? "sen, işin ve biraz sessizlik"
                : "dakika sadece kendine"}
          </span>
        </div>
      </div>
      {!compact && !running && !finishing && (
        <div className="mode-switch" role="group" aria-label="Çalışma şekli">
          {[
            [true, "🏗️", "İnşaat", "köye bina, tam maaş"],
            [false, "🎧", "Serbest", "risk yok, yarım maaş"],
          ].map(([on, icon, label, hint]) => (
            <button
              key={label}
              type="button"
              className={fidan === on ? "on" : ""}
              aria-pressed={fidan === on}
              onClick={() => {
                setFidan(on);
                storage.set("kutup-fidan-on", on ? "1" : "0");
              }}
            >
              <span aria-hidden="true">{icon}</span>
              <b>{label}</b>
              <small>{hint}</small>
            </button>
          ))}
        </div>
      )}
      {!running && !finishing && fidan && (
        <button type="button" className="build-pick" onClick={() => setPicking(true)}>
          <BuildingThumb id={item.id} size={62} />
          <span>
            <b>
              {item.emoji} {item.name}
            </b>
            <small>
              {CLASSES[item.class].label} · {length} dk · {item.cost ? `${item.cost} 🧱 malzeme` : "bedava"} · bitince +{wageFor(length)} 🧱
            </small>
          </span>
          <span className="build-pick-change">Değiştir</span>
        </button>
      )}
      {!running && !finishing && !fidan && (
        <>
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
        </>
      )}
      {!compact && !running && !finishing && (
        <p className="mode-hint">
          {fidan
            ? onComputer()
              ? "Bitince köyüne eklenir. Bu sekmeyi kapatma."
              : "Bitince köyüne eklenir. Çıkarsan 1 dk içinde dön."
            : `Yapı yok, risk yok: ${duration} dk → ${wageFor(duration, false)} 🧱.`}
        </p>
      )}
      {round && !running && !finishing && (
        <p className="rhythm-note">
          {round.inBreak
            ? `☕ Ortak mola · yeni tur ${mmss(round.nextRound - now)} sonra (${round.label})`
            : `🕐 ${round.label} ritmi · bu turun bitişi ${clockTR(round.workEnd)} · şimdi başlarsan ${roundMinutes} dk`}
        </p>
      )}
      {!compact && !running && !finishing && (
        <div className="rhythm-chips" role="group" aria-label="Masa ritmi">
          <span>Masa ritmi</span>
          {[[null, "Kapalı"], ...Object.entries(RHYTHMS).map(([id, r]) => [id, r.label])].map(([id, label]) => (
            <button
              key={label}
              type="button"
              className={(rhythm || null) === id ? "on" : ""}
              aria-pressed={(rhythm || null) === id}
              onClick={() => requireMember(() => mutate("/rhythm", { rhythm: id }, id ? `Masa ritmi ${label}: molalar artık ortak. ☕` : "Masa ritmi kapandı."))}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {growing && !pausedAt && !me.focusPauseUsed && teaMax > 0 && (
        <button type="button" className="tea-button" onClick={() => tea("pause")}>
          ☕ Çay molası ver ({teaMax / 60000} dk, bir kez)
        </button>
      )}
      {growing && pausedAt > 0 && (
        <div className="tea-note">
          <span>☕ Çay molası · {mmss(teaLeft)} kaldı. Uygulamadan çıkabilirsin; inşaat yerinde bekliyor.</span>
          <button type="button" className="sound-pill on" onClick={() => tea("resume")}>
            Devam et
          </button>
        </div>
      )}
      {growing && !onComputer() && (
        <p className={`awake-note ${screenAwake() ? "ok" : "warn"}`}>
          {screenAwake()
            ? "🔆 Ekran açık tutuluyor; telefonu önünde açık bırakabilirsin."
            : "⚠️ Bu telefon ekranı kendi kapatabilir: pil tasarrufunu kapat ya da ekran zaman aşımını uzat. Ekran kararırsa 1 dakika içinde dokun."}
        </p>
      )}
      {streakLeft > 0 && streakNext > 0 && (
        <p className="streak-note">
          🔥 Seri {me.chain}: {Math.floor(streakLeft / 60000)}:{String(Math.floor((streakLeft % 60000) / 1000)).padStart(2, "0")} içinde başlarsan
          bu seans +%{Math.round(streakNext * 100)} maaş getirir.
        </p>
      )}
      {!running && !finishing && ruin > 0 && (
        <p className="ruin-note">Köyünde enkaz var. Bir sonraki seansın onu kaldırır ve +{ruin} 🧱 geri gelir.</p>
      )}
      {picking && (
        <CatalogModal
          bricks={bricks}
          selected={model}
          pick={pick}
          close={() => setPicking(false)}
          founder={me?.badge === "dev"}
          maxMinutes={round ? roundMinutes : 0}
          start={picking === "wallet" ? "wallet" : "shop"}
          // A building from the collection: fly to it on the village map.
          show={(id) => {
            setPicking(false);
            window.dispatchEvent(new CustomEvent("kutup:show-building", { detail: { model: id } }));
          }}
        />
      )}
      <Busy
        loading={busy || finishing}
        disabled={short > 0 || tooBig}
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
              ? early
                ? "Vazgeç (bedava)"
                : "Pes et (bina yıkılır)"
              : "Seansı durdur"
            : tooBig
              ? `Bu tura ${roundMinutes} dk kaldı · daha küçük yapı seç`
              : short > 0
              ? `${short} 🧱 eksik · başka yapı seç`
              : fidan
                ? `Temeli at ${item.emoji}`
                : "Hadi odaklanalım"}
      </Busy>
      <DeskMates me={me} members={members} now={now} onJoin={onJoin} />
      <div className="focus-tools">
        {!running && !finishing && (
          <button
            type="button"
            className={`sound-pill invite-chip ${invite ? "on" : ""}`}
            aria-pressed={invite}
            title="Başlayınca ekibe 'Katıl' bildirimi gider"
            onClick={() => {
              setInvite(!invite);
              storage.set("kutup-invite", invite ? "0" : "1");
            }}
          >
            📣 <span>Ekibi çağır</span>
          </button>
        )}
        <SoundButton />
        <button type="button" className="sound-pill icon-only" aria-label="Ses karışımı" onClick={() => setMixer(true)}>
          <SlidersHorizontal size={14} />
        </button>
        {onScreen && (
          <button
            type="button"
            className="sound-pill screen-pill"
            aria-label="Odak ekranı"
            onClick={() => {
              enterFullscreen(); // inside the tap, or browsers refuse
              onScreen();
            }}
          >
            <Expand size={14} />
            <span>Odak ekranı</span>
          </button>
        )}
      </div>
      <p className="focus-bottom">
        {me?.focusToday > 0 ? (
          <>
            Bugün <b>{minutesLabel(me.focusToday)}</b> kendine ayırdın. Küçük adımlar da ilerlemedir.
          </>
        ) : (
          "Küçük bir başlangıç, büyük bir iyi his."
        )}
      </p>
      {mixer && (
        <Modal title="Şehir biraz sussun." subtitle="Yağmur, kütüphane, şömine… ya da bir kara delik." close={() => setMixer(false)}>
          <SoundPanel />
        </Modal>
      )}
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
function Board({ data, me, requireMember, mutate, compact, openTeam, openMember, openPlans }) {
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
// The tayfa's two reading rooms at Milli Kütüphane (Adnan is home), plus break
// spots. Old free-text places still work through "Başka bir yer…".
const PLACES = [
  ["Adnan Ötüken Okuma Salonu", "📚 Adnan"],
  ["Dr. Müjgan Cunbur Okuma Salonu", "📖 Müjgan"],
  ["Kafeterya", "☕ Kafeterya"],
  ["Bahçe", "🌳 Bahçe"],
];
const OTHER_PLACE = "Başka bir yer…";
function PresenceModal({ me, coming, close, mutate }) {
  const known = !me.location || PLACES.some(([name]) => name === me.location);
  const [status, setStatus] = useState(coming ? "coming" : "here"),
    [location, setLocation] = useState(
      known ? me.location || PLACES[0][0] : OTHER_PLACE,
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
            <span className="plan-step">
              Nerede çalışıyorsun? <small>genelde Adnan’dayız aga</small>
            </span>
            <div className="quick-messages place-chips" role="group" aria-label="Salon">
              {[...PLACES, [OTHER_PLACE, "Başka…"]].map(([name, label]) => (
                <button
                  type="button"
                  key={name}
                  aria-pressed={location === name}
                  className={location === name ? "selected" : ""}
                  onClick={() => setLocation(name)}
                >
                  {label}
                </button>
              ))}
            </div>
            {location === OTHER_PLACE && (
              <label className="field-label">
                Neresi?
                <input
                  required
                  maxLength={40}
                  value={customPlace}
                  onChange={(e) => setCustomPlace(e.target.value)}
                  placeholder="Örn. 2. kat koridor masaları"
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
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
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
        <button type="button" className={copied ? "copied" : ""} onClick={copy} aria-label="Davet bağlantısını kopyala">
          {copied ? (
            <>
              <Check size={18} />
              <small>Kopyalandı</small>
            </>
          ) : (
            "+"
          )}
        </button>
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
        {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
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
// A plan in three taps: a day, a time, go. The exact pickers stay one tap away.
const PLAN_TIMES = ["09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
const PLAN_NAMES = ["Sabah kulübü ☀️", "Öğleden sonra 📚", "Akşam kütüpü 🌙", "Sınav kampı 🔥"];
// Browsers hand back "10:00", "10:00:00" or "10:00:00.000"; read only what is
// needed, in Türkiye time (UTC+3 all year).
function planStart(date, time) {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date),
    clock = /^(\d{1,2}):(\d{2})/.exec(time);
  return day && clock ? Date.UTC(+day[1], +day[2] - 1, +day[3], +clock[1] - 3, +clock[2]) : NaN;
}
function untilWords(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} dk sonra`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} saat sonra`;
  return `${Math.round(hours / 24)} gün sonra`;
}
function PlanModal({ close, mutate }) {
  const firstFree = (day) => PLAN_TIMES.find((t) => planStart(day, t) > Date.now() + 10 * 60000);
  const today = dayInput(),
    startDay = firstFree(today) ? today : dayInput(1);
  const [date, setDate] = useState(startDay),
    [time, setTime] = useState(firstFree(startDay) || "10:00"),
    [exact, setExact] = useState(false),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const days = Array.from({ length: 7 }, (_, offset) => {
    const value = dayInput(offset),
      at = Date.now() + offset * 86400000;
    const label =
      offset === 0
        ? "Bugün"
        : offset === 1
          ? "Yarın"
          : new Intl.DateTimeFormat("tr-TR", { weekday: "short", day: "numeric", timeZone: "Europe/Istanbul" }).format(at);
    return [label, value];
  });
  const starts = planStart(date, time),
    past = Number.isFinite(starts) && starts < Date.now();
  const pickDay = (value) => {
    setDate(value);
    setError("");
    // Today, a time that already went by moves on to the next free one.
    if (planStart(value, time) < Date.now()) setTime(firstFree(value) || time);
  };
  return (
    <Modal
      title="Güzel bir plan var. 🗓️"
      subtitle="Bir gün, bir saat. Gerisi bir “ben de gelirim”e bakar."
      close={close}
    >
      <form
        className="plan-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!Number.isFinite(starts)) {
            setError("Gün ya da saat okunamadı. Bir daha seçer misin?");
            return;
          }
          if (past) {
            setError("Bu saat geçti bile. İleri bir saat seç. 🙂");
            return;
          }
          setError("");
          setBusy(true);
          const saved = await mutate("/plans", { starts, note }, "Plan panoda. Ekibin katılabilir! 🗓️", "POST", (message) =>
            setError(`Plan kaydedilemedi: ${message}`),
          );
          setBusy(false);
          if (saved) close();
        }}
      >
        <span className="plan-step">Hangi gün?</span>
        <div className="quick-messages plan-days" role="group" aria-label="Gün">
          {days.map(([label, value]) => (
            <button
              type="button"
              key={value}
              aria-pressed={date === value}
              className={date === value ? "selected" : ""}
              onClick={() => pickDay(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="plan-step">Saat kaçta?</span>
        <div className="quick-messages plan-times" role="group" aria-label="Saat">
          {PLAN_TIMES.map((value) => {
            const gone = planStart(date, value) < Date.now();
            return (
              <button
                type="button"
                key={value}
                disabled={gone}
                aria-pressed={time === value}
                className={time === value ? "selected" : ""}
                onClick={() => {
                  setTime(value);
                  setError("");
                }}
              >
                {value}
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={exact}
            className={exact || !PLAN_TIMES.includes(time) ? "selected" : ""}
            onClick={() => setExact(!exact)}
          >
            Başka saat
          </button>
        </div>
        {exact && (
          <div className="form-row plan-exact">
            <label className="field-label">
              Gün
              <input
                type="date"
                required
                min={dayInput()}
                max={dayInput(14)}
                value={date}
                onChange={(e) => pickDay(e.target.value)}
              />
            </label>
            <label className="field-label">
              Saat
              <input
                type="time"
                required
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setError("");
                }}
              />
            </label>
          </div>
        )}
        <label className="field-label">
          Planın adı <span>isteğe bağlı</span>
          <input
            maxLength={80}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn. Sabah erkenciler kulübü"
          />
        </label>
        <div className="quick-messages plan-names">
          {PLAN_NAMES.map((name) => (
            <button type="button" key={name} className={note === name ? "selected" : ""} onClick={() => setNote(name)}>
              {name}
            </button>
          ))}
        </div>
        <p className={`plan-summary ${past ? "late" : ""}`} aria-live="polite">
          <CalendarDays size={16} />
          {Number.isFinite(starts) ? (
            <>
              <b>
                {dayWord(starts)} · {shortTime(starts)}
              </b>
              <span>{past ? "bu saat geçti" : untilWords(starts - Date.now())}</span>
            </>
          ) : (
            <b>Bir gün ve saat seç</b>
          )}
        </p>
        <p className="form-footnote">
          <MapPin size={14} /> Milli Kütüphane · Türkiye saati. Bildirimi açık olanlara haber gider.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Busy loading={busy} disabled={past} className="btn primary full" type="submit">
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
        {member.crown && <p className="crown-line">👑 Geçen haftanın ustası</p>}
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
      <MemberStats memberId={member.id} />
      <button
        className="btn primary full"
        onClick={async () => {
          if (
            await mutate(
              "/messages",
              {
                text: `${member.name}, bir kahve molası verelim mi? ☕`,
                kind: "coffee",
                to: member.id,
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
// Getting notifications working is the whole point of Kütüp, so the home screen
// walks people through it until they turn it on (or hide the card).
function SetupCard({ enable, busy }) {
  const needsHomeScreen = isIOS && !standalone;
  // On an iPhone notifications only work from the home screen: the guide comes back every three days.
  const [hidden, setHidden] = useState(
    () => storage.get("kutup-setup-hidden") === "1" && !(needsHomeScreen && Date.now() - Number(storage.get("kutup-setup-hidden-at") || 0) > 3 * 86400000),
  );
  if (hidden || (!pushSupported && !isIOS)) return null;
  const hide = () => {
    storage.set("kutup-setup-hidden", "1");
    storage.set("kutup-setup-hidden-at", String(Date.now()));
    setHidden(true);
  };
  // On an iPhone the four steps, drawn (n27).
  if (needsHomeScreen) return <IosGuide hide={hide} />;
  return (
    <section className="setup-card">
      <span className="setup-emoji">🔔</span>
      <div>
        <strong>Biri kütübe gelince haberin olsun.</strong>
        <p>Arkadaşın gelince, kahveye çağırınca ya da plan yapınca telefonuna düşsün.</p>
      </div>
      <Busy loading={busy} className="btn primary" onClick={() => enable()}>
        {!busy && <Bell size={16} />} Bildirimleri aç
      </Busy>
      <button className="icon-button setup-close" aria-label="Bu kartı gizle" onClick={hide}>
        <X size={17} />
      </button>
    </section>
  );
}
