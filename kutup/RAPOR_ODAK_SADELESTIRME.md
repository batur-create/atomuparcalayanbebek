# Tek odak seansı — 21 Ekim 2026

Dal `codex/focus-mode-simplify`, canlı taban `21d2aab4`, hedef `kutup-platform`. Batur’un benzer mod adlarını sadeleştirme yetkisiyle yapıldı; yayın Batur’da.

## Son davranış

Batur, binasız odağın bina veren seçeneğin karşısında aynı ağırlıkta durmasını sorguladı. Bu nedenle iki büyük mod seçicisi kaldırıldı: tek seans ekranında seçili yapı görünür, altında **Bu seansı binasız yap** bağlantısı vardır. Binasız durumda süre seçilir, **Bina ekle · isteğe bağlı** ile önceki yapı seçimine dönülür.

| Durum | Ekran kuralı | Maaş / sonuç |
| --- | --- | --- |
| Kişisel bina, ekran anahtarı kapalı | Kütüp açık; mevcut çatlama/kurtarma kuralları | Tam maaş, tamamlanınca bina |
| Kişisel bina, ekran anahtarı açık | Ekranı kilitlemek/uygulamadan çıkmak serbest | Yarım maaş, tamamlanınca bina ve teslim filmi |
| Binasız seans | Uzakta geçen süre sayılmaz | Mevcut asgari süre ve doğrulanan dakikalar; yarım maaş, malzeme ücreti yok |
| Anıtkabir görevi | Aynı ekran anahtarı; kapalıyken bütün seans uygulamada görülmeli | İkisinde de yarım maaş; mevcut ortak katkı kuralları |

Kişisel inşaat, arkadaşın seansına katılım ve İmece `ScreenOffOption` kullanır. Yeni mod adı yok: **Ekranı kapatarak çalış**. İmece ve kişisel binanın farklı maaş kuralı bileşen tarafından doğru açıklanır. Yardım, teslim, sayaç ve katalog metinleri aynı dili kullanır. İnşaatın her durumda tam maaş verdiğini söyleyen eski yardım metni düzeltildi. Yenilikler sürüm 23.

## Korunanlar

Sunucu, şema, süre/ücret/ödül, çatlama, kurtarma, dürüst dakika, bildirim, plan ve ortak katkı hesabı değişmedi. Mevcut seansın ayarı değiştirilemez. `kutup-fidan-on` ve `kutup-build-mode` anahtarları korundu; kayıtlı seçimler kaybolmaz. İmece’nin ekran kapatılabilen varsayılanı aynı. Üretim verisi kullanılmadı, deploy yapılmadı.

## Doğrulama

- `npm run test:all`: **197/197**, Node ve Worker.
- `test:browser:relaxed`: **23/23**. Büyük mod seçicisinin kaldırılması, binasız geçiş/geri dönüş, varsayılanın korunması, klavyeyle ekran anahtarı, 360/390 px, gerçek ekran kapalı inşaat, teslim ve iPhone boyut/yön kontrolleri.
- İmece tarayıcı **46/46**, katılım tarayıcı **5/5**; her ikisinde de aynı adla tek ekran anahtarı ve doğru başlangıç bayrakları.
- Tema kontrastı **252/252**, diff temiz. Açık/koyu görseller incelendi: `/workspace/artifacts/odak-sade/`.

Gerçek iPhone/Safari veya üretim kontrolü yapılmadı; tarayıcı kontrolleri Chromium ve geçici yerel veritabanlarında.
