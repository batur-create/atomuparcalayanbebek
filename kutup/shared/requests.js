// "Batur’a ilet" request tracking, shared by the API (labels in push messages,
// allowed transitions) and the UI (tracker steps, fun status lines).

export const REQUEST_KINDS = ["idea", "bug", "hello"];

// The happy path for each kind: [status, label, emoji].
export const REQUEST_STEPS = {
  idea: [
    ["new", "Gönderildi", "📮"],
    ["seen", "İncelendi", "👀"],
    ["accepted", "Kabul edildi", "🎉"],
    ["building", "Yapılıyor", "🛠️"],
    ["done", "Yayında", "🚀"],
  ],
  bug: [
    ["new", "Bildirildi", "📮"],
    ["seen", "İncelendi", "👀"],
    ["accepted", "Onaylandı", "🐛"],
    ["building", "Tamir ediliyor", "🔧"],
    ["done", "Düzeltildi", "✅"],
  ],
  hello: [
    ["new", "Gönderildi", "📮"],
    ["seen", "Okundu", "👀"],
    ["done", "Cevaplandı", "💌"],
  ],
};

// The side exit. Small talk ("hello") has nothing to reject.
export const DECLINED = {
  idea: ["Bu sefer olmadı", "🙈"],
  bug: ["Hata bulunamadı", "🔍"],
};

export function allowedStatuses(kind) {
  const steps = (REQUEST_STEPS[kind] || []).map(([status]) => status);
  return DECLINED[kind] ? [...steps, "declined"] : steps;
}

export function statusLabel(kind, status) {
  if (status === "declined") return DECLINED[kind] || ["Kapandı", "🫶"];
  const step = (REQUEST_STEPS[kind] || REQUEST_STEPS.idea).find(([s]) => s === status);
  return step ? [step[1], step[2]] : ["Gönderildi", "📮"];
}

// What the sender reads under the tracker.
export function statusLine(kind, status) {
  const lines = {
    new: "Batur’un kutusunda, sırasını bekliyor",
    seen:
      kind === "hello"
        ? "Batur okudu. Gülümsedi bile olabilir 🙂"
        : "Batur açtı, inceledi. Karar aşamasında 🤔",
    accepted:
      kind === "bug"
        ? "Hata onaylandı. Tamir listesine girdi 🐛"
        : "Kabul edildi! Yapılacaklar listesine girdi 🎉",
    building:
      kind === "bug"
        ? "Şu an tamir ediliyor, anahtarlar elde 🔧"
        : "Şu an üzerinde çalışılıyor, kod yazılıyor 🛠️",
    done:
      kind === "bug"
        ? "Düzeltildi! Bir daha dene bakalım ✅"
        : kind === "hello"
          ? "Batur cevapladı, notuna bak 💌"
          : "Yayında! Uygulamada görebilirsin 🚀",
    declined:
      kind === "bug"
        ? "Batur bu hatayı yakalayamadı. Notuna bak 🔍"
        : "Bu sefer olmadı. Notuna bak, belki bir dahakine 🙈",
  };
  return lines[status] || lines.new;
}

// Push notification sent to the person who wrote the request.
export function statusPush(kind, status) {
  const [label, emoji] = statusLabel(kind, status);
  const titles = {
    seen: "Batur isteğine baktı 👀",
    accepted: kind === "bug" ? "Bildirdiğin hata onaylandı 🐛" : "İsteğin kabul edildi 🎉",
    building: kind === "bug" ? "Hata tamir ediliyor 🔧" : "İsteğin yapılıyor 🛠️",
    done:
      kind === "bug"
        ? "Hata düzeltildi ✅"
        : kind === "hello"
          ? "Batur cevap yazdı 💌"
          : "İsteğin yayında! 🚀",
    declined: `${label} ${emoji}`,
  };
  return titles[status] || `${label} ${emoji}`;
}
