// Komuta merkezi (n43): what Batur can give a friend, and take back. A
// building lands finished in their village; a blueprint opens a rare building
// in their catalogue; a building in their village can be removed.
import React, { useEffect, useState } from "react";
import { Check, Gift, Send, Trash2 } from "lucide-react";
import { api, get, dateLabel, minutesLabel } from "./api.js";
import { CATALOG, CATEGORIES, CLASSES, BY_ID } from "../shared/catalog.js";
import { Busy } from "./ui.jsx";
import { Modal } from "./Modal.jsx";
import { BuildingThumb } from "./Economy.jsx";
import { Loading } from "./Illustrations.jsx";

const DEFAULT_NOTE = "Batur'dan hediye";
// Buildings whose plan can be given: the rare ones and the weekly ones (after
// their fortnight they only come with a plan).
const PLANNED = CATALOG.filter((item) => item.rare === true || item.since);

export function GiftModal({ member, close, changed }) {
  const [tab, setTab] = useState("building"),
    [pick, setPick] = useState(null),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(""),
    [done, setDone] = useState(""),
    [error, setError] = useState(""),
    [village, setVillage] = useState(null),
    [onlyAnit,setOnlyAnit] = useState(false);
  const load = () =>
    get(`/owner/members/${member.id}/village${onlyAnit?"?model=anitkabir":""}`)
      .then(setVillage)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [member.id,onlyAnit]);
  const run = async (key, fn, message) => {
    setBusy(key);
    setError("");
    setDone("");
    try {
      await fn();
      setDone(message);
      await load();
      changed?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const item = pick && BY_ID[pick];
  const built = {};
  for (const b of village?.buildings || []) built[b.model] = (built[b.model] || 0) + 1;
  return (
    <Modal wide title={`${member.name} için 🎁`} subtitle="Yapı ver, plan ver ya da köyündeki bir yapıyı geri al." close={close} className="gift-modal">
      <div className="filter-row gift-tabs" role="tablist">
        {[
          ["building", "🏗️ Yapı ver"],
          ["plan", "📜 Plan ver"],
          ["village", `🏘️ Köyü${village ? ` · ${village.buildings.length}` : ""}`],
        ].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`filter-chip ${tab === id ? "selected" : ""}`} onClick={() => (setTab(id), setDone(""), setError(""))}>
            {label}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      {done && <p className="owner-sent" role="status">{done}</p>}
      {tab === "building" && (
        <>
          <p className="gift-lead">Seçtiğin yapı {member.name} kişisinin köyüne bitmiş halde konur. Uygulamayı açınca şantiyesini 18 saniyede izler, Pano’ya ve telefonuna “Batur’dan hediye” düşer.</p>
          {Object.entries(CLASSES).map(([cls, info]) => (
            <section key={cls} className="gift-class">
              <h3>
                {info.label} <small>{info.minutes} dk’lık yapılar</small>
              </h3>
              <div className="gift-grid">
                {CATALOG.filter((x) => x.class === cls).map((x) => (
                  <button key={x.id} type="button" className={`gift-item ${pick === x.id ? "selected" : ""}`} aria-pressed={pick === x.id} onClick={() => setPick(x.id)}>
                    <BuildingThumb id={x.id} size={64} />
                    <span>
                      {x.emoji} {x.name}
                    </span>
                    <small>
                      {CATEGORIES[x.category]}
                      {x.rare ? " · nadir" : ""}
                      {built[x.id] ? ` · onda ${built[x.id]}` : ""}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <div className="gift-send">
            <label className="field-label">
              Not <span>isteğe bağlı · binanın kartında ve bildirimde görünür</span>
              <input maxLength={60} value={note} placeholder={DEFAULT_NOTE} onChange={(e) => setNote(e.target.value)} />
            </label>
            <Busy
              className="btn primary full"
              loading={busy === "gift"}
              disabled={!item || !!busy}
              onClick={() =>
                run(
                  "gift",
                  () => api(`/owner/members/${member.id}/gift`, { model: item.id, note: note.trim() }),
                  `${item.emoji} ${item.name} ${member.name} kişisinin köyüne kondu. Bildirimi açıksa telefonuna düştü 🎁`,
                )
              }
            >
              <Gift size={16} /> {item ? `${item.name} hediye et` : "Önce bir yapı seç"}
            </Busy>
          </div>
        </>
      )}
      {tab === "plan" && (
        <>
          <p className="gift-lead">Plan, yapıyı {member.name} kişisinin kataloğunda açar; inşa etmek için kendisi bir seans çalışır.</p>
          {!village ? (
            <Loading text="Planlar okunuyor…" />
          ) : (
            <ul className="gift-plans">
              {PLANNED.map((x) => {
                const has = village.unlocks.includes(x.id);
                return (
                  <li key={x.id}>
                    <BuildingThumb id={x.id} size={48} />
                    <span>
                      <strong>
                        {x.emoji} {x.name}
                      </strong>
                      <small>{x.rare ? "Nadir yapı" : "Haftanın yapısıydı"}</small>
                    </span>
                    {has ? (
                      <span className="gift-has">
                        <Check size={15} /> Planı var
                      </span>
                    ) : (
                      <Busy
                        className="btn outline"
                        loading={busy === x.id}
                        disabled={!!busy}
                        onClick={() => run(x.id, () => api(`/owner/members/${member.id}/unlock`, { model: x.id }), `${x.name} planı ${member.name} kişisinin kataloğunda açıldı 📜`)}
                      >
                        Planı ver
                      </Busy>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      {tab === "village" && (
        <>
          <p className="gift-lead">Yanlış bir hediyeyi ya da hatalı bir yapıyı geri alırsın. Yeri boşalır; tuğlası ve odak dakikaları olduğu gibi kalır.</p>
          <label className="field-label"><span><input type="checkbox" checked={onlyAnit} onChange={e=>setOnlyAnit(e.target.checked)}/> Yalnız Anıtkabir</span></label>
          {onlyAnit&&village&&!village.buildings.some(b=>b.model==="anitkabir")&&<p className="gift-lead">Bu kişinin köyünde kaldırılacak Anıtkabir yok.</p>}
          {!village ? (
            <Loading text="Köy okunuyor…" />
          ) : !village.buildings.length ? (
            <p className="gift-lead">Köyünde henüz yapı yok.</p>
          ) : (
            <ul className="gift-plans">
              {village.buildings.filter(b=>!onlyAnit||b.model==="anitkabir").map((b) => {
                const x = BY_ID[b.model] || BY_ID.kulube;
                return (
                  <li key={b.id}>
                    <BuildingThumb id={x.id} size={48} />
                    <span>
                      <strong>
                        {x.emoji} {x.name}
                      </strong>
                      <small>
                        {dateLabel(b.created)} · {b.gift ? "🎁 hediye" : `${minutesLabel(b.minutes)} odak`}
                        {b.likes ? ` · ${b.likes} kalp` : ""}
                      </small>
                    </span>
                    <Busy
                      className="icon-button"
                      loading={busy === b.id}
                      disabled={!!busy}
                      aria-label={`${x.name} yapısını kaldır`}
                      title="Yapıyı kaldır"
                      onClick={() => {
                        if (confirm(`${member.name} kişisinin ${x.name} yapısı köyden kaldırılsın mı? Geri getirmek için yeniden hediye etmen gerekir.`))
                          run(b.id, () => api(`/owner/buildings/${b.id}`, undefined, "DELETE"), `${x.name} köyden kaldırıldı.`);
                      }}
                    >
                      <Trash2 size={16} />
                    </Busy>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}

/** One line from Batur to a whole team: board, home page and every phone. */
export function AnnounceModal({ group, close }) {
  const [value, setValue] = useState(""),
    [sure, setSure] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const send = async () => {
    if (!sure) return setSure(true);
    setBusy(true);
    setError("");
    try {
      await api(`/owner/groups/${group.id}/announce`, { text: value.trim() });
      setSent(true);
    } catch (e) {
      setError(e.message);
      setSure(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="📣 Ekibe duyuru" subtitle={`${group.name} · ${group.members.length} kişi`} close={close}>
      {sent ? (
        <>
          <p className="owner-sent" role="status">Gönderildi. Pano’da öne çıktı, herkesin ana sayfasında 3 gün duracak; bildirimi açık olanların telefonuna düştü 📣</p>
          <button className="btn primary full" onClick={close}>Tamam</button>
        </>
      ) : (
        <>
          <label className="field-label">
            Ne duyuruyorsun? <span>{value.length}/280</span>
            <textarea rows={4} maxLength={280} autoFocus value={value} placeholder="Örn. Yeni sürüm geldi! Bu akşam 20.00’de Pano’da çekiliş var 🎉" onChange={(e) => (setValue(e.target.value), setSure(false))} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <Busy className={`btn ${sure ? "dark" : "primary"} full`} loading={busy} disabled={value.trim().length < 2 || busy} onClick={send}>
            <Send size={16} /> {sure ? `Eminim, ${group.members.length} kişiye gönder` : "Herkese gönder"}
          </Busy>
          {sure && <p className="form-footnote">Gönderince geri alınamaz: herkesin telefonuna bildirim gider.</p>}
        </>
      )}
    </Modal>
  );
}
