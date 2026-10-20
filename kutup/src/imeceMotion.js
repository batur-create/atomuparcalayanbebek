// Presentation only. Server-credited minutes remain the sole construction clock.
import { IMECE_TASKS, IMECE_TOTAL } from "../shared/imece.js";

const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const minute = n => clamp(Number.isFinite(n) ? n : 0, 0, IMECE_TOTAL);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
// Positions use the monument's uniform 30 m units. Work faces are on the
// visible +x/+y edges; no workers or cables are painted through the hall.
const sites = {
  survey:     { kind: "survey", site: [-.2,.82,0], cue: "Akslar ölçülüyor, kotlar kontrol ediliyor." },
  excavate:   { kind: "dig", site: [-.15,.62,0], cue: "Kazıdan çıkan zemin yükleniyor; taban tesviye ediliyor." },
  blinding:   { kind: "concrete", site: [-.4,.56,.005], cue: "Temiz altlık seriliyor; yüzey mastarlanıyor." },
  reinforce:  { kind: "rebar", site: [-.45,.56,.025], cue: "Donatı çubukları taşınıyor, birleşimler bağlanıyor." },
  raft:       { kind: "concrete", site: [-.4,.56,.05], cue: "Beton hortumu ilerliyor; ekip yüzeyi düzeltiyor." },
  podium:     { kind: "lift", site: [.07,.55,.21], cue: "Platform kalıpları ve taşıyıcı parçalar yerleştiriliyor." },
  frame:      { kind: "lift", site: [-.55,.09,.52], scaffold: true, cue: "Taşıyıcı eleman kaldırılıyor; bağlantı ekibi yerinde bekliyor." },
  hall:       { kind: "masonry", site: [-.6,.09,.45], scaffold: true, cue: "Şeref Holü duvarı örülüyor; derzler kontrol ediliyor." },
  columns:    { kind: "lift", site: [-.17,-.12,.64], scaffold: true, cue: "Sütun parçası askıda; ekip hizasını ve bağlantısını ayarlıyor." },
  roof:       { kind: "lift", site: [-.52,.09,.77], scaffold: true, cue: "Üst örtü elemanı yükseliyor; montaj sırası izleniyor." },
  stairs:     { kind: "stone", site: [.42,.04,.08], cue: "Basamak taşı taşınıyor, kotu ve derzi düzeltiliyor." },
  towers:     { kind: "masonry", site: [.38,.98,.12], scaffold: true, cue: "Kule cephesinde taş sıraları ve açıklıklar işleniyor." },
  galleries:  { kind: "masonry", site: [1.1,.67,.13], scaffold: true, cue: "Revak bağlantıları örülüyor; açık geçitler korunuyor." },
  square:     { kind: "stone", site: [1.8,-.8,.015], cue: "Meydanın altlığı sıkıştırılıyor; taş sıraları döşeniyor." },
  "lion-road":{ kind: "stone", site: [2.76,4.3,.015], cue: "Aslanlı Yol’da taş sıraları ve yan bantlar tamamlanıyor." },
  lions:      { kind: "sculpt", site: [3.08,4.71,.02], cue: "Aslanın kaidesi ve taş ayrıntıları elde işleniyor." },
  travertine: { kind: "masonry", site: [-.58,.09,.48], scaffold: true, cue: "Traverten taşları yerleştiriliyor; derzler tek tek düzeltiliyor." },
  mosaics:    { kind: "mosaic", site: [2.4,-.65,.01], cue: "Renkli taşlar seçiliyor; kilim desenine tek tek oturtuluyor." },
  reliefs:    { kind: "sculpt", site: [.42,.25,.025], cue: "Kabartmanın taş yüzeyi küçük el aletleriyle işleniyor." },
  landscape: { kind: "garden", site: [1.2,1.64,0], cue: "Fidan yerleştiriliyor; çevresindeki toprak kapatılıyor." },
  flag:       { kind: "flag", site: [2.79,-2.65,.036], cue: "Direk ve halat kontrol ediliyor; bayrak göndere hazırlanıyor." },
  handover:   { kind: "inspect", site: [1.2,-.7,.01], cue: "Dört ustanın son kontrolü: taşlar, akslar, bayrak ve ortak imzalar." },
};

let start = 0;
const jobs = IMECE_TASKS.map((task, index) => {
  const job = { ...task, ...sites[task.id], index, start, end: start + task.minutes };
  start = job.end;
  return job;
});

export function imeceJobAt(minutes) {
  const at = minute(minutes);
  const job = jobs.find(j => at < j.end) || jobs.at(-1);
  return { ...job, progress: clamp((at - job.start) / job.minutes) };
}

// Each crossed job gets screen time; a 25 min visit takes 6 s, a long absence
// is capped at 22 s. Interpolation never invents work outside the delivery.
export function imeceReplay(from, to) {
  from = minute(from); to = Math.max(from, minute(to));
  const parts = jobs.filter(j => from < j.end && to > j.start).map(j => ({
    from: Math.max(from, j.start), to: Math.min(to, j.end), job: j,
  }));
  const duration = parts.length ? clamp(parts.length * 1800, 6000, 22000) : 0;
  const weights = parts.map(p => .5 + Math.sqrt(p.to - p.from));
  const total = weights.reduce((a, b) => a + b, 0);
  let elapsed = 0;
  const segments = parts.map((p, i) => {
    const ms = duration * weights[i] / total;
    const segment = { ...p, start: elapsed, end: elapsed + ms };
    elapsed += ms;
    return segment;
  });
  return { from, to, duration, segments };
}

export function imeceReplayAt(plan, elapsed) {
  if (!plan.duration || elapsed >= plan.duration) return { minutes: plan.to, done: true, job: imeceJobAt(Math.max(plan.from, plan.to - .001)) };
  const part = plan.segments.find(p => elapsed < p.end) || plan.segments.at(-1);
  return { minutes: lerp(part.from, part.to, clamp((elapsed - part.start) / (part.end - part.start))), done: false, job: part.job };
}

// A closed lift cycle: approach stock → rig → hoist → slew/trolley → lower
// → release → hoist clear → return. Load always hangs below the hook.
export function imeceLiftAt(seconds, target) {
  const base = [.64,.53], source = [.55,-.07,.20], high = 1.08;
  const turns = seconds / 10, cycle = turns - Math.floor(turns);
  const destination = [target[0], target[1], target[2] + .18];
  const keys = [
    [0, [source[0], source[1], high]], [.12, source], [.22, source],
    [.38, [source[0], source[1], high]],
    [.60, [destination[0], destination[1], high]],
    [.76, destination], [.84, destination],
    [.95, [destination[0], destination[1], high]], [1, [source[0], source[1], high]],
  ];
  const i = Math.max(1, keys.findIndex(k => cycle <= k[0]));
  const [ta, a] = keys[i - 1], [tb, b] = keys[i];
  const t = smooth(clamp((cycle - ta) / (tb - ta)));
  const hook = a.map((v, j) => lerp(v, b[j], t));
  const angle = Math.atan2(hook[1] - base[1], hook[0] - base[0]);
  return { base, hook, angle, reach: Math.hypot(hook[0] - base[0], hook[1] - base[1]), loaded: cycle >= .22 && cycle < .84, cycle };
}

export const IMECE_TOUR = [
  { zone: "road", title: "Birlikte yürüdüğümüz yol", line: "262 metrelik aks, karşılıklı 24 aslan. Her taşında ortak emek." },
  { zone: "court", title: "Aynı meydanda buluştuk", line: "Kuleler, revaklar ve kilim desenleri: ayrı işler, tek bütün." },
  { zone: "hall", title: "Emek yükseldi, sözümüz kaldı", line: "42 basamaktan Şeref Holü’ne. Dördümüzün imzasıyla." },
  { zone: "flag", title: "Gönderde hepimizin gururu", line: "Son kontrolden sonra Türk bayrağı. Ata’mıza saygıyla." },
  { zone: "all", title: "Son taşında hepimiz varız", line: "2.000 dakika. Dört usta. Birlikte başardığımız bir eser." },
];
export const IMECE_TOUR_MS = IMECE_TOUR.length * 3000;
export const imeceTourAt = elapsed => IMECE_TOUR[Math.min(IMECE_TOUR.length - 1, Math.floor(Math.max(0, elapsed) / 3000))];
