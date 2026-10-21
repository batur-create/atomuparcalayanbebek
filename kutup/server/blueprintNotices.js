// UI acknowledgements never change ownership, discovery draws or rewards.
// Existing settings storage avoids another schema migration. One key/account.
export function createBlueprintNotices({db,fail}) {
  const key=id=>`blueprint-seen:${id}`;
  async function pending(memberId){
    const [owned,settings]=await db.read([
      ["SELECT model,source,created FROM unlocks WHERE member_id=? ORDER BY created,model",[memberId]],
      ["SELECT value FROM settings WHERE key=?",[key(memberId)]],
    ]);
    let row=settings[0];
    if(!row){
      // On first use old collection history is archived, recent finds remain.
      await db.run("INSERT OR IGNORE INTO settings(key,value) SELECT ?,? FROM members WHERE id=?",[key(memberId),JSON.stringify(owned.filter(p=>p.created<Date.now()-86400000).map(p=>p.model)),memberId]);
      row=await db.get("SELECT value FROM settings WHERE key=?",[key(memberId)]);
    }
    if(!row)return [];
    const seen=JSON.parse(row.value);
    return owned.filter(p=>!seen.includes(p.model));
  }
  async function seen(memberId,expectedId,models){
    if(expectedId!==memberId)fail("Hesap değişti; planları yeniden oku.",409);
    if(!Array.isArray(models)||!models.length||models.length>32||models.some(id=>typeof id!=="string"||id.length>64))fail("Plan seçimi okunamadı.");
    const own=new Set((await db.all("SELECT model FROM unlocks WHERE member_id=?",[memberId])).map(p=>p.model));
    if(models.some(id=>!own.has(id)))fail("Yalnız kendi bulduğun planı teslim alabilirsin.",403);
    // Atomic JSON append across devices; only the displayed models are seen.
    await db.batch([
      ["INSERT OR IGNORE INTO settings(key,value) VALUES (?, '[]')",[key(memberId)]],
      ...[...new Set(models)].map(model=>["UPDATE settings SET value=json_insert(value,'$[#]',?) WHERE key=? AND NOT EXISTS(SELECT 1 FROM json_each(settings.value) WHERE value=?)",[model,key(memberId),model]]),
    ]);
  }
  return {pending,seen,key};
}
