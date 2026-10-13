import React, { useEffect, useRef, useState } from "react";
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
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  api,
  get,
  AVATARS,
  COLORS,
  COLOR_NAMES,
  STATUS,
  FEEDBACK,
  FEEDBACK_STATUS,
  shortTime,
  dateLabel,
  dayInput,
  DEMO,
} from "./api.js";

const nav = [
  { id: "home", label: "Kütüphanem", icon: LayoutGrid },
  { id: "plans", label: "Planlar", icon: CalendarDays },
  { id: "focus", label: "Odak odası", icon: Headphones },
  { id: "board", label: "Bizim pano", icon: MessageCircle },
];
function Icon({ name: Component, ...props }) {
  return <Component size={19} strokeWidth={1.8} {...props} />;
}
function Avatar({ member, size = "", className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`avatar ${member?.color || "lilac"} ${size} ${className}`}
    >
      {member?.avatar || "🪐"}
    </span>
  );
}
function Busy({ children, loading, ...props }) {
  return (
    <button disabled={loading} {...props}>
      {loading ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
    </button>
  );
}
function Badge({ status }) {
  return (
    <span className={`status ${status}`}>
      <i />
      {STATUS[status]?.[0] || status}
    </span>
  );
}
function Empty({ emoji, title, children }) {
  return (
    <div className="empty">
      <span>{emoji}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Modal({ title, subtitle, children, close, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const elements = ref.current?.querySelectorAll(
          'button:not(:disabled),input,textarea,select,[tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="icon-button modal-close"
          aria-label="Kapat"
          onClick={close}
        >
          <X size={21} />
        </button>
        <h2>{title}</h2>
        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        {children}
      </section>
    </div>
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
        <g transform="rotate(-9 146 170)">
          <rect x="66" y="165" width="155" height="31" rx="5" fill="#6d5bd3" />
          <path d="M75 170h139v19H75z" fill="#fffbed" />
          <path d="M85 175h125M85 181h125" stroke="#ddd6bf" strokeWidth="2" />
          <path d="M72 166v29" stroke="#483b91" strokeWidth="6" />
        </g>
        <g transform="rotate(6 150 152)">
          <rect x="80" y="135" width="160" height="27" rx="4" fill="#f48259" />
          <path d="M88 141h146v14H88z" fill="#fff9e9" />
          <path d="M100 147h127" stroke="#e3ddc4" strokeWidth="2" />
          <path d="M87 136v24" stroke="#d46743" strokeWidth="5" />
        </g>
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
          d="M103 78q19-3 43 7m-43 6q19-3 43 7m-43 6q19-3 32 3m43-20q20-9 39-9m-39 23q20-9 39-9m-39 23q20-9 29-9"
          stroke="#bcb6cf"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M189 64v39l8-7 8 4V60" fill="#a3be73" />
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
        <g fill="#6854c8">
          <path d="m238 41 3 10 10 3-10 4-3 10-4-10-10-4 10-3z" />
          <path d="m47 50 2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
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
    [data, setData] = useState(DEMO),
    [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState("all"),
    [mobileMenu, setMobileMenu] = useState(false),
    [theme, setTheme] = useState(
      localStorage.getItem("kutup-theme") || "lilac",
    );
  const [invite, setInvite] = useState(
      location.pathname.startsWith("/join/")
        ? location.pathname.split("/")[2]
        : "",
    ),
    [inviteInfo, setInviteInfo] = useState(null);
  const [notificationOn, setNotificationOn] = useState(false),
    [now, setNow] = useState(Date.now());
  const ownerPage = location.pathname === "/batur";
  const me = data.members.find((m) => m.id === session?.memberId);
  const here = data.members.filter((m) => ["here", "break"].includes(m.status));
  const focusMembers = data.members.filter((m) => m.focusEnd > now);
  const toastTimer = useRef(),
    finishInFlight = useRef(false);
  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  };
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kutup-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (ownerPage) {
      setLoading(false);
      return;
    }
    get("/session")
      .then((d) => {
        setSession({ memberId: d.memberId, pushPublicKey: d.pushPublicKey });
        setData(d);
      })
      .catch((e) => {
        if (e.status !== 401)
          notify("Sunucuya ulaşılamıyor. Şimdilik ön izleme açık.");
      })
      .finally(() => setLoading(false));
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
  useEffect(() => {
    if (!session) return;
    const source = new EventSource("/api/events");
    source.addEventListener("state", (event) => {
      setData(JSON.parse(event.data));
      setConnected(true);
    });
    source.onerror = () => setConnected(false);
    const refresh = () =>
      get("/state")
        .then(setData)
        .catch(() => setConnected(false));
    const poll = setInterval(refresh, 30000);
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", visible);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.ready
        .then((r) => r.pushManager?.getSubscription())
        .then(async (s) => {
          if (s) await api("/push", { subscription: s.toJSON() });
          setNotificationOn(!!s);
        })
        .catch(() => {});
    return () => {
      source.close();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [session?.memberId]);
  useEffect(() => {
    if (me?.focusEnd && me.focusEnd <= now && !finishInFlight.current) {
      finishInFlight.current = true;
      api("/focus", { action: "finish" })
        .then(() => {
          notify(
            `İşte bu! ${me.focusMinutes} dakika cebinde. Şimdi bir nefes. 🌱`,
          );
          return get("/state");
        })
        .then(setData)
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            finishInFlight.current = false;
          }, 10000);
        });
    }
  }, [me?.focusEnd, now]);
  const requireMember = (action) => {
    if (!session) {
      setModal("onboard");
      return;
    }
    action();
  };
  const mutate = async (path, body, success, method = "POST") => {
    try {
      await api(path, body, method);
      setData(await get("/state"));
      if (success) notify(success);
      return true;
    } catch (e) {
      notify(e.message);
      return false;
    }
  };
  const navigate = (id) => {
    setTab(id);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const joinSuccess = (d) => {
    setSession({ memberId: d.memberId, pushPublicKey: d.pushPublicKey });
    setData(d);
    setModal(null);
    setInvite("");
    setInviteInfo(null);
    history.replaceState({}, "", "/");
    notify("Ekibine hoş geldin. Şimdi güzel şeyler olur. ✨");
  };
  async function enableNotifications() {
    if (
      !("Notification" in window) ||
      !("PushManager" in window) ||
      !("serviceWorker" in navigator)
    ) {
      notify(
        "Bu tarayıcı bildirim desteklemiyor. iPhone’da Safari’den ana ekrana ekleyip açmayı dene.",
      );
      return;
    }
    try {
      if (notificationOn) {
        const reg = await navigator.serviceWorker.ready,
          sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api("/push", { endpoint: sub.endpoint }, "DELETE");
          await sub.unsubscribe();
        }
        setNotificationOn(false);
        notify("Bildirimler kapandı.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        notify(
          "Bildirim izni kapalı. Tarayıcının site ayarlarından açabilirsin.",
        );
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const base64 = session.pushPublicKey
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const applicationServerKey = Uint8Array.from(
        atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
        (c) => c.charCodeAt(0),
      );
      const sub =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }));
      await api("/push", { subscription: sub.toJSON() });
      setNotificationOn(true);
      notify("Biri gelince ya da kahveye çağırınca haberin olacak. 🔔");
    } catch {
      notify(
        "Bildirim bağlantısı kurulamadı. HTTPS ve tarayıcı izinlerini kontrol et.",
      );
    }
  }
  if (ownerPage) return <OwnerPage />;
  if (loading)
    return (
      <div className="loading-screen">
        <span className="brand">
          kütüp<span>✳</span>
        </span>
        <p>Bir sandalye çekiyoruz…</p>
        <LoaderCircle className="spin" />
      </div>
    );
  const visibleMembers = data.members.filter(
    (m) =>
      filter === "all" ||
      (filter === "here"
        ? ["here", "break"].includes(m.status)
        : m.status === filter),
  );
  return (
    <div className="app-shell">
      {mobileMenu && (
        <div className="sidebar-scrim" onClick={() => setMobileMenu(false)} />
      )}
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Kütüp ana sayfa"
        >
          kütüp<span>✳</span>
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
              {item.id === "focus" && <span className="nav-dot" />}
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
          <span className="tiny-star">✧</span>
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
              className={`icon-button notification-button ${notificationOn ? "enabled" : ""}`}
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
              <span>{session ? "Arkadaşını çağır" : "Ekibini kur"}</span>
            </button>
          </div>
        </header>
        {!session && (
          <div className="demo-banner">
            <Sparkles size={15} />
            <span>
              Bir küçük ön izleme. Gerçek hikâye senin ekibinle başlasın.
            </span>
            <button onClick={() => setModal("onboard")}>
              Yerini al <ArrowUpRight size={14} />
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
                  "Az laf, bol odak."
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
                      ? "Kulaklıkları tak. Büyük işleri küçük seanslara böl."
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
          {tab === "home" && (
            <div className="dashboard-grid">
              <section className="hero-card">
                <div className="hero-copy">
                  <span className="hero-location">
                    <MapPin size={13} /> MİLLİ KÜTÜPHANE, ANKARA
                  </span>
                  <h2>
                    Aynı masa.
                    <br />
                    Aynı motivasyon<span>.</span>
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
                  {visibleMembers.map((m) => (
                    <MemberCard
                      key={m.id}
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
                <AmbientSound />
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
                                  { action: "start", joinMember: m.id },
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
                  <p className="small muted">Son 60 mesaj burada görünür.</p>
                </div>
              </div>
            </div>
          )}
          {tab === "feedback" && (
            <FeedbackPage
              me={me}
              requireMember={requireMember}
              notify={notify}
            />
          )}
          <footer className="page-footer">
            <span>
              Biraz çalışma, biraz muhabbet. <span>kütüp ✳</span>
            </span>
            <span>Batur’dan, bizim tayfaya.</span>
          </footer>
        </div>
      </main>
      <nav className="mobile-bottom">
        {nav.slice(0, 3).map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => navigate(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className={tab === "feedback" ? "active" : ""}
          onClick={() => navigate("feedback")}
        >
          <Send size={19} />
          <span>Batur’a ilet</span>
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
          theme={theme}
          setTheme={setTheme}
          close={() => setModal(null)}
          mutate={mutate}
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

function MemberCard({ member: m, mine, now, onClick }) {
  return (
    <button className={`member-card ${m.color}`} onClick={onClick}>
      <div className="member-card-top">
        <Avatar member={m} />
        <Badge status={m.status} />
      </div>
      <div className="member-name">
        <h3>{m.name}</h3>
        {mine && <span>sen</span>}
        {m.focusEnd > now && <Headphones size={16} />}
      </div>
      <p className="member-note">
        {m.note || "Bu masada güzel şeyler olacak."}
      </p>
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
    [busy, setBusy] = useState(false);
  const running = !!me?.focusEnd,
    seconds = running
      ? Math.max(0, Math.ceil((me.focusEnd - now) / 1000))
      : duration * 60;
  const progress = running
    ? 1 - seconds / ((me.focusMinutes || duration) * 60)
    : 0;
  const control = async () => {
    setBusy(true);
    await mutate(
      "/focus",
      { action: running ? "cancel" : "start", minutes: duration },
      running
        ? "Seans durdu. Hazır olunca yeniden başla."
        : "Dünya biraz beklesin. Şimdi odak zamanı. 🎧",
    );
    setBusy(false);
  };
  return (
    <section className={`focus-card ${compact ? "compact" : ""}`}>
      <div className="focus-card-header">
        <span>
          <Headphones size={18} /> ODAK MODU
        </span>
        <span className="focus-spark">✧</span>
      </div>
      <h2>{running ? "Şu an kendin için." : "Bir küçük odak arası."}</h2>
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
          {String(Math.floor(seconds / 60)).padStart(2, "0")}
          <i>:</i>
          {String(seconds % 60).padStart(2, "0")}
          <span>
            {running ? "sen, işin ve biraz sessizlik" : "dakika sadece kendine"}
          </span>
        </div>
      </div>
      {!running && (
        <div className="duration-options">
          {[25, 45, 50].map((n) => (
            <button
              key={n}
              className={duration === n ? "active" : ""}
              onClick={() => setDuration(n)}
            >
              {n} dk
            </button>
          ))}
        </div>
      )}
      <Busy
        loading={busy}
        className="btn focus-start"
        onClick={() => requireMember(control)}
      >
        {running ? (
          <Square size={14} />
        ) : (
          <Play size={15} fill="currentColor" />
        )}
        {running ? "Seansı durdur" : "Hadi odaklanalım"}
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
          {shortTime(plan.starts)} · {plan.attendees.length} kişi geliyor
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
                    {dateLabel(plan.starts)} · {shortTime(plan.starts)}
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
function ProfileFields({ value, setValue }) {
  return (
    <>
      <div className="profile-preview">
        <Avatar member={value} size="large" />
        <div>
          <strong>{value.name || "Senin güzel ismin"}</strong>
          <p>{value.note || "Bu köşe tamamen senin."}</p>
        </div>
      </div>
      <label className="field-label">
        Sana ne diyelim?
        <input
          required
          minLength={2}
          maxLength={24}
          placeholder="İsmin ya da takma adın"
          value={value.name}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
          autoComplete="nickname"
        />
      </label>
      <label className="field-label">
        Masa notun <span>isteğe bağlı</span>
        <input
          maxLength={70}
          placeholder="Örn. final boss: finaller"
          value={value.note}
          onChange={(e) => setValue({ ...value, note: e.target.value })}
        />
      </label>
      <label className="field-label">Küçük alter egon</label>
      <div className="avatar-options">
        {AVATARS.map((a) => (
          <button
            type="button"
            key={a}
            className={value.avatar === a ? "selected" : ""}
            aria-label={`Avatar ${a}`}
            aria-pressed={value.avatar === a}
            onClick={() => setValue({ ...value, avatar: a })}
          >
            {a}
          </button>
        ))}
      </div>
      <label className="field-label">Senin rengin</label>
      <div className="color-options">
        {COLORS.map((c) => (
          <button
            type="button"
            key={c}
            className={`${c} ${value.color === c ? "selected" : ""}`}
            aria-label={COLOR_NAMES[c]}
            aria-pressed={value.color === c}
            onClick={() => setValue({ ...value, color: c })}
          >
            {value.color === c ? <Check size={17} /> : null}
          </button>
        ))}
      </div>
    </>
  );
}
function Onboard({ invite, inviteInfo, close, onSuccess, existing }) {
  const [value, setValue] = useState({
      name: "",
      avatar: "🪐",
      color: "lilac",
      note: "",
    }),
    [groupName, setGroupName] = useState("Bizim tayfa"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onSuccess(
        await api(invite ? "/join" : "/groups", {
          ...value,
          groupName,
          invite,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={invite ? "Ekibin seni bekliyor. ✨" : "Güzel bir ekip kuralım. ✳"}
      subtitle={
        invite
          ? `${inviteInfo?.name || "Arkadaşların"} · ${inviteInfo?.count || 0} kişi yerini aldı. Sıra sende.`
          : "Bir isim, bir avatar. Sonra bağlantıyı arkadaşlarına at."
      }
      close={close}
    >
      <form onSubmit={submit}>
        {!invite && (
          <label className="field-label">
            Ekibinizin adı
            <input
              required
              minLength={2}
              maxLength={40}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </label>
        )}
        <ProfileFields value={value} setValue={setValue} />
        {existing && (
          <p className="form-warning">
            Yeni ekibe katılınca bu tarayıcıdaki mevcut oturumun değişir.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Busy loading={busy} className="btn primary full" type="submit">
          {invite ? "Ben de buradayım" : "Ekibimizi kuralım"}{" "}
          <ArrowRight size={17} />
        </Busy>
        <p className="form-footnote">
          <ShieldCheck size={14} /> E-posta yok, şifre yok. Oturumun bu
          tarayıcıda kalır.
          <br />
          Davet bağlantısı olanlar katılabilir; güvendiğin kişilerle paylaş.
        </p>
      </form>
    </Modal>
  );
}
function ProfileModal({ me, theme, setTheme, close, mutate }) {
  const [value, setValue] = useState({
      name: me.name,
      avatar: me.avatar,
      color: me.color,
      note: me.note,
    }),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Tam senlik bir köşe."
      subtitle="İnsan masasına biraz kendini katmalı."
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (await mutate("/profile", value, "Yeni havan ekibe yansıdı. ✨"))
            close();
          setBusy(false);
        }}
      >
        <ProfileFields value={value} setValue={setValue} />
        <div className="theme-section">
          <label className="field-label">Ekranın da senin renginde olsun</label>
          <div className="theme-options">
            {["lilac", "mint", "peach"].map((c) => (
              <button
                key={c}
                type="button"
                className={`${c} ${theme === c ? "selected" : ""}`}
                onClick={() => setTheme(c)}
              >
                {theme === c && <Check size={13} />}
                {COLOR_NAMES[c]}
              </button>
            ))}
          </div>
          <small>Sadece senin ekranında değişir.</small>
        </div>
        <Busy loading={busy} type="submit" className="btn primary full">
          Böyle çok daha ben <Sparkles size={16} />
        </Busy>
      </form>
    </Modal>
  );
}
function PresenceModal({ me, coming, close, mutate }) {
  const [status, setStatus] = useState(coming ? "coming" : "here"),
    [location, setLocation] = useState(me.location || "1. kat · Sessiz salon"),
    [desk, setDesk] = useState(me.desk || ""),
    [arrival, setArrival] = useState("30 dakika içinde"),
    [busy, setBusy] = useState(false);
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
              { status, location, desk, arrival },
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
                {[
                  "Zemin · Genel salon",
                  "1. kat · Sessiz salon",
                  "2. kat · Okuma salonu",
                  "Grup çalışma alanı",
                  "Kafeterya",
                  "Bahçe",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
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
      {navigator.share && (
        <button
          className="btn outline full"
          onClick={() =>
            navigator
              .share({
                title: `${group.name} · Kütüp`,
                text: "Kütüpte kim var diye sormaya son. Bizim ekibe gel! ✳",
                url,
              })
              .catch(() => {})
          }
        >
          <Send size={16} /> Arkadaşlarına gönder
        </button>
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
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Güzel bir plan var. 🗓️"
      subtitle="Bir zaman seç. Gerisi bir “ben de gelirim”e bakar."
      close={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (
            await mutate(
              "/plans",
              { starts: new Date(`${date}T${time}:00+03:00`).getTime(), note },
              "Plan panoda. Ekibin katılabilir!",
            )
          )
            close();
          setBusy(false);
        }}
      >
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
        </p>
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
function MemberModal({ member, close, mutate }) {
  return (
    <Modal title={`${member.name}’in köşesi`} close={close}>
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
              : `${member.location || "Milli Kütüphane"}${member.desk ? ` · ${member.desk}` : ""}`}
        </p>
        <div className="detail-stat">
          <Flame size={20} />
          <strong>{member.focusToday} dk</strong>
          <span>bugünün odağı</span>
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
function FeedbackPage({ me, requireMember, notify }) {
  const [kind, setKind] = useState("idea"),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [mine, setMine] = useState([]);
  useEffect(() => {
    if (me)
      get("/feedback")
        .then(setMine)
        .catch(() => {});
  }, [me?.id, sent]);
  const send = (e) => {
    e.preventDefault();
    requireMember(async () => {
      setBusy(true);
      try {
        await api("/feedback", { kind, text });
        setText("");
        setSent(true);
        notify("Notun Batur’un kutusunda. İyi ki yazdın. 💌");
      } catch (e) {
        notify(e.message);
      } finally {
        setBusy(false);
      }
    });
  };
  return (
    <div className="feedback-layout">
      <div>
        <section className="feedback-card">
          <div className="feedback-intro">
            <span className="feedback-stamp">
              Batur’a
              <br />
              <b>özel posta ↗</b>
            </span>
            <span className="envelope-art">💌</span>
            <span className="eyebrow">OKUNDUĞUN BİR YER</span>
            <h2>
              “Aga, aklıma
              <br />
              bir şey geldi…”
            </h2>
            <p>Tam olarak bunun için buradayız.</p>
          </div>
          {sent ? (
            <div className="feedback-success">
              <span>✳</span>
              <h3>Mesajın yerini buldu.</h3>
              <p>
                Batur’un özel kutusunda. Aşağıdan durumunu takip edebilirsin.
              </p>
              <button className="btn outline" onClick={() => setSent(false)}>
                Bir not daha bırak <Plus size={15} />
              </button>
            </div>
          ) : (
            <form className="feedback-form" onSubmit={send}>
              <label className="field-label">Hangi kafadayız?</label>
              <div className="feedback-types">
                {Object.entries(FEEDBACK).map(([id, [emoji, title]]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setKind(id)}
                    className={kind === id ? "selected" : ""}
                  >
                    <span>{emoji}</span>
                    {title}
                    {kind === id && <Check size={14} />}
                  </button>
                ))}
              </div>
              <label className="field-label" htmlFor="feedback-text">
                Anlat bakalım
              </label>
              <textarea
                id="feedback-text"
                required
                minLength={5}
                maxLength={1200}
                rows={6}
                placeholder={FEEDBACK[kind][2]}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="feedback-form-meta">
                <span>
                  <ShieldCheck size={14} /> Sadece Batur görür.
                </span>
                <span>{text.length}/1200</span>
              </div>
              <Busy loading={busy} className="btn dark full" type="submit">
                Batur’a uçur <Send size={17} />
              </Busy>
            </form>
          )}
        </section>
        {mine.length > 0 && (
          <section className="panel my-feedback">
            <h3>Uçurduğun notlar</h3>
            {mine.map((f) => (
              <article key={f.id}>
                <span>{FEEDBACK[f.kind][0]}</span>
                <div>
                  <p>{f.text}</p>
                  <small>
                    {dateLabel(f.created)} · <b>{FEEDBACK_STATUS[f.status]}</b>
                  </small>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
      <aside className="feedback-aside">
        <div className="batur-avatar">
          👨‍💻<span>burayı yapan eleman</span>
        </div>
        <h3>Selam, ben Batur.</h3>
        <p>
          Burası hepimizin biraz daha severek kullanacağı bir yer olsun
          istiyorum.
        </p>
        <p>
          Bir şeye takıldın mı, “şu olsa efsane olur” mu dedin? Yaz. Cidden
          okuyorum.
        </p>
        <span className="handwritten">beraber güzelleştirelim ↙</span>
        <div className="feedback-promise">
          <Heart size={18} />
          <p>
            Kötü fikir yok.
            <br />
            Söylenmemiş fikir var.
          </p>
        </div>
      </aside>
    </div>
  );
}
function OwnerPage() {
  const [key, setKey] = useState(""),
    [items, setItems] = useState(null),
    [filter, setFilter] = useState("all"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      setItems(
        await api("/owner/feedback", undefined, "GET", { "X-Owner-Key": key }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="owner-page">
      <a className="brand" href="/">
        kütüp<span>✳</span>
      </a>
      <div className="owner-heading">
        <span className="eyebrow">BATUR’A ÖZEL</span>
        <h1>Tayfadan sana. 💌</h1>
        <p>Fikirler, geri dönüşler, küçük bug’lar. Hepsi bir kutuda.</p>
      </div>
      {!items ? (
        <form className="panel owner-login" onSubmit={load}>
          <label className="field-label">
            Yönetici anahtarı
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
              required
              placeholder="Sadece sende olan anahtar"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <Busy loading={busy} className="btn primary full" type="submit">
            Kutuyu aç <ArrowRight size={16} />
          </Busy>
          <p className="form-footnote">
            Yayın ayarlarındaki ADMIN_KEY veya sunucunun data/batur-key.txt
            dosyasındaki anahtar.
          </p>
        </form>
      ) : (
        <>
          <div className="owner-toolbar">
            <div className="filter-row">
              {[
                ["all", "Hepsi"],
                ["new", "Yeni"],
                ["planned", "Listemde"],
                ["done", "Hallettim"],
              ].map(([id, name]) => (
                <button
                  className={`filter-chip ${filter === id ? "selected" : ""}`}
                  key={id}
                  onClick={() => setFilter(id)}
                >
                  {name}
                  <span>
                    {
                      items.filter((x) => id === "all" || x.status === id)
                        .length
                    }
                  </span>
                </button>
              ))}
            </div>
            <button className="btn outline" onClick={load}>
              Yenile
            </button>
            <button
              className="text-button"
              onClick={() => {
                setItems(null);
                setKey("");
              }}
            >
              Kilitle
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="owner-grid">
            {items
              .filter((x) => filter === "all" || x.status === filter)
              .map((f) => (
                <article className="panel owner-note" key={f.id}>
                  <div className="message-meta">
                    <Avatar member={f} size="small" />
                    <div>
                      <strong>{f.name}</strong>
                      <small>{f.group_name}</small>
                    </div>
                    <span>
                      {FEEDBACK[f.kind][0]} {FEEDBACK[f.kind][1]}
                    </span>
                  </div>
                  <p>{f.text}</p>
                  <div className="owner-note-bottom">
                    <time>
                      {dateLabel(f.created)} · {shortTime(f.created)}
                    </time>
                    <select
                      aria-label={`${f.name} mesajının durumu`}
                      value={f.status}
                      onChange={async (e) => {
                        try {
                          await api(
                            `/owner/feedback/${f.id}`,
                            { status: e.target.value },
                            "POST",
                            { "X-Owner-Key": key },
                          );
                          await load();
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                    >
                      {Object.entries(FEEDBACK_STATUS).map(([id, title]) => (
                        <option key={id} value={id}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
          </div>
          {!items.filter((x) => filter === "all" || x.status === filter)
            .length && (
            <Empty emoji="📭" title="Bu göz şimdilik boş.">
              Ekibin yazdıkça notlar burada toplanacak.
            </Empty>
          )}
        </>
      )}
    </main>
  );
}
