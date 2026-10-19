// Yenilikler (n41): the dot on Ben until the newest version's notes are opened.
// The notes themselves load on demand once the phone is idle, so the first
// paint stays as light as before; which version was last opened is kept per device.
import { useEffect, useState } from "react";
import { storage } from "./ui.jsx";

const KEY = "kutup-yenilik";

export function useYenilik() {
  const [son, setSon] = useState(null);
  const [gorulen, setGorulen] = useState(() => Number(storage.get(KEY)) || 0);
  useEffect(() => {
    let live = true;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    idle(() => import("./yenilikler.js").then((m) => live && setSon(m.YENILIKLER[0]), () => {}), { timeout: 4000 });
    return () => {
      live = false;
    };
  }, []);
  // The window passes the newest version it showed, in case it opened before
  // the idle load above finished.
  const gordu = (surum) => {
    storage.set(KEY, String(surum));
    setGorulen((x) => Math.max(x, surum));
  };
  return { son, yeni: !!son && son.surum > gorulen, gorulen, gordu };
}
