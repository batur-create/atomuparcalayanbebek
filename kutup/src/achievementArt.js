// Başarım rozetleri (n14), drawn in the avatars' language (DESIGN.md §5): a
// dark outline, calm flat colors, no blush, no sticker edge. Each badge is a
// medallion in its own pastel with one thing from Kütüp's world on it.
const K = "#25242d";
const p = (d, fill, w = 2.4) => `<path d="${d}" fill="${fill}" stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (d, color = K, w = 2.2) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const circ = (cx, cy, r, fill, w = 2.2) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${K}" stroke-width="${w}"/>`;
const dot = (cx, cy, r, fill = K) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
const word = (x, y, size, text, fill = K) =>
  `<text x="${x}" y="${y}" font-family="Bricolage Grotesque Variable, DM Sans, sans-serif" font-weight="800" font-size="${size}" text-anchor="middle" fill="${fill}">${text}</text>`;
const medal = (tone) => `${circ(50, 50, 45, tone, 2.4)}<circle cx="50" cy="50" r="38.5" fill="none" stroke="${K}" stroke-opacity=".16" stroke-width="1.6" stroke-dasharray="2 4"/>`;
const TONE = { mint: "#e4eddc", peach: "#f8e7d8", pink: "#f6e3e8", blue: "#e1eaf2", lilac: "#eae5f5", lemon: "#f2f0d3", sand: "#efe6d6", night: "#3a4160" };

// A desk calendar page with a number on it.
const calendar = (n, size) =>
  p("M29 32 H71 V72 Q71 75 68 75 H32 Q29 75 29 72Z", "#f7f3ed") +
  p("M29 32 H71 V43 H29Z", "#b5644a") +
  line("M38 27 V36 M62 27 V36", K, 2.6) +
  word(50, 68, size, n);
// An ince belli tea glass at x, with its saucer.
const glass = (x, s = 1) =>
  `<g transform="translate(${x} 0) scale(${s} 1)">` +
  `<ellipse cx="0" cy="69" rx="14" ry="3.6" fill="#efe8dc" stroke="${K}" stroke-width="2.2"/>` +
  p("M-10 36 Q-9 46 -6.5 52 Q-9 60 -7.5 67 H7.5 Q9 60 6.5 52 Q9 46 10 36Z", "#f2eee6") +
  p("M-8.4 43 Q-7.6 48 -5.4 52.4 Q-7.6 59 -6.2 65.4 H6.2 Q7.6 59 5.4 52.4 Q7.6 48 8.4 43Z", "#b0502b", 0) +
  line("M-8.6 43 H8.6", "#c97a42", 1.4) +
  `</g>`;
const house = (x, y, w, h, wall, roof) =>
  p(`M${x} ${y} H${x + w} V${y + h} H${x}Z`, wall) +
  p(`M${x - 3} ${y + 1} L${x + w / 2} ${y - w * 0.55} L${x + w + 3} ${y + 1}Z`, roof) +
  p(`M${x + w / 2 - 3} ${y + h} V${y + h - 8} H${x + w / 2 + 3} V${y + h}`, "#5a4a3c", 1.8);

export const ART = {
  "first-build":
    medal(TONE.peach) +
    p("M28 58 H50 V70 H28Z M50 58 H72 V70 H50Z", "#c97a42") +
    p("M38 46 H62 V58 H38Z", "#d48c50") +
    line("M50 46 V24", K, 2.4) +
    p("M50 24 L64 28.5 L50 33Z", "#6f8a5a", 2),
  "week-streak": medal(TONE.mint) + calendar("7", 26),
  "month-streak": medal(TONE.lemon) + calendar("30", 22) + p("M72 22 L74.5 27.5 L80 28 L76 32 L77 38 L72 35 L67 38 L68 32 L64 28 L69.5 27.5Z", "#e0be52", 1.8),
  early:
    medal(TONE.blue) +
    p("M30 62 A20 20 0 0 1 70 62Z", "#e0be52") +
    line("M50 30 V36 M30 40 L34 44 M70 40 L66 44 M22 54 H27 M78 54 H73", "#b28339", 2.4) +
    line("M20 62 H80", K, 2.4) +
    line("M30 70 H48 M54 70 H70", K, 1.8),
  night:
    medal(TONE.night) +
    p("M58 26 A22 22 0 1 0 72 62 A17 17 0 1 1 58 26Z", "#f0dcaa") +
    p("M30 30 L31.6 34 L36 34.6 L32.6 37.4 L33.6 42 L30 39.6 L26.4 42 L27.4 37.4 L24 34.6 L28.4 34Z", "#e6c47a", 1.6) +
    dot(40, 70, 1.8, "#e6c47a") +
    dot(26, 56, 1.5, "#e6c47a"),
  marathon:
    medal(TONE.sand) +
    p("M33 24 H67 V29 H33Z M33 71 H67 V76 H33Z", "#8a6b4f") +
    p("M37 29 H63 Q63 44 52 50 Q63 56 63 71 H37 Q37 56 48 50 Q37 44 37 29Z", "#f7f3ed") +
    p("M42 38 H58 Q56 45 50 48 Q44 45 42 38Z", "#d8ad46", 0) +
    p("M40 70 Q44 60 50 58 Q56 60 60 70Z", "#d8ad46", 0) +
    line("M50 49 V58", "#d8ad46", 1.6),
  hundred:
    medal(TONE.lilac) +
    circ(50, 50, 25, "#f7f3ed", 2.4) +
    line("M50 29 V32 M50 68 V71 M29 50 H32 M68 50 H71", K, 2) +
    word(50, 56.5, 16.5, "100", "#6455b8"),
  imece: medal(TONE.peach) + glass(39) + glass(61) + line("M44 30 Q46 26 44 22 M56 30 Q54 26 56 22", "#a39a8f", 1.8),
  collector:
    medal(TONE.mint) +
    house(23, 52, 16, 16, "#efe8dc", "#b5644a") +
    house(42, 44, 16, 24, "#f0dcaa", "#6f8a5a") +
    house(61, 50, 16, 18, "#e1eaf2", "#7d6fb0") +
    line("M18 68 H82", K, 2.4),
  loved:
    medal(TONE.pink) +
    house(37, 50, 26, 20, "#efe8dc", "#c98a5a") +
    p("M50 37 C44 31 36 34 38 41 C40 46 50 50 50 50 C50 50 60 46 62 41 C64 34 56 31 50 37Z", "#b5644a", 2) +
    line("M22 70 H78", K, 2.4),
  regular:
    medal(TONE.sand) +
    p("M26 40 L50 25 L74 40Z", "#efe8dc") +
    p("M28 40 H72 V45 H28Z", "#d6cfc0") +
    p("M33 45 H39 V65 H33Z M47 45 H53 V65 H47Z M61 45 H67 V65 H61Z", "#f7f3ed", 2) +
    p("M25 65 H75 V72 H25Z", "#d6cfc0"),
  master:
    medal(TONE.lemon) +
    p("M28 64 L24 34 L39 44 L50 26 L61 44 L76 34 L72 64Z", "#dab16a") +
    p("M28 64 H72 V71 H28Z", "#b88b49") +
    dot(50, 52, 3.4, "#b5644a") +
    dot(24, 34, 2.4, "#dab16a") +
    dot(76, 34, 2.4, "#dab16a") +
    dot(50, 25, 2.6, "#dab16a"),
  monument:
    medal(TONE.blue) +
    p("M44 66 L46 30 L50 24 L54 30 L56 66Z", "#efe8dc") +
    p("M36 66 H64 V71 H36Z", "#d6cfc0") +
    p("M30 71 H70 V76 H30Z", "#c9c3b9") +
    line("M47 42 H53", K, 1.6),
  "black-hole":
    medal(TONE.lilac) +
    `<g transform="rotate(-14 50 52)"><ellipse cx="50" cy="52" rx="28" ry="9" fill="none" stroke="#d8ad46" stroke-width="3.4"/>` +
    `<circle cx="50" cy="50" r="15" fill="#0b0a0f"/>` +
    `<path d="M22 52 A28 9 0 0 0 78 52" fill="none" stroke="#e6c47a" stroke-width="3.4"/></g>`,
  shush:
    medal(TONE.blue) +
    p("M24 30 H76 Q79 30 79 33 V58 Q79 61 76 61 H44 L33 71 L35 61 H24 Q21 61 21 58 V33 Q21 30 24 30Z", "#f7f3ed") +
    word(50, 52, 16, "Şşşt"),
  tea: medal(TONE.peach) + glass(50, 1.25) + line("M45 30 Q48 25 45 20 M55 30 Q52 25 55 20", "#a39a8f", 1.8),
};

// A badge not found yet: hidden ones keep their secret.
export const SECRET = medal("#ece8e0") + word(50, 61, 30, "?", "#a39a8f");
