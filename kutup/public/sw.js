self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
const show = (payload) =>
  self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/badge-96.png", // Android's status bar: the K alone, in white
    tag: payload.tag || "kutup",
    renotify: true,
    requireInteraction: !!payload.sticky,
    vibrate: payload.left ? [400] : payload.sticky ? [300, 120, 300, 120, 600] : [200, 100, 200],
    data: { url: payload.url || "/", account: payload.account || "" },
  });
// n40: the leave countdown. Once it starts, this worker counts 10, 9 … 1 by
// itself, one notification a second under the same tag (each one a buzz), and
// stops the moment a Kütüp window is visible again. The server's pushes for
// the same countdown only move the number when this worker was asleep.
let counting = null;
const visible = () =>
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => list.some((c) => c.visibilityState === "visible"));
const clearBuild = () =>
  self.registration.getNotifications({ tag: "kutup-build" }).then((list) => list.forEach((n) => n.close()));
function countdown(payload) {
  if (counting) {
    counting.left = Math.min(counting.left, payload.left);
    return counting.done;
  }
  const state = { left: payload.left };
  counting = state;
  state.done = (async () => {
    try {
      while (state.left > 0) {
        if (await visible()) return clearBuild();
        const left = state.left;
        await show({ ...payload, title: `⏳ ${left}`, body: left <= 3 ? "Son saniyeler, binan çatlamak üzere!" : "Kütüp'e dön, yoksa binan çatlar.", left });
        await new Promise((r) => setTimeout(r, 1000));
        state.left = Math.min(state.left, left - 1);
      }
      if (payload.done && !(await visible())) await show({ ...payload, ...payload.done, left: 0 });
    } finally {
      counting = null;
    }
  })();
  return state.done;
}
// The page says "I was hidden" as it goes; after the quiet seconds this worker
// starts the countdown itself, without waiting for the server's push.
self.addEventListener("message", (event) => {
  const job = event.data?.leave;
  if (!job) return;
  event.waitUntil(
    (async () => {
      await new Promise((r) => setTimeout(r, job.grace));
      if (await visible()) return;
      if (job.left > 0) return countdown(job);
      if (!counting) return show(job);
    })().catch(() => {}),
  );
});
self.addEventListener("push", (event) => {
  let payload = { title: "Kütüp", body: "Ekibinden haber var." };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {}
  if (payload.left > 0) return event.waitUntil(countdown(payload));
  // Arrivals stay on screen until dismissed (Android/desktop) and buzz harder.
  // Options a browser does not know (iOS ignores most) are simply skipped.
  event.waitUntil(show(payload));
});
// The browser can rotate a subscription on its own; register the new one right
// away instead of waiting for the next time the app is opened.
const keyBytes = (text) => {
  const raw = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      let subscription = event.newSubscription;
      if (!subscription) {
        let key = event.oldSubscription?.options?.applicationServerKey;
        if (!key) {
          const session = await fetch("/api/session").then((r) => (r.ok ? r.json() : null));
          if (!session?.pushPublicKey) return;
          key = keyBytes(session.pushPublicKey);
        }
        subscription = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      }
      // Every account on this device that used the old one moves with it (n25).
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Kutup": "1" },
        body: JSON.stringify({ subscription: subscription.toJSON(), previous: event.oldSubscription?.endpoint }),
      });
    })().catch(() => {}),
  );
});
// Open the tab the notification is about (board, plans…), reusing an open window,
// in the account it was sent to (?as=, when the phone holds several, n25).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
  if (event.notification.data?.account) target.searchParams.set("as", event.notification.data.account);
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        for (const client of clients) {
          if (new URL(client.url).origin !== target.origin) continue;
          await client.focus();
          if ("navigate" in client && client.url !== target.href)
            await client.navigate(target.href).catch(() => {});
          return;
        }
        return self.clients.openWindow(target.href);
      }),
  );
});
