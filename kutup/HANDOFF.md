

## 0. Çalışma sistemi (16 Ekim 2026)

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
- Planlar (iki hafta ileri, "Ben de gelirim"), pano (mesaj, kalp, kahve daveti), haftalık odak tablosu.
- **İnşaat modu ve köy (Forest tarzı):** Odak seansları 25/50/75 dk. İnşaat modu açıkken seans süresi binayı belirler: 25 → kulübe, 50 → iki katlı ev, 75 → kule (eşikler 40 ve 70 dk). Seans boyunca canlı izometrik şantiye çizilir. Uygulamadan 10 saniyeden uzun çıkılırsa (sekme kapatma dahil) bina çöker; tamamlanınca köye kalıcı olarak eklenir. Ekran Wake Lock ile açık tutulur. Tek ortak köyde herkesin kendi mahallesi var; Paket 1 tamamlandı.
- **"Batur'a ilet":** fikir, hata ya da sohbet. Kargo takibi gibi aşamaları var: new → seen → accepted → building → done, ya da declined. Kendine ait ilham örnekleri, gönderme animasyonu, "yeni gelişme" rozeti ve her aşamada gönderene push.
- **`/batur` yönetici paneli:** istekler (açınca "İncelendi" olur, tek tuşla aşama, not, geçmiş, arkadaşın gördüğü takip çizgisinin önizlemesi, silme), yeni istek push'u, ekipler, davet yenileme, üye çıkarma. Giriş: `ADMIN_KEY` ya da ilk ziyarette belirlenen anahtar; sonra 30 günlük `kutup_owner` çerezi (yolu `/api/owner`, SameSite=Strict). Yönetici şu an hiçbir üyeye bağlı değil. Sağ üstteki "Uygulamaya dön" düğmesi ana uygulamaya götürür.
- Hareket katmanı: başlıklar Bricolage Grotesque, gövde DM Sans. Ziyaret başına bir kez oynayan açılış koreografisi. Diğer hareketler sadece bir eyleme cevap verir. `prefers-reduced-motion` destekleniyor.

## 3. Mimari

```
kutup/
  server/app.js     Tüm API: Fetch Request/Response + async DB adaptörü (all/get/run/read/batch). Node ve Worker'da aynı kod.
  server/schema.js  Sürümlü göçler (`export const migrations`, şu an 20). Yayınlanmış göçü ASLA değiştirme; yenisini sona ekle.
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
- **İnşaat modu sütunları:** `members.focus_strict / focus_beat / focus_seed`.
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
npm run test:all     # hepsi (93 test) — her teslimden önce yeşil olmalı
npm run deploy       # vite build + wrangler deploy (canlı)
npm run test:browser # gerçek tarayıcı, 39 kontrol (pip install playwright; Chrome/Edge kendiliğinden bulunur)
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

## 6b. Durum (son güncelleme 16 Ekim 2026)

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
  - Nadir yapılar ve planlar (blueprint: %10 şans ve 7/14/30 seri), haftalık yapılar (`since`), kurucu gözlemevi.
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
5. **n30 Masa haritası:** salon krokisi Batur'dan alınacak (tanım eksik).
6. **n14 Başarımlar:** liste ve eşikler Batur'a sorulacak (tanım eksik).

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
