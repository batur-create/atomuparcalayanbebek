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

- Davet linkiyle özel ekip (`/join/<davet>`): isim, 24 avatar, 6 renk, masa notu, 5 tema. E-posta ya da şifre yok; oturum HttpOnly çerez (`kutup_session`, 1 yıl).
- Başka cihaz: Profil → "Başka cihazda aç" 15 dakikalık tek kullanımlık kod verir; giriş ekranında "Zaten ekipteyim" ile kullanılır. iPhone'da ana ekran uygulaması Safari'den ayrı çerez tuttuğu için şart.
- Durum (Kütüpte / Yolda / Molada / Dışarıda), salon ve masa, "burada · 1 sa 35 dk"; durum 8 saat sonra kapanır.
- Web Push (kendi yazdığımız Web Crypto RFC 8291 + VAPID), 45 dakikalık geliş bildirimi soğuması, bildirime dokununca ilgili sekme (`/?tab=…`).
- Planlar (iki hafta ileri, "Ben de gelirim"), pano (mesaj, kalp, kahve daveti), haftalık odak tablosu.
- **İnşaat modu ve köy (Forest tarzı):** Odak seansları 25/50/75 dk. İnşaat modu açıkken seans süresi binayı belirler: 25 → kulübe, 50 → iki katlı ev, 75 → kule (eşikler 40 ve 70 dk). Seans boyunca canlı izometrik şantiye çizilir. Uygulamadan 10 saniyeden uzun çıkılırsa (sekme kapatma dahil) bina çöker; tamamlanınca köye kalıcı olarak eklenir. Ekran Wake Lock ile açık tutulur. Şu an her kişinin köyü ayrı çiziliyor; bu değişecek (bkz. Paket 1).
- **"Batur'a ilet":** fikir, hata ya da sohbet. Kargo takibi gibi aşamaları var: new → seen → accepted → building → done, ya da declined. Kendine ait ilham örnekleri, gönderme animasyonu, "yeni gelişme" rozeti ve her aşamada gönderene push.
- **`/batur` yönetici paneli:** istekler (açınca "İncelendi" olur, tek tuşla aşama, not, geçmiş, arkadaşın gördüğü takip çizgisinin önizlemesi, silme), yeni istek push'u, ekipler, davet yenileme, üye çıkarma. Giriş: `ADMIN_KEY` ya da ilk ziyarette belirlenen anahtar; sonra 30 günlük `kutup_owner` çerezi (yolu `/api/owner`, SameSite=Strict). Yönetici şu an hiçbir üyeye bağlı değil.
- Hareket katmanı: başlıklar Bricolage Grotesque, gövde DM Sans. Ziyaret başına bir kez oynayan açılış koreografisi. Diğer hareketler sadece bir eyleme cevap verir. `prefers-reduced-motion` destekleniyor.

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
  - Sunucu, sonundan 90 sn öncesine kadar sinyal görmüşse binayı ekler (`buildings` tablosu: id, member_id, group_id, kind, minutes, seed, created).
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
