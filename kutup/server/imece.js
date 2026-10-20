import { IMECE_ID, IMECE_PEOPLE, IMECE_PHASES, IMECE_ROLES, IMECE_TOTAL, imeceCapacity, imeceProgress, imeceTaskProgress } from "../shared/imece.js";

// Project revision guards complement the app's per-village guard: two different
// villages must never reserve the same last shared minutes. Every statement is
// part of the SAME transaction as the normal focus session and its wage.
export function createImece({ db, fail }) {
  const bump = () => ["UPDATE imece_project SET rev = rev + 1 WHERE id = ?", [IMECE_ID]];
  const guard = (rev) => [
    "INSERT OR REPLACE INTO write_guard (id,valid) VALUES (1,CASE WHEN EXISTS (SELECT 1 FROM imece_project WHERE id=? AND rev=?) THEN 1 ELSE 0 END)",
    [IMECE_ID, rev],
  ];
  async function read() {
    const [[project], crew, contributions, reservations] = await db.read([
      ["SELECT * FROM imece_project WHERE id=?", [IMECE_ID]],
      ["SELECT c.slot, c.member_id AS memberId, c.seen_minutes AS seen, COALESCE(m.name,c.name) AS name, COALESCE(m.avatar,c.avatar) AS avatar, COALESCE(m.color,c.color) AS color FROM imece_crew c LEFT JOIN members m ON m.id=c.member_id ORDER BY c.slot", []],
      ["SELECT id,slot,phase,minutes,personal,created FROM imece_contributions ORDER BY created,id", []],
      ["SELECT c.slot, m.focus_imece_phase AS phase, m.focus_minutes AS minutes, m.focus_imece_personal AS personal, m.focus_end AS ends FROM members m JOIN imece_crew c ON c.member_id=m.id WHERE m.focus_imece=1 AND m.focus_end>0", []],
    ]);
    return { project, crew, contributions, reservations, progress: imeceProgress(contributions) };
  }
  async function view(memberId) {
    const raw = await read();
    if (!raw.project) return null;
    const { project, crew, contributions, reservations, progress } = raw;
    const slot = crew.findIndex((c) => c.memberId === memberId);
    const mine=contributions.filter(c=>c.slot===slot), mineTotal=mine.reduce((n,c)=>n+c.minutes,0);
    let own=0,global=0,firstUnseen=null;
    for(const c of contributions){
      if(c.slot===slot){own+=c.minutes;if(firstUnseen===null&&own>(crew[slot]?.seen||0))firstUnseen=global;}
      global+=c.minutes;
    }
    return {
      id: project.id, rev: project.rev, started: project.started, completed: project.completed,
      goal: IMECE_TOTAL, ...progress,
      crew: crew.map(({seen,...c}) => ({ ...c, role: IMECE_ROLES[c.slot],
        minutes: contributions.filter((r) => r.slot === c.slot).reduce((n, r) => n+r.minutes, 0),
        personal: progress.phases.map((p) => p.personal[c.slot]),
        working: reservations.find((r) => r.slot === c.slot) || null,
      })),
      slot, capacity: imeceCapacity(progress, reservations, slot), tasks: imeceTaskProgress(progress),
      delivery: firstUnseen===null?null:{minutes:mineTotal-(crew[slot]?.seen||0),through:mineTotal,from:firstUnseen,to:progress.minutes},
      recent: contributions.slice(-8).reverse().map(({ slot, phase, minutes, personal, created }) => ({ slot, phase, minutes, personal, created })),
    };
  }
  async function launch(ids, now) {
    if (!Array.isArray(ids) || ids.length !== IMECE_PEOPLE || ids.some((x) => typeof x !== "string") || new Set(ids).size !== IMECE_PEOPLE)
      fail("Dört farklı kişiyi seç. Kadro başlangıçta kesinleşir.");
    if (await db.get("SELECT id FROM imece_project WHERE id=?", [IMECE_ID])) fail("Ortak proje zaten başladı. Kadro ve hedef sonradan değişmez.", 409);
    const members = await db.all("SELECT id,name,avatar,color FROM members WHERE id IN (?,?,?,?)", ids);
    if (members.length !== IMECE_PEOPLE) fail("Seçilen kişilerden biri artık uygulamada değil. Listeyi yenile.", 409);
    try {
      await db.batch([
        ["INSERT INTO imece_project(id,started) VALUES (?,?)", [IMECE_ID, now]],
        ...ids.map((id, slot) => {
          const m = members.find((m) => m.id === id);
          return ["INSERT INTO imece_crew(slot,member_id,name,avatar,color) VALUES (?,?,?,?,?)", [slot, id, m.name, m.avatar, m.color]];
        }),
      ]);
    } catch (error) {
      if (await db.get("SELECT id FROM imece_project WHERE id=?", [IMECE_ID])) fail("Ortak proje zaten başladı.", 409);
      throw error;
    }
  }
  async function reserve(memberId, minutes) {
    const raw = await read();
    if (!raw.project) fail("Ortak şantiye henüz açılmadı.", 409);
    const slot = raw.crew.findIndex((c) => c.memberId === memberId);
    if (slot < 0) fail("Bu projenin dört kişilik kadrosunda değilsin. Şantiyeyi ziyaret edebilirsin.", 403);
    if (raw.reservations.some((r) => r.slot === slot)) fail("Önce mevcut şantiye seansını tamamla veya durdur.", 409);
    if (raw.progress.complete) fail("Anıtkabir tamamlandı. Katkı defterinde emeğini görebilirsin.", 409);
    const capacity = imeceCapacity(raw.progress, raw.reservations, slot);
    if (minutes > capacity.available) fail(capacity.available < 25
      ? "Bu bölümde sana açık iş kalmadı. Diğer ustaların kişisel görevleri tamamlanınca yeni bölüm açılacak."
      : `Bu bölümde ${capacity.available} dakika iş seçebilirsin. Daha kısa bir seans seç.`, 409);
    return { phase: raw.progress.phase, personal: Math.min(minutes, capacity.personal), statements: [guard(raw.project.rev), bump()] };
  }
  async function settle(sessions, now) {
    const due = sessions.filter((s) => s.imece);
    if (!due.length) return [];
    const raw = await read(), rows = [...raw.contributions], statements = [guard(raw.project.rev)];
    for (const s of due) {
      const person = raw.crew.find((c) => c.memberId === s.id);
      if (!person) throw new Error("İmece seansının kadro kaydı bulunamadı.");
      if (!s.done) continue; // cancelling or an incomplete watched session never moves the monument
      const contribution = { slot: person.slot, phase: s.imecePhase, minutes: s.credit, personal: s.imecePersonal };
      rows.push(contribution);
      statements.push([
        "INSERT INTO imece_contributions(id,slot,phase,minutes,personal,session_end,created) SELECT ?,?,?,?,?,?,? FROM members WHERE id=? AND focus_end=? AND focus_imece_ref=?",
        [s.imeceRef, contribution.slot, contribution.phase, contribution.minutes, contribution.personal, s.ends, now, s.id, s.ends, s.imeceRef],
      ]);
    }
    const progress = imeceProgress(rows);
    statements.push(["UPDATE imece_project SET rev=rev+1, completed=CASE WHEN completed=0 THEN ? ELSE completed END WHERE id=?", [progress.complete ? now : 0, IMECE_ID]]);
    return statements;
  }
  async function seen(memberId, through=2000) {
    if(!Number.isInteger(through)||through<0||through>2000)fail("Teslim kaydı geçerli değil.");
    await db.run("UPDATE imece_crew SET seen_minutes=MAX(seen_minutes,MIN(?,(SELECT COALESCE(sum(minutes),0) FROM imece_contributions WHERE slot=imece_crew.slot))) WHERE member_id=?",[through,memberId]);
  }
  return { view, launch, reserve, settle, seen, release: () => [bump()] };
}
