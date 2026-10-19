// Room names remain the existing presence keys; no saved records are migrated.
import { ADNAN_PLAN } from "./adnanPlan.js";

export const ROOMS = [
  { name: "Adnan Ötüken Okuma Salonu", short: "Adnan", emoji: "📚", plan: ADNAN_PLAN },
  { name: "Dr. Müjgan Cunbur Okuma Salonu", short: "Müjgan", emoji: "📖", rows: 3, perSide: 3 },
];
const COLUMNS = 2;

export const roomOf = (location) => ROOMS.find((room) => room.name === location) || null;
export const seatsOf = (room) => room.plan ? room.plan.seats.length : room.rows * COLUMNS * room.perSide * 2;

/** The tables of a room, row by row: [[{top: [1, 2, 3], bottom: [4, 5, 6]}, …], …]. */
export function tablesOf(room) {
  if (room.plan) return []; // surveyed seats are individual, not synthetic shared tables
  const perTable = room.perSide * 2;
  return Array.from({ length: room.rows }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) => {
      const first = (row * COLUMNS + column) * perTable + 1;
      const seats = Array.from({ length: perTable }, (_, i) => first + i);
      return { number: row * COLUMNS + column + 1, top: seats.slice(0, room.perSide), bottom: seats.slice(room.perSide) };
    }),
  );
}

/** The desk number in what someone typed ("24", "masa 24", "24 pencere yanı"), if the room has it. */
export function deskNumber(desk, room) {
  const match = /^\s*(?:masa\s*|no\.?\s*|#\s*)?(\d{1,3})(?!\d|\s*\.\s*kat)/i.exec(String(desk || ""));
  const n = match ? Number(match[1]) : 0;
  return room.plan
    ? (room.plan.seats.some((seat) => seat.number === n) ? n : null)
    : (n >= 1 && n <= seatsOf(room) ? n : null);
}

const inside = (member) => member.status === "here" || member.status === "break";

/** Who sits where in a room: desk number -> members, and those in the room the map can't place. */
export function seating(members, room) {
  const desks = new Map(),
    loose = [];
  for (const member of members) {
    if (!inside(member) || member.location !== room.name) continue;
    const n = deskNumber(member.desk, room);
    if (n) desks.set(n, [...(desks.get(n) || []), member]);
    else loose.push(member);
  }
  return { desks, loose };
}

/** People at the library but not in a mapped room (the cafeteria, the garden, elsewhere). */
export const elsewhere = (members) => members.filter((member) => inside(member) && !roomOf(member.location));

/** How many people are in each room right now. */
export const headcount = (members, room) => members.filter((member) => inside(member) && member.location === room.name).length;
