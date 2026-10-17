// n34: a plan goes out as a link (a WhatsApp group, say) for whoever missed the
// notification. The link opens the plan's card inside Kütüp, where a member says
// "Varım" or "Gelemem"; the message carries the day and time so the group can
// read it without opening anything.
import { dayWord, shortTime } from "./api.js";

export const planLink = (plan) => `${location.origin}/?plan=${encodeURIComponent(plan.id)}`;

export function planText(plan, owner) {
  const when = `${dayWord(plan.starts)} ${shortTime(plan.starts)}`;
  return `🗓️ ${owner?.name || "Biri"} kütüp planı yaptı: ${when} · ${plan.note || "Kütüpte buluşalım"}. Geliyor musun? Buradan söyle:`;
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
