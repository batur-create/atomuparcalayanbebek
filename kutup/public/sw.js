self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("push", (event) => {
  let payload = { title: "Kütüp", body: "Ekibinden haber var." };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {}
  // Arrivals stay on screen until dismissed (Android/desktop) and buzz harder.
  // Options a browser does not know (iOS ignores most) are simply skipped.
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/badge-96.png", // Android's status bar: the K alone, in white
      tag: payload.tag || "kutup",
      renotify: true,
      requireInteraction: !!payload.sticky,
      vibrate: payload.sticky ? [300, 120, 300, 120, 600] : [200, 100, 200],
      data: { url: payload.url || "/", account: payload.account || "" },
    }),
  );
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
