export async function api(path, body, method = "POST", extraHeaders = {}, signal) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      signal,
      headers: {
        "Content-Type": "application/json",
        "X-Kutup": "1",
        ...extraHeaders,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (cause) {
    if (cause.name === "AbortError") throw cause;
    const error = new Error("İnternet bağlantısı yok gibi. Tekrar deneyelim.");
    error.status = 0;
    throw error;
  }
  const data = await response.json().catch(() => {
    const error = new Error("Sunucudan yanıt okunamadı. Birazdan tekrar deneyelim.");
    error.status = response.ok ? 502 : response.status;
    throw error;
  });
  if (!response.ok) {
    const error = new Error(
      data.error || "Bağlantı kurulamadı. Tekrar deneyelim.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const get = (path, signal) => api(path, undefined, "GET", {}, signal);
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
  "🦉", "🐧", "🐙", "🦖", "🐢", "🦔", "🐳", "🌵", "🍀", "🍩", "🎸", "🧠",
];
// Only the profile with the founder's badge may wear these.
export const FOUNDER_AVATARS = ["✳", "🕳️", "🌌", "🛸", "🏗️"];
export const COLORS = ["lilac", "mint", "peach", "blue", "pink", "lemon", "slate", "sand", "olive"];
export const COLOR_NAMES = {
  lilac: "Lavanta",
  mint: "Matcha",
  peach: "Şeftali",
  blue: "Gökyüzü",
  pink: "Çilek",
  lemon: "Limon",
  slate: "Arduvaz",
  sand: "Kum",
  olive: "Zeytin",
  navy: "Lacivert",
  teal: "Petrol",
  amber: "Kehribar",
  graphite: "Grafit",
};
export const THEMES = ["lilac", "mint", "peach", "pink", "blue", "navy", "teal", "amber", "graphite"];
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
