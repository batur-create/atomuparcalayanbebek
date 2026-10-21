// An open tab keeps running the app it was opened with, sometimes for days
// (n47): a laptop could show yesterday's rules beside today's session. Now and
// then, and whenever the tab comes back into view, it asks for the page again
// and reloads itself once a newer app is out, if `safe()` says it may.
const SCRIPT = /<script[^>]*type="module"[^>]*src="([^"]*\/assets\/[^"]+\.js)"/;
const EVERY = 10 * 60000;

export function watchForNewVersion(safe) {
  const mine = document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute("src");
  // The development server has no built app to compare.
  if (!mine) return () => {};
  let busy = false,
    newer = false;
  const check = async () => {
    if (busy || document.visibilityState !== "visible") return;
    busy = true;
    try {
      if (!newer) {
        const html = await fetch("/", { cache: "no-store", credentials: "same-origin" }).then((r) => (r.ok ? r.text() : ""));
        const latest = html.match(SCRIPT)?.[1];
        newer = !!latest && latest !== mine;
      }
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
      if (newer && !typing && safe()) location.reload();
    } catch {
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(check, EVERY);
  document.addEventListener("visibilitychange", check);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", check);
  };
}
