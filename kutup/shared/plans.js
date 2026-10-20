// One meeting, one answer per person. All calendar boundaries are Türkiye time.
export const PLAN_DAY=86400000,PLAN_HOUR=3600000,PLAN_TR=3*PLAN_HOUR;
export const planDay=at=>Math.floor((at+PLAN_TR)/PLAN_DAY)*PLAN_DAY-PLAN_TR;
export const planDeadline=p=>p.ends||planDay(p.starts)+PLAN_DAY;
export const PLAN_VISIBLE_SQL="CASE WHEN p.ends > 0 THEN p.ends + 3600000 ELSE ((p.starts + 10800000) / 86400000 + 1) * 86400000 - 10800000 + 3600000 END";
export const PLAN_COLUMNS="p.id, p.member_id AS memberId, p.starts, p.ends, p.note, p.rev, p.schedule, p.cancelled, p.updated";
export const PLAN_ANSWERS="a.plan_id AS planId, a.member_id AS memberId, a.answer, a.arrival, a.schedule, a.remind, a.response_note AS note";
export const PLAN_LEGACY_IMPORT="INSERT INTO attendees(plan_id,member_id,answer,arrival) SELECT s.plan_id,s.member_id,'no',p.starts FROM plan_skips s JOIN plans p ON p.id=s.plan_id WHERE 1 ON CONFLICT(plan_id,member_id) DO UPDATE SET answer='no'";
export function assemblePlans(plans,answers){
  const by=new Map();for(const a of answers){if(!by.has(a.planId))by.set(a.planId,[]);by.get(a.planId).push(a);}
  return plans.map(p=>{
    const responses=(by.get(p.id)||[]).map(a=>({...a,answer:a.schedule===p.schedule?a.answer:"pending",previousAnswer:a.answer,arrival:a.arrival??p.starts,remind:!!a.remind}));
    const ids=answer=>responses.filter(r=>r.answer===answer).map(r=>r.memberId);
    return {...p,responses,attendees:ids("yes"),skips:ids("no"),maybes:ids("maybe")};
  });
}
export function planStamp(date,time){
  const day=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date),clock=/^(\d{1,2}):(\d{2})(?::00(?:\.000)?)?$/.exec(time);
  if(!day||!clock||+clock[1]>23||+clock[2]>59)return NaN;
  const at=Date.UTC(+day[1],+day[2]-1,+day[3],+clock[1]-3,+clock[2]);
  return new Date(at+PLAN_TR).toISOString().slice(0,10)===date?at:NaN;
}
export const planDate=at=>new Date(at+PLAN_TR).toISOString().slice(0,10);
export const planClock=at=>new Date(at+PLAN_TR).toISOString().slice(11,16);
export const planWhen=at=>new Date(at).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul",weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
export const planAnswer=(p,id)=>p.responses?.find(r=>r.memberId===id);
export function planArrivalGroups(p){
  const groups=new Map();
  for(const r of p.responses||[])if(r.answer==="yes"){
    const at=Math.floor(r.arrival/60000)*60000;
    if(!groups.has(at))groups.set(at,[]);groups.get(at).push(r.memberId);
  }
  return [...groups].sort((a,b)=>a[0]-b[0]);
}
