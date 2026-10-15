// The building catalogue and the tuğla economy, shared by the server (prices,
// wages, refunds) and the app (the picker, receipts, the village look).
//
// Tuğla are the materials, focus is the labour: a building's materials are paid
// up front, its labour is one focus session, and the minutes worked are paid
// out as a wage when the session ends. Nothing earns tuğla without focusing.

export const CLASSES = {
  small: { label: "Küçük", minutes: 25 },
  medium: { label: "Orta", minutes: 50 },
  large: { label: "Büyük", minutes: 75 },
};
export const CATEGORIES = { home: "Konut", work: "İşlevsel", fancy: "Süs" };

// kind: the footprint and frame the site builds (cottage / house / tower).
// look: what makes it this building: wall, roof colour (index into iso.js
// ROOFS) and its fittings. done: "… bitirdi" on the team board.
export const CATALOG = [
  { id: "kulube", name: "Kulübe", emoji: "🏡", class: "small", kind: "cottage", category: "home", cost: 0, done: "kulübesini", blurb: "Her zaman bedava. Her köy bir kulübeyle başlar." },
  { id: "bostan", name: "Bostan Evi", emoji: "🥕", class: "small", kind: "cottage", category: "home", cost: 15, done: "bostan evini", blurb: "Ahşap ev, önünde sebze tarhları.", look: { wall: "wood", roof: 2, beds: true } },
  { id: "cicekci", name: "Çiçekçi", emoji: "💐", class: "small", kind: "cottage", category: "fancy", cost: 25, done: "çiçekçisini", blurb: "Çizgili tente, pencerelerde saksılar.", look: { wall: "sage", roof: 4, awning: "#e98aa8", boxes: true } },
  { id: "kahve", name: "Kır Kahvesi", emoji: "☕", class: "small", kind: "cottage", category: "work", cost: 30, done: "kır kahvesini", blurb: "Önünde iki masa; mola burada verilir.", effect: "İmecede arkadaş başına +%8 (normalde +%5)", look: { wall: "cream", roof: 1, awning: "#c0533e", tables: true, sign: "KAHVE" } },
  { id: "ev", name: "İki Katlı Ev", emoji: "🏠", class: "medium", kind: "house", category: "home", cost: 40, done: "iki katlı evini", blurb: "Bacası tüten, iki katlı aile evi." },
  { id: "sahaf", name: "Sahaf", emoji: "📚", class: "medium", kind: "house", category: "work", cost: 60, done: "sahafını", blurb: "Eski kitaplar, mavi tente.", effect: "Her seansta +3 🧱", look: { wall: "wood", roof: 0, awning: "#4a76b0", sign: "SAHAF", shutters: "#345d93" } },
  { id: "firin", name: "Fırın", emoji: "🥖", class: "medium", kind: "house", category: "work", cost: 70, done: "fırınını", blurb: "Taş fırının bacası hiç sönmez.", effect: "Her seansta maaşa +%5", look: { wall: "brick", roof: 3, chimney: true, awning: "#d4a24c", sign: "FIRIN" } },
  { id: "konak", name: "Konak", emoji: "🏘️", class: "medium", kind: "house", category: "home", cost: 80, done: "konağını", blurb: "Balkonlu, kepenkli beyaz konak.", look: { wall: "cream", roof: 5, balcony: true, shutters: "#4f9d8a", chimney: true } },
  { id: "kule", name: "Kule", emoji: "🏰", class: "large", kind: "tower", category: "home", cost: 90, done: "kulesini", blurb: "Bayraklı, üç katlı taş kule." },
  { id: "degirmen", name: "Yel Değirmeni", emoji: "🌾", class: "large", kind: "tower", category: "work", cost: 120, done: "yel değirmenini", blurb: "Kanatları rüzgârla döner.", effect: "Günün ilk seansı +20 🧱 (normalde +10)", look: { wall: "cream", roof: 1, sails: true, flag: false } },
  { id: "saat", name: "Saat Kulesi", emoji: "🕰️", class: "large", kind: "tower", category: "fancy", cost: 140, done: "saat kulesini", blurb: "Dört yüzünde saat, köyün buluşma yeri.", look: { wall: "stone", roof: 5, clock: true } },
  { id: "kutuphane", name: "Kütüphane", emoji: "🏛️", class: "large", kind: "house", category: "work", cost: 150, done: "kütüphanesini", blurb: "Sütunlu giriş; köyün en ağır yapısı.", effect: "Seri bonusuna +%5", look: { wall: "stone", roof: 0, columns: true, sign: "KÜTÜPHANE", chimney: false } },
];
// Weekly buildings: each arrives on a Monday (since, Türkiye midnight), is
// sold for two weeks, and after that only comes with a blueprint.
const mondayTR = (y, m, d) => Date.UTC(y, m - 1, d) - 3 * 3600000;
CATALOG.push(
  { id: "postane", name: "Köy Postanesi", emoji: "📮", class: "small", kind: "cottage", category: "work", cost: 35, since: mondayTR(2026, 10, 12), done: "köy postanesini", blurb: "Sarı tente, kapıda POSTA tabelası.", look: { wall: "brick", roof: 5, awning: "#f2c14e", sign: "POSTA", chimney: false } },
  { id: "cay", name: "Çay Ocağı", emoji: "🫖", class: "small", kind: "cottage", category: "work", cost: 35, since: mondayTR(2026, 10, 19), done: "çay ocağını", blurb: "Yeşil tente, önünde çay masaları.", look: { wall: "wood", roof: 2, awning: "#4f9d8a", tables: true, sign: "ÇAY" } },
);
// Rare buildings need a blueprint, found by focusing (rare: true); the
// observatory is the founder's own (rare: "founder").
CATALOG.push(
  { id: "fener", name: "Deniz Feneri", emoji: "🗼", class: "large", kind: "tower", category: "fancy", cost: 160, rare: true, done: "deniz fenerini", blurb: "Kırmızı-beyaz bantlar, tepesinde ışık odası.", look: { wall: "cream", roof: 1, bands: "#c94a3c", lamp: true, flag: false } },
  { id: "sera", name: "Cam Sera", emoji: "🪴", class: "small", kind: "cottage", category: "fancy", cost: 45, rare: true, done: "cam serasını", blurb: "Cam duvarların ardında yemyeşil bitkiler.", look: { wall: "glass", roofColors: ["#cdebe7", "#b1dcd6", "#e4f6f3"], plants: true, chimney: false } },
  { id: "gozlemevi", name: "Olay Ufku Gözlemevi", emoji: "🔭", class: "large", kind: "tower", category: "fancy", cost: 100, rare: "founder", done: "olay ufku gözlemevini", blurb: "Kubbesinin üstünde minik bir kara delik döner. Yalnız kurucunun.", look: { wall: "stone", dome: true, flag: false } },
);
export const BY_ID = Object.fromEntries(CATALOG.map((item) => [item.id, item]));
export const RARE = CATALOG.filter((item) => item.rare === true);
export const WEEKLY_DAYS = 14;
const DAY_MS = 24 * 3600000;
/**
 * Where a building stands for a member right now: "open" (buildable), "new"
 * (this fortnight's weekly building), "soon" (next week's), "locked" (needs a
 * blueprint) or "hidden" (the founder's own, for everyone else).
 */
export function stateOf(item, now, unlocks = [], founder = false) {
  if (item.rare === "founder") return founder ? "open" : "hidden";
  if (item.since) {
    if (now < item.since) return "soon";
    if (now < item.since + WEEKLY_DAYS * DAY_MS) return "new";
    return unlocks.includes(item.id) ? "open" : "locked";
  }
  if (item.rare) return unlocks.includes(item.id) ? "open" : "locked";
  return "open";
}
/** Can this member build it now? */
export const unlocked = (item, unlocks = [], founder = false, now = Date.now()) => ["open", "new"].includes(stateOf(item, now, unlocks, founder));
/** Blueprints can turn up for rare buildings and for weekly ones whose fortnight is over. */
export const blueprintPool = (now) => CATALOG.filter((item) => item.rare === true || (item.since && now >= item.since + WEEKLY_DAYS * DAY_MS));
export const BLUEPRINT_CHANCE = 0.1; // a finished session turns up a blueprint
export const BLUEPRINT_STREAKS = [7, 14, 30]; // day streaks that always do
export const DEFAULT_MODEL = { cottage: "kulube", house: "ev", tower: "kule" };

/** The catalogue entry a building was built from (older buildings: by kind). */
export const modelOf = (id, kind = "cottage") => BY_ID[id] || BY_ID[DEFAULT_MODEL[kind]] || BY_ID.kulube;
export const minutesOf = (item) => CLASSES[item.class].minutes;
/** The largest class a session of `minutes` can build (joining a friend's timer). */
export const classFor = (minutes) => (minutes >= 70 ? "large" : minutes >= 40 ? "medium" : "small");
export const fits = (item, minutes) => minutesOf(item) <= minutesOf({ class: classFor(minutes) });

// ---------- the economy ----------
export const DAILY_BONUS = 10; // first finished session of the day
export const FREE_SHARE = 0.5; // focus without a building pays half
export const REFUND_NOW = 0.5; // an abandoned build: half the materials back at once…
export const REFUND_LATER = 0.3; // …30% more once the rubble is cleared; 20% is lost
export const GRACE = 2 * 60000; // changing your mind in the first two minutes costs nothing
export const RUIN_DAYS = 3; // rubble left uncleared this long takes its 30% with it
export const CHAIN_GAP = 10.5 * 60000; // a break of up to ten minutes keeps a streak going

// Imece: every friend focusing alongside you for at least half of your session.
export const IMECE_EACH = 0.05;
export const IMECE_MAX = 0.2;
export const imeceBonus = (friends, cafe = false) => Math.round(Math.min(IMECE_MAX, friends * (cafe ? 0.08 : IMECE_EACH)) * 100) / 100;

/** Streak bonus on the wage of the n-th session in a row: 2nd +10%, 3rd on +20%. */
export const streakBonus = (n) => (n >= 3 ? 0.2 : n === 2 ? 0.1 : 0);

/** Wage for a session: longer sessions pay more per minute (25 → 25, 50 → 55, 75 → 90). */
export function wageFor(minutes, strict = true) {
  const rate = 1 + 0.2 * Math.min(1, Math.max(0, (minutes - 25) / 50));
  const wage = Math.round(minutes * rate);
  return strict ? wage : Math.round(wage * FREE_SHARE);
}
export const refundNow = (cost) => Math.round(cost * REFUND_NOW);
export const refundLater = (cost) => Math.round(cost * REFUND_LATER);

/** Ledger reasons, as the receipt shows them. */
export const REASONS = {
  opening: "Açılış: geçmiş çalışmaların",
  wage: "Maaş",
  bonus: "Günün ilk seansı",
  streak: "Seri",
  imece: "İmece",
  effect: "Yapı etkisi",
  blueprint: "Nadir plan",
  cost: "Malzeme",
  refund: "İade",
  "ruin-refund": "Enkaz kaldırıldı",
  grant: "Batur'dan",
};
