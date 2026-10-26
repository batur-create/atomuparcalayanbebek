# Kütüp — adresler, gezinme ve yapısal kalite

26 Ekim 2026 · `codex/kutup-breadcrumb-urls` → `kutup-platform` · Taban `395c9b11`.

Kullanıcı: “aga bizim kütüpe breadcrumbs ekle, her eleman için ayrı url.” Ardından hikâye ekranını özellikle dahil etti; kaliteli sitelerin yapısal özelliklerinin araştırılıp Kütüp’e uygun olanların checklist ile uygulanmasını istedi.

Güncel ilerleme: [CHECKLIST.md](CHECKLIST.md). Yayın/birleştirme yapılmaz. Kuğulu Park’ın ayrı `codex/kugulu-park` çalışması ve orijinal çalışma ağacı korunur; bu iş güncel `kutup-platform` tabanından ayrı çalışma ağacındadır.

## Kapsam ve adresler

URL, gezinilebilir ekranı veya kaydı tanımlar. Form alanları, avatar rengi, kaydet/sil, seans başlatma, ödeme ve teslim kabulü yeni adresler değildir. Bir adresi açmak kayıt oluşturmaz veya odak seansı başlatmaz. Mevcut bildirimdeki cihaz hesabına geçme (`?as=`) davranışı korunur.

| Alan | Adresler |
| --- | --- |
| Ana bölümler | `/`, `/koy`, `/pano`, `/ben` |
| Profil ve hesap | `/ben/profil`, `/ben/gorunum`, `/ben/istatistikler`, `/ben/basarimlar`, `/ben/hesap`, `/ben/hesaplar`, `/ben/hesaplar/ekle` |
| Ekip | `/ekip`, `/ekip/davet`, `/ekip/uyeler/:id` |
| Buluşma ve durum | `/bulusmalar`, `/bulusmalar/yeni`, `/bulusmalar/:id`, `/durum`, `/gelis`, `/pano/kahve` |
| Katalog | `/koy/katalog`, `/koy/katalog/:model`, `/koy/katalog/cuzdan`, `/koy/katalog/koleksiyon` |
| Köy | `/koy/yapilar`, `/koy/yapilar/:id`, `/koy/harita`, `/koy/odak`, `/koy/sesler`, `/koy/imece`, `/koy/aniti`, `/koy/haftalik-tablo` |
| Salonlar | `/salonlar`, `/salonlar/adnan`, `/salonlar/mujgan` |
| Hikâye | `/haftanin-hikayesi`, `/haftanin-hikayesi/:hafta-baslangici` — sunucunun mevcut sekiz haftalık erişim sınırı aynı |
| Yardım ve haber | `/yardim/:bolum`, `/yardim/:bolum/:konu`, `/yenilikler` |
| İstek takibi | `/ben/batura-ilet`, `/ben/batura-ilet/istekler/:id` — yalnız açık hesabın istekleri |
| Yönetim | `/batur`, `/batur/istekler/:id`, `/batur/yapi-istekleri/:id`, `/batur/ekipler`, `/batur/ekipler/yeni`, `/batur/ekipler/:id/ad`, `/batur/ekipler/:id/duyuru`, `/batur/ekipler/:id/koy-duzeni`, `/batur/uyeler/:id/hediye`, `/batur/imece` |

Pencerelerin açıldığı bölüm gerektiğinde `?kaynak=me` gibi bir gezinme parametresiyle korunur; kapatınca o bölüme dönülür. Breadcrumb üst sayfaları kanonik hiyerarşiye gider. Yönetim istek filtreleri `?durum=…`; tam ekran köyde seçili yapı `?yapi=…` ile korunur. Bu parametreler kimlik doğrulama veya yetki vermez.

Eski `?tab=…`, `?tab=plans`, `?plan=…`, `?story`, `?action=here`, `?imece` adresleri karşılıklarına dönüştürülür. Davet kodu, `?as=` ve katılım bildirimi hedefi işlenmeden atılmaz. Girişten önce açılan korumalı ekran, giriş tamamlandığında tekrar açılır. Hesap değişiminde eski kayda ait pencere kapanır ve mevcut hesap yenileme sistemi korunur.

## Teknik kararlar

- `shared/routes.js` tek rota/hiyerarşi kaynağıdır; `src/routes.js` yeniden dışa aktarır. Node ve Worker aynı bilinen sayfaları tanır. Cloudflare’da `not_found_handling=none`; belge kabuğunu Worker seçer. Negatif yönlendirme kalıpları JS/font/görselleri mevcut statik sunumda tutar; belge yanıtı için D1 sorgusu yapılmaz. Yeni bağımlılık veya veritabanı şeması yok.
- History API ile sekme değişiminde belge, canlı bağlantı ve odak durumu yeniden kurulmaz. Gerçek bağlantılar kopyalama/yeni sekme davranışlarını korur. Owner ↔ uygulama geçişi mevcut ayrı açılış/yetki yaşam döngüsünü kullanır.
- Kaydırma konumları geçmiş girdisi başına bellekte, en fazla 80 kayıtla tutulur. Geri/ileride tembel yüklenen içerik büyürken tarayıcı kaydırma sabitlemesinin konumu kaydırması engellenir. Geri yükleme kullanıcı girişiyle veya kısa sınırda biter; kullanıcıyla mücadele eden sürekli döngü yoktur.
- Başlık ve genel açıklama ekrana göre güncellenir. Özel ekranlar `noindex, nofollow` kullanır; Node/Worker HTML yanıtı da `X-Robots-Tag` gönderir. Bu bir yetki denetimi değildir; mevcut API doğrulaması aynıdır. Bilinmeyen sayfa adresleri üretimde HTML hata ekranıyla **HTTP 404** döner; eksik dosyalar yine 404’tür.
- Breadcrumb `nav`/`ol`, üst sayfa bağlantıları ve `aria-current` kullanır. Ayraçlar dekoratiftir. Klavye için içeriğe atlama ve SPA geçişinde içerik odağı vardır. Pencere kapanışı açan kontrolün odağını korur. Hikâye ve odak ekranı portal/odak kapanıyla arka plandan ayrılır.
- Ağ durumu, tarayıcı çevrimdışı bilgisi ile sunucu bağlantısını ayrı değerlendirir. Yeniden deneme mevcut durum okumasını kullanır. Yeni bir çevrimdışı işlem kuyruğu veya eski veriyi yeniden yazma sistemi eklenmez.
- Tembel yüklenen ekranlarda `Suspense` yüklenme çizimi ve yerel hata sınırı vardır. İzole bileşen yeniden deneme testi, gerçek uygulamanın ağdan bozuk paket indirmesiyle aynı kanıt sayılmaz. Otomatik uygulama sürüm yenileme korumaları korunur.
- Yapı ayrıntıları mevcut portreyi kullanır; plan, malzeme, seans süresi ve ortak Anıtkabir koşulları aşılmaz. Yapıyı incelemek seans başlatmaz.
- Tam paket, mevcut plan keşif testindeki takvim bağımlı sabit sayıyı ortaya çıkardı: süresi dolan haftalık planlar havuza katıldığı için başlangıçtaki gerçek havuzdan iki kazanım düşülür. Ekonomi veya keşif kuralları değiştirilmedi.

## Kural uyumu ve sınırlar

`DESIGN.md` §1–4, §7–9: mevcut tema jetonları, telefon ölçüleri, 44 px hedefler, çalışan kontroller, hareket azaltma. `HANDOFF.md` §0, §3–4, §6b, §10–11 ve `KARARLAR.md` n17/n25/n34/n42: dört bölüm, özel ekip verisi, hesap başına yenileme, eski bildirimler ve kalıcı kayıtlar. `IKINCI-US.md` devir/yayın sınırları: teslim PR; yedek, yayın ve canlı veri işlemi yok. Uygulanacak AGENTS/CLAUDE talimat dosyası bulunmadı. Tarihî genel yayın talimatı bu sohbetin “canlıya yayın yapma” sınırını değiştirmez.

Bu çalışma bütün site için WCAG uygunluk sertifikası, fiziksel iPhone/Android testi veya canlı Cloudflare performans ölçümü değildir. Kaynaklara dayalı seçilmiş 18 madde uygulanır ve kanıtıyla işaretlenir. Mevcut PWA, gizlilik ve doğrulama yapısı korunur. Küçük, giriş gerektiren bu uygulamaya herkese açık üye/ekip site haritası, reklam/izleme veya yeni ücretli servis eklenmez.

## Son doğrulama

| Kontrol | Sonuç | Kanıt |
| --- | --- | --- |
| Üretim derlemesi + bütün Node/yerel Worker testleri | **274/274**, sıfır atlanan/iptal edilen | [test-all.txt](kanitlar/test-all.txt) |
| Genel gerçek tarayıcı | **100/100**, uygulama JavaScript hatası yok | [genel-tarayici.txt](kanitlar/genel-tarayici.txt) |
| Yeni gezinme — geliştirme sunucusu | **62/62** | [gezinme-gelistirme.txt](kanitlar/gezinme-gelistirme.txt) |
| Yeni gezinme — gerçek üretim Node sunucusu | **66/66** | [gezinme-uretim.txt](kanitlar/gezinme-uretim.txt) |
| Odak/teslim/PWA boyutları | **23/23** | [odak-teslim.txt](kanitlar/odak-teslim.txt) |
| Buluşma yaşam döngüsü ve eski bağlantılar | **22/22** | [bulusmalar.txt](kanitlar/bulusmalar.txt) |
| Tema kontrastı | **252/252 çift** | [tema.txt](kanitlar/tema.txt) |

Geliştirme ve üretim gezinme testleri büyük ölçüde aynı davranışları tekrarlar; farklı bağımsız özellikler gibi toplanmaz. Geliştirme paketinde izole hata sınırı bileşeni denemesi; üretim paketinde beş HTTP/noindex denemesi var. Node/yerel Worker HTTP 404/noindex testleri tam 274 testin içindedir.

[Gündüz telefon](kanitlar/telefon-light.png) · [Koyu telefon](kanitlar/telefon-dark.png) · [Hikâye](kanitlar/hikaye-telefon.png) · [Odak](kanitlar/odak-telefon.png) · [Yapı ayrıntısı](kanitlar/katalog-detay.png) · [Masaüstü Pano](kanitlar/masaustu-pano.png). Bunlar gerçek uygulamada geçici yerel verilerle alındı. Hata sınırı denemesi ayrı bir bileşen fixture’ıdır; gerçek kullanıcı kaydı veya canlı arıza değildir.

Üretim kaydırma regresyonu ayrıca geciken içerikle ölçüldü: 600 px’ten ayrılan sayfa geri dönüş ve yeniden yerleşimden sonra 600 px kaldı. Kullanıcı girişi geri yükleme gözlemcisini durdurur. Ekran görüntüleri video veya fiziksel telefon kanıtı sayılmaz.

Yeniden üretme (`kutup/`):

```sh
npm ci
npm run test:all
npm run test:browser -- --artifacts /tmp/kutup-genel
npm run test:browser:routes -- --artifacts /tmp/kutup-gezinme
npm run test:browser:routes -- --production --artifacts /tmp/kutup-gezinme-uretim
npm run test:browser:relaxed -- --artifacts /tmp/kutup-odak
npm run test:browser:plans -- --artifacts /tmp/kutup-bulusma
node scripts/theme-check.mjs
```

Üretim testi `npm run test:all` veya `npm run build` sonrasındaki `dist/` kullanır. Mevcut büyük paket/PostCSS uyarıları derlemede sürer; hata değildir. Fiziksel cihaz, canlı veri ve canlı Cloudflare CPU ölçümü yok. Kaynaklar ve checkbox durumu [checklist’te](CHECKLIST.md).
