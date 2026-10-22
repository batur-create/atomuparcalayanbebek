# Doğrulama ve sınırlar

## Bu paket için gerçekten yapılanlar

- Güncel uzak `kutup-platform` alındı: `395c9b11acf5396484280b4bc405948bb484f5c3`. Ayrı çalışma ağacı kullanıldı; diğer geliştirme dalları değiştirilmedi.
- Katalog/özel kayıt, ortak çizim, yapım planı, açıklamalar, metraj/hakediş, ölçek/ölçüm, yerleşim ve ilgili testler koddan incelendi.
- `node --test tests/site.test.js tests/koy-b.test.js tests/koy-e.test.js`: **35/35 geçti**. Aşama/çizim/denetim/açıklama, 48 model sözleşmesi, yerleşim, desteklenen ayna yönleri, uzun büyüme ve ortak proje senaryoları dahil. Tam test günlüğü `kanitlar/ilgili-testler.txt`.
- Ek tarama: **48 katalog modeli, 31 özel model, 14 plan nadiri, 812 zaman dilimi**. Tüm zaman dilimlerinde açıklama ve 0–1 arası kesintisizlik; her dilimin üç iç noktasında sonlu şantiye çizimi/çalışma yüksekliği/hakediş; bitmiş çizimde 3 ayrıntı × 2 ışık × 2 ayna yönü denendi. Tarama bulgusu **0**. Başlangıç/bitiş hakedişi bütün modellerde 0/100. Ham çıktı `kanitlar/model-denetimi.json`.
- `npm run build`: geçti. Vite'ın büyük çıktı parçası uyarısı mevcut; uyarısız performans kanıtı olarak sunulmaz.
- `python tests/koy_b.py --out ... --only atlas`: 48 model atlası güncel çizimden üretildi, tarayıcı JavaScript hatası 0.
- Dört yapının dört durumunu gerçek `ConstructionScene` bileşeniyle gösteren şantiye referansı üretildi. Görsel ve ham sonuç referans klasöründe.

Tarama aracı `araclar/model-denetimi.mjs` ve şantiye görsel aracı `araclar/insaat-referansi.py` repo kökü olarak `kutup/` ister. Gelecekte modeli değiştirdikten sonra ilgili kontroller yeniden çalıştırılır; bu paketin sonucu yeni değişikliği otomatik doğrulamaz.

## Kanıtın sınırı

Bu çalışma yeni bina üretimi değildir; uygulamanın ürün kodu değiştirilmedi. 35 test, bütün uygulamanın bugünsüz/hatasız olduğunu ispatlamaz. Yalnız ilgili teknik tabanı kontrol eder. Önceki köy PR'ının tam 268 test sonucu bu pakette yeni koşulmuş gibi sayılmadı.

Teknik tarama geometrinin tarihî doğruluğunu, estetik kaliteyi veya bütün animasyonların kusursuzluğunu kanıtlamaz. Şantiye referansı durağan ve hareket azaltma açık; animasyon performansı kanıtı değildir. Atlas ile şantiye görselleri üretim bileşenleriyle izole test ortamındadır; güncel canlı kullanıcı ekranı değildir. Gerçek uygulama yakın/gece görselleri sentetik, daha önce alınmış PR #68 kanıtıdır.

Gerçek Android/iPhone cihazı, dağıtılmış Worker CPU süresi, bütün mimari ölçülerin dış kaynaklardan doğruluğu, bütün modellerin bütün açılarda ayrıntılı görsel incelemesi ve gerçek bir yeni bina isteği henüz doğrulanmadı. Her gerçek yapı işinde gerekenler ayrıca tamamlanır. Büyük eski dökümlerde güncelliğini yitirmiş odak/yayın davranışları var; mevcut kod önceliklidir.

## İleride yeni yapı için kabul

1. Onaylanan mimari tarif/önizleme ve güncel iş listesiyle uyum.
2. Modelin katalog, şantiye, teslim ve köyde aynı mimariyi göstermesi.
3. Yapıya uygun sıralı aşamalar, anlaşılır açıklamalar, anlamlı işçi/makine ve malzeme hesabı; son aşamadan bitmiş modele yanlış sıçrama olmaması.
4. Ölçülmüş alan, doğru giriş/erişim, arazi bağlantısı, iki ayna yönü ve değişmez eski kazanımlar.
5. İstenen kazanım/kilit/süre/maliyet davranışının doğru olması; ödül veya kalıcı bina çoğaltılmaması.
6. Yakın, uzak, köy içi ve gece görsel kontrolü; aşama sınırları, derinlik ve taşma kontrolü.
7. İlgili testler ve son entegrasyonun zorunlu kontrolleri; gerçekçi ortam/performans sınırlarının açıklanması.
8. Kod, kaynaklar, onay kaydı, görsel kanıt ve somut eksikler birlikte teslim. Ürün kodu PR'ı ile canlı yayın ayrımı.

Yeni bir yapının özel etkileşimi, bonusu veya sürekli hareketi otomatik kabul kriteri değildir; onaylanan kapsam belirler.
