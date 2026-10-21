// Komuta merkezi → Ekipler → Köy düzeni (n46 G, plan §8): a team's move from
// today's village to the planned one, step by step. The draft is planned here
// in the owner's browser and only checked and stored by the server; members
// see nothing until "Yeni köyü aç", and for 14 days "Eski köye dön" takes the
// team back with every building in place. Nothing here touches bricks,
// minutes, rewards or deliveries.
import React, { useEffect, useRef, useState } from "react";
import { LoaderCircle, Map as MapIcon, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { api, get, dateLabel } from "./api.js";
import { BY_ID } from "../shared/catalog.js";
import { Modal } from "./Modal.jsx";
import { runPlan } from "./koy2/browserPlan.js";
import { buildWorld2 } from "./koy2/world2.js";
import { skyAt, tinter } from "./villageWorld.js";
import { createView } from "./villageView.js";

const plan = (source, base) => runPlan({ kind: "draft", source, base });

/** What stands on a stored layout, in the shape the v2 drawing reads. */
function thingsOf(items) {
  const things = new Map();
  for (const i of items) {
    const key = `${i.subject.type}:${i.subject.id}`;
    if (i.subject.type === "building") things.set(key, { kind: i.kind, seed: i.seed, model: i.model, memberId: i.owner });
    else if (i.subject.type === "site") things.set(key, { model: i.model, memberId: i.owner, site: { shown: 0.5 } });
    else things.set(key, { model: "anitkabir", site: null });
  }
  return things;
}

function Preview({ source }) {
  const canvas = useRef(null);
  useEffect(() => {
    if (!source?.layout || !canvas.current) return;
    // Shown in daylight whatever the hour, so the plan itself is easy to read.
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    const sky = skyAt(noon.getTime());
    const world = buildWorld2({ layout: source.layout, things: thingsOf(source.items), members: source.members, sky });
    const view = createView(canvas.current, { interactive: true });
    const box = canvas.current.getBoundingClientRect();
    view.resize(box.width, box.height);
    view.setWorld(world, sky, tinter(sky));
    const whole = view.fitScale(world.area, 10);
    view.limits(Math.min(2, whole), 30);
    view.fit(world.area, 10, 0);
    return () => view.destroy();
  }, [source]);
  return <canvas ref={canvas} className="owner-village-preview" aria-label="Yeni köy taslağının önizlemesi" />;
}

const counted = ({ buildings, sites, projects }) =>
  [`${buildings} bina`, sites ? `${sites} şantiye` : null, projects ? `${projects} Anıtkabir` : null].filter(Boolean).join(" · ");

// Which buildings did not fit, by name ("Ev ×2, Kule"), so it can be told to Claude.
const missingNames = (missing) => {
  const n = new Map();
  for (const m of missing) {
    const name = BY_ID[m.model]?.name || m.model || "adsız yapı";
    n.set(name, (n.get(name) || 0) + 1);
  }
  return [...n].map(([name, k]) => (k > 1 ? `${name} ×${k}` : name)).join(", ");
};

export function OwnerVillage({ group, close }) {
  const [state, setState] = useState(null),
    [preview, setPreview] = useState(null),
    [busy, setBusy] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  const base = `/owner/village/${group.id}`;
  const load = async () => {
    const next = await get(base);
    setState(next);
    // The draft as it stands, to look at before anyone else sees it.
    setPreview(next.draft ? await get(`${base}/source?layout=${next.draft.id}`) : null);
    return next;
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [group.id]);

  const step = async (label, work) => {
    setBusy(label);
    setError("");
    setNote("");
    try {
      await work();
    } catch (e) {
      setError(e.message);
      // Something changed meanwhile: show the fresh state so the next tap is right.
      await load().catch(() => {});
    } finally {
      setBusy("");
    }
  };
  // A new draft, or one brought up to date (`layout`: the draft or the previous it continues).
  const prepare = (role = "draft", layoutId = null) =>
    step(layoutId ? "Eşitleniyor…" : "Taslak hazırlanıyor…", async () => {
      const source = await get(`${base}/source${layoutId ? `?layout=${layoutId}` : ""}`);
      const planned = await plan(source, source.layout);
      if (planned.missing.length) throw new Error(`${planned.missing.length} yapıya yer bulunamadı (${missingNames(planned.missing)}); taslak kaydedilmedi, köy olduğu gibi duruyor.`);
      const stored = await api(`${base}/layouts`, { role, layout: planned.layout, base: layoutId, contentRev: source.contentRev });
      setState(stored);
      // Every rule, checked by the server a part at a time.
      const id = (role === "draft" ? stored.draft : stored.previous).id;
      for (let part = { checked: 0, sound: false }; !part.sound; ) {
        setBusy(`Kurallar kontrol ediliyor… ${part.total ? `${part.checked}/${part.total}` : ""}`);
        part = await api(`${base}/layouts/${id}/check`, { from: part.checked });
      }
      await load();
      setNote(layoutId ? "Eşitlendi: yerleşmiş yapılar yerinde kaldı, yeniler eklendi." : "Taslak hazır. Üyeler henüz eski köyü görüyor.");
    });
  const activate = () => {
    if (!confirm(`${group.name}: yeni köy açılsın mı?\n\nHerkes bir sonraki yenilemede yeni köyü görür. Binalar, tuğlalar, süreler aynı kalır. 14 gün boyunca buradan eski köye dönebilirsin.`)) return;
    step("Yeni köy açılıyor…", async () => {
      setState(await api(`${base}/activate`, { draftId: state.draft.id, active: state.active.id, contentRev: state.contentRev }));
      await load();
      setNote("Yeni köy açıldı.");
    });
  };
  const rollback = () => {
    const legacy = state.previous.kind === "legacy";
    if (!confirm(`${group.name}: ${legacy ? "eski köye" : "önceki köye"} dönülsün mü?\n\nBu arada kurulan her bina da orada olur; hiçbir şey silinmez. Şimdiki düzen taslak olarak kalır.`)) return;
    step("Dönülüyor…", async () => {
      setState(await api(`${base}/rollback`, { active: state.active.id, contentRev: state.contentRev }));
      await load();
      setNote(legacy ? "Eski köye dönüldü." : "Önceki köye dönüldü.");
    });
  };

  const draft = state?.draft,
    previous = state?.previous;
  const draftReady = draft && draft.sound && !draft.behind && !draft.coverage.missing && !draft.coverage.extra && !draft.coverage.twice;
  const previousReady = previous?.open && (previous.kind === "legacy" ? !previous.coverage.missing : previous.sound && !previous.behind && !previous.coverage.missing && !previous.coverage.extra);
  return (
    <Modal title={`${group.name} · köy düzeni`} subtitle="Yeni köye geçiş yalnız buradan açılır." close={close} wide>
      {!state ? (
        error ? <p className="form-error">{error}</p> : <p className="owner-village-busy"><LoaderCircle size={16} className="spin" /> Köy durumu okunuyor…</p>
      ) : (
        <div className="owner-village">
          <p className="owner-village-now">
            <MapIcon size={16} /> Şu an: <strong>{state.active.id ? "yeni köy" : "eski köy"}</strong> · {counted(state.counts)}
          </p>
          <section>
            <h3>Taslak</h3>
            {!draft ? (
              <>
                <p>Ekibin bütün binaları, şantiyeleri ve Anıtkabir'i yeni köyde yerini alır. Taslak hazırlanırken kimse bir şey görmez.</p>
                <button className="btn primary" disabled={!!busy} onClick={() => prepare()}>
                  <Sparkles size={15} /> Yeni köy taslağı hazırla
                </button>
              </>
            ) : (
              <>
                <p>
                  {draft.coverage.plots} yer · {dateLabel(draft.created)} hazırlandı
                  {draft.behind ? ` · ${draft.behind} değişiklik geride` : " · güncel"}
                  {draft.sound ? "" : " · kontrolü yarım kaldı, Eşitle ile tamamla"}
                </p>
                {preview && <Preview source={preview} />}
                <div className="owner-village-actions">
                  <button className="btn" disabled={!!busy} onClick={() => prepare("draft", draft.id)}>
                    <RefreshCw size={15} /> Eşitle
                  </button>
                  <button className="btn primary" disabled={!!busy || !draftReady} title={draftReady ? undefined : "Önce eşitle"} onClick={activate}>
                    Yeni köyü aç
                  </button>
                </div>
              </>
            )}
          </section>
          {previous && (
            <section>
              <h3>{previous.kind === "legacy" ? "Eski köy" : "Önceki köy"}</h3>
              <p>
                {previous.open ? `Dönüş için ${previous.daysLeft} gün kaldı.` : "Dönüş süresi doldu."}
                {previous.kind === "v2" && previous.behind ? " Önceki köy geride; dönmeden önce eşitlenmeli." : ""}
              </p>
              <div className="owner-village-actions">
                {previous.kind === "v2" && previous.open && previous.behind > 0 && (
                  <button className="btn" disabled={!!busy} onClick={() => prepare("previous", previous.id)}>
                    <RefreshCw size={15} /> Önceki köyü eşitle
                  </button>
                )}
                <button className="btn" disabled={!!busy || !previousReady} onClick={rollback}>
                  <RotateCcw size={15} /> {previous.kind === "legacy" ? "Eski köye dön" : "Önceki köye dön"}
                </button>
              </div>
            </section>
          )}
          {busy && (
            <p className="owner-village-busy" role="status">
              <LoaderCircle size={16} className="spin" /> {busy}
            </p>
          )}
          {note && <p className="owner-village-note" role="status">{note}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
