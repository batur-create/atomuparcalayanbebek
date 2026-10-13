self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("push", (event) => {
  let payload = { title: "Kütüp", body: "Ekibinden haber var." };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      tag: payload.tag || "kutup",
      data: { url: payload.url || "/" },
    }),
  );
});
// Open the tab the notification is about (board, plans…), reusing an open window.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
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
