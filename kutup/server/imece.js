import { IMECE_ID, IMECE_PEOPLE, IMECE_PHASES, IMECE_ROLES, IMECE_TOTAL, imeceCapacity, imeceProgress, imeceTaskProgress } from "../shared/imece.js";

// Per-team project revision guards complement the app's per-village guard: two different
// villages must never reserve the same last shared minutes. Every statement is
// part of the SAME transaction as the normal focus session and its wage.
export function createImece({ db, fail }) {
  const bump = id => ["UPDATE imece_projects SET rev=rev+1 WHERE id=?", [id]];
  const guard = (id, rev) => [
    "INSERT OR REPLACE INTO write_guard (id,valid) VALUES (1,CASE WHEN EXISTS (SELECT 1 FROM imece_projects WHERE id=? AND rev=?) THEN 1 ELSE 0 END)",
    [id, rev],
  ];
  async function projectFor(memberId, groupId) {
    if(memberId) groupId=(await db.get("SELECT group_id FROM members WHERE id=?",[memberId]))?.group_id;
    if(!memberId&&groupId==="unassigned")return db.get("SELECT * FROM imece_projects WHERE group_id IS NULL ORDER BY started,id LIMIT 1");
    return groupId ? db.get("SELECT * FROM imece_projects WHERE group_id=?",[groupId])
      : memberId ? null : db.get("SELECT * FROM imece_projects ORDER BY started,id LIMIT 1");
  }
  async function read(id) {
    const [[project], crew, contributions, reservations] = await db.read([
      ["SELECT * FROM imece_projects WHERE id=?", [id]],
      ["SELECT c.slot, c.member_id AS memberId, c.seen_minutes AS seen, COALESCE(m.name,c.name) AS name, COALESCE(m.avatar,c.avatar) AS avatar, COALESCE(m.color,c.color) AS color,m.group_id AS groupId FROM imece_slots c LEFT JOIN members m ON m.id=c.member_id WHERE c.project_id=? ORDER BY c.slot", [id]],
      ["SELECT id,slot,phase,minutes,personal,created FROM imece_work WHERE project_id=? ORDER BY created,id", [id]],
      ["SELECT c.slot, m.focus_imece_phase AS phase, m.focus_minutes AS minutes, m.focus_imece_personal AS personal, m.focus_end AS ends FROM members m JOIN imece_slots c ON c.member_id=m.id AND c.project_id=m.focus_imece_project WHERE m.focus_imece=1 AND m.focus_end>0 AND c.project_id=?", [id]],
    ]);
    return { project, crew, contributions, reservations, progress: imeceProgress(contributions) };
  }
  async function view(memberId, groupId) {
    const project=await projectFor(memberId,groupId);
    if(!project)return null;
    const raw = await read(project.id);
    if (!raw.project) return null;
    const { crew, contributions, reservations, progress } = raw;
    const slot = memberId?crew.findIndex((c) => c.memberId === memberId):-1;
    const mine=contributions.filter(c=>c.slot===slot), mineTotal=mine.reduce((n,c)=>n+c.minutes,0);
    let own=0,global=0,firstUnseen=null;
    for(const c of contributions){
      if(c.slot===slot){own+=c.minutes;if(firstUnseen===null&&own>(crew[slot]?.seen||0))firstUnseen=global;}
      global+=c.minutes;
    }
    return {
      id: project.id, rev: project.rev, started: project.started, completed: project.completed,
      groupId:project.group_id,goal: IMECE_TOTAL, ...progress,
      crew: crew.map(({seen,groupId,...c}) => ({ ...c,
        ...(memberId&&groupId!==project.group_id?{memberId:null,name:"Görevli hesap düzeltilecek",avatar:"👷",color:"sand"}:{}),
        eligible:groupId===project.group_id,role: IMECE_ROLES[c.slot],
        minutes: contributions.filter((r) => r.slot === c.slot).reduce((n, r) => n+r.minutes, 0),
        personal: progress.phases.map((p) => p.personal[c.slot]),
        working: reservations.find((r) => r.slot === c.slot) || null,
      })),
      slot, capacity: imeceCapacity(progress, reservations, slot), tasks: imeceTaskProgress(progress),
      delivery: firstUnseen===null?null:{minutes:mineTotal-(crew[slot]?.seen||0),through:mineTotal,from:firstUnseen,to:progress.minutes},
      recent: contributions.slice(-8).reverse().map(({ slot, phase, minutes, personal, created }) => ({ slot, phase, minutes, personal, created })),
    };
  }
  async function launch(ids, now, groupId) {
    if (!Array.isArray(ids) || ids.length !== IMECE_PEOPLE || ids.some((x) => typeof x !== "string") || new Set(ids).size !== IMECE_PEOPLE)
      fail("Dört farklı kişiyi seç.");
    const members = await db.all("SELECT id,name,avatar,color,group_id FROM members WHERE id IN (?,?,?,?)", ids);
    if (members.length !== IMECE_PEOPLE) fail("Seçilen kişilerden biri artık uygulamada değil. Listeyi yenile.", 409);
    groupId ||= members[0].group_id;
    if(members.some(m=>m.group_id!==groupId))fail("Dört katılımcı da aynı ekipten olmalı.",409);
    if(await projectFor(null,groupId))fail("Bu ekibin projesi zaten başladı. Hesabı değiştir düğmesini kullan.",409);
    const id=crypto.randomUUID(),projectId=id;
    try {
      await db.batch([
        ["INSERT INTO imece_projects(id,group_id,started) VALUES (?,?,?)", [id,groupId,now]],
        ...ids.map((id, slot) => {
          const m = members.find((m) => m.id === id);
          return ["INSERT INTO imece_slots(project_id,slot,member_id,name,avatar,color) VALUES (?,?,?,?,?,?)", [projectId,slot, id, m.name, m.avatar, m.color]];
        }),
      ]);
    } catch (error) {
      if (await projectFor(null,groupId)) fail("Ortak proje zaten başladı.", 409);
      throw error;
    }
    return groupId;
  }
  async function assign(projectId,groupId,rev) {
    if(typeof projectId!=="string"||typeof groupId!=="string"||!Number.isInteger(rev))fail("Proje ve ekip seçimini kontrol et.");
    const raw=await read(projectId);
    if(!raw.project||raw.project.rev!==rev)fail("Şantiye değişti; yeniden oku.",409);
    if(!await db.get("SELECT id FROM groups WHERE id=?",[groupId]))fail("Ekip bulunamadı.",404);
    if(raw.reservations.length)fail("Önce bu projenin devam eden seanslarını bitirin veya durdurun.",409);
    try{await db.batch([guard(projectId,rev),["UPDATE imece_projects SET group_id=?,rev=rev+1 WHERE id=?",[groupId,projectId]]]);}
    catch(error){if(/snapshot_changed|UNIQUE|FOREIGN KEY/i.test(error.message))fail("Bu ekibin projesi var veya şantiye değişti. Yeniden oku; iki proje birleştirilmez.",409);throw error;}
  }
  async function replace(slot, memberId, rev, groupId) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= IMECE_PEOPLE || typeof memberId !== "string" || !memberId || !Number.isInteger(rev))
      fail("Katılımcı seçimini kontrol et.");
    const project=await projectFor(null,groupId);
    const raw=project?await read(project.id):{project:null};
    if (!raw.project || raw.project.rev !== rev) fail("Şantiye değişti. Katkıları yenileyip tekrar seç.", 409);
    if (raw.progress.complete || raw.project.completed) fail("Tamamlanan projenin kadrosu değiştirilemez.", 409);
    const current = raw.crew.find(c => c.slot === slot);
    if (!current) fail("Kadro kaydı bulunamadı.", 409);
    if (raw.crew.some(c => c.memberId === memberId)) fail("Bu hesap zaten kadroda. Farklı bir hesap seç.", 409);
    const member = await db.get("SELECT id,name,avatar,color,group_id FROM members WHERE id=?", [memberId]);
    if(member&&member.group_id!==raw.project.group_id)fail("Yalnız bu ekibin hesabını seçebilirsin.",403);
    if (!member) fail("Bu hesap artık uygulamada değil. Listeyi yenile.", 409);
    if (raw.reservations.some(r => r.slot === slot)) fail("Önce eski hesabın şantiye seansını tamamla veya durdur; sonra hesabı değiştir.", 409);
    try {
      await db.batch([
        guard(project.id,rev),
        // Also guard account deletion and unfinished sessions in this transaction.
        ["INSERT OR REPLACE INTO write_guard(id,valid) VALUES (1,CASE WHEN EXISTS (SELECT 1 FROM imece_slots WHERE project_id=? AND slot=? AND member_id IS ?) AND EXISTS (SELECT 1 FROM members WHERE id=?) AND NOT EXISTS (SELECT 1 FROM members WHERE id IN (?,?) AND focus_imece=1 AND focus_end>0) THEN 1 ELSE 0 END)", [project.id,slot, current.memberId, memberId, current.memberId, memberId]],
        ["UPDATE imece_slots SET member_id=?,name=?,avatar=?,color=? WHERE project_id=? AND slot=?", [memberId, member.name, member.avatar, member.color,project.id, slot]],
        bump(project.id),
      ]);
    } catch (error) {
      if (/snapshot_changed|FOREIGN KEY|UNIQUE constraint.*imece_slots/i.test(error.message)) fail("Şantiye veya hesap değişti. Katkıları yenileyip tekrar dene; varsa önce şantiye seansını bitir.", 409);
      throw error;
    }
  }
  async function reserve(memberId, minutes) {
    const project=await projectFor(memberId);
    const raw=project?await read(project.id):{project:null};
    if (!raw.project) fail("Ortak şantiye henüz açılmadı.", 409);
    const slot = raw.crew.findIndex((c) => c.memberId === memberId);
    if (slot < 0) fail("Bu projenin dört kişilik kadrosunda değilsin. Şantiyeyi ziyaret edebilirsin.", 403);
    if (raw.reservations.some((r) => r.slot === slot)) fail("Önce mevcut şantiye seansını tamamla veya durdur.", 409);
    if (raw.progress.complete) fail("Anıtkabir tamamlandı. Katkı defterinde emeğini görebilirsin.", 409);
    const capacity = imeceCapacity(raw.progress, raw.reservations, slot);
    if (minutes > capacity.available) fail(capacity.available < 25
      ? "Bu bölümde sana açık iş kalmadı. Diğer ustaların kişisel görevleri tamamlanınca yeni bölüm açılacak."
      : `Bu bölümde ${capacity.available} dakika iş seçebilirsin. Daha kısa bir seans seç.`, 409);
    return { projectId:project.id,phase: raw.progress.phase, personal: Math.min(minutes, capacity.personal), statements: [guard(project.id,raw.project.rev), bump(project.id)] };
  }
  async function settle(sessions, now) {
    const due = sessions.filter((s) => s.imece);
    if (!due.length) return [];
    const statements=[];
    for(const projectId of new Set(due.map(s=>s.imeceProject||IMECE_ID))){
    const raw=await read(projectId),rows=[...raw.contributions];
    if(!raw.project)throw new Error("İmece projesi bulunamadı.");
    statements.push(guard(projectId,raw.project.rev));
    for (const s of due.filter(s=>(s.imeceProject||IMECE_ID)===projectId)) {
      const person = raw.crew.find((c) => c.memberId === s.id);
      if (!person) throw new Error("İmece seansının kadro kaydı bulunamadı.");
      if (!s.done) continue; // cancelling or an incomplete watched session never moves the monument
      const contribution = { slot: person.slot, phase: s.imecePhase, minutes: s.credit, personal: s.imecePersonal };
      rows.push(contribution);
      statements.push([
        "INSERT INTO imece_work(id,project_id,slot,phase,minutes,personal,session_end,created) SELECT ?,?,?,?,?,?,?,? FROM members WHERE id=? AND focus_end=? AND focus_imece_ref=?",
        [s.imeceRef,projectId, contribution.slot, contribution.phase, contribution.minutes, contribution.personal, s.ends, now, s.id, s.ends, s.imeceRef],
      ]);
    }
    const progress = imeceProgress(rows);
    statements.push(["UPDATE imece_projects SET rev=rev+1, completed=CASE WHEN completed=0 THEN ? ELSE completed END WHERE id=?", [progress.complete ? now : 0,projectId]]);
    }
    return statements;
  }
  async function seen(memberId, through=2000) {
    if(!Number.isInteger(through)||through<0||through>2000)fail("Teslim kaydı geçerli değil.");
    const project=await projectFor(memberId);
    if(!project)return;
    await db.run("UPDATE imece_slots SET seen_minutes=MAX(seen_minutes,MIN(?,(SELECT COALESCE(sum(minutes),0) FROM imece_work WHERE project_id=imece_slots.project_id AND slot=imece_slots.slot))) WHERE project_id=? AND member_id=?",[through,project.id,memberId]);
  }
  return { view, launch, assign,replace, reserve, settle, seen, release: (memberId,projectId) => [["UPDATE imece_projects SET rev=rev+1 WHERE id=? OR id IN (SELECT project_id FROM imece_slots WHERE member_id=?)",[projectId||null,memberId]]] };
}
