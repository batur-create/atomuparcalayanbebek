import { useRef, useState } from "react";

// Pinch (two fingers), wheel or the buttons zoom the site; drag pans it when
// zoomed in; a double tap zooms in or back out.
export function useZoom({ wheel = true } = {}) {
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const box = useRef(null),
    pointers = useRef(new Map()),
    pinch = useRef(null),
    lastTap = useRef(0);
  const clampView = (v) => {
    const s = Math.min(4, Math.max(1, v.s)),
      el = box.current,
      w = el ? el.clientWidth : 0,
      h = el ? el.clientHeight : 0,
      mx = ((s - 1) * w) / 2,
      my = ((s - 1) * h) / 2;
    return { s, x: Math.max(-mx, Math.min(mx, v.x)), y: Math.max(-my, Math.min(my, v.y)) };
  };
  // Zoom by `k` keeping the screen point (cx, cy) where it is.
  const zoomAt = (k, cx, cy) =>
    setView((v) => {
      const el = box.current;
      if (!el) return v;
      const r = el.getBoundingClientRect(),
        px = cx - (r.left + r.width / 2),
        py = cy - (r.top + r.height / 2);
      const s = Math.min(4, Math.max(1, v.s * k)),
        f = s / v.s;
      return clampView({ s, x: px - (px - v.x) * f, y: py - (py - v.y) * f });
    });
  const center = () => {
    const r = box.current?.getBoundingClientRect();
    return r ? [r.left + r.width / 2, r.top + r.height / 2] : [0, 0];
  };
  const handlers = {
    // In a scrolling page the wheel keeps scrolling the page.
    onWheel: (e) => wheel && zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY),
    onPointerDown: (e) => {
      pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) };
      }
      const now = Date.now();
      if (pointers.current.size === 1 && now - lastTap.current < 300) {
        setView((v) => (v.s > 1.2 ? { s: 1, x: 0, y: 0 } : v));
        if (view.s <= 1.2) zoomAt(2, e.clientX, e.clientY);
      }
      lastTap.current = now;
    },
    onPointerMove: (e) => {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.current.size === 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        zoomAt(d / pinch.current.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        pinch.current.d = d;
      } else if (pointers.current.size === 1) {
        setView((v) => (v.s > 1 ? clampView({ ...v, x: v.x + e.clientX - prev[0], y: v.y + e.clientY - prev[1] }) : v));
      }
    },
    onPointerUp: (e) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
    },
  };
  handlers.onPointerCancel = handlers.onPointerUp;
  return {
    view,
    box,
    handlers,
    zoomIn: () => zoomAt(1.4, ...center()),
    zoomOut: () => zoomAt(1 / 1.4, ...center()),
    reset: () => setView({ s: 1, x: 0, y: 0 }),
  };
}

