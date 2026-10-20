

## 0. Çalışma sistemi (16 Ekim 2026)

> **20 Ekim, sonraki paketler onaylı:** Batur “SONRAKİ PAKETLERİ PLANLA VE YAP” dedi; ardından ekip kontrolünü kendisinin yapacağını, hata düzeltilirken emeğin korunmasını istedi. Paket planı ve ekip projesi geçişi: [PAKETLER_2026-10-20.md](PAKETLER_2026-10-20.md). Göç 32 sonrası eski proje silinmez/dağıtılmaz; Batur komuta merkezinden doğru ekibe bağlar. Yeni katılım ekip içinde kalır. Hesaplar otomatik taşınmaz. Yayın Batur’da. Diğer paketlerin teslim notları: `RAPOR_ODAK_KOY.md`, `RAPOR_DOGAL_KOY.md`, `RAPOR_YENI_PLANLAR.md`.

> **20 Ekim, acil katılımcı hesabı düzeltmesi:** Batur yanlış profili seçtiği için yalnız komuta merkezinden hesap değiştirme yetkisi istedi. Dal `codex/imece-owner-crew-fix`, taban `89664fad`, hedef `kutup-platform`; birleştirme/yayın Batur’da. `/batur` → Ortak Anıtkabir → kişinin **Hesabı değiştir** düğmesi; yeni hesap kullanıcı adı ve ekibiyle seçilir, onaydan sonra görev yeri ona bağlanır. Katkılar, üç bölümdeki kişisel paylar ve teslim kaydı görev yerinde korunur; kişisel tuğla/bina/odak geçmişi taşınmaz. Aktif veya henüz sonuçlandırılmamış şantiye seansında, tamamlanan projede, zaten kadrodaki hesapla ya da eski revizyonla değişiklik reddedilir. Şema/göç ve gerçek veri değişikliği yok. Doğrulama: `npm run test:all` **192/192**, İmece tarayıcı **46/46** (hesap değişimi/görev erişimi/390 px dahil); yalnız geçici yerel veritabanı.

> **Sonraki paket için yeni talepler (henüz uygulanmadı):** Batur her ekibe ayrı Anıtkabir projesi ve yalnız kendi ekibinden katılım istedi; bu mevcut bütün köyler için tek proje kararının gelecekte revizyonudur. Mevcut katkıları kaybetmeden geçiş ayrıca planlanmalı. Köyün yapay bölgelere ayrılması/yayılması için daha doğal yollar, ev kümeleri ve yumuşak bölge geçişleri tasarlanacak. Önceden konuşulan odakta köy/arkadaş inşaatları, katılım akışı, çalışma kısayolu, altı ek nadir yapı (Mardin Evi/Atakule dahil) ve plan keşfi kutlaması da bu acil PR’da uygulanmadı.

> **20 Ekim, Anıtkabir katkı açıklığı:** Batur, Bensu’nun 150 dk toplam emeğine karşı 50/250 çubuğunu görünce anlaşılır sunum ve ayrı PR istedi. Dal `codex/imece-contribution-clarity`, taban `c7069501` (Batur yayını Worker `1feedd91`), hedef `kutup-platform`; **yayın Batur’da**. Toplam katkı büyük dakika sayısı olarak; üç bölüm payı 50/50 tamamlandı, 0/150 bölüm açılınca, 0/50 bölüm açılınca şeklinde ayrı gösterilir. Fazladan ortak emek de yazılır. Kara, seans öncesi açıklama, katkı geçmişi, yardım ve Yenilikler aynı ayrımı anlatır. Sunucu, şema, çalışma/ödül/katkı hesapları ve model değişmedi; göç yok.

> **20 Ekim, plan keşfi ve altı nadir yapı:** Batur 25 dk başına %5 şans / 500 dk garanti / haftalık yapıyı açık dönemde bitirince kalıcı plan önerisini onayladı; ayrıca yeni plan ve nadir yapılar istedi. Dal `codex/blueprint-discovery`, başlangıç `1729a94e`, hedef `kutup-platform`, ayrı PR; **yayın Batur'da**. Batur bu tabanın yayınını Worker `e2b7b449` ile doğruladı. Anıtkabir modeline/görevlerine dokunulmadı. Rapor `ASTRA_RAPOR_PLAN_KESFI.md`; yeni göç 31 için yayın öncesi yedek.

> **20 Ekim, odak yüzdesi etiketi:** Batur'un ekran görüntüsündeki iki “hakediş” farklı ölçülerdi: şantiye başlığı maliyet ağırlıklı hakedişi, sayaç ise geçen süreyi gösteriyordu. Onaylı dar düzeltme `codex/focus-progress-label` dalında: sayaç altı “Seans %… tamamlandı” oldu. Hakediş hesabı, süre ve çizim değişmedi. Ayrı PR; yayın Batur'da.

> **20 Ekim, bütünsel buluşma sistemi:** Batur, 14.00 buluşmasına 16.00 geliş örneğinden sonra “duplicate olmayan bütünsel bir sistem kur” diyerek uygulamayı onayladı. Dal `codex/holistic-meetups`, hedef `kutup-platform`, teslim ayrı PR; **yayın Batur'da**. Bu adım yalnız kütüphaneye gelme planlarıdır. Yapı planlarının ödül dengesi ayrı sonraki adım; bu PR'da değiştirilmedi. Yeni göç 30 öncesi mevcut yedek akışı kullanılmalı. Teknik rapor `ASTRA_RAPOR_BULUSMA.md`.

> **20 Ekim, ortak Anıtkabir teslimi:** Batur "Bir Taş da Senden" konseptini ve doğrudan kodlamayı onayladı; ilk turda işin büyük kısmını istedi. Dal `codex/anitkabir-imece`, hedef `kutup-platform`, teslim PR. **Birleştirme/yayın ve dört kişilik kadroyu seçip etkinliği başlatma Batur'da.** Gerçek veri ve eski yapılar değiştirilmedi. Tam rapor: `ASTRA_RAPOR_IMECE.md`. Önceki otomatik yayın talimatları bu teslim için geçerli değildir.

> **19 Ekim, bu teslimin sınırı:** Batur Rahat inşaat modunu ve dar iPhone PWA odak ekranı düzeltmesini onayladı. Teslim `codex/relaxed-construction` dalından `kutup-platform` hedefine PR; birleştirme ve yayın Batur'da. Aşağıdaki eski otomatik yayın talimatı bu teslim için uygulanmaz. Başka açık işe geçilmedi.

> **İkinci üs (17–22 Ekim 2026):** Batur'un Claude sınırı dolu; işler arkadaşının bilgisayarında, onun Claude hesabıyla, fork + PR ile yapılıyor. Kurulum, sınırlar, devir promptu ve sıradaki işlerin tanımı: `IKINCI-US.md`.

Her oturum işe bu sırayla başlar:
1. İş panosunu yan panelde aç (Artifact `open`: https://claude.ai/artifact/Rm7oZuLi3ZjgqTn935kUVX). Batur akışı oradan izliyor. Her işin bir kodu var (n17 gibi); sohbette işi bu kodla an.
2. Bu dosyayı oku. Burada yalnızca şu anki durum var; geçmiş KARARLAR.md'de.
3. Görsel bir iş varsa `DESIGN.md`'yi oku.
4. `KARARLAR.md`'nin yalnızca dizinini oku, işinle ilgili kayıtları kodla ara (Grep `### n06`). Tamamını okuma.
5. İşin panodaki tam tanımını (`spec`) oku. Tanım eksikse (`ready: false`) önce Batur'a sor.

**Paket bitince:** test → (göç varsa önce yedek) → deploy → canlı duman testi → commit + push → KARARLAR.md kaydı (ne yapıldı, kararlar ve nedenleri, Batur'un sözleri, vazgeçilenler) → panoda `done` ve `decisions` → görsel kararsa DESIGN.md bölüm 9'a bir satır → 6b'yi güncelle. Ardından Batur'a hazır bir `/compact` satırı verilir; aynı sohbette devam edilir.

**Yeni sohbet** yalnızca alakasız ya da paralel işler için açılır. Brifi işi bilen oturum yazar; bilmiyorsa önce panoyu, KARARLAR.md'yi ve işin konuşulduğu sohbetin kaydını okur.

**Pano alanları:** `status` next | doing | review (Batur'un onayını bekliyor) | done · `kind` görsel | teknik · `ready` tanım hazır mı · `detail` tek cümlelik özet · `spec` tam tanım (Amaç, Batur'un sözleri, Kararlaşan, Açık sorular, Ekranlar, Yöntem, Bitti ölçütü) · `decisions` bitince verilen kararlar · `order`, `area`, `at`, `commit`.

# Kütüp — devir promptu (yeni sohbete aynen yapıştır)

Sen bu projeye kaldığı yerden devam eden geliştiricisin. Önceki sohbete erişimin yok ve gerek de yok: ihtiyacın olan her şey aşağıda ve depoda. Kullanıcı Batur; inşaat mühendisliği öğrencisi, Türkçe ve samimi yazışır ("aga"). Bütün kararları senin vermeni, onu soru yağmuruna tutmamanı, işi uçtan uca bitirip canlıya almanı istiyor. Yalnızca gerçekten ona ait bir karar varsa tek bir kısa soru sor. Aşağıdaki kararları Batur onayladı.

## 1. Proje ne?

**Kütüp**, Ankara'daki Milli Kütüphane'ye giden, farklı okullardaki 5–10 arkadaş için telefona uygun, gerçek zamanlı bir buluşma uygulaması (PWA). Asıl amaç birbirinden haberdar olmak: kim kütüpte, kim yolda, kim ne zaman gelecek. Ton eğlenceli, sıcak, "Batur tarzı"; arayüz metinlerinin hepsi Türkçe. Ana ekranda ilk soru her zaman "kim nerede?" kalmalı; yeni özellikler bunu gölgelememeli, desteklemeli.

- **Canlı adres:** https://kutup.ahmetbaturkaplanoglu.workers.dev (Cloudflare Workers ücretsiz plan + D1)
- **GitHub:** `batur-create/atomuparcalayanbebek`, dal `kutup-platform`, proje klasörü `kutup/`. `main` dalı Batur'un başka bir uygulaması (bilim mağazası), ona dokunma.
- **Yerel konumlar (Windows):**
  - Çalışma kopyası: `C:\Users\İzzettin\bilim-dunyasi\kutup-platform` (git worktree, dal `kutup-platform`). Proje kökü: `...\kutup-platform\kutup`.
  - Ana depo: `C:\Users\İzzettin\bilim-dunyasi\atomuparcalayanbebek` (`main`). Burada sadece `.claude/launch.json` var: "kutup" adlı önizleme ayarı `npm --prefix ../kutup-platform/kutup run dev` çalıştırır, port 3001. Tarayıcı panelinde önizleme için `preview_start` ile "kutup" adını kullan.

## 2. Mevcut özellikler (bozma)

- Davet linkiyle özel ekip (`/join/<davet>`): isim, 24 avatar, 6 renk, masa notu, 5 tema. E-posta yok; yeni katılışta kullanıcı adı ve şifre zorunlu. Oturum HttpOnly çerez (`kutup_session`, 1 yıl; sunucu da süreyi denetler). Eski hesapsız üyeler korunur.
- Başka cihaz: Profil → "Başka cihazda aç" 15 dakikalık tek kullanımlık kod verir; giriş ekranında "Zaten ekipteyim" ile kullanılır. iPhone'da ana ekran uygulaması Safari'den ayrı çerez tuttuğu için şart.
- Durum (Kütüpte / Yolda / Molada / Dışarıda), salon ve masa, "burada · 1 sa 35 dk"; durum 8 saat sonra kapanır.
- Web Push (kendi yazdığımız Web Crypto RFC 8291 + VAPID), 45 dakikalık geliş bildirimi soğuması, bildirime dokununca ilgili sekme (`/?tab=…`).
- Buluşmalar: iki hafta ileri ortak gün/saat, kişisel geliş saati/not/tek hatırlatma, Varım/Gelemem/Kararsızım/geri alma; düzenleme/iptal, aynı bağlantı, kişisel takvim dosyası. Aynı gün için mevcut buluşma önerilir; bilinçli ayrı grup seçimi dışında kopya açılmaz. Pano (mesaj, kalp, kahve daveti), haftalık odak tablosu.
- **İnşaat modu ve köy (Forest tarzı):** Odak seansları 25/50/75 dk; katalogdaki bina süreyi ve maliyeti belirler. Seans boyunca canlı izometrik şantiye çizilir. Varsayılan **Sıkı** modda telefondan çıkınca 15 saniye içinde dönmek gerekir; çatlama/kurtarma kuralları ve Wake Lock korunur. Bu PR'daki ayrı **Rahat** mod ekran kilitliyken de sürer, ekranı açık tutmaz; dönüşte hızlandırılmış yapım ve teslim gösterir (§6b). Tamamlanan bina ortak köydeki kendi mahallene kalıcı eklenir.
- **"Batur'a ilet":** fikir, hata ya da sohbet. Kargo takibi gibi aşamaları var: new → seen → accepted → building → done, ya da declined. Kendine ait ilham örnekleri, gönderme animasyonu, "yeni gelişme" rozeti ve her aşamada gönderene push.
- **`/batur` yönetici paneli:** istekler (açınca "İncelendi" olur, tek tuşla aşama, not, geçmiş, arkadaşın gördüğü takip çizgisinin önizlemesi, silme), yeni istek push'u, ekipler, davet yenileme, üye çıkarma. Giriş: `ADMIN_KEY` ya da ilk ziyarette belirlenen anahtar; sonra 30 günlük `kutup_owner` çerezi (yolu `/api/owner`, SameSite=Strict). Yönetici şu an hiçbir üyeye bağlı değil. Sağ üstteki "Uygulamaya dön" düğmesi ana uygulamaya götürür.
- Hareket katmanı: başlıklar Bricolage Grotesque, gövde DM Sans. Ziyaret başına bir kez oynayan açılış koreografisi. Diğer hareketler sadece bir eyleme cevap verir. `prefers-reduced-motion` destekleniyor.

## 3. Mimari

```
kutup/
  server/app.js     Tüm API: Fetch Request/Response + async DB adaptörü (all/get/run/read/batch). Node ve Worker'da aynı kod.
  server/schema.js  Sürümlü göçler (`export const migrations`, bu PR ile 26). Yayınlanmış göçü ASLA değiştirme; yenisini sona ekle.
                    D1 yüzünden her eleman TEK SQL ifadesi olmalı.
  server/push.js    Web Push (Web Crypto)
  server/sqlite.js  node:sqlite adaptörü
  server/index.js   Node sunucusu: SSE canlı akış, statik dosyalar, --dev ile Vite
  worker/index.js   Cloudflare Worker: D1 adaptörü (binding DB), ASSETS; canlılık 5 sn'lik yoklama
  shared/requests.js İstek aşamaları ve metinleri (sunucu + arayüz ortak)
  src/App.jsx       Ana uygulama (sekmeler: home, focus, board, me, feedback; eski ?tab=plans ana sayfadaki planlara kayar), modallar, FocusCard, Board, WeekBoard...
  src/Home.jsx      Ana sayfa (n17/n18): HomeSky (saatle değişen gökyüzü), StatusCard, People + MemberCard + Badge, Plans, Doors
  src/MePage.jsx    Ben sekmesi (profil, görünüm, istatistik, davet, Batur'a ilet, hesap, ayrıl)
  src/home.css      Ana sayfa, Ben, alt menü işareti; src/motionFeatures.js Motion motoru (tembel yüklenir)
  src/Village.jsx   İzometrik çizim (projector, box, spec(kind, seed) deterministik), ConstructionScene (rAF, 30 fps), VillageMap, VillagePanel
  src/Requests.jsx  Batur'a ilet sayfası, RequestTracker, useRequestUpdates
  src/Owner.jsx     /batur paneli
  src/ui.jsx        storage, Avatar, Busy, Empty, Burst, keepScreenOn/releaseScreen, pushKey...
  src/api.js        fetch yardımcıları, sabitler, tarih yardımcıları, DEMO (girişsiz ön izleme verisi, örnek köy dahil)
  src/styles.css    Temel tasarım (eski, büyük dosya)   src/motion.css  Hareket, takip çizgisi, köy, panel stilleri
  tests/            suite.js (uçtan uca, Node ve Worker'da ayrı ayrı koşar), core.test.js, push.test.js, helpers.js
  wrangler.jsonc    Worker ayarı (D1 "kutup", id yazılı değil; otomatik provizyon)   .openai/hosting.json  ChatGPT Sites için
```

**Önemli mekanizmalar:**
- **Her yazma işlemi** grubun `rev` sayacını artırır (`bump(groupId)`) ve yanıtta `state` döner. İstemci `mutate()` ile bunu kullanır. Yoklama: `/api/state?rev=N` → değişmediyse `{unchanged:true}`.
- **Anlık görüntü** sabit sayıda sorgu (`db.read`) ile kurulur. Biten odak seanslarını kim okursa o kredilendirir (`finalizeFocus`, koşullu SQL, eşzamanlı çalışmaya güvenli).
- **İnşaat modu sütunları:** `members.focus_strict / focus_relaxed / focus_beat / focus_seed` (Rahat ayrıntıları §6b).
  - İstemci görünürken 20 sn'de bir `beat` atar, 3 sn'de bir `localStorage` işareti bırakır.
  - Sunucu, sonundan 90 sn öncesine kadar sinyal görmüşse binayı ekler (`buildings` tablosu: id, member_id, group_id, kind, minutes, seed, created).
  - `wither` / `cancel` → çöküş ve panoya mesaj.
- **Uçtan uca test kancası:** `KUTUP_TEST_HOOKS=1` iken `POST /api/__test/expire {name, away}` çalışır.
- **Yazma koruması:** `X-Kutup: 1` başlığı ve Origin kontrolü. Hız sınırı bellek içinde.

## 4. Komutlar (`kutup/` içinde)

```
npm ci
npm run dev          # http://localhost:3001 (Node + SSE + Vite); veri: kutup/data (yerel test verisi var)
npm test             # çekirdek + istemci + push + Node uçtan uca
npm run test:worker  # aynı senaryolar yerel workerd + D1
npm run test:all     # hepsi (plan keşfi PR: 189 test) — her teslimden önce yeşil olmalı
npm run deploy       # vite build + wrangler deploy (canlı)
npm run test:browser # gerçek tarayıcı, 100 kontrol (pip install playwright; Chrome/Edge kendiliğinden bulunur)
npm run test:browser:relaxed -- --artifacts /tmp/kutup-relaxed # Rahat/teslim ve iPhone boyut-yön kontrolleri (Chromium)
npm run test:browser:imece -- --artifacts /tmp/kutup-imece # 43 ortak proje/film/katkı açıklığı/mobil kontrolü, geçici veritabanı
npm run test:browser:plans -- --artifacts /tmp/kutup-plans # 22 buluşma/kişisel geliş/düzenleme/bağlantı kontrolü
npm run test:browser:blueprints -- --artifacts /tmp/kutup-blueprints # plan keşfi, garanti, 6 yeni yapı ve mobil katalog
node scripts/restore-backup.mjs <yedek.json> <yeni.sqlite> [--sql <d1.sql>]  # JSON yedeği boş kopyaya kurar ve doğrular (RECOVERY.md)
```

- **Wrangler (Batur’un Windows çalışma ortamı):** Cloudflare hesabına OAuth ile bağlı. Bu bağlantı Codex bulut ortamına taşınmış sayılmaz; 14 Ekim denetiminde burada yayın kimliği yoktu ve Cloudflare ağı 403 verdi. Token süresi dolarsa `npx wrangler login --device --browser=false` çalıştır. Çıkan kodu tarayıcı panelinde `https://dash.cloudflare.com/oauth2/device/verify` adresinde kutuya yaz, Batur'a "Continue ve Allow'a bas" de. Kodun ömrü 5 dakika.
- **Canlı `ADMIN_KEY`** Cloudflare'de secret olarak tanımlı. Yerel kopyası `kutup/data/batur-key-canli.txt`. Asla ekrana basma ya da sohbete yazma.
- **Canlı duman testi:** `node tests/live-smoke.mjs` (kutup/ içinde; geçici ekip kurar, hesap/senkron/kurtarma/çıkış/push bağlamayı dener, sonunda `POST /api/leave` ile siler, gerçek ekiplerin değişmediğini kontrol eder; anahtar ve kodları ekrana basmaz). Yeni özellik eklerken betiğe adım ekle. Yayından hemen sonra kenar önbellek birkaç saniye eski HTML verebilir.
- **Yerelde `/batur` testi:** Anahtarı yazmak yerine Node ile yerel veritabanına `owner_sessions` satırı ekle (`token = sha256(rastgele)`, `key_hash = sha256(anahtar)`). Sonra sayfada `document.cookie = "kutup_owner=<rastgele>; path=/api/owner"` yap.
- **İnşaat animasyonunu hızlı test etmek için** yerel veritabanında `members.focus_end`'i birkaç saniye sonraya çek (`focus_beat = şimdi`), sonra sayfada `visibilitychange` olayı tetikle. Uygulamadan çıkmayı taklit etmek için `document.visibilityState`'i geçici olarak "hidden" yap.

## 5. Öğrenilmiş tuzaklar

- **Git Bash heredoc'ları** `’` (kıvrık kesme) ve backtick içeren metinlerde bozuluyor. Bu tür içeriği Write/Edit araçlarıyla yaz; `node -e` ile sadece basit değiştirmeler yap.
- **Üst klasördeki Tailwind/PostCSS** ayarı sızmasın diye `vite.config.js` içinde `css.postcss` satır içi boş tanımlı. Kaldırma.
- **Yazı boyutu** telefonda 10px'in altına inmesin.
- **`.timer-digits > span`** seçicisi altyazı içindir. Sayaç rakamları `<b className="clock">` içinde durur.
- **Dinamik isimlerden sonra Türkçe ek kullanma** ("Batur’e" hatası). "X için not", "Köy: X" gibi kalıplar kullan.
- **Mobil öncelikli:** 375px'te yatay taşma olmamalı. Alt menüde 4 öğe var (Kütüp, Köy, Pano, Ben).
- **Taşma tuzağı:** `display: grid` kapsayıcılarda `grid-template-columns: minmax(0, 1fr)` yoksa uzun tek satırlık (`nowrap`) metin sütunu genişletir; telefonda sayfa 434 px'e açılır ve sabit alt menü ekranın dışına düşer. Kontrolü `scrollWidth > 375` ile yap (`innerWidth` de büyüdüğü için onunla karşılaştırma yetmez).
- **Sekme geçişi:** `AnimatePresence mode="wait"`; yeni sekme eskisi çıktıktan sonra takılır. Testlerde sekmeye bastıktan sonra o sekmenin bir öğesini bekle (`.me-page` gibi).
- **Motion:** `motion/react`'tan `m` bileşeni kullanılıyor (`LazyMotion strict`, `motion.` yasak). `.map((m) => <m.div>)` yazma, parametre `m`'yi gölgeler; `x` de.
- **Animasyon kuralı:** tek bir orkestra edilmiş açılış ve eyleme cevap veren hareketler. Kendi `transform`'u olan öğelerde yalnızca `from` tanımlı keyframe ve `animation-fill-mode: backwards` kullan. İnşaat sahnesi tek rAF döngüsünde 30 fps; ekran 75 dk açık kaldığı için pil bütçesine dikkat.
- **Sayfa yenileme "uygulamadan çıkma" sayılmamalı.** 3 sn'lik yerel işaret bu yüzden var.
- **Tarayıcı paneli ekran görüntüleri** bazen yanlış ölçekleniyor. Önce JS ile DOM ve taşma kontrolü yap, görsel için `zoom` kullan.
- **Git:** commit mesajları İngilizce, sonunda `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `kutup-platform` dalına push et, `main`'e dokunma. `kutup/data/` Git'e girmez.

## 6. Onaylanmış kararlar

1. **Köy:** Tek ortak "Kütüp köyü", içinde herkesin isim tabelalı mahallesi. Uzun vadede sorunsuz büyümesi için KARARLAR.md arşivindeki Paket 1 altyapı planına uy.
2. **Kara delik:** Batur'un gizli kapısı ve `/batur` panelinde istekleri yutan çöp. Ayrıca Batur'un herkesin göreceği "geliştirici" eşyası (bkz. KARARLAR.md arşivi, Paket 3).
3. **Yapay zekâ yok.** Onun yerine özenle tasarlanmış bir maskot: **Kara** (eski adı Mürekkep; ilk planı KARARLAR.md arşivinde, Paket 2). Mesajları hazır şablonlardan gelir.
4. **Mini oyunlar** sadece molada açılır (durum "Molada" ya da seans yeni bitmiş). İnşaat sırasında kapalıdır.
5. **İnşaat ve köy görselleri** inşaat mühendisi gözüyle ayrıntılandırılacak (bkz. KARARLAR.md arşivi, Paket 5 ve 6).

## 6b. Durum (son güncelleme 20 Ekim 2026)

> **Katkı açıklığı:** `Imece.jsx` içindeki `ContributionCard` toplam dakikayı öne çıkarır; `PhaseShares` üç zorunlu katılım payını ayrı gösterir. Tek 50/250 çubuğu kaldırıldı; üst özet gerçek toplam katkıdır. Mevcut dakika değerleri değişmeden sunulur; ek ortak emek toplamdan bölüm paylarının toplamı çıkarılarak açıklanır. Kara mevcut bölüme göre konuşur; tamamlanmış 50 dakikalık pay yerine “200 dk kaldı” diyerek gelecek bölümleri aynı iş gibi sunmaz. Başlangıçta seçilen seansın tamamının ortak hedefe sayıldığı, bir kısmının zorunlu bölüm payını da karşıladığı anlatılır. Açılır örnek Bensu’nun 150/50/100 durumunu açıklar. Yardım sorusu ve sürüm21 eklendi. **189/189 Node–Worker**, **43/43 İmece tarayıcı**, tema **252/252**, diff temiz. Yeni tarayıcı kontrolleri gerçek 150 dakikalık emek, 50/50 pay, gelecekteki kilitli paylar, 100 dk ek ortak emek, okuma işlemlerinin kayıt değiştirmemesi ve 360/375/390/844 px ölçülerini kapsar; eski 2.000 dk tamamlama ve film kontrolleri de geçer. Fiziksel iPhone ve canlı veri kullanılmadı. Görseller `/workspace/artifacts/imece-katki-aciklama/`.

> **Plan keşfi (20 Ekim, PR):** `shared/blueprints.js` tek dakika/olasılık/garanti kaynağı. Başarıyla sonuçlanan seansın `s.credit` değeri 25 dakikalık çekilişlere dönüşür; artan dakika taşınır. Her çekiliş %5, en geç 500 dakikada elde olmayan rastgele bir plan; 75 dk ile 3×25 dk aynı çekiliş dizisi. Uzun seansta birden fazla farklı plan mümkün. `blueprint_progress` taşıma, plansız dakika, sıra ve yalnız sunucunun bildiği seed tutar. Çekilişler seed+sıra SHA-256 ile sabittir; ödül/ilerleme aynı mevcut seans işlemi ve ekip revizyonuyla yazılır. Sıkı/Rahat/serbest/İmece aynı hak edilmiş dakika kuralındadır; yarım kalan inşaat sayılmaz. Seri/hediye/usta/haftalık plan çalışma garantisini sıfırlamaz. Havuz biterse keşif bekler; o arada yeni keşif dakikası bankalanmaz.
>
> **Göç 31:** yeni ilerleme tablosu ve daha önce açık döneminde tamamlanan, halen kaydı bulunan Postane/Çay Ocağı için kalıcı hak dönüşümü. Hediye ve dönem dışı yapılar dahil değil. Sonraki haftalık tamamlamalar `unlocks.source='weekly'` yazar; makbuz kalıcı planı söyler. Yeni sayaç eski çalışma geçmişinden geriye dönük rastgele ödül üretmez; yeni hak edilen seanslarla başlar. Mevcut planlar, binalar ve ücretler korunur. Yedek/geri yükleme yeni tabloyu ve 31 öncesi haftalık hak dönüşümünü kapsar; seed üye API'sine verilmez.
>
> Katalogda “Plan keşfi” barı, kalan süre, açıklama ve “mevcut koleksiyon tamamlandı” durumu. Kilit ipuçları, Kara yardımı, haftalık kartlar ve Yenilikler güncellendi. Nadir havuz 2→8: Ağaç Evi/Japon Çay Evi (25 dk), Su Değirmeni/Tren İstasyonu (50 dk), Planetaryum/Kristal Kütüphane (75 dk). `rareBuildings.js` altı özgün SVG/Canvas çizimini, parça parça yapımı, malzeme/hakediş, işçi/vinç bağlantısını ve aşama açıklamalarını sağlar; katalog/hediye/köy aynı geometriyi kullanır. `olcek.js` özgün tasarımların tipik boylarını ve yer sınırlarını tanımlar; yeni anıt mahallesi yok.
>
> Doğrulama: 189 Node/Worker testi; mevcut genel tarayıcı 100 ve İmece 35; yeni plan keşfi tarayıcı 19 kontrol ve yerel görseller `/workspace/artifacts/plan-kesfi/`; tema 252 çift. Fiziksel iPhone, üretim verisi veya canlı yayın kullanılmadı.

> **Bütünsel buluşma (20 Ekim, PR):** Tek kart/tek cevap kaynağı: `shared/plans.js` kuralları ve DTO, `server/plans.js` servis, `src/Plans.jsx` oluşturma/katılım/yönetim ekranları. `Modals.jsx` yalnız yeniden dışa aktarır; ana sayfanın eski toggle cevabı kaldırıldı. `attendees` artık `answer=yes/no/maybe`, kişisel `arrival`, kısa not, hatırlatma tercihi ve onaylanan saat sürümünü tutar. Göç 30 eski Varım/Gelemem kayıtlarını birleştirir; eski `plan_skips` tablosu kurtarma için korunur, canlı cevaplarda kullanılmaz. Eski yedeklerin geri yüklenmesi de aynı dönüşümü yapar.
>
> Başlangıç ve kişisel geliş ayrıdır; 14.00 buluşması içinde 16.00 katılım başka plan oluşturmaz. Varsayılan aynı günkü buluşmaya yönlenir; ayrı çalışma grubu açık seçim ve ad ister. Aynı dakika kopyaları ve aynı anda gönderilen oluşturma işlemleri ekip revizyonuyla birleşir; oluşturma istek anahtarı tekrar kayıt üretmez. İlk liste 30'luk sayfadır; devamı yüklenir. `GET /plans/:id` ekip doğrulamasıyla doğrudan okur; liste dışında/iptal/geçmiş kart da bağlantıdan açılır. Bitiş belirtilmediyse buluşma Türkiye günü boyunca geçerlidir; iki saat sonunda kaybolmaz.
>
> Organizatör düzenleme/iptal yapar; herkes, organizatör dahil, kişisel gelişini ve cevabını bağımsız değiştirir. Saat/bitiş değişimi `schedule` sürümünü artırır; eski katılımlar yeniden onay bekler. Yalnız not değişirse cevaplar korunur. `rev` eski cihazın yönetim isteğini reddeder. İptal silme değildir: aynı bağlantı iptali açıklar; ilgilenenlere haber gider. Bildirim doğrudan `?plan=<id>` açar; paylaşımlar göreli “yarın” yerine tarih/yıl/saat içerir. Kişisel takvim `.ics` kendi geliş saatini kullanır. Yoldayım/Geldim mevcut durum formunu açar; plan kendiliğinden fiziksel giriş yapmaz.
>
> Hatırlatma açık tercih ile kendi gelişinden 30 dk önce bir kez, mevcut cron/outbox üzerinden çalışır. `plan_push_events` ve kuyruk aynı işlemde yazılır; eşzamanlı tetik çift kayıt üretmez. Gönderim/yeniden denemede hâlâ Varım, doğru saat sürümü, aynı geliş, açık tercih ve iptal edilmemiş plan aranır. İzin/abonelik ve işletim sistemi teslimi için kesin zaman garantisi yok. Yeni ücretli servis/bağımlılık yok. **181 test + 100 genel / 22 buluşma / 35 imece tarayıcı kontrolü**, tema 252 çift. Gerçek veri/canlı yayın/fiziksel iPhone testi yapılmadı.

> **Bir Taş da Senden / Anıtkabir İmecesi (20 Ekim, PR):** Bütün köylerin ortak tek projesi; Batur komuta merkezinde dört gerçek profili seçerek başlatır. Göç 29 yalnız sütun/tablo ekler; eski anıtlar otomatik silinmez. Hedef 2.000 dk = 400 temel + 1.200 ana yapı + 400 ayrıntı. Herkesin bölüm başına zorunlu payı 50/150/50 dk; kalan 1.000 dk paylaşılır. Takvim kilidi yok. Dört kişilik kadro korunur; Batur devam eden seansı olmayan bir görev yerinin hesabını komuta merkezinden düzeltebilir. Görev yerindeki geçmiş katkı ve kişisel paylar korunur; otomatik muafiyet yoktur.
>
> `shared/imece.js`: 22 işin süre/açıklama/inşaat gerekçesi, aşamalar ve kişisel pay. `server/imece.js`: küresel revizyonla kapasite rezervasyonu, tek seferlik katkı, kalıcı teslim. `/focus` `imece:true` ile ayrı hedef alır; kişisel bina ve malzeme ücreti yok. Varsayılan Rahat ekran kapalıyken sürer; Takipli seçeneği bütün seansı uygulamada ister. İkisi de yarım maaş; normal bonuslar korunur. Mevcut Sıkı/Rahat kişisel yapım değişmedi.
>
> `Imece.jsx`: ana sayfa/Köy kartı, yaşayan Kara'nın kişisel mektubu, çalışma, katkı defteri, hızlandırılmış/atlanabilir teslim. `/imece` ortak görünümü yalnız giriş yapmış kişiye verir; özel ekip verisi açılmaz. Owner `/owner/imece` kadroyu başlatır; `POST /owner/imece/crew/:slot` yalnız owner yetkisiyle, istemcinin `rev` değeri ve aynı işlem içindeki küresel revizyon/hesap/seans korumalarıyla hesabı düzeltir. `ImeceScene.jsx` + `imeceArt.js`: büyük ortak şantiye alanı; plan/fotoğrafa göre tek ölçek, Canvas katman sırası, 42 basamak, on kule, uzun yol/24 aslan, taş/desen/çevre/bayrak ayrıntıları; dört kamera. Eski kişisel çizim dosyaları korunur. Normal kişisel haritada yeni bina satırı üretilmez.
>
> Komuta merkezindeki mevcut kaldırma yetkisine sunucu destekli **Yalnız Anıtkabir** filtresi eklendi. Yeni kişisel Anıtkabir, proje başlayınca katalogdan ortak şantiyeye yönlenir. Eski seanslar/yapılar korunur; kaldırma Batur'un açık seçimiyle mevcut onay akışındadır. Yedek tablosu listesi `shared/backup.js`; owner yedek ve `server/restore.js` aynı listeyi kullanır. Test ve sınırlar: `ASTRA_RAPOR_IMECE.md`.
>
> **İmecenin hareket/açılış paketi (20 Ekim, aynı PR #43):** Batur ayrı planı **“onay”** ile kabul etti. `imeceMotion.js` 22 işe ait şantiye konumunu, alet/hareket türünü, sadece kaydedilmiş katkı aralığını gösteren 6–22 sn teslim zaman çizelgesini ve beş duraklı 15 sn açılışı tanımlar. `imeceLive.js` ayrı şeffaf Canvas'ta insan ölçeğinde işçileri, ölçüm/kazı/donatı/beton/taş/ince iş ekiplerini, destekli iskeleyi, yük alıp yerine indiren kule vinci ve kazı-yükleme hareketini çizer. Eski köy/kişisel inşaat motoruna dokunulmadı.
>
> `ImeceScene.jsx`: mozole/iş başı/meydan/Aslanlı Yol/tüm yerleşim/bayrak olmak üzere altı kamera. Masaüstündeki modal genişliği genel `.modal.wide` kuralına takılmadan 1.080 px'e kadar açılır. Anıt Canvas'ı yalnız ilerleme/kamera/boyut değişince çizilir; bayrak kumaşı aynı hilal-yıldız geometrisiyle canlı katmanda hafif dalgalanır. Canlı ekip yalnız etkin seans varken görünür; teslimdeki ekip geçmiş yapımın canlandırmasıdır. Bu hareketler seans süresini veya katkıyı ilerletmez.
>
> `useImecePlayback.js`: ekran dışı/gizli sekme/duraklat durumunda hem film saati hem canlı döngü durur; görünürken kaldığı yerden sürer. Şölen'de canlı döngü, Sakin'de yalnız kullanıcının başlattığı film; Kıpırtısız/etkili sistem hareket azaltmada film anında son görüntüyü/katkı defterini gösterir. Açılış yalnız sunucunun `complete` sonucu ile, düğmeyle başlar; Aslanlı Yol → meydan → mozole → bayrak → dört kişinin emek defteri. Atla/duraklat/tekrar izle ve klavye odağını geri verme var. Yeni göç, sunucu/ücret/kadro/hedef değişikliği yok. Teslim kabulü izlenen kaydın `through` değerini kullanır; başka cihazdan sonra biten emek bekleyen teslimde kalır. Testler: **170/170** genel, **35/35** imece tarayıcı. PR birleştirme/yayın yine Batur'da; canlıya dokunulmadı.

> **n43 komuta merkezi (19 Ekim gece, PR #41):** göç 27 `buildings.gift` (hediye notu, NULL = seansla yapılmış). Hediye yapı bir `build_deliveries` satırıyla gelir (ödül 0); `/build-deliveries` artık `gift` da döner. `/village` bina satırı 14 alan: `…, model, patched, gift` ve yanıtta `total` (bbox yoksa); istemci `mergeVillage` eksik sayıda `stale` der, `villageData.js` köyü baştan çeker. Hediyeler rozet hesabına girmez. Duyuru `messages.kind = 'announce'` (sistem değil, kalp alır). İstek türü `build` (`shared/requests.js`). Her yerden "Batur'a ilet"i bir türle açmak: `window.dispatchEvent(new CustomEvent("kutup:ask", { detail: { kind } }))`. Testler `tests/owner.test.js`; görüntü aracı `/mnt/project-files/kutup/araclar/n43_shots.py`.

> **Rahat inşaat + iPhone PWA, 19 Ekim 2026 (PR; Batur yayınlayacak):**
> - İnşaat içinde **Sıkı / Rahat** seçimi var; yeni kullanıcıda Sıkı varsayılan. Sıkı'nın 15 saniye, çatlama, tek kurtarma ve çay molası kuralları korunur. Seans içinde mod değişmez. Rahat ekran kilidine, başka uygulamaya ve sekmenin kapanmasına dayanır; Wake Lock, `beat`, `away`, `crack`, pasif `wither`, mola ve kurtarma akışı yoktur. Açık iptal eski malzeme/iade kurallarını kullanır.
> - **Göç 26:** `members.focus_relaxed` (eski üyelerde 0), `build_deliveries`, `build_push_events` ve indeksleri. 1–25 aynen korunur. `focus_strict=1` hâlâ bina üreten seans anlamına gelir; ekran gözetimi için ayrıca `focus_relaxed=0` aranır. Var olan seans/cüzdanın korunması ve tekrar açılış testi var. **Yayın öncesi mevcut yedek akışını çalıştır.**
> - Sunucudaki `focus_end` belirleyicidir. İlk normal durum okuması/teslim sorgusu biten Rahat seansı atomik olarak kredilendirir; uygulamanın arka planda çalışması gerekmez. Bina, tuğla ve teslim kaydı aynı korumalı işlemde oluşur. `GET /api/build-deliveries` yalnız kendi bekleyen kayıtlarını verir; `POST /api/build-deliveries/:id` sadece alındı işareti koyar, ödül dağıtmaz. Farklı hesap erişimi ve eşzamanlı tamamlama testli. Yedek/geri yükleme yeni teslim ve bildirim kayıtlarını da içerir.
> - `server/relaxed.js`: başlama, %25/%50/%75 ve bitiş için mevcut Web Push/outbox altyapısı. Aynı seans aynı bildirim etiketini kullanır. Ara güncellemeler sessizdir; bitiş sesli olabilir. Kalıcı olay kaydı eşzamanlı cron/istekte tekrar kuyruğa almayı engeller; kaçırılmış aşamalardan yalnız güncel olan gönderilir. Cron en fazla 4 olayı kuyruğa yazar; mevcut sınırlı gönderici izleyen cron turunda gönderebilir. Gönderim, internet ve işletim sistemine bağlıdır; kesintisiz sayaç/kalıcı kilit ekranı bildirimi iddiası yoktur. iOS Web Push için ana ekrana kurulum ve kullanıcı izni gerekir. Kabul/iptal, kalan kuyruk satırlarını ve bu cihazdaki eşleşen bildirimi temizler; sağlayıcıya önceden teslim edilmiş bildirim geri çekilemez.
> - `src/BuildDelivery.jsx`: aynı model/seed ile **18 saniyelik hızlandırılmış yapım**, atlanabilir. `ConstructionScene` ve korunan çizim dosyaları değiştirilmedi. Hareket azaltmada bitmiş bina doğrudan görünür. Teslim alınmayan kayıt yenileme/yeniden girişte kalır; izlemek, atlamak veya tekrar kabul ödülü çoğaltmaz.
> - iPhone dar düzeltmesi yalnız `FocusScreen.jsx` / `focusscreen.css`: `visualViewport`, güvenli alanlar, dönen ekrana sığan sayaç ve sahne, yön değişince yalnız yerel sahne yakınlaştırmasını sıfırlama. Tam sahne yazısı üst araçlardan uzak tutulur. Genel sayfa yakınlaştırması değişmedi. **Gerçek iPhone Safari/kurulu PWA henüz doğrulanmadı:** 390×844, 844×390, 667×375 ve 375×667 Chromium dokunmatik/iPhone benzetimi geçti; fiziksel cihazda kontrol edilmeli.
> - Doğrulama: `npm run test:all` **146/146** (Node + yerel Worker/D1); mevcut `test:browser` **100/100**; yeni `test:browser:relaxed` **18/18**. Canlıya veya gerçek kullanıcı verisine dokunulmadı.

> **n14 (ikinci üs, 17 Eki):** Başarımlar: liste ve eşikler `shared/achievements.js`, hesap `server/achievements.js` `achievementsOf()` (kayıtlardan, geriye dönük; kazanılan `achievements` tablosuna yazılır ve kalır), çizimler `src/achievementArt.js`. Yeni rozet eklerken: listeye ekle, hesabı `achievementsOf()`'a yaz, çizimi `ART`'a koy, testteki sayıyı (16) güncelle. Görüntü almak için `kutup/araclar/badge_shots.py` (yerel deneme verisi).
>
> **n30 — Adnan planı, 19 Ekim 2026 (PR; Batur yayınlayacak):** Adnan artık Batur'un `masa-plani-paketi.zip` dosyasındaki 1–425 bireysel koltuğu kullanır. Kaynak koordinatlar/koridorlar/gri bloklar/giriş `shared/adnanPlan.js`; salon kaydı ve numara eşleştirme `shared/rooms.js`; Kütüp temasıyla çizim, genel görünüm, kaydırma/yakınlaştırma, numarayla bulma ve ok tuşlarıyla gezinme `src/SeatPlan.jsx`. SVG/HTML dosyası sayfaya gömülmez. Genel görünümde minik koltuk kontrolleri yoktur; plana dokunma/arama ile en az 44 px koltuklar açılır. Müjgan'ın 36 koltuklu temsilî düzeni korunur. Sunucu/veritabanı/göç değişmez: aynı `members.location` ve `members.desk` alanları kullanılır. İşaretlenmemiş yerler yalnız ekibin bildirimini ifade eder, fiziksel boşluk garantisi değildir. Kaynak fotoğraftan türetilmiş olduğundan ölçülü mimari plan iddiası yoktur. Bu dal için deploy yapılmadı. Eski `araclar/map_shots.py` bu revizyonda bulunmuyor; güncel görüntüler `tests/browser_smoke.py --artifacts <geçici-klasör>` ile üretilir.
>
> **n28 (ikinci üs, 17 Eki):** Haftanın hikâyesi `Story.jsx` (tembel), hesap `server/stats.js` `storyOf()`, hafta `shared/week.js`. Pazar 18.00 bildirimi `tick()` içinde, `weekly` tablosunda `story` satırıyla bir kez. Yeni kart eklerken `cardsOf()` sırasına ve `Card` içine ekle; açık zeminli kartı `tone` listesine yaz. Görüntü almak için `kutup/araclar/story_shots.py` (yerel deneme verisi).
>
> **n24 (ikinci üs, 17 Eki):** Odak sesleri `Sound.jsx`'te yeniden yazıldı (yağmur, kütüphane, şömine, orman, dalgalar, kafe). Yeni ses eklerken: olaylar `EVENTS`, yavaş şekiller (rüzgâr, dalga) `SHAPES` + `follow()`, yankı `space()`; düzeyi eskilerle eşlemek için `TRIM`. Ölçüm ve eski/yeni örnek araçları proje klasöründe `kutup/araclar/sound_render.py`.
>
> **n29 (ikinci üs, 17 Eki):** Cloudflare'de canlılık artık ekip başına bir Durable Object (`LiveRoom`): `/api/live` WebSocket, oturum çerezinden doğrulanır, oda yalnız "changed"/"removed" der, veri hep `/state`ten gelir. Yeni yazma uç noktası eklerken `changed()` ya da `onChange()` çağırmayı unutma, yoksa telefonlar ancak yoklamada görür. App.jsx bölündü: odak kartı `Focus.jsx`, Pano `Board.jsx`, küçük pencereler `Modals.jsx`. Nadir açılan ekranlar `later.jsx` ile tembel yüklenir; yeni ağır ekran eklersen oraya koy. Son durum `localStorage` `kutup-last` anahtarında (`lastState.js`).

> **n31 Kara v2 (ikinci üs, 17 Eki):** Kara artık `kutup:kara-test` olayıyla da denenebilir (`{id:"home", act|egg|blink|wink}`), yalnız test ve önizleme için. Sürprizlerin sayaçları `sessionStorage`'da (`kutup-kara:<grup>:<ad>`). `kara.css` büyük (gzip 40 KB): eklem kliplerini elle düzenleme, değişiklik gerekirse paketteki üretim mantığıyla yeniden üret. Kenar ışığı ve kürk tonları dosyanın başında, bilerek eski değerlerde.

> **İş akışı panosu:**
> - Adres: https://claude.ai/artifact/Rm7oZuLi3ZjgqTn935kUVX ("Kütüp İş Akışı").
> - Batur yapılan, yapılmakta olan ve sıradaki işleri buradan izliyor.
> - Her iş başlayınca ve bitince `ArtifactData` ile güncelle:
>   - `tasks` koleksiyonu: `status` (done | doing | next), `title`, `detail`, `area`, `order`, `at`, `commit`.
>   - `meta/board` belgesi: `updated`, `note`.
>
> **Astra ile çalışma:**
> - Astra `astra/gorevler` dalında çalışıyor ve kendi başına yayınlayabiliyor.
> - Her yayından önce iki dalı birleştir (`git fetch` ve `git merge origin/astra/gorevler`); aksi hâlde birinin işi geri gider.
> - Göç numaraları sırayla, en son yayınlananın arkasına eklenir.

> **d23 (ikinci üs, 17 Eki):** `POST /api/account` artık şifresi olan hesapta `current` (şu anki şifre) istiyor; testlerde ve betiklerde hesap değiştirirken `current` gönder. `authLimit(key, max, window)` pencere alıyor; yanlış şifre sayacı `wrong:<kullanıcı adı>` anahtarında, bir saat. Zamanlayıcı bildirimleri `settings.origin`'deki adresi kullanır.

> **d24 (ikinci üs, 17 Eki):** Yeni küçük bir düğme 44 px dokunma alanını `src/polish.css` sonundaki d24 listesinden alır (görünmez `::after` katmanı); kendi `::after`'ı olan öğeyi o listeye ekleme. `tests/browser_smoke.py`'deki `SHORT_REACH` aynı listeyi dört sekmede denetler.

> **d25 (ikinci üs, 17 Eki):** Gövde `text-wrap: pretty`, başlıklar `text-wrap: balance` (`src/styles.css` başı). Bir başlığın sonuna emoji koyarken `&nbsp;` gerekmez; `tests/browser_smoke.py`'deki `LONE_LAST` başlıkları denetler.

> **d26 (ikinci üs, 17 Eki):** Ana ekran simgesi değişirse üçü birlikte üretilir: `public/apple-touch-icon.png` (180, köşesiz, saydamlıksız), `public/icon-maskable-512.png` (işaret çapın %80'lik dairesinde), `public/badge-96.png` (beyaz, saydam zemin). `tests/browser_smoke.py` ilk ikisini denetler.

> **d27 (ikinci üs, 17 Eki):** Hesap ve cihazlar'daki "Açık cihazlar" `GET /api/devices` ve `POST /api/devices/signout` ile çalışır; yalnız kendi hesabının diğer oturumlarını ve onlara bağlı abonelikleri siler. Şifre değişince diğer cihazlar hâlâ açık kalıyor (Batur'un kararı bekleniyor).

> **d28 (ikinci üs, 17 Eki):** Arkadaşın oturumuna katılmak için en az `JOIN_LEAD` (5 dk, `shared/catalog.js`) kalmalı; sunucu (`/api/focus` `joinMember`) ve uygulama (`Together.jsx`: Katıl düğmesi, katılma şeridi) aynı sabiti okur. "Ekibi çağır" bildiriminin 10 dakika sınırı ayrı ve değişmedi.

Geçmiş devirler (Astra denetimi, bildirim sağlamlaştırma, önceki paketler, Kara yön değişikliği) ve ilk paket planı KARARLAR.md arşivine taşındı.

### ⭐ Güncel devir — 15 Ekim 2026 akşamı (Claude; canlı şema 20) — ÖNCE BUNU OKU

**Durum (güncel, 16 Ekim 2026 akşamı):** n18-2 görsel şölen turu canlıda (commit `ea86b4c4`, Worker `e3c0ea53`): katmanlı gökyüzü, zengin ana sayfa, hareket ayarı, yeni temalar ve renkler, ekip kartı, Pano'da cevap ve çift dokunuşla kalp. Testler 93 birim, 45 tarayıcı, canlı duman testi geçti. Batur'un canlıda bakması bekleniyor. *(Önceki:)* **Durum (16 Ekim 2026 öğleden sonra):** n17 menü akışı (4 sekme, Ben, yeni ana sayfa) ve n18 canlı site aşama 1 (yaşayan gökyüzü, hareket anları) canlıda; Batur'un canlıda bakıp onaylaması bekleniyor (panoda "Onayını bekliyor"). Son kod commit'i `c6162645`, Worker `cfa3318b`, şema 20. Testler: 93 birim, 41 tarayıcı, canlı duman testi geçti. Yeni bir sohbete devredilirse yine Batur'un onayını bekle. *(Önceki not:)* Batur, sohbet dolduğu için devir istedi ve "ben onay vermeden kod yazma, komut çalıştırma, kredi harcama" dedi. Son commit `e7d54230` (Studying together, part 2), `origin/kutup-platform` ile eşit, çalışma ağacı temiz. Canlıda şema 20; `npm run test:all` 87/87, `npm run test:browser` 30/30, `node tests/live-smoke.mjs` geçti.

**Batur'un çalışma kuralları:**
- Paketleri arka arkaya yap. Her önemli adımda: test → (göç varsa önce yedek) → deploy → canlı duman testi → commit + push → iş panosunu güncelle.
- Kredi: arada `get_usage` ile bak; %99'a gelmeden yayınla ve checkpoint al.
- İş ortasında attığı fikirler ilhamdır: panoda en uygun sıraya koy, uyumlu olanları birleştir, mevcut işe devam et.
- **iOS öncelikli** (Bensu, Zeynep, Sıla iPhone kullanıyor): iOS Safari + ana ekran PWA; Fullscreen API'ye güvenme; safe-area; ≥44px dokunma alanı; hover'a bağlı kontrol yok; push gereken yerde "Paylaş → Ana Ekrana Ekle" gibi adım adım rehber.
- Soru yağmuru yok. Gerçekten Batur'a ait bir karar varsa seçenekli tek soru.
- **Görsel ve karar kuralı (Batur, 16 Ekim 2026):** Her yeni oturum işe başlamadan önce sitenin kendi görünümüne bakar: önizlemeyi açar (`preview_start` "kutup"), işin dokunduğu ekranların görüntüsünü alır. Paketin kararları tam belli değilse, görsel tarzdan ya da Batur'un isteğinden emin değilsen, yayından önce ona soru sor ve **görsel ön izleme** göster: gerçek uygulamada çiz, 375px açık ve koyu, gerekirse A/B yan yana. Avatarlarda siteyi görmeden yapılan çizim sırıtmıştı, kural bu yüzden var. Teknik kararlar yine senin. Bir oturum başka bir oturuma iş tanımlarken ayrıntıları eksiksiz yazar: görünüm, yer, metinler, durumlar, neyin karara bağlandığı ve neyin açık olduğu.
- **Net ekran görüntüsü:** Tarayıcı panelinin ekran görüntüsü ölçeği bozuk çıkabiliyor. Batur'a gösterilecek görüntüler için Playwright betiği (Python, `tests/browser_smoke.py`'deki Chrome bulucu) yerel `http://localhost:3001`'e karşı 375×812, DPR 2 ile çeker. Ekibi `fetch('/api/groups', …)` ile geçici kur. Betikleri scratchpad'e yaz; görüntüyü `SendUserFile` ile gönder.

**Güvenlik (değişmez):** `ADMIN_KEY`'i (`kutup/data/batur-key-canli.txt`) asla ekrana ya da sohbete yazma, betikte dosyadan oku. Gerçek üyeleri ve verilerini koru. `main` dalına dokunma. `kutup/data/` commit'lenmez. Canlı D1'e doğrudan yazma; yalnızca API ve owner uçlarını kullan. Göçten önce yedek al (betik aşağıda). Canlı `ADMIN_KEY`'i ve davetleri değiştirme.

**Bu dönemde gelenler (hepsi canlı):**
- **Tuğla ekonomisi** (`shared/catalog.js`, göç 14–18):
  - Katalogdan bina seçilir; malzeme başta, ücret bitişte ödenir. Sınıflar: küçük 25, orta 50, büyük 75 dk (en az 25). Serbest mod yarım ücret.
  - Yarım kalan iş: %50 hemen, %30 enkaz toplanınca (3 gün), %20 zarar. İlk 2 dk vazgeçmek bedava (çay molası kullanılmadıysa).
  - Bonuslar: günlük bonus; seri (2. seans +%10, 3. ve sonrası +%20, ara en fazla 10.5 dk); imece (arkadaş başına +%5, kahvehane ile +%8, en fazla +%20); atölye etkileri (fırın, sahaf, değirmen, kütüphane).
  - Nadir yapılar ve planlar (her 25 dk %5; 500 dk plansız emekte garanti; 7/14/30 günlük seri ayrıca), haftalık yapılar (`since`, açık dönemde bitirince kalıcı plan), kurucu gözlemevi.
  - Defter `bricks_log` (`sessionRef = memberId:focusEnd`); makbuz kartı ve katalog `src/Economy.jsx`.
- **Haftalık:** Haftanın Ustası (👑, 50 🧱) ve ortak anıt (hedef max(600, 250 × üye) dk, 50 🧱). `weekly` tablosu; `crownMaster` snapshot'ta tembel tetiklenir.
- **İstatistikler:** `server/stats.js` + `src/Stats.jsx`. Gün serisinde haftada bir gün dondurma var.
- **Diğer:** bina taşıma (`/buildings/:id/spots|move`), `/batur`'da 🧱 hediye ve üye başına push sayısı.
- **İnşaat modunda cihaz kuralı:** bilgisayarda sekme ve uygulama değiştirmek serbest. Telefonda 60 sn tolerans; çıkarken ve 30. saniyede bildirim. Wake Lock'a ek olarak canvas video yedeği var (`ui.jsx keepScreenOn`); gerçek iPhone'da doğrulanmadı.
- **Ses motoru** `src/Sound.jsx`: yağmur, kütüphane, şömine, orman, dalga, kafe, kahverengi gürültü, kara delik; tek ortak mikser.
- **Odak ekranı** `src/FocusScreen.jsx`: tam ekran, flip saat (geri sayım / ileri sayım / saat), sahne gizli / yan / tam, yakınlaştırma, kenardan kenara gökyüzü. iOS'ta tam ekran düğmesi gizli.
- **Gün ışığı ve mevsimler:** `villageWorld.js skyAt()` → `{night, warm, lamps, season, key}`. Kışın kar, ilkbaharda çiçek; 5 günden uzun arada evleri sarmaşık sarar.
- **Beraber çalışma** (göç 19–20, `src/Together.jsx`):
  - Ekip ritmi 50+10 / 25+5, saate hizalı (`POST /rhythm`; `tick` sınırları duyurur).
  - Çay molası: seans başına bir kez; 40 dk ve üstü 5 dk, 70 dk ve üstü 10 dk.
  - "📣 Ekibi çağır" daveti, masa arkadaşları, panoda "birlikte çalıştı" satırı.
  - Kişiye özel kahve çağrısı ve hazır cevaplar (`CallOverlay`).
  - Pano okunma takibi (`board_seen`, `/seen`, "görüldü"), okunmamış rozeti, uygulama içi mesaj şeridi.
  - iOS ana ekran rehberi (`SetupCard`).
- **Kurucu:** ✳'e 1.2 sn basılı tutmak kapıyı açar. Dev rozetli hesapta "✳ Komuta merkezi" bağlantısı ve kurucu avatarları var.

**n15 Karanlık tema — 15 Ekim 2026 gecesi, canlı (Worker `d63c7b00`):**
- "Benim köşem"de Gündüz mü, gece mi? → Otomatik / Açık / Koyu. Otomatik, Ankara gün batımında koyulaşır, gün doğumunda açılır (`darkAt` + `sunTimes`, `villageWorld.js`). Seçim cihazda (`localStorage kutup-mode`).
- `public/mode.js` ilk boyamadan önce `html[data-mode]`, `data-theme` ve `theme-color`'ı ayarlar (CSP satır içi betiğe izin vermediği için ayrı dosya). `src/colorMode.js` açık kalan uygulamada dakikada bir kontrol eder; geçişte View Transition ile yumuşak geçiş.
- **Renkler:** `scripts/dark-css.js` PostCSS eklentisi (vite.config'te) her sabit renkli kuralın hemen arkasına `:where(html[data-mode="dark"]) .x {…}` ikizini yazar: açık yüzey → koyu, koyu yazı → açık; canlı renkler, yarı saydamlar ve zaten koyu bileşenler (koyu arka planlı kural ve altındakiler) dokunulmaz. `:where` özgüllük eklemez, kaskad bozulmaz. Bir kuralı hariç tutmak için içine `/* dark: keep */` yaz. `focusscreen.css` ve `blackhole.css` atlanır. Elle ayarlanan jetonlar (`--paper`, `--ink`, tema vurguları, üye renkleri) ve istisnalar `src/dark.css`'te.
- Testler: 90 birim + 31 tarayıcı (tarayıcı testi açık moda sabitlenir, ayrıca koyu kontrolü var), canlı duman testinde koyu mod adımı.

**n13 Özgün avatarlar — 16 Ekim 2026 gecesi, canlı (Worker `67123d50`):**
- **Stil kararı (Batur):** İlk deneme (kalın çizgili, çıkartma kenarlı, canlı renkli genel hayvanlar) "siteyle alakası yok" diye reddedildi. Onaylanan dil **Kara'nın çizim dili**: koyu `#25242d` kontur, sakin renkler, ana renk + bir ton açık yüz, kehribar gözler, yanak kızarıklığı ve çıkartma kenarı YOK. Kadro sitenin dünyasından.
- **Kadro (`shared/avatars.js`, 23 + kurucu):** 8 kedi (Kara'nın kafa çizgileri ölçeklenerek: Ankara, Van, tekir, sarman, smokin, üç renkli, füme, siyam), kütüphane (kütüphaneci, kitap kurdu, uykucu, gece kuşu/kukumav, güvenlik, simitçi, çaycı), köy ve atölyeler (baretli usta, mimar, fırıncı, sahaf, değirmenci, bahçıvan), gökyüzü (astronom, kara delik). Kurucuya özel: ✳ baretli şantiye şefi (`founder: true`).
- **Aksesuarlar:** gözlük (Kara'nın pirinç çerçevesi), kulaklık, bere, kep, atkı (Kara'nın atkısı, lila). Yuva başına bir tane (bere/kep aynı yuva). Kendi şapkası olan (`hat`) bere/kep/kulaklık takamaz, kendi gözlüğü olan (`glasses`) gözlük takamaz.
- **Değer biçimi:** `k:<id>+<aksesuar>…` (ACCESSORIES sırasıyla, ör. `k:tekir+gozluk+atki`). Sunucu `avatarAllowed(value, dev)` ile denetler; bozuk/kurucuya özel değer 🪐 olur. Emojiler aynen geçerli, mevcut üyelerin avatarı değişmedi, göç yok (şema 20).
- **Çizim:** `avatarArt` (satır içi SVG, `ui.jsx Avatar` → `.av-clip > svg.av-art`) ve `avatarImage` (aynı SVG, data URL, köy canvas'ında `villageView.js bubble()` → üye renginde disk + drawImage; yüklenince `request()` ile yeniden çizer). Metin gereken yerde `avatarText` (emoji karşılığı).
- **Seçici (`Account.jsx AvatarPicker`):** Karakterler / Emojiler sekmesi, gruplar (`AVATAR_GROUPS`), aksesuarlar ızgarada canlı denenir; 375px'te 5 sütun, dokunma alanları ≥44px. Yeni katılan rastgele bir karakterle başlar.
- **Testler:** 93 birim (tüm karakter × aksesuar çizimi temiz), 35 tarayıcı (+4: yeni profil karakterle başlar, seçici 44px/taşma yok, karakter+aksesuar kaydı, koyu modda çizim), canlı duman testinde avatar adımı.
- **Doğrulanmadı:** köy canvas'ındaki balon/yürüyen avatarı ekran görüntüsüyle bakılmadı (kod yolu basit, JS hatası yok); gerçek iPhone'da bakılmadı.

**n16 Sağ üstte tema düğmesi — 16 Ekim 2026 sabahı, canlı (commit `16e35609`, Worker `10274f0c`):**
- Üst çubukta çanın solunda `ModeButton` (`Account.jsx`, `App.jsx` topbar). O anki seçimi lucide çizgi simgesiyle gösterir: Sun / Moon / SunMoon (Otomatik). **Batur A/B ön izlemesinde emoji yerine çizgi simgeyi seçti.**
- Dokununca `role="menu"` mini menü açılır: başlık "Gündüz mü, gece mi?" ve üç `menuitemradio`. Her birinin kısa açıklaması var (`modeNote`); Otomatik'te bugünün gün batımı ve gün doğumu saati yazar. Seçilen satır vurgu renginde ve tikli. Ayar Benim köşem'dekiyle aynı (`useColorMode` App'te tek durum).
- Seçince, Escape'te, Tab'da ya da dışarı dokununca kapanır. Ok tuşları seçenekler arasında gezer, odak düğmeye döner.
- **Yerleşim:** Düğme çan boyutunda çizilir (760px altında 32, 370px altında 30), `::after` ile en az 44px dokunma alanı var (inset kenarlığın içinden sayılır, bu yüzden −8px). Menü `.topbar-actions`'ın sağ kenarına asılır, genişliği `min(300px, 100vw − 32px)`; 360px'te taşmaz. Stiller `src/dark.css` "the same switch in the top bar" bölümünde, yalnızca jetonlarla.
- Telefonda (580px altı) üst çubuktaki "Bizim alan ›" ön eki (`.crumb-root`) gizlenir, yalnızca sayfa adı kalır; yoksa iki satıra kayıyordu.
- **Testler:** 93 birim, 39 tarayıcı (+4: dokunma alanı, menü yerleşimi, Açık'ı seçmek, kapanma); canlı duman testinde "top-bar look switch ships" adımı.
- **Doğrulanmadı:** gerçek iPhone.

**n17 + n18 aşama 1 — 16 Ekim 2026 öğleden sonra, canlı (commit `c6162645`, Worker `cfa3318b`):** ayrıntı KARARLAR.md `### n17` ve `### n18`.
- Alt menü 4 sekme (Kütüp, Köy, Pano, Ben), ☰ ve üstteki davet düğmesi yok; seçili sekmenin işareti `layoutId="tab-pill"` ile kayar. Masaüstü sol menü aynı 4 sekme.
- Ana sayfa (`Home.jsx`): gökyüzü kartı → "Bugün geliyor musun?" → (bildirim / hesap kartı) → Kim nerede? → Kim ne zaman geliyor? (planlar) → Köy ve Pano kapıları. Ben: profil, görünüm (`LookModal`), istatistik, davet, Batur'a ilet, hesap (`AccountModal`), ayrıl (`leaveTeam`). Kara kartı Köy'de (n06'ya kadar).
- Hareket: Motion 13.5.0 (`LazyMotion` + tembel `motionFeatures.js`, `MotionConfig reducedMotion="user"`). Gökyüzü sahnesi 960 birim genişlik, telefon ortadaki 360'ı görür. Gece = `skyAt().night` ya da koyu mod. Gelen kişi: kart dönüşü (WAAPI), "GELDİ" damgası, patikada yürüyen figür (SMIL `animateMotion`), üstte haber (`notify`).
- Ana paket 182 KB gzip (canlıdan +21 KB) + 28 KB tembel Motion parçası.
- **Doğrulanmadı:** gerçek iPhone'da akıcılık ve pil.

**n18-2 notları:** Saat (`now`) artık her saniye değil: `fastClock` (Köy sekmesi, odak ekranı, çalışan sayaç, ritim) iken 1 sn, yoksa 15 sn. Saniye gösteren yeni bir şey eklersen `fastClock`'a koşulunu ekle. Gökyüzüne yeni hareketli parça eklerken SVG'nin içine değil `sky-scene` üstüne ayrı katman olarak ekle (DESIGN.md §7). Performans ölçümü: Playwright + CDP `Emulation.setCPUThrottlingRate` 4, yerel üretim sunucusu (`node server/index.js`, `--dev` olmadan). Hareket ayarı `src/motionPref.js` ve `public/mode.js`.

**n06 Kara bitti (16 Ekim akşamı, 901347b4, Worker 7c65ff28):** sevimli bir kara delik; çatıda yaşar, haberci, odak arkadaşı. Notlar:
- Rig `src/Kara.jsx`: `KaraRig` (çizim; poz `data-pose`, küçük an `data-act`, `data-blink`, `data-wink`), `KaraSpot` (balon, dokunuş, basılı tutma, rastgele an ve göz kırpma zamanlayıcısı, fareyle göz takibi), `KaraHome` (çatı; ekip durumundan poz, haberci), `KaraBuddy` (odak kartı; okuma, baret, bitti/çöktü).
- Hareket kuralı: sürekli CSS döngüsü ekleme; SVG içindeki her döngü telefonda ana iş parçacığında her kare çalışır (ölçüldü: %62 → %81). Yeni hareket = `ACTS`/`LASTS`'a bir an + `kara.css`'te `[data-act]` kuralı.
- SVG içinde CSS transform'larında `px` = çizim birimi. Kara'nın göz kapağında clipPath kullanma (Chrome hareket eden öğede maskeyi yanlış konumluyor); kapak, `transform-box: fill-box` ile üstten ölçeklenen daire.
- Ana sekmede geliş bildirimi ve mesaj bannerı gösterilmez; haberi Kara verir.

**n26 Köy 2.0 bitti (16 Ekim gecesi, Worker edee3e53):** odak stüdyosu + yaşayan harita. Notlar:
- Köy haritası iki katman: `villageView.js` asıl haritayı yalnız kamera değişince çizer, hareket edenleri üstteki `canvas.village-live` katmanında ~24 fps çizer. Yeni canlı şey eklerken `drawLive` içinde `alive` bayrağını yalnız gerçekten görünürken kaldır.
- Hareket ayarı haritada her karede okunur (`motionLevel`).

**Bulutla çalışma düzeni (Batur, 16 Ekim):** "cloud sessiona yaptıralım işleri, sen sadece yayınla".
- İşleri bulut oturumları yapar: `origin/kutup-platform`'dan kendi dalını açar (`claude/...`), test eder, `kutup-platform`'a PR açar.
- Yayın bulutta olmaz (Cloudflare girişi yok); canlı veriye ve `kutup/data/`'ya dokunulmaz.
- Bu oturum PR'ı inceler, `git merge --ff-only` ile birleştirir, testleri yerelde de koşar, yayınlar, canlı duman testini çalıştırır ve kayıtları yazar.
- Bulut bitince haber gelmez; Batur "PR hazır" der.
- İki bulut oturumu aynı dosyalara aynı anda dokunmaz.

**Kara'nın yeni çizimi ChatGPT'de (16 Ekim gecesi):**
- ChatGPT, mevcut `Kara.jsx` ve `kara.css`'in üstüne çizimi yenileyen bir sürüm üretti: tombul, tüylü kedi, aynı arayüz. Çıktılar `C:\Users\İzzettin\.codex\.chatgpt-projects\...\output\kara\selected-design` klasöründe; bir sonraki tur aynı yere gelecek.
- Batur kediyi beğendi; daha akıcı ve ayrıntılı animasyon, 2,5B his, easter egg'ler, aksesuar düzeltmeleri ve "sitede nasıl durur" görüntüleri istedi.
- Sonuç gelince: dosyaları incele, bizim son `Kara.jsx` ve `kara.css` ile farkına bak, yavaş telefonda ölç, Batur'a sitede görüntü göster, yerleştir.

**n27 Vitrin ve cila bitti (16 Ekim gecesi, Worker f76db6c3, PR #2):** Gökyüzü girişi, gizli davet, sahte basılabilir avı, iPhone rehberi, çizimli boş durumlar. Notlar:
- Giriş `src/Entry.jsx`; boş ve yükleniyor çizimleri `src/Illustrations.jsx`; küçük düzeltmeler `src/polish.css`.
- Kara yerleşince bağlanacak açık iş: "ders arası hayat" pulu dokununca Kara'nın bir cümle söylemesi.
- GitHub'daki Vercel işareti kırmızı: depo kökündeki eski site, commit'lenmiş `node_modules` yüzünden derlenmiyor. Kütüp'ü etkilemiyor; Batur isterse o Vercel projesi kapatılabilir.

**n23 Tema revizyonu bitti (17 Ekim, Worker da4c894e, PR #3):** altı kapsamlı paket.
- Tema jetonları `src/themes.css`'te, eski kimlikler `THEME_MOVED` ile eşleniyor.
- Yeni CSS'te renk sabitlemek yerine jeton kullan; `scripts/theme-css.js` sabit nötrleri derlemede temaya bağlıyor, `scripts/theme-check.mjs` kontrastı denetliyor.

**n25 Hesaplar arası geçiş bitti (17 Ekim, Worker 812f7ef9, PR #4, göç 21):** Bir cihaz 5 hesaba kadar tutuyor, Hesaplarım'dan tek dokunuşla geçiliyor. Notlar:
- Açık hesap `kutup_session`'da, diğerleri `kutup_accounts` çerezinde (HttpOnly, `/api`). Sunucu her istekte geçerliliği denetliyor (`deviceAccounts`).
- Bildirim aboneliği `(endpoint, member_id)` anahtarlı. Birden fazla hesaplı telefonda başlıkta ekip adı var; tıklayınca `?as=<üye>` ile o hesap açılıyor.
- Hesap değiştirince `App` baştan kuruluyor (`KutupApp`, `restart`); hesap başına durum tutan yeni bir şey eklerken bunu bozma. Zilin kapalı bilgisi `kutup-push-off:<üye>`.
- Gerçek telefonda iki hesaplı bildirim denenmedi; Batur denesin.

**d22 Ana sayfa hata avı (17 Ekim, Worker d2761763):** Batur'un ekran görüntüsündeki 6 hata düzeldi. Notlar:
- Düğme olan kartlara (`<button>`) zemin, köşe ve iç boşluk ver; yoksa tarayıcının gri düğmesi görünür.
- Yeni bileşende sınıf adı seçmeden önce `grep` ile çakışma ara (`.mode-switch` hem üst çubukta hem Köy stüdyosundaydı; stüdyonunki `.studio-mode`).
- Kişi kartları sütun halinde (`display: flex`), yan yana kartlar hizalı. Ay ve güneşin üst konumu `--orb-y` değişkeninde; ana sayfa onu görünür alana çekiyor.
- Pencere fareyle kapanınca odak dönen düğmede halka yok (`quiet-focus`, `Modal.jsx`).

**Bulut kredisi (17 Ekim gecesi):** n25'ten sonra ~13 dolar kaldı (iş başına ~20–25 dolar, n25 ~6 dolar tuttu). Yeni paket için yetmez; küçük düzeltme mesajları için yedek. Krediler 5 Kasım'da sona eriyor. Görsel ve onaya bağlı işler (Kara'nın yerleşmesi, n24, n28), Batur'un haftalık limiti perşembe sıfırlanınca yerelde yapılacak.

**Sıradaki işler (Batur'un onayladığı plan; ayrıntılı tanımlar panoda):**
1. **Kara v2'nin yerleşmesi:** ChatGPT paketi (`.codex` klasöründe, KUTUP_DEVIR.md'de yolu var); incele, ölç, Batur'a sitede görüntülerle onaylat.
2. **n24 Ses turu:** daha gerçekçi, kaliteli sesler; önce eski/yeni dinletilir.
3. **n28 Haftalık hikâye (Kütüp Wrapped):** Pazar akşamı hikâye, paylaşılabilir; n27'deki okuyucu kartı fikri paylaşım kartı için aday.
4. **n29 Anında ve hızlı:** Durable Objects + WebSocket, App.jsx'i bölmek, tembel yükleme, cihazda saklama.
5. **n30 Masa haritası:** ikinci üste yapıldı (PR); gerçek salon krokisi hâlâ Batur'dan bekleniyor.
6. **n14 Başarımlar:** ikinci üste yapıldı (PR); liste ve eşikler KARARLAR n14'te.

**Bilinen açıklar:**
- Wake Lock video yedeği gerçek telefonda denenmedi.
- Kendiliğinden biten çay molasından sonra maliyet satırının ref'i makbuzla eşleşmiyor.
- Mola, seans bitişini ritimden kaydırıyor.
- IdleDetector kullanılmıyor.
- Zeynep'in push aboneliği yok; uygulamayı ana ekrana ekleyip oradan açması lazım.
- Sıla'nın ekran kilitlenince çöken inşaatı için Batur `/batur`'dan 🧱 verebilir.

**Yeni tuzaklar:**
- Git Bash heredoc'larında backtick ve tırnak bozuluyor. Yama betiklerini Write ile scratchpad'e yaz ve `node` ile çalıştır. CRLF dosyalarda `split("\r\n")` kullan; değiştirmeyi sayım kontrollü yap.
- Sunucu kodu değişince önizlemeyi `preview_stop` + `preview_start` ile yeniden başlat; yoksa eski kod çalışır.
- Test paketi yazma hız sınırına takılıyordu: test kancaları açıkken sınır 400/dk, `/__test/` çağrıları muaf.
- Canlı duman testi yayından hemen sonra eski şemayı görebilir; `/health` ile yeniden dener.
- Görsel kontrol için `tests/visual-harness.html` kullan; modülleri `performance.getEntriesByType('resource')` URL'leriyle içe aktar.
- ODTÜ ağında deploy/push DNS hatası verebilir; Batur bağlantıyı düzeltince tekrar dene.

**Yedek betiği** (scratchpad oturuma özel; yoksa `backup.mjs` olarak yeniden oluştur, `node backup.mjs "C:/Users/İzzettin/bilim-dunyasi/kutup-platform/kutup/data"` ile çalıştır):

```js
import { readFileSync, writeFileSync } from "node:fs";
const dir = process.argv[2];
const base = "https://kutup.ahmetbaturkaplanoglu.workers.dev";
const key = readFileSync(`${dir}/batur-key-canli.txt`, "utf8").trim();
const res = await fetch(`${base}/api/owner/backup`, { headers: { "x-owner-key": key, "x-kutup": "1" } });
const text = await res.text();
if (!res.ok) { console.log("backup failed", res.status, text.slice(0, 200)); process.exit(1); }
const data = JSON.parse(text);
const file = `${dir}/backup-before-astra-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(file, text, { mode: 0o600 });
console.log("saved", file.split("/").pop(), "bytes", text.length, "schema", data.schema);
```

## 8. Başlarken ilk adımlar

1. `C:\Users\İzzettin\bilim-dunyasi\kutup-platform` içinde `git status` ve `git pull`; dalın `kutup-platform` olduğunu doğrula.
2. `kutup/` içinde `npm ci` ve `npm run test:all` (87 test yeşil olmalı) ve `npm run test:browser` (30 kontrol).
3. Batur onay vermeden başlama. Onay gelince panodaki sıradaki işe (en düşük `order`'lı `next`) geç, işi `doing` yap. Tanımı eksikse önce Batur'a sor.
4. Her paketten sonra: `npm run test:all` → `npm run deploy` → canlı duman testi (geçici veriyi sil) → commit ve push → Batur'a kısa özet.
5. Kalite çıtası: telefonda akıcı ve okunaklı, mevcut sıcak kâğıt-lila tasarım diliyle uyumlu; her şey Türkçe ve samimi. Görsel ayrıntı Batur için çok önemli; aceleye getirme, ama her paketi canlıya almadan sonrakine geçme.
