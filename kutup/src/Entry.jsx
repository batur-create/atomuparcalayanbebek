// n27 "Vitrin": the first thing a friend sees after tapping an invite link,
// and the way a new team is founded. The living sky fills the screen; the
// team waits on the path to Milli Kütüphane; joining is two short steps
// (founding three) under the sky, where the team's sign goes up and your own
// little figure appears, and it ends with that figure walking in through the
// library door. (Batur picked this look, n27; the paper "reader card" option
// is in the PR notes for n28.)
//
// Privacy: someone who has not joined sees names and faces only, never who is
// at the library, on the way or focusing (the invite API does not send it).
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, House, KeyRound, MapPin, MessageCircle, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar, Busy, reducedMotion } from "./ui.jsx";
import { COLORS, COLOR_NAMES } from "./api.js";
import { SkyScene, at, greeting, span, useSky, useSkyPaused } from "./Home.jsx";
import { KaraRig } from "./Kara.jsx";
import { AvatarPicker, useJoinForm } from "./Account.jsx";
import "./entry.css";

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
// "Ada, Ece ve Mert" or, for a bigger team, "Ada, Ece, Mert ve 9 kişi daha"
// (the invite sends the first eight faces and the full count).
const names = (list, count = list.length) =>
  count <= 4 && list.length === count ? list.map((x) => x.name).join(", ").replace(/, ([^,]*)$/, " ve $1") : `${list.slice(0, 3).map((x) => x.name).join(", ")} ve ${count - 3} kişi daha`;

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
  "Patikada bir yer boş. Sana ayırdım; “sen?” yazan yere dokun.",
  `${info?.name || "Ekibin"} burada buluşuyor: kim kütüpte, kim yolda, katılınca hepsi tek bakışta.`,
  "Katılınca senin de köyde bir mahallen olur. Tabelası hazır.",
]

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

// Where the friends stand: along the path to the library door, in the order
// they joined. (Who is inside right now is not shown before joining.)
const QUEUE = [
  [222, 186],
  [188, 199],
  [154, 207],
  [120, 211],
  [86, 213],
  [52, 214],
  [18, 216],
  [-16, 218],
]

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
  const faces = (inviteInfo?.faces || []).slice(0, QUEUE.length - 1);
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
          {/* The friends who are already in the team, on the path. */}
          {faces.map((x, i) => (
            <span key={x.name} className="path-face" style={at(...QUEUE[i])}>
              <span className="pop" style={delay(0.5 + i * 0.09)}>
                <Avatar member={x} size="small" />
                <small>{x.name}</small>
              </span>
            </span>
          ))}
          {/* Your place: on the welcome a seat to take (it opens the steps), then you. */}
          {(invite || !at0) && !walking && (
            <span className="path-face you" style={at(...QUEUE[faces.length])}>
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
          {invite && inviteInfo && (
            <span className="entry-live">
              {faces.length ? `${names(inviteInfo.faces, inviteInfo.count)} ekipte` : "Ekip seni bekliyor"}
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

export { SkyEntry as Entry };
