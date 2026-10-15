import React, { useEffect, useRef, useState } from "react";

// CSS owns the rig; pointer movement only updates two bounded custom properties.
export function LiveMascot({ pose = "hello", size = 250, interactive = false, onReact }) {
  const ref = useRef(null);
  const timers = useRef([]);
  const hold = useRef(null);
  const taps = useRef({ time: 0, count: 0 });
  const held = useRef(false);
  const [reaction, setReaction] = useState("");
  const [waking, setWaking] = useState(false);
  const lastPose = useRef(pose);
  const later = (fn, delay) => { const id = setTimeout(fn, delay); timers.current.push(id); return id; };
  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(hold.current); }, []);
  useEffect(() => {
    if (lastPose.current === "sleep" && pose !== "sleep") {
      setWaking(true);
      const id = setTimeout(() => setWaking(false), 1100);
      lastPose.current = pose;
      return () => clearTimeout(id);
    }
    lastPose.current = pose;
    setWaking(false);
  }, [pose]);
  useEffect(() => {
    const el = ref.current;
    let visible = true;
    const pause = () => el.dataset.paused = String(!visible || document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; pause(); });
    observer.observe(el);
    document.addEventListener("visibilitychange", pause);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", pause); };
  }, []);
  useEffect(() => {
    if (!interactive) return;
    const el = ref.current;
    const follow = (e) => {
      if (el.dataset.paused === "true" || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const r = el.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / r.width));
      const y = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / r.height));
      el.style.setProperty('--look-x', `${x * 5}px`);
      el.style.setProperty('--look-y', `${y * 3}px`);
      el.style.setProperty('--head-turn', `${x * 5}deg`);
    };
    window.addEventListener('pointermove', follow, { passive: true });
    return () => window.removeEventListener('pointermove', follow);
  }, [interactive]);
  const react = (kind) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setReaction(kind);
    onReact?.(kind);
    later(() => setReaction(""), kind === 'purr' ? 2300 : 1700);
  };
  const click = () => {
    if (held.current) { held.current = false; return; }
    const t = Date.now();
    taps.current.count = t - taps.current.time < 1800 ? taps.current.count + 1 : 1;
    taps.current.time = t;
    react(taps.current.count >= 3 ? 'sass' : 'wave');
  };
  const cancelHold = () => clearTimeout(hold.current);
  const Shell = interactive ? 'button' : 'span';
  return <Shell ref={ref} className="cat-rig" style={{ width: size }} data-pose={pose} data-reaction={reaction} data-waking={waking}
    {...(interactive ? { type: 'button', 'aria-label': 'Kara’ya selam ver', onClick: click,
      onPointerDown: (e) => { if (e.button !== 0) return; held.current = false; cancelHold(); hold.current = setTimeout(() => { held.current = true; react('purr'); }, 550); },
      onPointerUp: cancelHold, onPointerCancel: cancelHold, onPointerLeave: cancelHold, onBlur: cancelHold,
      onContextMenu: (e) => e.preventDefault() } : {})}>
    <svg viewBox="0 0 300 280" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="150" cy="253" rx="95" ry="10" fill="var(--accent)" opacity=".12" />
      <g className="cat-tail"><path d="M193 228C248 253 280 210 260 183C248 168 230 183 243 194C254 207 235 226 204 210" fill="#34333d" stroke="#25242d" strokeWidth="4"/><path d="M260 183C248 168 230 183 243 194L259 204Q267 194 260 183" fill="#48434d"/></g>
      <g className="cat-body"><path d="M111 157Q87 183 88 229Q84 249 112 250H195Q221 247 207 222L191 159Z" fill="#34333d" stroke="#25242d" strokeWidth="4"/>
        <path d="M128 160Q113 183 121 215L150 236L181 215Q188 185 174 161" fill="#48434d"/>
        <path d="M106 227Q83 234 93 248Q108 258 134 247L133 230M177 230L176 248Q207 256 211 244Q213 230 193 228" fill="#48434d" stroke="#25242d" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M104 239V247M115 239V248M189 239V249M199 238V246" stroke="#6c626d" strokeWidth="2" strokeLinecap="round"/>
      </g>
      <g className="cat-head-tilt"><g className="cat-head">
        <g className="cat-ear left"><path d="M91 103Q67 69 79 34Q104 38 124 70" fill="#34333d" stroke="#25242d" strokeWidth="4" strokeLinejoin="round"/><path d="M88 51L94 86L111 72Z" fill="#8c697b"/></g>
        <g className="cat-ear right"><path d="M177 71Q199 36 225 38Q233 72 211 103" fill="#34333d" stroke="#25242d" strokeWidth="4" strokeLinejoin="round"/><path d="M214 53L194 75L213 86Z" fill="#8c697b"/></g>
        <path d="M84 105Q82 72 124 67L139 58L147 67L158 58L164 67Q216 65 219 108L226 123L216 128Q213 165 154 173Q96 170 85 140L74 133L83 124L77 116Z" fill="#34333d" stroke="#25242d" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M150 79Q147 108 129 123Q110 119 100 135Q106 158 151 163Q196 158 202 137Q193 119 174 125Q158 108 150 79Z" fill="#48434d"/>
        <g className="cat-eyes">
          <ellipse cx="119" cy="112" rx="19" ry="22" fill="#d6ad59"/><ellipse cx="183" cy="112" rx="19" ry="22" fill="#d6ad59"/>
          <g className="cat-pupils"><ellipse cx="122" cy="115" rx="9" ry="14" fill="#b28339"/><ellipse cx="180" cy="115" rx="9" ry="14" fill="#b28339"/><ellipse cx="124" cy="115" rx="5" ry="12" fill="#25242d"/><ellipse cx="178" cy="115" rx="5" ry="12" fill="#25242d"/><circle cx="126" cy="110" r="3" fill="white"/><circle cx="180" cy="110" r="3" fill="white"/></g>
        </g>
        <g className="cat-closed" stroke="#25242d" strokeWidth="3.5" strokeLinecap="round"><path d="M107 115Q119 124 131 114M171 114Q183 124 195 114"/></g>
        <g className="cat-glasses" stroke="#bda57f" strokeWidth="3.5"><circle cx="119" cy="113" r="25"/><circle cx="183" cy="113" r="25"/><path d="M144 110Q151 105 158 110M94 108L85 103M208 108L218 103"/><path d="M103 101L110 95M167 101L174 95" stroke="#fff5e3" strokeWidth="2"/></g>
        <path d="M144 137Q151 133 158 137L151 144Z" fill="#24212a"/>
        <path d="M151 144V148M151 148Q141 156 135 149M151 148Q161 156 168 147" stroke="#25242d" strokeWidth="2.5" strokeLinecap="round"/>
        <g stroke="#82796e" strokeWidth="1.5" strokeLinecap="round"><path d="M109 140L72 134M108 147L75 151M192 140L230 134M194 147L227 153"/></g>
      </g></g>
      <g className="cat-scarf">
        <path d="M109 159Q148 181 191 157L193 174Q150 193 108 175Q105 167 109 159Z" fill="var(--accent)" stroke="#25242d" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M110 169Q145 187 189 167L192 175Q150 194 110 178Z" fill="var(--accent-deep)" />
        <path d="M114 161Q143 177 174 167" stroke="var(--accent-soft)" strokeWidth="2" strokeLinecap="round" opacity=".65" />
        <g className="cat-scarf-back">
          <path d="M177 176C173 188 171 201 174 214Q182 218 190 214C185 200 192 189 189 178Z" fill="var(--accent-deep)" stroke="#25242d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M177 214L177 219M182 215V220M187 214L188 218" stroke="var(--accent-deep)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g className="cat-scarf-end">
          <path d="M183 176C197 181 190 195 199 207Q196 216 185 218C173 202 183 189 176 181Z" fill="var(--accent)" stroke="#25242d" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M184 183C189 193 182 199 190 210" stroke="var(--accent-soft)" strokeWidth="2" strokeLinecap="round" opacity=".55" />
          <path d="M184 210Q191 211 196 207" stroke="var(--accent-deep)" strokeWidth="1.5" />
          <path d="M185 217L187 222M190 216L192 221M195 213L198 217" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <path d="M176 166Q185 161 192 168L189 180Q182 185 175 178Q173 172 176 166Z" fill="var(--accent)" stroke="#25242d" strokeWidth="2" />
        <path d="M179 169Q183 171 186 169M178 176L184 178" stroke="var(--accent-deep)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g className="cat-book"><path d="M102 210Q128 202 151 215Q177 201 202 209L195 242Q171 237 151 247Q130 237 107 241Z" fill="var(--accent)" stroke="#25242d" strokeWidth="3"/><path d="M108 205Q130 201 151 213Q173 200 195 204L190 234Q170 232 151 241Q133 231 113 235Z" fill="#fff5e3" stroke="#25242d" strokeWidth="2"/><path d="M151 213V241M118 214L139 218M119 222L138 226M163 218L185 212M163 226L183 220" stroke="#b6a58a" strokeWidth="2"/><path className="cat-page" d="M151 213Q170 199 190 201L187 230Q170 229 151 241Z" fill="#f2e5cb" stroke="#b6a58a" strokeWidth="1.5"/></g>
      <g className="cat-paw"><path d="M103 183Q82 175 76 154Q69 142 60 151Q48 170 66 195Q79 214 108 207" fill="#34333d" stroke="#25242d" strokeWidth="4" strokeLinecap="round"/><path d="M61 151Q48 165 61 182Q69 182 71 175Q80 178 80 170L76 154Q70 141 61 151" fill="#34333d"/><ellipse cx="66" cy="162" rx="6" ry="7" fill="#8c697b"/><circle cx="60" cy="153" r="2.5" fill="#8c697b"/><circle cx="69" cy="150" r="2.5" fill="#8c697b"/></g>
      <g className="cat-zzz" fill="var(--accent)" fontFamily="monospace" fontWeight="bold"><text x="223" y="90" fontSize="18">z</text><text x="243" y="69" fontSize="25">z</text></g>
      <g className="cat-hearts" fill="var(--accent)"><path d="M65 107C48 95 60 83 65 92C72 80 85 95 65 107Z"/><path d="M228 109C215 98 225 89 230 96C238 88 247 100 228 109Z"/></g>
    </svg>
  </Shell>;
}
