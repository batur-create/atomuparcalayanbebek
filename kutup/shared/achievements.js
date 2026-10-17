// Başarımlar (n14): what each one is and what it takes. The server works out
// who has earned what from the logs (server/achievements.js), so everything
// already done before this list existed counts too. Hidden ones show as "???"
// until found. Thresholds live here: change a number, and the next look
// re-checks everyone (badges already earned stay).
export const ACHIEVEMENTS = [
  { key: "first-build", name: "İlk tuğla", how: "İlk yapını bitir.", need: 1, unit: "yapı" },
  { key: "week-streak", name: "Bir hafta", how: "7 gün üst üste odaklan.", need: 7, unit: "gün" },
  { key: "month-streak", name: "Bir ay", how: "30 gün üst üste odaklan.", need: 30, unit: "gün" },
  { key: "early", name: "Sabah erkencisi", how: "09.00'dan önce başlayan 5 oturum (30 dk+).", need: 5, unit: "oturum" },
  { key: "night", name: "Gece kuşu", how: "21.00 ile 04.00 arası başlayan 5 oturum (30 dk+).", need: 5, unit: "oturum" },
  { key: "marathon", name: "Maraton", how: "Bir günde 4 saat odaklan.", need: 240, unit: "dk" },
  { key: "hundred", name: "Yüz saat", how: "Toplam 100 saat odaklan.", need: 6000, unit: "dk" },
  { key: "imece", name: "İmece ustası", how: "Arkadaşlarınla aynı anda 10 oturum bitir.", need: 10, unit: "oturum" },
  { key: "collector", name: "Koleksiyoncu", how: "Köye 8 farklı yapı kazandır.", need: 8, unit: "çeşit" },
  { key: "loved", name: "Gönüllerin mimarı", how: "Bir yapın 5 beğeni alsın.", need: 5, unit: "beğeni" },
  { key: "regular", name: "Müdavim", how: "20 ayrı gün kütübe gel.", need: 20, unit: "gün" },
  { key: "master", name: "Haftanın Ustası", how: "Bir hafta ekibin en çok odaklananı ol.", need: 1, unit: "taç" },
  { key: "monument", name: "Anıt ustası", how: "Ekibinle haftanın anıtını tamamla.", need: 1, unit: "anıt" },
  { key: "black-hole", name: "Kara delik kâşifi", how: "Gizli kapıyı bul.", need: 1, hidden: true },
  { key: "shush", name: "Şşşt!", how: "Panoda bağır. Burası kütüphane.", need: 1, hidden: true },
  { key: "tea", name: "Çay saati", how: "Panoya yalnızca “çay” yaz.", need: 1, hidden: true },
];
export const BY_KEY = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, a]));
// The secrets the page itself reports (the server can't see them happen).
export const REPORTED = ["black-hole"];

export { shouting, teaCall } from "./pano.js";
