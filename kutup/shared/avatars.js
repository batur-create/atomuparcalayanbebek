// Kütüp's own avatars, drawn in Kara's language (server + client): a dark outline,
// calm colors, one lighter tone for the lit face, no blush, no sticker edge.
// A character avatar is stored as "k:<id>" plus "+<accessory>" items in ACCESSORIES
// order, e.g. "k:tekir+gozluk+atki". Emoji avatars are stored as before.
// The same markup is drawn inline in the page and, as an image, in the village canvas.

const K = "#25242d";
const r1 = (v) => Math.round(v * 10) / 10;

// ---------- pen ----------
const p = (d, fill, w = 2.4) => `<path d="${d}" fill="${fill}" stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const flat = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
const line = (d, color = K, w = 2.2) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ell = (cx, cy, rx, ry, fill, extra = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${extra}/>`;
const circ = (cx, cy, r, fill, w = 2.2) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${K}" stroke-width="${w}"/>`;
// Kara's own paths (LiveMascot, 300 box) mapped into the 100 avatar box.
function kara(path, s = 0.4, ox = 150, oy = 112, nx = 50, ny = 52) {
  let cmd = "", i = 0;
  return path
    .replace(/([MLQCHVZ])|(-?\d*\.?\d+)/g, (m, c, n) => {
      if (c) { cmd = c; i = 0; return c; }
      const v = +n, x = cmd === "H" || (cmd !== "V" && i % 2 === 0);
      i++;
      return r1(x ? (v - ox) * s + nx : (v - oy) * s + ny);
    })
    .replace(/(\d)(-)/g, "$1 $2");
}

// ---------- cats: Kara's head in other coats ----------
const CAT = {
  earL: kara("M91 103Q67 69 79 34Q104 38 124 70"), innerL: kara("M88 51L94 86L111 72Z"),
  earR: kara("M177 71Q199 36 225 38Q233 72 211 103"), innerR: kara("M214 53L194 75L213 86Z"),
  head: kara("M84 105Q82 72 124 67L139 58L147 67L158 58L164 67Q216 65 219 108L226 123L216 128Q213 165 154 173Q96 170 85 140L74 133L83 124L77 116Z"),
  facet: kara("M150 79Q147 108 129 123Q110 119 100 135Q106 158 151 163Q196 158 202 137Q193 119 174 125Q158 108 150 79Z"),
  nose: kara("M144 137Q151 133 158 137L151 144Z"),
  mouth: kara("M151 144V148M151 148Q141 156 135 149M151 148Q161 156 168 147"),
  whiskers: kara("M109 140L72 134M108 147L75 151M192 140L230 134M194 147L227 153"),
};
function cat({ fur, facet, ear = fur, inner = "#a8848c", eyes: [eL, iL, eR = eL, iR = iL], chest = facet, whisker = "#8a8176", marks = "", earMarks = "" }) {
  return (
    p("M15 101 C17 86 27 77 36 74 L40 78 L44 74 L50 79 L56 74 L60 78 L64 74 C73 77 83 86 85 101 Z", fur) +
    flat("M40 80 L44 76 L50 81 L56 76 L60 80 Q63 92 58 101 L42 101 Q37 92 40 80 Z", chest) +
    p(CAT.earL, ear) + flat(CAT.innerL, inner) + p(CAT.earR, ear) + flat(CAT.innerR, inner) + earMarks +
    p(CAT.head, fur) + flat(CAT.facet, facet) + marks + p(CAT.head, "none") +
    ell(37.6, 52, 7.4, 8.6, eL) + ell(62.4, 52, 7.4, 8.6, eR) +
    ell(38.8, 53.2, 3.6, 5.6, iL) + ell(61.2, 53.2, 3.6, 5.6, iR) +
    ell(39.6, 53.2, 1.9, 4.8, K) + ell(60.4, 53.2, 1.9, 4.8, K) +
    `<circle cx="36" cy="49" r="1.3" fill="#fff" opacity=".8"/><circle cx="59" cy="49" r="1.3" fill="#fff" opacity=".8"/>` +
    flat(CAT.nose, "#24212a") + line(CAT.mouth, K, 1.6) + line(CAT.whiskers, whisker, 1)
  );
}
const AMBER = ["#d6ad59", "#b28339"], BLUE = ["#9cc0dc", "#6d97ba"], GREEN = ["#a9b86a", "#7d8c45"], COPPER = ["#d39a5a", "#a8692f"];
const tabby = (c) => line("M41 35 L44 42 M50 32 L50 41 M59 35 L56 42 M21 50 L28 51.5 M22 56.5 L28.5 55.5 M79 50 L72 51.5 M78 56.5 L71.5 55.5", c, 2.2);

// ---------- people ----------
const HEAD = "M28 44 Q28 23 50 22 Q72 23 72 44 L71 57 Q68 73 50 75 Q32 73 29 57 Z";
const HAIR = {
  short: "M27 45 Q24 22 45 19 L49 14 L53 19 Q76 20 73 45 Q70 34 61 32 Q50 30 41 33 Q32 36 27 45 Z",
  long: "M28 45 Q27 21 50 20 Q73 21 72 45 Q65 34 55 33 Q45 35 38 30 Q35 38 28 45 Z",
  longBack: "M24 44 Q22 17 50 16 Q78 17 76 44 L78 82 Q66 85 58 78 L42 78 Q34 85 22 82 Z",
  messy: "M26 46 Q20 34 28 26 Q31 17 42 19 Q47 13 55 18 Q64 14 69 22 Q79 27 75 46 Q71 37 64 37 Q60 31 53 34 Q47 30 42 35 Q35 33 32 39 Q28 40 26 46 Z",
  curly: "M26 47 Q19 40 25 33 Q22 23 32 21 Q36 13 45 17 Q51 11 57 17 Q66 13 69 21 Q79 23 76 33 Q81 41 74 47 Q71 38 63 37 Q57 33 50 35 Q43 32 37 37 Q29 38 26 47 Z",
  gray: "M28 42 Q29 25 50 24 Q71 25 72 42 Q66 33 50 32 Q34 33 28 42 Z",
};
function person({ skin, facet, hair, cut, back = "", neck = true }) {
  return (back ? p(back, hair) : "") +
    p("M27 47 Q21 47 22 54 Q23 60 29 59 Z", skin, 2.2) + p("M73 47 Q79 47 78 54 Q77 60 71 59 Z", skin, 2.2) +
    (neck ? p("M43 68 L43 80 L57 80 L57 68 Z", skin) : "") +
    p(HEAD, skin) + flat("M50 30 Q48 45 39 53 Q36 63 50 70 Q64 63 61 53 Q52 45 50 30 Z", facet) +
    (cut ? p(cut, hair) : "");
}
function face(y = 49, { brow = K, eyes = "open", mouth = "smile" } = {}) {
  const look = eyes === "closed"
    ? line(`M36.5 ${y} Q40 ${y + 3} 43.5 ${y} M56.5 ${y} Q60 ${y + 3} 63.5 ${y}`, K, 2)
    : ell(40, y, 2.5, 3.2, K) + ell(60, y, 2.5, 3.2, K) + `<circle cx="40.9" cy="${y - 1.2}" r=".9" fill="#fff"/><circle cx="60.9" cy="${y - 1.2}" r=".9" fill="#fff"/>`;
  const m = { smile: `M45 ${y + 15} Q50 ${y + 18.5} 55 ${y + 15}`, small: `M46.5 ${y + 15.5} Q50 ${y + 17.5} 53.5 ${y + 15.5}`, open: "", grin: `M43.5 ${y + 14.5} Q50 ${y + 20} 56.5 ${y + 14.5}` }[mouth];
  return line(`M34.5 ${y - 7} L44 ${y - 8}`, brow, 2.8) + line(`M56 ${y - 8} L65.5 ${y - 7}`, brow, 2.8) + look +
    line(`M49 ${y + 3} L47.6 ${y + 10} L51 ${y + 10.4}`, "#8a6450", 1.8) +
    (mouth === "open" ? ell(50, y + 16, 2.2, 1.8, K) : line(m, K, 1.9));
}
const mustache = (y, c) => p(`M37 ${y} Q43 ${y - 5.5} 50 ${y - 2.5} Q57 ${y - 5.5} 63 ${y} Q57 ${y + 3.5} 50 ${y + 1.5} Q43 ${y + 3.5} 37 ${y} Z`, c, 1.8);
const coat = (fill, shade, v = "") => p("M13 101 C15 87 27 79 43 78 L50 86 L57 78 C73 79 85 87 87 101 Z", fill) +
  flat("M20 101 C21 92 27 86 36 83 L40 101 Z", shade) + v;
const halfGlasses = (y) => line(`M33.5 ${y} L46 ${y} Q46 ${y + 5} 40 ${y + 5} Q34 ${y + 5} 33.5 ${y} Z M54 ${y} L66.5 ${y} Q66 ${y + 5} 60 ${y + 5} Q54 ${y + 5} 54 ${y} Z M46 ${y} Q50 ${y - 2} 54 ${y}`, "#bda57f", 1.8);
const roundGlasses = (y, c = "#4a4552") => line(`M32.6 ${y} A7.4 7.4 0 1 0 47.4 ${y} A7.4 7.4 0 1 0 32.6 ${y} M52.6 ${y} A7.4 7.4 0 1 0 67.4 ${y} A7.4 7.4 0 1 0 52.6 ${y} M47.4 ${y - 1} Q50 ${y - 3} 52.6 ${y - 1}`, c, 2);
const hardHat = (fill, light, rim, mark = "") =>
  p("M23 42 Q23 16 50 15 Q77 16 77 42 Z", fill) + flat("M33 39 Q33 23 47 19 Q39 27 39 39 Z", light) + mark +
  p("M16 42 Q50 36.5 84 42 Q84 47 50 46.5 Q16 47 16 42 Z", rim);

// a: anchors for accessories — top of the head, eye line, half eye gap, eye size,
// chin (scarf line), half head width. hat: wears its own headgear; glasses: its own glasses.
const CAT_A = { top: 30, eyeY: 52, eyeDx: 12.4, eyeR: 5.4, chin: 75, w: 30 };
const A = { top: 21, eyeY: 49, eyeDx: 10, eyeR: 4.6, chin: 76, w: 23 };
const CAST = [
  // -- cats --
  { id: "ankara", name: "Ankara kedisi", emoji: "🐈", group: "kedi", a: CAT_A, art: () =>
    cat({ fur: "#ebe5dc", facet: "#f7f3ed", inner: "#c9a2a6", whisker: "#a39a8f", eyes: [...BLUE, ...AMBER] }) },
  { id: "van", name: "Van kedisi", emoji: "🐈", group: "kedi", a: CAT_A, art: () =>
    cat({ fur: "#ece6dd", facet: "#f7f3ed", ear: "#c98a5a", inner: "#e2b48a", whisker: "#a39a8f", eyes: [...AMBER, ...BLUE],
      marks: flat("M21 47 Q20 35 34 32 L44 28 L45 40 Q35 40 27 49 Z", "#c98a5a") + flat("M79 47 Q80 35 66 32 L56 28 L55 40 Q65 40 73 49 Z", "#c98a5a") }) },
  { id: "tekir", name: "Tekir", emoji: "🐈", group: "kedi", a: CAT_A, art: () =>
    cat({ fur: "#9a9184", facet: "#b5ad9f", inner: "#b08c84", eyes: GREEN, marks: tabby("#665e53") }) },
  { id: "sarman", name: "Sarman", emoji: "🐈", group: "kedi", a: CAT_A, art: () =>
    cat({ fur: "#d8955a", facet: "#eab386", inner: "#c98a72", eyes: ["#cdb85c", "#9c8a33"], marks: tabby("#b06d38") }) },
  { id: "smokin", name: "Smokin", emoji: "🐈‍⬛", group: "kedi", a: CAT_A, art: () =>
    cat({ fur: "#34333d", facet: "#f2eee6", chest: "#f2eee6", inner: "#8c697b", whisker: "#b9b1a6", eyes: GREEN }) },
  { id: "ucrenkli", name: "Üç renkli", emoji: "🐈", group: "kedi", a: CAT_A, art: () =>
    cat({ fur: "#efe9e0", facet: "#f8f4ee", inner: "#c9a2a6", whisker: "#a39a8f", eyes: AMBER,
      earMarks: flat(CAT.earL, "#d48c50") + flat(CAT.innerL, "#c9a2a6") + p(CAT.earL, "none") + flat(CAT.earR, "#3a3840") + flat(CAT.innerR, "#6e5a62") + p(CAT.earR, "none"),
      marks: flat("M21 48 Q20 35 33 32 L41 29 Q43 38 38 43 Q30 44 24 51 Z", "#d48c50") + flat("M79 46 Q80 35 67 32 L58 29 Q56 37 61 41 Q70 42 76 48 Z", "#3a3840") }) },
  { id: "fume", name: "Füme", emoji: "🐈", group: "kedi", a: CAT_A, art: () =>
    cat({ fur: "#6d6b78", facet: "#878593", inner: "#9d7f8a", whisker: "#b0aaa2", eyes: COPPER }) },
  { id: "siyam", name: "Siyam", emoji: "🐈", group: "kedi", a: CAT_A, art: () =>
    cat({ fur: "#e8dcc6", facet: "#f2e9d8", ear: "#5a4538", inner: "#8a6a5a", eyes: BLUE,
      marks: flat("M50 46 Q38 48 33 58 Q37 70 50 72 Q63 70 67 58 Q62 48 50 46 Z", "#6a5242") }) },
  // -- library --
  { id: "kutuphaneci", name: "Kütüphaneci", emoji: "📚", group: "kutup", a: { ...A, top: 18 }, art: () =>
    line("M36 10 L63 22", K, 6.4) + line("M36 10 L63 22", "#d8ad46", 3.4) +
    circ(50, 17, 8.5, "#5a3c32", 2.4) +
    coat("#7d6f9a", "#8a7ca8", p("M43 78 L50 86 L57 78 Z", "#efe8dc", 2) + line("M41 79 Q50 93 59 79", "#bda57f", 1.4)) +
    person({ skin: "#e2b08c", facet: "#ecc3a2", hair: "#5a3c32", cut: HAIR.long }) + face(49) + halfGlasses(52) },
  { id: "kitapkurdu", name: "Kitap kurdu", emoji: "🤓", group: "kutup", glasses: true, a: A, art: () =>
    coat("#5e7f72", "#6c8e80") + person({ skin: "#d9a07a", facet: "#e6b38f", hair: "#2f2a2e", cut: HAIR.curly }) + face(50, { mouth: "small" }) + roundGlasses(50) +
    p("M24 101 L25 91 L57 90 L58 101 Z", "#b0502b", 2) + p("M28 91 L29 83 L61 82 L61 90 Z", "#4f7f8f", 2) + p("M22 83 L25 75 L53 76 L52 83 Z", "#d8ad46", 2) +
    line("M30 96 L52 95.5 M33 86.5 L56 86 M28 79.5 L48 80", "#efe8dc", 1.4) },
  { id: "uykucu", name: "Uykucu", emoji: "😴", group: "kutup", a: A, art: () =>
    coat("#8a9bb8", "#97a8c4", line("M44 80 L44 90 M56 80 L56 90", "#efe8dc", 1.8)) +
    person({ skin: "#c99572", facet: "#d8a986", hair: "#4a3a44", cut: HAIR.messy }) + face(50, { eyes: "closed", mouth: "open" }) +
    line("M72 15 L78 15 L72 22 L78 22", "#7d6fb0", 2.2) + line("M82 6 L86.5 6 L82 11 L86.5 11", "#7d6fb0", 1.8) },
  { id: "gecekusu", name: "Gece kuşu", emoji: "🦉", group: "kutup", a: { top: 22, eyeY: 48, eyeDx: 12, eyeR: 5.2, chin: 74, w: 28 }, art: () =>
    p("M17 101 C14 80 18 60 22 40 Q24 22 50 21 Q76 22 78 40 C82 60 86 80 83 101 Z", "#8a6b4f") +
    flat("M33 66 Q50 58 67 66 Q70 86 64 101 L36 101 Q30 86 33 66 Z", "#a98a6a") +
    line("M40 76 L42 78 M50 72 L52 74 M58 78 L60 80 M44 88 L46 90 M56 90 L58 92", "#efe6d6", 2) +
    flat("M24 37 L27 33 M31 29 L34 26", "none") + line("M27 34 L29 33 M34 28.5 L36 28 M64 28 L66 28.5 M71 33 L73 34", "#efe6d6", 2) +
    p("M26 46 Q30 35 49 41 Q30 40 26 46 Z", "#efe6d6", 1.6) + p("M74 46 Q70 35 51 41 Q70 40 74 46 Z", "#efe6d6", 1.6) +
    circ(38, 49, 8.8, "#e0be52") + circ(62, 49, 8.8, "#e0be52") + ell(38, 49.5, 4.6, 4.6, K) + ell(62, 49.5, 4.6, 4.6, K) +
    `<circle cx="36.3" cy="47.6" r="1.4" fill="#fff"/><circle cx="60.3" cy="47.6" r="1.4" fill="#fff"/>` +
    p("M46.5 56 L53.5 56 L50 63 Z", "#c9b08a", 1.8) },
  { id: "guvenlik", name: "Güvenlik", emoji: "💂", group: "kutup", hat: true, a: { ...A, top: 18 }, art: () =>
    coat("#3e4a63", "#4a5772", p("M43 78 L50 86 L57 78 Z", "#d9dde4", 2) + p("M64 86 L71 85 L71.5 92 L67.5 95 L64 92 Z", "#d8ad46", 1.6)) +
    person({ skin: "#b98361", facet: "#c8956f", hair: "#2f2a2e", cut: "" }) + face(51) +
    p("M26 34 Q26 18 50 16 Q74 18 74 34 L73 39 L27 39 Z", "#3e4a63") + flat("M30 30 Q34 21 50 20 Q40 24 37 31 Z", "#4c5a77") +
    p("M25 39 L75 39 L75 43 L25 43 Z", "#2f3547", 2) + p("M30 43 Q50 41.5 70 43 Q69 49 50 48 Q31 49 30 43 Z", "#25242d", 2) +
    circ(50, 30, 3.4, "#d8ad46", 1.6) },
  { id: "simitci", name: "Simitçi", emoji: "🥯", group: "kutup", hat: true, a: { ...A, top: 12 }, art: () =>
    coat("#8a5a3c", "#996a4a", p("M43 78 L50 86 L57 78 Z", "#efe8dc", 2)) +
    person({ skin: "#d0996f", facet: "#ddad86", hair: "#3a3138", cut: HAIR.short }) + face(50, { mouth: "grin" }) +
    p("M14 19 Q50 13 86 19 L84 23 Q50 18 16 23 Z", "#a9a39a", 2) +
    [24, 39, 54, 69].map((x) => circ(x + 3.5, 14.5, 5.6, "#c68a4a", 2) + circ(x + 3.5, 14.5, 2.1, "#e7d7bd", 1.4)).join("") +
    `<g fill="#f3e6c8">${[24, 39, 54, 69].map((x) => `<circle cx="${x + 1}" cy="12" r=".7"/><circle cx="${x + 6}" cy="13" r=".7"/><circle cx="${x + 3}" cy="18.6" r=".7"/>`).join("")}</g>` },
  { id: "cayci", name: "Çaycı", emoji: "🍵", group: "kutup", a: A, art: () =>
    p("M13 101 C15 87 27 79 43 78 L50 90 L57 78 C73 79 85 87 87 101 Z", "#3d3a46") + flat("M20 101 C21 92 27 86 36 83 L40 101 Z", "#4a4655") +
    p("M43 78 L50 90 L57 78 Z", "#efe8dc", 2) +
    person({ skin: "#d6a37c", facet: "#e3b892", hair: "#3a3138", cut: HAIR.short }) + face(49) + mustache(64, "#3a3138") +
    line("M70 70 Q67.5 66.5 70 63 Q72.5 59.5 70 56", "#8f8796", 1.6) +
    p("M60 98 Q60 101.5 71 101.5 Q82 101.5 82 98 Q82 95 71 95 Q60 95 60 98 Z", "#e8e1d4", 2) +
    p("M65 75 Q63.5 82 67 86.5 Q64 90 66.5 96 L75.5 96 Q78 90 75 86.5 Q78.5 82 77 75 Z", "#f3eee6", 2) +
    flat("M65.6 79 Q64.8 83 67.6 86.6 Q65 90 67.4 95 L74.6 95 Q77 90 74.4 86.6 Q77.2 83 76.4 79 Z", "#b0502b") +
    flat("M66.5 80 Q66 83 68 85.5 L69 85.5 Q67.5 83 68 80 Z", "#d9784f") },
  // -- village workshops --
  { id: "usta", name: "Baretli usta", emoji: "👷", group: "koy", hat: true, a: { ...A, top: 15 }, art: () =>
    p("M13 101 C15 87 27 79 43 78 L57 78 C73 79 85 87 87 101 Z", "#c97a42") +
    flat("M17 93 C30 89 70 89 83 93 L84.5 98 C70 94 30 94 15.5 98 Z", "#ece2c9") + p("M43 78 L50 86 L57 78 Z", "#5f6f86", 2) +
    person({ skin: "#c48c63", facet: "#d39f78" }) + flat("M31 58 Q34 72 50 74 Q66 72 69 58 Q61 65 50 65 Q39 65 31 58 Z", "#ad7a55") +
    face(51, { mouth: "smile" }) + hardHat("#d8ad46", "#e8c565", "#c49634", line("M50 15.5 L50 41", "#b38a2c", 2.2)) },
  { id: "mimar", name: "Mimar", emoji: "📐", group: "koy", a: A, art: () =>
    coat("#3d3a46", "#4a4655", p("M42 77 Q50 81 58 77 L57 84 Q50 87 43 84 Z", "#4a4655", 2)) +
    person({ skin: "#e6b896", facet: "#efc9aa", hair: "#6b4a3a", cut: HAIR.long, back: HAIR.longBack }) + face(49) +
    line("M67 32 L76 23", K, 4.6) + line("M67 32 L76 23", "#d8ad46", 2.4) +
    `<g transform="rotate(-24 70 90)">` + p("M52 84 L88 84 L88 96 L52 96 Z", "#9cc0dc", 2) + p("M84 84 Q80 90 84 96 Q92 96 92 90 Q92 84 84 84 Z", "#c3d9eb", 2) +
    line("M58 88 L80 88 M58 92 L74 92", "#6d97ba", 1.4) + `</g>` },
  { id: "firinci", name: "Fırıncı", emoji: "🍞", group: "koy", hat: true, a: { ...A, top: 10 }, art: () =>
    coat("#efe8dc", "#f7f2ea", line("M50 86 L50 101", "#d6cfc0", 1.6) + circ(50, 92, 1.4, "#d6cfc0", 1)) +
    person({ skin: "#d49b72", facet: "#e1ae88", hair: "#3a3138", cut: "" }) + face(51) + mustache(65, "#3a3138") +
    flat("M33 60 L36 59", "none") + ell(66, 64, 3.2, 2, "#f5efe4", ' opacity=".9"') +
    p("M28 36 Q22 26 30 19 Q34 8 44 12 Q50 4 57 12 Q67 8 70 19 Q78 26 72 36 Z", "#f7f3ec") +
    p("M28 33 L72 33 L72 41 L28 41 Z", "#ece5d8", 2) + line("M42 16 Q44 24 43 32 M57 16 Q55 24 56 32", "#d6cfc0", 1.6) +
    `<g transform="rotate(-18 24 92)">` + p("M8 92 Q8 82 24 82 Q40 82 40 92 Q40 99 24 99 Q8 99 8 92 Z", "#c68a4a", 2) +
    line("M16 86 L19 90 M24 85 L27 89 M32 86 L35 90", "#e7c08a", 2) + `</g>` },
  { id: "sahaf", name: "Sahaf", emoji: "📖", group: "koy", glasses: true, a: A, art: () =>
    coat("#8a6b4f", "#98795c", p("M43 78 L50 86 L57 78 Z", "#e6dccb", 2) + circ(48, 92, 1.4, "#5f4a37", 1) + circ(48, 98, 1.4, "#5f4a37", 1)) +
    person({ skin: "#d7a587", facet: "#e3b79c", hair: "#c9c3b9", cut: HAIR.gray }) +
    p("M31 58 Q32 78 50 82 Q68 78 69 58 Q62 66 50 65 Q38 66 31 58 Z", "#d6d0c6", 2) + face(49, { brow: "#a8a196", mouth: "small" }) +
    p("M38 63 Q44 59 50 61.5 Q56 59 62 63 Q56 65.5 50 64 Q44 65.5 38 63 Z", "#c9c3b9", 1.6) + halfGlasses(52) +
    `<g transform="rotate(10 72 92)">` + p("M58 84 L86 84 L86 101 L58 101 Z", "#6e4a3a", 2) + line("M62 84 L62 101", "#5a3a2c", 2) + line("M68 90 L80 90", "#d8ad46", 1.6) + `</g>` },
  { id: "degirmenci", name: "Değirmenci", emoji: "🌾", group: "koy", hat: true, a: { ...A, top: 18 }, art: () =>
    coat("#b8a27c", "#c5b08b", p("M43 78 L50 86 L57 78 Z", "#efe8dc", 2)) +
    person({ skin: "#c58d65", facet: "#d4a07a", hair: "#4a3a30", cut: "" }) + face(51) + mustache(65.5, "#4a3a30") +
    line("M57 68 L76 60", "#d8ad46", 1.8) + line("M74 61 L79 57 M75 61.5 L80 61 M73 60 L76 56", "#d8ad46", 1.6) +
    p("M25 38 Q25 20 50 19 Q75 20 75 38 Z", "#6b5a4a") + flat("M32 34 Q34 24 47 22 Q38 27 38 34 Z", "#7c6a58") +
    p("M24 38 Q50 34 76 38 L80 43 Q50 41 22 43 Z", "#5a4a3c", 2) + circ(50, 20, 2.2, "#5a4a3c", 1.6) +
    ell(30, 66, 2.2, 1.4, "#f3ede2", ' opacity=".85"') },
  { id: "bahcivan", name: "Bahçıvan", emoji: "🌱", group: "koy", hat: true, a: { ...A, top: 16 }, art: () =>
    p("M13 101 C15 87 27 79 43 78 L57 78 C73 79 85 87 87 101 Z", "#d9cfbd") +
    p("M30 101 L32 88 L68 88 L70 101 Z", "#6f8a5a", 2) + line("M34 88 L36 79 M66 88 L64 79", "#6f8a5a", 3) + circ(36, 90, 1.4, "#d8ad46", 1) + circ(64, 90, 1.4, "#d8ad46", 1) +
    person({ skin: "#b97e57", facet: "#c8916a", hair: "#3a3138", cut: "" }) + face(52, { mouth: "grin" }) +
    p("M30 36 Q30 18 50 17 Q70 18 70 36 Z", "#d8b878") + p("M27 32 L73 32 L73 37 L27 37 Z", "#9a5a3c", 2) +
    p("M12 39 Q50 30 88 39 Q86 45 50 43 Q14 45 12 39 Z", "#e4c88e") + line("M38 21 L40 31 M50 19 L50 31 M62 21 L60 31", "#c2a264", 1.4) +
    line("M76 101 L76 86", "#6f8a5a", 2.2) + p("M76 88 Q66 86 66 78 Q75 78 76 88 Z", "#8fb06e", 1.8) + p("M76 85 Q85 82 86 74 Q77 74 76 85 Z", "#8fb06e", 1.8) },
  // -- sky --
  { id: "astronom", name: "Astronom", emoji: "🔭", group: "gok", a: A, art: () =>
    coat("#2f3550", "#3a4160", p("M42 77 Q50 81 58 77 L57 84 Q50 87 43 84 Z", "#3a4160", 2) +
      `<path d="M66 89 L67.2 91.8 L70 93 L67.2 94.2 L66 97 L64.8 94.2 L62 93 L64.8 91.8 Z" fill="#e6c47a"/>`) +
    person({ skin: "#e2ad88", facet: "#ecc0a0", hair: "#2a2433", cut: HAIR.long, back: HAIR.longBack }) + face(49) +
    `<g transform="rotate(-30 24 88)">` + p("M6 84 L36 84 L36 92 L6 92 Z", "#c9b089", 2) + p("M2 82.5 L8 82.5 L8 93.5 L2 93.5 Z", "#a8926b", 2) + p("M36 86 L42 86 L42 90 L36 90 Z", "#a8926b", 1.8) + `</g>` +
    `<path d="M80 14 L81 16.6 L83.6 17.6 L81 18.6 L80 21.2 L79 18.6 L76.4 17.6 L79 16.6 Z" fill="#e6c47a"/><circle cx="18" cy="16" r="1.2" fill="#e6c47a"/>` },
  { id: "karadelik", name: "Kara delik", emoji: "🕳️", group: "gok", a: { top: 25, eyeY: 46, eyeDx: 9, eyeR: 4.4, chin: 72, w: 24 }, art: () => {
    const ring = (d, w1, w2, w3, c2, c3) => `<g transform="rotate(-14 50 54)">` +
      `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w1}"/><path d="${d}" fill="none" stroke="${c2}" stroke-width="${w2}"/><path d="${d}" fill="none" stroke="${c3}" stroke-width="${w3}"/></g>`;
    return ring("M9 54 A41 11 0 1 1 91 54 A41 11 0 1 1 9 54", 9.4, 5.6, 1.4, "#b28339", "#e6c47a") +
      `<circle cx="50" cy="50" r="28.6" fill="#f0dcaa" opacity=".35"/><circle cx="50" cy="50" r="27" fill="none" stroke="#e6c47a" stroke-width="2.2"/>` +
      `<circle cx="50" cy="50" r="25" fill="#1f1d26" stroke="${K}" stroke-width="2.4"/>` + flat("M28 44 Q32 29 47 26 Q37 33 34 46 Z", "#3a3647") +
      ring("M9 54 A41 11 0 0 0 91 54", 9.4, 5.6, 1.4, "#d6ad59", "#f0dcaa") +
      ell(41, 46, 4.6, 5.6, "#d6ad59") + ell(59, 46, 4.6, 5.6, "#d6ad59") + ell(41.6, 46.4, 1.5, 4.6, K) + ell(58.4, 46.4, 1.5, 4.6, K) +
      line("M46.5 55 Q50 57.5 53.5 55", "#d6ad59", 1.6) +
      `<path d="M19 22 L20 25 L23 26 L20 27 L19 30 L18 27 L15 26 L18 25 Z" fill="#f0dcaa"/><circle cx="80" cy="26" r="1.4" fill="#f0dcaa"/><circle cx="84" cy="80" r="1.1" fill="#f0dcaa"/>`;
  } },
  // -- founder only --
  { id: "sef", name: "Şantiye şefi", emoji: "👷", group: "kurucu", founder: true, hat: true, a: { ...A, top: 15 }, art: () =>
    coat("#efe8dc", "#f7f2ea") + p("M13 101 C15 88 25 81 37 79 L41 101 Z", "#c97a42") + p("M87 101 C85 88 75 81 63 79 L59 101 Z", "#c97a42") +
    line("M18 94 L39 92 M82 94 L61 92", "#ece2c9", 2.6) + p("M43 78 L50 86 L57 78 Z", "#efe8dc", 2) +
    person({ skin: "#e0aa82", facet: "#ebbd98" }) + face(51, { mouth: "grin" }) +
    hardHat("#f2f0ea", "#ffffff", "#d9d4c8", line("M50 21.5 L50 36.5 M42.5 29 L57.5 29 M44.7 23.7 L55.3 34.3 M55.3 23.7 L44.7 34.3", "#7d6fb0", 2.6)) },
];
export const CHARACTERS = CAST.filter((c) => !c.founder);
export const FOUNDER_CHARACTERS = CAST.filter((c) => c.founder);
export const AVATAR_GROUPS = [["kedi", "Kediler"], ["kutup", "Kütüphane"], ["koy", "Köy ve atölyeler"], ["gok", "Gökyüzü"], ["kurucu", "Kurucuya özel"]];
const BY_ID = Object.fromEntries(CAST.map((c) => [c.id, c]));
export const characterOf = (id) => BY_ID[id] || null;

// ---------- accessories ----------
// slot: one item per slot (bere and kep share the head). Listed in storage order.
export const ACCESSORIES = [
  { id: "gozluk", name: "Gözlük", emoji: "👓", slot: "eyes" },
  { id: "kulaklik", name: "Kulaklık", emoji: "🎧", slot: "ears" },
  { id: "bere", name: "Bere", emoji: "🧶", slot: "hat" },
  { id: "kep", name: "Kep", emoji: "🎓", slot: "hat" },
  { id: "atki", name: "Atkı", emoji: "🧣", slot: "neck" },
];
const ACC = Object.fromEntries(ACCESSORIES.map((a) => [a.id, a]));
/** Can this character wear that accessory? (Own headgear leaves no room on the head, own glasses none on the nose.) */
export const fitsCharacter = (ch, acc) => {
  const slot = ACC[acc]?.slot;
  return !(ch?.hat && (slot === "hat" || slot === "ears")) && !(ch?.glasses && slot === "eyes");
};

const ACC_ART = {
  // Kara's scarf, in the site's lilac.
  atki: (a) => {
    const y = a.chin, w = a.w * 0.82, x = (k) => r1(50 + w * k);
    return p(`M${x(-1)} ${y - 4} Q50 ${y + 4} ${x(1)} ${y - 4} L${x(1) + 1} ${y + 4} Q50 ${y + 13} ${x(-1) - 1} ${y + 4} Z`, "#8272d8", 2) +
      flat(`M${x(-0.95)} ${y + 2.5} Q50 ${y + 10} ${x(0.95)} ${y + 2.5} L${x(1)} ${y + 4} Q50 ${y + 12} ${x(-1)} ${y + 4} Z`, "#6455b8") +
      p(`M${x(0.3)} ${y + 5} L${x(0.62)} ${y + 5} L${x(0.7)} ${y + 22} L${x(0.36)} ${y + 23} Z`, "#6455b8", 2) +
      line(`M${x(0.38)} ${y + 23} L${x(0.37)} ${y + 26} M${x(0.53)} ${y + 22.5} L${x(0.53)} ${y + 25.5} M${x(0.68)} ${y + 22} L${x(0.7)} ${y + 25}`, "#6455b8", 1.8) +
      line(`M${x(-0.7)} ${y - 1} Q50 ${y + 4.5} ${x(0.7)} ${y - 1}`, "#c4b9f5", 1.4);
  },
  // Kara's round brass frames.
  gozluk: (a) => {
    const y = a.eyeY, R = r1(Math.min(a.eyeR + 4.6, a.eyeDx - 1.2)), L = 50 - a.eyeDx, Rx = 50 + a.eyeDx;
    return `<circle cx="${L}" cy="${y}" r="${R}" fill="#fff" fill-opacity=".14" stroke="#bda57f" stroke-width="2"/>` +
      `<circle cx="${Rx}" cy="${y}" r="${R}" fill="#fff" fill-opacity=".14" stroke="#bda57f" stroke-width="2"/>` +
      line(`M${r1(L + R)} ${y - 1} Q50 ${y - 4} ${r1(Rx - R)} ${y - 1} M${r1(L - R)} ${y - 1.5} L${r1(50 - a.w)} ${y - 4} M${r1(Rx + R)} ${y - 1.5} L${r1(50 + a.w)} ${y - 4}`, "#bda57f", 1.8);
  },
  bere: (a) => {
    const t = a.top, w = a.w + 2, L = 50 - w, R = 50 + w;
    let ribs = "";
    for (let i = 1; i < 8; i++) ribs += `M${r1(L + (i * 2 * w) / 8)} ${t + 10.5} L${r1(L + (i * 2 * w) / 8)} ${t + 15.5} `;
    return p(`M${L + 2} ${t + 12} C${L + 2} ${t - 14} ${R - 2} ${t - 14} ${R - 2} ${t + 12} Z`, "#7d6fb0") +
      flat(`M${L + 9} ${t + 8} C${L + 9} ${t - 4} ${50 - 4} ${t - 8} 50 ${t - 8} C${L + 14} ${t - 4} ${L + 14} ${t + 2} ${L + 14} ${t + 8} Z`, "#8f82c0") +
      `<rect x="${L}" y="${t + 8}" width="${2 * w}" height="10" rx="5" fill="#6a5d9b" stroke="${K}" stroke-width="2.4"/>` +
      line(ribs.trim(), "#5a4e88", 1.6) + circ(50, t - 11, 5.6, "#efe8dc", 2.2);
  },
  kulaklik: (a) => {
    const y = a.eyeY + 1, w = a.w + 1.5, t = a.top - 9, band = `M${50 - w} ${y - 5} C${50 - w} ${t} ${50 + w} ${t} ${50 + w} ${y - 5}`;
    return line(band, K, 6.6) + line(band, "#4a4655", 3.2) +
      `<rect x="${r1(50 - w - 5.5)}" y="${y - 9}" width="11" height="18" rx="5" fill="#b5644a" stroke="${K}" stroke-width="2.4"/>` +
      `<rect x="${r1(50 + w - 5.5)}" y="${y - 9}" width="11" height="18" rx="5" fill="#b5644a" stroke="${K}" stroke-width="2.4"/>` +
      flat(`M${r1(50 - w - 3)} ${y - 6} L${r1(50 - w - 3)} ${y + 3}`, "none") + line(`M${r1(50 - w - 2.5)} ${y - 5} L${r1(50 - w - 2.5)} ${y + 3} M${r1(50 + w + 2.5)} ${y - 5} L${r1(50 + w + 2.5)} ${y + 3}`, "#cf8066", 1.6);
  },
  kep: (a) => {
    const t = a.top + 2, w = r1(a.w * 0.62);
    return p(`M${50 - w} ${t - 3} L${50 - w} ${t + 8} C${r1(50 - w * 0.5)} ${t + 12} ${r1(50 + w * 0.5)} ${t + 12} ${50 + w} ${t + 8} L${50 + w} ${t - 3} Z`, "#2f2e37") +
      p(`M${50 - a.w - 6} ${t - 4} L50 ${t - 13} L${50 + a.w + 6} ${t - 4} L50 ${t + 5} Z`, "#3d3a46") +
      flat(`M${50 - a.w - 1} ${t - 4.4} L50 ${t - 10.8} L50 ${t - 7} Z`, "#4a4655") +
      line(`M50 ${t - 4.5} L${50 + a.w - 2} ${t - 1} L${50 + a.w - 2} ${t + 11}`, "#d6ad59", 1.8) +
      p(`M${50 + a.w - 5} ${t + 10} L${50 + a.w + 1} ${t + 10} L${50 + a.w + 2} ${t + 19} L${50 + a.w - 6} ${t + 19} Z`, "#d6ad59", 1.8) +
      ell(50, t - 4.5, 2.4, 1.6, "#d6ad59");
  },
};
const DRAW_ORDER = ["atki", "gozluk", "bere", "kulaklik", "kep"];

// ---------- values ----------
/** "k:tekir+gozluk" → { ch, acc: ["gozluk"] }; null for emoji or unknown values. */
export function parseAvatar(value) {
  const m = /^k:([a-z]{2,16})((?:\+[a-z]{2,12}){0,5})$/.exec(typeof value === "string" ? value : "");
  const ch = m && BY_ID[m[1]];
  return ch ? { ch, acc: m[2] ? m[2].slice(1).split("+") : [] } : null;
}
/** Builds the stored value: known accessories only, one per slot, the ones the character can wear, in order. */
export function composeAvatar(id, acc = []) {
  const ch = BY_ID[id];
  if (!ch) return null;
  const want = new Set(acc), slots = new Set();
  const keep = ACCESSORIES.filter((a) => {
    if (!want.has(a.id) || !fitsCharacter(ch, a.id) || slots.has(a.slot)) return false;
    slots.add(a.slot);
    return true;
  });
  return ["k:" + ch.id, ...keep.map((a) => a.id)].join("+");
}
/** Server check: a well-formed character value; founder characters only for the founder. */
export function avatarAllowed(value, founder = false) {
  const p = parseAvatar(value);
  return !!p && (!p.ch.founder || founder) && composeAvatar(p.ch.id, p.acc) === value;
}
/** Plain-text stand-in (option labels, notifications). */
export const avatarText = (value) => parseAvatar(value)?.ch.emoji || value || "🪐";
export const randomCharacter = () => "k:" + CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id;

const cache = new Map();
/** Inner SVG markup (viewBox 0 0 100 100) for a character value, or null for emoji. */
export function avatarArt(value) {
  if (cache.has(value)) return cache.get(value);
  const parsed = parseAvatar(value);
  let art = null;
  if (parsed) {
    const a = { ...A, ...parsed.ch.a };
    const acc = DRAW_ORDER.filter((id) => parsed.acc.includes(id) && fitsCharacter(parsed.ch, id));
    art = parsed.ch.art() + acc.map((id) => ACC_ART[id](a)).join("");
  }
  if (cache.size > 400) cache.clear();
  cache.set(value, art);
  return art;
}
/** A self-contained SVG document (for <img> and canvas). */
export function avatarSvg(value, size = 160) {
  const art = avatarArt(value);
  return art && `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${art}</svg>`;
}
// Light member colors, as the avatar discs use them (styles.css tokens).
export const AVATAR_BG = { lilac: "#eae5f5", mint: "#e4eddc", peach: "#f8e7d8", blue: "#e1eaf2", pink: "#f6e3e8", lemon: "#f2f0d3", slate: "#dfe3ea", sand: "#ede5d6", olive: "#e3e6d0" };

const images = new Map();
/** Browser only: a decoded image of the avatar for canvas drawing; null until it is ready (then onReady runs). */
export function avatarImage(value, onReady) {
  let entry = images.get(value);
  if (!entry) {
    const svg = avatarSvg(value);
    if (!svg || typeof Image === "undefined") return null;
    const img = new Image();
    entry = { img, ready: false, waiting: new Set() };
    img.onload = () => {
      entry.ready = true;
      for (const fn of entry.waiting) fn();
      entry.waiting.clear();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    images.set(value, entry);
  }
  if (!entry.ready && onReady) entry.waiting.add(onReady);
  return entry.ready ? entry.img : null;
}
