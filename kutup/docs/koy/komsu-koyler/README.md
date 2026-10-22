# C — kompakt komşu köyler: uygulama ve doğrulama

22 Ekim 2026. Taban `19bde5aa`; çalışma dalı `codex/compact-neighbor-villages`. Yeni yerleşim **generator 3 / terrain 2**. Veritabanı şeması değişmiyor. Yayın veya canlı düzen etkinleştirmesi yapılmadı.

Kullanıcı referansı: [C paketi](../referanslar/dogal-komsu-koyler/README.md). C-47, C-200 ve C-500 okundu. Koordinatlar ve uzun büyüme kolları kopyalanmadı. A/B karşılaştırma; D/E kapsam dışında. Bu klasördeki PNG'ler ise yerel sunucuda oturum açılmış **gerçek React uygulamasının** görüntüleridir; çizim veya görüntü üretim aracı kullanılmadı. Üyeler ve envanter sentetik.

## Görüntüler

| Görünüm | Çalışan uygulama |
|---|---|
| Önce, aynı 47 yapı | [Önce](once-47.png) |
| 47 yapı, 17/13/10/7 | [Genel](47-genel.png) |
| 200 yapı, 65/50/45/40 | [Genel](200-genel.png) |
| 500 yapı, 250/120/80/50 | [Genel](500-genel.png) |
| Mimari ayrıntı | [Yakın](47-yakin.png) |
| Aynı sahnenin gece ışığı | [Gece](47-gece.png) |
| Komşu merkezine geçiş | [Geçiş](47-gecis.png) |

Uzak görünüm mevcut LOD'u kullanır; yaklaşınca aynı bina kendi ayrıntılı modeliyle çizilir. Yapıların fiziksel ölçeği değişmez. Model sözleşmelerinin 48 çizimle eşleşmesi test ediliyor.

## Yerleşim nasıl değişti?

- Her üyeye kalıcı bir merkez ayrılır. Bilinen üyeler taslak başında birlikte değerlendirilir; ilk büyüyen kişi diğerlerinin başlangıç noktasını alamaz. Geç katılan üye için sınırlı aramayla yeni merkez eklenir. Dört kişi sınırı yok; 12 üye ve sonradan katılım da doğrulandı.
- Seçim yalnız mevcut sokakta ilk boş yeri bulup durmaz: açık sokaklar ve açılabilecek yakın sokaklar karşılaştırılır. Kişisel merkeze uzaklık, model parsellerinin toplam alanıyla ölçeklenen büyüme yarıçapı, yakın kişisel yapılar, yerel doluluk, kısa altyapı ve görünürlük birlikte değerlendirilir.
- Komşunun merkezindeki başlangıç/erişim açıklığı korunur. Temas bölgeleri sınırlı karışabilir; bütün arazi eşit ve kapalı kişisel parsellere bölünmez. Normal evin kişisel yerleşiminden kopuk uzak noktaya düşmesi, model boyutundan türetilen bağlantı mesafesiyle ayrıca reddedilir. Kıyı/ray gerektiren yapılar ve büyük eserler kendi bağlamlarını kullanır.
- Yoğun merkezde yüzlerce tıkalı yönü denemek yerine bağlantılı, daha az dolu sokak uçları değerlendirilir. Yönler ve uzunluklar tohumdan çeşitlenir. Komşu merkezleri arasında uygun kısa bağlantılar ve birkaç ortak buluşma noktası kurulabilir; bütün yolculuklar ana meydandan geçmek zorunda değildir.
- Ana su akışı, bağlı göl çıkışı ve korunan koru/çayır parçaları yapılardan önce oluşur. Korunan doğa veri olarak saklanır; yalnız ağaç dekoru değildir. Kıyı açıklığı, fener ve iskele erişimini de korur. Köprü ve hemzemin geçit yalnız uygun açı ve iki kullanılabilir yaklaşım olduğunda planlanır; gölün üzerinden keyfî yol geçirilmez.
- Üzerinde ev sığmayan köprü bir çıkmaz sayılmaz: geçiş, karşı taraftaki uygun devam sokağıyla birlikte açılabilir. Arama, geçiş derinliği ve son kontrol tekrarları sınırlıdır. Yer yoksa işlem açık hatayla durur; yapı sessizce envanterden çıkarılmaz.

Merkezdeki küçük isim/sayaç ve mevcut ahşap tabelalar yardımcı işaretlerdir. Sahipliği asıl sağlayan mekânsal kümelenmedir. Uzak etiketler çakışınca seyreltilir; yakın görünümde mimari önceliklidir. Büyük köy telefona bütünüyle sığmadığında ilk kamera kişinin kendi merkezine bakar.

## Korunan işlevler ve güvenilirlik

Mevcut `buildingSVG`, özel yapı modelleri, iki canvas, gece/gündüz, mevsim, LOD, canlı katman ve etkileşimler korunur. Yeni köprü ve merkez işaretleri aynı çizim yardımcılarını kullanır. Pazarın meydandan uzak olduğu durumda ziyaretçiler gerçek giriş yolunu kullanabilir; eser avlusuna kestirme çizerek duvardan geçilmez.

Şantiye ve kalıcı yapı aynı parseli kullanır. Başlatma/tamamlama makbuzları, iptal, yeniden bağlanma, sahiplik, taşıma ve rezervasyon yaşam döngüsü mevcut sunucu altyapısında kalır. Yeni merkez, yol ve parsel satırları aynı revizyon korumalı atomik veritabanı işlemiyle yazılır. Normal büyüme mevcut yapıların kimliğini, konumunu, ölçeğini veya coğrafyayı değiştirmez.

Anıtkabir'in 2.000 dakika hedefi, kişisel katkılar, haftalık anıt, tuğlalar, plan keşfi ve teslimat ekonomisi değiştirilmedi.

## Ücretsiz Worker için sınırlar

Yer araması mevcut module Web Worker yoluyla işlemi yapan kişinin tarayıcısında çalışır. Sunucu modeli, gerçek ayak izini, doğayı, erişimi, sahipliği ve revizyonu doğrular. Cloudflare hostunda yeni düzenin eksik/eski önerisi **409** ile reddedilir; sunucu pahalı aramaya geri düşmez ve ücret/şantiye yazılmaz. Başarılı isteğin makbuzla tekrarı yeni plan gerektirmez. Taşıma araması da tarayıcıda kalır. Taslağın ayrıntılı doğrulaması yeni düzende sekizer yapı üzerinden ilerler. Mekânsal indekslere ortak alanlar ve lamba engelleri de dahil edildi.

Bu, gerçek Cloudflare CPU ölçümü değildir. Yerel Node 24'te 500 yapılık durumda öneri doğrulaması için son örnek ölçüm: sıcak medyan **3,6 ms**, soğuk medyan **8,4 ms**, p95 yaklaşık **12,7 / 13,6 ms** (duvar saati; bütün HTTP/DB isteği değil). İlk soğuk ölçümlerde daha yüksek süreler de görüldü. Ücretsiz plandaki 10 ms CPU hedefi için canlı panel ölçümü hâlâ gereklidir; 500 yapıda bütün uçların sınırın altında kaldığı iddia edilmiyor. Hesabın Workers ayarı `standard`; abonelik bilgisi token yetkisi nedeniyle 403 döndü, dolayısıyla gerçek hesap planı doğrulanamadı. Yeni ücretli hizmet eklenmedi.

Tarayıcı ölçümü: masaüstü Chromium, 390×844 görünüm, hareket azaltma açık. 45 karelik kaydırmada medyan **16,6 ms**, p95 **26,6 ms**. 500 yapının dünya hazırlığı aynı makinedeki kayıt sırasında **471–751 ms** idi; bu ilk hazırlık/veri değişimi maliyetidir. Ölçüm sırasında diğer doğrulamalar da çalışıyordu. [Ham kayıt](tarayici-olcumu.json). Bu sonuç fiziksel telefon performansı veya tam animasyon yükü testi değildir. Gerçek Android/iPhone ve Cloudflare CPU doğrulaması yapılmadı.

## Doğrulama ve yeniden üretme

- `npm run test:all`: **268/268**, derleme, Node ve yerel Worker/D1 dahil.
- Gerçek tarayıcıda geçiş akışı: **15/15**; taslak, önizleme, geride kalma, eşitleme, tarayıcının seçtiği şantiye/hediye parseli ve bütün kazanımlarla geri dönüş.
- Gerçek React uygulamasında önce/47/200/500 sahneleri, yakınlaştırma, sürükleme ve dört üye düğmesi: JS hatası yok. [Kayıt](uygulama-kontrolleri.json).
- Üç farklı tohumun her birinde **aynı dünya** 47 → 200 → 500 olarak ilerletildi: dokuz sahnede eksik yapı veya bildirilen yerleşim kuralı sorunu yok. [Sonuçlar](buyume-sonuclari.json). Eski parseller ve kişisel merkezlerin değişmezliği ayrıca test ediliyor.
- 500 aşamasında kendi merkezine diğer merkezlerden daha yakın duran yapı oranı örneklerde yaklaşık **%88–99**. Bu estetik başarı kanıtının yerine geçmeyen bir kümelenme göstergesidir. Bazı ara büyüme cepheleri daha uzundur; bütün kümelerin daire olacağı iddia edilmiyor.
- 48 model, büyük eser, su/ray bağlamı, korunan doğaya ayak izi yerleştirme girişimi, sahte merkez sahipliği, 12 üye, sonradan katılım, eski generator-2 düzeninin yerinde eşitlenmesi ve Worker'ın eksik/eski planı harcamadan reddetmesi test edildi.

Yeniden üretme (yalnız geçici/sentetik veriler):

```sh
node scripts/koy/neighbours.mjs /tmp/komsu-sahneler komsu-1 komsu-2 komsu-3
node scripts/koy/seed-neighbours-app.mjs /tmp/komsu-uygulama /tmp/komsu-sahneler
python tests/neighbours_app_browser.py --data /tmp/komsu-uygulama --out /tmp/komsu-uygulama-gorseller
python tests/neighbours_browser.py --scenes /tmp/komsu-sahneler --out /tmp/komsu-cizim-olcumu
```

## Geçiş ve geri alma

Hiçbir ekip kendiliğinden taşınmaz. **Komuta merkezi → Ekipler → Köy düzeni** içinde yeni taslak hazırlanır. Önceden taslak varsa **Komşu köyler taslağını yeniden hazırla** yeni sürümü üretir. **Eşitle**, var olan taslağı veya önceki düzeni kendi sürümünde sürdürür; eski generator-2 düzeni sessizce yeni araziye çevrilmez.

Önizleme ve sunucu kontrolü tamamlanınca etkinleştirme kararı Batur'dadır. Mevcut 14 günlük önceki düzene dönüş mekanizması kullanılır; arada kazanılmış binalar korunur. Yeni düzen eski çizim motorlarına gösterilmez: eski istemci güncelleme ister. Canlı veri, yedek, yayın, ekip üyelikleri ve ekonomi üzerinde işlem yapılmadı.

Ana dosyalar: `shared/koy2/{planner,terrain,draft,switch}.js`, `src/koy2/{world2,life}.js`, `src/villageView.js`, `src/OwnerVillage.jsx`, `server/village{Spatial,Store,Switch}.js`, `worker/index.js`.
