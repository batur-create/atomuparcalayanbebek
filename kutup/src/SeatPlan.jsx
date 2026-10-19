import React, { useLayoutEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, Search } from "lucide-react";

const DETAIL = 1.8; // the shortest 25-unit seat is now at least 45 CSS pixels
const MAX = 2.4;

// A small, readable overview first; individual controls appear only at touch size.
export function SeatPlan({ room, desks, renderSeat }) {
  const plan = room.plan;
  const viewport = useRef(null), canvas = useRef(null), pending = useRef(null), drag = useRef(null);
  const [bounds, setBounds] = useState({ width: 300, height: 300 }), [view, setView] = useState({ zoom: null });
  const zoom = view.zoom;
  const setZoom = (next) => setView({ zoom: next });
  const [query, setQuery] = useState(""), [notice, setNotice] = useState("");
  const [active, setActive] = useState(plan.seats[0].number);
  const fit = Math.min(bounds.width / plan.width, bounds.height / plan.height, .6);
  const scale = zoom ?? fit, detail = scale >= DETAIL;
  useLayoutEffect(() => {
    const el = viewport.current;
    const measure = () => setBounds({ width: el.clientWidth, height: el.clientHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const point = pending.current;
    if (!point) return;
    const el = viewport.current;
    el.scrollLeft = point.x * scale - el.clientWidth / 2;
    el.scrollTop = point.y * scale - el.clientHeight / 2;
    if (point.number) el.querySelector(`[data-seat-number="${point.number}"]`)?.focus({ preventScroll: true });
    pending.current = null;
  });
  const changeZoom = (next, point) => {
    const el = viewport.current, box = canvas.current.getBoundingClientRect(), view = el.getBoundingClientRect();
    pending.current = point || {
      x: (view.left + el.clientWidth / 2 - box.left) / scale,
      y: (view.top + el.clientHeight / 2 - box.top) / scale,
    };
    setZoom(next);
  };
  const locate = (seat, focus = true) => {
    setActive(seat.number);
    changeZoom(Math.max(DETAIL, scale), { x: seat.x + seat.width / 2, y: seat.y + seat.height / 2, number: focus ? seat.number : null });
  };
  const search = (e) => {
    e.preventDefault();
    const seat = /^\d+$/.test(query.trim()) && plan.seats.find((s) => s.number === Number(query));
    if (!seat) { setNotice("1–425 arasında bir koltuk numarası yaz."); return; }
    setNotice(`Koltuk ${seat.number} haritada bulundu.`);
    locate(seat);
  };
  const keyboard = (e) => {
    if (!e.target.matches('[data-seat-number]')) return;
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!directions[e.key] && !['Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    let target;
    if (e.key === 'Home') target = plan.seats[0];
    else if (e.key === 'End') target = plan.seats.at(-1);
    else {
      const [dx, dy] = directions[e.key], from = plan.seats.find((s) => s.number === active);
      let best = Infinity;
      for (const seat of plan.seats) {
        const x = seat.x + seat.width / 2 - from.x - from.width / 2;
        const y = seat.y + seat.height / 2 - from.y - from.height / 2;
        const forward = x * dx + y * dy, across = Math.abs(x * dy - y * dx);
        const score = forward + across * 4;
        if (forward > 1 && score < best) { best = score; target = seat; }
      }
    }
    if (target) locate(target);
  };
  return <div className="dm-survey">
    <div className="dm-plan-heading"><span>ADNAN’DA YERİN BELLİ</span><b>425 kişilik salon</b></div>
    <div className="dm-plan-toolbar">
      <form className="dm-search" onSubmit={search}>
        <Search size={17} aria-hidden="true" />
        <input aria-label="Koltuk numarası" inputMode="numeric" maxLength={3} placeholder="Koltuk no · 1–425" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit">Bul</button>
      </form>
      <div className="dm-zoom" role="group" aria-label="Harita yakınlaştırma">
        <button type="button" aria-label="Uzaklaştır" disabled={!detail} onClick={() => changeZoom(scale > DETAIL ? DETAIL : null)}><Minus size={17} /></button>
        <button type="button" aria-label="Salonun tamamını göster" onClick={() => { pending.current = null; setZoom(null); viewport.current.scrollTo(0, 0); }}><Maximize2 size={17} /></button>
        <button type="button" aria-label="Yakınlaştır" disabled={scale >= MAX} onClick={() => changeZoom(detail ? MAX : DETAIL)}><Plus size={17} /></button>
      </div>
    </div>
    <p className="dm-map-instruction" id="dm-map-instruction">{detail ? "Kaydırarak gez · Koltuğunu seç · Ok tuşlarıyla ilerle" : "Genel görünüm · Yaklaşmak için plana dokun veya numara ara"}</p>
    <div className="dm-plan-viewport" ref={viewport} tabIndex={0} aria-label="Adnan salon planı" aria-describedby="dm-map-instruction" onKeyDown={keyboard}
      onPointerDown={(e) => {
        if (!detail || e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button')) return;
        drag.current = { x: e.clientX, y: e.clientY, left: viewport.current.scrollLeft, top: viewport.current.scrollTop };
        viewport.current.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        viewport.current.scrollLeft = drag.current.left + drag.current.x - e.clientX;
        viewport.current.scrollTop = drag.current.top + drag.current.y - e.clientY;
      }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <div className="dm-plan-canvas" ref={canvas} style={{ width: plan.width * scale, height: plan.height * scale }}>
        <svg viewBox={`0 0 ${plan.width} ${plan.height}`} className="dm-plan-art" aria-hidden="true">
          <path className="dm-plan-floor" d={`${plan.outline}Z`} />
          {plan.corridors.map((d, i) => <path className="dm-plan-aisle" key={i} d={d} />)}
          <path className="dm-plan-wall" d={plan.outline} />
          {plan.blocks.map((block, i) => block.path ? <path className="dm-plan-block" key={i} d={block.path} /> : <rect className="dm-plan-block" key={i} {...block} rx={4} />)}
          {!detail && plan.seats.map((seat) => <g key={seat.number} className={desks.has(seat.number) ? 'dm-overview-seat occupied' : 'dm-overview-seat'}>
            <rect x={seat.x + 2} y={seat.y + 2} width={seat.width - 4} height={seat.height - 4} rx={5} />
            {desks.has(seat.number) && <circle cx={seat.x + seat.width / 2} cy={seat.y + seat.height / 2} r={7} />}
          </g>)}
          <g className="dm-plan-entrance" transform={`translate(${plan.entrance.x} ${plan.entrance.y})`}><path d="M-40 25H40M0 25V-18M-12-5L0-18L12-5" /><text y={65} textAnchor="middle">GİRİŞ</text></g>
          <text className="dm-plan-aisle-label" x={810} y={383} textAnchor="middle">KORİDOR</text>
        </svg>
        {!detail && <button type="button" className="dm-overview-target" aria-label="Planı büyüt, koltukları göster" onClick={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const point = e.detail ? { x: (e.clientX - box.left) / scale, y: (e.clientY - box.top) / scale } : { x: plan.width / 2, y: plan.height / 2 };
          changeZoom(DETAIL, point);
        }} />}
        {detail && plan.seats.map((seat) => renderSeat(seat, {
          style: { left: seat.x * scale, top: seat.y * scale, width: seat.width * scale, height: seat.height * scale },
          tabIndex: active === seat.number ? 0 : -1,
          onFocus: () => setActive(seat.number),
          'data-seat-number': seat.number,
        }))}
      </div>
    </div>
    {detail && <button type="button" className="text-button dm-overview-return" onClick={() => { pending.current = null; setZoom(null); viewport.current.scrollTo(0, 0); }}>
      Genel görünüme dön <Maximize2 size={14} />
    </button>}
    <div className="dm-map-legend"><span><i />İşaretlenmemiş</span><span><i className="occupied" />Ekibinden biri var</span><span>Her numara bir kişilik yer</span></div>
    <p className="dm-search-status" role="status">{notice}</p>
  </div>;
}
