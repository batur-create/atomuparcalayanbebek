# Kütüp — devir promptu (yeni sohbete aynen yapıştır)

Sen bu projeye kaldığı yerden devam eden geliştiricisin. Önceki sohbete erişimin yok ve gerek de yok: ihtiyacın olan her şey aşağıda ve depoda. Kullanıcı Batur; Türkçe, samimi yazışır ("aga"). Bütün kararları senin vermeni, onu soru yağmuruna tutmamanı, işi uçtan uca bitirip canlıya almanı istiyor. Yalnızca gerçekten ona ait bir karar varsa tek bir kısa soru sor.

## 1. Proje ne?

**Kütüp**, Ankara'daki Milli Kütüphane'ye giden, farklı okullardaki 5–10 arkadaş için telefona uygun, gerçek zamanlı bir buluşma uygulaması (PWA). Asıl amaç birbirinden haberdar olmak: kim kütüpte, kim yolda, kim ne zaman gelecek. Ton eğlenceli, sıcak, "Batur tarzı"; arayüz metinlerinin hepsi Türkçe. Ana ekranda ilk soru her zaman "kim nerede?" kalmalı; yeni özellikler bunu gölgelememeli.

- **Canlı adres:** https://kutup.ahmetbaturkaplanoglu.workers.dev (Cloudflare Workers ücretsiz plan + D1)
- **GitHub:** `batur-create/atomuparcalayanbebek`, dal `kutup-platform`, proje klasörü `kutup/`. `main` dalı Batur'un başka bir uygulaması (bilim mağazası), ona dokunma.
- **Yerel konumlar (Windows):**
  - Çalışma kopyası: `C:\Users\İzzettin\bilim-dunyasi\kutup-platform` (git worktree, dal `kutup-platform`). Proje kökü: `...\kutup-platform\kutup`.
  - Ana depo: `C:\Users\İzzettin\bilim-dunyasi\atomuparcalayanbebek` (`main`). Burada sadece `.claude/launch.json` var: "kutup" adlı önizleme ayarı `npm --prefix ../kutup-platform/kutup run dev` çalıştırır, port 3001. Tarayıcı panelinde önizleme için `preview_start` ile "kutup" adını kullan.

## 2. Mevcut özellikler (bozma)

- Davet linkiyle özel ekip (`/join/<davet>`): isim, 24 avatar, 6 renk, masa notu, 5 tema. E-posta ya da şifre yok; oturum HttpOnly çerez (`kutup_session`, 1 yıl).
- Başka cihaz: Profil → "Başka cihazda aç" 15 dakikalık tek kullanımlık kod verir; giriş ekranında "Zaten ekipteyim" ile kullanılır. iPhone'da ana ekran uygulaması Safari'den ayrı çerez tuttuğu için şart.
- Durum (Kütüpte / Yolda / Molada / Dışarıda), salon ve masa, "burada · 1 sa 35 dk"; durum 8 saat sonra kapanır.
- Web Push (kendi yazdığımız Web Crypto RFC 8291 + VAPID), 45 dakikalık geliş bildirimi soğuması, bildirime dokununca ilgili sekme (`/?tab=…`).
- Planlar (iki hafta ileri, "Ben de gelirim"), pano (mesaj, kalp, kahve daveti), haftalık odak tablosu.
- **İnşaat modu ve köy (Forest tarzı):** Odak seansları 25/50/75 dk. İnşaat modu açıkken seans süresi binayı belirler: 25 → kulübe, 50 → iki katlı ev, 75 → kule (eşikler 40 ve 70 dk). Seans boyunca canlı izometrik şantiye çizilir. Uygulamadan 10 saniyeden uzun çıkılırsa (sekme kapatma dahil) bina çöker; tamamlanınca köye kalıcı olarak eklenir. Ekran Wake Lock ile açık tutulur.
- **"Batur'a ilet":** fikir, hata ya da sohbet. Kargo takibi gibi aşamaları var: new → seen → accepted → building → done, ya da declined. Kendine ait ilham örnekleri, gönderme animasyonu, "yeni gelişme" rozeti ve her aşamada gönderene push.
- **`/batur` yönetici paneli:** istekler (açınca "İncelendi" olur, tek tuşla aşama, not, geçmiş, arkadaşın gördüğü takip çizgisinin önizlemesi, silme), yeni istek push'u, ekipler, davet yenileme, üye çıkarma. Giriş: `ADMIN_KEY` ya da ilk ziyarette belirlenen anahtar; sonra 30 günlük `kutup_owner` çerezi (yolu `/api/owner`, SameSite=Strict).
- Hareket katmanı: başlıklar Bricolage Grotesque, gövde DM Sans. Ziyaret başına bir kez oynayan açılış koreografisi (başlık satırları maskeden kayar, kitaplar oturur, kartlar dağılır). Diğer hareketler sadece bir eyleme cevap verir: sekme geçişi, gelen arkadaşın kartında parlama, kayan sayaç rakamları. `prefers-reduced-motion` destekleniyor.

## 3. Mimari

```
kutup/
  server/app.js     Tüm API: Fetch Request/Response + async DB adaptörü (all/get/run/read/batch). Node ve Worker'da aynı kod.
  server/schema.js  Sürümlü göçler (`export const migrations`, şu an 5). Yayınlanmış göçü ASLA değiştirme; yenisini sona ekle.
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
  - Sunucu, sonundan 90 sn öncesine kadar sinyal görmüşse binayı ekler (`buildings` tablosu: kind, minutes, seed, created).
  - `wither` / `cancel` → çöküş ve panoya mesaj.
- **Uçtan uca test kancası:** `KUTUP_TEST_HOOKS=1` iken `POST /api/__test/expire {name, away}` çalışır.
- **Yazma koruması:** `X-Kutup: 1` başlığı ve Origin kontrolü. Hız sınırı bellek içinde.

## 4. Komutlar (`kutup/` içinde)

```
npm ci
npm run dev          # http://localhost:3001 (Node + SSE + Vite); veri: kutup/data (yerel test verisi var)
npm test             # çekirdek + push + Node uçtan uca (25 test)
npm run test:worker  # aynı senaryolar yerel workerd + D1 (16 test)
npm run test:all     # hepsi (41 test) — her teslimden önce yeşil olmalı
npm run deploy       # vite build + wrangler deploy (canlı)
```

- **Wrangler** Batur'un Cloudflare hesabına OAuth ile bağlı. Token süresi dolarsa `npx wrangler login --device --browser=false` çalıştır. Çıkan kodu tarayıcı panelinde `https://dash.cloudflare.com/oauth2/device/verify` adresinde kutuya yaz, Batur'a "Continue ve Allow'a bas" de. Kodun ömrü 5 dakika.
- **Canlı `ADMIN_KEY`** Cloudflare'de secret olarak tanımlı. Yerel kopyası `kutup/data/batur-key-canli.txt`. Asla ekrana basma ya da sohbete yazma.
- **Canlı duman testi:** API ile geçici bir ekip kur, dene, sonunda `POST /api/leave` ile sil. Yayından hemen sonra kenar önbellek birkaç saniye eski HTML verebilir.
- **Yerelde `/batur` testi:** Anahtarı yazmak yerine Node ile yerel veritabanına `owner_sessions` satırı ekle (`token = sha256(rastgele)`, `key_hash = sha256(anahtar)`). Sonra sayfada `document.cookie = "kutup_owner=<rastgele>; path=/api/owner"` yap.

## 5. Öğrenilmiş tuzaklar

- **Git Bash heredoc'ları** `’` (kıvrık kesme) ve backtick içeren metinlerde bozuluyor. Bu tür içeriği Write/Edit araçlarıyla yaz; `node -e` ile sadece basit değiştirmeler yap.
- **Üst klasördeki Tailwind/PostCSS** ayarı sızmasın diye `vite.config.js` içinde `css.postcss` satır içi boş tanımlı. Kaldırma.
- **Yazı boyutu** telefonda 10px'in altına inmesin (eski tasarım 6–9px'ti, büyüttük).
- **`.timer-digits > span`** seçicisi altyazı içindir. Sayaç rakamları `<b className="clock">` içinde durur.
- **Dinamik isimlerden sonra Türkçe ek kullanma** ("Batur’e" hatası). "X için not", "Köy: X" gibi kalıplar kullan.
- **Mobil öncelikli:** 375px'te yatay taşma olmamalı. Alt menüde 5 öğe var.
- **Animasyon kuralı:** tek bir orkestra edilmiş açılış ve eyleme cevap veren hareketler. Kendi `transform`'u olan öğelerde yalnızca `from` tanımlı keyframe ve `animation-fill-mode: backwards` kullan.
- **Tarayıcı paneli ekran görüntüleri** bazen yanlış ölçekleniyor. Önce JS ile DOM ve taşma kontrolü yap, görsel için `zoom` kullan.
- **Git:** commit mesajları İngilizce, sonunda `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `kutup-platform` dalına push et, `main`'e dokunma. `kutup/data/` Git'e girmez.

## 6. Verilmiş kararlar (Batur aksini söylemedikçe geçerli)

1. **Köy:** Tek ortak "Kütüp köyü", içinde herkesin isim tabelalı mahallesi. Arkadaşın mahallesine bakmak yine mümkün.
2. **Kara delik:** Batur'un gizli kapısı. Ayrıca `/batur` panelinde istekleri yutan bir çöp olarak çalışır.
3. **Yapay zekâ:** Şimdilik yok. İleride bir "Kütüp kedisi 🐈" maskotu önce hazır şablonlarla gelir; yapay zekâ ancak Batur maliyeti onaylarsa eklenir.
4. **Mini oyunlar** sadece molada açılır (durum "Molada" ya da seans yeni bitmiş). İnşaat sırasında kapalıdır.

## 7. ŞİMDİ YAPILACAK: Aşama 1

Her madde sunucu tarafında test (`tests/suite.js`, iki çalışma ortamı), göç (`schema.js`'e yeni eleman ve gerekirse `core.test.js`) ve 375px'te görsel kontrol ile biter.

**A. Köy öne çıksın**
- Alt menüde ve kenar çubuğunda "Odak" sekmesinin adı **"Köy"** olsun (id `focus` kalsın, `?tab=focus` bozulmasın). Sayfa: odak kartı, şantiye, köy.
- Köy görünümü **ortak köy** olsun: grup üyelerinin binaları mahalle mahalle, isim tabelalarıyla tek haritada. Bugünkü kişi seçicisi "mahalleye odaklan" işlevine dönüşsün.
- **Ana ekrana kompakt "Kütüp köyü — şu an" kartı** (kahraman bölümünün hemen altına):
  - Şu an "Kütüpte" olanların mahallesindeki evin pencereleri yanar, bacası tüter, üstünde avatar balonu durur.
  - "Yolda" olan, köy yolunda yürüyen küçük bir figür olur.
  - Karta dokunan Köy sekmesine gider.
- **Binaya dokununca kart:** kim, ne zaman, kaç dakika, tür. Altında kalp: yeni `building_likes` tablosu ve uç noktası; kalpler `state` ile ya da `/api/village` yanıtında gelsin.
- **Gün/gece:** Türkiye saatine göre köyün tonu ve pencere ışıkları.
- **Enkaz:** Çöken inşaat o kişinin mahallesinde 24 saat enkaz olarak görünür (ör. `members.ruin_until`); sonraki tamamlanan bina temizler.
- **İnşaat modu varsayılanı:** yeni cihazlarda açık (`kutup-fidan-on` anahtarı yoksa açık say).

**B. Tanıtım**
- **Katıldıktan hemen sonra, cihaz başına bir kez,** 3 kartlık hoş geldin hikâyesi (kaydırılabilir, atlanabilir, bizim tonumuzda, hafif hareketli). Kartlar:
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
- **Her sekmenin ilk ziyaretinde** tek cümlelik, kapatılabilir ipucu.

**C. Kara delik ve gizli kombinasyon**
- **Telefon:** logodaki ✳ simgesine 7 kez hızlı dokunuş, sonuncusunda basılı tutma. **Bilgisayar:** klavyede "batur" yazmak.
- **Ne olur:** Ekranın ortasında kara delik açılır (SVG/CSS ya da canvas). Sayfa "spagettileşerek" içine çekilir.
  - `/api/owner/status` `signedIn: true` ise doğrudan `/batur` açılır.
  - Değilse delik içinde "Burası Batur'un kara deliği 🕳️" yazar; küçük bir "anahtarın varsa" alanı (`/owner/login`) ve "Geri dön" düğmesi çıkar.
  - Kapıyı bulan kişi gizli rozet kazanır.
- **`/batur` panelinde kara delik bölgesi:** isteği sürükleyip bırakınca ya da "Kara deliğe at" düğmesine basınca yutulma animasyonuyla silinir.
- **Güvenlik aynen kalır:** kombinasyon sadece kapıyı gösterir, anahtar şart.

**D. Easter egg'ler ve gizli rozetler**
- **Altyapı:** `achievements(member_id, key, created)` tablosu ve izin listesi olan bir uç nokta. Mümkün olanlar sunucuda doğrulansın.
- **Profilde** "Gizli rozetler: n/12"; bulunmayanlar "???" görünür.
- **Aşama 1 egg'leri:**
  - **Şşşt:** panoya tamamı büyük harfli mesaj → "Şşşt! Burası kütüphane 🤫" ve rozet.
  - **Gece kuşu:** 03.00–05.00 arası açılış → baykuş teması ve "Uyu artık 🦉"; 🦉 avatarının kilidi açılır (sunucu avatar listesi rozete göre izin verir).
  - **Kütüp kedisi:** köyde ara sıra yürüyen kedi; 3 dokunuş → "Kedi dostu" rozeti.
  - **Çay:** panoya tam olarak "çay" yazılırsa 60 saniye boyunca herkesin avatarında 🍵.
  - **Gizli not:** alt bilgideki "Batur’dan, bizim tayfaya." yazısına uzun basınca Batur'dan gizli bir not.
  - **Kara delik kâşifi** (C'deki rozet).

**Teslim:** `npm run test:all` yeşil → `npm run deploy` → canlı duman testi (geçici veriyi sil) → commit ve push → Batur'a kısa Türkçe özet: ne eklendi, nasıl denenir, neyi doğrulayamadın.

## 8. Sonraki aşamalar (Aşama 1 bitince, Batur onaylarsa)

**Aşama 2:**
- Köyün ortasında, herkesin dakikalarıyla parça parça yükselen **Milli Kütüphane anıtı**. Ortak eşiklerde (ör. 10 binada çeşme, 25'te saat kulesi) yapılar açılır.
- **Beraber inşaat:** "Katıl" ile aynı seansa giren 2+ kişi tek ve büyük bir yapı (kafe, okuma salonu) diker. Biri çıkarsa yapı çöker.
- **Kahve çarkı:** kütüpteki arkadaşlar arasında kahveyi kimin ısmarlayacağını seçer.
- **Kütüple:** günde bir Türkçe 5 harfli kelime (Wordle benzeri). Renkli kare sonuçları panoya düşer; Türkçe kelime listesini sen hazırlarsın.

**Aşama 3:**
- Odak dakikalarıyla tuğla kazanılır, tuğlayla köye süs (bank, ağaç, kedi) alınır.
- **Tuğla kulesi:** tek dokunuşla blok düşürme oyunu, haftalık skor tablosu.
- **Kütüp kedisi** maskotu: sabah ve pazartesi bülteni mesajları, hazır şablonlarla.
- Özel gün egg'leri: final haftası, yılbaşında kar, Batur'un doğum gününde havai fişek.

## 9. Başlarken ilk adımlar

1. `C:\Users\İzzettin\bilim-dunyasi\kutup-platform` içinde `git status` ve `git pull`; dalın `kutup-platform` olduğunu doğrula.
2. `kutup/` içinde `npm ci` ve `npm run test:all` (41 test yeşil olmalı).
3. Kısa bir plan yap, sonra Aşama 1'i A → B → C → D sırasıyla uygula. Her parçadan sonra test et; işin sonunda tek seferde yayınla.
4. Kalite çıtası: telefonda akıcı ve okunaklı, mevcut sıcak kâğıt-lila tasarım diliyle uyumlu; her şey Türkçe ve samimi.
