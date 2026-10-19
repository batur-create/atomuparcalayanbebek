// The shared Kütüp köyü on screen: the canvas map with its building card, the
// Köy tab panel and the home screen's "şu an" card. Loaded on demand (n29);
// the data hook lives in villageData.js so the app shell can fetch early.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Expand, Heart, LocateFixed, Minus, Plus, Shrink, X } from "lucide-react";
import { api, dateLabel, get, minutesLabel, shortTime } from "./api.js";
import { Avatar } from "./ui.jsx";
import { buildWorld, focusing, skyAt, tinter } from "./villageWorld.js";
import { createView } from "./villageView.js";
import { ConstructionScene } from "./Village.jsx";
import { useZoom } from "./zoom.js";
import { modelOf } from "../shared/catalog.js";
import { Modal } from "./Modal.jsx";
import { Loading } from "./Illustrations.jsx";
import "./koy.css";

// Time of day, re-checked every few minutes; tiles repaint only when it changes.
function useSky() {
  const [sky, setSky] = useState(() => skyAt());
  useEffect(() => {
    const timer = setInterval(() => {
      const next = skyAt();
      setSky((old) => (old.key === next.key ? old : next));
    }, 180000);
    return () => clearInterval(timer);
  }, []);
  return sky;
}

/** World + sky for a village; rebuilt only when what is drawn actually changes. */
export function useVillageWorld({ village, members, me, groupId, spots }) {
  const sky = useSky();
  const [expiry, expire] = useState(0);
  useEffect(() => {
    const next = Math.min(...(village?.ruins || []).map((r) => r.until).filter((t) => t > Date.now()));
    if (!Number.isFinite(next)) return;
    const timer = setTimeout(() => expire((n) => n + 1), Math.max(1, next - Date.now() + 1));
    return () => clearTimeout(timer);
  }, [village?.ruins, expiry]);
  const tint = useMemo(() => tinter(sky), [sky.key]);
  // Who is focusing is part of the picture (window light, 🎧), so starting or ending a session rebuilds it.
  const now = Date.now();
  const people = members
    .map((m) => `${m.id}:${m.status}:${m.name}:${m.avatar}:${m.color}:${m.chainEnd || 0}:${focusing(m, now) ? (m.focusPausedAt ? "p" : "f") : ""}`)
    .join("|");
  const world = useMemo(
    () => (village ? buildWorld({ groupKey: groupId || "demo", village, members, me, sky, spots }) : null),
    [village, people, me, sky.key, groupId, expiry, spots],
  );
  return { world, sky, tint };
}

// ---------- canvas ----------
function VillageCanvas({ world, sky, tint, interactive = false, onPick, fit = "all", label, viewRef }) {
  const wrap = useRef(null),
    canvas = useRef(null),
    view = useRef(null),
    fitted = useRef(false),
    moved = useRef(false),
    pickRef = useRef(onPick);
  const fitRef = useRef(null);
  pickRef.current = onPick;
  const fitNow = (ms = 0) => {
    const v = view.current;
    if (!v || !world || !wrap.current?.clientWidth) return;
    v.resize(wrap.current.clientWidth, wrap.current.clientHeight);
    if (fit === "active") {
      v.limits(2, 11);
      v.fit(world.activeBounds(), 12, ms);
      return;
    }
    const whole = v.fitScale(world.area, 10);
    v.limits(Math.min(2, whole), 30);
    if (whole >= 2) v.fit(world.area, 10, ms);
    else {
      const [x, y] = world.mineFocus || [0, 0];
      v.flyTo({ x, y, s: 4.5 }, ms);
    }
    fitted.current = true;
  };
  fitRef.current = fitNow;
  useEffect(() => {
    const v = createView(canvas.current, { interactive, onPick: (b) => pickRef.current?.(b) });
    view.current = v;
    if (viewRef)
      viewRef.current = {
        view: v,
        fit: () => fitRef.current(500),
        // A celebration takes the camera; the auto-fit must not pull it back to the whole village.
        celebrate: (id) => v.celebrate(id) && (moved.current = fitted.current = true),
      };
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      v.resize(width, height);
      // Until someone pans or zooms, keep the whole village framed as the layout settles.
      if (!moved.current) fitRef.current();
    });
    const touched = () => (moved.current = true);
    canvas.current.addEventListener("pointerdown", touched);
    canvas.current.addEventListener("wheel", touched);
    ro.observe(wrap.current);
    return () => {
      ro.disconnect();
      v.destroy();
    };
  }, []);
  useEffect(() => {
    if (!world || !view.current) return;
    view.current.setWorld(world, sky, tint);
    if (!fitted.current || !moved.current) fitNow();
    if (viewRef?.current) viewRef.current.fit = () => fitNow(500);
  }, [world, tint]);
  return (
    <div className="village-canvas" ref={wrap}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={label}
        aria-description={interactive ? "Ok tuşlarıyla gez, artı ve eksiyle yakınlaştır; ortadaki binayı Enter ile seç. Haritanın altındaki bina listesiyle de gezebilirsin." : undefined}
        tabIndex={interactive ? 0 : -1}
        className={interactive ? "interactive" : ""}
      />
    </div>
  );
}

// ---------- building card ----------
function BuildingCard({ building, owner, me, onLike, onMove, close, canLike }) {
  const [busy, setBusy] = useState(false);
  const item = modelOf(building.model, building.kind),
    kind = { label: item.name, emoji: item.emoji };
  const mine = building.memberId === me;
  return (
    <div className="building-card" role="dialog" aria-label={`${kind.label} bilgisi`}>
      <button className="icon-button building-card-close" aria-label="Kartı kapat" onClick={close}>
        <X size={16} />
      </button>
      <div className="building-card-head">
        <span className="building-card-emoji" aria-hidden="true">{kind.emoji}</span>
        <div>
          <strong>{kind.label}</strong>
          <small>
            {dateLabel(building.created)} · {shortTime(building.created)}
          </small>
        </div>
      </div>
      <div className="building-card-who">
        {owner ? <Avatar member={owner} size="tiny" /> : null}
        <span>
          {building.gift
            ? `${owner ? (mine ? "Senin" : `Sahibi: ${owner.name}`) : "Eski bir komşu"} · 🎁 Batur’un hediyesi${building.gift !== "Batur'dan hediye" ? `: “${building.gift}”` : ""}`
            : <>{owner ? (mine ? "Senin eserin" : `Yapan: ${owner.name}`) : "Eski bir komşu"} · {minutesLabel(building.minutes)} odak{building.patched ? " · 🩹 bir kez kurtarıldı" : ""}</>}
        </span>
      </div>
      <button
        className={`building-like ${building.mine ? "liked" : ""}`}
        disabled={busy || mine || !canLike}
        aria-pressed={building.mine}
        onClick={async () => {
          setBusy(true);
          try {
            await onLike(building);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Heart size={15} fill={building.mine ? "currentColor" : "none"} />
        {building.likes ? `${building.likes} kalp` : mine ? "Henüz kalp yok" : "Kalp at"}
      </button>
      {mine && onMove && (
        <button className="text-button building-move" onClick={() => onMove(building)}>
          Taşı · mahallende başka bir arsaya
        </button>
      )}
    </div>
  );
}

// ---------- the Köy tab ----------
export function VillagePanel({ me, members, groupId, village, like, run, outcome, idle = false, notify, session, error, retry, week }) {
  const [moving, setMoving] = useState(null); // { building, spots } while moving one's own building
  const { world, sky, tint } = useVillageWorld({ village, members, me: me?.id, groupId, spots: moving?.spots });
  // The site zooms like the focus screen's: pinch, double tap or the buttons.
  const zoom = useZoom({ wheel: false });
  const [picked, setPicked] = useState(null),
    [full, setFull] = useState(false),
    [listOpen, setListOpen] = useState(false),
    [buildingPage, setBuildingPage] = useState(0),
    [, tick] = useState(0);
  const map = useRef(null);
  const moveTo = async (spot) => {
    try {
      await api(`/buildings/${moving.building.id}/move`, { x: spot.x, y: spot.y });
      setMoving(null);
      retry();
      navigator.vibrate?.(30);
      notify("Taşındı! Yeni yeri hayırlı olsun. 🏡");
    } catch (e) {
      notify(e.message);
    }
  };
  // Keep the finished scene on screen for a moment, then show the village.
  useEffect(() => {
    if (!outcome) return;
    const timer = setTimeout(() => tick((n) => n + 1), Math.max(0, outcome.at + 4200 - Date.now()));
    return () => clearTimeout(timer);
  }, [outcome?.at]);
  useEffect(() => {
    if (!full) return;
    document.body.style.overflow = "hidden";
    const key = (e) => e.key === "Escape" && setFull(false);
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", key);
    };
  }, [full]);
  const showScene = !!run || (outcome && Date.now() - outcome.at < 4200);
  const subject = run || outcome;
  // When the handover scene gives way to the map, fly to my new building and
  // celebrate it, once. If the village has not caught up yet, ask for it once
  // and try again when it arrives. The new one is the building that was not
  // there while it was being built (comparing timestamps would trust the phone's clock).
  const before = useRef(null);
  useEffect(() => {
    if (run && village) before.current = new Set(village.buildings.filter((b) => b.memberId === me?.id).map((b) => b.id));
  }, [run, village]);
  const celebrated = useRef(0),
    refetched = useRef(0);
  useEffect(() => {
    if (showScene || outcome?.type !== "built" || !me || celebrated.current === outcome.at) return;
    if (Date.now() - outcome.at > 20000) return;
    const fresh = (village?.buildings || [])
      .filter((b) => b.memberId === me.id && b.x !== null && (before.current ? !before.current.has(b.id) : b.created > outcome.at - 10 * 60000))
      .reduce((a, b) => (!a || b.created > a.created ? b : a), null);
    if (fresh && map.current?.celebrate(fresh.id)) celebrated.current = outcome.at;
    else if (refetched.current !== outcome.at) {
      refetched.current = outcome.at;
      retry();
    }
  }, [showScene, outcome?.at, village]);
  const building = picked && village?.buildings.find((b) => b.id === picked);
  const owner = building && members.find((m) => m.id === building.memberId);
  const count = village?.buildings.length || 0;
  const settled = village?.districts.filter((d) => d.memberId).length || 0;
  const myCount = village?.buildings.filter((b) => b.memberId === me?.id).length || 0;
  const people = members.filter((m) => village?.districts.some((d) => d.memberId === m.id));
  const flyTo = (memberId) => {
    const target = world?.focusOf(memberId);
    if (target) map.current?.view.flyTo({ x: target[0], y: target[1], s: 9 }, 650);
  };
  // "Köyde göster" in the collection: bring the map into view and fly to my
  // newest building of that model, with its card open (n27).
  const latest = useRef(village);
  latest.current = village;
  useEffect(() => {
    const show = (e) => {
      const model = e.detail?.model;
      const b = (latest.current?.buildings || [])
        .filter((x) => x.memberId === me?.id && x.x !== null && modelOf(x.model, x.kind).id === model)
        .reduce((a, x) => (!a || x.created > a.created ? x : a), null);
      if (!b) return notify("Bu yapı köyünde bulunamadı. Taşınıyor olabilir; birazdan tekrar dene.");
      document.querySelector(".village-panel .village-map-wrap")?.scrollIntoView({ behavior: "smooth", block: "center" });
      setPicked(b.id);
      map.current?.view.select(b.id);
      setTimeout(() => map.current?.view.flyTo({ x: (b.x - b.y) * 0.866, y: (b.x + b.y) * 0.5, s: 14 }, 650), 350);
    };
    window.addEventListener("kutup:show-building", show);
    return () => window.removeEventListener("kutup:show-building", show);
  }, [me?.id]);
  return (
    <section className="panel village-panel">
      {error && <p className="form-error" role="status">Köy güncellenemedi. <button className="text-button" onClick={retry}>Tekrar dene</button></p>}
      <div className="section-heading">
        <h2>{showScene ? "Şantiye" : "Kütüp köyü"}</h2>
        <span className="count-tag">
          {showScene ? `${modelOf(subject.model, subject.kind).emoji} ${modelOf(subject.model, subject.kind).name}` : `${count} bina`}
        </span>
      </div>
      {showScene ? (
        <>
          <div className="scene-zoom-wrap">
            <div className="scene-zoom" ref={zoom.box} {...zoom.handlers} style={{ touchAction: zoom.view.s > 1 ? "none" : "pan-y" }}>
              <div className="scene-zoom-inner" style={{ transform: `translate(${zoom.view.x}px, ${zoom.view.y}px) scale(${zoom.view.s})` }}>
                <ConstructionScene run={run} outcome={outcome} idle={idle} />
              </div>
            </div>
            <div className="village-controls scene-controls">
              <button className="icon-button" aria-label="Şantiyeye yakınlaş" onClick={zoom.zoomIn}>
                <Plus size={15} />
              </button>
              {zoom.view.s > 1 && (
                <button className="icon-button" aria-label="Şantiyeden uzaklaş" onClick={zoom.zoomOut}>
                  <Minus size={15} />
                </button>
              )}
            </div>
          </div>
          <p className="village-caption">
            {run
              ? me?.focusRelaxed ? "Rahat inşaat sürüyor. Ekranı kilitleyebilirsin; dönünce yapımını izle." : "Odaklandıkça yükseliyor. Uygulamadan çıkarsan yıkılır."
              : outcome?.type === "built"
                ? "Bitti! Mahallene taşınıyor."
                : "İnşaat çöktü. Enkaz 3 gün mahallende kalır; bir sonraki seansın onu kaldırır ve malzemenin %30'u geri gelir."}
          </p>

        </>
      ) : (
        <>
          <div className={`village-map-wrap ${full ? "village-full" : ""}`}>
            {!world && <Loading text={error ? "Köy gelmedi; yukarıdan tekrar dene." : "Köy çiziliyor…"} />}
            {world && (
              <VillageCanvas
                world={world}
                sky={sky}
                tint={tint}
                interactive
                viewRef={map}
                label={`Kütüp köyü: ${settled} mahalle, ${count} bina`}
                onPick={(b) => {
                  if (!moving) return setPicked(b ? b.id : null);
                  if (b?.spot) moveTo(b);
                }}
              />
            )}
            <div className="village-controls">
              <button className="icon-button" aria-label="Yakınlaştır" onClick={() => map.current?.view.zoomBy(1.4)}>
                <Plus size={17} />
              </button>
              <button className="icon-button" aria-label="Uzaklaştır" onClick={() => map.current?.view.zoomBy(1 / 1.4)}>
                <Minus size={17} />
              </button>
              {me && (
                <button className="icon-button" aria-label="Mahalleme git" onClick={() => flyTo(me.id)}>
                  <LocateFixed size={17} />
                </button>
              )}
              <button
                className="icon-button"
                aria-label={full ? "Tam ekrandan çık" : "Tam ekran"}
                onClick={() => setFull(!full)}
              >
                {full ? <Shrink size={17} /> : <Expand size={17} />}
              </button>
            </div>
            {people.length > 1 && (
              <div className="map-people" role="group" aria-label="Mahalleye git">
                {people.map((m) => {
                  const focusing = m.focusEnd > Date.now();
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={focusing ? "focusing" : ""}
                      aria-label={`${m.id === me?.id ? "Benim mahallem" : `${m.name} mahallesi`}${focusing ? ", şu an odakta" : ""}`}
                      onClick={() => flyTo(m.id)}
                    >
                      <Avatar member={m} size="tiny" />
                      {focusing && <i aria-hidden="true">🎧</i>}
                    </button>
                  );
                })}
              </div>
            )}
            {full && <span className="village-full-title">Kütüp köyü · {count} bina</span>}
            {moving && (
              <div className="move-banner" role="status">
                <span>Parlayan bir arsaya dokun, {modelOf(moving.building.model, moving.building.kind).name.toLocaleLowerCase("tr")} oraya taşınsın.</span>
                <button className="text-button" onClick={() => setMoving(null)}>
                  Vazgeç
                </button>
              </div>
            )}
            {building && !moving && (
              <BuildingCard
                building={building}
                owner={owner}
                me={me?.id}
                canLike={!!session}
                close={() => {
                  setPicked(null);
                  map.current?.view.select(null);
                }}
                onMove={async (b) => {
                  try {
                    const r = await get(`/buildings/${b.id}/spots`);
                    if (!r.spots.length) return notify("Mahallende şu an boş arsa yok. Yeni bir bina yeni mahalle açar.");
                    setPicked(null);
                    map.current?.view.select(null);
                    setMoving({ building: b, spots: r.spots.map(([x, y, facing]) => ({ x, y, facing })) });
                    map.current?.view.flyTo({ x: (b.x - b.y) * 0.866, y: (b.x + b.y) * 0.5, s: 11 }, 500);
                  } catch (e) {
                    notify(e.message);
                  }
                }}
                onLike={async (b) => {
                  try {
                    const r = await like(b);
                    if (r.liked) navigator.vibrate?.(30);
                  } catch (e) {
                    notify(e.message);
                  }
                }}
              />
            )}
          </div>
          {week && <KoyTiles week={week} members={members} me={me} stages={village?.monument || 0} />}
          <p className="village-caption">
            {!me
              ? "Herkesin kendi mahallesi var; odaklandıkça köy büyür. Binaya dokun, kimin olduğunu gör."
              : myCount
                ? `Mahallende ${myCount} bina var. Sürükle, iki parmakla yakınlaştır, binaya dokun.`
                : "Mahallen hazır, tabelan dikili. İnşaat modunda bir seans bitir, ilk kulüben yükselsin."}
          </p>
          {!!count && (
            <details className="village-building-list" onToggle={(e) => setListOpen(e.currentTarget.open)}>
              <summary>Binalara göz at</summary>
              {listOpen && <>
                <label className="field-label">Bir eser seç
                  <select value={picked || ""} onChange={(e) => {
                    const b = village.buildings.find((home) => home.id === e.target.value);
                    setPicked(b?.id || null);
                    map.current?.view.select(b?.id || null);
                    if (b) map.current?.view.flyTo({ x: (b.x - b.y) * 0.866, y: (b.x + b.y) * 0.5, s: 16 }, 500);
                  }}>
                    <option value="">Bina seç…</option>
                    {village.buildings.slice(buildingPage * 20, (buildingPage + 1) * 20).map((b) => (
                      <option value={b.id} key={b.id}>{members.find((m) => m.id === b.memberId)?.name || "Komşun"} · {modelOf(b.model, b.kind).name} · {dateLabel(b.created)}</option>
                    ))}
                  </select>
                </label>
                {count > 20 && <div className="village-list-pages">
                  <button className="text-button" disabled={buildingPage === 0} onClick={() => setBuildingPage((n) => n - 1)}>Önceki</button>
                  <span>{buildingPage + 1} / {Math.ceil(count / 20)}</span>
                  <button className="text-button" disabled={(buildingPage + 1) * 20 >= count} onClick={() => setBuildingPage((n) => n + 1)}>Sonraki</button>
                </div>}
              </>}
            </details>
          )}
        </>
      )}
    </section>
  );
}

// The monument sheet (n27): not the tile again, but what the tile cannot
// show: how tall the monument stands (a floor for every week the team made
// it) and who has put how many minutes into this week's floor.
function MonumentSheet({ week, members, me, stages }) {
  const goal = week.goal,
    total = members.reduce((t, m) => t + (m.focusWeek || 0), 0),
    done = !!week.monument,
    share = Math.min(1, total / goal),
    master = members.find((m) => m.id === week.master?.memberId);
  const ranked = members.filter((m) => m.focusWeek > 0).sort((a, b) => b.focusWeek - a.focusWeek),
    quiet = members.filter((m) => !(m.focusWeek > 0));
  const shown = Math.min(stages, 7);
  const floorY = (i) => 128 - (i + 1) * 13;
  // The roof sits on the highest floor drawn: this week's scaffold, or the last floor.
  const top = Math.max(0, done ? shown - 1 : shown),
    roofY = floorY(top),
    roofX = 26 + top,
    roofW = 68 - 2 * top;
  return (
    <div className="monument-sheet">
      <div className="monument-head">
        <svg className="monument-tower" viewBox={`0 ${roofY - 22} 120 ${140 - (roofY - 22)}`} aria-hidden="true">
          <rect className="mt-ground" x="6" y="128" width="108" height="6" rx="3" />
          {Array.from({ length: shown }, (_, i) => (
            <g key={i}>
              <rect className="mt-floor" x={26 + i} y={floorY(i)} width={68 - 2 * i} height="12" rx="2" />
              {[0, 1, 2, 3].map((k) => (
                <rect key={k} className="mt-window" x={33 + i + k * ((54 - 2 * i) / 4)} y={floorY(i) + 3.5} width="5" height="5" rx="1" />
              ))}
            </g>
          ))}
          {!done && (
            <g className="mt-next">
              <rect className="mt-scaffold" x={26 + shown} y={floorY(shown)} width={68 - 2 * shown} height="12" rx="2" />
              <rect className="mt-rising" x={26 + shown} y={floorY(shown) + 12 - 12 * share} width={68 - 2 * shown} height={12 * share} rx="2" />
            </g>
          )}
          <path className="mt-roof" d={`M${roofX - 4} ${roofY} L60 ${roofY - 14} L${roofX + roofW + 4} ${roofY}Z`} />
        </svg>
        <div>
          <b>
            {stages ? `${stages} kat` : "İlk kat"}
            {stages > shown ? <small> (çizimde {shown})</small> : null}
          </b>
          <span>{done ? "Bu haftanın katı dikildi, herkese +50 🧱 yattı." : `Bu haftanın katı %${Math.round(share * 100)}: ${Math.max(0, goal - total)} dk kaldı.`}</span>
        </div>
      </div>
      <div className="contrib-bar" role="img" aria-label={`Bu hafta ${total} / ${goal} dk`}>
        {ranked.map((m) => (
          <i key={m.id} className={m.color || "lilac"} style={{ width: `${Math.min(100, (m.focusWeek / Math.max(goal, total)) * 100)}%` }} />
        ))}
      </div>
      <h3 className="contrib-title">Bu haftanın katına kim ne kattı</h3>
      {ranked.length ? (
        <ol className="contrib-list">
          {ranked.map((m) => (
            <li key={m.id} className={m.id === me?.id ? "mine" : ""}>
              <Avatar member={m} size="tiny" />
              <strong>
                {m.name}
                {m.id === me?.id ? " (sen)" : ""}
              </strong>
              <small>{minutesLabel(m.focusWeek)}</small>
              <b>%{Math.round((m.focusWeek / goal) * 100)}</b>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted small">Bu hafta henüz biten seans yok. İlk 25 dakika bu katın ilk tuğlası. 🧱</p>
      )}
      {quiet.length > 0 && ranked.length > 0 && <p className="contrib-quiet">Henüz katkısı olmayan: {quiet.map((m) => m.name).join(", ")}</p>}
      {master && (
        <p className="contrib-quiet">
          👑 Geçen haftanın ustası: <b>{master.name}</b> ({Math.round((week.master.minutes / 60) * 10) / 10} sa)
        </p>
      )}
    </div>
  );
}

// Two tiles under the map: the shared monument and the week's table; each opens its sheet.
function KoyTiles({ week, members, me, stages }) {
  const [open, setOpen] = useState(null);
  const total = members.reduce((t, m) => t + (m.focusWeek || 0), 0),
    goal = week.goal;
  const ranked = members.filter((m) => m.focusWeek > 0).sort((a, b) => b.focusWeek - a.focusWeek);
  const mine = ranked.findIndex((m) => m.id === me?.id);
  return (
    <>
      <div className="koy-tiles">
        <button type="button" className={`koy-tile ${week.monument ? "done" : ""}`} onClick={() => setOpen("monument")}>
          <span className="koy-tile-head">
            <b>🏛️ Ortak anıt</b>
            <ArrowUpRight size={15} />
          </span>
          <strong>{week.monument ? `${stages}. kat dikildi` : `${total} / ${goal} dk`}</strong>
          {!week.monument && (
            <span className="monument-track" aria-hidden="true">
              <i style={{ width: `${Math.min(100, Math.round((total / goal) * 100))}%` }} />
            </span>
          )}
          <small>{week.monument ? "Herkese +50 🧱 yattı." : "Bitince herkese +50 🧱"}</small>
        </button>
        <button type="button" className="koy-tile" onClick={() => setOpen("week")}>
          <span className="koy-tile-head">
            <b>🏆 Bu hafta</b>
            <ArrowUpRight size={15} />
          </span>
          {ranked.length ? (
            <span className="koy-podium">
              {ranked.slice(0, 3).map((m, i) => (
                <span key={m.id}>
                  <Avatar member={m} size="tiny" />
                  <em aria-hidden="true">{["🥇", "🥈", "🥉"][i]}</em>
                </span>
              ))}
            </span>
          ) : (
            <strong>Tablo boş</strong>
          )}
          <small>{mine >= 0 ? `Sen ${mine + 1}. sıradasın · ${minutesLabel(ranked[mine].focusWeek)}` : "İlk 25 dakika tabloyu açar."}</small>
        </button>
      </div>
      {open === "monument" && (
        <Modal title="Haftanın ortak anıtı" subtitle="Ekip haftalık hedefi her tutturduğunda meydandaki Milli Kütüphane anıtına bir kat çıkar." close={() => setOpen(null)}>
          <MonumentSheet week={week} members={members} me={me} stages={stages} />
        </Modal>
      )}
      {open === "week" && (
        <Modal title="Haftanın odak tablosu" subtitle="Pazartesi sıfırlanır · tamamlanan seanslar sayılır." close={() => setOpen(null)}>
          <WeekList ranked={ranked} me={me} />
        </Modal>
      )}
    </>
  );
}

function WeekList({ ranked, me }) {
  const top = ranked[0]?.focusWeek || 1;
  if (!ranked.length) return <p className="muted small">Bu hafta henüz biten seans yok. İlk 25 dakika tabloyu açar. 🌱</p>;
  return (
    <ol className="week-list">
      {ranked.map((m, i) => (
        <li key={m.id} className={m.id === me?.id ? "mine" : ""}>
          <span className="week-rank">{["🥇", "🥈", "🥉"][i] || i + 1}</span>
          <Avatar member={m} size="tiny" />
          <strong>
            {m.name}
            {m.id === me?.id ? " (sen)" : ""}
          </strong>
          <span className="week-bar" aria-hidden="true">
            <i style={{ width: `${Math.max(6, (m.focusWeek / top) * 100)}%` }} />
          </span>
          <small>
            {minutesLabel(m.focusWeek)}
            {m.buildsWeek > 0 && <span title={`Bu hafta ${m.buildsWeek} bina`}> 🏠{m.buildsWeek > 1 ? `×${m.buildsWeek}` : ""}</span>}
          </small>
        </li>
      ))}
    </ol>
  );
}

// ---------- the home screen card ----------
export function VillageNow({ me, members, groupId, village, onOpen }) {
  const { world, sky, tint } = useVillageWorld({ village, members, me: me?.id, groupId });
  const here = members.filter((m) => m.status === "here"),
    coming = members.filter((m) => m.status === "coming"),
    resting = members.filter((m) => m.status === "break");
  const lit = here.filter((m) => village?.buildings.some((b) => b.memberId === m.id)).length;
  const names = (list) => list.map((m) => m.name).join(", ");
  const title = here.length
    ? lit
      ? `${lit} evin ışığı yanıyor`
      : `${here.length} kişi kütüpte`
    : coming.length
      ? `${coming.length} kişi yolda`
      : sky.night > 0.5
        ? "Köy uykuda"
        : "Köy sakin";
  const detail = [
    here.length && `Kütüpte: ${names(here)}`,
    resting.length && `Molada: ${names(resting)}`,
    coming.length && `Yolda: ${names(coming)}`,
  ].filter(Boolean);
  return (
    <section
      className="village-now"
      role="link"
      tabIndex={0}
      aria-label="Kütüp köyü, köy sekmesine git"
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
    >
      <div className="village-now-head">
        <div>
          <span className="village-now-eyebrow">KÜTÜP KÖYÜ · ŞU AN</span>
          <h2>{title}</h2>
          <p>{detail.length ? detail.join(" · ") : "Biri gelince evinin ışığı yanar, yoldakiler köy yolunda yürür."}</p>
        </div>
        <span className="village-now-go" aria-hidden="true">
          <ArrowUpRight size={17} />
        </span>
      </div>
      {world && <VillageCanvas world={world} sky={sky} tint={tint} fit="active" label={`${title}. ${detail.join(", ")}`} />}
    </section>
  );
}
