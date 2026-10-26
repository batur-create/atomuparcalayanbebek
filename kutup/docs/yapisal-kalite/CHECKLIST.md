# Kütüp — yapısal kalite checklist’i

26 Ekim 2026 · Son durum: **274/274 tam test, 100/100 genel tarayıcı, 62/62 geliştirme ve 66/66 üretim gezinme, 23/23 odak/teslim, 22/22 buluşma, 252/252 tema**. Uygulama tamam; koyu tercihi sıfırlayan deneme betiği düzeltildi, gerçek açık/koyu görünüm yeniden doğrulanıyor. PR teslimi hazırlanıyor.

Dal: `codex/kutup-breadcrumb-urls` · Canlıya yayın yok.

Bu dosya çalışma boyunca güncellenir. İşaret yalnız ilgili uygulama ve doğrulama tamamlanınca konur. Hikâye ekranı dahil gezinilebilir ekranlar kapsamdadır; düğmeye basınca yapılan kayıt, ödeme, seans başlatma gibi işlemler URL’ye dönüştürülmez.

- [x] 1. Ana bölümlere ayrı URL ve ortak adres sözleşmesi — rota birim testleri geçti.
- [x] 2. Hiyerarşik, erişilebilir breadcrumb ve çalışan üst sayfa bağlantıları — gerçek uygulamada doğrulandı.
- [x] 3. Profil, hesaplar, kişiler, buluşmalar, katalog ve yapı detaylarına doğrudan bağlantı — ilk tarayıcı kontrolleri geçti.
- [x] 4. Hikâye ekranının URL, yenileme ve geri dönüş davranışı.
- [x] 5. Tarayıcı geri/ileri ve kaydırma konumunun geri yüklenmesi.
- [x] 6. Ekrana uygun sekme başlığı ve açıklama; özel ekranların indeksleme tercihi.
- [x] 7. Gerçek bağlantılar, yeni sekmede açma, geçerli bölüm işareti ve bağlantı kopyalama.
- [x] 8. Giriş sonrasında hedefe dönme; eski bildirim, davet ve hesap geçişi bağlantıları.
- [x] 9. Bulunamayan sayfa/kişi/yapı/istek için anlaşılır geri dönüş.
- [x] 10. Klavyeyle içeriğe atlama, adlandırılmış gezinme bölgeleri ve içerik odağı.
- [x] 11. Pencerelerde Escape, odak kapanı ve açan kontrole dönüşün korunması.
- [x] 12. Tembel yüklenen ekranlarda görünür yüklenme, yerel hata sınırı ve yeniden deneme.
- [x] 13. Bağlantı kesilmesi/yeniden bağlanma için anlaşılır durum ve güvenli yeniden deneme.
- [x] 14. Eksik/boş içerik durumları ve mevcut form/işlem korumalarının doğrulanması.
- [ ] 15. 360/375/390 px açık-koyu görünüm, 44 px hedefler ve hareket azaltma.
- [x] 16. Yönetim alt ekranlarının ayrı URL ve mevcut yetki sınırları.
- [x] 17. Gerçek üretim sunucusunda doğrudan URL, yenileme ve eski bağlantı testleri.
- [ ] 18. Tam test paketi, genel tarayıcı, tema kontrolü, kalıcı kanıtlar ve incelemeye hazır PR.

## Araştırma dayanağı

- [W3C: Breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) — sıralı üst sayfalar, gezinme etiketi, geçerli sayfa.
- [MDN: History API ile çalışma](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API) — URL ile ekranın ve geri/ileri davranışının tutarlılığı.
- [MDN: scrollRestoration](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration) — geçmişteki kaydırma konumu.
- [W3C: Tekrarlanan blokları atlama](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) — klavye kullanıcısının ana içeriğe ulaşması.
- [Chrome: Yeni içeriğe odak yönetimi](https://developer.chrome.com/docs/lighthouse/accessibility/managed-focus) — SPA geçişinde başlık/içerik odağı ve sayfa başlığı.
- [React: Ekran bazlı hata sınırları](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) — hatalı ekranı uygulamanın geri kalanından ayırma.
- [MDN: Çevrimiçi bilgisi](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) — tarayıcı bilgisi tek başına sunucu erişimini kanıtlamaz.
- [MDN: X-Robots-Tag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Robots-Tag) — indeksleme tercihi, kimlik doğrulamanın yerine geçmez.

Mevcut Kütüp’te zaten bulunan modal odağı, yüklenme/boş durum bileşenleri, tema, hareket azaltma, PWA ve yetki kontrolleri korunur ve bu değişiklikle birlikte tekrar doğrulanır. Açık bir içerik sitesi olmadığı için özel ekip verilerinden arama motoru site haritası veya herkese açık önizleme üretilmez.

Cloudflare yönlendirmesi için [resmî statik varlıklar belgesi](https://developers.cloudflare.com/workers/static-assets/binding/) de incelendi. HTML adresleri Worker’dan, paketler/fontlar/görseller doğrudan statik varlıklardan sunulur. SPA kabuğu Worker’da seçilir; olmayan dosyalar 404 kalır.
