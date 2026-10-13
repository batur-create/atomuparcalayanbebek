export async function api(path, body, method = "POST", extraHeaders = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Kutup": "1",
        ...extraHeaders,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    const error = new Error("İnternet bağlantısı yok gibi. Tekrar deneyelim.");
    error.status = 0;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.error || "Bağlantı kurulamadı. Tekrar deneyelim.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const get = (path) => api(path, undefined, "GET");
export const AVATARS = [
  "🪐",
  "🌱",
  "🐈",
  "🌻",
  "🧋",
  "🍒",
  "🎧",
  "📚",
  "🦊",
  "🪼",
  "🍄",
  "🦋",
  "🐻",
  "🐼",
  "🦄",
  "🌙",
  "⭐",
  "🍓",
  "🌸",
  "🐸",
  "🧸",
  "🍵",
  "🎨",
  "🐝",
];
export const COLORS = ["lilac", "mint", "peach", "blue", "pink", "lemon"];
export const COLOR_NAMES = {
  lilac: "Lavanta",
  mint: "Matcha",
  peach: "Şeftali",
  blue: "Gökyüzü",
  pink: "Çilek",
  lemon: "Limon",
};
export const THEMES = ["lilac", "mint", "peach", "pink", "blue"];
export const STATUS = {
  here: ["Kütüpte", "here"],
  coming: ["Yolda", "coming"],
  break: ["Molada", "break"],
  away: ["Dışarıda", "away"],
};
export const FEEDBACK = {
  idea: ["💡", "Bir fikrim var", "Şöyle bir özellik olsa…"],
  bug: ["🐛", "Bir şey bozuldu", "Neye bastın, ne olmasını bekledin?"],
  hello: ["💬", "İki çift laf", "İçinden ne geçiyorsa. Batur okuyor."],
};
export function shortTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}
export function dateLabel(timestamp) {
  return new Date(timestamp).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });
}
export function dayInput(offset = 0) {
  const d = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
// "Bugün", "Yarın", "Cumartesi" or "24 Ekim" for plan dates.
export function dayWord(timestamp) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(timestamp);
  if (day === dayInput()) return "Bugün";
  if (day === dayInput(1)) return "Yarın";
  if (timestamp - Date.now() < 6 * 86400000)
    return new Date(timestamp).toLocaleDateString("tr-TR", {
      weekday: "long",
      timeZone: "Europe/Istanbul",
    });
  return dateLabel(timestamp);
}
// "35 dakikadır" / "2 saattir" — how long someone has been in their current status.
export function sinceLabel(since, now) {
  if (!since) return "";
  const minutes = Math.max(0, Math.floor((now - since) / 60000));
  if (minutes < 1) return "";
  if (minutes < 60) return `${minutes} dakikadır`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} saat ${minutes % 60} dakikadır` : `${hours} saattir`;
}
export const minutesLabel = (minutes) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)} sa${minutes % 60 ? ` ${minutes % 60} dk` : ""}`
    : `${minutes} dk`;

const now = Date.now();
const tomorrowMorning = new Date(`${dayInput(1)}T09:30:00+03:00`).getTime();
const ago = (days) => now - days * 86400000;
export const DEMO = {
  group: { name: "Bizim tayfa", invite: "demo", rev: 0 },
  members: [
    {
      id: "elif",
      name: "Elif",
      avatar: "🍒",
      color: "pink",
      note: "bir kahve, üç makale",
      status: "here",
      location: "1. kat · Sessiz salon",
      desk: "24",
      since: now - 95 * 60000,
      focusToday: 75,
      focusWeek: 240,
      buildsWeek: 2,
      buildings: 5,
      focusEnd: 0,
    },
    {
      id: "deniz",
      name: "Deniz",
      avatar: "🪐",
      color: "lilac",
      note: "final boss: finaller",
      status: "here",
      location: "1. kat · Sessiz salon",
      desk: "26",
      since: now - 40 * 60000,
      focusToday: 50,
      focusWeek: 175,
      focusEnd: now + 18 * 60000,
      focusMinutes: 25,
      focusStrict: 1,
      focusSeed: 4242,
      buildings: 3,
    },
    {
      id: "ege",
      name: "Ege",
      avatar: "🎧",
      color: "mint",
      note: "lo-fi açıldı, dünya kapandı",
      status: "break",
      location: "Kafeterya",
      desk: "",
      since: now - 6 * 60000,
      focusToday: 100,
      focusWeek: 300,
      buildsWeek: 1,
      buildings: 2,
      focusEnd: 0,
    },
    {
      id: "zeynep",
      name: "Zeynep",
      avatar: "🌻",
      color: "peach",
      note: "gelirken kahve alırım ☕",
      status: "coming",
      arrival: "30 dakika içinde",
      location: "",
      desk: "",
      since: now - 4 * 60000,
      focusToday: 0,
      focusWeek: 95,
      focusEnd: 0,
    },
  ],
  messages: [
    {
      id: "a",
      memberId: "elif",
      text: "Pencere kenarında iki yer var, gelen kapsın 🌞",
      kind: "message",
      created: now - 12 * 60000,
      reactions: ["deniz", "ege"],
    },
    {
      id: "b",
      memberId: "zeynep",
      text: "Yoldayım! Kahve isteyen var mı?",
      kind: "message",
      created: now - 3 * 60000,
      reactions: ["elif"],
    },
  ],
  buildings: [
    ["elif", "cottage", 101, 9],
    ["elif", "house", 202, 7],
    ["elif", "cottage", 303, 5],
    ["elif", "tower", 404, 3],
    ["elif", "house", 505, 1],
    ["deniz", "house", 606, 6],
    ["deniz", "cottage", 707, 4],
    ["deniz", "tower", 808, 2],
    ["ege", "tower", 909, 5],
    ["ege", "cottage", 111, 2],
  ].map(([memberId, kind, seed, days], i) => ({
    id: `b${i}`,
    memberId,
    kind,
    seed,
    minutes: kind === "tower" ? 75 : kind === "house" ? 50 : 25,
    created: ago(days),
  })),
  plans: [
    {
      id: "p",
      memberId: "ege",
      starts: tomorrowMorning,
      note: "Sabah erkenciler kulübü",
      attendees: ["ege", "elif"],
    },
  ],
};
