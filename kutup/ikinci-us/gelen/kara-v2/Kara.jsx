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

// Kara: a compact velvet-black rooftop cat. Every moving part is an SVG joint.
// The roof baseline stays at y=171 so Home and FocusCard use the same rig.
const P = {
  sit: 'M64 103 C48 114 39 135 43 157 L39 160 C43 170 58 171 70 171 H133 C150 171 159 166 161 158 L156 155 C160 134 150 115 136 103Z',
  loaf: 'M27 171 C23 151 36 129 58 120 C77 110 123 110 142 120 C165 130 177 151 173 171Z',
  skull: 'M52 66 C51 46 71 32 100 32 C129 32 149 46 148 66 C149 74 152 78 157 81 L151 83 C156 88 162 90 165 90 L157 95 L162 98 C153 99 152 105 145 108 C135 117 119 122 100 122 C81 122 65 117 55 108 C48 105 47 99 38 98 L43 95 L35 90 C38 90 44 88 49 83 L43 81 C48 78 51 74 52 66Z',
  earL: 'M54 66 C49 52 48 26 55 17 C60 13 78 27 85 38Z',
  earR: 'M146 66 C151 52 152 26 145 17 C140 13 122 27 115 38Z',
  hang: 'M140 155 C163 153 180 166 177 185 C175 199 168 205 172 216 C175 224 184 226 190 219 C191 232 175 237 164 230 C151 222 151 210 156 195 C162 179 158 173 144 173Z',
  up: 'M142 156 C159 154 167 141 163 126 C160 112 157 99 167 90 C174 84 184 88 183 95 C176 92 172 95 174 102 C180 127 181 142 168 156 C161 166 152 172 143 172Z',
};

const Eye = React.memo(function Eye({ side, x }) {
  return <g className={`k-eye ${side}`} transform={`translate(${x} 77)`}>
    <g className="k-eye-depth"><g className="k-eye-squeeze"><g className="k-open"><g className="k-gaze">
      <circle r="17.2" fill="#c88c36" />
      <path d="M-16.6 4.5 A17.2 17.2 0 0 0 16.6 4.5 A25 25 0 0 1 -16.6 4.5Z" fill="#f5cf79" />
      <g stroke="#f6cf78" strokeWidth=".45" opacity=".65">
        {Array.from({ length: 40 }, (_, i) => { const a=i*Math.PI/20; return <path key={i} d={`M${(16.1*Math.cos(a)).toFixed(2)} ${(16.1*Math.sin(a)).toFixed(2)} L${(17.05*Math.cos(a)).toFixed(2)} ${(17.05*Math.sin(a)).toFixed(2)}`} />; })}
      </g>
      <g className="k-pupil"><circle r="15.7" fill="#030306" /></g>
      <path d="M-14.9 8.4 A17.1 17.1 0 0 0 14.9 8.4" stroke="#ffe6ae" strokeWidth=".7" strokeLinecap="round" />
      <circle cx="-5.1" cy="-6.1" r="3.5" fill="#fffdf8" />
      <circle cx="4.8" cy="5.8" r="1.25" fill="#fffdf8" opacity=".9" />
    </g></g>
    <circle className="k-lid" r="19.1" />
    <path className="k-shut" d="M-12 1.5 Q0 9.5 12 1.5" />
    <path className="k-happy" d="M-11.5 4 Q0 -7 11.5 4" />
  </g></g></g>;
});

const Ear = ({side,d,fill,children}) => <g className={`k-ear-follow ${side}`}><g className={`k-ear-depth ${side}`}><g className={`k-ear ${side}`}><path d={d} fill={fill} />{children}</g></g></g>;

export function KaraRig({pose='idle',act='',blink=false,wink=false,className=''}) {
  const id=useId().replace(/:/g,'');
  const rim=`${id}-rim`, velvet=`${id}-velvet`, body=`${id}-body`, above=`${id}-above`;
  const headRim=<g className="k-headpos"><g className="k-look"><g className="k-tilt"><g className="k-yaw"><Ear side="left" d={P.earL}/><Ear side="right" d={P.earR}/><path d={P.skull}/></g></g></g></g>;
  const bodiesRim=<><path className="k-sit" d={P.sit}/><path className="k-loaf" d={P.loaf}/></>;
  return <svg className={`kara ${className}`} data-pose={pose} data-act={act||undefined} data-blink={blink||undefined} data-wink={wink||undefined} viewBox="0 0 200 240" aria-hidden="true" fill="none" style={{"--moment":`${LASTS[act] || 3200}ms`}}>
    <defs>
      <linearGradient id={rim} x1=".9" y1="0" x2=".1" y2="1"><stop stopColor="#f7b96a"/><stop offset=".48" stopColor="#db823b"/><stop offset="1" stopColor="#ffdb9b"/></linearGradient>
      <radialGradient id={velvet} cx=".36" cy=".12" r=".9"><stop stopColor="#191d2a"/><stop offset=".55" stopColor="#0d0e16"/><stop offset="1" stopColor="#09090e"/></radialGradient>
      <linearGradient id={body} x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#121522"/><stop offset="1" stopColor="#09090e"/></linearGradient>
      <clipPath id={above}><rect width="200" height="171.5"/></clipPath>
    </defs>
    <g className="k-flight">
    <g className="k-rim" stroke={`url(#${rim})`} strokeLinejoin="round" strokeLinecap="round">
      <g className="k-tailpos"><g className="k-tail-hang"><path className="glow" d={P.hang}/><path className="core" d={P.hang}/></g><g className="k-tail-up"><path className="glow" d={P.up}/><path className="core" d={P.up}/></g></g>
      <g clipPath={`url(#${above})`}><g className="glow">{bodiesRim}{headRim}</g><g className="core">{bodiesRim}{headRim}</g></g>
    </g>
    <g className="k-tailpos">
      <g className="k-tail-hang"><path d={P.hang} fill={`url(#${body})`}/><path d="M149 161 C169 161 177 173 172 188 C171 177 165 171 156 169Z" fill="var(--kara-sheen)"/><path d="M159 208 C157 219 167 232 179 228 C163 228 166 218 166 214Z" fill="var(--kara-shade)"/></g>
      <g className="k-tail-up"><path d={P.up} fill={`url(#${body})`}/><path d="M153 158 C168 147 172 137 169 122 C176 139 166 155 153 158Z" fill="var(--kara-sheen)"/></g>
    </g>
    <g className="k-loaf"><path d={P.loaf} fill={`url(#${body})`}/><path d="M36 146 C45 126 69 118 84 119 C62 125 52 133 48 148Z" fill="var(--kara-shade)"/><g className="k-dream-paw left"><path d="M73 171 C73 164 79 161 85 161 C91 161 96 165 96 171Z" fill="var(--kara-pad)"/></g><g className="k-dream-paw right"><path d="M104 171 C104 165 109 161 115 161 C121 161 127 164 127 171Z" fill="var(--kara-pad)"/></g></g>
    <g className="k-sit"><g className="k-breath">
      <path d={P.sit} fill={`url(#${body})`}/><g className="k-volume-planes"><path d="M71 118 C62 134 66 155 76 162 Q85 164 90 160 C79 151 76 134 82 123Z" fill="var(--kara-sheen)" opacity=".22"/><path d="M123 120 C139 133 146 149 139 161 Q132 166 125 165 C131 147 128 134 120 126Z" fill="#05050a" opacity=".32"/><path d="M86 142 Q100 149 114 142 Q115 155 102 161 Q88 159 86 142Z" fill="var(--kara-shade)" opacity=".45"/></g>
      <path d="M64 122 C50 132 46 148 50 159 C50 145 58 138 66 135Z M137 122 C151 132 155 148 151 159 C151 145 143 138 135 135Z" fill="var(--kara-shade)"/>
      <path d="M72 128 C71 141 73 151 75 159 M128 128 C129 141 127 151 125 159" stroke="#05050a" strokeWidth="2" strokeLinecap="round"/>
      <g className="k-paw-right"><path d="M103 171 C102 162 108 157 117 157 C126 157 132 162 131 171Z" fill="var(--kara-pad)"/>
      <path d="M113 165 V169 M121 165 V169" stroke="#08080d" strokeWidth="1.2" strokeLinecap="round"/></g>
      <g className="k-chest"><g className="k-collar">
        <path d="M63 112 Q100 127 137 112 L137 117 Q100 133 63 117Z" fill="var(--accent)"/>
        <path d="M64 116 Q100 132 136 116" stroke="var(--accent-deep)" strokeWidth="1" opacity=".45"/>
        <path d="M79 118 Q88 121 93 121 L95 123 Q100 122 105 123 L108 121 Q116 120 122 118 L121 120 Q100 128 80 120Z" fill="var(--kara-fur)"/>
        <path d="M80 128 Q88 135 96 135 L93 130 L101 136 L109 130 L106 136 Q118 134 125 127 C121 140 110 147 100 148 C89 146 82 139 80 128Z" fill="var(--kara-shade)"/>
        <path d="M90 138 Q98 144 105 142 L100 145Z" fill="var(--kara-sheen)"/>
        <g className="k-tag"><circle cx="100" cy="126.6" r="1.8" stroke="#bd934e" strokeWidth="1"/><circle cx="100" cy="133" r="5.3" fill="#dab16a"/><circle cx="100" cy="133" r="3.8" fill="#0b0a0f"/><path d="M100 130.5 V135.5 M97.5 133 H102.5 M98.25 131.25 L101.75 134.75 M98.25 134.75 L101.75 131.25" stroke="#d5aa62" strokeWidth=".65" strokeLinecap="round"/><path d="M96 131 A4.5 4.5 0 0 1 99 128.7" stroke="#f9dfaa" strokeWidth=".7" strokeLinecap="round"/></g>
      </g></g>
    </g></g>
    <g className="k-book"><path d="M58 150 Q79 141 100 150 Q121 141 142 150 L139 173 Q120 166 100 174 Q80 166 61 173Z" fill="var(--accent)"/><path d="M61 148 Q80 140 100 148.5 Q120 140 139 148 L136.5 168.5 Q119 162 100 169.5 Q81 162 63.5 168.5Z" fill="#fff5e3"/><path className="k-page" d="M100 148.5 Q120 140 139 148 L136.5 168.5 Q119 162 100 169.5Z" fill="#f2e5cb"/><path d="M100 148.5 V169.5 M70 151 L91 154 M70 156.5 L91 159.5 M109 154 L130 151 M109 159.5 L130 156.5" stroke="#b6a58a" strokeWidth="1.1" strokeLinecap="round"/><ellipse cx="62" cy="161" rx="7" ry="6" fill="var(--kara-pad)"/><ellipse cx="138" cy="161" rx="7" ry="6" fill="var(--kara-pad)"/></g>
    <g className="k-headpos"><g className="k-look"><g className="k-tilt"><g className="k-yaw">
      <Ear side="left" d={P.earL} fill="var(--kara-fur)"><path d="M56 51 C53 40 52 26 57 23 Q68 27 77 38Z" fill="#49323f"/><path d="M56 29 Q59 24 65 30 L62 29 L70 37 L64 35 L69 43 L61 38 L64 47 L57 43Z" fill="#6b4d5b" opacity=".65"/><path d="M51 32 Q50 23 55 17 Q61 17 64 21 Q55 20 54 34Z" fill="var(--kara-sheen)"/></Ear>
      <Ear side="right" d={P.earR} fill="var(--kara-fur)"><path d="M144 51 C147 40 148 26 143 23 Q132 27 123 38Z" fill="#49323f"/><path d="M144 29 Q141 24 135 30 L138 29 L130 37 L136 35 L131 43 L139 38 L136 47 L143 43Z" fill="#6b4d5b" opacity=".65"/></Ear>
      <path className="k-skull" d={P.skull} fill={`url(#${velvet})`}/>
      <path d="M63 48 Q77 35 98 36 Q82 39 78 43 L86 43 Q74 46 70 51Z" fill="var(--kara-sheen)" opacity=".75"/>
      <path d="M47 89 Q54 91 58 96 L51 95 L59 102 Q67 106 72 109 Q57 106 50 99 L44 98 L49 95Z M153 89 Q146 91 142 96 L149 95 L141 102 Q133 106 128 109 Q143 106 150 99 L156 98 L151 95Z" fill="var(--kara-shade)"/>
      <g className="k-face-plane">
      <Eye side="left" x={79.5}/><Eye side="right" x={120.5}/>
      <path d="M84 99 C86 94 95 95 100 100 C105 95 114 94 116 99 C119 106 108 110 100 105 C92 110 81 106 84 99Z" fill="var(--kara-pad)"/>
      <path d="M88 99 h.01 M91 102 h.01 M94 99.5 h.01 M112 99 h.01 M109 102 h.01 M106 99.5 h.01" stroke="#30303b" strokeWidth=".9" strokeLinecap="round"/>
      <path d="M96.2 94.5 Q100 92.2 103.8 94.5 Q104 96.6 100 98.5 Q96 96.6 96.2 94.5Z" fill="#4d3542"/><path d="M98 94.8 Q100 94 101.7 94.8" stroke="#795763" strokeWidth=".65" strokeLinecap="round"/>
      <path className="k-mouth" d="M100 98.5 V101 M100 101 Q96.5 105 93 102 M100 101 Q103.5 105 107 102"/>
      <g className="k-yawn"><path d="M93 101 Q100 98 107 101 Q108 113 100 114 Q92 113 93 101Z" fill="#3a1c27"/><path d="M96 109 Q100 106 104 109 Q103 113 100 113 Q97 113 96 109Z" fill="#b57586"/><path d="M95 102 L96 105 L97 102 M103 102 L104 105 L105 102" fill="#f4ebde"/></g>
      <path className="k-tongue" d="M98 102.4 C98 106 102 106 102 102.4Z" fill="#b57586"/>
      <g className="k-whisk"><g className="k-whisk-half left"><path d="M87 100 Q69 96 49 98 M87 103 Q68 102 46 108 M88 105 Q73 108 57 116"/></g><g className="k-whisk-half right"><path d="M113 100 Q131 96 151 98 M113 103 Q132 102 154 108 M112 105 Q127 108 143 116"/></g></g>
      <g className="k-glasses"><circle cx="79.5" cy="77" r="19.5"/><circle cx="120.5" cy="77" r="19.5"/><path d="M99 75 Q100 73 101 75 M60 73 L51 68 M140 73 L149 68"/><path d="M66 67 Q70 62 75 62 M107 67 Q111 62 116 62" stroke="#fff" strokeWidth="1.1" opacity=".25"/></g>
      <g className="k-beanie"><path d="M57 45 C56 22 74 12 100 12 C126 12 144 22 143 45Z" fill="var(--accent)"/><path d="M62 26 Q100 17 138 26 M60 32 Q100 23 140 32 M59 38 Q100 29 141 38" stroke="var(--accent-deep)" strokeWidth="1" opacity=".45"/><path d="M54 41 Q100 49 146 41 V50 Q100 58 54 50Z" fill="var(--accent-deep)"/><path d="M63 44 V51 M73 45 V52 M83 46 V53 M94 47 V54 M105 47 V54 M116 46 V53 M127 45 V52 M137 44 V51" stroke="var(--accent)" strokeWidth="1.1"/><circle cx="100" cy="9" r="6.5" fill="var(--accent)"/><path d="M97 5 L102 13 M96 11 L104 7" stroke="var(--accent-deep)" strokeWidth=".7" opacity=".5"/></g><g className="k-crown-seat"><g className="k-crown"><path d="M82 30 L79 15 L91 21 L100 9 L109 21 L121 15 L118 30Z" fill="#dab16a"/><path d="M83 27 H117 V32 H83Z" fill="#b88b49"/><circle cx="100" cy="23" r="2" fill="var(--accent)"/></g>
      </g>
      <g className="k-hat"><path d="M55 47 C55 25 76 11 100 11 C124 11 145 25 145 47Z" fill="#dfb05b"/><path d="M100 12 V46 M81 16 Q72 30 73 46 M119 16 Q128 30 127 46" stroke="#bb8d3c" strokeWidth="1.5"/><path d="M64 32 Q75 20 91 18" stroke="#f8d994" strokeWidth="2" strokeLinecap="round"/><path d="M100 28 V39 M94.5 33.5 H105.5 M96 29.5 L104 37.5 M96 37.5 L104 29.5" stroke="#8c672e" strokeWidth="1.3" strokeLinecap="round"/><path d="M49 46 Q100 54 151 46 L151 51 Q100 59 49 51Z" fill="#c99843"/><path d="M57 48 Q100 54 143 48" stroke="#f8d994" strokeWidth=".8" opacity=".7"/><path d="M63 41 V45 M137 41 V45" stroke="#a87932" strokeWidth="2" strokeLinecap="round"/></g>
      <g className="k-note"><g transform="rotate(-8 100 111)"><rect x="86" y="102" width="28" height="20" rx="2" fill="#fff8e8"/><path d="M106 102 L114 110 H106Z" fill="#e9dcc0"/><path d="M90 109 H103 M90 113.5 H108 M90 118 H101" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/></g></g>
    </g></g></g></g></g>
    
    <g className="k-paw"><path d="M69 171 C68 161 75 157 84 157 C93 157 99 162 98 171Z" fill="var(--kara-pad)"/><path d="M79.5 165 V169 M87.5 165 V169" stroke="#07070c" strokeWidth="1.2" strokeLinecap="round"/><g className="k-beans" fill="#725060"><ellipse cx="84" cy="166" rx="5.2" ry="3.3"/><circle cx="77" cy="161" r="2"/><circle cx="84" cy="159.5" r="2"/><circle cx="91" cy="161" r="2"/></g></g>
    <g className="k-guests"><g className="k-butterfly"><path d="M0 0 C-11 -13 -14 1 -3 4 C-11 7 -5 15 0 5 C5 15 11 7 3 4 C14 1 11 -13 0 0Z" fill="#baacd3"/><path d="M0 0 V7" stroke="#675376" strokeWidth=".8"/></g><g className="k-firefly"><ellipse rx="2.6" ry="3.2" fill="#d6c27c"/><path d="M-1 -2 Q-8 -6 -6 0 L-2 2 M1 -2 Q8 -6 6 0 L2 2" fill="#b9c3ac" opacity=".7"/></g><g className="k-swallowed-star"><path d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8Z" fill="#e6bf72"/></g></g>
    <g className="k-fx"><g className="k-zzz" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path className="z1" d="M148 85 H156 L148 93 H156"/><path className="z2" d="M162 68 H168 L162 74 H168"/></g><g className="k-hearts" fill="var(--accent)"><path className="h1" d="M42 53 C33 47 38 40 42 45 C46 40 51 47 42 53Z"/><path className="h2" d="M160 45 C152 39 156 33 160 37 C164 33 169 39 160 45Z"/></g><g className="k-sparks" fill="#e6bf72"><path className="s1" d="M37 67 L40 74 L47 77 L40 80 L37 87 L34 80 L27 77 L34 74Z"/><path className="s2" d="M163 57 L165 62 L170 64 L165 66 L163 71 L161 66 L156 64 L161 62Z"/></g></g>
    </g>
    <g className="k-tea-rig"><g className="k-tea"><ellipse cx="134" cy="170" rx="13" ry="2" fill="#c2b4a0"/><path d="M127 146 Q134 143 141 146 C138 151 138 154 141 161 Q145 168 134 168 Q123 168 127 161 C130 154 130 151 127 146Z" fill="#d5c7b5" fillOpacity=".75" stroke="#8d8273" strokeWidth=".8"/><path d="M128 152 Q134 154 140 152 C138 156 139 160 140 163 Q142 167 134 167 Q126 167 128 163 Q131 157 128 152Z" fill="#9e5035"/><ellipse cx="134" cy="152" rx="5.5" ry="1.4" fill="#b66943"/><path d="M130 149 Q132 154 130 159" stroke="#f8eedb" strokeWidth=".8" strokeLinecap="round" opacity=".65"/><g className="k-tea-steam" stroke="#ddd2c1" strokeWidth=".8" strokeLinecap="round"><path d="M132 142 C127 139 136 136 131 133 M137 142 C133 139 141 137 136 134"/></g></g><path className="k-tea-paw" d="M119 158 Q123 152 128 155 L132 159 Q131 166 125 165 Q120 165 119 158Z" fill="var(--kara-pad)"/></g>
  </svg>;
}



// Existing lists remain the scheduling contract; new clips are finite moments.
export const ACTS = {
  idle: ['look-l','look-r','look-up','tilt','slow-blink','ear-l','ear-r','flick','sway','breathe','groom','yawn','pulse','stretch','tail-chase','butterfly','arch','roll','tea-sip','beanie-adjust'],
  watch: ['hunt','ear-l','flick','pulse','sway','hunt','butterfly'],
  sleep: ['ear-l','ear-r','dream','sigh','sigh','sway','dream-paws'],
  read: ['page','page','peek','doze','ear-r','sway'],
  build: ['look-l','nod','ear-l','flick','sway','pulse'],
};
export const LASTS = {sway:3600,breathe:3000,'look-l':3200,'look-r':3200,'look-up':3000,tilt:3200,'slow-blink':2800,'ear-l':1200,'ear-r':1200,flick:2000,groom:4200,yawn:3400,pulse:3200,hunt:3400,page:2400,peek:3000,doze:3800,nod:2200,dream:3000,sigh:3400,stretch:4400,'tail-chase':5400,butterfly:5600,firefly:6200,roll:5000,arch:3800,'dream-paws':3600,knead:4600,'void-snack':4600,moonwatch:6800,'team-crown':5600,portal:4400,'tea-sip':5200,'beanie-adjust':3000};
export const KARA_EGGS = {
  'seven-taps': {act:'void-snack',cooldown:60000},
  midnight: {act:'moonwatch',cooldown:23*3600000},
  'all-here': {act:'team-crown',cooldown:6*3600000},
  neglected: {act:'firefly',cooldown:5*60000},
  strokes: {act:'knead',cooldown:12000},
  portal: {act:'portal',cooldown:30000},
};
const eggTimes = new Map();
let lastAutomaticEgg = 0;
const motionMode = () => document.documentElement.dataset.motion || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'still' : 'full');
const lively = () => motionMode() === 'full';
export function advanceKaraStroke(previous,point,width,time){
  if(!previous||previous.id!==point.id)return{state:previous,trigger:false,cancel:false};
  const p={...previous},dx=(point.x-p.x)*200/(width||200),dy=(point.y-p.y)*200/(width||200);
  if(Math.abs(dy)>22)return{state:null,trigger:false,cancel:true};
  if(Math.abs(dx)>3){const dir=Math.sign(dx);if(p.dir&&p.dir!==dir)p.turns++;p.dir=dir;p.distance+=Math.abs(dx);p.x=point.x;}
  return{state:p,trigger:p.turns>=3&&p.distance>=35&&time-p.start<1800,cancel:Math.abs(dx)>3};
}
function useKaraMotion(){
  const [mode,setMode]=useState(motionMode);
  useEffect(()=>{const sync=()=>setMode(motionMode());const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');media?.addEventListener('change',sync);return()=>{observer.disconnect();media?.removeEventListener('change',sync);};},[]);
  return mode;
}
const trParts = now => Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
const seasonAt = now => {const month=Number(trParts(now).month);return month===12||month<=2?'winter':month<=5?'spring':month<=8?'summer':'autumn';};
const firstName=x=>x?.name||'Biri';
const listNames=list=>list.length<=2?list.map(firstName).join(' ve '):`${firstName(list[0])}, ${firstName(list[1])} +${list.length-2}`;
const SLEEPY=['Kütüp şimdilik sessiz. İlk sen git, ben kapıyı tutarım.','Mırr… Biri gelince uyandır beni.','Kimse yokken kitaplar benim. Sessizce nöbetteyim.'];
function sayings({me,data,now,unread,navigate}){
  const others=data.members.filter(x=>x.id!==me?.id),here=others.filter(x=>x.status==='here'||x.status==='break'),coming=others.filter(x=>x.status==='coming'),next=data.plans.find(p=>p.starts>now),focusing=me?.focusEnd>now,out=[];
  if(unread>0)out.push({text:`Pano'da ${unread} yeni not var. Getireyim mi?`,act:['Oku',()=>navigate('board')]});
  if(focusing)out.push({text:`Sen odaktasın, ben de sayfamdayım. ${Math.max(1,Math.ceil((me.focusEnd-now)/60000))} dk kaldı.`});
  if(coming.length)out.push({text:`${listNames(coming)} yolda${coming.length===1&&coming[0].arrival?`, ${coming[0].arrival.toLocaleLowerCase('tr')}`:''}. Gözüm patikada.`});
  if(here.length){const desk=here.length===1&&here[0].desk?` ${here[0].desk} numaralı masada`:' içeride';out.push({text:me?.status==='here'?`${listNames(here)} da burada. Ders arası bana uğrayın.`:`${listNames(here)}${desk}. Sen de gel, yer var.`});}
  if(next)out.push({text:`${dayWord(next.starts)} ${shortTime(next.starts)}: ${next.note||'kütüp buluşması'}.`,act:['Planlar',()=>document.getElementById('plans')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'})]});
  if(!out.length)out.push(...SLEEPY.map(text=>({text})));
  return out;
}

// context is optional and internal to the host components. KaraRig's props stay unchanged.
export function KaraSpot({className='',style,base='idle',lines=SLEEPY.map(text=>({text})),cue,context={}}){
  const mode=useKaraMotion();
  const [event,setEvent]=useState(null),[act,setAct]=useState(''),[blink,setBlink]=useState(false),[wink,setWink]=useState(false),[paused,setPaused]=useState(false);
  const box=useRef(null),turn=useRef(0),eventRef=useRef(null),latest=useRef({}),seen=useRef(true),hold=useRef(),held=useRef(false),wake=useRef(),eventEnd=useRef(),motionEnd=useRef(),stroke=useRef(null),taps=useRef([]),lastTouch=useRef(Date.now());
  const pose=event?.pose||base;
  latest.current={base,pose,mode,context,event,lines};
  const show=(next,ms=5200)=>{clearTimeout(eventEnd.current);clearTimeout(wake.current);eventRef.current=next;setEvent(next);setAct('');setBlink(false);setWink(false);eventEnd.current=setTimeout(()=>{eventRef.current=null;setEvent(null);},ms);};
  const animate=(name)=>{if(!LASTS[name]||!lively()||!seen.current||document.hidden)return false;clearTimeout(motionEnd.current);setAct(name);motionEnd.current=setTimeout(()=>setAct(''),LASTS[name]);return true;};
  const egg=(name,{manual=false,force=false}={})=>{
    const def=KARA_EGGS[name],now=Date.now(),ctx=latest.current.context;if(!def||!lively()||!seen.current||document.hidden)return false;
    if(eventRef.current&&!force)return false;
    const key=`kutup-kara:${ctx.groupId||'local'}:${name}${name==='midnight'?':'+trParts(ctx.now||now).day:''}`;
    let previous=eggTimes.get(key)||0;try{previous=Math.max(previous,Number(sessionStorage.getItem(key))||0);}catch{}
    const autonomous=['midnight','all-here','neglected'].includes(name);
    if(!manual&&(now-previous<def.cooldown||(autonomous&&now-lastAutomaticEgg<45000)))return false;
    if(!manual){eggTimes.set(key,now);try{sessionStorage.setItem(key,String(now));}catch{}if(autonomous)lastAutomaticEgg=now;}
    const eggPose=name==='strokes'?'purr':name==='all-here'?(['read','build'].includes(latest.current.base)?'purr':latest.current.base):'idle';
    show({pose:eggPose,motion:def.act,text:null},LASTS[def.act]);
    return true;
  };
  useEffect(()=>{turn.current=0;},[base]);
  useEffect(()=>{if(cue)show(cue,cue.ms);},[cue?.key]);
  useEffect(()=>()=>{for(const ref of [hold,wake,eventEnd,motionEnd])clearTimeout(ref.current);},[]);
  useEffect(()=>{
    const check=()=>{const stopped=document.hidden||!seen.current;setPaused(stopped);if(stopped){setAct('');setBlink(false);}};
    const io='IntersectionObserver'in window?new IntersectionObserver(([e])=>{seen.current=e.isIntersecting;check();},{threshold:0}):null;
    if(box.current)io?.observe(box.current);document.addEventListener('visibilitychange',check);check();
    return()=>{io?.disconnect();document.removeEventListener('visibilitychange',check);};
  },[]);
  useEffect(()=>{
    setAct('');setBlink(false);if(mode!=='full'||paused)return;
    let alive=true,actTimer,blinkTimer,blinkEnd,last='';
    const ok=()=>alive&&seen.current&&!document.hidden&&lively();
    const nextAct=wait=>{actTimer=setTimeout(()=>{
      const ctx=latest.current.context;
      const pool=(ACTS[latest.current.pose]||[]).filter(a=>(a!=='roll'||ctx.surface==='floor')&&(a!=='tea-sip'||ctx.break)&&(a!=='beanie-adjust'||ctx.season==='winter'));
      if(ok()&&!eventRef.current&&pool.length){let a=pool[Math.floor(Math.random()*pool.length)];if(a===last)a=pool[(pool.indexOf(a)+1)%pool.length];last=a;animate(a);actTimer=setTimeout(()=>{setAct('');nextAct(4500+Math.random()*6000);},LASTS[a]);}
      else nextAct(5000);
    },wait);};
    const nextBlink=()=>{blinkTimer=setTimeout(()=>{if(ok()&&latest.current.pose!=='sleep'&&!eventRef.current?.motion){setBlink(true);blinkEnd=setTimeout(()=>setBlink(false),190);}nextBlink();},3300+Math.random()*3900);};
    nextAct(2500+Math.random()*3000);nextBlink();
    return()=>{alive=false;clearTimeout(actTimer);clearTimeout(blinkTimer);clearTimeout(blinkEnd);clearTimeout(motionEnd.current);};
  },[pose,mode,paused]);
  useEffect(()=>{
    if(mode!=='full'||paused)return;
    let timer;const check=()=>{const current=latest.current;if(Date.now()-lastTouch.current>=120000&&current.base==='idle'&&!eventRef.current&&seen.current&&!document.hidden){egg('neglected');}timer=setTimeout(check,60000);};
    timer=setTimeout(check,120000);return()=>clearTimeout(timer);
  },[mode,paused]);
  const minute=Math.floor((context.now||Date.now())/60000);
  useEffect(()=>{const p=trParts(context.now||Date.now());if(p.hour==='00'&&Number(p.minute)<5)egg('midnight');},[minute,mode,paused]);
  const wasTogether=useRef(false);
  useEffect(()=>{if(context.allHere&&!wasTogether.current)egg('all-here');wasTogether.current=!!context.allHere;},[context.allHere,mode,paused]);
  useEffect(()=>{
    const portal=()=>egg('portal');let wasOpen=false;
    const bodyChange=()=>{const open=document.body.classList.contains('bh-pulling')||document.body.classList.contains('bh-calm');if(open&&!wasOpen)portal();wasOpen=open;};
    const observer=new MutationObserver(bodyChange);observer.observe(document.body,{attributes:true,attributeFilter:['class']});
    const request=e=>{if(e.detail?.id&&e.detail.id!==latest.current.context.id)return;if(e.detail?.egg)egg(e.detail.egg,{manual:true,force:true});else if(e.detail?.blink&&lively()){setBlink(true);clearTimeout(wake.current);wake.current=setTimeout(()=>setBlink(false),190);}else if(e.detail?.wink&&lively()){show({pose:'sleep',text:null},1600);setWink(true);wake.current=setTimeout(()=>setWink(false),1400);}else if(e.detail?.act){clearTimeout(eventEnd.current);eventRef.current=null;setEvent(null);animate(e.detail.act);}};
    window.addEventListener('kutup:blackhole-open',portal);window.addEventListener('kutup:kara-test',request);
    return()=>{observer.disconnect();window.removeEventListener('kutup:blackhole-open',portal);window.removeEventListener('kutup:kara-test',request);};
  },[]);
  useEffect(()=>{
    if(!window.matchMedia?.('(hover: hover)').matches)return;
    const follow=e=>{if(!lively()||!seen.current||document.hidden)return;const svg=box.current?.querySelector('svg');if(!svg)return;const r=svg.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/300)),y=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height*.3)/300));svg.style.setProperty('--px',`${(x*2.4).toFixed(2)}px`);svg.style.setProperty('--py',`${(y*2).toFixed(2)}px`);svg.style.setProperty('--yaw-pointer',(x*.35).toFixed(3));};
    window.addEventListener('pointermove',follow,{passive:true});return()=>window.removeEventListener('pointermove',follow);
  },[]);
  const tap=()=>{
    lastTouch.current=Date.now();if(held.current){held.current=false;return;}
    const t=performance.now();taps.current=taps.current.filter(x=>t-x<2800);taps.current.push(t);
    if(taps.current.length>=7){taps.current=[];if(egg('seven-taps',{force:true}))return;}
    const current=latest.current,options=current.lines.length?current.lines:SLEEPY.map(text=>({text})),line=options[turn.current++%options.length],awake=current.base==='sleep'?'idle':current.base;
    if(current.base==='sleep'&&!eventRef.current){show({pose:'sleep',text:null},1000);setWink(true);wake.current=setTimeout(()=>{setWink(false);show({pose:awake,text:line.text,act:line.act});},650);return;}
    show({pose:line.pose||awake,text:line.text,act:line.act});
  };
  const press=e=>{
    if(e.button)return;lastTouch.current=Date.now();held.current=false;clearTimeout(hold.current);
    stroke.current={id:e.pointerId,x:e.clientX,y:e.clientY,dir:0,turns:0,distance:0,start:performance.now()};
    hold.current=setTimeout(()=>{held.current=true;if(lively())show({pose:'purr',motion:'knead',text:'Mırrr… Tam orası.'},LASTS.knead);else show({pose:'purr',text:'Mırrr… Tam orası.'},2600);},550);
  };
  const rub=e=>{const result=advanceKaraStroke(stroke.current,{id:e.pointerId,x:e.clientX,y:e.clientY},box.current?.getBoundingClientRect().width,performance.now());stroke.current=result.state;if(result.cancel)clearTimeout(hold.current);
    if(result.trigger){held.current=true;stroke.current=null;egg('strokes',{force:true});}
  };
  const release=()=>{clearTimeout(hold.current);stroke.current=null;};
  const winter=context.season==='winter',tea=!!context.break;
  return <div ref={box} className={`kara-spot ${className} ${paused?'kara-paused':''}`} style={style}>
    <button type="button" className="kara-button" aria-label="Kara: dokun, sana bir şey söylesin" onClick={tap} onPointerDown={press} onPointerMove={rub} onPointerUp={release} onPointerCancel={release} onPointerLeave={release} onContextMenu={e=>e.preventDefault()}>
      <KaraRig pose={pose} act={event?.motion||(event?'':act)} blink={blink} wink={wink} className={`${winter?'kara-winter':''} ${tea?'kara-tea':''}`}/>
    </button>
    {event?.text&&<p className="kara-say" key={event.text} role="status"><span>{event.text}</span>{event.act&&<button type="button" onClick={()=>{eventRef.current=null;setEvent(null);event.act[1]();}}>{event.act[0]} →</button>}</p>}
  </div>;
}

export function KaraHome({me,data,now,unread,navigate,arrived,style}){
  const others=data.members.filter(x=>x.id!==me?.id),anyoneHere=data.members.some(x=>x.status==='here'||x.status==='break'),anyoneComing=others.some(x=>x.status==='coming'),focusing=me?.focusEnd>now;
  const base=focusing?(me.focusStrict?'build':'read'):anyoneHere?'idle':anyoneComing?'watch':'sleep';
  const [cue,setCue]=useState(null);
  useEffect(()=>{if(!arrived.length)return;const who=data.members.filter(x=>arrived.includes(x.id)),friend=who.find(x=>x.id!==me?.id);if(friend)setCue({key:`in-${friend.id}-${Date.now()}`,pose:'greet',text:`${firstName(friend)} geldi!${friend.desk?` ${friend.desk} numaralı masada.`:''}`});else if(who.length)setCue({key:`in-me-${Date.now()}`,pose:'greet',text:'Hoş geldin! Masan hazır, kitaplar dizildi.'});},[arrived.join(',')]);
  const coming=others.filter(x=>x.status==='coming'),wasComing=useRef(null);
  useEffect(()=>{const before=wasComing.current;wasComing.current=new Set(coming.map(x=>x.id));const fresh=before&&coming.find(x=>!before.has(x.id));if(fresh)setCue({key:`go-${fresh.id}-${Date.now()}`,pose:'watch',text:`${firstName(fresh)} yola çıktı${fresh.arrival?`, ${fresh.arrival.toLocaleLowerCase('tr')} burada`:''}. Gözüm patikada.`});},[coming.map(x=>x.id).join(',')]);
  const last=data.messages.filter(x=>x.kind!=='system').at(-1),seen=useRef(undefined);
  useEffect(()=>{const before=seen.current;seen.current=last?.id??null;if(before===undefined||!last||before===last.id||last.memberId===me?.id)return;const author=data.members.find(x=>x.id===last.memberId),text=last.text.length>46?`${last.text.slice(0,44)}…`:last.text;setCue({key:`msg-${last.id}`,pose:'note',ms:6500,text:`${firstName(author)} Pano'ya yazdı: “${text}”`,act:['Oku',()=>navigate('board')]});},[last?.id]);
  const lines=useMemo(()=>sayings({me,data,now,unread,navigate}),[me,data,Math.floor(now/60000),unread]);
  return <KaraSpot className="kara-home" style={style} base={base} lines={lines} cue={cue} context={{id:'home',groupId:data.group?.id,now,season:seasonAt(now),break:me?.status==='break',allHere:data.members.length>=2&&data.members.every(x=>x.status==='here'||x.status==='break'),surface:'roof'}}/>;
}
export function KaraBuddy({me,now,item,outcome}){
  const running=me?.focusEnd>now,paused=running&&!!me.focusPausedAt,building=running&&!!me.focusStrict,left=running?Math.max(1,Math.ceil((me.focusEnd-(me.focusPausedAt||now))/60000)):0;
  const base=paused?'sleep':building?'build':running?'read':'idle',name=item?.name||'Bina';
  const lines=paused?[{text:'Çay molası. Ben bir kestireyim, iskele beklesin.'}]:building?[{text:`Kalfa Kara görevde. ${name} yükseliyor, ${left} dk kaldı.`},{text:'Telefonu bırakma, işçiler seni izliyor. Ben de.'}]:running?[{text:`Sen odaktasın, ben de sayfamdayım. ${left} dk kaldı.`},{text:'Bir sayfa daha. Sonra çay konusunu konuşuruz.'}]:[{text:'Ben hazırım. Sen süreni seç, ben kitabımı.'},{text:'Bina seçersen baretimi takarım.'}];
  const cue=useMemo(()=>{if(!outcome||Date.now()-outcome.at>8000)return null;return outcome.type==='built'?{key:`b-${outcome.at}`,pose:'cheer',ms:5600,text:'Bitti! Köyde yerini aldı. Patiler havaya!'}:outcome.type==='collapsed'?{key:`c-${outcome.at}`,pose:'sad',ms:5200,text:'İnşaat çöktü… Kulaklarım düştü. Bir dahakine beraber bitiririz.'}:null;},[outcome?.at]);
  return <KaraSpot className="kara-buddy" base={base} lines={lines} cue={cue} context={{id:'buddy',now,season:seasonAt(now),break:paused||me?.status==='break',surface:'ledge'}}/>;
}
