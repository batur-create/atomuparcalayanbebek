self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
const show = async (payload) => {
  if (Number.isFinite(payload.buildProgress) && payload.tag) {
    const previous = (await self.registration.getNotifications({ tag: payload.tag }))[0];
    // Provider delivery order can differ from enqueue order: never regress a visible build.
    if (previous?.data?.buildEnd === payload.buildEnd && previous.data.buildProgress > payload.buildProgress)
      payload = { ...payload, title: previous.title, body: previous.body, buildProgress: previous.data.buildProgress, quiet: true };
  }
  return self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/badge-96.png",
    tag: payload.tag || "kutup",
    renotify: payload.quiet !== true,
    silent: payload.quiet === true,
    requireInteraction: !!payload.sticky,
    ...(payload.quiet === true ? {} : { vibrate: payload.tick ? [500] : payload.sticky ? [300, 120, 300, 120, 600] : [200, 100, 200] }),
    data: { url: payload.url || "/", account: payload.account || "", started: payload.started || 0, crack: !!payload.crack, buildEnd: payload.buildEnd || 0, buildProgress: payload.buildProgress ?? null },
  });
};
// n40: leaving a build on the phone. One countdown per absence: it starts once
// (from the page as it hides, or the server's single push, whichever comes
// first) and never again until the app has been seen. On Android this worker
// redraws the same notification every second, 10 … 1, each redraw a buzz; an
// iPhone cannot redraw or buzz a web notification, so it gets one notification
// with the deadline and one when the site cracks.
const BUILD = "kutup-build";
const ios = /iPhone|iPad|iPod/.test(self.navigator.userAgent);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const visible = () =>
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => list.some((c) => c.visibilityState === "visible"));
const shown = () => self.registration.getNotifications({ tag: BUILD });
const clearBuild = () => shown().then((list) => list.forEach((n) => n.close()));
let counting = null, // the countdown running now
  lastStart = 0; // when the last one started (memory; the notification's data keeps it too)
async function countdown(job) {
  if (counting) return counting;
  const now = Date.now();
  const earlier = (await shown()).some((n) => now - (n.data?.started || 0) < 60000);
  if (now - lastStart < 60000 || earlier) return;
  lastStart = now;
  const base = { ...job, tag: BUILD, sticky: true, started: now };
  counting = (async () => {
    if (ios) return show({ ...base, title: `⏳ ${job.countdown} sn içinde dön!`, body: "Kütüp'e dön, yoksa binan çatlar." });
    for (let left = job.countdown; left > 0; left--) {
      if (await visible()) return clearBuild();
      await show({ ...base, tick: true, title: `⏳ ${left}`, body: left <= 3 ? "Son saniyeler! Kütüp'e dön, yoksa binan çatlar." : "Kütüp'e dön, yoksa binan çatlar." });
      await wait(1000);
    }
    if (await visible()) return clearBuild();
    await show({ ...base, ...job.done, crack: true });
  })().finally(() => (counting = null));
  return counting;
}
// The page says "I am being hidden"; after the quiet seconds the countdown
// starts here, without waiting for the network.
self.addEventListener("message", (event) => {
  // Back in the app: the next absence gets its own countdown.
  if (event.data?.back) return event.waitUntil(clearBuild().then(() => (lastStart = 0)));
  const job = event.data?.leave;
  if (!job) return;
  event.waitUntil(
    (async () => {
      await wait(job.grace);
      if (await visible()) return;
      if (job.countdown > 0) return countdown(job);
      return show({ ...job, tag: BUILD });
    })().catch(() => {}),
  );
});
self.addEventListener("push", (event) => {
  let payload = { title: "Kütüp", body: "Ekibinden haber var." };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {}
  if (payload.countdown > 0)
    return event.waitUntil(
      (async () => {
        await countdown({ ...payload, done: { title: "🩹 Binan çatladı!", body: "5 dakika içinde dönersen bir kez kurtarabilirsin." } });
        // Something must be on screen for every push; the countdown's notification is.
        if (!counting && !(await shown()).length && !(await visible())) await show(payload);
      })().catch(() => {}),
    );
  if (payload.crack)
    return event.waitUntil(
      (async () => {
        if (counting) await counting;
        // The countdown here already said it: change the words without a second buzz.
        const already = (await shown()).some((n) => n.data?.crack);
        await show({ ...payload, quiet: already, started: Date.now() });
      })().catch(() => {}),
    );
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
