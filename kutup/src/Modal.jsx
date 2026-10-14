import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({ title, subtitle, children, close, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const backdrop = ref.current.closest(".modal-backdrop");
    const siblings = [...document.body.children].filter((el) => el !== backdrop);
    const inert = siblings.map((el) => el.inert);
    siblings.forEach((el) => { el.inert = true; });
    document.body.style.overflow = "hidden";
    ref.current.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key !== "Tab") return;
      const elements = [...ref.current.querySelectorAll(
        'a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
      )].filter((el) => el.getClientRects().length && !el.hidden);
      const first = elements[0], last = elements.at(-1);
      if (!first) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      siblings.forEach((el, i) => { el.inert = inert[i]; });
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section ref={ref} tabIndex={-1} className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="icon-button modal-close" aria-label="Kapat" onClick={close}><X size={21} /></button>
        <h2>{title}</h2>
        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        {children}
      </section>
    </div>, document.body,
  );
}
