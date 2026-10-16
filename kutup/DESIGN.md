# Kütüp tasarım rehberi

Görsel bir işe başlamadan önce bunu oku. Öncelik sırası: Batur'un sözü → bu rehber → senin zevkin. Burada yazmayan bir karar çıkarsa Batur'a görsel önizlemeyle sor, cevabını bölüm 9'a ekle.

## 1. Genel his

- Sakin, sıcak bir kâğıt zemin üstünde yumuşak pastel renkler. Kütüphane defteri ile küçük bir köyün karışımı gibi bir dünya.
- Oyunsu ayrıntılar küçük ve yerinde: eğik "damga" etiketleri, kesik çizgili daireler, küçük yıldızlar. Gösteriş değil, sıcaklık.
- Şantiye ve köy çizimleri inşaat mühendisi gözüyle doğru olur; ayrıntı bu sitenin kimliği.
- Telefon önce: iPhone Safari ve ana ekran uygulaması. 375 px'te (360'ta da) taşma yok, dokunulan her şey en az 44 px, hover'a bağlı kontrol yok, safe-area'ya uyulur.

## 2. Renk

Bütün renkler `src/styles.css` başındaki değişkenlerden gelir. Koda yeni sabit renk yazma; gerekiyorsa önce değişken ekle ve koyu değerini de ver.

| Değişken | Açık | Koyu | Ne için |
|---|---|---|---|
| `--canvas` | `#f6f5f0` | `#181916` | sayfa zemini |
| `--paper` | `#fffefb` | `#22231f` | kartlar |
| `--ink` | `#30312f` | `#ebeae4` | ana yazı |
| `--muted` | `#6f7169` | `#a5a69c` | ikincil yazı |
| `--border` | `#e8e7df` | `#383933` | kenarlar |
| `--accent` | `#7361ce` | `#8272d8` | tek vurgu (lila tema) |
| `--accent-deep` | `#5c49b6` | `#c4b9f5` | vurgu üstünde yazı |
| `--accent-soft` | `#efebfc` | `#2d2940` | vurgu zemini |
| `--hero` | `#e8e3f6` | `#2b2840` | büyük alanlar |

- **Üye renkleri** (pastel): `--mint`, `--peach`, `--pink`, `--blue`, `--lilac`, `--lemon`. Avatar diskleri ve kişiye ait alanlar bunlardan gelir.
- **Temalar:** `lilac` (varsayılan), `mint`, `peach`, `pink`, `blue`; `html[data-theme]` ile değişir (`src/api.js` `THEMES`). Vurgu rengini sabitleme, temayla değişebilsin.
- **Koyu mod:** `html[data-mode="dark"]`, değerler `src/dark.css`'te. Otomatik mod Ankara'da gün batımında koyulaşır. Her yeni ekran ve çizim koyu modda da kontrol edilir.
- Bir ekranda vurgu rengi tek bir şeyi öne çıkarır. Parlak, doygun, neon renk yok.

## 3. Yazı

- **Gövde:** DM Sans. **Başlık ve büyük sayılar:** Bricolage Grotesque Variable. Başka yazı tipi ekleme.
- Arayüz yoğun ve küçük puntolu: etiket ve ek bilgi 10–12 px, kart içi metin 13 px, normal metin 14–16 px, başlıklar 21–27 px, en büyük 35 px.
- **Etiket stili:** 10 px, kalınlık 800, harf aralığı 1.2 px, yanında küçük vurgu noktası (`.murekkep-label` örneği).
- Kalınlıklar: 400, 500, 600, 650, 700, 800.

## 4. Şekil ve yüzey

- **Köşeler:** büyük kartlar 18–24 px, düğme ve küçük kartlar 9–13 px, çipler tam yuvarlak.
- **Kenar:** 1 px `var(--border)`. Derinlik kenar ve zemin tonuyla verilir.
- **Gölge:** neredeyse yok; varsa çok hafif (saydamlık %3–9). Kalın, koyu gölge kullanma.
- **Küçük süsler:** eğik damga etiketi (yaklaşık −8°), kesik çizgili yörünge dairesi, vurgu renginde küçük yıldız. Ölçülü kullan.

## 5. Çizim dili (Kara, avatarlar, rozetler, maskot sahneleri)

Bütün karakter ve rozet çizimleri Kara'nın dilinden türer (`shared/avatars.js` başı):

- Koyu kontur `#25242d`, kalınlık 2.2–2.4 (100'lük kutuda), uçlar ve köşeler yuvarlak.
- Sakin, düz renkler. Aydınlık yüz için tek bir açık ton; degrade yok.
- **Yok:** yanak kızarıklığı, beyaz "çıkartma" kenarı, parlak ya da neon renk, kalın çizgili çizgi film tarzı.
- **Kadro sitenin kendi dünyasından gelir:** Kara gibi kediler, kütüphaneci, çaycı, baretli usta, kara delik, köylüler. Rastgele hayvanlar ya da hazır ikon setleri kullanılmaz.
- Arka plan üyenin kendi pastel rengi. Aynı SVG her yerde kullanılır: sayfada ve köy haritasında (canvas).
- Küçük boyda okunur olmalı: 42, 32 ve 25 px'te, açık ve koyu modda kontrol et.
- Yeni çizimler `shared/avatars.js`'teki kalemleri (`p`, `line`, `circ`, `ell`) kullanır.

**Kara (maskot):**
- Doğal bir kara kedi; siyah ya da füme tüy, kehribar gözler. Kara deliği anımsatır ama gerçek hayatta görülebilecek bir kedidir.
- Fantastik galaksi deseni ya da doğa dışı göz yok. Statik resim ya da GIF değil, kodla yaşayan bir SVG (`src/LiveMascot.jsx`).
- Batur'un en güçlü isteği: "canlı yaşaması en çok etkiliyor bence."
- Eski adı Mürekkep; CSS'teki `murekkep-*` sınıfları bu yüzden.

## 6. Köy ve şantiye

- İzometrik çizim. `src/iso.js` ilkelleri (`STONE`, `WOOD`, `box`, `outline`, `poly`) aynı kodla hem SVG hem canvas çizer.
- Şantiye gerçek betonarme sırasıyla ilerler. Parçalar yerleştirilir, serilir ya da dökülür; solarak belirmez.
- Gün ışığı ve mevsim: `villageWorld.js` `skyAt()`. Gün batımı, gece gökyüzü ve yanan pencereler, kışın kar, ilkbaharda çiçek.

## 7. Hareket

Batur'un isteği (16 Ekim, n18): "vay be her şey nasıl da canlı ve dinamik" dedirten bir site. İlke: **düzen sakin, dünya canlı.**

- **Düğmeler yerinde durur.** Neye basılacağı hiç yer değiştirmez; hareket düzeni bozmaz.
- **Hareket bir şey anlatır.** Gökyüzü saati, kartlar kimin geldiğini, sayılar değişimi, köy odağı gösterir. Salt süs olan sürekli hareket yok.
- **Her dokunuşa küçük bir cevap:** basınca hafif küçülme (`whileTap` 0.94–0.98), seçimde yaylanan işaret, sonuçta kutlama (konfeti, damga) yalnız gerçek bir olayda.
- **His: oyunsu kâğıt.** Kartlar yay `stiffness 300, damping 24`; kutlamalar `220 / 14`; içerik geçişi 0.32 sn giriş, 0.16 sn çıkış. Kademe öğe başına 60–120 ms, toplamı 500 ms'yi geçmez. CSS'te `--ease-out` ve `--ease-spring` (`src/motion.css`).
- **Araç:** Motion (`motion/react`, sürüm 13.5.0) yalnız `m.*` bileşenleriyle, `LazyMotion` içinde; motor `src/motionFeatures.js` ile tembel yüklenir. Basit tek seferlik hareketlerde tarayıcının kendi `element.animate` yeterli. Sürekli süs döngüleri CSS keyframes ile.
- **Açılış** ziyaret başına bir kez oynar, sekme değişiminde tekrar etmez.
- **Pil ve erişilebilirlik:** yalnız `transform` ve `opacity`. Ekran dışındaki ve arka plandaki döngüler durur (`.paused`). `prefers-reduced-motion` açıkken Motion hareketleri (`MotionConfig reducedMotion="user"`) ve CSS döngüleri kapanır. Odak ekranı açıkken arka plan sakin.

## 8. Metin tonu

- Türkçe, samimi ama sade. Kısa cümleler. İngilizce terim yok.
- Düğme ne yapacağını söyler ("Geldim", "Ekibi çağır").
- Emoji ölçülü. Arayüz simgelerinde ince çizgi simge tercih edilir (n16'da Batur çizgi simgeyi emojiye tercih etti).

## 9. Onaylananlar ve reddedilenler

Her görsel kararda buraya bir satır ekle. Ayrıntı KARARLAR.md'de, işin kodu altında.

- ✔ **n13 avatarlar:** Kara'nın çizim dili, sitenin dünyasından kadro. 4 örnek gösterildi, Batur onayladı.
- ✘ **n13 ilk deneme:** kalın çizgi, çıkartma kenarı, canlı renkler, rastgele hayvanlar. Batur: "siteyle alakası yok". Siteye bakılmadan çizilmişti.
- ✔ **n16 tema düğmesi:** çandaki gibi ince çizgi simge (güneş, ay, yarım güneş). Emoji seçeneği seçilmedi.
- ✔ **n15 karanlık tema:** gün batımında otomatik koyulaşır; Kara ay ışığı dairesinin önünde durur.
- ✔ **Kara:** doğal kara kedi, kehribar gözler, kodla yaşayan SVG. Statik görsel istenmedi.
- ✔ **n17 menü (B):** 4 sekme (Kütüp, Köy, Pano, Ben), ☰ yok, planlar ana sayfada "Kim ne zaman geliyor?", ana eylem Geldim. A (5 sekme) seçilmedi.
- ✔ **n18 canlı ana sayfa:** saatle değişen gökyüzü kartı (köy, Milli Kütüphane silueti, vinç, değirmen), gelişte kart dönüşü + "GELDİ" damgası + kütüphaneye yürüyen figür, Geldim'de konfeti, kayan sekme işareti. 25 sn'lik video önizlemesiyle onaylandı.

## 10. Görsel bir iş nasıl yapılır

1. Bu dosyayı oku, KARARLAR.md'de işin alanıyla ilgili kayıtlara bak.
2. İşin dokunduğu ekranların görüntüsünü al: 375 px, açık ve koyu. Yan paneldeki tarayıcıda `resize_window` ile mobil boyuta geç. Batur'a gösterilecek net görüntü için Playwright betiğini kullan (HANDOFF.md, "Net ekran görüntüsü").
3. Gerçek uygulamanın içinde 2–3 seçenek ya da örnek hazırla. Batur'a görüntüyle sor.
4. Seçilen yönle yap. Küçük boyları ve koyu modu kontrol et.
5. Bitince bölüm 9'a bir satır ekle, KARARLAR.md'ye kayıt yaz.
