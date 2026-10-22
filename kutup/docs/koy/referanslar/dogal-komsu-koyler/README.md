# Doğal komşu köyler — C tasarım referansı

Bu klasör, Kütüp köy yerleşimi uygulaması üzerinde çalışan agent için kullanıcı talebiyle eklenmiştir. Uygulama kodu değişikliği içermez.

## Dosyalar

- [Tam karşılaştırma paketi](kutup-koy-oylama-paketi.zip): 15 SVG, 15 PNG, 15 sayfalık PDF, çevrimdışı HTML galerisi ve okuma/doğrulama notları.
- [C — 47 bina](C-47.png)
- [C — 200 bina](C-200.png)
- [C — 500 bina](C-500.png)

ZIP içindeki ilgili düzenlenebilir referanslar: `svg/C-47.svg`, `svg/C-200.svg`, `svg/C-500.svg`.
A/B eski ve mevcut yaklaşımın karşılaştırmasıdır. D/E uygulanacak seçenekler değildir.

## En önemli ayrım

PDF, SVG ve buradaki PNG'ler şematik tasarım çizimleridir; gerçek uygulamanın ekran görüntüleri değildir. Basit çizim tarzı, ağaç çizimleri veya sunum arayüzü uygulamaya kopyalanmamalıdır.

Görsel kalite referansı güncel uygulama ve kullanıcının uygulamadan verdiği ekran görüntüleridir. Mevcut bina modelleri, özel yapılar, detaylar, izometrik görünüm, ışık/gölge, gece/gündüz, canlılık ve etkileşimler korunmalıdır. Yeni coğrafya aynı sanat tarzında tamamlanmalıdır. Çözüm gerçek uygulamanın mevcut çizim sistemi içinde çalışmalıdır.

## Çizimlerden sonraki kullanıcı kararı — yazılı gereksinim önceliklidir

C'nin dışa doğru fazla uzun kollara dönüşen büyümesini aynen uygulamayın. Yeni sürüm:

- Araziye uyan, düzensiz fakat daha dolgun kişisel yerleşim kümeleri oluşturmalı.
- Her kullanıcının kalıcı, tanınabilir merkezi olmalı.
- Uygun iç boşlukları ve yakın, bağlantılı büyüme cephelerini değerlendirmeli; bahçeleri ve doğal açıklıkları doldurmamalı.
- Komşu köyler yakın kalmalı; aralarında kısa koruluklar, bahçeler, doğal boşluklar ve az sayıda ortak meydan/geçiş bulunmalı.
- Dört eşit bölge, simetrik dört yaprak, dikdörtgen parseller veya sürekli sınır duvarları oluşturmamalı.
- Önce tutarlı coğrafya oluşmalı; köyler ona uyum sağlamalı. Kıvrımlı ana akış, gerektiğinde yan kollar ve bağlantılı göller doğal ve erişilebilir yerleşimler sağlamalı.
- Çizimdeki merkez koordinatları, sokak şablonları ve mesafeler birebir uygulanacak bir şartname olarak alınmamalı.

## Senaryolar ve kanıtın sınırı

Dört örnek kişinin bina sayıları:

| Toplam | Batur | Bensu | Sıla | Ediz |
| --- | ---: | ---: | ---: | ---: |
| 47 | 17 | 13 | 10 | 7 |
| 200 | 65 | 50 | 45 | 40 |
| 500 | 250 | 120 | 80 | 50 |

İsim ve envanterler sentetiktir; canlı kullanıcı verisi değildir. Dört kullanıcı bir doğrulama senaryosudur, ürünün desteklediği üye sayısı için yeni bir sınır değildir.

C/D/E çizimleri doğrulanmış üretim planlayıcısı çıktısı değildir. Büyüme adaleti, erişim, çakışma, eşzamanlılık ve mobil performans uygulamada ayrıca doğrulanmalıdır. Referans paketi tek başına teknik şartname değildir; kullanıcının son uygulama promptu ve güncel depo esas alınmalıdır.

A/B örnekleri `a2ef2311c141b13c543e73bcb3eba3dd7d1f5b1d` sürümündeki koddan sentetik veriyle üretilmiştir. B'de bu örnek tohumda bir Süleymaniye yerleştirilemediği için 46/199/499 yapı görünür. Bu, tüm köyler için genellenmiş bir sonuç değildir.

## Devam eden çalışma

Agent başlamışsa mevcut değişikliklerini koruyarak bu klasörü kendi çalışma dalına almalıdır. Referans eklemek için çalışma ağacı sıfırlanmamalı veya uygulama değişikliklerinin üzerine yazılmamalıdır.

ZIP SHA-256: `f193f7bc7e2bb31cb2cb0a4d7ac3f237161c17c2416d18add6fd8e555c3dcd09`
