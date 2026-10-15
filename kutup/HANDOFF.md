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
  server/schema.js  Sürümlü göçler (`export const migrations`, şu an 12). Yayınlanmış göçü ASLA değiştirme; yenisini sona ekle.
                    D1 yüzünden her eleman TEK SQL ifadesi olmalı.
  server/push.js    Web Push (Web Crypto)
  server/sqlite.js  node:sqlite adaptörü
  server/index.js   Node sunucusu: SSE canlı akış, statik dosyalar, --dev ile Vite
  worker/index.js   Cloudflare Worker: D1 adaptörü (binding DB), ASSETS; canlılık 5 sn'lik yoklama
  shared/requests.js İstek aşamaları ve metinleri (sunucu + arayüz ortak)
  src/App.jsx       Ana uygulama (sekmeler: home, plans, focus, board, feedback), modallar, FocusCard, MemberCard, WeekBoard...
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
npm run test:all     # hepsi (68 test) — her teslimden önce yeşil olmalı
npm run deploy       # vite build + wrangler deploy (canlı)
npm run test:browser # gerçek tarayıcı, 18 kontrol (pip install playwright; Chrome/Edge kendiliğinden bulunur)
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
- **Mobil öncelikli:** 375px'te yatay taşma olmamalı. Alt menüde 5 öğe var.
- **Animasyon kuralı:** tek bir orkestra edilmiş açılış ve eyleme cevap veren hareketler. Kendi `transform`'u olan öğelerde yalnızca `from` tanımlı keyframe ve `animation-fill-mode: backwards` kullan. İnşaat sahnesi tek rAF döngüsünde 30 fps; ekran 75 dk açık kaldığı için pil bütçesine dikkat.
- **Sayfa yenileme "uygulamadan çıkma" sayılmamalı.** 3 sn'lik yerel işaret bu yüzden var.
- **Tarayıcı paneli ekran görüntüleri** bazen yanlış ölçekleniyor. Önce JS ile DOM ve taşma kontrolü yap, görsel için `zoom` kullan.
- **Git:** commit mesajları İngilizce, sonunda `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `kutup-platform` dalına push et, `main`'e dokunma. `kutup/data/` Git'e girmez.

## 6. Onaylanmış kararlar

1. **Köy:** Tek ortak "Kütüp köyü", içinde herkesin isim tabelalı mahallesi. Uzun vadede sorunsuz büyümesi için Paket 1'deki altyapı planına uy.
2. **Kara delik:** Batur'un gizli kapısı ve `/batur` panelinde istekleri yutan çöp. Ayrıca Batur'un herkesin göreceği "geliştirici" eşyası (bkz. Paket 3).
3. **Yapay zekâ yok.** Onun yerine özenle tasarlanmış bir maskot: **Mürekkep** (bkz. Paket 2). Mesajları hazır şablonlardan gelir.
4. **Mini oyunlar** sadece molada açılır (durum "Molada" ya da seans yeni bitmiş). İnşaat sırasında kapalıdır.
5. **İnşaat ve köy görselleri** inşaat mühendisi gözüyle ayrıntılandırılacak (bkz. Paket 5 ve 6).

## 6b. Durum (son güncelleme 14 Ekim 2026)

### Öncelikli devir: Kara yön değişikliği ve duraklama — 15 Ekim 2026

**Batur'un son talimatı: Şimdilik uygulama; isteği HANDOFF'a yaz ve işi duraklat. Krediler yenilenene kadar Claude ile deneme yapacak.** Bu kayıt bir uygulama/yayın onayı değildir. Bu devirde yalnız belge güncellendi; canlı site değiştirilmedi.

- Batur mevcut maskottan henüz tatmin değil. Sorun yalnız atkı çizimi veya animasyon kalitesi değil: kart içinde duran, poz düğmeleriyle yönetilen karakter istediği deneyim olmayabilir. Batur'un en güçlü tercihi: **“canlı yaşaması en çok etkiliyor bence, diğerleri de olmalı.”** Sevimli, gruba ait bir karakter ve şaşırtıcı etkileşimler de istiyor; öncelik sitede kendi hayatı olan bir canlı hissi.
- **Korunacak kimlik:** Adı Kara. Kara deliği anımsatan ama gerçek hayatta olabilecek doğal kedi fenotipi; siyah/füme tüyler ve kehribar gözler. Fantastik galaksi desenleri veya doğa dışı gözler istenmiyor. Statik resim/GIF yerine kodla yaşayan karakter beklentisi sürüyor.
- **Önerilen, henüz onaylanmamış ilk deney:** Kartı ve “Selam / Kitap / Şekerleme” düğmelerini kaldırmak; Kara'ya içerikleri ve mobil gezinmeyi kapatmayan bir ekran kenarı/köşe vermek. Etrafı izleme → yerleşme → uyuklama → dokununca uyanma davranışını doğal geçişlerle kurmak. Rahatsız ederse kolayca kenara çekilebilmeli. Bu fikir henüz uygulanmadı.
- Deneyimin amacı sürekli gösteri veya sürekli kullanıcıya bakan bir animasyon değil; kendi hâlinde bekleme, dinlenme ve anlamlı, ölçülü tepkiler. Örnek fikir: ilk dokunuşta tek gözünü açmak, tekrarında kullanıcıya dönmek; kullanıcı odaklanırken sakinleşmek. Bunlar tasarım örnekleri, kesinleşmiş gereksinim listesi değil.
- Sitede dolaşma ve nesnelerle oynama daha sonraki olası adımlar olarak konuşuldu; henüz onay yok. Önce küçük bir deneyle “orada bir canlı var” hissi değerlendirilmeli. Mevcut çizim/iskelet kullanılabilir ama sırf önceki emek nedeniyle aynı tasarıma bağlı kalınmamalı.
- **Claude için mevcut durum:** Kaynak `astra/gorevler`; son uygulama commit'i `4c35d95e`, son canlı Worker sürümü `fce5c608-7e05-40fb-bba6-0b71b267fd92`. `LiveMascot.jsx` SVG/tepki mantığı, `Mascot.jsx` kart/poz yönetimi, `mascot.css` çizim hareketleri, `App.jsx` yerleşim. Son doğrulama 78 test + 30 tarayıcı kontrolü. Önce güncel dalları ve canlı sürümü kontrol et; başka çalışmaları veya 1A bildirim kuyruğunu geri alma.
- Batur düşük kredi tüketimi, küçük somut adımlar ve her yeni adım için kısa plan/onay döngüsü istiyor. Bu noktada Astra işi duraklattı; yeni uygulama başlatmıyor. Claude devam ederken Batur ile deneyin kapsamını netleştirmeli.

- **Kara kalite revizyonu canlı:** `4c35d95e`, Worker `fce5c608-7e05-40fb-bba6-0b71b267fd92`. Atkı düğüm/iki kumaş ucu/kat/püskül ile yeniden çizildi; doğal duraklama, gecikmeli kumaş hareketi, sakin mırlama, hızlı göz kırpma ve pozuna dönen selam eklendi. 78 test + 30 tarayıcı kontrolü, canlı sağlık ve derleme hash kontrolü geçti. Ayrıntı ASTRA_RAPOR_2.md sonunda.

- **Kara canlı — 15 Ekim 2026:** Batur statik görseli istemedi; adını Kara olarak değiştirdi, doğal kara kedi/kehribar göz fenotipini onayladı. `ca7c9ff9` ile bitmap kaldırıldı, parçalı SVG rig + bakış/kafa takibi, göz kırpma, kuyruk/kulak/atkı, dokunma/pati, uzun basma/mırlama, tekrar dokunma/ters bakış, kitap/uyku/uyanma eklendi. Gerçek odak durumunda kitap okur; 45 sn kendi hâlinde kalınca uyur. Tema ve azaltılmış hareket destekli; ekran dışında animasyonlar durur. `bc5f02d3` Claude inşaat güncellemesi aynen alındı. 78 test + 30 tarayıcı kontrolü geçti. Worker `383c3a7c-3946-4d42-9bf8-a084a54d3a0e`; canlı JS/CSS yerel testli derlemeyle aynı. Sonraki yayın için `astra/gorevler` dalını dahil et. Önceki Mürekkep/WebP notu tarihsel, artık geçerli tasarım değil.


- **Astra 2. tur — 15 Ekim 2026, canlı:** Batur'un doğrudan yayın onayıyla 1A kalıcı bildirim kuyruğu (`35ba3adb`, göç 13) ve küçük Mürekkep tanışma kartı (`82b44941`) yayınlandı. Son Worker sürümü `2bcaa74b-fe63-4e14-beef-25541ef97f8f`. 78 test, 18 mevcut tarayıcı kontrolü ve 6 maskot kontrolü geçti; canlı sağlık/görsel/JS, şema 13, cron ve test hook kapalılığı doğrulandı. **Kod `astra/gorevler` dalında; sonraki platform yayını öncesi bu dalı birleştir, eski kodla geri alma.** Korunan köy/şantiye dosyaları değişmedi. Mürekkep şimdilik sabit mor atkılı WebP + etkileşimli kart; tam SVG/poz/rozet sistemi değil. 1B ve diğer görevler bekliyor. Ayrıntılar: [ASTRA_RAPOR_2.md](ASTRA_RAPOR_2.md).

### Astra denetimi (14 Ekim 2026)

**Yayında (14 Ekim 2026; Claude inceledi ve yayınladı, aşağıdaki son maddeye bak).** Ayrıntılar ve commit listesi [ASTRA_RAPOR.md](ASTRA_RAPOR.md), kurtarma prosedürü [RECOVERY.md](RECOVERY.md). `npm run test:all`: **63/63**, gerçek Chromium: **18/18**, `npm audit`: **0** bildirilen açık. `audit/2026-10-14/` sentetik verili ekran görüntülerini ve ölçümü içerir. Canlı arkadaş grubuna ve `data/` dosyalarına dokunulmadı.

- **Göç 8:** ortak `auth_limits`; normal/owner push abonelikleri oturumla bağlı; owner aboneliğinde `key_hash`; oturum süre indeksleri. Eski abonelikler ilk doğrulanmış ziyarette tekrar bağlanır; sunucu anonim eski kayıtlara bildirim göndermez. Parola kurtarma eski cihazları kapatır; normal cihaz aktarımı ilk cihazı açık tutar. Yönetici tüm cihazlardan çıkış, push ve verilmiş kodları da iptal eder. Node SSE her gönderimde oturumu doğrular.
- **Göç 9:** `write_guard` ve `snapshot_changed` CHECK koşulu; okuma/planlama sırasında değişen ekip veya istek olduğunda batch tamamen geri alınır ve güncel veriyle denenir. Bunu kaldırma; aynı boş arsayı kapma, aynı adlı katılma/profil, paralel odak başlatma ve gecikmiş “görüldü” yarışları için gereklidir. Göç 1–7 değişmedi.
- **Göç 10:** geliş ve mola için ayrı kalıcı bildirim zamanları; `here → break → here` döngüsü 45 dakika sınırını aşamaz. Eşzamanlı durum değişikliği revision korumasına alındı; çift bildirim/pano hareketi üretmez. Eski son bildirim zamanı korunur.
- **Senkron:** geç tamamlanan binanın `created` değeri bitiş zamanı, `touched` değeri eklenme zamanı. İstemci düşük revision’lı yanıtı kabul etmez; köy ağ hatasını yeniden dener. Süresi dolan durum grup revision’ını değiştirir. Enkaz istemcide zamanı gelince kaldırılır.
- **Arayüz:** hesap/profil akışları `src/Account.jsx`, ortak pencereler `src/Modal.jsx` içinde. Modal arka planı `inert`, odağı hapseder/geri verir; giriş sekmeleri ok tuşlarıyla çalışır. Batur kodu prompt yerine kopyalanabilir pencere. Haritada sayfalı bina seçimi ve Enter desteği var. Küçük yazıların ana muted rengi koyulaştırıldı.
- **Çizim:** görünen karolar 40’lık önbelleğe sığacak ölçek seçer; son çizilen karo ekrana aktarılır. Hareket azaltmada çökme anında enkaz görünür. 1.000 bina/122 mahalle Chromium’da doğrulandı; uzakta tek kişi adı, yakında mahalle tabelaları korunur. Saklı koordinatlar değişmedi.
- **Araçlar:** `npm run test:browser` Python Playwright + Chromium ister; tüm verisi geçicidir. Vite HMR artık Node HTTP portunu paylaşır. Bulut `start_skill` taslağı güncellendi; bu site yayını değildir.
- **Claude incelemesi ve yayın (14 Ekim 2026):**
  - **İnceleme:** göç 1–7 aynen duruyor, 8–10 sona eklenmiş, her eleman tek SQL ifadesi. `main` dalına dokunulmamış, sır commit'lenmemiş (yalnızca test şifreleri var). `write_guard`, `INSERT OR REPLACE` ile de CHECK ihlalinde ABORT eder (SQLite kuralı); D1 batch'i tek işlem olduğu için hepsi geri alınır. `auth_limits` yalnızca giriş/sıfırlama/kod/yönetici girişinde birincil anahtar upsert'i yapar, bu da D1 okuma bütçesine dokunmaz. Köy, inşaat modu, hesaplar, gizli kapı ve easter egg'ler korunmuş (bileşenler `Account.jsx`'e taşınmış, davranış aynı).
  - **Değiştirdiklerim:** `init()` içinde `layoutVillages()` hatası yine loglanıp geçiliyor. Astra'nın fail-fast hâli, yerleşim hatasında bütün uygulamayı durdururdu. `.coffee-card .eyebrow` 9.5px'ten 10px'e çekildi (eski bir kural). `/batur` paneline sağ üstte "Uygulamaya dön" düğmesi eklendi (Batur istedi). `audit/` PNG'leri çalışma ağacından kaldırıldı ve `.gitignore`'a eklendi; rapor bağlantıları `c7988d81`'e sabitlendi.
  - **Yayın:** önce `/api/owner/backup` JSON'u ve `wrangler d1 export` SQL yedeği alındı (`data/backup-before-astra-*.json`, `data/kutup-before-astra-*.sql`; canlı şema 7, 1 ekip, 4 üye). Ardından deploy yapıldı; canlı D1 şeması 10. 33 adımlı duman testi (`tests/live-smoke.mjs`) geçti: hesapsız ekip reddi, kurma/katılma, push'un oturuma bağlanması, durum senkronu ve `rev` yoklaması, ayrı geliş/mola soğumaları, pano, köy, büyük harfle giriş, tek kullanımlık aktarım kodu (ilk cihaz açık kalır), Batur koduyla kurtarma (3 eski cihaz 401, eski şifre geçersiz), yönetici "tüm cihazlarda çıkış" (oturum ve push silinir), temizlik (geçici ekip silindi, gerçek ekip 4 kişi aynen).
  - **Push geçişi:** yayından sonra üye aboneliklerinin 1/5'i, yönetici aboneliklerinin 1/3'ü bağlıydı. Diğerleri sahibi uygulamayı (ya da `/batur`'u) bir kez açınca kendiliğinden bağlanır, o zamana kadar bildirim almazlar. Arkadaşlara "uygulamayı bir kez aç" demek yeterli.
  - **Açık notlar (14 Ekim akşamı kapatıldı):**
    - Oturum artık kayan: `GET /session`, 30 günden eski oturumun `created` değerini ve çerezini yeniler; yalnızca bir yıl hiç açılmayan cihaz düşer.
    - JSON yedekten geri yükleme aracı eklendi (`server/restore.js`, `scripts/restore-backup.mjs`); gerçek canlı yedekle prova edildi.
    - `npm run test:browser` Windows'ta çalışıyor: Python Playwright kuruldu, betik Chrome/Edge'i kendisi buluyor; 18/18 geçti.

### Bildirim ve senkron sağlamlaştırma (14 Ekim 2026, yayında)

Batur istedi; Telegram gibi yedek kanal istemedi ("elimizden gelenin en iyisi web push ile").
- **Plan/senkron hatası (arkadaşlar "planlarım başkalarında görünmüyor" dedi):**
  - **Kök neden:** Astra'nın yoklama döngüsüne eklediği `inFlight` kilidinde zaman aşımı yoktu. Ağ değişimi ya da arka plana atılan telefon yüzünden takılan tek bir `/api/state` isteği, sayfa yenilenene kadar bütün senkronu durduruyordu.
  - **Düzeltme:** her yoklamanın kendi `AbortController`'ı var ve 15 saniyede kesiliyor (`App.jsx` `refresh`).
  - **Doğrulama:** canlıda gerçek tarayıcı + ikinci kullanıcıyla denendi. İstek bilerek takılı bırakıldı; 15 saniyede kesildi ve öbür kullanıcının planı ekrana düştü. Sunucu tarafı (plan kaydı, `bump`, 2 saatlik görünürlük) zaten doğruydu.
- **Bildirim teslimi:**
  - Göç 11: eski oturumsuz abonelikleri üyenin en son oturumuna bağladı. `init()` boş `key_hash`'li owner aboneliklerini mevcut anahtara bağlar. Yayın sonrası canlıda üye abonelikleri 9/9, owner abonelikleri 3/3 bağlı.
  - Geliş/mola bildirimleri `Urgency: high` ile gidiyor (Android uykudayken gecikmesin); geliş TTL'i 2 saat.
  - Gerçek geliş (`away`/`coming` → `here`) her seferinde bildirim üretir; yalnızca 5 dakikalık tekrar koruması var (`ARRIVAL_REPEAT`). `break` → `here` ve mola bildirimleri 45 dakikalık soğumayı korur.
  - `sw.js`: geliş bildirimi (`payload.sticky`) `requireInteraction` ile ekranda kalır; ayrıca `renotify` ve titreşim deseni var. `pushsubscriptionchange` gelince yeni abonelik kendiliğinden `/api/push`'a kaydedilir.
- **Zil düğmesi (`enableNotifications` → `notificationsOn`/`notificationsOff`):**
  - Çift dokunmaya kilit (`notificationBusy`), çalışırken sallanan zil (`.working`, hareket azaltmada soluk), `aria-pressed`/`aria-busy`.
  - Her adımın kendi süre sınırı ve kendi Türkçe mesajı var: izin reddi/engel (iOS ve Android ayrı tarif), servis çalışanı başlamadı, push servisine ulaşılamadı (Brave notu), sunucu hatası, oturum kapalı. Eski yanıltıcı "HTTPS…" mesajı kaldırıldı.
  - Açınca `POST /api/push {test:true}` yalnızca o cihaza "Bildirimler açık 🔔" deneme bildirimi yollar (üye başına dakikada en fazla 4).
  - Kapatma anında olur: `kutup-push-off` işareti konur, sunucudan silinir; owner bildirimleri açık değilse tarayıcı aboneliği de kaldırılır. Yeniden açılışta kendiliğinden geri açılmaz; işaret varsa ve abonelik duruyorsa silme isteği tekrarlanır.
  - Uygulama görünür olunca zil gerçek durumu yeniden okur (izin ayarlardan alındıysa kapalı gösterir).
  - Canlı Chromium'da uçtan uca doğrulandı: açma → FCM üzerinden deneme bildirimi gösterildi; ikinci kullanıcı "kütüpte" dedi → `requireInteraction`'lı, titreşimli geliş bildirimi anında geldi; kapatma 0,4 sn, yeniden açma 1,5 sn.
- **Testler:** 65/65 (bildirim zili deneme push'u, `urgency`/TTL, 5 dk / 45 dk kuralı, göç 11). `tests/live-smoke.mjs` şema sürümünü koddan okur.
- **Sıradaki bildirim işi (2. katman, isteğe bağlı):** `push_outbox` + Cron Trigger ile 429/5xx/ağ hatalarında yeniden deneme, servis çalışanından `/api/push/ack` teslim makbuzu, `/batur`'da üye başına bildirim sağlığı, geliş bildiriminde "Yoldayım" eylem düğmesi. iPhone'da web push yalnızca ana ekran uygulamasında çalışır; ekranda kalma ve titreşim deseni iOS'ta yok.

### Önceki paketlerin durumu

- **Paket 1 ✅ yayında.** Ortak köy: `shared/village.js` (hex kafes mahalleler, kıvrımlı yollar, Poisson yerleşim, `createPlanner`), göç 6 (`districts`, `buildings.pos_x/pos_y/facing/district_id/likes/touched`, `building_likes`, `members.ruin_*`, `groups.village_rev`), açılışta `layoutVillages()` eski binalara kalıcı konum verir. `/api/village?rev=&after=` artımlı (sadece değişen satırlar), `POST /api/buildings/:id/like`. Çizim: `src/iso.js` (SVG/Canvas ortak primitifler), `src/villageWorld.js` (dünya + gün/gece tonu), `src/villageView.js` (256px karo önbelleği, LOD, pinch/pan, canlı katman), `src/VillageMap.jsx` (`useVillage`, `VillagePanel`, ana sayfa `VillageNow`). Mahalle kapasitesi en fazla 9, pratikte 7–9.
- **Ölçek:** 5 kişi sıkı bir dönemde ~300–1.900 bina. Sıcak yollar sayaçlarla (`districts.buildings`, `buildings.likes`) çalışır, tüm binaları taramaz (D1 ücretsiz 5M satır/gün sınırı).
- **Paket 1.5 sunucu tarafı ✅ yayında (göç 7):** `members.username/pass_hash/reset_hash/reset_until`; `POST /api/account` (oturum açık cihazdan kullanıcı adı + şifre belirle/değiştir), `POST /api/login`, `POST /api/reset` (Batur kodu + yeni şifre, kullanıcı adı yoksa onu da belirler), `/join` ve `/groups` gövdede `username/password` kabul eder, oturum yanıtlarında `username`. `POST /api/owner/members/:id/reset` 24 saatlik kod üretir; bu kod `/transfer/claim`'de ("Zaten ekipteyim" ekranı) de tek seferlik giriş olarak çalışır. `/batur` panelinde üye satırında 🔑 düğmesi ve `@kullanıcıadı` görünür. Kullanıcı adı ı/i farkına duyarsız.
- **Paket 1.5 arayüzün ilk parçası ✅ yayında:** "Zaten hesabım var, giriş yap" penceresinde "Kullanıcı adıyla / Kodla" sekmeleri (`/login`, `/transfer/claim`); Benim köşem → `AccountBox` (kullanıcı adı + şifre belirle/değiştir). Batru (Batur) hesabı için 14 Ekim'de panelden kod üretildi.
- **Paket 1.5 ✅ tamamlandı (14 Ekim):** giriş penceresinde "Giriş / Şifremi unuttum / Kodla" sekmeleri (`/login`, `/reset`, `/transfer/claim`); katılma/kurma formunda kullanıcı adı + şifre zorunlu; hesabı olmayana ana sayfada "Hesabını koru" kartı; "Ekipten ayrıl" adı yazarak onay ister; `/batur` panelinde üye başına cihaz sayısı, odak saati, bina sayısı, 🔑 giriş kodu, ⎋ tüm cihazlarda çıkış (`POST /api/owner/members/:id/signout`) ve "Tüm veriyi yedekle" (`GET /api/owner/backup`, oturum açan sırlar hariç JSON). Aşağıdaki liste geçmiş plan notudur.
- **Paket 3 ✅ yayında (14 Ekim akşamı; köydeki gözlemevi hariç):**
  - **Kapı:** ✳ kombinasyonu (7 dokunuş + basılı tutma ya da "batur" yazmak) `openBlackHole()`'u açar (`src/BlackHole.jsx`, `src/blackhole.css`). Kendi React kökünde çalışır. Kara deliğin ufku, foton halkası, eğik ve dönen toplanma diski (önden geçen yarısı `clip-path` ile), bükülen ışık halkası ve canvas'ta Kepler sarmalıyla düşen kıvılcımları var.
  - **Spagettileşme:** sayfa (`#root`) gerdirilip döndürülerek ve bulanıklaşarak deliğe çekilir.
  - **Kapı mantığı:** `/api/owner/status` `signedIn` ise `/batur`'a geçer. Değilse "Burası Batur'un kara deliği 🕳️" kartı, anahtar alanı (`/owner/login`) ve "Geri dön" (sayfa geri açılır) çıkar. Hareket azaltmada yalnızca solma var.
  - **Gizli rozet:** göç 12 `achievements(member_id, key, created)` tablosunu ekler; `POST /api/achievements` izin listesiyle çalışır (şimdilik yalnızca `black-hole`) ve kapıyı ilk bulana "Kara delik kâşifi" yazar. Ayrılınca silinir, yedeğe ve geri yüklemeye dahildir. Paket 4 bu altyapıya rozet ekleyecek.
  - **Geliştirici eşyası:** göç 12 `members.badge` ekler. `/batur` → Ekipler → üye satırındaki ✦ düğmesi = "bu ekipteki profilim" (`POST /api/owner/members/:id/badge {dev}`, ekip başına bir tane). `badge` durumla herkese gider. `Avatar` bunu her yerde yörüngede dönen mini kara delik ve turuncu çerçeveyle gösterir. Üye kartında "✦ Kurucu · Olay ufku bekçisi" etiketi var, panoda Batur'un mesajlarının yanında ✦.
  - **Panel kara deliği:** sağ altta kara delik durur. İstek içinde "🕳️ Kara deliğe at" (onay ister) ya da bilgisayarda isteği sürükleyip bırakmak: istek deliğe uçar, yutulur, silinir.
  - **Yan düzeltmeler:** `/batur` Ekipler 375px'te taşıyordu (437px); dar ekranda düğmeler alt satıra iner. Üye satırındaki iki bilgi satırı ayrıldı.
  - **Kalan:** köyde Batur'un mahallesinde "Olay Ufku Gözlemevi" (kubbe, üstünde dönen mini kara delik, gece kubbeden ışık). `badge = 'dev'` olan üyenin mahallesine, binalarla çakışmayan sabit bir noktaya çizilecek (`villageWorld.js` / `iso.js`). Bunun dışında Paket 3 bitti.
  - **Batur'un yapması gereken:** `/batur` → Ekipler → kendi satırında ✦'e bas.
- **Paket 4 ön sürümü ✅ (yalnız istemci, rozet yok):** Gizli not (alt bilgideki imzaya uzun bas), Şşşt (tamamı büyük harf pano mesajı), Çay (panoda tam "çay" → 60 sn tüm avatarlarda 🍵, .tea-time), Gece kuşu (03–05 arası açılış, gecede bir uyarı). Kalan: achievements tablosu, n/12 profil, 🦉 avatar kilidi, Mürekkep kutlaması.
- **Plan formu ve salonlar (14 Ekim akşamı, yayında):**
  - Zeynep'in planı sunucuya hiç ulaşmamıştı (kaydı da pano mesajı da yok).
  - Form artık saat değerini her biçimde okuyor ("10:00:00" dahil), "okunamadı" ile "geçti" mesajlarını ayırıyor ve sunucu hatasını formun içinde gösteriyor.
  - Yeni akış: 7 günlük gün çipleri, geçmişi kapalı saat çipleri, "Başka saat", hazır plan adları, canlı özet.
  - Durum penceresinde salon seçimi artık düğmelerle yapılıyor ve yalnızca tayfanın kullandığı salonlar var: 📚 Adnan (Adnan Ötüken Okuma Salonu, varsayılan; “genelde Adnan’dayız aga”), 📖 Müjgan (Dr. Müjgan Cunbur Okuma Salonu), ☕ Kafeterya, 🌳 Bahçe ve Başka…. Batur diğer salonları istemedi.
- **Köy görselleri 1. parça ✅ yayında (14 Ekim akşamı, `villageWorld.js`):**
  - Ağaçlar türlere ayrıldı (`treeKind`, tohumdan): katmanlı taçlı ve sol üstten ışık alan geniş yapraklı, iki tonlu üç katlı karaçam, kavak. Eylül–kasımda geniş yaprakların ~%40'ı, kavakların ~%70'i sonbahar renginde.
  - Mahalle kenarı sert çizgi yerine geniş, yumuşak bant oldu. Her mahallede ot öbekleri ve kır çiçekleri (zemin geçişi 1, tek öğe), kenarda çalılar (bir kısmı çiçekli) ve kayalar var. Hepsi tohumdan üretiliyor; yollara, gölete, tabelaya ve evlere değmiyor.
  - Tabela yeniden yapıldı: iki direk, çerçeveli tahta, açık renk pano, sahibinin renginde şerit, çatı ve çiçek kasası. Yazı eğimi düzeltildi (eskiden tahtanın tersine eğiliyordu).
  - 1.000 binada köyü kurma ~80 → ~110–135 ms (yalnızca veri değişince; gerçek köy küçük).
- **Batur'un istekleri (14 Ekim akşamı) — sıradaki büyük işler, bu sırayla:**
  1. **2. dalga: inşaat animasyonu, mühendislik doğruluğunda (Paket 5'in yerine geçer).** Batur'un ölçütü: "ODTÜ inşaat mühendisliği standardında accurate". Silikleşip hayalet gibi beliren parça olmayacak; her parça gerçekten yerine konur, örülür ya da dökülerek yükselir. Makineler ve işçiler doğru evrede gelip gider.
     - **Doğru iş akışı (betonarme):**
       1. Mobilizasyon: şantiye çiti, konteyner, iş güvenliği tabelası, malzeme sahası.
       2. Aplikasyon: total station, kazık, ip iskelesi.
       3. Hafriyat: ekskavatör kazar; damperli kamyon gelir, dolar, gider.
       4. Grobeton (transmikser).
       5. Temel su yalıtımı.
       6. Temel donatısı (alt/üst hasır, kolon filizleri) → yan kalıp → beton: transmikser ile beton pompası gelir, bom açılır, hortumcu ve vibratörcü işçi çalışır → kür (koyu ıslak griden açık griye).
       7. **Her kat için döngü:** kolon donatısı (filizlere bindirme) → kolon kalıbı → kolon betonu → kalıp söküm → kiriş ve döşeme kalıbı ile dikmeler → döşeme donatısı → döşeme betonu (pompa + mikser) → kür → üst kat.
       8. Duvar örme (tuğla ya da gazbeton, sıra sıra, lentolar).
       9. Çatı: makas, aşık, yalıtım, kiremit (saçaktan mahyaya). Kulede kule vinç, evde mobil vinç.
       10. Cephe: dış iskele kurulur → doğrama → mantolama → sıva → boya.
       11. İnce işler: kapı, oluk, baca, ışıklar.
       12. İskele söküm, temizlik, peyzaj (çim, ağaç, yol taşı, posta kutusu), kurdele, "İskân alındı ✅".
     - Ekranda o anki iş kalemi ve "hakediş %" görünür. Kulübe 1 kat, ev 2 kat, kule 4–5 kat. Evre ağırlıkları seansın 25/50/75 dakikasına yayılır.
     - **Uygulama:** `ConstructionScene` (SVG, tek rAF, 30 fps) içinde zaman çizelgesi (`phase`, `progress`) ile çizim yapılacak. Makine ve işçi sprite'ları önceden üretilir, görünmezken döngü durur. Hareket azaltmada yalnızca evre geçişleri kalır.
     - **Çöküş:** çatlak → sallanma → parça parça yıkılma → toz → işçiler kaçar.
     - Küçük parçalarla gidilecek: (a) evre zaman çizelgesi, kaba yapı döngüsü, donatı/kalıp/beton çizimi; (b) makineler (ekskavatör, kamyon, transmikser, pompa, vinç) ve işçiler; (c) duvar, çatı, cephe ve ince işler; (d) peyzaj, teslim, çöküş.
     - **(a) ✅ yayında (14 Ekim gece):**
       - `src/construction.js`: `sitePlan(sp)` evreleri ağırlıklarıyla seansa yayar (kaba yapı %0–55, sonra `LATER`: duvar, çatı, doğrama, ince işler, teslim). `siteSVG(P, sp, plan, shown)` her şeyi ilerlemeden doğrudan çizer:
         - Hazırlık: çit ve konteyner, kazık ve ip iskelesi, total station.
         - Temel: kliple kırpılan hafriyat çukuru ve toprak yığını, grobeton, alt ve üst hasır, kolon filizleri, yan kalıp, yükselip kürlenen beton, geri dolgu.
         - Her kat: etriyeli kolon kafesi → kontrplak kolon kalıbı → beton kolon, dikmeler, 3×3 döşeme kalıbı, döşeme donatısı, arkadan öne dökülen döşeme.
       - `Village.jsx`'te yeni parça türleri:
         - `site`: ilerlemeyle yeniden çizilir.
         - `erect`: iskele ve vinç parça parça kurulur ve sökülür; artık silikleşmiyor.
         - `reveal`: çatı saçaktan mahyaya kırpılarak açılır.
       - Vinç kancası çalışılan katta, yükü evreye göre değişir. Sol üstte iş kalemi ve "Hakediş %" yazar (viewBox içinde 24/20 px, telefonda yaklaşık 12/10 px).
     - **(b) ✅ (14 Ekim gece):** `src/crew.js` → `crewSVG(P, sp, plan, shown, time)` dönüşü `{ behind, front }`.
       - Makineler evrenin ilk %15'inde arsanın kenarından girer, son %15'inde çıkar. Katmanlar arsaya kırpılır (`clipPath plot<uid>`).
       - Hafriyat: kepçesi sallanan ekskavatör ve damperli kamyon (gelir, kova kova dolar, gider; 9 sn döngü).
       - Grobeton ve her beton: tamburu dönen transmikser. Temel ve döşeme betonunda üç bomlu pompa döküm cephesine uzanır; hortumcu ve vibratörcü işçi orada çalışır.
       - Her evrede işine uygun minik işçiler (baret, yelek, sallanma).
       - Çizim sırası: `yard` (çit, konteyner, toprak; `siteSVG().yard`) → `crew-back` → bina → `crew-front`. 15 fps.
     - **(c) ilk yarı ✅ (14 Ekim gece):** `Village.jsx`'teki `masonrySVG` ile dolgu duvarlar gazbeton bloklarla sıra sıra örülür; o an örülen sıra iki görünen yüzde ilerler. `facadeSVG` ile "Cephe: mantolama, sıva ve boya" evresinde (0.86–0.93) son duvar rengi iki yüzde alttan yukarı çıkar, sonunda bitmiş duvar (`wallsSVG`) devralır.
     - **Ayrıntı turu 1 ✅ (14 Ekim gece; kodun bir kısmı yanlışlıkla `90558727`'ye girdi, yayını sonraki commit'te):**
       - Kapı ve bahçe artık `pop` değil, `reveal` + `fit` ile çiziliyor: kendi yüksekliklerinde alttan yukarı açılıyor (kapı eşikten takılıyor, bahçe topraktan yeşeriyor). Sahnede `pop` kalmadı.
       - Çöküş baştan yazıldı. 0,75 sn boyunca duvarlarda zikzak çatlaklar büyüyor, yapı giderek sertleşen bir sarsıntıyla titriyor. Ardından parçalar tam renkli düşüyor ve ancak yere indikten sonra tozda kayboluyor. İşçiler `fleeSVG` ile binadan uzağa koşuyor; enkaz kalıyor. Hareket azaltmada enkaz yine anında görünür.
       - **Kalan:**
         - (c) Çatı makası, çatı makası ve kiremit, cephe iskelesiyle mantolama/sıva/boya, kapı (hâlâ `pop` ile büyüyerek geliyor).
         - (d) Peyzaj (bahçe hâlâ `pop`) ve fiziksel çöküş. Çöküş şimdilik eski usul: parçalar düşüp soluyor.
  2. **Yapı kataloğu (koleksiyon, "pokemon gibi").**
     - Sınıflar seans süresine bağlı kalır: Küçük 25, Orta 50, Büyük 75 dk.
     - Her sınıfta geniş bir katalog olacak:
       - Konutlar: kulübe, taş köy evi, ahşap dağ evi, kerpiç ev, apartman, köşk…
       - İşlevsel yapılar: fırın, çay ocağı, mahalle kütüphanesi, değirmen, su kulesi, sera, atölye, okul…
       - Süs yapıları: çeşme, gazebo, heykel, köprü, saat kulesi…
     - **Para birimi:** odak dakikasıyla tuğla (Paket 9'daki fikir buraya taşınır; 1 dk = 1 tuğla gibi). Seans başında sınıftan yapı seçilir; bazıları tuğlayla açılır.
     - **Nadirlik:** nadir ve özel yapılar var. "Haftanın yapısı" her hafta kataloğa yeni yapı getirir. "Haftanın en çok çalışanı" ödül yapısı alır. İleride bazı yapılar bonus verebilir.
     - **Koleksiyon sayfası:** "n/N", yapılmayanlar silüet olarak görünür.
     - **Veri:** `shared/catalog.js` (id, sınıf, ad, tür, nadirlik, bedel, eklenme haftası, planlayıcı ayak izi). Göçle `buildings.model` ve tuğla bakiyesi eklenir. `iso.js`'te model başına `spec`/çizim yazılır. Var olan binalar model olmadan aynı görünmeye devam eder.
     - Paket 6'nın bina çeşitliliği ve Paket 9'un tuğlası bununla birleşir.
  3. Sonra Paket 3'ün gözlemevi ve **Paket 2 — Mürekkep** (aşağıdaki plan geçerli).
- **Paket 2 planı (Mürekkep):** uygulamanın yüzü; Paket 4'ün kutlaması ve şantiye şefi ona bağlı.
  - Plan: `src/Mascot.jsx` (parçalı SVG; kafa, gözler, kulaklar, kuyruk, pati, gözlük, atkı `var(--accent)`; 9 poz; bekleme hareketleri; `say` balonu) ve `src/mascotLines.js` (olay başına 8–15 cümle, tekrar etmeyen seçici).
  - Ardından tanıtım: 3 kart, cihaz başına bir kez. Sonra "İlk gün görevleri" kartı (sunucudan türet: profil süslendi mi, ilk `here`, abonelik var mı, ilk bina; ödül Kurucu tabelası). Sonra sekme ipuçları. En sonda boş durumlara ve şantiyeye yerleştirme.
- **Paket 1.5 plan notu (tamamlandı):**
  1. ✅ Demo kaldırıldı; oturumsuz → `Welcome` ekranı (Giriş yap / Yeni ekip kur; davet linkinde "Ekibe katıl"). Kalan: girişte "Şifremi unuttum" için `/reset` formu (kod + kullanıcı adı + yeni şifre). Şimdilik Batur kodu "Kodla" sekmesinde giriş yaptırıyor, sonra Benim köşem → Hesap'tan yeni şifre belirleniyor.
  2. Katılma/kurma formunda kullanıcı adı + şifre zorunlu (Astra denetiminde sunucu da zorunlu hale getirildi; eski hesaplar korunur).
  3. "Benim köşem"e "Hesap" bölümü (`/api/account`); hesabı olmayanlara ana sayfada nazik hatırlatma kartı.
  4. Veri güvenliği: `/batur`'a "Tüm veriyi yedekle (JSON indir)" uç noktası + düğmesi; "Ekipten ayrıl" yanlışlıkla basılmasın diye ad yazarak onay (ya da 30 gün geri alınabilir yumuşak silme); panelde üye ayrıntısı (cihaz/oturum sayısı, odak toplamı, bina sayısı, tüm oturumları kapat). D1 Time Travel ücretsiz planda 7 gün geri dönüş sağlar (`npx wrangler d1 time-travel restore kutup --timestamp=…`).
  5. Çoklu cihaz: tüm veri sunucuda, istemcide kalıcı veri yok; her yazma `state` döndürür, yoklama `rev` ile. 10 cihaz aynı anda sorun çıkarmaz; bunu bozmamaya dikkat.
- **Önceki plan notları (Paket 1.5):**
  - Girişsiz açılışta demo kişiler (Elif, Zeynep…) yok. Karşılama ekranı: "Giriş yap", "Davet linkiyle katıl", "Kendi ekibini kur" (tek başına da). `/join/<davet>` doğrudan katılma formunu açar.
  - Kullanıcı adı + şifre (PBKDF2, Workers CPU sınırı yüzünden makul iterasyon, hız sınırı). Mevcut üyeler "Benim köşem"den bir kez belirler; uygulama hatırlatır. Her tarayıcıdan "Giriş yap".
  - Şifre sıfırlama: e-posta yok (alan adı yok). Batur `/batur` panelinde üye için 24 saatlik sıfırlama kodu üretir; kişi kullanıcı adı + kod + yeni şifre ile girer. Açık bir cihazdan şifre değiştirilebilir; "Başka cihazda aç" kodu yedek olarak kalır.
- **Paket 7'ye eklendi — Büyük proje modu:** Çok seanslık büyük yapılar (ör. ~10 saatlik okul/apartman), tek başına ya da beraber. Bozulan seans projeyi değil yalnızca o seansın katını yıkar; seans bitince bırakmak serbest. 7 gün dokunulmazsa branda ("beklemede"), asla silinmez. Bitince mahallede büyük simge yapı (planlayıcıya daha geniş FOOTPRINT türü eklenir). Seans başı ev ana döngü olarak kalır.

## 7. İş paketleri (sırayla; her paketin sonunda test + yayın + commit)

Her paket kendi içinde teslim edilebilir. Her paket sunucu tarafında test (`tests/suite.js`, iki çalışma ortamı), göç (`schema.js`'e yeni eleman, gerekirse `core.test.js`) ve 375px'te görsel kontrol ile biter. Paket bitince Batur'a 3–5 satırlık Türkçe özet yaz: ne geldi, nasıl denenir.

### Paket 1 — Ortak köy altyapısı ve köyü öne çıkarmak

**Uzun vadeli tasarım (burayı doğru kur, sonra her şey bunun üstüne gelecek):**
- **Sabit ama doğal konumlar.** Köy asla düzgün simetrik sıralar gibi görünmemeli; gerçek bir köy gibi organik dağılmalı. Batur bunu özellikle istedi.
  - Her binanın konumu veritabanında kalıcı olsun: `buildings`'e `pos_x`, `pos_y` (dünya koordinatı, ondalıklı) ve `facing` (0 = sola bakar, 1 = sağa bakar; aynalı çizim) ekle. Çizim kuralı değişse bile hiçbir bina yer değiştirmez.
  - **Konumu sunucu, bina oluşurken seçer.** Mahallenin içinde, mahalleye özel tohumla Poisson-disk benzeri örnekleme yapılır. En az mesafe bina türüne göre değişir (kule daha geniş yer ister); mevcut binalara, yollara ve mahalle sınırına çarpmayan ilk aday seçilir.
  - Mahalle içinde hafif eğim ya da tepe, gölet, ağaç kümeleri gibi doğal öğeler tohumdan üretilsin. Boşluklar bahçe, çit, patika ve ağaçla dolsun.
  - **Yollar düz ızgara değil, kıvrımlı olsun:** mahalle girişlerini meydana bağlayan yumuşak eğriler. Binaların kapısına giden patikalar yola bağlansın.
  - Göç, mevcut binalara `created` sırasıyla aynı algoritmayla konum atar.
- **Mahalleler (district).**
  - Her üyeye katılınca bir mahalle verilir (`districts` tablosu: id, group_id, member_id, dx, dy).
  - Mahalleler köy merkezinin (Paket 6'daki Milli Kütüphane anıtı) etrafında spiral düzende sıralanır. Merkez meydana yakın olanlar önce dolar.
  - Mahallenin bir kapasitesi var (ör. 9 bina); dolunca aynı kişiye bitişik yeni bir mahalle açılır. Köy dışa doğru organik büyür, hiçbir şey kaymaz. Mahalle sınırları görünmez kare değil, yumuşak ve düzensiz olsun.
  - Mahalle girişinde isim tabelası olur.
- **Ayrılan üye:** bugünkü gibi binaları silinir (gizlilik). Mahallesi "boş arsa" olarak kalır, bir sonraki yeni üyeye verilebilir.
- **Ölçek hesabı:** 10 kişi × günde 2 bina × 365 ≈ 7.300 bina/yıl. Bu yüzden köy haritası SVG DOM ile değil, **Canvas 2D** ile çizilmeli:
  - Statik katman (zemin, yollar, binalar) önbelleğe alınan karolara (tile, ör. 512px) bir kez çizilsin.
  - Sadece canlı katman (ışıklar, yürüyen figürler, duman, kedi) her karede güncellensin.
  - Görünür alan dışındakiler çizilmesin (viewport culling).
  - **Yakınlaştırma seviyesine göre ayrıntı (LOD):** uzakta binalar sade kutular, yakında tam ayrıntı.
  - Parmakla kaydırma ve iki parmakla yakınlaştırma (pinch zoom).
  - İnşaat sahnesi (tek bina) SVG olarak kalabilir.
- **API:**
  - `/api/village` yanıtı kompakt dizilerle dönsün: `[id, memberId, kind, seed, plot_x, plot_y, created]`.
  - `ETag` / `rev` ile değişmediyse boş dönsün.
  - Çok büyüyünce mahalle bazlı (bbox) sorgu yapılabilsin.

**Görünürlük:**
- Alt menüde ve kenar çubuğunda "Odak" sekmesinin adı **"Köy"** olsun (id `focus` kalsın, `?tab=focus` bozulmasın). Sayfa: odak kartı, şantiye, ortak köy haritası.
- **Ana ekrana kompakt "Kütüp köyü — şu an" kartı** (kahraman bölümünün hemen altına):
  - Şu an "Kütüpte" olanın mahallesindeki evin pencereleri yanar, bacası tüter, üstünde avatar balonu durur.
  - "Yolda" olan, köy yolunda yürüyen küçük bir figür olur.
  - Dokununca Köy sekmesine gider.
- **Binaya dokununca kart:** kim, ne zaman, kaç dakika, tür. Altında kalp: yeni `building_likes` tablosu ve uç noktası.
- **Gün/gece:** Türkiye saatine göre köyün tonu, sokak lambaları ve pencere ışıkları.
- **Enkaz:** Çöken inşaat o kişinin mahallesinde 24 saat enkaz olarak görünür (ör. `members.ruin_until`); sonraki tamamlanan bina temizler.
- **İnşaat modu varsayılanı:** yeni cihazlarda açık (`kutup-fidan-on` anahtarı yoksa açık say).

### Paket 2 — Maskot "Mürekkep" ve tanıtım

**Mürekkep, uygulamanın yüzü. Özen göster.**
- **Karakter:** Kütüphanede yaşayan, siyah-beyaz smokin desenli küçük bir kedi. Bir patisi mürekkep lekeli, burnunun ucunda yuvarlak okuma gözlüğü. Boynundaki minik atkı kullanıcının tema renginde (CSS `var(--accent)`).
- **Kişiliği:** Biraz uykucu, biraz iğneleyici ama çok tatlı bir kütüphaneci. Sessizliği sever ("Şşşt"), kitapların üstünde uyur, telefona bakanları süzer, biten binaları alkışlar.
- **Çizim:**
  - Uygulamanın düz, sıcak illüstrasyon diliyle, gradyansız SVG.
  - Parçalı kurulsun (kafa, gözler, kulaklar, kuyruk, pati, gözlük, atkı) ki parçalar ayrı ayrı oynayabilsin.
  - **Bekleme hareketleri:** 4–6 sn'de bir rastgele göz kırpma, kuyruk sallama, ara sıra kulak oynatma.
  - **Pozlar:**
    - oturma
    - uyuma (Zzz)
    - el sallama
    - kitap okuma
    - alkışlama / kutlama
    - şok (çöküş anı)
    - "şşşt" (pati ağızda)
    - baretli şantiye şefi (inşaat sırasında)
    - gece kuşu (mum ışığında)
  - Bir `Mascot` bileşeni `pose`, `size` ve `say` (konuşma balonu) alsın.
- **Göründüğü yerler:**
  - Tanıtım kartlarının anlatıcısı.
  - Boş durumlar.
  - Önemli bildirimlerde küçük kafa ikonu.
  - Köyde dolaşan, çatılarda uyuyan kedi.
  - Şantiyede baretli şef.
  - Easter egg'ler.
- **Mesaj bankası:**
  - Olaylara göre kategorili şablon cümleler, her biri 8–15 varyasyonlu ve Türkçe doğal.
  - Olaylar: biri geldi, uzun süredir kütüpte, bina bitti, bina çöktü, gece yarısı, pazartesi bülteni, ilk giriş, uzun aradan dönüş.
  - Değişkenler: isim, dakika, bina türü.
  - Sıklık sınırı: ekran başına en fazla 1 balon, aynı cümle arka arkaya gelmesin.
- **Etkileşim:**
  - Dokununca rastgele bir cümle ve küçük bir hareket.
  - Uzun basınca mırlama animasyonu, ilk seferde "Kedi dostu" rozeti.

**Tanıtım:**
- **Katıldıktan hemen sonra, cihaz başına bir kez,** Mürekkep'in anlattığı 3 kartlık hoş geldin hikâyesi (kaydırılabilir, atlanabilir, hafif hareketli). Kartlar:
  - "Kim nerede, artık sormak yok"
  - "Odaklan, köyüne ev dik"
  - "Batur'a ne istersen yaz"

  Son kartta iki eylem: bildirimleri aç ve iPhone'daysa ana ekrana ekle tarifi (giriş kodu notuyla).
- **Ana ekranda "İlk gün görevleri" kartı**, hepsi bitene kadar:
  - Profilini süsle
  - İlk "Ben geldim!"
  - Bildirimleri aç
  - İlk kulübeni dik

  Durumlar mümkün olduğunca sunucudan türetilsin. Ödül: mahallede kalıcı "Kurucu tabelası".
- **Her sekmenin ilk ziyaretinde** Mürekkep'ten tek cümlelik, kapatılabilir ipucu.

### Paket 3 — Kara delik, gizli kapı ve Batur'un geliştirici eşyası

**Gizli kombinasyon:**
- **Telefon:** logodaki ✳ simgesine 7 kez hızlı dokunuş, sonuncusunda basılı tutma. **Bilgisayar:** klavyede "batur" yazmak.
- **Kara delik görseli:** Ekranın ortasında bir kara delik açılır.
  - Siyah olay ufku, ışık halkası, dönen sıcak renkli toplanma diski, içine sarmal çizerek düşen parçacıklar.
  - SVG + CSS ya da Canvas; radyal gradyan burada serbest.
  - Sayfa "spagettileşerek" içine çekilir: ana kabuğa merkeze doğru ölçek, dönme, eğme ve bulanıklık.
- **Kapı mantığı:**
  - `/api/owner/status` `signedIn: true` ise doğrudan `/batur` açılır.
  - Değilse delik içinde "Burası Batur'un kara deliği 🕳️" yazar; küçük bir "anahtarın varsa" alanı (`/owner/login`) ve "Geri dön" düğmesi çıkar.
  - Kapıyı bulan kişi gizli rozet kazanır.
- **`/batur` panelinde kara delik bölgesi:** isteği sürükleyip bırakınca ya da "Kara deliğe at" düğmesine basınca yutulma animasyonuyla silinir.
- **Güvenlik aynen kalır:** kombinasyon sadece kapıyı gösterir, anahtar şart.

**Batur'un geliştirici eşyası (herkes görür, Batur uygulamada normal bir üye olarak havalı hissetsin):**
- **Bağlantı:** Yönetici paneline "Bu ekipteki profilim" seçimi ekle; seçilen üyeye `members.badge = 'dev'` yazılsın. Bu alan `state` içinde herkese gitsin; üye listesinde avatar yanında gösterilir.
- **Avatar:** Batur'un avatarının etrafında, her yerde (üye kartı, pano, odak listesi, profil penceresi), yörüngede dönen minik bir kara delik. Küçük, zarif, düşük maliyetli CSS animasyonu.
- **Üye kartı ve profil:** "Kurucu · Olay ufku bekçisi" etiketi, kara delik ikonlu özel çerçeve.
- **Köy:** Batur'un mahallesinde ona özel bir yapı: **"Olay Ufku Gözlemevi"**. Kubbeli küçük gözlemevi, üstünde dönen mini kara delik, geceleri kubbeden ışık.
- **Pano:** Batur'un mesajlarında minik ✦ geliştirici işareti.
- **Ölçü:** abartma; fark edilsin ama göz yormasın.

### Paket 4 — Easter egg'ler ve gizli rozetler

- **Altyapı:** `achievements(member_id, key, created)` tablosu ve izin listesi olan bir uç nokta. Mümkün olanlar sunucuda doğrulansın.
- **Profilde** "Gizli rozetler: n/12"; bulunmayanlar "???" görünür. Rozetin kazanıldığı an Mürekkep küçük bir kutlama yapar.
- **Egg'ler:**
  - **Şşşt:** panoya tamamı büyük harfli mesaj → Mürekkep "şşşt" pozuyla "Şşşt! Burası kütüphane 🤫", rozet.
  - **Gece kuşu:** 03.00–05.00 arası açılış → baykuş teması, Mürekkep mum ışığında "Uyu artık 🦉"; 🦉 avatarının kilidi açılır (sunucu avatar listesi rozete göre izin verir).
  - **Kedi dostu:** Mürekkep'e uzun basmak ya da köyde dolaşan kediye 3 kez dokunmak.
  - **Çay:** panoya tam olarak "çay" yazılırsa 60 saniye boyunca herkesin avatarında 🍵.
  - **Gizli not:** alt bilgideki "Batur’dan, bizim tayfaya." yazısına uzun basınca Batur'dan gizli bir not.
  - **Kara delik kâşifi:** Paket 3'teki kapıyı bulmak.
  - Kalan 6 rozet sonraki paketlerde gelir (özel günler, oyunlar, köy kilometre taşları).

### Paket 5 — İnşaat sahnesinin mühendislik seviyesinde görsel yükseltmesi

Batur inşaat mühendisi; iş akışı gerçekçi ve detaylı olsun, ama sahne yine sevimli ve akıcı kalsın. Mevcut `ConstructionScene` (SVG, tek rAF, 30 fps) üzerine kur.

**Gerçek iş kalemleri** (ilerleme yüzdesine yayılır; ekranda o anki kalemin adı ve "hakediş %" gösterilsin):
1. **Aplikasyon:** total station sehpası, kazıklar ve ip iskelesi (batter board), ipler gerilir.
2. **Hafriyat:** mini ekskavatör kepçeyle kazar, yan tarafta toprak yığını büyür.
3. **Temel:**
   - Kalıp tahtaları çakılır, donatı (hasır çelik) ızgarası serilir.
   - Transmikser gelir, tamburu döner, oluktan beton dökülür.
   - Beton yüzeyi koyu ıslak griden açık griye döner (kür).
4. **Kaba inşaat:**
   - Kulübe ve evde tuğla duvar sıra sıra harçla örülür.
   - Kulede kat kat betonarme kolon ve döşeme: kalıp, dikmeler (iskele direkleri), beton, sonra dolgu duvar.
5. **Çatı:** vinç makasları tek tek yerleştirir, aşıklar konur, kiremitler saçaktan mahyaya sıra sıra dizilir.
6. **İnce işler:**
   - Pencere doğramaları takılır, camda parlama.
   - Kapı takılır.
   - Sıva ve boya kat kat yüzeyi süpürür.
   - Oluk ve baca eklenir.
7. **Peyzaj ve teslim:**
   - İskele parça parça sökülür, moloz kaldırılır, çimen yeşerir.
   - Çiçekler, yol taşları, sahibinin baş harfli posta kutusu eklenir, ışıklar yanar.
   - **Açılış kurdelesi kesilir**, "İskân alındı ✅" damgası iner.

**Sahne canlılığı:**
- 2–3 baretli işçi (sarı ve beyaz baret): yürür, çekiçler, el arabası iter.
- Vinç kancası o anki kalemin malzemesini taşır.
- Toz ve kıvılcım parçacıkları.
- Sahnenin ışığı günün saatine uyar.
- Mürekkep baretle şantiye şefi olarak köşede durur.

**Çöküş daha fiziksel olsun:**
- Önce çatlak çizgileri belirir, yapı sallanır.
- Sonra parça parça yıkılır, toz bulutu kalkar.
- İşçiler kaçışır; "İş güvenliği önce!" tabelası düşer.
- Mürekkep şok pozunda.

**Performans:**
- Parçalar mümkün olduğunca önceden üretilsin.
- Sadece değişenler yeniden çizilsin.
- Görünmezken döngü dursun.
- `prefers-reduced-motion`'da yalnızca kalemler arası geçişler kalsın.

### Paket 6 — Köyün görsel yükseltmesi ve Milli Kütüphane anıtı

- **Bina çeşitliliği:** Her tür için tohuma (`seed`) bağlı 3–4 varyant: balkon, tente, saksı, cumba, farklı pencere düzenleri, malzemeler.
- **Yaşayan köy:**
  - Mahalleleri bağlayan yollar.
  - Geceleri yanan sokak lambaları.
  - "Kütüpte" olanların avatarlı figürleri meydana yürür.
  - Bacalardan duman, kuşlar, gölet.
  - Mevsimler: sonbaharda turuncu ağaçlar, kışın kar.
- **Milli Kütüphane anıtı:**
  - Köy merkezinde, grubun toplam odak dakikasıyla parça parça yükselen bir anıt (kendi aşamalarıyla).
  - Ortak eşiklerde (ör. 10 binada çeşme, 25'te saat kulesi, 50'de park) meydana yapılar eklenir.
  - Eşik aşılınca panoya Mürekkep duyurusu düşer.

### Paket 7 — Beraber inşaat

- "Katıl" ile aynı seansa giren 2+ kişi tek ve büyük bir ortak yapı diker (kafe, okuma salonu).
- Biri çıkarsa yapı çöker.
- Yapı meydanda durur, kimlerin yaptığı yazar.
- **Veri:** `buildings`'e ortaklık için bir katılımcı tablosu.

### Paket 8 — Mola oyunları

- **Kahve çarkı ☕:** kütüpteki arkadaşlar arasında kahveyi kimin ısmarlayacağını seçer.
- **Kütüple:** günde bir Türkçe 5 harfli kelime (Wordle benzeri). Renkli kare sonuçları panoya düşer; Türkçe kelime listesini sen hazırlarsın.

### Paket 9 — Sonrası

- Odak dakikalarıyla tuğla kazanılır, tuğlayla köye süs (bank, ağaç, kedi evi) alınır.
- **Tuğla kulesi:** tek dokunuşla blok düşürme oyunu, haftalık skor tablosu.
- **Mürekkep'in pazartesi bülteni.**
- Özel gün egg'leri: final haftası, yılbaşında kar, Batur'un doğum gününde havai fişek.

## 8. Başlarken ilk adımlar

1. `C:\Users\İzzettin\bilim-dunyasi\kutup-platform` içinde `git status` ve `git pull`; dalın `kutup-platform` olduğunu doğrula.
2. `kutup/` içinde `npm ci` ve `npm run test:all` (41 test yeşil olmalı).
3. Paket 1 için kısa bir teknik plan yaz (tablo değişiklikleri, arsa atama algoritması, canvas çizici yapısı), sonra uygula.
4. Her paketten sonra: `npm run test:all` → `npm run deploy` → canlı duman testi (geçici veriyi sil) → commit ve push → Batur'a kısa özet.
5. Kalite çıtası: telefonda akıcı ve okunaklı, mevcut sıcak kâğıt-lila tasarım diliyle uyumlu; her şey Türkçe ve samimi. Görsel ayrıntı Batur için çok önemli; aceleye getirme, ama her paketi canlıya almadan sonrakine geçme.
