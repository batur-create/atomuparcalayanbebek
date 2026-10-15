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
  { id: "kahve", name: "Kır Kahvesi", emoji: "☕", class: "small", kind: "cottage", category: "work", cost: 30, done: "kır kahvesini", blurb: "Önünde iki masa; mola burada verilir.", look: { wall: "cream", roof: 1, awning: "#c0533e", tables: true, sign: "KAHVE" } },
  { id: "ev", name: "İki Katlı Ev", emoji: "🏠", class: "medium", kind: "house", category: "home", cost: 40, done: "iki katlı evini", blurb: "Bacası tüten, iki katlı aile evi." },
  { id: "sahaf", name: "Sahaf", emoji: "📚", class: "medium", kind: "house", category: "work", cost: 60, done: "sahafını", blurb: "Eski kitaplar, mavi tente.", look: { wall: "wood", roof: 0, awning: "#4a76b0", sign: "SAHAF", shutters: "#345d93" } },
  { id: "firin", name: "Fırın", emoji: "🥖", class: "medium", kind: "house", category: "work", cost: 70, done: "fırınını", blurb: "Taş fırının bacası hiç sönmez.", look: { wall: "brick", roof: 3, chimney: true, awning: "#d4a24c", sign: "FIRIN" } },
  { id: "konak", name: "Konak", emoji: "🏘️", class: "medium", kind: "house", category: "home", cost: 80, done: "konağını", blurb: "Balkonlu, kepenkli beyaz konak.", look: { wall: "cream", roof: 5, balcony: true, shutters: "#4f9d8a", chimney: true } },
  { id: "kule", name: "Kule", emoji: "🏰", class: "large", kind: "tower", category: "home", cost: 90, done: "kulesini", blurb: "Bayraklı, üç katlı taş kule." },
  { id: "degirmen", name: "Yel Değirmeni", emoji: "🌾", class: "large", kind: "tower", category: "work", cost: 120, done: "yel değirmenini", blurb: "Kanatları rüzgârla döner.", look: { wall: "cream", roof: 1, sails: true, flag: false } },
  { id: "saat", name: "Saat Kulesi", emoji: "🕰️", class: "large", kind: "tower", category: "fancy", cost: 140, done: "saat kulesini", blurb: "Dört yüzünde saat, köyün buluşma yeri.", look: { wall: "stone", roof: 5, clock: true } },
  { id: "kutuphane", name: "Kütüphane", emoji: "🏛️", class: "large", kind: "house", category: "work", cost: 150, done: "kütüphanesini", blurb: "Sütunlu giriş; köyün en ağır yapısı.", look: { wall: "stone", roof: 0, columns: true, sign: "KÜTÜPHANE", chimney: false } },
];
export const BY_ID = Object.fromEntries(CATALOG.map((item) => [item.id, item]));
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
  cost: "Malzeme",
  refund: "İade",
  "ruin-refund": "Enkaz kaldırıldı",
  grant: "Batur'dan",
};
