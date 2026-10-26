import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { TAB_PATHS, legacyUrl, readRoute, stateUrl } from "./routes.js";
import "./navigation.css";

const Navigation = createContext(null);
const currentUrl = () => location.pathname + location.search + location.hash;
export function NavigationProvider({ children }) {
  const entry = useRef(history.state?.kutupEntry || crypto.randomUUID());
  const positions = useRef(new Map());
  const [visit, setVisit] = useState({ type: "load", position: null });
  const [url, setUrl] = useState(() => {
    const next = legacyUrl(location.href);
    history.replaceState({ ...history.state, kutupEntry: entry.current }, "", next);
    return next;
  });
  const urlRef = useRef(url);
  urlRef.current = url;
  const go = (href, { replace = false } = {}) => {
    const target = new URL(href, location.origin);
    if (target.origin !== location.origin) return;
    const next = target.pathname + target.search + target.hash;
    if (next === urlRef.current) return;
    positions.current.set(entry.current, [scrollX, scrollY]);
    if (!replace) entry.current = crypto.randomUUID();
    history[replace ? "replaceState" : "pushState"]({ ...history.state, kutupEntry: entry.current }, "", next);
    urlRef.current = next;
    setVisit({ type: replace ? "replace" : "push", position: null });
    setUrl(next);
  };
  useEffect(() => {
    const old = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const remember = () => {
      positions.current.set(entry.current, [scrollX, scrollY]);
      if (positions.current.size > 80) positions.current.delete(positions.current.keys().next().value);
    };
    const pop = () => {
      entry.current = history.state?.kutupEntry || crypto.randomUUID();
      urlRef.current = currentUrl(); setUrl(urlRef.current);
      setVisit({ type: "pop", position: positions.current.get(entry.current) || [0, 0] });
    };
    window.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("popstate", pop);
    return () => { history.scrollRestoration = old; window.removeEventListener("scroll", remember); window.removeEventListener("popstate", pop); };
  }, []);
  const route = readRoute(url);
  useEffect(() => {
    document.title = route.path === "/" ? "Kütüp — aynı masa, aynı motivasyon." : `${route.title} · Kütüp`;
    const description = route.path === "/" ? "Kim kütüpte? Arkadaşlarınla aynı yerde, aynı motivasyonda." : `${route.title}. Kütüp’te ekibinle aynı masa, aynı motivasyon.`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.append(robots); }
    robots.content = route.path === "/" ? "index, follow" : "noindex, nofollow";
  }, [route.path]);
  useEffect(() => {
    if (visit.type === "load") return;
    let frame, tries = 0, stopRestoring = () => {};
    const mainScreen = Object.values(TAB_PATHS).includes(route.path) || !route.found;
    const ready = () => {
      const main = document.querySelector("[data-route-main]");
      const stage = document.querySelector(`[data-route-tab="${route.tab}"]`);
      if ((!main || (mainScreen && !stage && route.found)) && ++tries < 120) { frame = requestAnimationFrame(ready); return; }
      if (visit.type === "pop" && visit.position) {
        // Lazy content can increase the height after the first restored paint.
        // Keep browser scroll anchoring from moving that saved position, and
        // settle again after layout changes. Any user input takes over at once.
        const html = document.documentElement, oldAnchor = html.style.overflowAnchor;
        html.style.overflowAnchor = "none";
        let quiet, resizeFrame, stopped = false;
        const stop = () => {
          if (stopped) return; stopped = true;
          clearTimeout(quiet); clearTimeout(cap); cancelAnimationFrame(resizeFrame);
          observer.disconnect(); html.style.overflowAnchor = oldAnchor;
          for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.removeEventListener(event, stop, true);
        };
        const restore = () => {
          if (stopped) return;
          window.scrollTo(...visit.position);
          clearTimeout(quiet); quiet = setTimeout(stop, 350);
        };
        const observer = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(restore); });
        const cap = setTimeout(stop, 2000);
        if (main) observer.observe(main);
        for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.addEventListener(event, stop, { capture: true, passive: true });
        stopRestoring = stop;
        restore();
      }
      else if (mainScreen) window.scrollTo(0, 0);
      // Dialogs manage their own focus, including restoring the opener.
      if (mainScreen && visit.type !== "replace" && main && !document.querySelector('[role="dialog"]')) {
        const target = stage?.querySelector("h1") || main;
        target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true });
      }
    };
    frame = requestAnimationFrame(ready);
    return () => { cancelAnimationFrame(frame); stopRestoring(); };
  }, [url, visit]);
  return <Navigation.Provider value={{ route, go, current: () => readRoute(urlRef.current) }}>{children}</Navigation.Provider>;
}

export function ConnectionStatus({ connected, retry }) {
  const [online, setOnline] = useState(navigator.onLine), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => { if (connected) setFailed(false); }, [connected]);
  if (online && connected && !failed) return null;
  return <div className="connection-banner" role="status"><span>{!online ? "İnternet bağlantısı yok. Bağlantı gelince bilgilerin eşitlenecek." : failed ? "Bağlantı henüz kurulamadı. Birazdan yeniden deneyebilirsin." : "Bağlantı yenileniyor. Son görülen bilgiler gösteriliyor."}</span>
    <button type="button" className="text-button" disabled={!online || busy} onClick={async () => {
      setBusy(true); try { await retry(); setFailed(false); } catch { setFailed(true); } finally { setBusy(false); }
    }}>{busy ? "Deneniyor…" : "Tekrar dene"}</button>
  </div>;
}
export const useNavigation = () => useContext(Navigation);

// A screen's URL is its state. The local fallback keeps isolated previews and
// existing component harnesses usable without mounting the whole application.
export function useScreenState(key, initial) {
  const nav = useNavigation(), [local, setLocal] = useState(initial);
  const value = nav ? nav.route[key] ?? (typeof initial === "function" ? initial() : initial) : local;
  const set = next => {
    if (!nav) return setLocal(next);
    const current = nav.current(), previous = current[key] ?? value;
    const result = typeof next === "function" ? next(previous) : next;
    if (result === previous) return;
    const href = stateUrl(key, result, current);
    if (href) nav.go(href, { replace: result === null || result === false });
  };
  return [value, set];
}
export function useEntityScreen(key, records) {
  const nav = useNavigation(), [local, setLocal] = useState(null);
  const [id, setId] = useScreenState(key, null);
  return nav ? [records.find(x => x.id === id) || null, x => setId(x?.id || null)] : [local, setLocal];
}
export function RouteLink({ href, onClick, children, ...props }) {
  const nav = useNavigation();
  return <a {...props} href={href} onClick={e => {
    onClick?.(e);
    if (!nav || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || props.target || props.download) return;
    if (new URL(href, location.origin).origin !== location.origin) return;
    // The owner desk keeps its separate bootstrap and authentication lifecycle.
    if (!!nav.route.ownerPage !== !!readRoute(href).ownerPage) return;
    e.preventDefault(); nav.go(href);
  }}>{children}</a>;
}
export function Breadcrumbs({ className = "", currentLabel }) {
  const nav = useNavigation();
  const [copied, setCopied] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => { setCopied(false); setFailed(false); }, [nav?.route.path]);
  useEffect(() => { if (!copied) return; const t = setTimeout(() => setCopied(false), 2500); return () => clearTimeout(t); }, [copied]);
  if (!nav || nav.route.crumbs.length < 2) return null;
  return <nav className={`breadcrumbs ${className}`} aria-label="Sayfa yolu"><ol>
    {nav.route.crumbs.map((crumb, i, all) => <li key={crumb.href}>
      {i > 0 && <span className="breadcrumb-separator" aria-hidden="true">/</span>}
      {i === all.length - 1 ? <span aria-current="page">{currentLabel || crumb.label}</span> : <RouteLink href={crumb.href}>{crumb.label}</RouteLink>}
    </li>)}
  </ol><button type="button" className="breadcrumb-copy" aria-label={copied ? "Bağlantı kopyalandı" : "Sayfa bağlantısını kopyala"} onClick={async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setFailed(false); }
    catch { setFailed(true); }
  }}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
  {copied && <span className="sr-only" role="status">Bağlantı kopyalandı.</span>}
  {failed && <label className="breadcrumb-fallback">Bağlantıyı seçip kopyalayabilirsin<input readOnly value={location.href} onFocus={e => e.target.select()} /></label>}
  </nav>;
}
