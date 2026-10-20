import { PLAN_DAY, PLAN_COLUMNS, PLAN_ANSWERS, PLAN_VISIBLE_SQL, assemblePlans, planDay, planDeadline, planWhen, planStamp } from "../shared/plans.js";

export function createPlans({db,retrying,bump,fail,text,notify,notifyMember,systemMessage,authLimit,sessionAge,now=Date.now}){
  const owned=async(m,id)=>{
    const p=await db.get("SELECT * FROM plans WHERE id=? AND group_id=?",[id,m.group_id]);
    if(!p)fail("Buluşma bulunamadı.",404);return p;
  };
  const live=p=>{if(p.cancelled)fail("Bu buluşma iptal edildi.",409);if(now()>=planDeadline(p))fail("Bu buluşma sona erdi.",409);};
  const flag=(v,name)=>{if(v!==undefined&&typeof v!=="boolean")fail(`${name} seçimi okunamadı.`);return v===true;};
  const arrival=(p,value)=>{
    const at=Number(value??p.starts);
    if(!Number.isSafeInteger(at)||at<planDay(p.starts)||at>=planDeadline(p))fail("Geliş saatin buluşma gününde ve varsa bitişinden önce olmalı.");
    return at;
  };
  const fields=(body,p)=>{
    const starts=Number(body.starts??p?.starts),ends=Number(body.ends??p?.ends??0),at=now();
    if(!Number.isSafeInteger(starts)||(!p||starts!==p.starts)&&(starts<at-60000||starts>=planDay(at)+15*PLAN_DAY))fail("Bugünden başlayarak iki hafta içinde bir gün ve ileri bir saat seç.");
    if(!Number.isSafeInteger(ends)||ends!==0&&(ends<=starts||ends>starts+PLAN_DAY))fail("Bitiş, başlangıçtan sonra ve en fazla 24 saat içinde olmalı.");
    return{starts,ends,note:text(body.note??p?.note??"",80,"Buluşma adı")};
  };
  const answerStatement=(p,m,answer,at,remind,note="")=>[
    `INSERT INTO attendees(plan_id,member_id,answer,arrival,schedule,remind,response_note) VALUES(?,?,?,?,?,?,?)
     ON CONFLICT(plan_id,member_id) DO UPDATE SET answer=excluded.answer,arrival=excluded.arrival,schedule=excluded.schedule,remind=excluded.remind,response_note=excluded.response_note`,
    [p.id,m.id,answer,at,p.schedule,remind?1:0,note],
  ];
  async function detail(m,id){
    const [plans,answers]=await db.read([
      [`SELECT ${PLAN_COLUMNS} FROM plans p WHERE p.id=? AND p.group_id=?`,[id,m.group_id]],
      [`SELECT ${PLAN_ANSWERS} FROM attendees a JOIN plans p ON p.id=a.plan_id WHERE p.id=? AND p.group_id=?`,[id,m.group_id]],
    ]);
    if(!plans.length)fail("Buluşma bulunamadı. Bağlantı başka bir ekibe ait olabilir.",404);
    return assemblePlans(plans,answers)[0];
  }
  async function list(m,offset=0,day=null){
    if(!Number.isSafeInteger(offset)||offset<0||offset>10000)fail("Sayfa okunamadı.");
    const at=now(),start=day===null?null:planStamp(day,"00:00");
    if(start!==null&&!Number.isFinite(start))fail("Buluşma günü okunamadı.");
    const where=`p.group_id=? AND p.cancelled=0 AND ${PLAN_VISIBLE_SQL}>?${start===null?"":" AND p.starts>=? AND p.starts<?"}`;
    const args=[m.group_id,at,...(start===null?[]:[start,start+PLAN_DAY])];
    const [plans,answers,total]=await db.read([
      [`SELECT ${PLAN_COLUMNS} FROM plans p WHERE ${where} ORDER BY p.starts,p.id LIMIT 30 OFFSET ?`,[...args,offset]],
      [`SELECT ${PLAN_ANSWERS} FROM attendees a JOIN plans p ON p.id=a.plan_id WHERE p.id IN(SELECT p.id FROM plans p WHERE ${where} ORDER BY p.starts,p.id LIMIT 30 OFFSET ?)`,[...args,offset]],
      [`SELECT count(*) AS n FROM plans p WHERE ${where}`,args],
    ]);
    return{plans:assemblePlans(plans,answers),total:total[0].n};
  }
  async function create(m,body,ctx){
    const f=fields(body),separate=flag(body.separate,"Ayrı buluşma"),remind=flag(body.remind,"Hatırlatma");
    const key=body.requestKey==null?null:text(body.requestKey,80,"İstek",8);
    if(separate&&f.note.trim().length<3)fail("Ayrı buluşmayı ayıran kısa bir ad yaz.");
    let result;
    await retrying(async()=>{
      const repeated=key&&await db.get("SELECT id FROM plans WHERE member_id=? AND request_key=?",[m.id,key]);
      if(repeated){result={id:repeated.id,repeated:true};return[];}
      const same=await db.all("SELECT * FROM plans WHERE group_id=? AND cancelled=0 AND starts>=? AND starts<? ORDER BY ABS(starts-?),id",[m.group_id,planDay(f.starts),planDay(f.starts)+PLAN_DAY,f.starts]);
      // Default: join the day's existing meeting at your own arrival time.
      // Explicit separate gatherings are allowed; exact-time copies still coalesce.
      const existing=same.find(p=>(!separate||Math.floor(p.starts/60000)===Math.floor(f.starts/60000))&&planDeadline(p)>f.starts&&planDeadline(p)>now());
      if(existing){
        const at=arrival(existing,f.starts);result={id:existing.id,existing:true};
        return[answerStatement(existing,m,"yes",at,remind),bump(m.group_id)];
      }
      if(!separate&&same.some(p=>planDeadline(p)>now()))fail("O günkü buluşma bu saatten önce bitiyor. Ayrı bir buluşma açabilir veya uygun bir geliş saati seçebilirsin.",409);
      const n=await db.get("SELECT count(*) AS n FROM plans WHERE member_id=? AND starts>? AND cancelled=0",[m.id,now()]);
      if(n.n>=10)fail("En fazla 10 gelecek buluşman olabilir.");
      await authLimit(`plan:${m.id}`,6);
      const p={...f,id:crypto.randomUUID(),schedule:1};result={id:p.id,created:true};
      return[
        ["INSERT INTO plans(id,group_id,member_id,starts,ends,note,updated,request_key) VALUES(?,?,?,?,?,?,?,?)",[p.id,m.group_id,m.id,p.starts,p.ends,p.note,now(),key]],
        answerStatement(p,m,"yes",p.starts,remind),systemMessage(m.group_id,m.id,"yeni bir kütüp buluşması planladı. Kendi geliş saatini seçip katılabilirsin. 🗓️"),bump(m.group_id),
      ];
    },m.group_id);
    if(result.created)await notify(ctx,m.group_id,m.id,{title:`${m.name} kütüp buluşması planladı 🗓️`,body:`${f.note||"Kütüpte buluşalım"} · ${planWhen(f.starts)}. Kendi geliş saatini seç.`,tag:`plan-${result.id}`,url:`/?plan=${encodeURIComponent(result.id)}`});
    return result;
  }
  async function answer(m,id,body,legacy=false){
    let choice=body.answer;
    if(legacy)choice="yes";
    else if(choice===undefined&&typeof body.going==="boolean")choice=body.going?"yes":"no";
    if(!["yes","no","maybe","clear"].includes(choice))fail("Varım, gelemem veya kararsızım seçeneklerinden birini seç.");
    const remind=flag(body.remind,"Hatırlatma"),note=text(body.note??"",80,"Katılım notu");
    await retrying(async()=>{
      const p=await owned(m,id);live(p);
      if((legacy||body.answer===undefined)&&p.member_id===m.id)fail("Bu buluşmayı sen oluşturdun; kartından geliş saatini düzenleyebilirsin.");
      if(body.schedule!==undefined?body.schedule!==p.schedule:p.schedule>1)fail("Buluşmanın saati değişti. Kartı yenileyip yeni saati onayla.",409);
      if(choice==="clear")return[["DELETE FROM attendees WHERE plan_id=? AND member_id=?",[id,m.id]],bump(m.group_id)];
      const at=choice==="yes"?arrival(p,body.arrival):null;
      return[answerStatement(p,m,choice,at,choice==="yes"&&remind,note),bump(m.group_id)];
    },m.group_id);
  }
  async function update(m,id,body,ctx,cancel=false){
    let updated,changed=false;
    await retrying(async()=>{
      const p=await owned(m,id);
      if(p.member_id!==m.id)fail("Buluşmayı yalnız oluşturan kişi değiştirebilir.",404);
      if(cancel&&p.cancelled){updated=p;return[];}
      live(p);
      if((body.rev??(cancel&&p.rev===1?1:null))!==p.rev)fail("Buluşma başka bir cihazda değişti. Kartı yenileyip tekrar dene.",409);
      const f=cancel?p:fields(body,p),retime=!cancel&&(f.starts!==p.starts||f.ends!==p.ends);
      if(!cancel&&f.starts===p.starts&&f.ends===p.ends&&f.note===p.note){updated=p;return[];}
      if(!cancel&&f.starts!==p.starts){
        const duplicate=await db.get("SELECT id FROM plans WHERE group_id=? AND id<>? AND cancelled=0 AND starts>=? AND starts<?",[m.group_id,id,Math.floor(f.starts/60000)*60000,Math.floor(f.starts/60000)*60000+60000]);
        if(duplicate)fail("Bu saatte zaten bir buluşma var. Mevcut karttan kendi geliş saatini değiştirebilirsin.",409);
      }
      await authLimit(`plan-edit:${m.id}`,12);
      updated={...p,...f,rev:p.rev+1,schedule:p.schedule+(retime?1:0),cancelled:cancel?now():0};changed=true;
      const own=retime?await db.get("SELECT * FROM attendees WHERE plan_id=? AND member_id=?",[id,m.id]):null;
      const ownArrival=own?.arrival&&own.arrival!==p.starts&&own.arrival>=planDay(updated.starts)&&own.arrival<planDeadline(updated)?own.arrival:updated.starts;
      return[
        ["UPDATE plans SET starts=?,ends=?,note=?,rev=?,schedule=?,cancelled=?,updated=? WHERE id=? AND rev=?",[updated.starts,updated.ends,updated.note,updated.rev,updated.schedule,updated.cancelled,now(),id,p.rev]],
        ...(retime&&own?[answerStatement(updated,m,own.answer,own.answer==="yes"?ownArrival:null,!!own.remind,own.response_note)]:[]),
        systemMessage(m.group_id,m.id,cancel?`“${p.note||"Kütüp buluşması"}” buluşmasını iptal etti.`:retime?`“${p.note||"Kütüp buluşması"}” saatini değiştirdi. Katılımını yeniden onayla.`:`“${p.note||"Kütüp buluşması"}” açıklamasını güncelledi.`),bump(m.group_id),
      ];
    },m.group_id);
    if(changed){
      const people=await db.all("SELECT member_id AS id FROM attendees WHERE plan_id=? AND member_id<>? AND answer IN('yes','maybe')",[id,m.id]);
      for(const person of people)await notifyMember(ctx,person.id,{title:cancel?"Kütüp buluşması iptal edildi":updated.schedule>1?"Buluşma güncellendi · Saatini onayla":"Buluşma güncellendi",body:cancel?updated.note||"Katıldığın buluşma iptal edildi.":`${updated.note||"Kütüpte buluşalım"} · ${planWhen(updated.starts)}`,tag:`plan-${id}`,url:`/?plan=${encodeURIComponent(id)}`});
    }
    return updated;
  }
  async function tick(ctx){
    const at=now();
    const due=await db.all(`SELECT p.id,p.schedule,p.note,a.member_id AS memberId,a.arrival FROM attendees a JOIN plans p ON p.id=a.plan_id
      WHERE p.cancelled=0 AND a.answer='yes' AND a.schedule=p.schedule AND a.remind=1 AND a.arrival>? AND a.arrival<=?
      AND NOT EXISTS(SELECT 1 FROM plan_push_events e WHERE e.id='plan:'||p.id||':'||a.member_id||':'||p.schedule||':'||a.arrival)
      AND EXISTS(SELECT 1 FROM subscriptions s JOIN sessions ss ON ss.token=s.session_token AND ss.member_id=s.member_id WHERE s.member_id=a.member_id AND ss.created>?) ORDER BY a.arrival LIMIT 20`,[at,at+30*60000,at-sessionAge]);
    for(const p of due){
      await notifyMember(ctx,p.memberId,{title:"Kütüp buluşman yaklaşıyor 🗓️",body:`Senin gelişin: ${planWhen(p.arrival)} · ${p.note||"Kütüpte buluşalım"}`,tag:`plan-${p.id}`,url:`/?plan=${encodeURIComponent(p.id)}`,planReminder:{id:p.id,schedule:p.schedule,arrival:p.arrival}},
        {defer:true,ttl:Math.max(1,Math.floor((p.arrival-at)/1000)),dedupe:{kind:"plan",id:`plan:${p.id}:${p.memberId}:${p.schedule}:${p.arrival}`,planId:p.id,memberId:p.memberId,schedule:p.schedule,arrival:p.arrival}});
    }
  }
  return{detail,list,create,answer,update,tick};
}
