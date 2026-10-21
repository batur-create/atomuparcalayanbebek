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
export const CATEGORIES = { home: "Konut", work: "İşlevsel", fancy: "Süs", famous: "Ünlü Yapı" };

// kind: the footprint and frame the site builds (cottage / house / tower);
// look.special swaps the box for a building of its own (src/special.js).
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
  { id: "kubbe", name: "Jeodezik Kubbe", emoji: "🌐", class: "medium", kind: "house", category: "fancy", cost: 85, done: "jeodezik kubbesini", blurb: "Üçgen çelik çubuklardan yarım küre; beş beşgen pencere, tepede cam fener.", look: { special: "geodesic" } },
  { id: "serender", name: "Serender", emoji: "🌽", class: "small", kind: "cottage", category: "fancy", cost: 35, done: "serenderini", blurb: "Karadeniz'in kestane ambarı; dört ayak, fare taşları, ahşap pul çatı.", look: { special: "serender" } },
  { id: "kerpic", name: "Kerpiç Kubbe Evleri", emoji: "🏺", class: "medium", kind: "house", category: "home", cost: 65, done: "kerpiç kubbe evlerini", blurb: "Harran usulü; kalıpsız, sıra sıra bindirilmiş üç kubbe ve avlu.", look: { special: "kerpic" } },
  { id: "kemer", name: "Taş Kemer Köprü", emoji: "🌉", class: "medium", kind: "house", category: "fancy", cost: 75, done: "taş kemer köprüsünü", blurb: "Derenin üstünde kesme taş kemer; kilit taşı en son konur.", look: { special: "kemer" } },
  { id: "konsol", name: "Konsol Ev", emoji: "🏗️", class: "medium", kind: "house", category: "home", cost: 95, done: "konsol evini", blurb: "Beton çekirdeğin üstünden 4,8 m boşluğa uzanan cam kutu; altında salıncak.", look: { special: "konsol" } },
  { id: "pazar", name: "Kabuk Çatılı Pazar", emoji: "🍅", class: "medium", kind: "house", category: "work", cost: 90, done: "kabuk çatılı pazarını", blurb: "Dört ters şemsiye; 4 cm beton kabuk, her biri tek kolonda.", look: { special: "kabuk" } },
  { id: "kule", name: "Kule", emoji: "🏰", class: "large", kind: "tower", category: "home", cost: 90, done: "kulesini", blurb: "Bayraklı, üç katlı taş kule." },
  { id: "degirmen", name: "Yel Değirmeni", emoji: "🌾", class: "large", kind: "tower", category: "work", cost: 120, done: "yel değirmenini", blurb: "Kanatları rüzgârla döner.", effect: "Günün ilk seansı +20 🧱 (normalde +10)", look: { wall: "cream", roof: 1, sails: true, flag: false } },
  { id: "saat", name: "Saat Kulesi", emoji: "🕰️", class: "large", kind: "tower", category: "fancy", cost: 140, done: "saat kulesini", blurb: "Dört yüzünde saat, köyün buluşma yeri.", look: { wall: "stone", roof: 5, clock: true } },
  { id: "amfi", name: "Gergi Çadır Amfi", emoji: "🎭", class: "large", kind: "house", category: "fancy", cost: 130, done: "amfi tiyatrosunu", blurb: "Beton basamaklar, sahne ve iki direkten gerilmiş beyaz membran.", look: { special: "gergi" } },
  { id: "sukulesi", name: "Su Kulesi", emoji: "💧", class: "large", kind: "tower", category: "work", cost: 110, done: "su kulesini", blurb: "Altı kolon, kuşak kirişler, tepede Intze hazne; mavi kuşaklı.", look: { special: "sukulesi" } },
  { id: "kapsul", name: "Kapsül Kule", emoji: "🧊", class: "large", kind: "tower", category: "fancy", cost: 135, done: "kapsül kulesini", blurb: "Beton çekirdeğe bulonlanmış fabrika yapımı odalar; her birinde yuvarlak pencere.", look: { special: "kapsul" } },
  { id: "burgu", name: "Burgulu Kule", emoji: "🌀", class: "large", kind: "tower", category: "fancy", cost: 145, done: "burgulu kulesini", blurb: "Her katı bir alttakine göre 9° dönen cam kule.", look: { special: "burgu" } },
  { id: "pisa", name: "Pisa Kulesi", emoji: "🗼", class: "large", kind: "tower", category: "famous", cost: 160, done: "Pisa Kulesi'ni", blurb: "1173'te yumuşak kile 3 m temel; 94 yıl ara, eğik devam, 2001'de 3,97°'ye düzeltme.", look: { special: "pisa" } },
  { id: "kolezyum", name: "Kolezyum", emoji: "🏟️", class: "large", kind: "house", category: "famous", cost: 180, done: "Kolezyum'unu", blurb: "Nero'nun gölü kurutulur; traverten ayaklar, üç kat kemer, mermer basamaklar ve velarium.", look: { special: "kolezyum" } },
  { id: "keops", name: "Keops Piramidi", emoji: "🔺", class: "large", kind: "house", category: "famous", cost: 200, done: "Keops Piramidi'ni", blurb: "2,3 milyon blok, kızaklar ve rampalar; tepede altın piramidion, en son beyaz Tura kaplama.", look: { special: "keops" } },
  { id: "galata", name: "Galata Kulesi", emoji: "🗼", class: "large", kind: "tower", category: "famous", cost: 150, done: "Galata Kulesi'ni", blurb: "1348 Ceneviz yapısı; dipte 3,75 m moloz taş, taş konsollu balkon, 1875'te uçan, 1967'de dönen külah.", look: { special: "galata" } },
  { id: "suleymaniye", name: "Süleymaniye Camii", emoji: "🕌", class: "large", kind: "house", category: "famous", cost: 190, done: "Süleymaniye'sini", blurb: "Mimar Sinan, 1557: fil ayakları, iki yarım kubbe, 53 m'lik ana kubbe, dört minare ve on şerefe.", look: { special: "suleymaniye" } },
  { id: "anitkabir", name: "Anıtkabir", emoji: "🇹🇷", class: "large", kind: "house", category: "famous", cost: 190, done: "Anıtkabir'ini", blurb: "Rasattepe, 1944-1953: traverten kaplı Şeref Holü, 40 tonluk lahit taşı, Aslanlı Yol ve on kule.", look: { special: "anitkabir" } },
  { id: "eyfel", name: "Eyfel Kulesi", emoji: "🗼", class: "large", kind: "tower", category: "famous", cost: 200, done: "Eyfel Kulesi'ni", blurb: "1889: 18.038 demir parça, 2,5 milyon perçin; ayaklar ahşap iskelelerde buluşur, yürüyen vinçler tırmanır.", look: { special: "eyfel" } },
  { id: "sidney", name: "Sidney Opera Binası", emoji: "🎶", class: "large", kind: "house", category: "famous", cost: 210, done: "Sidney Opera Binası'nı", blurb: "Utzon'un küresel çözümü: 2.194 prekast nervür parçası, 1.056.006 İsveç karosu, cam ağızlı kabuklar.", look: { special: "sidney" } },
  { id: "burj", name: "Burj Khalifa", emoji: "🏙️", class: "large", kind: "tower", category: "famous", cost: 250, done: "Burj Khalifa'sını", blurb: "828 m: Y planlı payandalı çekirdek, sarmal kademeli kanatlar, içeriden krikoyla itilen sivri uç.", look: { special: "burj" } },
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
  { id: "agacevi", name: "Ağaç Evi", emoji: "🌳", class: "small", kind: "cottage", category: "home", cost: 65, rare: true, done: "ağaç evini", blurb: "Canlı ağaca zarar vermeyen bağımsız ayaklar, ahşap balkon, ip korkuluk ve okuma köşesi.", look: { special: "treehouse" } },
  { id: "japoncay", name: "Japon Çay Evi", emoji: "🍵", class: "small", kind: "cottage", category: "fancy", cost: 55, rare: true, done: "Japon çay evini", blurb: "Kıvrık saçaklı kiremit çatı, shoji paneller, taş patika ve küçük bir zen bahçesi.", look: { special: "teahouse" } },
  { id: "sudegirmeni", name: "Su Değirmeni", emoji: "🛞", class: "medium", kind: "house", category: "work", cost: 110, rare: true, done: "su değirmenini", blurb: "Taş temel, ahşap karkas, dere kanalı ve tek tek takılan kanatlı büyük su çarkı.", look: { special: "watermill" } },
  { id: "istasyon", name: "Tren İstasyonu", emoji: "🚉", class: "medium", kind: "house", category: "fancy", cost: 115, rare: true, done: "tren istasyonunu", blurb: "Kiremitli istasyon, saatli çatı, peron saçağı, banklar ve traversli kısa bir ray hattı.", look: { special: "station" } },
  { id: "planetaryum", name: "Planetaryum", emoji: "🪐", class: "large", kind: "house", category: "fancy", cost: 190, rare: true, done: "planetaryumunu", blurb: "Bakır kuşaklı yıldız kubbesi, takımyıldız cephesi, taş giriş ve Satürn heykeli.", look: { special: "planetarium" } },
  { id: "kristalkutuphane", name: "Kristal Kütüphane", emoji: "💎", class: "large", kind: "house", category: "work", cost: 180, rare: true, done: "kristal kütüphanesini", blurb: "Çapraz çelik iskelet, ışıklı kitap rafları ve kristal gibi katlanan cam okuma salonu.", look: { special: "crystallibrary" } },
  {"id": "kapadokya", "name": "Kapadokya Kaya Evi", "emoji": "🪨", "class": "small", "kind": "cottage", "category": "famous", "cost": 80, "rare": true, "done": "kaya evini", "blurb": "Doğal peribacaları, oyma odalar, kemerli açıklıklar ve taş basamaklar.", "look": {"special": "cappadocia"}},
  {"id": "yuzenev", "name": "Yüzen Ev", "emoji": "🛟", "class": "small", "kind": "cottage", "category": "fancy", "cost": 90, "rare": true, "done": "yüzen evini", "blurb": "Ponton tabanı, ahşap teras, bağlama halatları ve güneş paneli.", "look": {"special": "floating"}},
  {"id": "asmakopru", "name": "Asma Köprü", "emoji": "🌉", "class": "medium", "kind": "house", "category": "fancy", "cost": 120, "rare": true, "done": "asma köprüsünü", "blurb": "İki kule, eğri ana kablolar, tek tek askılar ve ahşap yaya tabliyesi.", "look": {"special": "suspension"}},
  {"id": "kervansaray", "name": "Kervansaray", "emoji": "🧳", "class": "medium", "kind": "house", "category": "fancy", "cost": 150, "rare": true, "done": "kervansarayını", "blurb": "Açık avlu, taş revaklar, taçkapı ve ortada serin bir çeşme.", "look": {"special": "caravanserai"}},
  {"id": "mardinevi", "name": "Mardin Evi", "emoji": "🏛️", "class": "medium", "kind": "house", "category": "famous", "cost": 130, "rare": true, "done": "Mardin evini", "blurb": "Sarı kalker duvarlar, kemerli pencereler, teras ve dış merdiven.", "look": {"special": "mardin"}},
  {"id": "atakule", "name": "Atakule", "emoji": "🗼", "class": "large", "kind": "tower", "category": "famous", "cost": 210, "rare": true, "done": "Atakule yapısını", "blurb": "Ankara’nın ince betonarme gövdesi, cam seyir kuşağı ve geniş restoran başlığı.", "look": {"special": "atakule"}},
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
export const JOIN_LEAD = 5 * 60000; // joining a friend's session needs this much of it left (d28)
export const RUIN_DAYS = 3; // rubble left uncleared this long takes its 30% with it
export const CHAIN_GAP = 10.5 * 60000; // a break of up to ten minutes keeps a streak going

// n40, dürüst dakika: minutes count only while the app sees you. The app beats
// every 20 seconds while it is on screen (on a computer, while the tab is open
// and you answer "orada mısın?"). A longer silence is time away: it is taken off
// a free session, and in build mode it shakes the site.
export const BEAT_EVERY = 20000;
export const BEAT_GAP = 90000; // a silence longer than this is time away
export const FREE_LEAVE = 5 * 60000; // away longer than this ends a free session
export const HONEST_MIN = 20; // a free session counts only with this many minutes seen
// Build mode on a phone: leaving the app gives five quiet seconds (a stray
// tap is free), then a notification counts 10, 9 … 1, buzzing every second.
export const LEAVE_GRACE = 5000;
export const COUNTDOWN = 10;
export const BUILD_LEAVE = LEAVE_GRACE + COUNTDOWN * 1000; // back within 15 seconds…
export const RESCUE_WINDOW = 5 * 60000; // …or the site cracks, and can be saved for five more minutes
export const RESCUE_HOLD = BUILD_LEAVE + RESCUE_WINDOW + 40000; // the server waits this long (two missed beats of slack)
export const RESCUE_SHARE = 0.2; // saving it costs a fifth of the session in extra minutes (25 → 5, 50 → 10, 75 → 15)
export const rescueMinutes = (minutes) => Math.max(1, Math.round(minutes * RESCUE_SHARE));
/** Minutes a free session was seen: its length less the time away, ending at the last beat if you never came back. */
export function seenMinutes({ start, ends, beat, away = 0 }) {
  let end = ends,
    gone = away;
  const tail = ends - beat;
  if (tail > FREE_LEAVE) end = beat;
  else if (tail > BEAT_GAP) gone += tail - BEAT_EVERY;
  return Math.max(0, Math.floor((Math.min(end, ends) - start - gone) / 60000));
}

// Imece: every friend focusing alongside you for at least half of your session.
export const IMECE_EACH = 0.05;
export const IMECE_MAX = 0.2;
export const imeceBonus = (friends, cafe = false) => Math.round(Math.min(IMECE_MAX, friends * (cafe ? 0.08 : IMECE_EACH)) * 100) / 100;

/** Streak bonus on the wage of the n-th session in a row: 2nd +10%, 3rd on +20%. */
export const streakBonus = (n) => (n >= 3 ? 0.2 : n === 2 ? 0.1 : 0);

// The week: Haftanın Ustası (most minutes last week) and the team's shared
// monument (a weekly goal of minutes, together).
export const MASTER_PRIZE = 50;
export const MONUMENT_PRIZE = 50;
export const monumentGoal = (members) => Math.max(600, 250 * members);

// ---------- studying together ----------
// A team rhythm aligns everyone's rounds to the clock, so breaks are shared:
// 50+10 runs from every full hour, 25+5 from every half hour.
export const RHYTHMS = {
  "50-10": { work: 50, rest: 10, label: "50+10" },
  "25-5": { work: 25, rest: 5, label: "25+5" },
};
export function rhythmAt(id, now) {
  const r = RHYTHMS[id];
  if (!r) return null;
  const cycle = (r.work + r.rest) * 60000,
    start = Math.floor(now / cycle) * cycle, // Türkiye is a whole number of hours from UTC
    workEnd = start + r.work * 60000;
  return { ...r, id, cycle, roundStart: start, workEnd, nextRound: start + cycle, inBreak: now >= workEnd };
}
/** When a session started now ends under the rhythm: with this round's work, or
 *  the next round's when less than 12 minutes are left (or it is break time). */
export function rhythmEnd(id, now) {
  const r = rhythmAt(id, now);
  if (!r) return null;
  return !r.inBreak && r.workEnd - now >= 12 * 60000 ? r.workEnd : r.nextRound + r.work * 60000;
}
/** Çay molası: one pause a build-mode session may take without collapsing. */
export const teaBreakFor = (minutes) => (minutes >= 70 ? 10 : minutes >= 40 ? 5 : 0) * 60000;

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
  master: "Haftanın Ustası",
  monument: "Ortak anıt",
  cost: "Malzeme",
  refund: "İade",
  "ruin-refund": "Enkaz kaldırıldı",
  grant: "Batur'dan",
  gift: "Batur'dan hediye yapı",
};
