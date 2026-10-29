// The land around the construction site on the focus screen: the site sits on
// a patch of countryside you can zoom out over and drag across. One static SVG
// drawn once (seeded, so it never changes), three site-widths wide, in the same
// flat isometric look as the site. Nothing here moves, so it costs no frames.
const W = 2040,
  H = 1200,
  X0 = -680,
  Y0 = -400;
// The site and its fence stay clear in the middle of the viewBox.
const clear = (x, y) => Math.abs(x - 340) / 235 + Math.abs(y - 268) / 155 < 1;
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const f = (n) => n.toFixed(1);

function build() {
  seed = 7;
  const out = [];
  // Soft patches of lighter and darker grass, fields in iso diamonds.
  for (let i = 0; i < 26; i++) {
    const x = X0 + rnd() * W, y = Y0 + rnd() * H, r = 60 + rnd() * 140;
    out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r / 2)}" fill="${rnd() < 0.5 ? "#9bbd78" : "#adcd8c"}"/>`);
  }
  const diamond = (cx, cy, w, fill) =>
    `<polygon points="${f(cx)},${f(cy - w / 2)} ${f(cx + w)},${f(cy)} ${f(cx)},${f(cy + w / 2)} ${f(cx - w)},${f(cy)}" fill="${fill}"/>`;
  for (let i = 0; i < 9; i++) {
    const x = X0 + 80 + rnd() * (W - 160), y = Y0 + 60 + rnd() * (H - 120), w = 70 + rnd() * 70;
    if (clear(x, y) || clear(x + w, y) || clear(x - w, y)) continue;
    out.push(diamond(x, y, w, ["#d9c97a", "#c7b46a", "#b3c96f"][i % 3]));
    for (let k = -2; k <= 2; k++) out.push(`<line x1="${f(x + k * w * 0.3)}" y1="${f(y - (w / 2) * (1 - Math.abs(k) * 0.3))}" x2="${f(x + k * w * 0.3)}" y2="${f(y + (w / 2) * (1 - Math.abs(k) * 0.3))}" stroke="#0000001a" stroke-width="1.5"/>`);
  }
  // A dirt road running along the iso axis past the site.
  out.push(`<polygon points="${X0},${Y0 + 1000} ${X0 + 60},${Y0 + 1000 - 30} ${X0 + W},${Y0 + 130} ${X0 + W - 60},${Y0 + 160}" fill="#cdb98d"/>`);
  out.push(`<line x1="${X0 + 30}" y1="${Y0 + 985}" x2="${X0 + W - 30}" y2="${Y0 + 145}" stroke="#e8dcb8" stroke-width="2" stroke-dasharray="14 12"/>`);
  // Trees, bushes and rocks, back to front so nearer ones overlap.
  const items = [];
  for (let i = 0; i < 90; i++) {
    const x = X0 + 20 + rnd() * (W - 40), y = Y0 + 30 + rnd() * (H - 60), t = rnd();
    if (clear(x, y) || clear(x, y - 60)) continue;
    items.push([x, y, t]);
  }
  items.sort((a, b) => a[1] - b[1]);
  for (const [x, y, t] of items) {
    const s = 0.8 + rnd() * 0.6;
    if (t < 0.55) {
      const pine = t < 0.2;
      out.push(`<ellipse cx="${f(x)}" cy="${f(y + 3)}" rx="${f(16 * s)}" ry="${f(6 * s)}" fill="#00000022"/><rect x="${f(x - 2.5 * s)}" y="${f(y - 14 * s)}" width="${f(5 * s)}" height="${f(16 * s)}" fill="#7a5a3a"/>`);
      out.push(pine
        ? `<polygon points="${f(x)},${f(y - 58 * s)} ${f(x + 15 * s)},${f(y - 12 * s)} ${f(x - 15 * s)},${f(y - 12 * s)}" fill="#4f8a55"/><polygon points="${f(x)},${f(y - 44 * s)} ${f(x + 18 * s)},${f(y - 6 * s)} ${f(x - 18 * s)},${f(y - 6 * s)}" fill="#5a9a5f"/>`
        : `<circle cx="${f(x)}" cy="${f(y - 30 * s)}" r="${f(19 * s)}" fill="#5f9d57"/><circle cx="${f(x - 6 * s)}" cy="${f(y - 35 * s)}" r="${f(11 * s)}" fill="#74b165"/>`);
    } else if (t < 0.85) {
      out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(14 * s)}" ry="${f(8 * s)}" fill="#5f9d57"/><ellipse cx="${f(x - 4 * s)}" cy="${f(y - 3 * s)}" rx="${f(8 * s)}" ry="${f(5 * s)}" fill="#7bb56b"/>`);
    } else {
      out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(11 * s)}" ry="${f(6 * s)}" fill="#9a9a94"/><ellipse cx="${f(x - 2 * s)}" cy="${f(y - 2 * s)}" rx="${f(7 * s)}" ry="${f(3.5 * s)}" fill="#b4b4ad"/>`);
    }
  }
  return out.join("");
}
const ART = build();

export function SiteSurround() {
  return (
    <svg
      className="fs-surround"
      viewBox={`${X0} ${Y0} ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" fill="#a4c481"/>${ART}` }}
    />
  );
}
