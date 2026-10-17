# İkinci üs: Kütüp'ü arkadaşın bilgisayarından yürütmek

Batur'un kendi Claude hesabının haftalık sınırı 22 Ekim 2026 gece 01:00'e kadar dolu. Bu sürede Kütüp, Batur'un arkadaşının bilgisayarında, **arkadaşın kendi Claude hesabıyla, ana üstekiyle birebir aynı düzende** sürer, sonra temiz geri döner.

Batur'un sözleri (17 Ekim):
- "senle nasıl çalışıyorsam BİREBİR AYNISINI istiyom. kütüp akış artifaktinin yanda açılı olma detayına kadar."
- "her şey smooth gitsin ve smooth geri dönsün."
- "adımları arkadaşımla beraber kursunlar ve her şey hazır olunca başlasınlar."

> **Güncelleme (17 Ekim, Batur'un kararı):** İkinci üs arkadaşın bilgisayarında değil, Ediz'in hesabındaki Claude bulut oturumunda (claude.ai projesi "Kütüp ikinci üs") çalışıyor. Fork yok: Batur EdizGn'yi depoya ortak ekledi; Claude `claude/*` dallarını doğrudan depoya push eder, PR tabanı yine `kutup-platform`. Pano Plan B kopyası: https://claude.ai/artifact/Ui7VSL5pHurEG3fftxS5xu. Yayın, canlı anahtar ve Cloudflare girişi §8 ve §12'deki gibi yalnız Batur'da. §1, §3 (H1–H6, H10, H14) ve §5 adım 10'daki fork ve masaüstü adımları bu düzende atlanır; ayrıntı `ikinci-us/GUNLUK.md` Kurulum kaydında.

### Batur için kısa yol

1. **Arkadaşına:** "Claude masaüstü uygulamasını kur, kendi hesabınla gir, Belgeler'de `Kutup-Us` klasörü aç, Code sekmesinde onu seç ve şu mesajı yapıştır" de. Mesaj §1'de. Kurulumun gerisini oradaki Claude yürütür.
2. **Panonu paylaş (önerilir):**
   - claude.ai'de "Kütüp İş Akışı" panosunu aç, Paylaş'a bas.
   - Arkadaşının Claude hesabının e-postasını yaz ve düzenleme izni ver.
   - Böylece oradaki Claude doğrudan senin panonu günceller, sen de telefondan izlersin. Paylaşamazsan oradaki Claude bir kopya kurar ve bağlantısını sana verir.
3. **Her PR'da:**
   - PR e-postası gelince GitHub'da **Merge pull request → Create a merge commit**.
   - Kendi bilgisayarında PowerShell'i aç: önce `cd C:\Users\İzzettin\bilim-dunyasi\kutup-platform\kutup`, sonra `npm run yayin`.
   - En alttaki "Yayın tamam · …" satırını oradaki Claude'a ilet (arkadaşına WhatsApp'tan atman yeter).
4. **Görsel işlerde:** oradaki Claude önizlemeleri arkadaşın üzerinden sana gönderir. "Olur" ya da düzeltmeni yazarsın.
5. **Dönüş günü:** oradaki Claude'a "teslim et" de, teslim PR'ını birleştir, ana üste "döndük" de.

Süreci izlemek için üç yer var: pano (paylaştıysan kendi panon), GitHub'daki PR'lar ve e-postaları, deponun içindeki `kutup/ikinci-us/GUNLUK.md`.

### Ne aynı, ne farklı

| İş | İkinci üste |
|---|---|
| Kod, testler, önizleme, ekran görüntüleri | Aynı |
| Pano yan panelde | Aynı: paylaşılan pano ya da birebir kopyası |
| Kurallar ve hafıza | Aynı: hafızanın kopyası |
| Kayıtlar (KARARLAR, DESIGN, HANDOFF) | Aynı; PR'ın içinde yazılır |
| ChatGPT | Aynı: brifi Claude yazar, sen yapıştırırsın |
| Yayın, yedek, canlı duman testi | Senin bilgisayarında tek komut: `npm run yayin`. Cloudflare girişi ve canlı anahtar orada kalır; onları başka bilgisayara ya da GitHub'a koymamak bilinçli bir karar. |
| Canlı veritabanına ve kayıtlara bakmak | Yalnız senin bilgisayarında. Gerekirse oradaki Claude sana çalıştıracağın komutu verir. |
| Bulut oturumları (13 dolar kredi) | Senin hesabında; ikinci üste kullanılmaz |
| Gerçek telefonda deneme | Eskisi gibi, sizin telefonlarınızda |

**Bu dosyayı okuyan Claude:** baştan sona oku. Önce §3'teki hazırlık listesini Batur ve arkadaşıyla birlikte, sırayla tamamla. Liste bitmeden işe başlama. Liste bitince kaldığımız yerden devam et.

| § | Konu |
|---|---|
| 1 | Başlangıç mesajı (arkadaş yapıştırır) |
| 2 | Kimsin, kiminle konuşuyorsun |
| 3 | **Hazırlık listesi** (her adım doğrulanır) |
| 4 | Her oturumun başı |
| 5 | Bir paketin akışı |
| 6 | Görsel onay |
| 7 | ChatGPT ile çalışma |
| 8 | Batur'un yayın adımları |
| 9 | Günlük: geri dönüş kaydı |
| 10 | Sınır dolarken |
| 11 | Teslim ve geri dönüş |
| 12 | Güvenlik |
| 13 | Sorun çıkarsa |

## 1. Başlangıç mesajı

Arkadaş:
1. Claude masaüstü uygulamasını kurar (claude.ai/download) ve kendi hesabıyla girer.
2. Belgeler'in altında boş bir **`Kutup-Us`** klasörü açar.
3. Uygulamada **Code** sekmesinde bu klasörü seçer ve şunu yapıştırır:

```
Merhaba, ben Batur. Kütüp projesinde benim geliştiricim olarak devam edeceksin.
Şu dosyayı baştan sona oku ve uygula. Önce hazırlık listesini benimle ve arkadaşımla adım adım tamamla, sonra kaldığımız yerden devam et:
https://raw.githubusercontent.com/batur-create/atomuparcalayanbebek/kutup-platform/kutup/IKINCI-US.md
```

**Neden ayrı klasör?** Claude Code hafızayı ve oturumları açılan klasöre göre tutar. `Kutup-Us`, arkadaşın kendi işlerinden ayrı, kendi hafızası olan yalıtılmış bir proje olur. Bütün Kütüp oturumları bu klasörde açılır, başka iş burada yapılmaz. Klasörün düzeni:

```
Kutup-Us/                       ← Claude'un çalışma klasörü (hep bu)
  .claude/launch.json           ← önizleme ayarı (§3, H10)
  atomuparcalayanbebek/         ← depo (kod: atomuparcalayanbebek/kutup)
  gelen/                        ← ChatGPT paketleri (depo dışında)
  onizleme/                     ← Batur'a gidecek ekran görüntüleri
```

## 2. Kimsin, kiminle konuşuyorsun

- **Sen Batur'un Kütüp geliştiricisisin**, ana üsteki Claude'un yaptığı işi aynı kurallar ve aynı düzenle sürdürüyorsun. Önceki sohbetlere erişimin yok; gereken her şey bu dosyada, depoda ve `kutup/ikinci-us/` içinde.
- **Konuştuğun kişi Batur:** projenin sahibi ve baş geliştirici.
  - Ona "Batur" diye, Türkçe ve samimi yaz ("aga").
  - Arkadaşı klavyedeyken de Batur adına konuşulur; kararlar Batur'un kararı sayılır.
  - Kurulumda arkadaşın kendi elinin gerektiği adımları açıkça yaz: "Arkadaşın şunu yapsın: …". Bunlar program kurmak, GitHub'a girmek, şifre yazmak.
- **Batur nasıl çalışmak ister:**
  - Teknik kararları sen verirsin, soru yağmuru yok. Gerçekten Batur'a ait bir karar varsa tek kısa soru sorarsın.
  - İşi uçtan uca bitirirsin.
  - Her paketten sonra kısa bir özet ve hazır bir `/compact` satırı verirsin.
- **Proje:** Kütüp, Milli Kütüphane'ye (Ankara) giden arkadaşlar için gerçek zamanlı buluşma ve odak PWA'sı.
  - Canlı: https://kutup.ahmetbaturkaplanoglu.workers.dev (Cloudflare Workers + D1, React 18 + Vite).
  - Kod `atomuparcalayanbebek/kutup`, dal `kutup-platform`. Deponun kökü ve `main` başka bir proje.
- **Fark tek:** yayın (deploy) yalnız Batur'un bilgisayarından yapılır (§8). Sen PR açarsın. Panodaki kart yayına kadar `review` durumunda kalır.

## 3. Hazırlık listesi

`update_plan` ile bu listeyi görev listesi yap. Her adımı doğrulama komutuyla kontrol et. Her adımdan sonra `kutup/ikinci-us/GUNLUK.md`'deki "Kurulum" kaydına ✓ ve sürümü yaz. İşletim sistemini kendin bul (PowerShell: `$env:OS`, macOS: `uname`); komutları ona göre seç.

Batur bu kurulumları onayladı: Git, Node.js 22 LTS, Python 3, Playwright, GitHub hesabı, GitHub CLI (isteğe bağlı). Bunların dışındaki her indirme ve kurulum için önce Batur'a sor; kodu çalıştırmadan önce oku.

| # | Adım | Kim | Doğrulama |
|---|---|---|---|
| H1 | Claude uygulaması, arkadaşın hesabı, Code sekmesinde `Kutup-Us` klasörü | Arkadaş | Bu sohbet açık |
| H2 | **Git.** Windows: `winget install --id Git.Git -e`. macOS: `xcode-select --install`. Kimlik: `git config --global user.name "<ad>"` ve `git config --global user.email "<GitHub e-postası>"` | Arkadaş komutu çalıştırır, Claude yazar | `git --version` |
| H3 | **Node 22.13 veya üstü.** Windows: `winget install OpenJS.NodeJS.LTS`. macOS: nodejs.org'dan LTS. Kurulumdan sonra terminali ya da uygulamayı yeniden başlat | Arkadaş | `node -v` en az `v22.13` |
| H4 | **Python ve Playwright.** Windows: `winget install Python.Python.3.12`, sonra `py -m pip install playwright`. macOS: `python3 -m pip install playwright`. Chrome ya da Edge yüklü olsun. Yüklü değilse: `python -m playwright install chromium` | Arkadaş | `python -c "import playwright"` (Windows'ta `py -c …`) |
| H5 | **GitHub hesabı ve fork.** Hesap açmayı ve girişi arkadaş yapar. Sonra https://github.com/batur-create/atomuparcalayanbebek sayfasında **Fork** | Arkadaş | Kullanıcı adını Batur'a söyler |
| H6 | **Depo.** `Kutup-Us` içinde: `git clone https://github.com/batur-create/atomuparcalayanbebek.git`, `git -C atomuparcalayanbebek checkout kutup-platform`, `git -C atomuparcalayanbebek remote add fork https://github.com/<kullanıcı>/atomuparcalayanbebek.git` | Claude | `git -C atomuparcalayanbebek remote -v` iki uzak gösterir: `origin` ve `fork` |
| H7 | **Bağımlılıklar ve birim testleri.** `atomuparcalayanbebek/kutup` içinde `npm ci`, sonra `npm run test:all` | Claude | 99 test, 0 hata |
| H8 | **Tarayıcı testi.** `npm run test:browser` | Claude | 66 kontrol, 0 FAIL |
| H9 | **Hafıza.** `kutup/ikinci-us/hafiza/` klasöründeki 10 dosyayı (9 kural ve `MEMORY.md` dizini) kendi hafıza klasörüne aynı adlarla yaz. `kutup-cloud-workflow.md`'deki merge, deploy ve yerel yollar ana üse ait; burada §5 ve §8 geçerli | Claude | Hafıza dizininde 9 satır |
| H10 | **Önizleme.** `Kutup-Us/.claude/launch.json` dosyasını aşağıdaki gibi yaz, sonra `preview_start "kutup"` | Claude | Önizlemede Kütüp giriş ekranı açılıyor |
| H11 | **Pano.** Aşağıdaki "Pano kurulumu"na göre Plan A ya da B. Yan panelde aç, adresini günlüğe yaz | Claude | Panoda 49 kart; Sırada ilk kart n31 |
| H12 | **PR yolu denemesi.** Dal `claude/ikinci-us-kurulum`. Günlüğün Kurulum kaydını commit'le, `git push fork claude/ikinci-us-kurulum`, PR aç (taban **kutup-platform**, §5 adım 10) | Claude yazar, ilk push'taki GitHub girişini arkadaş yapar | Batur PR'ı birleştirir. Yalnız belge değişikliği, yayın gerekmez |
| H13 | **Kara v2 paketi.** Kodu depoda, `kutup/ikinci-us/gelen/kara-v2/` içinde. ChatGPT'nin ekran görüntüleri ve 1,5 MB'lık önizleme sayfası bilerek alınmadı; sitedeki görüntüleri sen çekeceksin | Claude | 9 dosya: `Kara.jsx`, `kara.css`, `Kara.svg`, `NOTLAR.md` ve ölçüm JSON'ları |
| H14 | **Kullanım.** `get_usage` | Claude | Sınırlar günlüğe yazılır |
| H15 | **Hazırım raporu.** Batur'a: liste tamam, pano açık, sıradaki iş n31 Kara v2 | Claude | Batur "başla" der |

`Kutup-Us/.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "kutup", "runtimeExecutable": "npm", "runtimeArgs": ["--prefix", "atomuparcalayanbebek/kutup", "run", "dev"], "port": 3001 }
  ]
}
```
Yerel sunucu gizli bilgi istemez. `kutup/data/` ilk açılışta kendi yerel verisini ve anahtarını üretir; bunların canlıyla ilgisi yoktur.

**Pano kurulumu (H11).** Batur'un panosu https://claude.ai/artifact/Rm7oZuLi3ZjgqTn935kUVX adresinde ve onun hesabında.

**Plan A (Batur paylaştıysa):**
1. Aynı adresi `Artifact read` ile oku. Sonuç "writer" diyorsa yazabiliyorsun demektir.
2. Yazmayı dene: `meta/board` notunun başına "İkinci üs bağlandı." ekle, okuduğun sürümle `if_version` kullan.
3. Panoyu `Artifact open` ile yan panelde aç.

Plan A'da kopya yoktur; dönüşte pano aktarmak da gerekmez.

**Plan B (paylaşılamadıysa):** aynısını kur.
1. `artifact-capabilities` becerisini yükle. `kutup/ikinci-us/pano.html`'i değiştirmeden Artifact olarak yayınla:
   - başlık "Kütüp İş Akışı";
   - ikon `board`;
   - `db` yeteneği. Sayfa `window.claude.use("db")` kullanır ve `tasks` koleksiyonuyla `meta/board` belgesini okur.
2. Veriyi yükle. `kutup/ikinci-us/pano-veri/tasks/*.json` dosyalarının her biri `tasks` koleksiyonuna gider; belge kimliği dosya adıdır (uzantısız). `pano-veri/meta/board.json` dosyası `meta/board` belgesine gider.
   - ArtifactData `batch` kullan: `op: "set"` ve `file_path`.
   - Bir batch en çok 50 yazma alır. 49 kart ve 1 meta belgesi tam 50 eder.
3. `Artifact open` ile yan panelde aç. Batur'un telefondan izleyebilmesi için bağlantıyı onunla görüntüleme izniyle paylaş ya da adresi ona ilet.
4. Yayınlanamazsa (`db` yeteneği yoksa) Batur'a söyle. Panoyu `kutup/ikinci-us/PANO.md` dosyasında aynı alanlarla tut.

**Pano alanları:**
- `status`: next | doing | review (Batur'u bekliyor) | done
- `kind`: görsel | teknik
- `ready`: tanım hazır mı
- `detail`: tek cümle
- `spec`: tam tanım (Amaç, Batur'un sözleri, Kararlaşan, Açık sorular, Ekranlar, Yöntem, Bitti ölçütü)
- `decisions`: bitince verilen kararlar
- diğerleri: `order`, `area`, `at`, `commit`
- `meta/board`: `note` ve `updated`

Her yazma okuduğun sürümle `if_version` taşır.

## 4. Her oturumun başı (sırayla)

1. Panoyu yan panelde aç (`Artifact open`, adres günlükte). Batur akışı oradan izliyor.
2. Depo durumu:
   - `git -C atomuparcalayanbebek fetch origin`
   - `git -C atomuparcalayanbebek status -sb`
   - Hangi daldasın? `origin/kutup-platform` ilerlemiş mi?
3. Günlüğün son kayıtlarını oku. Sonra PR'lara bak: `curl -s "https://api.github.com/repos/batur-create/atomuparcalayanbebek/pulls?state=all&base=kutup-platform&per_page=10"`. Birleşenleri günlüğe ve panoya işle.
4. `get_usage` (§10).
5. Belgeler:
   - `kutup/HANDOFF.md` bölüm 0 ve 6b;
   - görsel işse `kutup/DESIGN.md`;
   - `kutup/KARARLAR.md`'nin yalnız dizini; sonra işin koduyla ara (`### n24`);
   - işin panodaki tam tanımı. Tanım eksikse (`ready: false`) önce Batur'a sor.
6. Kısa araç taraması (hafıza: `tool-scouting`).

## 5. Bir paketin akışı

1. **Kart seç:** panoda en düşük `order`'lı `next` kart. Kartı `doing` yap, `meta/board`'u güncelle.
2. **Dal aç:** `git switch -c claude/<kod>-<kısa-ad> origin/kutup-platform`.
   - Önceki PR birleşmeden başlaman gerekiyorsa yeni dalı onun üstünden aç ve PR'a "PR #x'in üstünde" yaz.
   - Aynı dosyalara dokunan iki açık PR olmasın.
3. **Görsel işse** önce §6.
4. **Yaz.** `update_plan` görev listesini tut, iş bitince `wrap_up` çağır.
5. **Test:**
   - `npm run test:all` ve `npm run test:browser` yeşil olmalı.
   - Yeni davranışa birim testi ve tarayıcı kontrolü ekle.
   - Canlıda denenmesi gereken bir şey varsa `tests/live-smoke.mjs`'e adım ekle; o betiği Batur çalıştırır.
6. **Yavaş telefonda ölç:**
   - Playwright ile 375×812 ekran;
   - CDP `Emulation.setCPUThrottlingRate` (`rate: 4`);
   - 20 saniye `PerformanceObserver("longtask")`, ana iş parçacığının meşgul yüzdesi.
   - Önceki ve sonraki hali karşılaştır, sonucu kayda yaz.
7. **Göç (migration) gerekiyorsa:**
   - `server/schema.js`'te sıradaki numarayı kullan (son: 21) ve göç testi ekle.
   - PR başlığına `[göç NN]` ekle; Batur yayından önce yedek alır.
   - Göçler canlıda ilk istekte kendiliğinden çalışır.
8. **Kayıtları aynı dalda yaz:**
   - **KARARLAR.md:** dizinin en üstüne `| <kod> | <iş> | <alan> | <gün Ay saat> | PR #<n> |` satırını, "Kayıtlar (yeniden eskiye)" başlığının hemen altına da kaydı ekle (şablon aşağıda).
   - **DESIGN.md §9:** görsel bir karar varsa bir satır (`- ✔ **<kod> …:** …`).
   - **HANDOFF.md 6b:** kısa not (öğrenilen tuzaklar, sonrakinin bilmesi gerekenler).
   - **GUNLUK.md:** paket kaydı (§9).
9. **Commit:**
   - Mesajlar İngilizce, kısa başlık ve gövde; sonunda uygulamanın verdiği Claude atıf satırı.
   - `kutup/data/` asla commit'lenmez; her commit'ten önce `git status`'a bak.
10. **Push ve PR:**
    - `git push fork <dal>`.
    - PR'ı şu adresten aç: `https://github.com/batur-create/atomuparcalayanbebek/compare/kutup-platform...<kullanıcı>:<dal>`.
    - **Taban mutlaka `kutup-platform`.** GitHub varsayılan olarak `main` seçer. `main` ayrı bir proje, oraya asla PR yok.
    - PR metni şablonu aşağıda.
11. **Pano:** kart `review` olur, `commit` alanına "PR #n" yazılır, `decisions` doldurulur. Batur "yayında" deyince kart `done` olur ve `at` alanı yayın saatini alır.
12. **Batur'a rapor:** Türkçe kısa özet, Batur'un yapacakları (§8) ve hazır bir `/compact` satırı. Satırda korunacaklar (çalışma sistemi, kurallar, son durum, sıradaki iş) ve atılacaklar (betikler, test çıktıları, dosya içerikleri) yazar.

**KARARLAR kayıt şablonu:**
```
### <kod> · <Başlık>
<Alan> · <gün Ay yıl> · PR #<n> (ikinci üs) · göç <NN, varsa>

**Ne yapıldı:** …
**Kararlar ve nedenleri:** …
**Batur'un sözleri:** "…"
**Vazgeçilenler:** …
**Açık:** …
**Dosyalar:** …
```

**PR metni şablonu:**
```
## Ne yapıldı
## Testler: test:all N/N · test:browser N/N · yavaş telefon (önce → sonra)
## Göç: yok | NN (Batur: yayından önce yedek)
## Canlı duman testi: eklenen adım (varsa)
## Pano: <kod> → review; kararlar: …
## Batur'un yapacağı: IKINCI-US.md §8
```

**Kodlar:** yeni iş için n32'den, düzeltme için d23'ten devam et. Kodun ilk kez kullanıldığı yer pano kartıdır.

## 6. Görsel onay

Hafızadaki `kutup-ask-before-visuals` kuralı geçerli: görsel iş önce Batur'un onayından geçer.
1. Önce siteye bak (yerel önizleme) ve `DESIGN.md`'yi oku.
2. Seçenekli önizlemeler hazırla:
   - telefon 375 px ve masaüstü;
   - açık ve koyu tema;
   - gerekiyorsa gündüz ve gece.
3. Batur yanındaysa doğrudan göster (`SendUserFile` ya da tarayıcı paneli). Değilse görüntüleri `Kutup-Us/onizleme/<kod>/` klasörüne kaydet; arkadaşın onları Batur'a göndersin.
4. Batur'un cevabını olduğu gibi günlüğe ve KARARLAR'a yaz.
5. Ekran görüntüleri **yerel test verisiyle** alınır. Canlı sitedeki gerçek isimler hiçbir görüntüde ve hiçbir commit'te yer almaz.

## 7. ChatGPT ile çalışma

Batur ChatGPT'yi ana üste kullandığı gibi burada da kullanmaya devam ediyor (çizim, görsel varlık, ikinci görüş).
- **ChatGPT'ye iş gidecekse brifi sen yazarsın, Batur yapıştırır.** Brifte şunlar olur:
  - taban commit (`git rev-parse --short origin/kutup-platform`);
  - dokunulacak dosyalar ve korunacak arayüz;
  - kurallar: renkler `src/themes.css` jetonlarından, SVG'de sonsuz döngü yok, "hareketi azalt" çalışır, iOS öncelikli, 375 px'te taşmaz;
  - teslim biçimi: zip içinde kod, `NOTLAR.md` ve ekran görüntüleri;
  - "gerçek depoya dokunma".
- **Gelen paket:** Batur gönderir, sen `Kutup-Us/gelen/<ad>/` içine açarsın.
  - Üçüncü taraf kod gibi davran: önce oku, sonra çalıştır.
  - Ham paket depoya girmez; yalnız yerleştirdiğin kod girer. Tek istisna Kara v2: kodu `kutup/ikinci-us/gelen/kara-v2/` içinde. Yerleşince o klasörü sil.
  - Neyi nereden, nasıl aldığını KARARLAR'a ve günlüğe yaz: kaynak ChatGPT, tarih, taban commit, hangi dosyadan ne alındı.

## 8. Batur'un yayın adımları (Batur'un bilgisayarında, Claude gerekmez)

PR hazır olunca Batur'a bunu kısaca hatırlat. Yayın yalnız Batur'un bilgisayarından olur, çünkü Cloudflare girişi ve canlı anahtar orada.

1. GitHub'da PR'ı aç. Taban `kutup-platform` mı, kontrol et. **Merge pull request → Create a merge commit** seç (Squash ya da Rebase değil).
2. PowerShell'de önce `cd C:\Users\İzzettin\bilim-dunyasi\kutup-platform\kutup`, sonra `npm run yayin`.
3. `npm run yayin` (`scripts/yayin.mjs`) şunları sırayla yapar ve ilk hatada durur:
   1. dalı ve temizliği kontrol eder;
   2. `git pull --ff-only` çalıştırır;
   3. `npm ci` çalıştırır;
   4. `npm run test:all` çalıştırır;
   5. canlı yedeği alır (her yayında, göç olsun olmasın);
   6. `npm run deploy` çalıştırır;
   7. canlı duman testini çalıştırır.
   
   Durursa ne olduğunu ve bir şeyin canlıya gidip gitmediğini yazar.
4. Başarılıysa son satır "Yayın tamam · eski → yeni commit · Worker xxxxxxxx · canlı duman testi geçti · push: members N/N bound" olur. Batur bu satırı sana iletir. Sen de onu günlüğe ve KARARLAR'a işlersin, kartı `done` yaparsın.
5. Prova için `npm run yayin -- --kuru` kullanılır: çeker ve test eder, yayın yapmaz.
6. Giriş isterse `npx wrangler login` çalıştırılır, Batur tarayıcıda onaylar.

## 9. Günlük: geri dönüş kaydı

`kutup/ikinci-us/GUNLUK.md`. Dönüşte ana üs işi buradan devralır; burada yazmayan şey bilinmez.
- **Yazım:** yeni kayıt en üste; saat İstanbul saatiyle. Her PR günlüğü de günceller.
- **Ne yazılır:**
  - kurulum;
  - her paket: kod, dal, PR, durum, yayının Version ID'si;
  - Batur'un sözleri ve kararları, olduğu gibi;
  - panoya yapılan her değişiklik; yeni kartın tam tanımı dahil;
  - ChatGPT'den gelenler;
  - açık sorular, yarım işler, öğrenilen tuzaklar.
- **Çelişki:** pano ile günlük çelişmez. Çelişirse günlük doğrudur, panoyu düzelt.

## 10. Sınır dolarken

Arkadaşın hesabının da sınırı var. Her oturum başında ve uzun işlerde `get_usage` ile bak. 5 saatlik ya da haftalık sınır %90'ı geçerse:
1. Elindeki adımı bitir.
2. Commit'le (`WIP: …`) ve fork'a push et; gerekiyorsa taslak PR aç.
3. Günlüğe "nerede kaldım, sıradaki adım" yaz, panoyu güncelle.
4. Batur'a kısa durum yaz ve hazır bir `/compact` satırı ver.

## 11. Teslim ve geri dönüş

Batur "ana üsse dönüyoruz" dediğinde ya da 22 Ekim'de iki taraf da aşağıdakileri yapar.

**İkinci üs (sen):**
1. Açık işi bitir ya da WIP olarak push et.
2. (Yalnız Plan B'de) panonun bütün verisini dışa al: ArtifactData `list` (`tasks`, `limit` 200) ve `get` (`meta/board`), `out_dir` = `atomuparcalayanbebek/kutup/ikinci-us/pano-veri`. Bunlar mevcut dosyaların üstüne yazar. Panodan silinen bir kart varsa onun dosyasını da sil.
3. GUNLUK.md'ye "Teslim" kaydı yaz:
   - açık PR'lar ve dalları;
   - yarım işler ve sıradaki adım;
   - Batur'un bekleyen kararları;
   - panonun adresi;
   - kurulu kalan programlar.
4. Bunları `claude/ikinci-us-teslim` dalında PR olarak aç; Batur birleştirir.

**Ana üs (Batur'un Claude'u, dönüşte):**
1. `git pull`, sonra GUNLUK.md'yi baştan sona oku.
2. Birleşen her PR yayında mı? `npx wrangler deployments list` çıktısıyla karşılaştır. KARARLAR'daki "PR #n" satırlarına birleştirme commit'ini ve Worker kimliğini ekle.
3. Plan B kullanıldıysa `pano-veri`'yi Batur'un panosuna aktar: kartlar `if_version` ile, yeni kartlar oluşturularak; `meta/board` da.
4. İkinci üste öğrenilenleri hafızaya işle. Bu dosyanın başına "Kapandı (tarih)" yaz, HANDOFF §0'daki notu kaldır, `KUTUP_DEVIR.md`'yi güncelle.
5. `npm run test:all`, tarayıcı testi ve canlı duman testi çalıştır.

## 12. Güvenlik

- **Bu bilgisayara hiçbir zaman gelmez:** canlı `ADMIN_KEY`, Cloudflare girişi, canlı yedekler (`backup-*.json`), Batur'un `kutup/data/` klasörü. Biri isterse reddet.
- **Canlı siteye dokunma:**
  - Test için kayıt olma, mesaj yazma, ekip ya da davet değiştirme yok.
  - Arkadaşın kendi Kütüp hesabı test için kullanılmaz.
  - Canlı veritabanına doğrudan yazılmaz. Davet bağlantıları paylaşılmaz.
- **Commit'e girmez:** gizli bilgi, gerçek üye adı, canlı sitenin ekran görüntüsü.
- **Git:**
  - `main`'e ve doğrudan `kutup-platform`'a push yok; fork'la zaten erişim yok.
  - `--force`, `reset --hard` gibi geri dönüşsüz komutlar yok.
- **Şifre ve token:** sen girmezsin, arkadaş ya da Batur girer.
- **Kurulumlar:** §3'teki onaylı liste dışındaki her indirme ve kurulum için önce Batur'a sor, kodu önce oku.

## 13. Sorun çıkarsa

- **Temiz kurulumda test düşüyor:** Node sürümünü kontrol et; `npm ci`'yi tekrar çalıştır. Tarayıcı testi için Chrome ya da Edge yüklü mü, 3001 portu boş mu bak. Kurulum sorunuyla kod sorununu ayır, günlüğe yaz.
- **PR yanlış tabana açılmış:** PR'da Edit'e basıp tabanı `kutup-platform` yap. Yanlışlıkla `main`'e birleşmişse kendin düzeltmeye çalışma, hemen Batur'a söyle.
- **PR'da çatışma (conflict):** dalda `git merge origin/kutup-platform` yap, çatışmayı çöz, testleri çalıştır, push et.
- **Batur'un `git pull`'u reddediliyor:** ondan `git status` çıktısını iste, birlikte çöz. Zorlayıcı komut önerme.
- **`npm run deploy` giriş istiyor:** `npx wrangler login` çalıştırılır, Batur tarayıcıda onaylar.
- **Canlı duman testi düşüyor:** çıktıyı iste ve düzeltme PR'ı hazırla.
  - Site kullanıcılar için bozuksa ve PR'da göç **yoksa**, Batur `npx wrangler rollback` ile önceki sürüme döner.
  - Göç varsa geri alma yapılmaz; düzeltme PR'ı hazırlanır, gerekirse `RECOVERY.md`'ye bakılır.
- **Kararsız kaldığın bir şey:** Batur'a tek kısa soru.

## Sıradaki işler

Tam tanımları panoda (ve `kutup/ikinci-us/pano-veri/tasks/`). Sıra: **n31 Kara v2 → n24 Ses turu → n28 Haftalık hikâye → n29 Anında ve hızlı → n30 Masa haritası → n14 Başarımlar.** n30 ile n14'ün tanımı eksik; başlamadan Batur'a sor.
