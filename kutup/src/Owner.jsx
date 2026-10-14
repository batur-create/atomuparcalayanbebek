// Batur’s panel at /batur: requests with one-tap stages, teams and members.
import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Copy,
  Download,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Trash2,
  UserMinus,
} from "lucide-react";
import { api, get, FEEDBACK, STATUS, dateLabel, shortTime } from "./api.js";
import { allowedStatuses, statusLabel } from "../shared/requests.js";
import { Avatar, Busy, Empty, pushKey, pushSupported, storage } from "./ui.jsx";
import { RequestTracker, ago } from "./Requests.jsx";
import { Modal } from "./Modal.jsx";

const STAGE_FILTERS = [
  ["open", "Bekleyen", "📮"],
  ["seen", "İncelenen", "👀"],
  ["accepted", "Kabul", "🎉"],
  ["building", "Yapılıyor", "🛠️"],
  ["done", "Bitti", "🚀"],
  ["declined", "Olmadı", "🙈"],
  ["all", "Hepsi", "✳"],
];
const inFilter = (item, filter) =>
  filter === "all" || (filter === "open" ? item.status === "new" : item.status === filter);

function RequestRow({ item, open, toggle, update, remove }) {
  const [reply, setReply] = useState(item.reply || ""),
    [busy, setBusy] = useState(""),
    [sentNote, setSentNote] = useState("");
  useEffect(() => setReply(item.reply || ""), [item.reply]);
  const [kindEmoji, kindTitle] = FEEDBACK[item.kind] || FEEDBACK.idea;
  const [label, emoji] = statusLabel(item.kind, item.status);
  const run = async (key, body, done) => {
    setBusy(key);
    const ok = await update(item.id, body);
    setBusy("");
    if (ok) setSentNote(done);
  };
  return (
    <article className={`panel owner-request ${open ? "open" : ""} ${item.status === "new" ? "unread" : ""}`}>
      <button
        className="owner-request-head"
        aria-expanded={open}
        onClick={toggle}
      >
        <Avatar member={item} size="small" />
        <span className="owner-request-who">
          <strong>{item.name}</strong>
          <small>
            {item.groupName} · {ago(item.created)}
          </small>
        </span>
        <span className={`stage-chip ${item.status}`}>
          {emoji} {label}
        </span>
        <ChevronDown size={18} className="owner-request-chevron" />
      </button>
      <p className={`owner-request-text ${open ? "" : "clamped"}`}>
        <span className="owner-kind">
          {kindEmoji} {kindTitle}
        </span>
        {item.text}
      </p>
      {open && (
        <div className="owner-request-body">
          <p className="owner-request-meta">
            {item.name}, {item.groupName} ekibinde · {dateLabel(item.created)}{" "}
            {shortTime(item.created)} gönderdi
          </p>
          <div className="stage-buttons" role="group" aria-label="Aşamayı seç">
            {allowedStatuses(item.kind)
              .filter((status) => status !== "new")
              .map((status) => {
                const [stageLabel, stageEmoji] = statusLabel(item.kind, status);
                return (
                  <Busy
                    key={status}
                    loading={busy === status}
                    className={`stage-button ${status} ${item.status === status ? "active" : ""}`}
                    aria-pressed={item.status === status}
                    disabled={item.status === status || !!busy}
                    onClick={() =>
                      run(
                        status,
                        { status },
                        `Aşama “${stageLabel}” oldu. ${item.name} bildirimi açıksa telefonuna düştü 🔔`,
                      )
                    }
                  >
                    {stageEmoji} {stageLabel}
                  </Busy>
                );
              })}
          </div>
          <label className="field-label">
            {item.name} için not <span>isteğe bağlı · isteğin altında görünür</span>
            <textarea
              rows={2}
              maxLength={600}
              value={reply}
              placeholder="Örn. Süper fikir, cuma akşamına hazır!"
              onChange={(e) => setReply(e.target.value)}
            />
          </label>
          <div className="owner-request-actions">
            <Busy
              className="btn primary"
              loading={busy === "reply"}
              disabled={reply === (item.reply || "") || !!busy}
              onClick={() =>
                run("reply", { reply }, `Not kaydedildi; ${item.name} isteğinin altında görecek 💬`)
              }
            >
              <Bell size={15} /> Notu gönder
            </Busy>
            <button
              className="text-button danger"
              onClick={() => {
                if (confirm("Bu istek kalıcı olarak silinsin mi?")) remove(item.id);
              }}
            >
              <Trash2 size={15} /> Sil
            </button>
          </div>
          {sentNote && <p className="owner-sent">{sentNote}</p>}
          <div className="owner-preview">
            <span>{item.name}, Batur’a ilet sayfasında bunu görüyor</span>
            <RequestTracker item={item} />
          </div>
          <ol className="owner-history">
            {item.events.map((event, i) => {
              const [eventLabel, eventEmoji] = statusLabel(item.kind, event.status);
              return (
                <li key={i}>
                  <span>{eventEmoji}</span>
                  {eventLabel}
                  <time>
                    {dateLabel(event.created)} {shortTime(event.created)}
                  </time>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </article>
  );
}

export function OwnerPage() {
  const [key, setKey] = useState(""),
    [confirmKey, setConfirmKey] = useState(""),
    [status, setStatus] = useState(null),
    [items, setItems] = useState(null),
    [groups, setGroups] = useState([]),
    [view, setView] = useState("requests"),
    [filter, setFilter] = useState("open"),
    [openId, setOpenId] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState(null),
    [copied, setCopied] = useState(false),
    [pushOn, setPushOn] = useState(!!storage.get("kutup-owner-push"));
  // One browser has one push subscription; it may already serve the member side,
  // so turning owner alerts off only forgets it here and never unsubscribes.
  const toggleOwnerPush = async () => {
    setError("");
    if (!pushSupported) {
      setError("Bu tarayıcı bildirim desteklemiyor. iPhone’da Kütüp’ü ana ekrandan aç.");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      if (pushOn) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) await api("/owner/push", { endpoint: sub.endpoint }, "DELETE");
        storage.set("kutup-owner-push", "");
        setPushOn(false);
        return;
      }
      if ((await Notification.requestPermission()) !== "granted") {
        setError("Bildirim izni kapalı. Tarayıcının site ayarlarından açabilirsin.");
        return;
      }
      const sub =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: pushKey(status.pushPublicKey),
        }));
      await api("/owner/push", { subscription: sub.toJSON() });
      storage.set("kutup-owner-push", sub.endpoint);
      setPushOn(true);
    } catch (e) {
      setError(e.message || "Bildirim bağlantısı kurulamadı.");
    }
  };
  const load = async () => {
    setError("");
    try {
      const [requests, teams] = await Promise.all([
        get("/owner/feedback"),
        get("/owner/groups"),
      ]);
      setItems(requests);
      setGroups(teams);
      if (!requests.some((x) => x.status === "new")) setFilter("all");
    } catch (e) {
      if (e.status === 401) setItems(null);
      setError(e.message);
    }
  };
  useEffect(() => {
    get("/owner/status")
      .then((d) => {
        setStatus(d);
        if (d.signedIn) load();
      })
      .catch(() => setStatus({ claimed: true, signedIn: false }));
  }, []);
  useEffect(() => {
    if (!status?.signedIn || !pushSupported || !storage.get("kutup-owner-push")) return;
    let gone = false;
    navigator.serviceWorker.register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((r) => r.pushManager.getSubscription())
      .then(async (sub) => {
        if (gone) return;
        if (sub) await api("/owner/push", { subscription: sub.toJSON() });
        setPushOn(!!sub);
      })
      .catch(() => { if (!gone) setError("Bildirim bağlantısı yenilenemedi. Bildirim düğmesinden tekrar deneyebilirsin."); });
    return () => { gone = true; };
  }, [status?.signedIn]);
  const signIn = async (e) => {
    e.preventDefault();
    if (status?.claimed === false && key !== confirmKey) {
      setError("İki anahtar aynı değil.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(status?.claimed === false ? "/owner/claim" : "/owner/login", { key });
      setKey("");
      setConfirmKey("");
      setStatus((s) => ({ ...s, claimed: true, signedIn: true }));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    await api("/owner/logout", {}).catch(() => {});
    setItems(null);
    setStatus((s) => ({ ...s, claimed: true, signedIn: false }));
  };
  const replaceItem = (item) =>
    item && setItems((list) => list.map((x) => (x.id === item.id ? item : x)));
  const toggle = async (item) => {
    const opening = openId !== item.id;
    setOpenId(opening ? item.id : null);
    if (opening && item.status === "new") {
      try {
        replaceItem((await api(`/owner/feedback/${item.id}/seen`, {})).item);
      } catch (e) {
        setError(e.message);
      }
    }
  };
  const update = async (id, body) => {
    try {
      replaceItem((await api(`/owner/feedback/${id}`, body)).item);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  const remove = async (id) => {
    try {
      await api(`/owner/feedback/${id}`, undefined, "DELETE");
      setItems((list) => list.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };
  const act = async (fn) => {
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  // The open request stays on screen even after its stage moves it out of the filter.
  const shown = (items || []).filter((x) => inFilter(x, filter) || x.id === openId);
  return (
    <main className="owner-page">
      <a className="brand" href="/">
        kütüp<span>✳</span>
      </a>
      <div className="owner-heading">
        <span className="eyebrow">BATUR’A ÖZEL</span>
        <h1>Tayfadan sana. 💌</h1>
        <p>İstekler, hatalar, güzel laflar ve ekipler. Hepsi bu masada.</p>
      </div>
      {!items ? (
        status === null ? null : (
          <form className="panel owner-login" onSubmit={signIn}>
            {status.claimed === false && (
              <p className="form-warning">
                <Lock size={14} /> Kutu henüz kilitlenmedi. Kendi anahtarını
                belirle; bundan sonra sadece bu anahtar açar.
              </p>
            )}
            <label className="field-label">
              {status.claimed === false ? "Yeni anahtar" : "Yönetici anahtarı"}
              {status.claimed === false && <span>en az 12 karakter</span>}
              <input
                type="password"
                minLength={status.claimed === false ? 12 : undefined}
                required
                autoComplete={status.claimed === false ? "new-password" : "current-password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Sadece sende olan anahtar"
              />
            </label>
            {status.claimed === false && (
              <label className="field-label">
                Bir kez daha
                <input
                  type="password"
                  minLength={12}
                  required
                  autoComplete="new-password"
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                />
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <Busy loading={busy} className="btn primary full" type="submit">
              {status.claimed === false ? (
                <>
                  Kutuyu kilitle ve aç <KeyRound size={16} />
                </>
              ) : (
                <>
                  Kutuyu aç <ArrowRight size={16} />
                </>
              )}
            </Busy>
            <p className="form-footnote">
              Bu cihaz seni 30 gün hatırlar. Ortak bir bilgisayardaysan
              işin bitince çıkış yapmayı unutma.
            </p>
          </form>
        )
      ) : (
        <>
          <div className="owner-toolbar">
            <div className="filter-row">
              <button
                className={`filter-chip ${view === "requests" ? "selected" : ""}`}
                onClick={() => setView("requests")}
              >
                İstekler <span>{items.length}</span>
              </button>
              <button
                className={`filter-chip ${view === "groups" ? "selected" : ""}`}
                onClick={() => setView("groups")}
              >
                Ekipler <span>{groups.length}</span>
              </button>
            </div>
            <button className="btn outline" onClick={load}>
              <RefreshCw size={15} /> Yenile
            </button>
            <button
              className={`btn ${pushOn ? "joined" : "primary"}`}
              aria-pressed={pushOn}
              onClick={toggleOwnerPush}
            >
              <Bell size={15} />
              {pushOn ? "Yeni istekler telefonuma geliyor" : "Yeni istekleri bana bildir"}
            </button>
            <button className="text-button" onClick={signOut}>
              <Lock size={15} /> Bu cihazdan çık
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
          {view === "requests" ? (
            <>
              <div className="filter-row owner-filters">
                {STAGE_FILTERS.map(([id, name, emoji]) => (
                  <button
                    className={`filter-chip ${filter === id ? "selected" : ""}`}
                    key={id}
                    onClick={() => setFilter(id)}
                  >
                    {emoji} {name}
                    <span>{items.filter((x) => inFilter(x, id)).length}</span>
                  </button>
                ))}
              </div>
              <div className="owner-requests">
                {shown.map((item) => (
                  <RequestRow
                    key={item.id}
                    item={item}
                    open={openId === item.id}
                    toggle={() => toggle(item)}
                    update={update}
                    remove={remove}
                  />
                ))}
              </div>
              {!shown.length && (
                <Empty
                  emoji={filter === "open" ? "🧘" : "📭"}
                  title={filter === "open" ? "Bekleyen istek yok." : "Bu aşamada istek yok."}
                >
                  Biri “Batur’a uçur” dediğinde burada belirir.
                  {pushOn ? " Telefonuna da haber gelir." : " Bildirimi açarsan telefonuna da düşer."}
                </Empty>
              )}
            </>
          ) : (
            <div className="owner-groups">
              {groups.map((g) => (
                <article className="panel owner-group" key={g.id}>
                  <div className="owner-group-head">
                    <div>
                      <h2>{g.name}</h2>
                      <small>
                        {g.members.length} kişi
                        {g.created ? ` · ${dateLabel(g.created)} kuruldu` : ""}
                      </small>
                    </div>
                    <button
                      className="btn outline"
                      onClick={() => {
                        if (
                          confirm(
                            "Davet bağlantısı yenilensin mi? Eski bağlantı çalışmaz; yenisini ekip içinden paylaşırsınız.",
                          )
                        )
                          act(() => api(`/owner/groups/${g.id}/invite`, {}));
                      }}
                    >
                      <RefreshCw size={15} /> Daveti yenile
                    </button>
                    <button
                      className="text-button"
                      onClick={async () => {
                        try {
                          const data = await get("/owner/backup");
                          const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `kutup-yedek-${new Date().toISOString().slice(0, 10)}.json`;
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        } catch (e) {
                          alert(e.message);
                        }
                      }}
                    >
                      <Download size={15} /> Tüm veriyi yedekle
                    </button>
                  </div>
                  <ul>
                    {g.members.map((m) => (
                      <li key={m.id}>
                        <Avatar member={m} size="small" />
                        <div>
                          <strong>{m.name}</strong>
                          <small>
                            {m.username ? `@${m.username}` : "kullanıcı adı yok"} · {STATUS[m.status]?.[0]} · son görülme{" "}
                            {m.seen ? `${dateLabel(m.seen)} ${shortTime(m.seen)}` : "—"}
                          </small>
                          <small>
                            {m.devices} cihaz · {Math.round((m.minutes || 0) / 60)} sa odak · {m.builds} bina
                          </small>
                        </div>
                        <button
                          className="icon-button"
                          aria-label={`${m.name} için giriş kodu üret`}
                          title="Giriş / şifre sıfırlama kodu"
                          onClick={async () => {
                            try {
                              const r = await api(`/owner/members/${m.id}/reset`, {});
                              setRecovery({ name: m.name, ...r });
                              setCopied(false);
                            } catch (e) {
                              alert(e.message);
                            }
                          }}
                        >
                          <KeyRound size={17} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`${m.name} için tüm cihazlarda oturumu kapat`}
                          title="Tüm cihazlarda oturumu kapat"
                          onClick={() => {
                            if (confirm(`${m.name} tüm cihazlarda çıkış yapsın mı? Verileri silinmez; kullanıcı adı ya da kodla yeniden girer.`))
                              act(() => api(`/owner/members/${m.id}/signout`, {}));
                          }}
                        >
                          <LogOut size={17} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`${m.name} kişisini ekipten çıkar`}
                          onClick={() => {
                            if (
                              confirm(
                                `${m.name} ekipten çıkarılsın mı? Profili, mesajları ve planları silinir.`,
                              )
                            )
                              act(() => api(`/owner/members/${m.id}`, undefined, "DELETE"));
                          }}
                        >
                          <UserMinus size={17} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
              {!groups.length && (
                <Empty emoji="🪑" title="Henüz ekip yok.">
                  Ana sayfadan ilk ekibi kurduğunda burada görünür.
                </Empty>
              )}
            </div>
          )}
        </>
      )}
      {recovery && (
        <Modal title={`${recovery.name} için bir anahtar 🔑`} subtitle="24 saat geçerli, yalnızca bir kez kullanılabilir." close={() => setRecovery(null)}>
          <label className="field-label">Giriş / şifre sıfırlama kodu
            <input className="recovery-code" readOnly value={recovery.code} onFocus={(e) => e.target.select()} />
          </label>
          <button className="btn primary full" onClick={async () => {
            try { await navigator.clipboard.writeText(recovery.code); setCopied(true); }
            catch { setCopied(false); document.querySelector(".recovery-code")?.focus(); }
          }}><Copy size={16} /> {copied ? "Kopyalandı ✨" : "Kodu kopyala"}</button>
          <p className="form-footnote" role="status">{copied ? "Hazır. Kodu yalnızca bu hesabın sahibine gönder." : "Giriş yap → Şifremi unuttum ekranında yeni şifre belirleyebilir; Kodla sekmesinden de hesabını açabilir."}</p>
        </Modal>
      )}
    </main>
  );
}
