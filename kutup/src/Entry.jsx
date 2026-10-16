// n27 "Vitrin": the first thing a friend sees after tapping an invite link,
// and the way a new team is founded. Two looks to choose from, side by side in
// the real app until Batur picks one:
//   ?giris=1  Gökyüzü: the living sky fills the screen; the friends wait on the
//             path to Milli Kütüphane; joining is three short steps and ends
//             with your little figure walking in through the door.
//   ?giris=2  Okuyucu kartı: a paper library card on a notebook page; the card
//             fills in as you type (your face, your name, the team) and gets
//             stamped "ÜYE" at the end.
// Without the switch the old welcome stays. Phase 2 keeps the chosen look and
// drops the switch (and this paragraph).
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, House, KeyRound, MapPin, MessageCircle, Plus, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Avatar, Busy, reducedMotion } from "./ui.jsx";
import { COLORS, COLOR_NAMES } from "./api.js";
import { SkyScene, at, greeting, span, useSky, useSkyPaused } from "./Home.jsx";
import { KaraRig } from "./Kara.jsx";
import { AvatarPicker, useJoinForm } from "./Account.jsx";
import "./entry.css";

export const ENTRY = new URLSearchParams(location.search).get("giris");

// Every entrance here is a one-shot CSS animation (transform/opacity, entry.css),
// not Motion: this page is the first impression and must show its buttons even
// if a script chunk is slow to arrive. The motion setting stills them (entry.css).
const delay = (s) => ({ "--d": `${s}s` });
// Words that rise into place one after another (the home page's Kinetic, in CSS).
function Words({ text, as: Tag = "h1", className = "", at: start = 0.1 }) {
  const words = String(text).split(" ");
  return (
    <Tag className={`kinetic-text entry-words ${className}`} aria-label={text}>
      {words.map((word, i) => (
        <React.Fragment key={`${i}-${word}`}>
          <span className="kw" aria-hidden="true">
            <span style={{ "--d": `${start + i * 0.065}s` }}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
    </Tag>
  );
}
const lively = () => !reducedMotion() && !["calm", "still"].includes(document.documentElement.dataset.motion);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const names = (list) =>
  list.length <= 4 ? list.map((x) => x.name).join(", ").replace(/, ([^,]*)$/, " ve $1") : `${list.slice(0, 3).map((x) => x.name).join(", ")} ve ${list.length - 3} kişi daha`;

// Kara on the library roof. Asleep on the plain welcome, awake when friends are
// waiting; a tap gets a line that helps right now.
function EntryKara({ awake, lines, style }) {
  const [say, setSay] = useState(null),
    [blink, setBlink] = useState(false);
  const turn = useRef(0),
    timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  // A slow blink now and then while awake; never while the motion setting rests.
  useEffect(() => {
    if (!awake && !say) return;
    const loop = setInterval(() => {
      if (!lively() || document.visibilityState !== "visible") return;
      setBlink(true);
      setTimeout(() => setBlink(false), 190);
    }, 4600);
    return () => clearInterval(loop);
  }, [awake, !!say]);
  const tap = () => {
    setSay(lines[turn.current++ % lines.length]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSay(null), 5600);
  };
  return (
    <div className="kara-spot entry-kara" style={style}>
      <button type="button" className="kara-button" aria-label="Kara’ya dokun" onClick={tap}>
        <KaraRig pose={say ? "greet" : awake ? "idle" : "sleep"} blink={blink} />
      </button>
      {say && (
        <p className="kara-say" role="status">
          {say}
        </p>
      )}
    </div>
  );
}

const KARA_WELCOME = [
  "Mırr… Ben Kara, kütüphanenin kedisi. Davet linkin varsa ona dokun, seni ekibine götürürüm.",
  "Ekibin yoksa “Yeni ekip kur”. Linki arkadaşlarına atarsın, gerisi kendiliğinden gelir.",
  "Kimse yokken kitaplar benim. Biri gelince ilk ben duyarım.",
];
const karaInvite = (info) => [
  info?.here ? `${info.here} kişi şu an içeride. Sana da bir sandalye ayırdım!` : "Bugün kütüp sessiz. İlk sen gelirsen kapıyı ben tutarım.",
  `${info?.name || "Ekibin"} burada buluşuyor: kim kütüpte, kim yolda, hepsi tek bakışta.`,
  "Katılınca senin de köyde bir mahallen olur. Tabelası hazır.",
];

// The intro: three things Kütüp does, said once and plainly. Nothing here is a
// button, so nothing looks like one.
const INTRO = [
  [MapPin, "Kim kütüpte, kim yolda", "Tek dokunuşla “Geldim”; ekibin anında görür."],
  [House, "Odaklandıkça köy büyür", "Her seans ortak köye bir bina."],
  [MessageCircle, "Pano ve planlar", "Kahve çağrısı, notlar, “yarın 10’da?”"],
];

function ColorOptions({ value, setValue }) {
  return (
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
  );
}

function AccountFields({ form }) {
  const { account, setAccount } = form;
  return (
    <>
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
    </>
  );
}

// ======================= 1 · Gökyüzü =======================
// Where the waiting friends stand: along the path, the ones inside at the door.
const QUEUE = [
  [192, 199],
  [160, 207],
  [128, 211],
  [96, 213],
  [66, 214],
  [38, 216],
  [12, 217],
];
const DOOR = [[232, 175], [276, 175]];

function SkyEntry({ invite, inviteInfo, open, onSuccess, now, dark, start }) {
  const box = useRef(null),
    paused = useSkyPaused(box),
    sky = useSky(now, dark);
  const form = useJoinForm({ invite, onSuccess });
  const [step, setStep] = useState(0), // 0 the welcome, then the steps
    [walking, setWalking] = useState(null);
  const steps = invite ? ["you", "account"] : ["team", "you", "account"];
  // "Yeni bir ekip kuracağım" in the sign-in window starts the steps here.
  useEffect(() => {
    if (start) setStep(1);
  }, [start]);
  const at0 = step === 0,
    current = steps[step - 1];
  const faces = inviteInfo?.faces || [];
  const inside = faces.filter((x) => x.here).slice(0, 2),
    outside = faces.filter((x) => !inside.includes(x)).slice(0, QUEUE.length - 1);
  const me = { ...form.value, name: form.value.name || "Sen" };
  const night = sky.night > 0.5;
  const next = (e) => {
    e.preventDefault();
    if (step < steps.length) return setStep(step + 1);
    // The last step: create, then walk in through the door before the app opens.
    form.submit(e, async () => {
      if (!lively()) return;
      setWalking({ key: "me", color: `var(--${form.value.color})` });
      await wait(1900);
    });
  };
  const title = invite
    ? `${inviteInfo?.name || "Ekibin"} seni bekliyor.`
    : at0
      ? "Kim nerede, artık sormak yok."
      : current === "team"
        ? "Önce bir isim."
        : `${form.groupName.trim() || "Ekibiniz"} kuruluyor.`;
  return (
    <main className={`entry sky-entry ${at0 ? "" : "on-form"}`}>
      <section ref={box} className={`home-sky entry-sky ${night ? "is-night" : ""} ${sky.lamps ? "lamps" : ""} ${paused ? "paused" : ""}`}>
        <i className="entry-glow warm" style={{ opacity: sky.warm }} />
        <i className="entry-glow night" style={{ opacity: sky.night }} />
        <div className="sky-stars entry-stars" style={{ opacity: sky.night }} aria-hidden="true">
          {["a", "b"].map((half, h) => (
            <svg key={half} className={`stars ${half}`} viewBox="0 0 100 40" preserveAspectRatio="none">
              {Array.from({ length: 14 }, (_, i) => (i % 2 === h ? <circle key={i} cx={(i * 37 + 11) % 100} cy={(i * 23 + 5) % 38} r={0.35 + (i % 3) * 0.12} /> : null))}
            </svg>
          ))}
        </div>
        <SkyScene sky={sky} arrivals={walking ? [walking] : []} />
        <div className="sky-over entry-over">
          <EntryKara awake={!!invite || !at0} lines={invite ? karaInvite(inviteInfo) : KARA_WELCOME} style={{ ...at(290, 134), width: span(62) }} />
          {/* The friends who are already in: at the door if they are inside, on the path if not. */}
          {[...inside.map((x, i) => [x, DOOR[i], true]), ...outside.map((x, i) => [x, QUEUE[i], false])].map(([x, spot, isIn], i) => (
            <span key={`${isIn}-${x.name}`} className={`path-face ${isIn ? "inside" : ""}`} style={at(...spot)}>
              <span className="pop" style={delay(0.5 + i * 0.09)}>
                <Avatar member={x} size="small" />
                <small>{x.name}</small>
              </span>
            </span>
          ))}
          {/* Your place: on the welcome a seat to take (it opens the steps), then you. */}
          {(invite || !at0) && !walking && (
            <span className="path-face you" style={at(...QUEUE[Math.min(outside.length, QUEUE.length - 1)])}>
              {at0 ? (
                <button type="button" className="seat" onClick={() => setStep(1)} aria-label="Yerini al: ekibe katıl">
                  <Plus size={16} />
                  <small>sen?</small>
                </button>
              ) : (
                <span key={`${form.value.avatar}-${form.value.color}`} className="pop">
                  <Avatar member={me} size="small" />
                  <small>{me.name}</small>
                </span>
              )}
            </span>
          )}
          {/* The team's sign goes up by the path as soon as it has a name. */}
          {!invite && !at0 && (
            <span className="team-sign" style={at(118, 199)}>
              <span className="pop">
                <b>{form.groupName.trim() || "…"}</b>
              </span>
            </span>
          )}
        </div>
        <div className="entry-copy">
          <span className="entry-brand" aria-label="Kütüp">
            kütüp<span>✳</span>
          </span>
          <span className="sky-eyebrow">{invite ? "DAVETLİSİN ✷" : `${greeting(sky.hour)} · MİLLİ KÜTÜPHANE`}</span>
          <Words key={title} text={title} at={0.15} />
          {invite && (
            <span className="entry-live">
              <i className={inviteInfo?.here ? "on" : ""} />
              {faces.length ? `${names(faces)} ekipte` : "Ekip seni bekliyor"}
              {inviteInfo?.here ? ` · ${inviteInfo.here} kişi şu an kütüpte` : ""}
            </span>
          )}
        </div>
      </section>
      <section className="entry-sheet rise" style={delay(0.25)}>
          {at0 ? (
            <div key="intro" className="sheet-page swap back">
              <ul className="entry-intro">
                {INTRO.map(([Icon, head, body], i) => (
                  <li key={head} className="rise" style={delay(0.4 + i * 0.08)}>
                    <Icon size={18} aria-hidden="true" />
                    <span>
                      <b>{head}</b>
                      <small>{body}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="entry-actions">
                <button className="btn primary full" onClick={() => setStep(1)}>
                  {invite ? (
                    <>
                      Ekibe katıl <ArrowRight size={17} />
                    </>
                  ) : (
                    <>
                      <Plus size={17} /> Yeni ekip kur
                    </>
                  )}
                </button>
                <button className={`btn ${invite ? "ghost" : "outline"} full`} onClick={() => open("login")}>
                  <KeyRound size={16} /> {invite ? "Zaten hesabım var, giriş yap" : "Giriş yap"}
                </button>
              </div>
              <p className="entry-note">
                {invite
                  ? "Katılınca köyde senin de bir mahallen olur. E-posta yok; kullanıcı adı ve şifre yeter."
                  : "Arkadaşından davet linki geldiyse linke dokun, doğrudan ekibine katılırsın."}
              </p>
            </div>
          ) : (
            <form key={current} className="sheet-page swap" onSubmit={next}>
              <div className="step-head">
                <button type="button" className="step-back" onClick={() => (form.setError(""), setStep(step - 1))} aria-label="Geri">
                  <ArrowLeft size={18} />
                </button>
                <span className="step-count" aria-hidden="true">
                  {steps.map((s, i) => (
                    <i key={s} className={i < step ? "on" : ""} />
                  ))}
                </span>
                <span className="step-of">
                  {step} / {steps.length}
                </span>
              </div>
              {current === "team" && (
                <>
                  <h2>Ekibinize bir isim.</h2>
                  <p className="step-note">Tabelası köyde şimdiden dikildi. Sonra değiştirmek yok, güzel bir şey seç.</p>
                  <label className="field-label big">
                    Ekibinizin adı
                    <input required autoFocus minLength={2} maxLength={40} value={form.groupName} onChange={(e) => form.setGroupName(e.target.value)} />
                  </label>
                </>
              )}
              {current === "you" && (
                <>
                  <h2>{invite ? "Sana bir yer ayırdık." : "Seni tanıyalım."}</h2>
                  <p className="step-note">Patikada seni temsil edecek. Karakter, aksesuar, renk; hepsi sonra da değişir.</p>
                  <label className="field-label">
                    Sana ne diyelim?
                    <input required autoFocus minLength={2} maxLength={24} placeholder="İsmin ya da takma adın" autoComplete="nickname" value={form.value.name} onChange={(e) => form.setValue({ ...form.value, name: e.target.value })} />
                  </label>
                  <span className="field-label">Küçük alter egon</span>
                  <AvatarPicker value={form.value} setValue={form.setValue} />
                  <span className="field-label">Senin rengin</span>
                  <ColorOptions value={form.value} setValue={form.setValue} />
                </>
              )}
              {current === "account" && (
                <>
                  <h2>Son adım: hesabın.</h2>
                  <p className="step-note">Her cihazdan bununla girersin. E-posta yok.</p>
                  <AccountFields form={form} />
                  <p className="form-footnote">
                    <ShieldCheck size={14} /> Davet bağlantısı olanlar katılabilir; güvendiğin kişilerle paylaş.
                  </p>
                </>
              )}
              {form.error && (
                <p className="form-error" role="alert">
                  {form.error}
                </p>
              )}
              <Busy loading={form.busy || !!walking} className="btn primary full" type="submit">
                {step < steps.length ? (
                  <>
                    Devam <ArrowRight size={17} />
                  </>
                ) : invite ? (
                  <>
                    Ben de buradayım <ArrowRight size={17} />
                  </>
                ) : (
                  <>
                    Ekibimizi kuralım <Sparkles size={16} />
                  </>
                )}
              </Busy>
            </form>
          )}
      </section>
    </main>
  );
}

// ======================= 2 · Okuyucu kartı =======================
// A library card on a notebook page. It is the preview: whatever you type
// lands on the card.
function Barcode() {
  const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2, 1, 2];
  let x = 0;
  return (
    <svg className="lib-barcode" viewBox="0 0 80 18" aria-hidden="true" preserveAspectRatio="none">
      {bars.map((w, i) => {
        const r = i % 2 ? null : <rect key={i} x={x} y="0" width={w * 0.9} height="18" />;
        x += w * 1.25;
        return r;
      })}
    </svg>
  );
}

function CardEntry({ invite, inviteInfo, open, onSuccess, now, dark, start }) {
  const box = useRef(null),
    paused = useSkyPaused(box),
    sky = useSky(now, dark);
  const form = useJoinForm({ invite, onSuccess });
  const [filling, setFilling] = useState(false),
    [stamped, setStamped] = useState(false);
  useEffect(() => {
    if (start) setFilling(true);
  }, [start]);
  const faces = inviteInfo?.faces || [];
  const night = sky.night > 0.5;
  const number = String((inviteInfo?.count || 0) + 1).padStart(3, "0");
  const team = invite ? inviteInfo?.name || "Ekibin" : filling ? form.groupName.trim() || "Ekibinizin adı" : null;
  const submit = (e) =>
    form.submit(e, async () => {
      setStamped(true);
      if (lively()) await wait(1100);
    });
  const card = (
    <article className={`lib-card drop ${filling ? form.value.color : ""} ${filling ? "filling" : ""}`}>
      <i className="lib-hole" aria-hidden="true" />
      <div ref={box} className={`lib-window home-sky ${night ? "is-night" : ""} ${sky.lamps ? "lamps" : ""} ${paused ? "paused" : ""}`}>
        <SkyScene sky={sky} />
        <div className="sky-over">
          <EntryKara awake={!!invite || filling} lines={invite ? karaInvite(inviteInfo) : KARA_WELCOME} style={{ ...at(290, 134), width: span(62) }} />
        </div>
      </div>
      <div className="lib-body">
        <div className="lib-row">
          <span className="lib-label">
            <i /> KÜTÜP OKUYUCU KARTI
          </span>
          <span className="lib-no">No {number}</span>
        </div>
        {team ? (
          <>
            <Words key={invite ? "t" : "f"} text={team} className="lib-team" at={0.2} />
            <p className="lib-sub">{invite ? `seni bekliyor · ${inviteInfo?.count || 0} kişi yerini aldı` : "yeni bir ekip · Milli Kütüphane, Ankara"}</p>
          </>
        ) : (
          <>
            <Words text="Kim nerede, artık sormak yok." className="lib-team" at={0.2} />
            <p className="lib-sub">Milli Kütüphane’ye giden arkadaşlar için.</p>
          </>
        )}
        {filling ? (
          <div className="lib-holder">
            <span key={`${form.value.avatar}-${form.value.color}`} className="lib-photo pop">
              <Avatar member={form.value} />
            </span>
            <span className="lib-sign">
              <small>OKUYUCU</small>
              <b>{form.value.name.trim() || "Senin adın"}</b>
            </span>
          </div>
        ) : invite && faces.length ? (
          <div className="lib-faces">
            <span className="lib-stack">
              {faces.slice(0, 5).map((x, i) => (
                <span key={x.name} className="pop" style={{ ...delay(0.55 + i * 0.08), rotate: `${[-4, 3, -2, 4, -3][i]}deg` }}>
                  <Avatar member={x} size="small" />
                </span>
              ))}
            </span>
            <small>
              {names(faces)} ekipte
              {inviteInfo?.here ? (
                <>
                  <br />
                  <i className="dot" /> şu an {inviteInfo.here} kişi kütüpte
                </>
              ) : null}
            </small>
          </div>
        ) : (
          <div className="lib-foot">
            <Barcode />
            <small>ANKARA · {new Date(now).getFullYear()}</small>
          </div>
        )}
      </div>
      {(invite || stamped) && (
        <span key={stamped ? "uye" : "davet"} className={`lib-stamp ${stamped ? "member" : ""}`} style={delay(stamped ? 0 : 0.9)} aria-hidden="true">
          {stamped ? "ÜYE ✳" : "DAVETLİSİN"}
        </span>
      )}
    </article>
  );
  return (
    <main className={`entry card-entry ${filling ? "on-form" : ""}`}>
      <header className="card-head">
        <span className="entry-brand" aria-label="Kütüp">
          kütüp<span>✳</span>
        </span>
        <span className="sky-eyebrow">{invite ? "BİR DAVETİN VAR" : greeting(sky.hour)}</span>
      </header>
      <div className="card-stage">{card}</div>
      <section className="card-panel rise" style={delay(0.35)}>
          {!filling ? (
            <div key="intro" className="swap back">
              <div className="tear" aria-hidden="true" />
              <ol className="card-intro">
                {INTRO.map(([Icon, head, body], i) => (
                  <li key={head} className="rise" style={delay(0.5 + i * 0.08)}>
                    <span className="num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <Icon size={20} aria-hidden="true" />
                    <b>{head}</b>
                    <small>{body}</small>
                  </li>
                ))}
              </ol>
              <div className="entry-actions">
                <button className="btn primary full" onClick={() => setFilling(true)}>
                  {invite ? (
                    <>
                      Kartımı doldur <ArrowRight size={17} />
                    </>
                  ) : (
                    <>
                      <Plus size={17} /> Yeni ekip kur
                    </>
                  )}
                </button>
                <button className="btn ghost full" onClick={() => open("login")}>
                  <KeyRound size={16} /> {invite ? "Zaten hesabım var, giriş yap" : "Giriş yap"}
                </button>
              </div>
              <p className="entry-note">
                {invite
                  ? "Kartını doldur, ekibe katıl: köyde senin de bir mahallen olur. E-posta yok."
                  : "Arkadaşından davet linki geldiyse linke dokun, doğrudan ekibine katılırsın."}
              </p>
            </div>
          ) : (
            <form key="form" className="card-form swap" onSubmit={submit}>
              <button type="button" className="text-button card-back" onClick={() => (form.setError(""), setFilling(false))}>
                <ArrowLeft size={15} /> Geri
              </button>
              {!invite && (
                <label className="field-label">
                  Ekibinizin adı
                  <input required autoFocus minLength={2} maxLength={40} value={form.groupName} onChange={(e) => form.setGroupName(e.target.value)} />
                </label>
              )}
              <label className="field-label">
                Sana ne diyelim?
                <input required autoFocus={!!invite} minLength={2} maxLength={24} placeholder="İsmin ya da takma adın" autoComplete="nickname" value={form.value.name} onChange={(e) => form.setValue({ ...form.value, name: e.target.value })} />
              </label>
              <span className="field-label">Kartındaki yüzün</span>
              <AvatarPicker value={form.value} setValue={form.setValue} />
              <span className="field-label">Kartının rengi</span>
              <ColorOptions value={form.value} setValue={form.setValue} />
              <fieldset className="account-fields">
                <legend>Hesabın · her cihazdan bununla girersin</legend>
                <AccountFields form={form} />
              </fieldset>
              {form.error && (
                <p className="form-error" role="alert">
                  {form.error}
                </p>
              )}
              <Busy loading={form.busy || stamped} className="btn primary full" type="submit">
                {invite ? "Kartımı bastır, katıl" : "Ekibimizi kuralım"} <Sparkles size={16} />
              </Busy>
              <p className="form-footnote">
                <ShieldCheck size={14} /> Davet bağlantısı olanlar katılabilir; güvendiğin kişilerle paylaş.
              </p>
            </form>
          )}
      </section>
    </main>
  );
}

export function Entry(props) {
  return ENTRY === "2" ? <CardEntry {...props} /> : <SkyEntry {...props} />;
}
