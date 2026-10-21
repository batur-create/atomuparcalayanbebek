// One account, many devices (n47). Each browser keeps a random id of its own,
// so the server knows which device started (and watches) a session: the
// others only show it and can never end it by themselves.
import { storage } from "./ui.jsx";

const KEY = "kutup-device";
let spare = "";
const fresh = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
export function deviceId() {
  const saved = storage.get(KEY);
  if (/^[a-z0-9]{12,40}$/.test(saved || "")) return saved;
  // Without storage (private window) the id lasts as long as this page.
  spare ||= fresh();
  storage.set(KEY, spare);
  return spare;
}
// The screen-off switch for the next build follows the account; this device's
// own last choice is only the fallback until the server has one.
export const relaxedChoice = (me) =>
  me?.buildMode === "relaxed" || me?.buildMode === "strict" ? me.buildMode === "relaxed" : storage.get("kutup-build-mode") === "relaxed";
