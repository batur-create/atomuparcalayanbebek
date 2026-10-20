# Daha doğal köy — 20 Ekim

- `codex/natural-village`, hedef `kutup-platform`; diğer paketlerden bağımsız, göç yok. Yayın Batur’da.
- Binaların kayıtlı koordinatları, yönleri, sahipleri ve ölçek kuralları korunur. Boş kayıtlı mahalleler silinmez. Kamera, yalnız boş kayıtlar yüzünden gereksiz genişlemez; kendi boş mahallen ve çalışan arkadaşının alanı erişilebilir kalır.
- Her mahalleyi ayrı bir ada yapan sınırlar kaldırıldı. Ortak çayır, yumuşak bitki lekeleri, ağaç kümeleri ve daha ince toprak yollar tek zemin hissi verir. Gelecekteki boş alanlara uzanan gereksiz yol kolları çizilmez.
- Komşu kümeleri bağlayan küçük kıvrımlı yürüyüş patikaları eklendi. Kaydedilmiş binaları ve göletleri kesen patika seçilmez; yol uğruna ev taşınmaz. Sabit ana yolların küçük görsel kıvrımı mevcut ayrılmış koridor içinde kalır. Planlayıcının yol/çarpışma koruması aynıdır.
- Yalnız yeni yapılacak binaların güvenli adayları sıralanırken girişe ve mevcut komşulara yakın yerler tercih edilir; hazır evlerin yerleşimi yeniden hesaplanmaz.
- Aynı deterministik 30 binayla önce/sonra karşılaştırıldı: **12 görünür mahalle → 5**, aynı koordinatlar ve 30 bina. Masaüstü, 390 px telefon ve gece görüntüleri: `/workspace/artifacts/dogal-koy/`.
- **190/190 Node–Worker testi**; yeni kontrol boş/aktif mahalle erişimini, kayıtların değişmemesini, sonlu çizim kutularını ve patikaların evleri kesmemesini doğrular. Eski kalabalık köy/monument çakışma testleri de geçer.
