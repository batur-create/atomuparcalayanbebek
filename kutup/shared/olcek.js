// n44 ölçek: how big a building of its own stands in the village, from its
// real size. Shared by the server (the space a new building claims) and the
// app (how much its drawing is enlarged).
//
// Yardstick: one world unit is 1.6 m (kit.js M, the quantities use it too).
// An ordinary house storey is 1.85 units (3 m), its ridge 6.25 units (10 m);
// a site worker stands about 0.9 units (1.4-1.5 m, a little short, like every
// figure drawn on the site). Ordinary box buildings stay as they are: they
// are the small, near-real end of the scale.
//
// Real heights are compressed above a house's height so the village still
// fits on a phone: near-linear up to 10 m, then a power law. Plan sizes are
// compressed harder, so even the biggest landmark claims about a third of a
// district. The app enlarges every drawing by one uniform factor (no
// stretching: the pyramid keeps its slope, domes stay round):
//   k = max(1, min(height(real) / drawn height, claim(plan) / drawn radius))

export const METRE = 1.6;
export const PERSON = 1.75 / METRE;
const H0 = 10,
  ALPHA = 0.35,
  P0 = 12,
  BETA = 0.2,
  CLAIM_MAX = 6;

// boy: height to the top in metres (spire, minaret or flag pole included);
// plan: the largest span of what is drawn, in metres. Where the catalogue
// names no real building, a typical one of its kind.
export const REAL = {
  serender: { boy: 5, plan: 5, not: "Karadeniz serenderi: 1,5 m ayaklar üstünde ambar" },
  kerpic: { boy: 5, plan: 14, not: "Harran kümbet evleri: kubbe tepesi 4-5 m" },
  kubbe: { boy: 8, plan: 15, not: "15 m çaplı jeodezik kubbe ve fener" },
  konsol: { boy: 8, plan: 16, not: "iki katlı, 4,8 m konsollu ev" },
  pazar: { boy: 8, plan: 24, not: "Candela tipi şemsiye kabuklar" },
  kemer: { boy: 9, plan: 30, not: "15 m açıklıklı taş kemer köprü" },
  amfi: { boy: 14, plan: 34, not: "gergi membranlı amfi, direkler 14 m" },
  anitkabir: { boy: 27, plan: 150, not: "mozole 27 m (Şeref Holü sütunları 14,4 m); Tören Meydanı 129 × 84 m" },
  sukulesi: { boy: 30, plan: 12, not: "Intze tipi betonarme su kulesi" },
  kolezyum: { boy: 48, plan: 189, not: "48 m; elips 189 × 156 m" },
  kapsul: { boy: 54, plan: 20, not: "Nakagin Kapsül Kulesi, 13 kat" },
  pisa: { boy: 56, plan: 20, not: "55,9-56,7 m; çap 15,5 m" },
  sidney: { boy: 65, plan: 183, not: "en yüksek kabuk 65 m; 183 × 120 m" },
  galata: { boy: 67, plan: 17, not: "62,6 m, tepe süsüyle 66,9 m; çap 16,45 m" },
  suleymaniye: { boy: 76, plan: 104, not: "minareler 76 m, ana kubbe 53 m; cami ve avlu 104 × 58 m" },
  burgu: { boy: 90, plan: 30, not: "25 katlı burgulu konut kulesi" },
  keops: { boy: 147, plan: 230, not: "yapıldığında 146,6 m (bugün 138,5 m); taban 230 m" },
  eyfel: { boy: 330, plan: 125, not: "antenle 330 m; taban 125 m" },
  burj: { boy: 828, plan: 120, not: "828 m; Y planlı taban" },
};

/** World units a real height (m) is drawn at in the village. */
export const heightUnits = (m) => (m <= H0 ? m / METRE : (H0 / METRE) * (m / H0) ** ALPHA);
/** Radius (world units) a real plan span (m) may claim in a district. */
export const claimUnits = (m) => Math.min(CLAIM_MAX, m <= P0 ? m / 2 / METRE : (P0 / 2 / METRE) * (m / P0) ** BETA);
export const targetHeightOf = (model) => (REAL[model] ? heightUnits(REAL[model].boy) : null);
/** The space a building of its own claims around its centre, or null for a box building. */
export const claimOf = (model) => (REAL[model] ? claimUnits(REAL[model].plan) : null);
/** The uniform enlargement for a drawing `ridge` units tall and `reach` units across its widest radius. */
export function scaleFor(model, ridge, reach) {
  const r = REAL[model];
  if (!r || !(ridge > 0) || !(reach > 0)) return 1;
  return Math.max(1, Math.min(heightUnits(r.boy) / ridge, claimUnits(r.plan) / reach));
}
