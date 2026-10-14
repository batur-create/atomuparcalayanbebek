// The shared Kütüp köyü on screen: the data hook, the canvas map with its
// building card, the Köy tab panel and the home screen's "şu an" card.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Expand, Heart, LocateFixed, Minus, Plus, Shrink, X } from "lucide-react";
import { api, dateLabel, get, minutesLabel, shortTime } from "./api.js";
import { Avatar } from "./ui.jsx";
import { buildWorld, mergeVillage, skyAt, tinter } from "./villageWorld.js";
import { createView } from "./villageView.js";
import { ConstructionScene, KINDS } from "./Village.jsx";

// ---------- data ----------
/** The village of my group, kept in sync incrementally (only changed rows travel). */
export function useVillage(session, villageRev) {
  const [village, setVillage] = useState(null);
  const [error, setError] = useState("");
  const [attempt, retry] = useState(0);
  const known = useRef({ member: null, data: null });
  useEffect(() => {
    if (!session) {
      known.current = { member: null, data: null };
      setVillage(null);
      return;
    }
    if (known.current.member !== session.memberId) {
      known.current = { member: session.memberId, data: null };
      setVillage(null);
    }
    let gone = false, timer, inFlight = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (gone || inFlight) return;
      clearTimeout(timer);
      inFlight = true;
      const have = known.current.data;
      try {
        const raw = await get(`/village${have ? `?rev=${have.rev}&after=${have.until || 0}` : ""}`, controller.signal);
        if (gone) return;
        const next = mergeVillage(known.current.data, raw);
        known.current.data = next;
        setVillage(next);
        setError("");
      } catch (e) {
        if (!gone) {
          setError(e.message);
          timer = setTimeout(refresh, 5000);
        }
      } finally {
        inFlight = false;
      }
    };
    refresh();
    window.addEventListener("online", refresh);
    return () => {
      gone = true;
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("online", refresh);
    };
  }, [session?.memberId, villageRev, attempt]);
  const like = async (building) => {
    const r = await api(`/buildings/${building.id}/like`, {});
    const patch = (v) => v && { ...v, buildings: v.buildings.map((b) => (b.id === building.id ? { ...b, likes: r.likes, mine: r.liked } : b)) };
    known.current.data = patch(known.current.data);
    setVillage(patch);
    retry((n) => n + 1);
    return r;
  };
  return { village, like, error, retry: () => retry((n) => n + 1) };
}

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
export function useVillageWorld({ village, members, me, groupId }) {
  const sky = useSky();
  const [expiry, expire] = useState(0);
  useEffect(() => {
    const next = Math.min(...(village?.ruins || []).map((r) => r.until).filter((t) => t > Date.now()));
    if (!Number.isFinite(next)) return;
    const timer = setTimeout(() => expire((n) => n + 1), Math.max(1, next - Date.now() + 1));
    return () => clearTimeout(timer);
  }, [village?.ruins, expiry]);
  const tint = useMemo(() => tinter(sky), [sky.key]);
  const people = members.map((m) => `${m.id}:${m.status}:${m.name}:${m.avatar}:${m.color}`).join("|");
  const world = useMemo(
    () => (village ? buildWorld({ groupKey: groupId || "demo", village, members, me, sky }) : null),
    [village, people, me, sky.key, groupId, expiry],
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
    if (viewRef) viewRef.current = { view: v, fit: () => fitRef.current(500) };
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
function BuildingCard({ building, owner, me, onLike, close, canLike }) {
  const [busy, setBusy] = useState(false);
  const kind = KINDS[building.kind];
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
          {owner ? (mine ? "Senin eserin" : `Yapan: ${owner.name}`) : "Eski bir komşu"} · {minutesLabel(building.minutes)} odak
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
    </div>
  );
}

// ---------- the Köy tab ----------
export function VillagePanel({ me, members, groupId, village, like, run, outcome, notify, session, error, retry }) {
  const { world, sky, tint } = useVillageWorld({ village, members, me: me?.id, groupId });
  const [picked, setPicked] = useState(null),
    [full, setFull] = useState(false),
    [listOpen, setListOpen] = useState(false),
    [buildingPage, setBuildingPage] = useState(0),
    [, tick] = useState(0);
  const map = useRef(null);
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
  return (
    <section className="panel village-panel">
      {error && <p className="form-error" role="status">Köy güncellenemedi. <button className="text-button" onClick={retry}>Tekrar dene</button></p>}
      <div className="section-heading">
        <h2>{showScene ? "Şantiye" : "Kütüp köyü"}</h2>
        <span className="count-tag">
          {showScene ? `${KINDS[subject.kind].emoji} ${KINDS[subject.kind].label}` : `${count} bina`}
        </span>
      </div>
      {showScene ? (
        <>
          <ConstructionScene run={run} outcome={outcome} />
          <p className="village-caption">
            {run
              ? "Odaklandıkça yükseliyor. Uygulamadan çıkarsan yıkılır."
              : outcome?.type === "built"
                ? "Bitti! Mahallene taşınıyor."
                : "İnşaat çöktü. Enkazı bir gün mahallende kalacak; sonraki bina temizler."}
          </p>

        </>
      ) : (
        <>
          {people.length > 1 && (
            <div className="filter-row village-people" aria-label="Mahalleye git">
              {people.map((m) => (
                <button key={m.id} className="filter-chip" onClick={() => flyTo(m.id)}>
                  {m.avatar} {m.id === me?.id ? "Benim mahallem" : m.name}
                </button>
              ))}
            </div>
          )}
          <div className={`village-map-wrap ${full ? "village-full" : ""}`}>
            {world && (
              <VillageCanvas
                world={world}
                sky={sky}
                tint={tint}
                interactive
                viewRef={map}
                label={`Kütüp köyü: ${settled} mahalle, ${count} bina`}
                onPick={(b) => setPicked(b ? b.id : null)}
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
            {full && <span className="village-full-title">Kütüp köyü · {count} bina</span>}
            {building && (
              <BuildingCard
                building={building}
                owner={owner}
                me={me?.id}
                canLike={!!session}
                close={() => {
                  setPicked(null);
                  map.current?.view.select(null);
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
                      <option value={b.id} key={b.id}>{members.find((m) => m.id === b.memberId)?.name || "Komşun"} · {KINDS[b.kind].label} · {dateLabel(b.created)}</option>
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
