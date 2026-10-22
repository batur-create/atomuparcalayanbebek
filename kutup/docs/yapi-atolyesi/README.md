# Kütüp Yapı Atölyesi başlangıç paketi

Bu klasör, yeni yapı taleplerini aynı üretim standardında ele alacak sohbetin başlangıç dosyasıdır. Bir bina veya yeni çizim motoru eklemez. İncelenen kaynak: `kutup-platform` / `395c9b11acf5396484280b4bc405948bb484f5c3`, 22 Ekim 2026. Güncel repo uygulama için asıl kaynaktır.

## Yeni sohbete verilecekler

1. Depo erişimi: https://github.com/batur-create/atomuparcalayanbebek — uygulama `kutup/`, dal `kutup-platform`.
2. Bu klasör veya taşınabilir ZIP. Ana dalda yoksa `codex/building-workshop-kit` dalından yalnız `kutup/docs/yapi-atolyesi/` klasörünü al. Uygulama kodunu eski anlık görüntüyle değiştirme.
3. [BASLANGIC_PROMPTU.md](BASLANGIC_PROMPTU.md) içeriğinin tamamını ilk mesaja yapıştır.
4. Ardından ilk yapı isteğini ve varsa referanslarını gönder. İlk yapının ne olduğu henüz belirlenmedi.

Dosyalar:

- [Başlangıç promptu](BASLANGIC_PROMPTU.md): kapsam, üç istek türü, onay aşamaları, kalite ve teslim kuralları.
- [Teknik harita](TEKNIK_HARITA.md): kodda hangi dosya hangi işi yapıyor, örnekler ve entegrasyon noktaları.
- [İş kaydı şablonu](ISTEK_SABLONU.md): referans, onay, kapsam değişikliği, uygulama ve kanıt kaydı.
- [Doğrulama](DOGRULAMA.md): gerçekten koşulan kontroller ve kanıtlanmayanlar.
- `referanslar/`: güncel model atlası, şantiye durumları, uygulamadan yakın/gece görünümü.
- `kanitlar/`: test günlüğü ve model taramasının ham çıktısı.
- `araclar/`: bu pakete özgü tekrarlanabilir tarama/görsel araçları. Üretim motorunun yerine geçmez.

Yeniden üretme (repo erişimi, Node 22.13+ ve kurulmuş proje bağımlılıkları gerekir; görsel araç ayrıca Playwright/Chromium ister):

```sh
cd kutup
node docs/yapi-atolyesi/araclar/model-denetimi.mjs --repo . --out /tmp/model-denetimi.json
node --test tests/site.test.js tests/koy-b.test.js tests/koy-e.test.js
python tests/koy_b.py --out /tmp/yapi-atlas --only atlas
python docs/yapi-atolyesi/araclar/insaat-referansi.py --repo . --out /tmp/yapi-insaat
```

Taşınabilir ZIP'teki `kaynak-ornekleri/` klasörü denetlenmiş kaynakların okuma amaçlı kopyasıdır; tam, bağımsız kurulabilir proje yerine geçmez. Güncel repoya topluca kopyalanmaz. ZIP dışında, depodaki bu klasörde kodun kopyaları tutulmaz; teknik harita doğrudan asıl dosyalara yönlendirir.

## Model ve efor önerisi

**GPT-6.1-Sol · high**: bu atölye için önerilen varsayılan. Mevcut altyapıyı kullanarak araştırma, tasarım, modelleme ve doğrulamayı tek agentla yürütür. Önce tek makul önizleme, onaydan sonra ayrıntılandırma; kapsam dışı yeniden yazım ve otomatik görsel üretimi yok.

**xhigh**: çok karmaşık tarihî kompleks, çok parçalı geometrinin derinlik sırası, özel yapım sistemi veya çözülemeyen ölçek/yerleşim uyumu için hedefli kullanım. Her basit yapıda varsayılan yapmak gerekmez. Efor seçimi fiyat/kalite garantisi değildir; elde karşılaştırmalı bir model maliyet ölçümü yok. Kaliteyi asıl koruyan onay ve kabul kontrolleridir. Model ayarı arayüzden seçilir; prompt model ayarını kendi kendine değiştirmez.

## Önemli mevcut ayrımlar

- Katalogda 48 yapı var; Mardin Evi ve Atakule zaten mevcut.
- 31 özel model ve 14 plan nadiri bulunuyor. Normal bir yapının kaplama varyantı ile özgün geometri gerektiren model aynı iş değil.
- Bazı özel modeller ayrıntılı kendi yapım sırasını, son nadirler ortak beş ana aşamalı `design()` yardımcısını kullanıyor. Yeni karmaşık yapının standardı en basit yardımcıyla sınırlanmaz.
- Plan kalıcı kilit açar; yine malzeme ve çalışma gerekir. Ortak Anıtkabir'in 2.000 dakikalık projesi olağan kişisel yapıya otomatik uygulanmaz.
- Bu klasördeki çizimler/mimariler üretim kodundan gelir. Yeni gerçek yapının kaynak fotoğraf/plan araştırması, adı verilince ayrıca yapılacak.
- Yayın veya canlı veri işlemi yapılmadı. Onay ve görev kaydı konuşmadan bağımsız kalıcı tutulmalı.
