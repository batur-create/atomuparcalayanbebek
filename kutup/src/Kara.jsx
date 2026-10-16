// Kara, the library's cat (n06): a cute black hole. A soft, round, velvet-black
// cat whose pupils are so wide and round that only a thin gold ring is left, two
// little black holes; at night a warm ring of light rims the silhouette, like a
// black hole's photon ring. It lives on the home sky, on the library roof, and
// has real jobs:
//  - its pose tells the team's state at a glance: curled up asleep when nobody is
//    at the library, watching the path when someone is on the way, awake when
//    friends are inside, reading (or in a hard hat) while I focus;
//  - it is the home page's messenger: an arrival or a new board note becomes its
//    speech bubble;
//  - a tap makes it say the one thing worth knowing now, with a way to act on it.
//
// The rig is its own small layer (never inside the big sky drawing). Poses are
// CSS transitions on a few joints; small acts (a look around, a yawn, a lick of
// the paw, pupils widening) are picked at random while it is on screen. The
// "Sakin" motion setting keeps the pose changes and drops the acts and loops;
// "Kıpırtısız" makes every change instant.
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { dayWord, shortTime } from "./api.js";
import { reducedMotion } from "./ui.jsx";
import "./kara.css";

// Drawn in a 200 × 240 box; Kara sits on y = 171 (the roof edge), the tail hangs below.
const P = {
  sit: "M66 104 C49 117 44 147 52.5 171 L147.5 171 C156 147 151 117 134 104Z",
  loaf: "M26 171 C22 136 52 104 100 102 C148 104 178 136 174 171Z",
  skull:
    "M50 77 C48 49 70 30 100 30 C130 30 152 49 150 77 C151 82 153 86 156.5 88.5 L152.5 89.5 C155 91 157 93 159 93.5 C153 95 149 97.5 146 101 C138 112.5 121 118.5 100 118.5 C79 118.5 62 112.5 54 101 C51 97.5 47 95 41 93.5 C43 93 45 91 47.5 89.5 L43.5 88.5 C47 86 49 82 50 77Z",
  earL: "M55 60 C50 42 52 26 59 14.5 C70 18 82 27 89.5 37Z",
  earR: "M145 60 C150 42 148 26 141 14.5 C130 18 118 27 110.5 37Z",
  hang: "M140 163 C161 163 169 178 167 194 C165 210 171 224 186 221",
  up: "M141 162 C163 160 171 140 167 118 C164 102 171 90 181 94",
};

function Eye({ side, x }) {
  return (
    <g className={`k-eye ${side}`} transform={`translate(${x} 76)`}>
      <g className="k-open">
        <circle r="15.6" fill="#e6b13f" />
        <path
          d="M0 -15.3 V-12.6 M7.6 -13.3 L6.3 -11 M13.3 -7.6 L11 -6.3 M15.3 0 H12.6 M-7.6 -13.3 L-6.3 -11 M-13.3 -7.6 L-11 -6.3 M-15.3 0 H-12.6 M-13.3 7.6 L-11 6.3 M13.3 7.6 L11 6.3"
          stroke="#c48a2a"
          strokeWidth=".8"
          strokeLinecap="round"
          opacity=".55"
        />
        <path d="M-14.7 4.9 A15.6 15.6 0 0 0 14.7 4.9 A23.7 23.7 0 0 1 -14.7 4.9Z" fill="#f7d685" />
        <g className="k-pupil">
          <circle r="12.9" fill="#040306" />
          <path d="M-12 4.6 A12.9 12.9 0 0 0 12 4.6" stroke="#ffe7ad" strokeWidth="1.1" strokeLinecap="round" opacity=".9" />
          <path d="M-8.8 -5.6 C-6.2 -9.2 -1 -10.9 3.1 -10.1" stroke="#25253a" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <circle cx="5.2" cy="-5.8" r="3.7" fill="#fff" />
        <circle cx="-5.4" cy="5.6" r="1.5" fill="#fff" opacity=".85" />
      </g>
      {/* The lid: a round shutter that unrolls from the top of the eye. */}
      <circle className="k-lid" r="16.2" />
      <path className="k-shut" d="M-12 1.5 Q0 9.5 12 1.5" />
      <path className="k-happy" d="M-11.5 4 Q0 -7 11.5 4" />
    </g>
  );
}

// The same ear, rimmed or filled, on its own joint so it can twitch.
const Ear = ({ side, d, fill, children }) => (
  <g className={`k-ear ${side}`}>
    <path d={d} fill={fill} />
    {children}
  </g>
);

export function KaraRig({ pose = "idle", act = "", blink = false, wink = false, className = "" }) {
  const id = useId().replace(/:/g, "");
  const rim = `${id}-rim`,
    above = `${id}-above`;
  // The head's outline for the light ring: same joints as the head below, so it follows.
  const headRim = (
    <g className="k-headpos">
      <g className="k-look">
        <g className="k-tilt">
          <Ear side="left" d={P.earL} />
          <Ear side="right" d={P.earR} />
          <path d={P.skull} />
        </g>
      </g>
    </g>
  );
  const bodiesRim = (
    <>
      <path className="k-sit" d={P.sit} />
      <path className="k-loaf" d={P.loaf} />
    </>
  );
  return (
    <svg
      className={`kara ${className}`}
      data-pose={pose}
      data-act={act || undefined}
      data-blink={blink || undefined}
      data-wink={wink || undefined}
      viewBox="0 0 200 240"
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id={rim} gradientUnits="userSpaceOnUse" x1="150" y1="20" x2="60" y2="200">
          <stop offset="0" stopColor="#ff7a2a" stopOpacity="0" />
          <stop offset=".45" stopColor="#ff8a33" stopOpacity=".25" />
          <stop offset=".8" stopColor="#ffae45" />
          <stop offset="1" stopColor="#ffe3a6" />
        </linearGradient>
        <clipPath id={above}>
          <rect width="200" height="171.5" />
        </clipPath>
      </defs>

      {/* The ring of light: strokes under the black fills, so only the outer half shows. */}
      <g className="k-rim" stroke={`url(#${rim})`} strokeLinejoin="round" strokeLinecap="round">
        <g className="k-tailpos">
          <g className="k-tail-hang">
            <path className="glow" d={P.hang} />
            <path className="core" d={P.hang} />
          </g>
          <g className="k-tail-up">
            <path className="glow" d={P.up} />
            <path className="core" d={P.up} />
          </g>
        </g>
        <g clipPath={`url(#${above})`}>
          <g className="glow">
            {bodiesRim}
            {headRim}
          </g>
          <g className="core">
            {bodiesRim}
            {headRim}
          </g>
        </g>
      </g>

      <g className="k-tailpos">
        <g className="k-tail-hang">
          <path d={P.hang} stroke="var(--kara-fur)" strokeWidth="12" strokeLinecap="round" />
          <path d="M150 164.5 C160 169 163.5 180 163 191" stroke="var(--kara-sheen)" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M183 216.5 L188.5 213.5 M184.5 223 L190.5 224.5" stroke="var(--kara-fur)" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <g className="k-tail-up">
          <path d={P.up} stroke="var(--kara-fur)" strokeWidth="12" strokeLinecap="round" />
          <path d="M157 152 C164 142 166 130 163 118" stroke="var(--kara-sheen)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>

      {/* Curled up: a round black dome, paws tucked under the chin. */}
      <g className="k-loaf">
        <path d={P.loaf} fill="var(--kara-fur)" />
        <path d="M44 128 C58 112 80 106 100 106" stroke="var(--kara-sheen)" strokeWidth="3" strokeLinecap="round" />
        <path d="M156 136 C165 146 170 156 171 166 M36 166 C38 154 44 146 52 140" stroke="var(--kara-shade)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M73 171 C73 165.5 78 162.5 84 162.5 C90 162.5 94.5 165.5 94.5 171Z M105.5 171 C105.5 165.5 110 162.5 116 162.5 C122 162.5 127 165.5 127 171Z" fill="var(--kara-pad)" />
      </g>

      {/* Sitting. */}
      <g className="k-sit">
        <g className="k-breath">
          <path d={P.sit} fill="var(--kara-fur)" />
          <path d="M132 112 C143 124 148 142 147.5 158" stroke="var(--kara-sheen)" strokeWidth="3" strokeLinecap="round" />
          <path d="M57 152 C57 140 62 130 70 124 M73 130 C72 141 72 151 73 159 M127 130 C128 141 128 151 127 159" stroke="var(--kara-shade)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M84 124 C88 130 92 133 100 134 C108 133 112 130 116 124 C114 136 108 144 100 147.5 C92 144 86 136 84 124Z" fill="var(--kara-pad)" />
          <path d="M92 131 L94 137 M100 134.5 L100 141 M108 131 L106 137 M96 141 L98 145 M104 141 L102 145" stroke="var(--kara-sheen)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M100 150 V161" stroke="#050407" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M103 171 C102 162 107 157 116 157 C125 157 131 162 130 171Z" fill="var(--kara-pad)" />
          <path d="M112.5 164 V169.5 M120 164 V169.5" stroke="#050407" strokeWidth="1.3" strokeLinecap="round" />
          {/* The collar sits in the fur: the chin and the fur fall over its edge. */}
          <g className="k-collar">
            <path d="M59.5 108.5 C84 119.5 116 119.5 140.5 108.5 L141.5 114.5 C116 126 84 126 58.5 114.5Z" fill="var(--accent)" />
            <path d="M59 113.2 C84 124.2 116 124.2 141 113.2" stroke="var(--accent-deep)" strokeWidth="1.5" opacity=".75" />
            <path d="M66 108 L67.5 113.5 M73 110.8 L74.2 116.3 M80 112.8 L80.8 118.3 M120 112.8 L119.2 118.3 M127 110.8 L125.8 116.3 M134 108 L132.5 113.5" stroke="var(--kara-fur)" strokeWidth="2.3" strokeLinecap="round" />
            <ellipse cx="100" cy="137" rx="5.4" ry="1.7" fill="#050407" opacity=".7" />
            <g className="k-tag">
              <circle cx="100" cy="124.6" r="2.1" stroke="#b8862e" strokeWidth="1.2" />
              <circle cx="100" cy="131.2" r="5.7" fill="#e0a640" />
              <circle cx="100" cy="131.2" r="3.4" fill="#0b0a0f" />
              <path d="M96.8 133 A3.5 3.5 0 0 0 103.2 133" stroke="#ffe3a6" strokeWidth=".9" strokeLinecap="round" />
              <path d="M96.2 128.6 A5 5 0 0 1 99 126.4" stroke="#fff3c4" strokeWidth="1" strokeLinecap="round" opacity=".7" />
            </g>
          </g>
        </g>
      </g>

      {/* Reading: an open book held in both paws. */}
      <g className="k-book">
        <path d="M58 150 Q79 141 100 150 Q121 141 142 150 L139 173 Q120 166 100 174 Q80 166 61 173Z" fill="var(--accent)" />
        <path d="M61 148 Q80 140 100 148.5 Q120 140 139 148 L136.5 168.5 Q119 162 100 169.5 Q81 162 63.5 168.5Z" fill="#fff5e3" />
        <path className="k-page" d="M100 148.5 Q120 140 139 148 L136.5 168.5 Q119 162 100 169.5Z" fill="#f2e5cb" />
        <path d="M100 148.5 V169.5 M70 151 L91 154 M70 156.5 L91 159.5 M109 154 L130 151 M109 159.5 L130 156.5" stroke="#b6a58a" strokeWidth="1.1" strokeLinecap="round" />
        <ellipse cx="62" cy="161" rx="7" ry="6" fill="var(--kara-pad)" />
        <ellipse cx="138" cy="161" rx="7" ry="6" fill="var(--kara-pad)" />
      </g>

      <g className="k-headpos">
        <g className="k-look">
          <g className="k-tilt">
            <Ear side="left" d={P.earL} fill="var(--kara-fur)">
              <path d="M60 51 C57 39 58 28 62 21 C70 24.5 78 30.5 83.5 37.5Z" fill="#251b26" />
              <path d="M61 49 C59 39 59.5 30 62.5 23.5" stroke="#3a2a38" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M62 44 L69 37 M61.5 37 L67 31.5 M63.5 50 L71 42.5" stroke="#5a5264" strokeWidth=".9" strokeLinecap="round" />
            </Ear>
            <Ear side="right" d={P.earR} fill="var(--kara-fur)">
              <path d="M140 51 C143 39 142 28 138 21 C130 24.5 122 30.5 116.5 37.5Z" fill="#251b26" />
              <path d="M139 49 C141 39 140.5 30 137.5 23.5" stroke="#3a2a38" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M138 44 L131 37 M138.5 37 L133 31.5 M136.5 50 L129 42.5" stroke="#5a5264" strokeWidth=".9" strokeLinecap="round" />
            </Ear>
            <path d={P.skull} fill="var(--kara-fur)" />
            <path d="M70 41 C84 34.5 116 34.5 130 41 C116 38.5 84 38.5 70 41Z" fill="var(--kara-sheen)" />
            <path d="M92 36.5 L94 42.5 M100 35.5 L100 42.5 M108 36.5 L106 42.5" stroke="var(--kara-shade)" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M55 92 C58 100 63 106 70 110 M145 92 C142 100 137 106 130 110" stroke="var(--kara-shade)" strokeWidth="2" strokeLinecap="round" />
            <Eye side="left" x={79.5} />
            <Eye side="right" x={120.5} />
            <ellipse cx="92.6" cy="101" rx="7.2" ry="5" fill="var(--kara-pad)" />
            <ellipse cx="107.4" cy="101" rx="7.2" ry="5" fill="var(--kara-pad)" />
            <path d="M89.6 99.6 h.01 M92.8 102.4 h.01 M95.8 100.2 h.01 M110.4 99.6 h.01 M107.2 102.4 h.01 M104.2 100.2 h.01" stroke="#2a2935" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M95.8 94 C95.8 92 104.2 92 104.2 94 C104.2 96.2 101.6 98 100 98.5 C98.4 98 95.8 96.2 95.8 94Z" fill="#2e232b" />
            <path d="M97.6 93.5 C98.9 92.9 101.1 92.9 102.4 93.5" stroke="#4d3d48" strokeWidth=".9" strokeLinecap="round" />
            <path className="k-mouth" d="M100 98.5 V100.8 M100 100.8 C98 103.6 94.6 103.6 93 101.4 M100 100.8 C102 103.6 105.4 103.6 107 101.4" />
            <g className="k-yawn">
              <path d="M93 101 C93 99.4 107 99.4 107 101 C107 108.5 103.6 112.5 100 112.5 C96.4 112.5 93 108.5 93 101Z" fill="#3a1c27" />
              <path d="M95.5 108 C97 106 103 106 104.5 108 C104 111 102 112 100 112 C98 112 96 111 95.5 108Z" fill="#c4687c" />
              <path d="M95 101.2 L96 104.2 L97 101.2Z M103 101.2 L104 104.2 L105 101.2Z" fill="#f3eee6" />
            </g>
            <path className="k-tongue" d="M98 102.4 C98 106 102 106 102 102.4Z" fill="#c4687c" />
            <g className="k-whisk">
              <path d="M86 99 C72 96 58 96 40 99 M86 102 C72 102 59 104.5 44 109.5 M87 104.5 C75 106 64 110 52 117" />
              <path d="M114 99 C128 96 142 96 160 99 M114 102 C128 102 141 104.5 156 109.5 M113 104.5 C125 106 136 110 148 117" />
              <path d="M70 58 C66 53 62 51 56 50 M130 58 C134 53 138 51 144 50" />
            </g>
            <g className="k-glasses">
              <circle cx="79.5" cy="76" r="18.6" />
              <circle cx="120.5" cy="76" r="18.6" />
              <path d="M98.1 74 Q100 70.8 101.9 74 M61 72 L51 67.5 M139 72 L149 67.5" />
              <path d="M67 66 Q70.5 61.5 76.5 60.4 M108 66 Q111.5 61.5 117.5 60.4" stroke="#fff" strokeWidth="1.4" opacity=".35" />
            </g>
            <g className="k-hat">
              <path d="M57 52 C57 22 77 9 100 9 C123 9 143 22 143 52Z" fill="#ebbd4e" />
              <path d="M100 10 V49 M80 14 C74 24 72 36 72 50 M120 14 C126 24 128 36 128 50" stroke="#d29f32" strokeWidth="2" strokeLinecap="round" />
              <path d="M66 27 C72 19 82 14 92 12.5" stroke="#fff3c4" strokeWidth="2.4" strokeLinecap="round" opacity=".6" />
              <path d="M100 25 V37 M94.8 28 L105.2 34 M94.8 34 L105.2 28" stroke="#8a6216" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M49 50.5 C70 56 130 56 151 50.5 L151.5 56.5 C130 62.5 70 62.5 48.5 56.5Z" fill="#d9a63c" />
            </g>
            <g className="k-note">
              <g transform="rotate(-8 100 111)">
                <rect x="86" y="101" width="28" height="20" rx="2" fill="#fff8e8" />
                <path d="M106 101 L114 109 L106 109Z" fill="#e9dcc0" />
                <path d="M90 108 H103 M90 112.5 H108 M90 117 H101" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* The left paw: over the face when it lifts for a lick. */}
      <g className="k-paw">
        <path d="M70 171 C69 162 75 157 84 157 C93 157 98 162 97 171Z" fill="var(--kara-pad)" />
        <path d="M80 164 V169.5 M87.5 164 V169.5" stroke="#050407" strokeWidth="1.3" strokeLinecap="round" />
        {/* Toe beans, seen only when the paw turns up to the face. */}
        <g className="k-beans" fill="#6b4554">
          <path d="M70 171 C69 162 75 157 84 157 C93 157 98 162 97 171Z" fill="none" stroke="var(--kara-sheen)" strokeWidth="2.4" />
          <ellipse cx="83.5" cy="166" rx="5.6" ry="3.6" />
          <circle cx="76.5" cy="161" r="2.1" />
          <circle cx="83.5" cy="159.4" r="2.1" />
          <circle cx="90.5" cy="161" r="2.1" />
        </g>
      </g>

      <g className="k-fx">
        <g className="k-zzz" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path className="z1" d="M146 76 H155 L146 86 H155" />
          <path className="z2" d="M160 56 H171 L160 68.5 H171" />
        </g>
        <g className="k-hearts" fill="var(--accent)">
          <path className="h1" d="M40 46 C32 40 36 32 40 37 C44 32 48 40 40 46Z" />
          <path className="h2" d="M162 40 C154 34 158 26 162 31 C166 26 170 34 162 40Z" />
        </g>
        <g className="k-sparks" fill="#f5c451">
          <path className="s1" d="M34 70 L36.5 63.5 L39 70 L45.5 72.5 L39 75 L36.5 81.5 L34 75 L27.5 72.5Z" />
          <path className="s2" d="M163 62 L165 57 L167 62 L172 64 L167 66 L165 71 L163 66 L158 64Z" />
          <path className="s3" d="M154 120 L155.6 116 L157.2 120 L161.2 121.6 L157.2 123.2 L155.6 127.2 L154 123.2 L150 121.6Z" />
        </g>
      </g>
    </svg>
  );
}

// Little things Kara does on its own while on screen, by pose, and how long each lasts.
const ACTS = {
  idle: ["look-l", "look-r", "look-up", "tilt", "slow-blink", "ear-l", "ear-r", "flick", "sway", "breathe", "groom", "yawn", "pulse"],
  watch: ["hunt", "ear-l", "flick", "pulse", "sway", "hunt"],
  sleep: ["ear-l", "ear-r", "dream", "sigh", "sigh", "sway"],
  read: ["page", "page", "peek", "doze", "ear-r", "sway"],
  build: ["look-l", "nod", "ear-l", "flick", "sway", "pulse"],
};
const LASTS = { sway: 3200, breathe: 1800, "look-l": 2200, "look-r": 2200, "look-up": 1900, tilt: 1900, "slow-blink": 2000, "ear-l": 700, "ear-r": 700, flick: 1300, groom: 3200, yawn: 2400, pulse: 2600, hunt: 2600, page: 1600, peek: 2100, doze: 3000, nod: 1800, dream: 1700, sigh: 2600 };
const lively = () => !reducedMotion() && document.documentElement.dataset.motion !== "calm";

const firstName = (x) => x?.name || "Biri";
const listNames = (list) => (list.length <= 2 ? list.map(firstName).join(" ve ") : `${firstName(list[0])}, ${firstName(list[1])} +${list.length - 2}`);
const SLEEPY = ["Kütüp şimdilik sessiz. İlk sen git, ben kapıyı tutarım.", "Mırr… Biri gelince uyandır beni.", "Kimse yokken kitaplar benim. Sessizce nöbetteyim."];

// What Kara says when tapped: the most useful thing first, then the next one
// on the next tap. Each line may carry one action.
function sayings({ me, data, now, unread, navigate }) {
  const others = data.members.filter((x) => x.id !== me?.id);
  const here = others.filter((x) => x.status === "here" || x.status === "break"),
    coming = others.filter((x) => x.status === "coming"),
    next = data.plans.find((p) => p.starts > now),
    focusing = me?.focusEnd > now;
  const out = [];
  if (unread > 0) out.push({ text: `Pano'da ${unread} yeni not var. Getireyim mi?`, act: ["Oku", () => navigate("board")] });
  if (focusing) out.push({ text: `Sen odaktasın, ben de sayfamdayım. ${Math.max(1, Math.ceil((me.focusEnd - now) / 60000))} dk kaldı.` });
  if (coming.length) out.push({ text: `${listNames(coming)} yolda${coming.length === 1 && coming[0].arrival ? `, ${coming[0].arrival.toLocaleLowerCase("tr")}` : ""}. Gözüm patikada.` });
  if (here.length) {
    const desk = here.length === 1 && here[0].desk ? ` ${here[0].desk} numaralı masada` : " içeride";
    out.push({ text: me?.status === "here" ? `${listNames(here)} da burada. Ders arası bana uğrayın.` : `${listNames(here)}${desk}. Sen de gel, yer var.` });
  }
  if (next) out.push({ text: `${dayWord(next.starts)} ${shortTime(next.starts)}: ${next.note || "kütüp buluşması"}.`, act: ["Planlar", () => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" })] });
  if (!out.length) out.push(...SLEEPY.map((text) => ({ text })));
  return out;
}

// One Kara somewhere on the page: a pose from the moment (`base`), a speech
// bubble for events (`cue`, played when its key changes) and for taps (`lines`,
// the next one on every tap), a purr on a long press.
function KaraSpot({ className, style, base, lines, cue }) {
  const [event, setEvent] = useState(null); // { pose, text, act }
  const [wink, setWink] = useState(false);
  const turn = useRef(0),
    timers = useRef([]),
    hold = useRef(null),
    held = useRef(false);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => clear(), []);
  const show = (next, ms = 5200) => {
    clear();
    setEvent(next);
    later(() => setEvent(null), ms);
  };
  useEffect(() => {
    if (cue) show(cue, cue.ms);
  }, [cue?.key]);
  // A new moment starts from its most useful line.
  useEffect(() => {
    turn.current = 0;
  }, [base]);
  const tap = () => {
    if (held.current) return (held.current = false);
    const line = lines[turn.current++ % lines.length];
    const awake = base === "sleep" ? "idle" : base;
    if (base === "sleep" && !event) {
      // A sleepy one-eyed look first, then up.
      setWink(true);
      show({ pose: "sleep", text: null }, 900);
      later(() => {
        setWink(false);
        show({ pose: awake, text: line.text, act: line.act });
      }, 650);
      return;
    }
    show({ pose: line.pose || awake, text: line.text, act: line.act });
  };
  const press = (e) => {
    if (e.button) return;
    held.current = false;
    clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      held.current = true;
      show({ pose: "purr", text: "Mırrr… Tam orası." }, 2600);
    }, 550);
  };
  const release = () => clearTimeout(hold.current);
  const pose = event?.pose || base;
  const [act, setAct] = useState(""),
    [blink, setBlink] = useState(false),
    box = useRef(null);
  // While Kara is on screen and motion is on: a small act every few seconds, a blink now and then.
  useEffect(() => {
    let alive = true,
      seen = true,
      actTimer,
      blinkTimer,
      last = "";
    const ok = () => alive && seen && document.visibilityState === "visible" && lively();
    const pool = ACTS[pose] || [];
    const nextAct = (wait) => {
      actTimer = setTimeout(() => {
        if (!ok() || !pool.length) return nextAct(3000);
        let a = pool[Math.floor(Math.random() * pool.length)];
        if (a === last) a = pool[(pool.indexOf(a) + 1) % pool.length];
        last = a;
        setAct(a);
        actTimer = setTimeout(() => {
          setAct("");
          nextAct(1800 + Math.random() * 3400);
        }, LASTS[a] || 1500);
      }, wait);
    };
    const nextBlink = () => {
      blinkTimer = setTimeout(() => {
        if (ok() && pose !== "sleep") {
          setBlink(true);
          setTimeout(() => alive && setBlink(false), 160);
        }
        nextBlink();
      }, 2400 + Math.random() * 4400);
    };
    const io = "IntersectionObserver" in window && box.current ? new IntersectionObserver(([e]) => (seen = e.isIntersecting)) : null;
    io?.observe(box.current);
    setAct("");
    nextAct(900 + Math.random() * 1800);
    nextBlink();
    return () => {
      alive = false;
      clearTimeout(actTimer);
      clearTimeout(blinkTimer);
      io?.disconnect();
    };
  }, [pose]);
  // With a mouse, the pupils follow the pointer a little.
  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover)").matches) return;
    const follow = (e) => {
      const svg = box.current?.querySelector("svg");
      if (!svg || !lively()) return;
      const r = svg.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / 300)),
        y = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height * 0.3) / 300));
      svg.style.setProperty("--px", `${(x * 2.4).toFixed(2)}px`);
      svg.style.setProperty("--py", `${(y * 2).toFixed(2)}px`);
    };
    window.addEventListener("pointermove", follow, { passive: true });
    return () => window.removeEventListener("pointermove", follow);
  }, []);
  return (
    <div ref={box} className={`kara-spot ${className}`} style={style}>
      <button
        type="button"
        className="kara-button"
        aria-label="Kara: dokun, sana bir şey söylesin"
        onClick={tap}
        onPointerDown={press}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        <KaraRig pose={pose} act={event ? "" : act} blink={blink} wink={wink} />
      </button>
      {event?.text && (
        <p className="kara-say" key={event.text} role="status">
          <span>{event.text}</span>
          {event.act && (
            <button type="button" onClick={() => (setEvent(null), event.act[1]())}>
              {event.act[0]} →
            </button>
          )}
        </p>
      )}
    </div>
  );
}

// Kara on the library roof (home sky). `arrived` are member ids that just came in.
export function KaraHome({ me, data, now, unread, navigate, arrived, style }) {
  const others = data.members.filter((x) => x.id !== me?.id);
  const anyoneHere = data.members.some((x) => x.status === "here" || x.status === "break"),
    anyoneComing = others.some((x) => x.status === "coming"),
    focusing = me?.focusEnd > now;
  const base = focusing ? (me.focusStrict ? "build" : "read") : anyoneHere ? "idle" : anyoneComing ? "watch" : "sleep";
  const [cue, setCue] = useState(null);
  // Messenger: a friend (or I) came in.
  useEffect(() => {
    if (!arrived.length) return;
    const who = data.members.filter((x) => arrived.includes(x.id));
    const friend = who.find((x) => x.id !== me?.id);
    if (friend) setCue({ key: `in-${friend.id}-${Date.now()}`, pose: "greet", text: `${firstName(friend)} geldi!${friend.desk ? ` ${friend.desk} numaralı masada.` : ""}` });
    else if (who.length) setCue({ key: `in-me-${Date.now()}`, pose: "greet", text: "Hoş geldin! Masan hazır, kitaplar dizildi." });
  }, [arrived.join(",")]);
  // Messenger: a friend set off for the library.
  const coming = others.filter((x) => x.status === "coming"),
    wasComing = useRef(null);
  useEffect(() => {
    const before = wasComing.current;
    wasComing.current = new Set(coming.map((x) => x.id));
    const fresh = before && coming.find((x) => !before.has(x.id));
    if (fresh) setCue({ key: `go-${fresh.id}-${Date.now()}`, pose: "watch", text: `${firstName(fresh)} yola çıktı${fresh.arrival ? `, ${fresh.arrival.toLocaleLowerCase("tr")} burada` : ""}. Gözüm patikada.` });
  }, [coming.map((x) => x.id).join(",")]);
  // Messenger: a new note on the board from someone else.
  const last = data.messages.filter((x) => x.kind !== "system").at(-1),
    seen = useRef(undefined);
  useEffect(() => {
    const before = seen.current;
    seen.current = last?.id ?? null;
    if (before === undefined || !last || before === last.id || last.memberId === me?.id) return;
    const author = data.members.find((x) => x.id === last.memberId);
    const text = last.text.length > 46 ? `${last.text.slice(0, 44)}…` : last.text;
    setCue({ key: `msg-${last.id}`, pose: "note", ms: 6500, text: `${firstName(author)} Pano'ya yazdı: “${text}”`, act: ["Oku", () => navigate("board")] });
  }, [last?.id]);
  const lines = useMemo(() => sayings({ me, data, now, unread, navigate }), [me, data, Math.floor(now / 60000), unread]);
  return <KaraSpot className="kara-home" style={style} base={base} lines={lines} cue={cue} />;
}

// Kara beside the focus timer: reads with you, wears a hard hat while you build,
// cheers when the building is done, drops its ears when it falls.
export function KaraBuddy({ me, now, item, outcome }) {
  const running = me?.focusEnd > now,
    paused = running && !!me.focusPausedAt,
    building = running && !!me.focusStrict,
    left = running ? Math.max(1, Math.ceil((me.focusEnd - (me.focusPausedAt || now)) / 60000)) : 0;
  const base = paused ? "sleep" : building ? "build" : running ? "read" : "idle";
  const name = item?.name || "Bina";
  const lines = paused
    ? [{ text: "Çay molası. Ben bir kestireyim, iskele beklesin." }]
    : building
      ? [{ text: `Kalfa Kara görevde. ${name} yükseliyor, ${left} dk kaldı.` }, { text: "Telefonu bırakma, işçiler seni izliyor. Ben de." }]
      : running
        ? [{ text: `Sen odaktasın, ben de sayfamdayım. ${left} dk kaldı.` }, { text: "Bir sayfa daha. Sonra çay konusunu konuşuruz." }]
        : [{ text: "Ben hazırım. Sen süreni seç, ben kitabımı." }, { text: "Bina seçersen baretimi takarım." }];
  const cue = useMemo(() => {
    if (!outcome || Date.now() - outcome.at > 8000) return null;
    return outcome.type === "built"
      ? { key: `b-${outcome.at}`, pose: "cheer", ms: 5200, text: "Bitti! Köyde yerini aldı. Patiler havaya!" }
      : outcome.type === "collapsed"
        ? { key: `c-${outcome.at}`, pose: "sad", ms: 5200, text: "İnşaat çöktü… Kulaklarım düştü. Bir dahakine beraber bitiririz." }
        : null;
  }, [outcome?.at]);
  return <KaraSpot className="kara-buddy" base={base} lines={lines} cue={cue} />;
}
