# Plan keşfi ve altı özgün nadir yapı

20 Ekim 2026 · `codex/blueprint-discovery` → `kutup-platform` · Taban `1729a94e`

Batur 25 dk başına %5, 500 dk garanti ve haftalık yapıların kalıcı açılmasını onayladı; yeni plan/yapı ve daha fazla nadir istedi. Taban sürümün yayınını Worker `e2b7b449` ile kendisi doğruladı. Bu teslim ayrı PR; birleştirme/yayın Batur'da. Gerçek veri, bildirim veya canlı veritabanı kullanılmadı.

## Keşif kuralı

- Başarıyla sonuçlanan odak seansının **hak edilmiş dakikası** sayılır. Her 25 dakikada %5 çekiliş. 50 dk en az bir ödül %9,75; 75 dk %14,2625. Seansı bölmek avantaj sağlamaz. 25'in altında kalan dakika sonraki seansa taşınır.
- Ödülsüz 500 dakikada sahip olunmayan rastgele bir plan garanti. Aynı seans içindeki sonraki dakika yeni döngüye geçer; uzun seansta birden fazla farklı plan gelebilir.
- 7/14/30 günlük seri ödülleri ek olarak korunur. Hediye, Haftanın Ustası, seri veya haftalık yapıyı bitirme çalışma sayacını sıfırlamaz. Doğal şans/garanti ödülü sıfırlar.
- Havuz bitince açıkça tamamlandı yazılır ve yeni dakika bankalanmaz. Önceden kalan hak korunur; yeni plan gelince keşif devam eder. Sayaç yeni sürümden sonraki hak edilmiş seanslarla başlar; eski geçmişe rastgele ödül dağıtılmaz.
- Sıkı, Rahat, serbest ve ortak Anıtkabir görevleri aynı `s.credit` kaynağına bağlıdır. Başarısız inşaat ödül ilerletmez; kısmi serbest çalışmada yalnız mevcut kuralların onayladığı dakika sayılır.

## Kayıt, yarış ve kurtarma

Göç **31** eklemelidir; 1–30 değişmedi. `blueprint_progress` bir üye için tek kayıtla artık dakika, ödülsüz dakika, çekiliş sırası ve özel seed saklar. SHA-256(seed:sıra) çekilişi sabitler. Seed, normal üye/ekip/wallet yanıtına verilmez. Tekrarlanan veya eşzamanlı tamamlamada mevcut seans sonu ve ekip revizyonu koruması ödül ile ilerlemeyi aynı işlemde tutar. Yeni durum ve seçilen planların tamamı işlemde birlikte yazılır. Yeni servis/bağımlılık yok.

`blueprint_progress` mevcut owner yedek listesine eklendi. Göç ve 31 öncesi yedek kurtarması, açık döneminde tamamlanan mevcut Postane/Çay Ocağı kayıtlarından kalıcı plan çıkarır. Hediye ve dönem dışındaki yapılar hariçtir; eski silinmiş bir yapının artık bulunmayan kaydından hak çıkarılamaz. Mevcut planın kaynağı değiştirilmez. Bundan sonraki uygun tamamlamalar `source=weekly` kaydını ve makbuzdaki açıklamayı aynı işlemde yazar. Plan açıldıktan sonra binanın sonradan kaldırılması hakkı geri almaz. Güncel yedek çekiliş dizisini de aynen geri getirir.

## Altı yeni yapı

| Yapı | Çalışma | Malzeme | Kimliği |
|---|---:|---:|---|
| Ağaç Evi | 25 dk | 65 tuğla | Bağımsız ayaklar, canlı ağaç, balkon, ip korkuluk, merdiven |
| Japon Çay Evi | 25 dk | 55 tuğla | Kıvrık saçak, shoji panel, taş patika, fener, zen bahçesi |
| Su Değirmeni | 50 dk | 110 tuğla | Taş kaide, ahşap karkas, dere kanalı, mil ve çift halkalı çark |
| Tren İstasyonu | 50 dk | 115 tuğla | Saatli çatı, ray/travers, peron saçağı, banklar |
| Planetaryum | 75 dk | 190 tuğla | Parçalı yıldız kubbesi, bakır kuşak, takımyıldız, Satürn heykeli |
| Kristal Kütüphane | 75 dk | 180 tuğla | Çapraz çelik taşıyıcı, yarı saydam cam, kitap rafları, katlanan çatı |

Hepsi `rare=true`; eski iki nadir korunarak havuz sekize çıktı. Yeni yapılara ekonomik güç bonusu eklenmedi. Kurucu gözlemevi ayrı kaldı. Çizimler özgün Kütüp tasarımlarıdır; belirli tarihî yapının birebir modeli iddia edilmez. Katalog, hediye, SVG şantiye ve Canvas köy aynı geometriyi kullanır. Her biri kaide/taşıyıcı/kaplama/çatı/donanım/teslim sırasıyla, kendi malzeme/hakediş ve açıklamalarıyla gelir; fotoğraf veya renk varyasyonu değildir. İşçi ve vinç mevcut sisteme bağlanır. Ölçek/yerleşim aynı yer sınırlarına uyar. Tamamlanmış su çarkı statiktir; yeni sürekli animasyon veya pil yükü eklenmedi.

Anıtkabir'in final çizimi `src/imeceArt.js` ve ortak görev sistemi değiştirilmedi. Final model Köy → Bir Taş da Senden → ortak şantiyededir; tamamlanmış erken model önizleme düğmesi bu pakette eklenmedi. Önceki final görselleri `/workspace/artifacts/anitkabir-imece-motion/` altında.

## Arayüz ve doğrulama

Katalogdaki Plan keşfi kalan garantiyi ve eksik plan sayısını gösterir. Açılır açıklama eşit emek, artık dakika, rastgele eksik plan, seri/hediye, haftalık kalıcı hak ve malzeme/çalışma gereğini anlatır. Kilitli kart, Kara yardımı, kalıcı plan sayacı ve Yenilikler güncellendi. Tema jetonları ve 44 px açıklama kontrolü kullanılır.

- `npm run test:all`: **189/189**, üretim build'i + Node + yerel Worker/D1. Seans bölme eşitliği, artık dakika, 499→500 garanti, çoklu farklı ödül, boş havuz, iptal/başarısızlık, seri/hediye, eşzamanlı bitirme, seed gizliliği, geçmiş haftalık hak, göç ve yedek dönüşümü dahil.
- `npm run test:browser`: **100/100** mevcut arayüz denetimi.
- `npm run test:browser:imece`: **35/35**, mevcut ortak Anıtkabir akışı.
- Yeni `test:browser:blueprints`: **19/19**, gerçek Chromium/geçici veritabanı, katalog/garanti/kilit açıklaması/telefon genişlikleri/6 yeni yapının başlaması ve tamamlanması/koleksiyonun bitmesi. Yerel görseller `/workspace/artifacts/plan-kesfi/`.
- Tema kontrastı **252/252**. `git diff --check` temiz.
- Fiziksel iPhone ve üretim görünümü denenmedi. Mevcut yapı konumlarına veya canlıya dokunulmadı.

Yayın: mevcut yedek akışı → PR birleştirme/yayın (göç31) → gerçek telefonda katalog/plan keşfi/yeni yapı ve haftalık kalıcı hak kontrolü. Batur yayınlar.
