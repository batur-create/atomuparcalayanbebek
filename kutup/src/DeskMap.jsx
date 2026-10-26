import { useScreenState } from "./Navigation.jsx";
// Masa haritası (n30): "Kim nerede?" at its most concrete. A bird's-eye sketch
// of each reading room with friends on their chairs; tap a free chair and
// "Geldim" is said with that desk. The plans live in shared/rooms.js.
import React, { useMemo, useState } from "react";
import { ArrowUpRight, Coffee } from "lucide-react";
import { ROOMS, elsewhere, headcount, roomOf, seating, tablesOf } from "../shared/rooms.js";
import { Avatar, Busy } from "./ui.jsx";
import { Modal } from "./Modal.jsx";
import "./deskmap.css";
import { SeatPlan } from "./SeatPlan.jsx";

const firstName = (member) => String(member.name || "").split(" ")[0];

function Seat({ n, people, me, picked, pick, openMember, ...props }) {
  const mine = people.some((x) => x.id === me?.id);
  if (!people.length)
    return (
      <button
        type="button"
        {...props}
        className={`dm-seat free ${picked ? "picked" : ""}`}
        aria-pressed={picked}
        aria-label={`Koltuk ${n}, ekibinden kimse işaretlememiş`}
        onClick={() => pick(picked ? null : n)}
      >
        <span>{n}</span>
      </button>
    );
  const [first, ...more] = people;
  const resting = people.every((x) => x.status === "break");
  const label = `Koltuk ${n}: ${people.map((x) => (x.id === me?.id ? "sen" : firstName(x)) + (x.status === "break" ? ", molada" : "")).join(", ")}`;
  return (
    <button
      type="button"
      {...props}
      className={`dm-seat taken ${mine ? "mine" : ""} ${resting ? "resting" : ""}`}
      aria-label={label}
      title={label}
      onClick={() => { if (!mine) openMember(first); }}
      aria-disabled={mine && !more.length ? true : undefined}
    >
      <Avatar member={first} size="tiny" />
      <span className="dm-name">{mine ? "Sen" : firstName(first)}</span>
      {more.length > 0 && <b className="dm-more">+{more.length}</b>}
      {resting && <Coffee className="dm-break" size={11} aria-hidden="true" />}
      <span className="dm-num">{n}</span>
    </button>
  );
}

function Chip({ member, me, line, openMember }) {
  return (
    <button type="button" className="dm-chip" onClick={() => (member.id === me?.id ? null : openMember(member))} disabled={member.id === me?.id}>
      <Avatar member={member} size="tiny" />
      <span>
        <b>{member.id === me?.id ? "Sen" : firstName(member)}</b>
        {line && <small>{line}</small>}
      </span>
    </button>
  );
}

export function DeskMap({ data, me, start, close, mutate, requireMember, openMember }) {
  const members = data.members;
  const [name, setName] = useScreenState("room", () => {
    if (roomOf(start)) return start;
    if (me && roomOf(me.location) && (me.status === "here" || me.status === "break")) return me.location;
    const busiest = [...ROOMS].sort((a, b) => headcount(members, b) - headcount(members, a))[0];
    return busiest.name;
  });
  const [picked, setPicked] = useState(null),
    [busy, setBusy] = useState(false);
  const room = roomOf(name) || ROOMS[0];
  const { desks, loose } = useMemo(() => seating(members, room), [members, room]);
  const away = useMemo(() => elsewhere(members), [members]);
  const inside = me && (me.status === "here" || me.status === "break");
  const choose = (room) => {
    setName(room.name);
    setPicked(null);
  };
  const sit = () =>
    requireMember(async () => {
      setBusy(true);
      const desk = String(picked);
      const moved = inside;
      const ok = await mutate(
        "/presence",
        { status: "here", location: room.name, desk },
        moved ? `Yerin değişti: masa ${desk}. 🪑` : `Ekibine haber verdik: ${room.short} · masa ${desk}. İyi çalışmalar!`,
      );
      setBusy(false);
      if (ok) setPicked(null);
    });
  return (
    <Modal title="Masa haritası" subtitle="Kim hangi koltukta? Yerini seç, ekibin seni bulsun." close={close} className={`desk-map ${room.plan ? "has-plan" : ""}`}>
      <div className="dm-rooms" role="group" aria-label="Salon">
        {ROOMS.map((x) => {
          const count = headcount(members, x);
          return (
            <button key={x.name} type="button" className={x.name === name ? "selected" : ""} aria-pressed={x.name === name} onClick={() => choose(x)}>
              <span aria-hidden="true">{x.emoji}</span> {x.short}
              {count > 0 && <i>{count}</i>}
            </button>
          );
        })}
      </div>
      {room.plan ? (
        <SeatPlan
          key={room.name}
          room={room}
          desks={desks}
          renderSeat={(seat, props) => (
            <Seat key={seat.number} n={seat.number} people={desks.get(seat.number) || []}
              me={me} picked={picked === seat.number} pick={setPicked} openMember={openMember} {...props} />
          )}
        />
      ) : <div className="dm-room" role="group" aria-label={`${room.name} krokisi`}>
        <span className="dm-shelves" aria-hidden="true">
          <small>raflar</small>
        </span>
        <span className="dm-windows" aria-hidden="true" />
        <div className="dm-floor">
          {tablesOf(room).map((row, i) => (
            <div className="dm-row" key={i}>
              {row.map((table) => (
                <div className="dm-table" key={table.number}>
                  <div className="dm-side">
                    {table.top.map((n) => (
                      <Seat key={n} n={n} people={desks.get(n) || []} me={me} picked={picked === n} pick={setPicked} openMember={openMember} />
                    ))}
                  </div>
                  <span className="dm-wood" aria-hidden="true">
                    <i />
                  </span>
                  <div className="dm-side bottom">
                    {table.bottom.map((n) => (
                      <Seat key={n} n={n} people={desks.get(n) || []} me={me} picked={picked === n} pick={setPicked} openMember={openMember} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <span className="dm-door" aria-hidden="true">
          <small>giriş</small>
        </span>
      </div>
      }
      {picked && (
        <div className="dm-pick" role="status">
          <span>
            <b>Koltuk {picked}</b>
            <small>{room.short} salonu</small>
          </span>
          <button type="button" className="btn ghost" onClick={() => setPicked(null)}>
            Vazgeç
          </button>
          <Busy loading={busy} type="button" className="btn primary" onClick={sit}>
            {inside ? "Buraya geçtim" : "Buraya oturdum"} <ArrowUpRight size={16} />
          </Busy>
        </div>
      )}
      {loose.length > 0 && (
        <div className="dm-list">
          <h3>Salonda, masası haritada yok</h3>
          <div>
            {loose.map((x) => (
              <Chip key={x.id} member={x} me={me} line={x.desk || "masa söylemedi"} openMember={openMember} />
            ))}
          </div>
        </div>
      )}
      {away.length > 0 && (
        <div className="dm-list">
          <h3>Başka yerde</h3>
          <div>
            {away.map((x) => (
              <Chip key={x.id} member={x} me={me} line={`${x.status === "break" ? "☕ " : ""}${x.location || "Milli Kütüphane"}`} openMember={openMember} />
            ))}
          </div>
        </div>
      )}
      <p className="form-footnote dm-note">{room.plan ? "Adnan yerleşimi, paylaşılan salon planına göre hazırlanmıştır; ölçekli mimari çizim değildir." : "Müjgan krokisi temsilî; numaralar salondakiyle birebir olmayabilir."} İşaretlenmemiş koltuklar gerçekte boş demek değildir; burada yalnız ekibinin bildirdiği yerler görünür.</p>
    </Modal>
  );
}
