// Account entry, profile customization and moving between devices.
import React, { useEffect, useState } from "react";
import { ArrowRight, Check, KeyRound, LogOut, Moon, Plus, ShieldCheck, Smartphone, Sparkles, Sun, SunMoon } from "lucide-react";
import { api, AVATARS, COLORS, COLOR_NAMES, FOUNDER_AVATARS, THEMES } from "./api.js";
import { isIOS, standalone, Avatar, Busy } from "./ui.jsx";
import { Modal } from "./Modal.jsx";
import { MemberStats } from "./Stats.jsx";
import { sunTimes } from "./villageWorld.js";
import { ACCESSORIES, AVATAR_GROUPS, CHARACTERS, FOUNDER_CHARACTERS, composeAvatar, fitsCharacter, parseAvatar, randomCharacter } from "../shared/avatars.js";
const LOGIN_TABS = [["login", "Giriş"], ["reset", "Şifremi unuttum"], ["code", "Kodla"]];
const MODE_CHOICES = [["auto", SunMoon, "Otomatik"], ["light", Sun, "Açık"], ["dark", Moon, "Koyu"]];
const clock = (hours) => {
  const m = Math.round(hours * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
function modeHint(mode) {
  if (mode === "light") return "Hep açık, gece de gündüz de.";
  if (mode === "dark") return "Hep koyu. Gözlerin dinlensin. 🌙";
  const { sunrise, sunset } = sunTimes();
  return `Güneş batınca koyulaşır, doğunca açılır. Bugün gün batımı ${clock(sunset)}, gün doğumu ${clock(sunrise)}.`;
}

const slotOf = (id) => ACCESSORIES.find((a) => a.id === id)?.slot;
// Characters (with accessories to try on) or the old emoji, side by side.
function AvatarPicker({ value, setValue }) {
  const dev = value.badge === "dev";
  const picked = parseAvatar(value.avatar);
  const [tab, setTab] = useState(picked || !value.avatar ? "chars" : "emoji");
  const [acc, setAcc] = useState(picked?.acc || []);
  const groups = AVATAR_GROUPS.filter(([id]) => dev || id !== "kurucu");
  const cast = [...CHARACTERS, ...(dev ? FOUNDER_CHARACTERS : [])];
  const choose = (id, list = acc) => setValue({ ...value, avatar: composeAvatar(id, list) });
  const toggle = (id) => {
    const next = acc.includes(id) ? acc.filter((x) => x !== id) : [...acc.filter((x) => slotOf(x) !== slotOf(id)), id];
    setAcc(next);
    if (picked) choose(picked.ch.id, next);
  };
  const tabs = [["chars", "Karakterler"], ["emoji", "Emojiler"]];
  return (
    <>
      <div className="avatar-tabs" role="tablist" aria-label="Avatar türü">
        {tabs.map(([id, label]) => (
          <button type="button" role="tab" key={id} aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "chars" ? (
        <div className="avatar-cast">
          {groups.map(([group, title]) => (
            <div key={group} className="avatar-group">
              <span className="avatar-group-title">{title}</span>
              <div className="avatar-options chars">
                {cast
                  .filter((c) => c.group === group)
                  .map((c) => {
                    const on = picked?.ch.id === c.id;
                    return (
                      <button type="button" key={c.id} className={on ? "selected" : ""} aria-label={c.name} aria-pressed={on} title={c.name} onClick={() => choose(c.id)}>
                        <Avatar member={{ avatar: composeAvatar(c.id, acc), color: value.color }} />
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          <div className="avatar-group">
            <span className="avatar-group-title">
              Aksesuarlar {picked ? <em>{picked.ch.name}</em> : <em>önce bir karakter seç</em>}
            </span>
            <div className="acc-options">
              {ACCESSORIES.map((a) => {
                const on = acc.includes(a.id);
                return (
                  <button type="button" key={a.id} className={on ? "selected" : ""} aria-pressed={on} disabled={picked && !fitsCharacter(picked.ch, a.id)} onClick={() => toggle(a.id)}>
                    <span aria-hidden="true">{a.emoji}</span> {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="avatar-options">
          {[...AVATARS, ...(dev ? FOUNDER_AVATARS : [])].map((a) => (
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
      )}
    </>
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
      <AvatarPicker value={value} setValue={setValue} />
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
export function Welcome({ invite, inviteInfo, open }) {
  return (
    <main className="welcome">
      <section className="welcome-card">
        <span className="brand welcome-brand">
          kütüp<span data-door="">✳</span>
        </span>
        <h1>{invite ? `${inviteInfo?.name || "Ekibin"} seni bekliyor.` : "Kim nerede, artık sormak yok."}</h1>
        <p>
          Milli Kütüphane’ye giden arkadaşlar için: kim kütüpte, kim yolda, kim ne zaman geliyor. Odaklandıkça ortak köyünüz büyür.
        </p>
        <div className="welcome-actions">
          {invite && (
            <button className="btn primary full" onClick={() => open("onboard")}>
              Ekibe katıl <ArrowRight size={17} />
            </button>
          )}
          <button className={`btn ${invite ? "outline" : "primary"} full`} onClick={() => open("login")}>
            <KeyRound size={16} /> Giriş yap
          </button>
          {!invite && (
            <button className="btn outline full" onClick={() => open("onboard")}>
              <Plus size={16} /> Yeni ekip kur
            </button>
          )}
        </div>
        <p className="welcome-note">
          {invite
            ? "Hesabın varsa giriş yap; yoksa ekibe katılırken kullanıcı adı ve şifreni belirlersin."
            : "Arkadaşından davet linki geldiyse linke dokun, doğrudan ekibine katılırsın. Tek başına çalışmak istersen kendi ekibini kur. Şifreni unuttuysan Batur’dan giriş kodu iste."}
        </p>
      </section>
    </main>
  );
}
export function Onboard({ invite, inviteInfo, close, onSuccess, existing, start }) {
  const [value, setValue] = useState({
      name: "",
      avatar: randomCharacter(),
      color: "lilac",
      note: "",
    }),
    [groupName, setGroupName] = useState("Bizim tayfa"),
    [account, setAccount] = useState({ username: "", password: "", code: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [mode, setMode] = useState(start || (standalone && !invite ? "code" : "profile")),
    [via, setVia] = useState("login"),
    [login, setLogin] = useState({ username: "", password: "" }),
    [code, setCode] = useState("");
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
          username: account.username,
          password: account.password,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const claim = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d =
        via === "login"
          ? await api("/login", login)
          : via === "reset"
            ? await api("/reset", account)
            : await api("/transfer/claim", { code });
      onSuccess(d, "Tekrar hoş geldin! Profilin bu cihazda da açık. ✨");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (mode === "code")
    return (
      <Modal
        title="Zaten ekiptesin. 🔑"
        subtitle={
          via === "login"
            ? "Kullanıcı adın ve şifrenle gir. Şifreni unuttuysan “Şifremi unuttum”a bas."
            : via === "reset"
              ? "Batur’a yaz, panelinden sana bir kod versin. Kodla yeni şifreni belirle; kullanıcı adın yoksa onu da şimdi seç."
              : "Diğer cihazındaki “Başka cihazda aç” kodunu ya da Batur’un verdiği giriş kodunu yaz."
        }
        close={close}
      >
        <div className="segmented" role="tablist" aria-label="Giriş yöntemi">
          {LOGIN_TABS.map(([id, label], index) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`entry-${id}`}
              aria-controls="entry-panel"
              tabIndex={via === id ? 0 : -1}
              aria-selected={via === id}
              onKeyDown={(e) => {
                const next = { ArrowRight: (index + 1) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2 }[e.key];
                if (next === undefined) return;
                e.preventDefault();
                setVia(LOGIN_TABS[next][0]);
                setError("");
                document.getElementById(`entry-${LOGIN_TABS[next][0]}`)?.focus();
              }}
              className={via === id ? "active" : ""}
              onClick={() => {
                setVia(id);
                setError("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={claim} role="tabpanel" id="entry-panel" aria-labelledby={`entry-${via}`}>
          {via === "reset" ? (
            <>
            <label className="field-label">
              Batur’un kodu
              <input
                required
                autoFocus
                className="code-input"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={12}
                placeholder="ABCD-2345"
                value={account.code}
                onChange={(e) => setAccount({ ...account, code: e.target.value.toUpperCase() })}
              />
            </label>
            <label className="field-label">
              Kullanıcı adı
              <input
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={24}
                value={account.username}
                onChange={(e) => setAccount({ ...account, username: e.target.value })}
              />
            </label>
            <label className="field-label">
              Yeni şifre
              <input
                required
                type="password"
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck={false}
                minLength={6}
                maxLength={128}
                value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })}
              />
            </label>
            </>
          ) : via === "login" ? (
            <>
              <label className="field-label">
                Kullanıcı adı
                <input
                  required
                  autoFocus
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={24}
                  value={login.username}
                  onChange={(e) => setLogin({ ...login, username: e.target.value })}
                />
              </label>
              <label className="field-label">
                Şifre
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  maxLength={128}
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                />
              </label>
            </>
          ) : (
          <label className="field-label">
            Giriş kodun
            <input
              className="code-input"
              required
              autoFocus
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={12}
              placeholder="ABCD-2345"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
          )}
          {via === "code" && standalone && isIOS && (
            <p className="form-warning">
              Ana ekrandaki Kütüp, Safari’den ayrı bir oturum tutar. Safari’de
              katıldıysan kodunu oradan al.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Busy loading={busy} className="btn primary full" type="submit">
            Profilimi aç <KeyRound size={17} />
          </Busy>
          <button
            type="button"
            className="text-button centered-link"
            onClick={() => {
              setMode("profile");
              setError("");
            }}
          >
            {invite ? "Ekibe yeni katılıyorum" : "Yeni bir ekip kuracağım"}
          </button>
        </form>
      </Modal>
    );
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
          <p className="form-warning">
            Arkadaşın seni davet ettiyse buradan ekip kurma; onun attığı davet
            linkini aç. Burası yepyeni bir ekip kurar.
          </p>
        )}
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
        <fieldset className="account-fields">
          <legend>Hesabın · her cihazdan bununla girersin</legend>
            <label className="field-label">
              Kullanıcı adı
              <input
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={24}
                placeholder="ör. batur"
                value={account.username}
                onChange={(e) => setAccount({ ...account, username: e.target.value })}
              />
            </label>
            <label className="field-label">
              Şifre
              <input
                required
                type="password"
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck={false}
                minLength={6}
                maxLength={128}
                placeholder="en az 6 karakter"
                value={account.password}
                onChange={(e) => setAccount({ ...account, password: e.target.value })}
              />
            </label>
        </fieldset>
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
        <button
          type="button"
          className="text-button centered-link"
          onClick={() => {
            setMode("code");
            setError("");
          }}
        >
          <KeyRound size={15} /> Zaten hesabım var, giriş yap
        </button>
        <p className="form-footnote">
          <ShieldCheck size={14} /> E-posta gerekmiyor. Kullanıcı adın ve şifrenle
          her cihazdan aynı hesabı açabilirsin.
          <br />
          Davet bağlantısı olanlar katılabilir; güvendiğin kişilerle paylaş.
        </p>
      </form>
    </Modal>
  );
}
function DeviceTransfer({ notify }) {
  const [code, setCode] = useState(null),
    [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    try {
      setCode(await api("/transfer", {}));
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="device-transfer">
      <div>
        <strong>
          <Smartphone size={16} /> Başka cihazda da aç
        </strong>
        <p>
          Telefon, tablet ya da iPhone’da ana ekran uygulaması. Kod 15 dakika
          geçerli, tek kullanımlık.
        </p>
      </div>
      {code ? (
        <div className="transfer-code" aria-live="polite">
          <b>{code.code}</b>
          <small>
            Diğer cihazda: Yerini al → “Zaten hesabım var, giriş yap”
          </small>
        </div>
      ) : (
        <Busy
          type="button"
          loading={busy}
          className="btn outline"
          onClick={create}
        >
          <KeyRound size={15} /> Giriş kodu al
        </Busy>
      )}
    </div>
  );
}
function AccountBox({ username, notify, onSaved }) {
  const [value, setValue] = useState({ username: username || "", password: "" }),
    [busy, setBusy] = useState(false),
    [open, setOpen] = useState(!username);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/account", { username: value.username, ...(value.password ? { password: value.password } : {}) });
      onSaved(r.username);
      setValue({ username: r.username, password: "" });
      setOpen(false);
      notify("Hesabın hazır. Artık her cihazdan kullanıcı adın ve şifrenle girebilirsin. 🔐");
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`account-box ${username ? "" : "missing"}`}>
      <div>
        <strong>
          <KeyRound size={16} /> {username ? `Hesabın: @${username}` : "Hesabını koru"}
        </strong>
        <p>
          {username
            ? "Her tarayıcıdan ve telefondan bu kullanıcı adı ve şifreyle girersin."
            : "Kullanıcı adı ve şifre belirle; başka bir cihazdan ya da tarayıcıdan girince profilin seni beklesin."}
        </p>
      </div>
      {open ? (
        <form onSubmit={save} className="account-form">
          <input
            required
            aria-label="Kullanıcı adı"
            placeholder="kullanıcı adı"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={24}
            value={value.username}
            onChange={(e) => setValue({ ...value, username: e.target.value })}
          />
          <input
            required={!username}
            type="password"
            aria-label={username ? "Yeni şifre (isteğe bağlı)" : "Şifre"}
            placeholder={username ? "yeni şifre (boş bırakabilirsin)" : "şifre (en az 6 karakter)"}
            autoComplete="new-password"
            minLength={6}
            maxLength={128}
            value={value.password}
            onChange={(e) => setValue({ ...value, password: e.target.value })}
          />
          <Busy loading={busy} className="btn primary" type="submit">
            Kaydet
          </Busy>
        </form>
      ) : (
        <button type="button" className="btn outline" onClick={() => setOpen(true)}>
          Değiştir
        </button>
      )}
    </div>
  );
}
export function ProfileModal({ me, username, onAccount, theme, setTheme, mode, setMode, close, mutate, notify, onLeft }) {
  const [value, setValue] = useState({
      name: me.name,
      avatar: me.avatar,
      color: me.color,
      note: me.note,
      badge: me.badge,
    }),
    [busy, setBusy] = useState(false);
  const leave = async () => {
    const typed = prompt(
      `Ekipten ayrılırsan profilin, köydeki binaların, mesajların ve planların kalıcı olarak silinir. Emin misin? Onaylamak için adını yaz: ${me.name}`,
    );
    if (typed === null) return;
    if (typed.trim().toLocaleLowerCase("tr") !== me.name.toLocaleLowerCase("tr")) {
      notify("Ad eşleşmedi, ayrılmadın. Profilin yerinde. 🫶");
      return;
    }
    try {
      await api("/leave", {});
      onLeft();
    } catch (e) {
      notify(e.message);
    }
  };
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
            {THEMES.map((c) => (
              <button
                key={c}
                type="button"
                className={`${c} ${theme === c ? "selected" : ""}`}
                aria-pressed={theme === c}
                onClick={() => setTheme(c)}
              >
                {theme === c && <Check size={13} />}
                {COLOR_NAMES[c]}
              </button>
            ))}
          </div>
          <small>Sadece senin ekranında değişir.</small>
        </div>
        <div className="theme-section">
          <label className="field-label" id="mode-label">Gündüz mü, gece mi?</label>
          <div className="mode-options" role="radiogroup" aria-labelledby="mode-label">
            {MODE_CHOICES.map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={mode === key}
                className={mode === key ? "selected" : ""}
                onClick={() => setMode(key)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
          <small>{modeHint(mode)}</small>
        </div>
        <Busy loading={busy} type="submit" className="btn primary full">
          Böyle çok daha ben <Sparkles size={16} />
        </Busy>
        <details className="my-stats">
          <summary>📊 İstatistiklerim</summary>
          <MemberStats memberId={me.id} />
        </details>
      </form>
      <AccountBox username={username} notify={notify} onSaved={onAccount} />
        <DeviceTransfer notify={notify} />
      <button type="button" className="text-button leave-button" onClick={leave}>
        <LogOut size={15} /> Ekipten ayrıl
      </button>
    </Modal>
  );
}
