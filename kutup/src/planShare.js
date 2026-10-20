// n34: a plan goes out as a link (a WhatsApp group, say) for whoever missed the
// notification. The link opens the plan's card inside Kütüp, where a member says
// "Varım" or "Gelemem"; the message carries the day and time so the group can
// read it without opening anything.
import { planWhen } from "../shared/plans.js";

export const planLink = (plan) => `${location.origin}/?plan=${encodeURIComponent(plan.id)}`;

export function planText(plan, owner) {
  const when = planWhen(plan.starts);
  return `🗓️ ${owner?.name || "Biri"} kütüp buluşması planladı: ${when} · ${plan.note || "Kütüpte buluşalım"}. Kendi geliş saatini seçip katıl:`;
}

const icsText=s=>String(s).replace(/\\/g,"\\\\").replace(/[\r\n]+/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
const icsDate=n=>new Date(n).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
export function planCalendar(plan,owner,arrival=plan.starts){
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Kutup//Bulusma//TR","BEGIN:VEVENT",`UID:${encodeURIComponent(plan.id)}@kutup`,`DTSTAMP:${icsDate(Date.now())}`,`DTSTART:${icsDate(arrival)}`,
    ...(plan.ends>arrival?[`DTEND:${icsDate(plan.ends)}`]:[]),`SUMMARY:${icsText(plan.note||"Kütüp buluşması")}`,"LOCATION:Milli Kütüphane Ankara",`DESCRIPTION:${icsText(`${owner?.name||"Arkadaşın"} planladı. Senin gelişin: ${planWhen(arrival)}. ${planLink(plan)}`)}`,`URL:${planLink(plan)}`,"END:VEVENT","END:VCALENDAR"];
  const encoder=new TextEncoder();
  return lines.map(line=>{let out="",bytes=0;for(const ch of line){const n=encoder.encode(ch).length;if(bytes+n>73){out+="\r\n ";bytes=1;}out+=ch;bytes+=n;}return out;}).join("\r\n")+"\r\n";
}
export function savePlanCalendar(plan,owner,arrival){
  const url=URL.createObjectURL(new Blob([planCalendar(plan,owner,arrival)],{type:"text/calendar;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="kutup-bulusma.ics";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}

// The phone's own share sheet (WhatsApp, Telegram, …) when there is one,
// otherwise the link (with its text) is copied. Returns what happened.
export async function sharePlan(plan, owner) {
  const url = planLink(plan),
    text = planText(plan, owner);
  if (navigator.share) {
    try {
      await navigator.share({ title: "Kütüp planı", text, url });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
