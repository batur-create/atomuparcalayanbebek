import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, m as M } from "motion/react";
// Motion's animation and layout engine loads after the first paint.
const motionFeatures = () => import("./motionFeatures.js").then((r) => r.default);
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  House,
  KeyRound,
  LayoutGrid,
  LoaderCircle,
  MapPin,
  MessageCircle,
  X,
} from "lucide-react";
import { api, get, themeOf } from "./api.js";
import {
  Avatar,
  Busy,
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
import { openBlackHole } from "./BlackHole.jsx";
import { closeBuildNotice } from "./buildNotices.js";
import { kindFor } from "../shared/village.js";
import { BEAT_EVERY, BUILD_LEAVE, BY_ID, COUNTDOWN, FREE_LEAVE, GRACE, HONEST_MIN, LEAVE_GRACE, RESCUE_HOLD, RESCUE_WINDOW, fits, modelOf, rescueMinutes, streakBonus, teaBreakFor } from "../shared/catalog.js";
import { alarmSound, closeFloat, idleSupported, primeFloat } from "./float.js";
import { FloatPanel, HereCard, RescueCard } from "./Watch.jsx";
import { ReceiptCard } from "./Economy.jsx";
import { useSoundFollowsFocus } from "./Sound.jsx";
import { CallOverlay, JoinBanner, MessageBanner } from "./Together.jsx";
import { useVillage } from "./villageData.js";
import { clearLast, readLast, saveLast } from "./lastState.js";
import { AchievementCheer, AchievementsModal, DeskMap, BuildDelivery, FocusScreen, OwnerPage, VillagePanel, ImeceEntry, WeekStory, YenilikModal, prefetchScreens } from "./later.jsx";
import { useYenilik } from "./yenilikNokta.js";
import { StoryNudge, storyFresh } from "./storyLink.jsx";
import { AnnounceCard, NewsCard, Shortcuts } from "./Haberler.jsx";
import { shouting, teaCall } from "../shared/pano.js";
import { useAchievementWatch } from "./achievementWatch.js";
import { CoffeeCard, FocusCard, onComputer, pickedModel } from "./Focus.jsx";
import { Board } from "./Board.jsx";
import { CoffeeModal, InviteModal, MemberModal, PlanCardModal, PlanModal, PresenceModal } from "./Modals.jsx";
import { SignIn, ProfileModal, LookModal, AccountModal, ModeButton, leaveTeam } from "./Account.jsx";
import { Entry } from "./Entry.jsx";
import { IosGuide, Loading } from "./Illustrations.jsx";
import { Home, Kinetic } from "./Home.jsx";
import { MePage, TeamModal } from "./MePage.jsx";
import { AccountsModal } from "./Accounts.jsx";
import { useMotionPref } from "./motionPref.js";
import { HelpButton, HelpSheet, Tour, tourFor } from "./Help.jsx";
import { TOUR } from "./helpTopics.js";
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
// n42: what each page is for lives in Kara'ya sor now (src/helpTopics.js); the
// heading keeps its name, and a line under it only where it is an instruction.
const PAGE = {
  focus: ["EKİPLE HER ŞEY DAHA İYİ", "Odaklan, köy büyüsün."],
  board: ["EKİPLE HER ŞEY DAHA İYİ", "Bizim küçük köşe."],
  me: ["TAM SENLİK BİR KÖŞE", "Ben."],
  feedback: ["BU PLATFORM BİRAZ DA SENİN", "Söz sende.", "Fikirler, takılan şeyler, güzel iki kelime. Hepsi Batur’a."],
};
const startParams = new URLSearchParams(location.search);
// n34: a shared plan link (/?plan=…) opens that plan's card once someone is
// signed in, even if signing in comes first (the app may mount afresh for it).
let sharedPlan = startParams.get("plan");
let introPlayed = false;
// n42: someone who just made or joined a team on this device is offered the tour.
let joinedNow = false;
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
// n25: switching or adding an account mounts the app afresh for that account,
// so nothing of the previous one (live stream, village, board, timers, push
// state) carries over. `initial` is the new account's session and state.
export default function App() {
  const [mount, setMount] = useState({ key: 0, initial: null });
  const restart = (initial) => setMount((x) => ({ key: x.key + 1, initial }));
  return <KutupApp key={mount.key} initial={mount.initial} restart={restart} />;
}
function KutupApp({ initial, restart }) {
  // n29: open at once with the last state this device saw; the fresh one follows.
  const [cached] = useState(() =>
    // Not for the owner panel, an invitation, or a notification meant for another account (?as=).
    initial || location.pathname === "/batur" || location.pathname.startsWith("/join/") || startParams.has("as") ? null : readLast(),
  );
  const [session, setSession] = useState(cached?.session ?? null),
    [data, setData] = useState(cached?.data ?? EMPTY),
    [loading, setLoading] = useState(!cached);
  const sessionEpoch = useRef(0);
  const updateData = (incoming) => setData((previous) => mergeState(previous, incoming));
  // The address (a notification's ?tab=…) only counts on the first opening.
  const [tab, setTab] = useState(
      initial ? initial.tab || "home" : TABS.includes(startParams.get("tab")) ? startParams.get("tab") : "home",
    ),
    [modal, setModal] = useState(null),
    [imeceSignal,setImeceSignal] = useState(0),
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
  const yenilik = useYenilik();
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
  const [deliveries, setDeliveries] = useState([]);
  const [focusScreen, setFocusScreen] = useState(false);
  // n28: the week's story, opened from the home card, the Ben tab or Sunday's notification.
  const [story, setStory] = useState(false);
  // An invite notification opens "/?join=<friend>": offer to join their session.
  const [joinAsk, setJoinAsk] = useState(() => (initial ? null : startParams.get("join")));
  // "Hesap ekle": the welcome screen over the open account, which stays signed in.
  const [adding, setAdding] = useState(false);
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
  // n14: ask about badges again after whatever can earn one.
  const lastSaid = data.messages.findLast?.((x) => x.memberId === me?.id && x.kind !== "system")?.id || "";
  const [cheer, endCheer] = useAchievementWatch(session ? me : null, `${me?.bricks}|${me?.status}|${lastSaid}`);
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
    clearLast();
    sessionEpoch.current++;
    setSession(null);
    setData(EMPTY);
    setNotificationOn(false);
    if (message) notify(message);
  };
  // The open account ended here (signed out, revoked, left): another account
  // saved on this device opens if there is one, otherwise the device is signed out.
  const ended = (message, next = "Bu hesabın oturumu kapandı; cihazdaki diğer hesabın açıldı.") =>
    get("/session")
      .then((d) => restart({ data: d, tab: "home", message: next }))
      .catch(() => signedOut(message));
  const switchAccount = async (account) => {
    try {
      const d = await api("/accounts/switch", { memberId: account.id });
      restart({ data: d, tab, message: `Şimdi bu hesaptasın: ${account.name} · ${account.team}` });
    } catch (e) {
      notify(e.status === 403 ? "Bu hesabın oturumu kapanmış. “Hesap ekle” ile yeniden gir." : e.message);
      if (e.status === 403) setModal(null);
    }
  };
  const addAccount = (full) => {
    if (full) return notify("Bu cihazda en fazla 5 hesap açık kalabilir. Önce birinden çıkış yap.", 6000);
    setModal(null);
    setAdding(true);
  };
  const signOutHere = async () => {
    if (!session.username) {
      notify("Çıkmadan önce bir kullanıcı adı ve şifre belirle; yoksa bu profile geri giremezsin.", 7000);
      return setModal("account");
    }
    if (!confirm(`Bu cihazda çıkış yapılsın mı? (${me?.name || ""} · ${data.group.name}) Profilin, binaların ve mesajların yerinde kalır; kullanıcı adın ve şifrenle istediğin an geri girersin.`)) return;
    try {
      await api("/logout", {});
      ended("Çıkış yapıldı. Kullanıcı adın ve şifrenle istediğin an geri gelebilirsin.", "Çıkış yapıldı; cihazdaki diğer hesabın açıldı.");
    } catch (e) {
      notify(e.message);
    }
  };
  // The bell is per account: each account on this device turns its own on or off.
  const pushOffKey = `kutup-push-off:${session?.memberId}`;
  const pushOff = () => !!(storage.get(pushOffKey) ?? storage.get("kutup-push-off"));
  useEffect(() => {
    revision.current = data.group?.rev ?? null;
    if (session && data.group?.id) saveLast(session, data);
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
    // A notification for another account on this phone opens with ?as=<id>.
    const wanted = !initial && startParams.get("as");
    const opening = initial
      ? Promise.resolve(initial.data)
      : get("/session").then((d) => (wanted && wanted !== d.memberId ? api("/accounts/switch", { memberId: wanted }).catch(() => d) : d));
    opening
      .then((d) => {
        setSession({
          memberId: d.memberId,
          username: d.username || null,
          pushPublicKey: d.pushPublicKey,
          live: d.live,
        });
        setData(d);
        prefetchScreens();
        if (initial?.message) notify(initial.message);
        else if (!initial && startParams.get("action") === "here") setModal("presence");
        if (!initial && startParams.has("story")) setStory(true);
        openSharedPlan(d);
      })
      .catch((e) => {
        if (e.status === 401 && cached) signedOut();
        else if (e.status !== 401 && cached) setConnected(false);
        else if (e.status !== 401)
          notify("Sunucuya ulaşılamıyor. Bağlantın gelince sayfayı yeniden açabilirsin.");
        else if (standalone && !invite) setModal("onboard");
      })
      .finally(() => {
        setLoading(false);
        if (!initial && (startParams.has("tab") || startParams.has("action") || startParams.has("as") || startParams.has("story") || startParams.has("plan")))
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
          ended("Bu cihazdaki oturum kapandı. Yeniden katılabilirsin.");
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
    } else if (session.live === "ws" && "WebSocket" in window) {
      // n29: the team's live room rings on every change and we refetch at once.
      // While the socket is open a 30 s poll is only a safety net; while it is
      // down (network switch, sleeping phone) the old 5 s poll carries on.
      let socket, open = false, retry = 0, retryTimer, pinger;
      const connect = () => {
        if (gone) return;
        socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/live`);
        socket.onopen = () => {
          open = true;
          retry = 0;
          refresh(false);
        };
        socket.onmessage = (event) => {
          if (event.data === "changed") refresh(false);
          else if (event.data === "removed") {
            gone = true;
            ended("Bu cihazdaki oturum kapandı. Yeniden katılabilirsin.");
          }
        };
        socket.onclose = (event) => {
          open = false;
          if (gone) return;
          if (event.code === 4001) return ended("Bu cihazdaki oturum kapandı. Yeniden katılabilirsin.");
          retryTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** retry++));
        };
      };
      connect();
      // Phones drop idle sockets: a small ping keeps it warm (answered without waking the room).
      pinger = setInterval(() => open && socket.readyState === 1 && socket.send("ping"), 25000);
      const back = () => {
        if (document.visibilityState !== "visible") return;
        refresh(false);
        if (!open && socket?.readyState !== 0) {
          clearTimeout(retryTimer);
          retry = 0;
          connect();
        }
      };
      document.addEventListener("visibilitychange", back);
      timer = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        ++ticks;
        if (!open) refresh(ticks % 12 === 0);
        else if (ticks % 6 === 0) refresh(ticks % 12 === 0);
      }, 5000);
      source = {
        close: () => {
          clearTimeout(retryTimer);
          clearInterval(pinger);
          document.removeEventListener("visibilitychange", back);
          if (socket) {
            socket.onclose = null;
            socket.close();
          }
        },
      };
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
          const off = pushOff();
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
        relaxed: !!me.focusRelaxed,
        imece: !!me.focusImece,
        kind: item.kind,
        model: item.id,
        seed: me.focusSeed,
        week: me.focusWeek || 0,
        cost: me.focusCost || 0,
        honest: !!me.focusHonest,
      };
      return;
    }
    const done = lastFocus.current;
    lastFocus.current = null;
    if (!done || done.imece || done.relaxed) return; // project and relaxed delivery have their own handovers
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
          : done.honest && me.focusWeek - done.week < done.minutes
            ? `Bitti! ${me.focusWeek - done.week} dakika cebinde; uzakta geçen ${done.minutes - (me.focusWeek - done.week)} dk sayılmadı. 🌱`
            : `İşte bu! ${done.minutes} dakika cebinde. Şimdi bir nefes. 🌱`,
      );
      navigator.vibrate?.([120, 80, 120]);
      // The receipt waits for the handover ceremony to get going.
      setReceipt({ end: done.end, type: done.strict ? "built" : "plain", delay: done.strict ? 2600 : 600, at: Date.now(), together: togetherRef.current });
    } else if (done.honest && !done.strict) {
      notify(`Seans yazılmadı: ${HONEST_MIN} dk'dan az göründü. Uygulamada kal, dakikaların sayılsın.`, 7000);
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
  useEffect(() => {
    setDeliveries([]);
    if (!session?.memberId || me?.focusEnd > Date.now()) return;
    let stopped = false;
    const epoch = sessionEpoch.current;
    const load = () => {
      if (document.hidden) return;
      get("/build-deliveries").then((rows) => {
        if (!stopped && epoch === sessionEpoch.current) {
          setDeliveries(rows.map((row) => ({ ...row, memberId: session.memberId })));
          if (rows.length) setFocusScreen(false);
        }
      }).catch(() => {});
    };
    load();
    document.addEventListener("visibilitychange", load);
    window.addEventListener("online", load);
    return () => { stopped = true; document.removeEventListener("visibilitychange", load); window.removeEventListener("online", load); };
  }, [session?.memberId, me?.focusEnd]);
  const acceptDelivery = async (delivery, showVillage) => {
    const epoch = sessionEpoch.current;
    await api(`/build-deliveries/${delivery.id}`, {});
    if (epoch !== sessionEpoch.current) return;
    closeBuildNotice(session.memberId, delivery.ends);
    setDeliveries((rows) => rows.filter((row) => row.id !== delivery.id));
    if (showVillage) { setFocusScreen(false); navigate("focus"); }
  };
  // Presence (n40, dürüst dakika). Build mode and a watched free session keep
  // the screen on and report that the app is on screen. On a phone, leaving the
  // app is noticed at once: a push now, another at ten seconds, and after 20
  // seconds a build cracks (saved once within five minutes, see the rescue
  // card) while a free session just loses the time away (and ends after five
  // minutes). On a computer other tabs and apps are part of studying; there the
  // question is whether anyone is at the computer at all: after 15 minutes
  // without mouse or keyboard (or every 25 minutes where the browser cannot
  // tell) the floating window turns red, beeps and asks "orada mısın?", and an
  // unanswered question for two minutes counts as leaving.
  const watchEnd = !me?.focusRelaxed && me?.focusEnd > Date.now() && (me.focusStrict || me.focusHonest) ? me.focusEnd : 0;
  const watchStrict = !!me?.focusStrict;
  // Where the session started (n40): a phone start makes the phone the timer
  // and the computer its helper; a computer start leaves the phone free to glance at.
  const watchDevice = me?.focusDevice || "";
  const meRef = useRef(me);
  meRef.current = me;
  // While on a tea break (and until it would have ended) leaving the app is fine.
  const pauseUntil = useRef(0);
  pauseUntil.current = me?.focusPausedAt ? me.focusPausedAt + teaBreakFor(me.focusMinutes) : pauseUntil.current;
  const [crack, setCrack] = useState(null); // { away, minutes }: the site cracked; save it or let it go
  const crackRef = useRef(null);
  const [asking, setAsking] = useState(0); // computer: >0 asking since, <0 unanswered since
  const hereRef = useRef(() => {});
  // The server's word that the site cracked (its countdown ran out, or another
  // device said so): every open device shows the same rescue card.
  const serverCrack = watchEnd && watchStrict && me?.focusCrackedAt > 0 ? me.focusCrackedAt : 0;
  const crackedRef = useRef(() => {});
  useEffect(() => {
    if (serverCrack && !crackRef.current) crackedRef.current(Math.max(0, Date.now() - (meRef.current?.focusLeftAt || serverCrack)), serverCrack);
  }, [serverCrack]);
  useEffect(() => {
    setCrack((crackRef.current = null));
    setAsking(0);
    if (!watchEnd) return releaseScreen();
    const strict = watchStrict,
      desk = onComputer();
    // A phone opened beside a session the computer started: nothing to watch here.
    if (!desk && watchDevice === "desk") return;
    // How long an absence may be before it counts: a page reload or a quick
    // look at a message is fine.
    const LEAVE = strict ? (desk ? 120000 : BUILD_LEAVE) : FREE_LEAVE;
    const epoch = sessionEpoch.current;
    const SEEN = "kutup-fidan";
    let hiddenAt = null,
      gone = false,
      quietSince = 0,
      answer = 0,
      flash = 0;
    const remember = () => storage.set(SEEN, JSON.stringify({ end: watchEnd, at: Date.now() }));
    const wither = async () => {
      if (gone || !strict) return;
      gone = true;
      setCrack((crackRef.current = null));
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
    // A build that was left too long cracks: one rescue, if it is still within
    // reach. The server is told (unless it said so first), so the crack holds on
    // every device and a beat cannot undo it.
    const cracked = (away, at = 0) => {
      if (!strict || gone || crackRef.current) return;
      if (meRef.current?.focusRescued || away > RESCUE_HOLD - 40000) return wither();
      const since = at || Date.now();
      crackRef.current = { away, at: since };
      setCrack({ away, at: since, minutes: meRef.current?.focusMinutes || 0 });
      navigator.vibrate?.([200, 100, 200]);
      if (!at)
        api("/focus", { action: "crack", away })
          .then((r) => epoch === sessionEpoch.current && r.state && updateData(r.state))
          .catch(() => {});
    };
    crackedRef.current = cracked;
    const stopped = (r) => {
      if (epoch !== sessionEpoch.current) return;
      if (r.state) updateData(r.state);
      notify(
        r.credited
          ? `Seans bitti: ${FREE_LEAVE / 60000} dk'dan uzun uzaktaydın. Görülen ${r.credited} dk yazıldı.`
          : `Seans bitti: ${FREE_LEAVE / 60000} dk'dan uzun uzaktaydın. ${HONEST_MIN} dk'dan az göründüğü için yazılmadı.`,
        8000,
      );
    };
    const beat = () => {
      if (gone || crackRef.current || quietSince) return;
      remember();
      api("/focus", { action: "beat", device: desk ? "desk" : "phone" })
        .then((r) => {
          if (r?.stopped) {
            gone = true;
            stopped(r);
          } else if (r?.cracked) cracked(Math.max(0, Date.now() - (meRef.current?.focusLeftAt || Date.now())));
          else if (r?.away && epoch === sessionEpoch.current) notify(`${r.away} dk uzaktaydın; o süre sayılmadı. 🎧`);
        })
        .catch(() => {});
    };
    // Tells the server the app was left, even as the page goes to the background.
    const leaving = () =>
      fetch("/api/focus", {
        method: "POST",
        keepalive: true,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Kutup": "1" },
        body: JSON.stringify({ action: "away" }),
      }).catch(() => {});
    // Coming back to a session that kept running while the app was closed.
    try {
      const seen = JSON.parse(storage.get(SEEN) || "null");
      if (seen?.end === watchEnd && Date.now() - seen.at > LEAVE && Date.now() > pauseUntil.current) {
        if (strict) {
          cracked(Date.now() - seen.at);
          return;
        }
      }
    } catch {}
    keepScreenOn();
    beat();
    const pulse = setInterval(() => {
      if (desk || document.visibilityState === "visible") beat();
    }, BEAT_EVERY);
    // A local "still here" mark every few seconds, so a page reload is not
    // mistaken for leaving the app.
    const mark = setInterval(() => {
      if ((desk || document.visibilityState === "visible") && !crackRef.current && !quietSince) remember();
    }, 3000);
    const warn = (body) =>
      navigator.serviceWorker?.getRegistration?.().then((r) =>
        r?.showNotification(strict ? "🏗️ Şantiyen seni bekliyor" : "🎧 Seansın seni bekliyor", { body, tag: "kutup-build", renotify: true, requireInteraction: true, vibrate: [300, 120, 300, 120, 600], data: { url: location.href } }),
      ).catch(() => {});
    const unwarn = () => {
      navigator.serviceWorker?.controller?.postMessage({ back: true });
      navigator.serviceWorker?.getRegistration?.().then((r) => r?.getNotifications({ tag: "kutup-build" })).then((list) => list?.forEach((n) => n.close())).catch(() => {});
    };
    let loud = 0,
      askingNow = false;
    // Computer: "orada mısın?"
    const ask = () => {
      if (askingNow || quietSince || crackRef.current || Date.now() < pauseUntil.current) return;
      askingNow = true;
      setAsking(Date.now());
      // Gently first: for a minute only the floating window and the tab title
      // change (someone reading moves the mouse and it is gone); then the sound
      // and a notification.
      loud = setTimeout(() => {
        alarmSound();
        warn("Orada mısın? 1 dakika içinde fareyi oynat ya da “Buradayım”a bas, yoksa bu süre sayılmaz.");
        flash = setInterval(alarmSound, 20000);
      }, 60000);
      answer = setTimeout(() => {
        clearInterval(flash);
        quietSince = Date.now();
        setAsking(-quietSince);
        if (!strict) notify("Cevap gelmedi: uzakta geçen dakika sayılmıyor.", 8000);
      }, 2 * 60000);
    };
    const here = () => {
      clearTimeout(loud);
      clearTimeout(answer);
      clearInterval(flash);
      unwarn();
      askingNow = false;
      setAsking(0);
      if (quietSince) {
        const away = Date.now() - quietSince;
        quietSince = 0;
        if (strict && away > BUILD_LEAVE) return cracked(away);
      }
      beat();
    };
    hereRef.current = here;
    let idle = null,
      check = 0;
    const controller = new AbortController();
    // With the phone as the timer, the phone does the watching; the computer
    // only sounds the alarm when the phone leaves the app (see phoneGone).
    if (desk && watchDevice !== "phone") {
      const fallback = () => {
        check = setInterval(ask, 25 * 60000);
      };
      if (idleSupported())
        navigator.permissions
          ?.query({ name: "idle-detection" })
          .then((p) => {
            if (p.state !== "granted" || controller.signal.aborted) return fallback();
            idle = new window.IdleDetector();
            idle.addEventListener("change", () => {
              if (idle.userState === "idle") ask();
              else if (askingNow || quietSince) here();
            });
            return idle.start({ threshold: 15 * 60000, signal: controller.signal });
          })
          .catch(fallback);
      else fallback();
    }
    const visibility = () => {
      if (desk) {
        if (document.visibilityState === "visible") quietSince || askingNow ? here() : beat();
        return;
      }
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        remember();
        if (pauseUntil.current > Date.now() || crackRef.current) return;
        leaving();
        // Five quiet seconds, then the phone's service worker counts 10 … 1 on
        // one notification (the server's single push starts it if this is lost).
        if (typeof Notification !== "undefined" && Notification.permission === "granted")
          navigator.serviceWorker?.controller?.postMessage({
            leave: {
              grace: LEAVE_GRACE,
              tag: "kutup-build",
              url: location.href,
              sticky: true,
              ...(strict
                ? {
                    countdown: COUNTDOWN,
                    done: meRef.current?.focusRescued
                      ? { title: "🧱 Binan çöktü", body: "Bu inşaatın kurtarma hakkı kullanılmıştı." }
                      : { title: "🩹 Binan çatladı!", body: `${RESCUE_WINDOW / 60000} dakika içinde dönersen bir kez kurtarabilirsin.` },
                  }
                : { title: "🎧 Seansın seni bekliyor", body: `Uzakta geçen dakika sayılmaz. ${FREE_LEAVE / 60000} dk içinde dön.` }),
            },
          });
        return;
      }
      unwarn();
      const away = hiddenAt ? Date.now() - Math.max(hiddenAt, pauseUntil.current) : 0;
      hiddenAt = null;
      if (crackRef.current) return;
      if (strict && away > LEAVE) return cracked(away);
      if (strict && away > 1500) notify("Az kalsın! Şantiye seni bekledi 🏗️");
      keepScreenOn();
      beat();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      controller.abort();
      clearTimeout(loud);
      clearTimeout(answer);
      clearInterval(flash);
      clearInterval(check);
      unwarn();
      clearInterval(pulse);
      clearInterval(mark);
      document.removeEventListener("visibilitychange", visibility);
      releaseScreen();
    };
  }, [watchEnd, watchStrict, watchDevice]);
  // Phone and computer together (n40): the phone was picked up mid-session.
  // An open computer rings too, and its floating window turns red, so the
  // computer helps call you back instead of covering for the phone.
  // Only while the countdown runs: after it the rescue card speaks instead.
  const phoneGone = watchEnd > 0 && onComputer() && watchDevice !== "desk" && me?.focusLeftAt > 0 && !serverCrack && !crack && now - me.focusLeftAt < BUILD_LEAVE + 5000;
  useEffect(() => {
    if (!phoneGone) return;
    alarmSound();
    const ring = setInterval(alarmSound, 2500);
    return () => clearInterval(ring);
  }, [phoneGone]);
  // The rescue card's two answers.
  const rescue = async () => {
    const epoch = sessionEpoch.current;
    try {
      const r = await api("/focus", { action: "rescue" });
      if (epoch !== sessionEpoch.current) return;
      setCrack((crackRef.current = null));
      if (r.state) updateData(r.state);
      notify(`Bina kurtarıldı 🩹 Süren ${r.extra} dk uzadı. Bu inşaatın tek hakkıydı.`, 6000);
      keepScreenOn();
    } catch (e) {
      notify(e.message);
      letGo();
    }
  };
  const letGo = async () => {
    setCrack((crackRef.current = null));
    try {
      const r = await api("/focus", { action: "wither" });
      if (r.state) updateData(r.state);
    } catch {}
    notify("İnşaatın çöktü 🧱 Bir dahakine sonuna kadar!");
  };
  const focusLeft = me?.focusEnd > now ? Math.ceil((me.focusEnd - (me.focusPausedAt || now)) / 1000) : 0;
  useEffect(() => {
    document.title = crack
      ? "🩹 Binan çatladı! · Kütüp"
      : phoneGone
        ? focusLeft % 2
          ? "📱 Telefonu bırak! · Kütüp"
          : "🔴 Kütüp'e dön · Kütüp"
      : asking
        ? focusLeft % 2
          ? "⚠️ Orada mısın? · Kütüp"
          : "🔴 Seni bekliyoruz · Kütüp"
        : focusLeft
          ? `${String(Math.floor(focusLeft / 60)).padStart(2, "0")}:${String(focusLeft % 60).padStart(2, "0")} · odakta · Kütüp`
          : "Kütüp — aynı masa, aynı motivasyon.";
  }, [focusLeft, !!crack, asking, phoneGone]);
  // The floating window goes away with the session.
  useEffect(() => {
    if (!me?.focusEnd) closeFloat();
  }, [!!me?.focusEnd]);
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
      if (shouting(said))
        notify("Şşşt! Burası kütüphane 🤫");
      else if (success) notify(typeof success === "function" ? success(result) : success);
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
  useEffect(()=>{
    const open=()=>{setModal(null);setTab("focus");setImeceSignal(n=>n+1);};
    window.addEventListener("kutup:imece",open);
    return()=>window.removeEventListener("kutup:imece",open);
  },[]);
  // n43: "Yeni yapı iste" in the catalogue (or anywhere) opens Batur'a ilet
  // with that kind chosen: dispatch "kutup:ask" with { kind }.
  const [askKind, setAskKind] = useState({ kind: "idea", at: 0 });
  useEffect(() => {
    const ask = (e) => {
      setAskKind({ kind: e.detail?.kind || "idea", at: Date.now() });
      setTab("feedback");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("kutup:ask", ask);
    return () => window.removeEventListener("kutup:ask", ask);
  }, []);
  // n42, Kara'ya sor: any screen opens help with openHelp({ tab, topic }).
  const [help, setHelp] = useState(null),
    [tour, setTour] = useState(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  useEffect(() => {
    const show = (e) => setHelp({ tab: e.detail?.tab || tabRef.current, topic: e.detail?.topic || null });
    window.addEventListener("kutup:help", show);
    return () => window.removeEventListener("kutup:help", show);
  }, []);
  // Once per device, after the opening has played and nothing else is open.
  const tourAsked = useRef(false);
  useEffect(() => {
    if (tourAsked.current || !session || tab !== "home" || modal || help || tour || toast) return;
    const timer = setTimeout(() => {
      tourAsked.current = true;
      setTour(tourFor(joinedNow));
    }, 3000);
    return () => clearTimeout(timer);
  }, [!!session, tab, !!modal, !!help, !!tour, !!toast]);
  const [markSpin, setMarkSpin] = useState(false);
  const topTap = () => {
    setMarkSpin(true);
    if (window.scrollY > 40) window.scrollTo({ top: 0, behavior: "smooth" });
    else if (tab !== "home") navigate("home");
  };
  // A plan notification ("?tab=plans") lands on the plans part of the home page.
  useEffect(() => {
    if (initial || startParams.get("tab") !== "plans" || !session) return;
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
  const leave = () => me && leaveTeam(me, notify, () => ended("Ekipten ayrıldın. Kapımız hep açık. 🫶", "Ekipten ayrıldın. Cihazdaki diğer hesabın açıldı. 🫶"));
  // Every entry point opens the same explicit, server-quoted join choice.
  const joinFriend=(m,choice)=>m&&requireMember(async()=>{
    if(!choice){setJoinAsk(m.id);return;}
    const strict=choice.strict,relaxed=strict&&choice.relaxed;
    if(!relaxed)keepScreenOn();
    if(onComputer()&&!relaxed)primeFloat();
    const result=await mutate("/focus",{action:"start",joinMember:m.id,joinEnd:choice.end,strict,relaxed,honest:!strict,device:onComputer()?"desk":"phone",...(strict?{model:choice.model}:{})},"Aynı anda bitecek iki ayrı çalışma. İyi çalışmalar! 🤝");
    if(result)setJoinAsk(null);
    return !!result;
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
    if (!welcome.startsWith("Tekrar")) joinedNow = true;
    // Added next to the open account: start afresh in the new one.
    if (session) {
      history.replaceState({}, "", "/");
      return restart({ data: d, tab: "home", message: welcome });
    }
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
    openSharedPlan(d);
  };
  function openSharedPlan(d) {
    if (!sharedPlan || !d?.memberId) return;
    setModal({ plan: sharedPlan });
    sharedPlan = null;
  }
  useEffect(()=>{
    const show=e=>setModal(e.detail?.coming?"coming":"presence");
    window.addEventListener("kutup:presence",show);return()=>window.removeEventListener("kutup:presence",show);
  },[]);
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
    storage.set(pushOffKey, "1");
    setNotificationOn(false);
    try {
      const registration = await within(navigator.serviceWorker.ready, 8000);
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        const result = await api("/push", { endpoint: sub.endpoint }, "DELETE").catch(() => null);
        // Batur’s owner alerts, or another account on this device, share this
        // browser subscription; keep it for them.
        if (!storage.get("kutup-owner-push") && !result?.others) await sub.unsubscribe().catch(() => {});
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
      storage.set(pushOffKey, "");
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
  if (!session || adding)
    return (
      <LazyMotion features={motionFeatures} strict>
      <MotionConfig reducedMotion={motionPick === "still" ? "always" : motionPick ? "never" : "user"}>
        <Entry invite={invite} inviteInfo={inviteInfo} open={(next) => setModal(next)} onSuccess={joinSuccess} now={now} dark={dark} start={entryStart} />
        {adding && (
          <button type="button" className="adding-back" onClick={() => (setAdding(false), setModal(null))}>
            <ArrowLeft size={17} /> Hesabıma dön
          </button>
        )}
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
        data.messages.some((m) => m.kind !== "system" && teaCall(m.text) && now - m.created < 60000)
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
              data-tab={item.id}
              className={`nav-item ${tab === item.id || (item.id === "me" && tab === "feedback") ? "active" : ""}`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "board" && unread > 0 && <b className="nav-count" aria-label={`${unread} okunmamış mesaj`}>{unread}</b>}
              {item.id === "me" && requestUpdates.count > 0 && <b className="nav-count" aria-label={`${requestUpdates.count} yeni gelişme`}>{requestUpdates.count}</b>}
              {item.id === "me" && !requestUpdates.count && session && yenilik.yeni && <span className="nav-dot news" title="Yenilikler" aria-label="Yenilikler var" />}
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
            onClick={() => requireMember(() => setModal("accounts"))}
          >
            <Avatar member={me} size="small" />
            <span>
              <strong>{me?.name || "Senin yerin hazır"}</strong>
              <small>
                {me ? "Hesaplarım · hesap değiştir" : "Ekibine katıl, yerini al"}
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
            <HelpButton tab={tab} />
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
                {PAGE[tab][2] && <p>{PAGE[tab][2]}</p>}
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
                  {session && <ImeceEntry key={me?.id} me={me} now={now} mutate={mutate}/>}
                  {session && <AnnounceCard messages={data.messages} now={now} openBoard={() => navigate("board")} />}
                  {session && <NewsCard yenilik={yenilik} open={() => setModal("yenilikler")} />}
                  {session && storyFresh(now) && <StoryNudge open={() => setStory(true)} />}
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
              shortcuts={
                session && (
                  <Shortcuts
                    items={[
                      ["✨", "Yenilikler", () => setModal("yenilikler"), yenilik.yeni],
                      ["🇹🇷", "Anıtkabir imecesi", () => { navigate("focus");setImeceSignal(n=>n+1); }],
                      ["🏅", "Başarımlar", () => setModal("achievements")],
                      ["📖", "Haftanın hikâyesi", () => setStory(true)],
                      ["🏗️", "Yapı iste", () => window.dispatchEvent(new CustomEvent("kutup:ask", { detail: { kind: "build" } }))],
                      ["💌", "Batur’a ilet", () => navigate("feedback"), requestUpdates.count > 0],
                    ]}
                  />
                )
              }
            />
          )}
          {tab === "focus" && (
            <div className="focus-page">
              {session && <ImeceEntry key={me?.id} me={me} now={now} mutate={mutate} signal={imeceSignal} consumeSignal={()=>setImeceSignal(0)}/>}
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
                askNotifications={notificationsOn}
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
                  idle={focusScreen}
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
            <MePage me={me} group={data.group} size={data.members.length} openStory={() => setStory(true)} requests={requestUpdates.count} yenilik={yenilik} setModal={setModal} navigate={navigate} leave={leave} accounts={{ onSwitch: switchAccount, onAdd: addAccount, onSignOut: signOutHere }} />
          )}
          {tab === "feedback" && (
            <FeedbackPage
              key={askKind.at}
              startKind={askKind.kind}
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
              data-tab={item.id}
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
              {item.id === "me" && (requestUpdates.count > 0 || (session && yenilik.yeni)) && <i className="nav-badge" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>
      {help && (
        <HelpSheet
          {...help}
          close={() => setHelp(null)}
          startTour={() => {
            setHelp(null);
            navigate("home");
            setTour({ steps: TOUR });
          }}
          ask={() => {
            setHelp(null);
            navigate("feedback");
          }}
          news={() => {
            setHelp(null);
            setModal("yenilikler");
          }}
        />
      )}
      {tour && (tab === "home" || !tour.offer) && <Tour key={tour.steps.length + String(tour.offer)} {...tour} done={() => setTour(null)} />}
      {modal === "profile" && me && <ProfileModal me={me} close={() => setModal(null)} mutate={mutate} />}
      {modal === "look" && <LookModal theme={theme} setTheme={setTheme} mode={mode} setMode={setMode} motion={motion} setMotion={setMotion} close={() => setModal(null)} />}
      {modal === "team" && (
        <TeamModal data={data} me={me} now={now} close={() => setModal(null)} invite={() => setModal("invite")} openMember={(x) => (x.id === me?.id ? (setModal(null), navigate("me")) : setModal({ member: x }))} />
      )}
      {modal === "accounts" && (
        <AccountsModal
          memberId={session.memberId}
          close={() => setModal(null)}
          openMe={() => (setModal(null), navigate("me"))}
          onProfile={() => setModal("profile")}
          onSwitch={switchAccount}
          onAdd={addAccount}
          onSignOut={signOutHere}
        />
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
          openMap={(room) => setModal({ map: room })}
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
        <PlanModal data={data} close={() => setModal(null)} mutate={mutate} onSaved={(id,created) => setModal({ plan: id, fresh: created })} />
      )}
      {modal?.plan && (
        <PlanCardModal planId={modal.plan} fresh={modal.fresh} data={data} me={me} close={() => setModal(null)} mutate={mutate} notify={notify} />
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
      {modal?.map && (
        <DeskMap
          data={data}
          me={me}
          start={modal.map}
          close={() => setModal(null)}
          mutate={mutate}
          requireMember={requireMember}
          openMember={(x) => requireMember(() => setModal({ member: x }))}
        />
      )}
      {modal === "achievements" && me && <AchievementsModal me={me} close={() => setModal(null)} />}
      {modal === "yenilikler" && <YenilikModal gorulen={yenilik.gorulen} gordu={yenilik.gordu} close={() => setModal(null)} />}
      {cheer && !focusScreen && (
        <AchievementCheer
          cheer={cheer}
          close={endCheer}
          open={() => {
            endCheer();
            setModal("achievements");
          }}
        />
      )}
      {story && session && <WeekStory data={data} me={me} close={() => setStory(false)} />}
      {focusScreen && <FocusScreen me={me} members={data.members} now={now} run={buildRun} outcome={buildOutcome} close={() => setFocusScreen(false)} onVillage={()=>{setFocusScreen(false);navigate("focus");setTimeout(()=>document.querySelector(".village-map-wrap")?.scrollIntoView({behavior:"smooth",block:"center"}),150);}} />}
      {crack && <RescueCard crack={crack} rescue={rescue} letGo={letGo} />}
      {!crack && asking !== 0 && <HereCard asking={asking} now={now} strict={watchStrict} here={() => hereRef.current()} />}
      {watchEnd > 0 && <FloatPanel me={me} now={now} asking={asking} crack={crack} phoneGone={phoneGone} here={() => hereRef.current()} />}
      <JoinBanner
        friend={data.members.find((x) => x.id === joinAsk)}
        me={me}
        now={now}
        join={choice => joinFriend(data.members.find((x) => x.id === joinAsk),choice)}
        onImece={()=>{setJoinAsk(null);navigate("focus");setImeceSignal(n=>n+1);}}
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
      {deliveries.length > 0 && deliveries[0].memberId === session?.memberId && <BuildDelivery key={`${session?.memberId}-${deliveries[0].id}`} delivery={deliveries[0]} accept={(showVillage) => acceptDelivery(deliveries[0], showVillage)} />}
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
              relaxed = strict && storage.get("kutup-build-mode") === "relaxed",
              model = picked.class === "small" && picked.cost <= (me?.bricks || 0) ? picked.id : "kulube";
            if (strict && !relaxed) keepScreenOn();
            setReceipt(null);
            await mutate(
              "/focus",
              { action: "start", minutes: 25, strict, relaxed, ...(strict ? { model } : {}), ...(receipt.together ? { invite: true } : {}) },
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
