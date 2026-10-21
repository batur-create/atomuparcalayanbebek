// Komuta merkezi → Ekipler (n45): open a team with nobody in it, rename a
// team, and see, copy or renew its invite. The server checks the owner and
// every value; nothing here signs anyone in or out.
import React, { useState } from "react";
import { Check, Copy, Plus, RefreshCw } from "lucide-react";
import { api } from "./api.js";
import { Busy } from "./ui.jsx";
import { Modal } from "./Modal.jsx";

const inviteUrl = (invite) => `${location.origin}/join/${invite}`;

// One key per opened form: a double tap or a retried call after a lost answer
// sends the same key, and the server gives back the team it already made.
function requestKey() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function copyText(value, field) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    field?.focus();
    field?.select();
    return false;
  }
}

export function InviteLink({ group, changed, canRenew = true }) {
  const [copied, setCopied] = useState(false),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  const id = `invite-${group.id}`;
  const url = inviteUrl(group.invite);
  const copy = async () => {
    setError("");
    const ok = await copyText(url, document.getElementById(id));
    setCopied(ok);
    setNote(ok ? "Kopyalandı. Bağlantıyı yalnız bu ekibe katılacaklara gönder." : "Kopyalanamadı; bağlantı seçili, elle kopyalayabilirsin.");
  };
  const renew = async () => {
    if (!confirm(`${group.name}: davet bağlantısı yenilensin mi?\n\nEski bağlantı artık açılmaz. Ekipteki kimse çıkmaz; yeni bağlantıyı katılacaklara gönderirsin.`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`/owner/groups/${group.id}/invite`, {});
      await changed();
      setCopied(false);
      setNote("Yeni davet hazır. Eski bağlantı artık açılmıyor.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="owner-invite">
      <label className="owner-invite-label" htmlFor={id}>Davet bağlantısı</label>
      <div className="owner-invite-row">
        <input id={id} className="owner-invite-url" readOnly value={url} onFocus={(e) => e.target.select()} />
        <button type="button" className="btn outline" onClick={copy} aria-label={`${group.name} davet bağlantısını kopyala`}>
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Kopyalandı" : "Kopyala"}
        </button>
        {canRenew && (
          <Busy className="btn outline" loading={busy} onClick={renew} aria-label={`${group.name} davetini yenile`}>
            <RefreshCw size={15} /> Yenile
          </Busy>
        )}
      </div>
      {error ? <p className="form-error">{error}</p> : note && <p className="owner-invite-note" role="status">{note}</p>}
    </div>
  );
}

export function NewTeamModal({ close, changed }) {
  const [key] = useState(requestKey),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [team, setTeam] = useState(null);
  const create = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/owner/groups", { name: name.trim(), requestKey: key });
      setTeam(result.group);
      await changed();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Yeni ekip kur" subtitle="Ekip boş kurulur; davet bağlantısıyla gelenler katılır." close={close}>
      {team ? (
        <>
          <p className="owner-sent" role="status">
            <b>{team.name}</b> kuruldu. İçinde henüz kimse yok; sen de üye olmadın, oturumların aynen duruyor.
          </p>
          <InviteLink group={team} changed={changed} canRenew={false} />
          <p className="form-footnote">Son kişi ayrılsa da bu ekip silinmez. Anıtkabir ekip seçicisinde de görünür; proje sen başlatmadıkça açılmaz.</p>
          <button className="btn primary full" onClick={close}>Tamam</button>
        </>
      ) : (
        <form onSubmit={create}>
          <label className="field-label">
            Ekip adı <span>{name.trim().length}/40</span>
            <input autoFocus required minLength={2} maxLength={40} value={name} disabled={busy} placeholder="Örn. Hukuk tayfası" onChange={(e) => setName(e.target.value)} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <Busy className="btn primary full" type="submit" loading={busy} disabled={name.trim().length < 2}>
            <Plus size={16} /> Ekibi kur
          </Busy>
          <p className="form-footnote">Kimseyi eklemez, hesap açmaz. Bağlantı gelmezse aynı düğmeye yeniden basmak ikinci bir ekip kurmaz.</p>
        </form>
      )}
    </Modal>
  );
}

export function RenameTeamModal({ group, close, changed }) {
  const [name, setName] = useState(group.name),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/owner/groups/${group.id}/name`, { name: name.trim() });
      await changed();
      close();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  const same = name.trim().replace(/\s+/g, " ") === group.name;
  return (
    <Modal title="Ekip adını düzenle" subtitle={`${group.members.length} kişi · yeni ad herkesin uygulamasında görünür`} close={close}>
      <form onSubmit={save}>
        <label className="field-label">
          Ekip adı <span>{name.trim().length}/40</span>
          <input autoFocus required minLength={2} maxLength={40} value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <Busy className="btn primary full" type="submit" loading={busy} disabled={name.trim().length < 2 || same}>
          <Check size={16} /> Adı kaydet
        </Busy>
      </form>
    </Modal>
  );
}
