// Instant opening (n29): the last team state seen on this device is kept and
// shown at once on the next visit, while the fresh one is fetched. On a weak
// signal the app opens with the last known picture instead of a spinner.
// Only the open account's state is kept; signing out or leaving clears it.
import { storage } from "./ui.jsx";

const KEY = "kutup-last";
const DAY = 24 * 3600 * 1000;

export function readLast() {
  try {
    const last = JSON.parse(storage.get(KEY) || "null");
    // A picture older than a day says more about yesterday than about now.
    if (!last?.session?.memberId || !last.data?.group?.id || Date.now() - last.at > DAY) return null;
    return last;
  } catch {
    return null;
  }
}
let timer;
export function saveLast(session, data) {
  clearTimeout(timer);
  timer = setTimeout(() => storage.set(KEY, JSON.stringify({ at: Date.now(), session, data })), 800);
}
export function clearLast() {
  clearTimeout(timer);
  storage.set(KEY, "null");
}
