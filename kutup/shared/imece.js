// One project per team. These are game-work budgets, not a claim
// about the real monument's construction hours. All budgets are in 25 min units.
export const IMECE_ID = "bir-tas-da-senden";
export const IMECE_TOTAL = 2000;
export const IMECE_PEOPLE = 4;
export const IMECE_PERSONAL = 250;
export const IMECE_PHASES = [
  { id: "ilk-tas", name: "İlk Taş", goal: 400, personal: 50, title: "Sağlam bir başlangıç", story: "Önce zemini tanıyor, temeli ve taşıyıcı platformu hazırlıyoruz. Görünmeyen emek, bütün yapıyı taşıyacak." },
  { id: "birlikte", name: "Birlikte Yükselir", goal: 1200, personal: 150, title: "Aynı yapının dört ustası", story: "Şeref Holü, revaklar, kuleler ve Aslanlı Yol yükseliyor. Birinin çok çalışması, diğerinin kişisel görevinin yerine geçmiyor." },
  { id: "son-tas", name: "Son Taş Hepimizden", goal: 400, personal: 50, title: "Son imza hepimizden", story: "Taşların, desenlerin ve bayrağın son kontrolleri. Dördümüz de kendi son görevimizi bitirmeden açılış yapılmayacak." },
];
// The same ordered work plan feeds the task explanations, ledger and renderer.
// It preserves real dependencies: foundation → podium → frame → envelope → finish.
const rows = [
  [0, "survey", "Aplikasyon ve zemin incelemesi", 50, "Yapı akslarını işaretle; arazi kotlarını ve temel sınırını belirle.", "Ölçmeden kazıya başlamıyoruz. Şeref Holü ve tören meydanının yerleri önce arazide okunur."],
  [0, "excavate", "Kontrollü kazı ve tesviye", 75, "Temel çukurunu katman katman aç, tabanı aynı kota getir.", "Kazı, zemine oturan geniş bir taşıyıcı taban için hazırlanır."],
  [0, "blinding", "Grobeton ve temel altı hazırlığı", 50, "Düz çalışma yüzeyi, drenaj ve yalıtım hazırlığını tamamla.", "Donatı toprağın üstüne serilmez; temiz ve düzgün bir altlık gerekir."],
  [0, "reinforce", "Radye donatısı ve kalıp", 100, "Alt ve üst donatı ağlarını, pas payını ve kenar kalıplarını yerleştir.", "Betonla birlikte çalışacak donatı, platformun yükünü zemine yayar."],
  [0, "raft", "Temel betonu ve kür", 75, "Betonu bölümler halinde yerleştir; sıkıştırma ve kür sırasını takip et.", "Betonu dökmek son adım değil; dayanım kazanması da işin parçası."],
  [0, "podium", "Taşıyıcı platform", 50, "Şeref Holü'nün oturacağı terası ve merdiven bağlantılarını kur.", "Bu platform, anıta yaklaşırken gördüğümüz yükseltilmiş tabanı oluşturur."],
  [1, "frame", "Şeref Holü taşıyıcıları", 150, "Taşıyıcı duvarları, düşey elemanları ve üst bağlantıları sırayla yükselt.", "Traverten kaplamanın arkasında yük taşıyan sistem vardır; önce o tamamlanır."],
  [1, "hall", "Şeref Holü duvarları", 100, "İç mekânı, giriş açıklığını ve taş kaplamaya hazırlanan yüzeyleri tamamla.", "İç duvarlar dış sütunların gerisinde kalır; sütunlu cephe kapanmaz."],
  [1, "columns", "Sütun sıraları", 150, "Ön ve arka cephedeki sekizer, yanlardaki on dörder sütunun sıralarını tamamla.", "Kare kesit, aralıklar ve yatay saçak anıtın en belirgin siluetidir."],
  [1, "roof", "Üst örtü ve saçak", 100, "Üst örtüyü, saçak katmanlarını ve dişli taş bezemelerini yerleştir.", "Ana kütleyi yüksek bir kuleye çevirmeden geniş ve yatay oranını koruyoruz."],
  [1, "stairs", "42 basamak ve kürsü", 100, "Geniş merdiveni basamak basamak kur; ortadaki hitabet kürsüsünü yerleştir.", "Meydandan Şeref Holü'ne çıkış, tek bir eğimli yüzey değil gerçek basamaklarla çizilir."],
  [1, "towers", "On kule", 150, "Meydan çevresindeki sekiz ve Aslanlı Yol girişindeki iki kuleyi tamamla.", "Kuleler rastgele dizilmez; gerçek plandaki köşe ve geçit ilişkilerini izler."],
  [1, "galleries", "Revaklar ve yan kanatlar", 150, "Meydanı çevreleyen galerileri, sütunları ve karşılıklı geçitleri birleştir.", "Binalar ayrı kutular halinde kalmaz; tören meydanını tanımlayan bir bütün kurar."],
  [1, "square", "Tören meydanı altyapısı", 100, "129 × 84 metrelik meydanın yönünü ve taş döşeme altlığını hazırla.", "Meydanın uzun ekseni mozoleye yönelir; Aslanlı Yol yandan bağlanır."],
  [1, "lion-road", "Aslanlı Yol taş döşemesi", 100, "262 metrelik aksı, yan bantları ve taş sıralarını oluştur.", "Yolu köye sığdırmak için kısaltmıyoruz; ortak anıt alanında gerçek uzunluk ilişkisini koruyoruz."],
  [1, "lions", "Yirmi dört aslan", 100, "Yolun iki yanına karşılıklı on iki çift oturan aslan yerleştir.", "Aslanların kaideleri, gövdeleri ve yönleri yolun iki yanında eşleşir."],
  [2, "travertine", "Traverten kaplama ve derzler", 75, "Cephe taşlarını, derz ritmini ve ton farklarını tamamla.", "Kaplama, taşıyıcı sistemin üstüne gelir; taşlar düz bir boya yüzeyi değildir."],
  [2, "mosaics", "Meydanın kilim desenleri", 100, "Renkli taş desenlerini ve meydanın bordürlerini tek tek işle.", "Motifler büyük göz simgeleri yerine ince taş parçaları ve kırık çizgilerle okunur."],
  [2, "reliefs", "Kabartmalar ve iç ayrıntılar", 75, "Merdiven yanlarındaki kabartmaları, Şeref Holü ve lahit ayrıntılarını tamamla.", "Ayrıntı, yapıya isim tabelası eklemekten değil mimarinin kendisinden gelir."],
  [2, "landscape", "Barış Parkı ve çevre", 50, "Yürüyüş bağlantılarını, yeşil alanları ve çevre düzenini tamamla.", "Anıt kendi çevresiyle birlikte okunur; ağaçlar ana aksı ve yapıyı kapatmaz."],
  [2, "flag", "Bayrak direği ve Türk bayrağı", 50, "Direği, kaideyi ve oranları doğru hilal-yıldızlı bayrağı hazırla.", "Bayrak, Aslanlı Yol'un karşısındaki çıkış ekseninde; kumaş oranı 3:2."],
  [2, "handover", "Dört ustanın son kontrolü", 50, "Bölümleri birlikte kontrol et; herkesin emeği tamamlanınca açılışa hazırlan.", "Ortak hedef dolsa bile dört kişinin kişisel görevleri bitmeden proje tamamlanmaz."],
];
export const IMECE_TASKS = rows.map(([phase, id, name, minutes, action, why]) => ({ phase, id, name, minutes, action, why }));
export const IMECE_ROLES = [
  { name: "Temelin izinde", line: "Görünmeyen emeğin bütün yapıyı taşıyacak. İlk taşın sağlamlığını sana emanet ediyorum." },
  { name: "Şeref Holü ekibi", line: "Bu siluetin yükselmesinde senin de izin olacak. Her seans, ortak yapıya yeni bir parça." },
  { name: "Aslanlı Yol ekibi", line: "Birlikte yürüyeceğimiz yolun emeğinde sen varsın. Yolun ucunda hepimizin eseri duracak." },
  { name: "Meydanın ustası", line: "Hepimizi buluşturacak meydanda senin de emeğin olacak. Son imzayı birlikte atacağız." },
];

export function imeceProgress(contributions = []) {
  const phases = IMECE_PHASES.map((phase, i) => {
    const rows = contributions.filter((c) => c.phase === i);
    const personal = Array.from({ length: IMECE_PEOPLE }, (_, slot) => rows.filter((c) => c.slot === slot).reduce((n, c) => n + c.personal, 0));
    const minutes = rows.reduce((n, c) => n + c.minutes, 0);
    return { ...phase, minutes, personal, complete: minutes >= phase.goal && personal.every((n) => n >= phase.personal) };
  });
  const phase = phases.findIndex((p) => !p.complete);
  return { phases, phase, complete: phase === -1, minutes: phases.reduce((n, p) => n + p.minutes, 0) };
}

export function imeceTaskProgress(progress) {
  const used = [0, 0, 0];
  return IMECE_TASKS.map((task) => {
    const minutes = Math.max(0, Math.min(task.minutes, progress.phases[task.phase].minutes - used[task.phase]));
    used[task.phase] += task.minutes;
    return { ...task, credited: minutes, complete: minutes >= task.minutes };
  });
}

export function imeceCapacity(progress, reservations, slot) {
  const phase = progress.phase;
  if (phase < 0 || slot < 0) return { available: 0, personal: 0, shared: 0 };
  const p = progress.phases[phase];
  const reserved = reservations.filter((r) => r.phase === phase);
  const personal = Math.max(0, IMECE_PHASES[phase].personal - p.personal[slot]);
  const missing = p.personal.reduce((n, value) => n + Math.max(0, IMECE_PHASES[phase].personal - value), 0);
  const shared = Math.max(0, p.goal - p.minutes - missing - reserved.reduce((n, r) => n + r.minutes - r.personal, 0));
  return { available: personal + shared, personal, shared };
}
