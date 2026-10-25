# n49-2: tren revizyonu

25 Ekim 2026. İstek (Ediz, canlıda gördükten sonra): tren titreyerek geliyor, raylar arasında boşluklar var, bendeki köyün rayı hâlâ dümdüz, ayrıca raydan inşaat malzemesi gelsin, işçiler alıp götürsün.

## Ne bulundu

- **Titreme.** Canlı katman ~24 fps için `setTimeout(42 ms)` + `requestAnimationFrame` ile uyanıyordu; kareler ekran yenilemesine yuvarlanınca 17, 50 ve 67 ms arayla düşüyordu (ölçüldü). Duman ya da yürüyen insan için fark edilmiyor, ekranı boydan boya geçen bir tren ise kasıyormuş gibi görünüyordu.
- **Ray boşlukları.** Ray, kutucuk çizimi için 24 birimlik parçalara bölünüyordu ve her parça önce balastını sonra traversini, rayını çiziyordu. Sonraki parçanın balastının yuvarlak ucu (0,85 birim) bir önceki parçanın ilk traverslerini ve rayını örtüyordu. Hemzemin geçitteki yeniden çizim de aynı yuvarlak uçla ana rayı kesiyordu.
- **Geç yükleme** (aynı yayının hemen ardından): tren köy başına ~5 ms tutuyor, suçlu değil. Ayrı başlıkta inceleniyor.

## Ne yapıldı

| Konu | Çözüm | Kanıt |
|---|---|---|
| Titreme | Tren ekranda görünür ve hareket halindeyken canlı katman her ekran karesini çizer (`smooth`); tren yokken ~24 fps ve uyku aynı | Tarayıcı: 2 sn'de 121 kare, aralık medyanı 16,7 ms, en büyüğü 16,8 ms, 25 ms'yi aşan aralık yok |
| Ray boşlukları | Önce bütün parçaların balastı (pass 1.15), sonra bütün traversler ve raylar (pass 1.2). Traversler hattın başından tek adımla sürüyor, raylar bütün hattın kaydırılmış çizgisinden kesiliyor (eklerde kırık yok). Geçitte ray, balastın ucunu 3,4 birim aşıyor | `ray-ek-yeri-telefon.png`, `hemzemin-gecit-masaustu.png` |
| Malzeme treni | Yeni tür `malzeme`: lokomotif + tuğla paleti + kereste + çimento çuvalı vagonu, %22. Durakta ya da istasyonda 46–60 sn durur. Üç baretli, turuncu yelekli işçi treni bekler; sırayla birer vagona gidip yükü sırtlar (vagonun yükü azalır) ve sokaklardan en yakın şantiyenin kapısına, şantiye yoksa en yakın meydana yürür (yüklü %75 hız). İstasyonda binanın içinden geçip ön kapıdan çıkarlar. Hareket ayarı Sakin ya da Kıpırtısız ise işçi yok | `malzeme-*.png`, birim testleri |
| Mevcut köyde kıvrımlı hat | **Terrain 4** = terrain 2'nin zemini (dere, gölet, doğa alanları aynı sayılar) + o köy için döşenip düzenle saklanan ray. `rerailLayout`: eski hattı izleyip 30 birimlik düz kesimler ve 40 birimlik S virajlarla ondan 2,5–10 birim açılır. Her kesim planlayıcının kendi paylarıyla parsel (avlu dahil), kapı yolu, meydan, sokak (yalnız uygun açılı hemzemin geçitle kesişebilir), su ve doğa alanlarından uzak kalmak zorunda; yer yoksa o kesim eski hatta kalır. İstasyon peronu ve dere köprüsü hattı oldukları yerde tutar. Sonunda `validateLayout` tam geçmeli | 18 deneme köyünün (30–200 bina) 18'inde ray kıvrıldı, köy başına 15–60 ms; `ray-once` / `ray-sonra` |
| Sunucu | `POST /owner/village/:id/layouts` için `rerail: true`: canlı düzene karşı kontrol edilir. Terrain 2 → 4 dışında geçiş yok; zemin rayı hariç aynı olmalı; `railProblem` (nokta aralığı, ≥14 birim yarıçap, meydana ≥38 birim, köprü uzakta); daha önce yerleşmiş hiçbir şey yer değiştirmemiş olmalı; canlı düzenin bütün sokakları aynı kalmalı (yalnız hemzemin geçit bayrağı değişebilir); kurallar parça parça kontrol edilir. Açma ve geri dönüş mevcut düzen değişimiyle aynı | `koy-n49b.test.js` (taşınmış ev, başka zemin, kırık hat reddediliyor, açılıyor, geri dönülüyor) |
| Panel | Komuta merkezi → Ekipler → Köy düzeni: canlı köy terrain 2 olan yeni köyse "Demiryolu" bölümü ve **Rayı kıvır** düğmesi. Taslak hazırlanır ve önizlenir; "Yeni köyü aç" ile gelir, 14 gün içinde "Önceki köye dön" | Derleme; düğme tarayıcıda tıklanmadı (sunucu akışı testte) |

Yeni taslaklar zaten terrain 3 (n49) alıyor, değişmedi. Şema ya da göç yok. Yenilikler 32 (31 = n50, PR #72).

## Testler

- `tests/koy-n49b.test.js` (6): terrain 4 zemini ve `railProblem`; 120, 260 ve 80 binalık köylerde rayın yeniden döşenmesi (parseller, sokaklar, meydanlar aynı, geçitler doğru, `validateLayout` temiz); istasyon peronu; sunucu akışı; malzeme treni; şantiyeye teslim.
- `tests/koy_n49b_browser.py` (7): önce/sonra, ek yeri, akıcı kareler, malzeme treni gündüz, gece ve yolda.
- `tests/koy_n49_browser.py`: "24 fps" kontrolü "tren hareket ederken her kare" olarak değişti (13/13). F 8/8, G 15/15.
- `test:all`: bkz. PR.

Chromium'un telefon öykünmesi gerçek telefon ölçümü değildir. Akıcılığın gerçek telefonda kontrolü yayından sonra yapılmalı.
