// n27 phase 1 samples, shown only with ?ornek=1 so Batur can look before they
// are built for real: the iPhone "add to home screen" guide drawn step by step,
// and an illustrated empty state (a team of one at an empty reading table).
import React, { useRef, useState } from "react";
import { UserRoundPlus, X } from "lucide-react";
import { Avatar } from "./ui.jsx";
import { KaraRig } from "./Kara.jsx";
import "./samples.css";

export const SAMPLE = new URLSearchParams(location.search).has("ornek");

// iOS 26 moved Share behind the "•••" button next to the address bar; older
// Safari keeps it in the bottom bar.
const oldSafari = (() => {
  const v = /Version\/(\d+)/.exec(navigator.userAgent);
  return !!v && Number(v[1]) < 26;
})();

// ---------- the four little screens ----------
const Screen = ({ children }) => (
  <svg className="ig" viewBox="0 0 200 140" aria-hidden="true">
    <rect className="ig-frame" x="8" y="6" width="184" height="128" rx="16" />
    {children}
  </svg>
);
const Tap = ({ x, y, r = 14 }) => (
  <g className="ig-tap">
    <circle cx={x} cy={y} r={r} />
    <circle className="ig-tap-dot" cx={x + r * 0.55} cy={y + r * 0.75} r="4.5" />
  </g>
);
const KutupIcon = ({ x, y, s = 26 }) => (
  <g transform={`translate(${x} ${y}) scale(${s / 128})`}>
    <rect className="ig-app" width="128" height="128" rx="32" />
    <path className="ig-app-mark" d="M35 30v68M38 67l47-37M44 60l44 38" />
    <circle className="ig-app-dot" cx="95" cy="26" r="8" />
  </g>
);

function StepMenu() {
  return (
    <Screen>
      {/* the page */}
      <rect className="ig-sky" x="8" y="6" width="184" height="54" rx="16" />
      <rect className="ig-line" x="22" y="70" width="96" height="6" rx="3" />
      <rect className="ig-line soft" x="22" y="81" width="70" height="5" rx="2.5" />
      {/* the menu above the dots */}
      <g className="ig-pop">
        <rect className="ig-card" x="104" y="34" width="80" height="52" rx="9" />
        <rect className="ig-hi-row" x="108" y="38" width="72" height="16" rx="5" />
        <text className="ig-t strong" x="114" y="49.5">Paylaş</text>
        <path className="ig-stroke" d="M168 50v-7m-3 3 3-3 3 3M164 47h-1.5v6h11v-6H172" />
        <text className="ig-t" x="114" y="66">Yer İmi Ekle</text>
        <text className="ig-t" x="114" y="80">Yeni Sekme</text>
      </g>
      {/* the bottom bar */}
      <rect className="ig-card" x="20" y="100" width="128" height="24" rx="12" />
      <text className="ig-t muted" x="34" y="115.5">kutup…workers.dev</text>
      <circle className="ig-card" cx="164" cy="112" r="12" />
      <circle className="ig-ink" cx="158.5" cy="112" r="1.6" />
      <circle className="ig-ink" cx="164" cy="112" r="1.6" />
      <circle className="ig-ink" cx="169.5" cy="112" r="1.6" />
      <Tap x={164} y={112} />
    </Screen>
  );
}

function StepShare() {
  return (
    <Screen>
      <rect className="ig-dim" x="8" y="6" width="184" height="128" rx="16" />
      <rect className="ig-card" x="14" y="30" width="172" height="104" rx="14" />
      {[40, 66, 92, 118].map((x, i) => (
        <circle key={x} className={`ig-app-dot-soft c${i}`} cx={x + 6} cy="48" r="9" />
      ))}
      <text className="ig-t muted" x="24" y="76">Kopyala</text>
      <rect className="ig-icon-box" x="166" y="68" width="10" height="10" rx="2.5" />
      <line className="ig-sep" x1="24" y1="83" x2="176" y2="83" />
      <text className="ig-t muted" x="24" y="96">Okuma Listesine Ekle</text>
      <rect className="ig-hi-row" x="18" y="103" width="164" height="20" rx="6" />
      <text className="ig-t strong" x="24" y="116.5">Ana Ekrana Ekle</text>
      <rect className="ig-icon-box hi" x="164" y="108" width="11" height="11" rx="2.5" />
      <path className="ig-stroke hi" d="M169.5 110.5v6m-3-3h6" />
      <Tap x={150} y={113} r={12} />
    </Screen>
  );
}

function StepAdd() {
  return (
    <Screen>
      <text className="ig-t accent" x="20" y="27">Vazgeç</text>
      <text className="ig-t strong" x="100" y="27" textAnchor="middle">Ana Ekrana Ekle</text>
      <text className="ig-t accent strong" x="179" y="27" textAnchor="end">Ekle</text>
      <Tap x={170} y={23} r={13} />
      <line className="ig-sep" x1="8" y1="36" x2="192" y2="36" />
      <rect className="ig-card" x="18" y="46" width="164" height="38" rx="9" />
      <KutupIcon x={26} y={52} s={26} />
      <text className="ig-t strong" x="62" y="64">Kütüp</text>
      <text className="ig-t muted" x="62" y="76">kutup…workers.dev</text>
      <rect className="ig-card" x="18" y="92" width="164" height="26" rx="9" />
      <text className="ig-t" x="26" y="108.5">Web Uygulaması Olarak Aç</text>
      <rect className="ig-switch" x="150" y="98" width="24" height="14" rx="7" />
      <circle className="ig-knob" cx="167" cy="105" r="5.2" />
    </Screen>
  );
}

function StepOpen() {
  const cells = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++) if (!(r === 1 && c === 2)) cells.push(<rect key={`${r}${c}`} className={`ig-app-soft c${(r + c) % 4}`} x={30 + c * 38} y={44 + r * 30} width="22" height="22" rx="6" />);
  return (
    <Screen>
      <rect className="ig-card" x="22" y="14" width="156" height="22" rx="8" />
      <KutupIcon x={28} y={18} s={14} />
      <text className="ig-t strong" x="48" y="28.5">Ece kütüpte! 📚</text>
      <text className="ig-t muted" x="172" y="28.5" textAnchor="end">şimdi</text>
      {cells}
      <KutupIcon x={106} y={74} s={22} />
      <text className="ig-t tiny" x="117" y="104" textAnchor="middle">Kütüp</text>
      <Tap x={117} y={85} r={14} />
    </Screen>
  );
}

const STEPS = [
  [
    StepMenu,
    "••• sonra Paylaş",
    oldSafari ? "Safari’nin altındaki Paylaş (⬆ kutu ve ok) düğmesine dokun." : "Safari’de adres çubuğunun yanındaki ••• düğmesine, sonra Paylaş’a dokun.",
    oldSafari ? "" : "Eski iOS’ta Paylaş doğrudan altta durur.",
  ],
  [StepShare, "Ana Ekrana Ekle", "Açılan listeyi biraz aşağı kaydır, Ana Ekrana Ekle’yi seç.", ""],
  [StepAdd, "Sağ üstte Ekle", "“Web Uygulaması Olarak Aç” açık kalsın, Ekle’ye bas.", ""],
  [StepOpen, "Kütüp’ten aç", "Ana ekrandaki Kütüp’ten gir, 🔔 Bildirimleri aç de, İzin Ver’e bas.", "Bundan sonra biri gelince telefonun titrer."],
];

export function IosGuide({ hide }) {
  const strip = useRef(null),
    [at, setAt] = useState(0);
  const go = (i) => {
    const tile = strip.current?.children[i];
    if (tile) strip.current.scrollTo({ left: tile.offsetLeft - strip.current.offsetLeft, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = strip.current;
    if (!el?.children.length) return;
    const step = el.children[1] ? el.children[1].offsetLeft - el.children[0].offsetLeft : el.clientWidth;
    setAt(Math.max(0, Math.min(STEPS.length - 1, Math.round(el.scrollLeft / step))));
  };
  return (
    <section className="ios-guide" aria-label="iPhone’da bildirim için Kütüp’ü ana ekrana ekle">
      <div className="ios-guide-head">
        <span className="ios-eyebrow">İPHONE · BİR KERELİK</span>
        <strong>Bildirim için Kütüp’ü ana ekrana ekle.</strong>
        <p>Apple bildirimleri yalnız ana ekrandaki uygulamaya yolluyor. Dört adım, bir dakika.</p>
      </div>
      <ol className="ios-strip" ref={strip} onScroll={onScroll}>
        {STEPS.map(([Art, title, text, note], i) => (
          <li key={title} className={at === i ? "on" : ""}>
            <Art />
            <span className="ios-no">{i + 1}/4</span>
            <b>{title}</b>
            <small>{text}</small>
            {note && <small className="ios-note">{note}</small>}
          </li>
        ))}
      </ol>
      <div className="ios-dots">
        {STEPS.map(([, title], i) => (
          <button key={title} type="button" aria-label={`${i + 1}. adım: ${title}`} aria-current={at === i ? "step" : undefined} onClick={() => go(i)}>
            <i />
          </button>
        ))}
      </div>
      <button className="icon-button setup-close" aria-label="Bu kartı gizle" onClick={hide}>
        <X size={17} />
      </button>
    </section>
  );
}

// ---------- the empty state: a team of one ----------
const BOOKS = [
  [16, 9, "peach"], [26, 7, "blue"], [34, 10, "lilac"], [45, 6, "mint"], [52, 9, "lemon"], [62, 8, "pink"],
  [214, 8, "mint"], [223, 10, "peach"], [234, 7, "lilac"], [242, 9, "blue"], [252, 6, "pink"], [259, 10, "lemon"], [270, 7, "mint"], [278, 9, "peach"],
];
export function AloneTable({ me, invite }) {
  return (
    <div className="alone">
      <div className="alone-art">
        <svg viewBox="0 0 320 132" aria-hidden="true">
          <rect className="al-wall" x="0" y="0" width="320" height="132" rx="18" />
          {/* shelves at both ends of the reading room */}
          {[30, 58].map((y) => (
            <g key={y}>
              <rect className="al-shelf" x="10" y={y + 22} width="80" height="3" rx="1" />
              <rect className="al-shelf" x="208" y={y + 22} width="96" height="3" rx="1" />
            </g>
          ))}
          {[30, 58].map((y, row) =>
            BOOKS.map(([x, w, c], i) => (
              <rect key={`${row}-${i}`} className={`al-book ${c}`} x={x + (row ? (i % 3) - 1 : 0)} y={y + 6 + ((i + row) % 3) * 2} width={w} height={16 - ((i + row) % 3) * 2} rx="1.2" />
            )),
          )}
          {/* the long reading table, its green lamps, four chairs */}
          {[96, 136, 176, 216].map((x) => (
            <rect key={x} className="al-chair" x={x} y="66" width="26" height="34" rx="6" />
          ))}
          <rect className="al-table" x="70" y="92" width="190" height="9" rx="3" />
          <rect className="al-leg" x="80" y="100" width="5" height="26" rx="1.5" />
          <rect className="al-leg" x="245" y="100" width="5" height="26" rx="1.5" />
          {[150, 205].map((x) => (
            <g key={x}>
              <ellipse className="al-glow" cx={x} cy="94" rx="22" ry="5" />
              <rect className="al-lamp-post" x={x - 1} y="78" width="2" height="14" />
              <path className="al-lamp" d={`M${x - 11} 80 Q${x} 68 ${x + 11} 80Z`} />
            </g>
          ))}
          {/* my seat: an open book and a glass of tea */}
          <path className="al-page" d="M96 91 L108 86 L120 91Z" />
          <path className="al-page b" d="M108 86 L108 91" />
          <rect className="al-tea" x="124" y="84" width="6" height="8" rx="1.2" />
        </svg>
        <span className="alone-me">
          <Avatar member={me} size="small" />
        </span>
        <span className="alone-kara">
          <KaraRig pose="sleep" />
        </span>
      </div>
      <div className="alone-copy">
        <strong>Masada yer çok.</strong>
        <p>Ekibin şimdilik sensin. Davet bağlantısını at; ilk gelen yanına otursun, Kara da uyansın.</p>
        <button className="btn primary" onClick={invite}>
          <UserRoundPlus size={16} /> Davet bağlantısını paylaş
        </button>
      </div>
    </div>
  );
}

