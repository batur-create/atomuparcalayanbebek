# İkinci üs: Kütüp arkadaşın bilgisayarında (17 Ekim 2026)

Batur'un kendi Claude hesabının haftalık sınırı 22 Ekim gece 01:00'e kadar dolu. Bu sürede Kütüp işleri Batur'un arkadaşının bilgisayarında, **arkadaşın kendi Claude hesabıyla** yapılır. Bu dosya hem kurulum hem de oradaki Claude'a yapıştırılacak devir promptudur.

## 1. Kurulum (bir kez)

1. Kur: Git, Node 22.13 veya üstü, Python 3 (`pip install playwright`; Chrome ya da Edge yüklü olsun), Claude masaüstü uygulaması (Code sekmesi, arkadaşın kendi hesabı), bir GitHub hesabı.
2. GitHub'da https://github.com/batur-create/atomuparcalayanbebek sayfasında **Fork**.
3. Terminalde:
   ```sh
   git clone https://github.com/batur-create/atomuparcalayanbebek.git
   cd atomuparcalayanbebek
   git checkout kutup-platform
   git remote add fork https://github.com/<github-kullanıcı-adın>/atomuparcalayanbebek.git
   cd kutup
   npm ci
   npm run test:all
   npm run test:browser
   ```
   `test:all` 99 test, `test:browser` 66 kontrol; hepsi yeşil olmalı. Yerel sunucu gizli bilgi istemez: `kutup/data/` ilk açılışta kendi yerel anahtarını üretir.
4. Depo kökünde `.claude/launch.json`:
   ```json
   { "version": "0.0.1", "configurations": [
     { "name": "kutup", "runtimeExecutable": "npm", "runtimeArgs": ["--prefix", "kutup", "run", "dev"], "port": 3001 } ] }
   ```
5. Batur `Kara-v2.zip`'i (ChatGPT'nin Kara paketi) gönderir. Deponun **dışında** bir klasöre aç (ör. `Masaüstü/kara-v2`).
6. Claude Code'u depo kökünde aç, bölüm 5'teki promptu yapıştır.

## 2. Sınırlar

- **Yapılır:** kod, testler, yerel sunucu, ekran görüntüleri, kendi `claude/...` dalını `fork`'a push, `kutup-platform`'a PR.
- **Yapılmaz:** yayın (Cloudflare girişi yalnız Batur'un bilgisayarında), canlı veritabanı, `ADMIN_KEY`, gerçek üye verisi. `kutup/data/` commit'lenmez. Batur'un `main` ya da `kutup-platform` dalına doğrudan push yok (fork'la zaten erişim yok).
- İş panosu (claude.ai artifact) Batur'un hesabında; buradan açılmaz. Sıradaki işlerin tam tanımı bölüm 6'da.

## 3. Bir paketin akışı

1. `git fetch origin && git switch -c claude/<kod>-<kisa-ad> origin/kutup-platform`
2. Görsel işse önce Batur'a görüntü göster (ekran görüntüsünü arkadaş Batur'a iletir), onay gelince yap.
3. `npm run test:all` ve `npm run test:browser` yeşil. Yeni özelliğe test ve tarayıcı kontrolü ekle. Yavaş telefonda ölç (Chrome DevTools, CPU 4× yavaşlatma, 375 px).
4. Kayıtları aynı dalda yaz: `KARARLAR.md` kaydı ve dizin satırı (commit yerine "PR"), görsel kararsa `DESIGN.md` §9'a bir satır, `HANDOFF.md` 6b notu. Worker kimliğini Batur yayından sonra ekler.
5. `git push fork <dal>`. PR: taban `batur-create/atomuparcalayanbebek` → `kutup-platform`. Açıklamada: ne yapıldı, testler, göç var mı, canlı duman testine eklenen adım, **pano güncellemesi** (hangi kart `done`, kararlar).
6. Batur'a Türkçe kısa rapor.

Commit mesajları İngilizce.

## 4. Batur'un tarafı: yayın (Claude gerekmez)

PR'ı GitHub'da "Create a merge commit" ile birleştir. Sonra `C:\Users\İzzettin\bilim-dunyasi\kutup-platform\kutup` içinde:

```sh
git pull origin kutup-platform
npm ci
npm run test:all
node scripts/owner-backup.mjs <is-kodu>
npm run deploy
node tests/live-smoke.mjs
```

`owner-backup.mjs` yalnız PR göç içeriyorsa gerekir ve deploy'dan **önce** çalışır (göçler ilk istekte kendiliğinden uygulanır). Anahtarı ekrana basmaz. Duman testinin "push: members N/N bound" satırı aboneliklerin korunduğunu gösterir. Pano kayıtları 22 Ekim'den sonra Batur'un Claude'uyla PR açıklamalarından işlenir.

## 5. Devir promptu (oradaki Claude'a aynen yapıştır)

> Sen Kütüp projesinde çalışan geliştiricisin. Bu bilgisayar Batur'un arkadaşının; Batur'un kendi Claude'u 22 Ekim'e kadar dinleniyor. Önceki sohbetlere erişimin yok; gereken her şey depoda.
>
> **Proje:** Kütüp, Milli Kütüphane'ye (Ankara) giden arkadaşlar için gerçek zamanlı buluşma ve odak PWA'sı. Canlı: https://kutup.ahmetbaturkaplanoglu.workers.dev (Cloudflare Workers + D1, React 18 + Vite). Kod `kutup/`, dal `kutup-platform`.
>
> **İlk iş:** `kutup/IKINCI-US.md` (bu dosya: sınırlar, akış, sıradaki işler), `kutup/HANDOFF.md` bölüm 0, 3, 5 ve 6b, görsel işte `kutup/DESIGN.md`, `kutup/KARARLAR.md`'nin yalnız dizini (işin koduyla `### n24` gibi ara). HANDOFF §0'daki pano adımı burada geçersiz; tanımlar IKINCI-US.md §6'da.
>
> **Batur'un kuralları:**
> - Görsel işte önce siteye bak, Batur'a görsel önizleme göster, onayıyla yap. Teknik kararları kendin ver; soru yağmuru yok, gerçekten Batur'a ait karar varsa tek kısa soru.
> - iOS öncelikli: arkadaşlar iPhone'da, Safari ve ana ekran uygulaması (PWA).
> - Basılabilir görünen her şey işe yarar bir şey yapar; yapmıyorsa basılabilir görünmez.
> - Sadelik = akışta tekrar yok; görsel şölenden vazgeçmek değil.
> - Renkler `src/themes.css` jetonlarından. SVG içinde sonsuz döngülü animasyon yok. "Hareketi azalt" her zaman çalışır.
> - Her işin başında kısa araç taraması; üçüncü taraf indirme ve kurulum Batur'un onayıyla, kod çalıştırılmadan önce okunur.
> - İş ortasında gelen yeni fikir: tam tanımıyla sıraya yaz, eldeki işe devam et.
> - Yayın yapma, canlı veriye dokunma, `kutup/data/` commit'leme, yalnız `fork`'taki kendi `claude/...` dalına push ve PR (IKINCI-US.md §2–3).
>
> **Konuşma:** Klavyede Batur ya da arkadaşı olabilir. Türkçe ve samimi yaz ("aga"). Onay Batur'dan gelir.
>
> **Sıradaki iş:** Kara v2 (IKINCI-US.md §6).

## 6. Sıradaki işler (17 Ekim pano görüntüsü)

Sıra: **Kara v2 → n24 → n28 → n29 → n30 → n14.** n30 ve n14'ün tanımı eksik; başlamadan Batur'a sor.

### Kara v2: ChatGPT'nin yeni Kara çizimini yerleştir
Kara, Kütüp'ün kedi maskotu (n06): `src/Kara.jsx`, `src/kara.css`. `KaraRig` 200×240 viewBox, taban çizgisi y = 171; `data-pose`, `act`, `blink`, `wink` alır. `KaraHome` ana sayfa gökyüzünde çatıda (`at(290,134)`, `span(62)`), `KaraBuddy` odak kartında. Hareketler `ACTS`/`LASTS` zamanlayıcısıyla.

Paket (`Kara-v2.zip`): `Kara.jsx`, `kara.css`, `Kara.svg`, `Kara-Canli-Onizleme.html`, `NOTLAR.md`, ekran görüntüleri. e10c30a2 tabanlı; `kutup-platform` o zamandan ileri gitti. ChatGPT'nin dediği:
- Korunan: `KaraRig` arayüzü ve data-attribute'ları, 200×240 kutu ve y = 171, `KaraHome` ve `KaraBuddy` çağrıları, eski `ACTS`/`LASTS` anahtarları.
- Eklenen: 34 davranış (77 eklem klibi), 2,5B baş dönüşü; 6 sürpriz (7 dokunuşta kara delik bir yıldızı yutar, 00:00–00:04 aya bakış, ekip tacı, 120 sn hareketsizlikte ateş böceği, okşayınca mırlama ve yoğurma, kara deliğe tepki); aksesuarlar (baret, gözlük, kitap, Aralık–Şubat bere `kara-winter`, molada çay bardağı `kara-tea`); `KaraSpot`'a isteğe bağlı `context` (`id`, `groupId`, `now`, `season`, `break`, `allHere`, `surface`); test olayı `kutup:kara-test`.

Yöntem:
1. Paketin kodunu oku, bizim `Kara.jsx`/`kara.css` ile karşılaştır. Bütün çağrı yerlerini kontrol et (`grep -rn "KaraHome\|KaraBuddy\|KaraSpot\|KaraRig" src`).
2. SVG'de sonsuz döngü yok; "hareketi azalt" açıkken Kara durgun.
3. Yavaş telefonda ölç. Eski Kara ana iş parçacığına yaklaşık 6 puanlık meşguliyet ekliyordu; yenisi bunu belirgin aşmasın.
4. Sitede ekran görüntüleri: ana sayfa gündüz ve gece, çatı, odak kartı, telefon 375 px, koyu tema. Batur'a göster, onay gelince yerleştir.
5. Ana sayfadaki "ders arası" pulunu (`src/Home.jsx`, "ders arası hayat") Kara'nın bir cümlesine bağla.
6. `tests/browser_smoke.py` Kara kontrollerini güncelle: vektör iskelet, uyku, dokunma, mırlama, hareketi azalt, tasma rengi temayı izler, odak arkadaşı, hareketler, bakış.

### n24 · Ses turu: daha gerçekçi, kaliteli sesler (teknik, hazır)
Ses mikserindeki sesler (yağmur, kütüphane, şömine, orman, dalga, kafe, kahverengi gürültü, kara delik) daha gerçekçi ve kaliteli olsun. Batur (16 Eki): "daha iyi, daha gerçekçi, daha güzel sesler, daha kaliteli üretebiliriz." Bugün `src/Sound.jsx` sesleri kodla üretiyor. Açık: kodla üretimi iyileştirmek mi, lisansı uygun (CC0) gerçek kayıtlar mı? Dosya boyutu ve çevrimdışı çalışma gözetilir. Önce her sesin eski ve yeni örneği Batur'a dinletilir. Bitti: Batur beğendi, iPhone'da çalıyor, uygulama boyutu makul.

### n28 · Haftalık hikâye (Kütüp Wrapped) (görsel, hazır)
Pazar akşamı Instagram hikâyesi gibi tam ekran, dokundukça ilerleyen, hareketli haftalık özet. Batur: "Instagram'da paylaşıp vay be dedirteceğin bir şeyler", "bir şeyler giriyor, vuruyor, çıkıyor, tak tuk tuk". Kartlar: ekipçe kaç saat, en çok kim geldi, en uzun seri, gece kuşu / sabah erkencisi, yükselen binalar, anıt, Haftanın Ustası, kişiye özel "senin haftan". Dokununca ilerler, basılı tutunca durur. Paylaş: PNG ya da kısa video. Pazar akşamı bildirim "Haftanın hikâyesi hazır". Video için aday araç: howseen-ai/claude-motion-design (araç taraması kuralıyla). Açık: hangi kartlar, kişisel kart herkese mi, video mu görsel mi. Bitti: haftalık veriden doğru, 375 px'te akıcı, paylaşma çalışıyor, Batur onayladı.

### n29 · Anında ve hızlı (teknik, hazır)
(1) Cloudflare'de 5 sn'lik yoklama yerine Durable Objects + WebSocket hibernation (ücretsiz planda kullanılabilirliği önce doğrula; yoklama yedek kalır). (2) ~2.900 satırlık `App.jsx`'i modüllere böl (Focus, Board, modallar). (3) Tembel yükleme: `/batur` paneli, odak ekranı, katalog, istatistik, köy haritası. (4) Son durumu cihazda saklayıp anında açılış. Göç gerekirse PR'da açıkça yaz (Batur yedek alır). Bitti: bir gelişin başka telefona yansıması < 1 sn, ana paket küçüldü, tüm testler yeşil.

### n30 · Masa haritası (görsel, tanım eksik)
Salon seçimi, salonun basit kuşbakışı çizimi, masa numaraları, arkadaşların avatarları masalarında, boş masaya dokununca yer seçimi; mevcut salon + masa verisiyle. Başlamadan Batur'dan salonların fotoğrafı ya da krokisi gerekir.

### n14 · Başarımlar (görsel, tanım eksik)
Önerilen: ilk inşaat, seri günleri, gece kuşu / sabah erkencisi, maraton, imece ustası, koleksiyoncu, Haftanın Ustası, anıt ustası, gizli başarımlar (kara delik kâşifi gibi); profilde rozet vitrini, kazanınca kutlama. Başlamadan Batur'a: liste ve eşikler, tuğla ödülü, rozetler başkalarına görünsün mü, kutlamanın dozu. Önce liste ve 2–3 rozet çizimi gösterilir. Bitti: hak edilenler geriye dönük açılır, testler var, vitrin 375 px'te taşmaz.
