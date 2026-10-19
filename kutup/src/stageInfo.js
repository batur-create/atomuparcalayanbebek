// What each construction stage is and why it is done, in plain Turkish for
// people who are not engineers (n39). The scene's caption gets a small (i)
// beside it; tapping it opens the text for the stage under way.
//
// Generic steps are keyed by phase key; a few keys mean different things on
// different structural systems, so those entries pick by the label. Buildings
// of their own (src/special.js) have their own texts by id, and fall back to
// the generic ones only for the shared ground steps and the handover.

const byLabel = (pairs, other) => (label) => (pairs.find(([re]) => re.test(label)) || [null, other])[1];

const GENERIC = {
  mobilize:
    "Şantiye kurulumu. Çevre çitle kapatılır ki kimse kazıya düşmesin, işçiler için konteyner ofis konur, ruhsat tabelası asılır. Belediyeden izin alınmadan inşaata başlanamaz; tabela bunun herkese açık kanıtı.",
  layout:
    "Aplikasyon, binanın yere çizilmesi demek. Harita mühendisi projedeki köşe noktalarını araziye kazıklarla işaretler, kazıkların arasına ip gerilir. Böylece bina tam projedeki yere ve doğru ölçüde oturur, komşu parsele taşmaz.",
  dig: "Hafriyat, temel için toprağın kazılması. Üstteki yumuşak toprak ve bitki kökleri yük taşıyamaz; bina sağlam zemine oturmalı. Kazı kenarları göçmesin diye eğimli (şevli) bırakılır.",
  lean: "Grobeton, kazının dibine dökülen ince ve az çimentolu bir beton tabakası. Yük taşımaz; temiz ve düz bir taban sağlar ki demirler toprağa değip paslanmasın, yalıtım da üstüne düzgün serilsin.",
  footWater:
    "Temelin altına ve yanlarına bitümlü su yalıtım örtüsü serilir. Topraktaki nem betona işlerse içindeki demirler paslanır, bodrum rutubet yapar. Beton döküldükten sonra buraya bir daha ulaşılamaz, o yüzden en başta yapılır.",
  footRebar:
    "Temele inşaat demiri (donatı) yerleştirilir. Beton ezilmeye çok dayanıklıdır ama çekilmeye ve eğilmeye karşı zayıftır; o kuvveti demir taşır. Kolon demirleri de buradan yukarı filiz olarak çıkar ki temel ile bina tek parça çalışsın.",
  footForm:
    "Kalıp, betonun şeklini alacağı geçici kap. Sulu beton dökülünce akıp gitmesin, temel projedeki ölçüde çıksın diye kenarlara plywood levhalar kurulur. Beton sertleşince sökülür.",
  footPour:
    "Beton kalıba dökülür ve vibratörle titreştirilir ki içinde hava boşluğu kalmasın. Sonra kür yapılır: beton birkaç gün nemli tutulur. Çabuk kurursa çatlar ve hedeflenen dayanıma ulaşamaz.",
  // Reinforced-concrete frame, storey by storey.
  colRebar: byLabel(
    [[/perde/, "Kolonlar binanın ayakları; katların yükünü temele indirir. İçlerine boyuna demirler ve onları saran etriyeler konur. Etriyeler depremde kolonun patlayıp dağılmasını önler. Perde duvar çok uzun bir kolon gibidir; binanın depremde yana savrulmasını engeller."]],
    "Kolonlar binanın ayakları; katların yükünü temele indirir. İçlerine boyuna demirler ve onları saran etriyeler konur. Etriyeler depremde kolonun patlayıp dağılmasını önler, bu yüzden sık ve uçları kancalı olmalı.",
  ),
  colForm:
    "Kolon demirinin etrafına kutu biçiminde kalıp kurulur ve şakulüne getirilir, yani tam dik durduğu kontrol edilir. Eğri bir kolon yükü yamuk taşır ve zayıflar.",
  colPour:
    "Kolon kalıbına beton dökülüp vibratörle sıkıştırılır. Beton yeterince sertleşince kalıp sökülür ve bir sonraki katta yeniden kullanılır.",
  deckForm: byLabel(
    [[/hatıl/, "Yatay hatıl, duvarların üstünü çepeçevre saran betonarme bir kuşak. Duvarları birbirine bağlar ki depremde ayrılıp devrilmesinler. Üstündeki döşemeyle birlikte kalıbı kurulur."]],
    "Döşeme, yani katın tabanı ve onu taşıyan kirişler için kalıp kurulur. Altına dikme denen ayarlı çelik direkler dizilir; beton kendini taşıyacak kadar sertleşene kadar bütün ağırlığı bu dikmeler çeker.",
  ),
  deckRebar: byLabel(
    [[/hatıl/, "Hatıl ve döşemeye demir döşenir. Döşemeye yük binince ortası aşağı sarkmak ister ve alt yüzü gerilir; o gerilmeyi demirler karşılar. Hatıl demirleri köşelerde birbirine bindirilir ki kuşak kopuksuz olsun."]],
    "Kiriş ve döşemeye demir döşenir. Döşemeye yük binince ortası aşağı sarkmak ister ve alt yüzü gerilir; o gerilmeyi demirler karşılar. Demirlerin altına plastik takoz konur ki betonun içinde kalsınlar ve paslanmasınlar (pas payı).",
  ),
  deckPour:
    "Kiriş ve döşeme betonu tek seferde dökülür ki aralarında ek yeri olmasın, birlikte çalışsınlar. Yüzey mastarla düzlenir, kür için sulanır. Dikmeler beton yeterince güçlenene kadar sökülmez.",
  // Load-bearing masonry.
  wallLay:
    "Yığma binada duvarın kendisi taşıyıcıdır, ayrıca kolon yoktur. Tuğla ya da taşlar harçla ve derzler şaşırtılarak örülür ki bir çatlak tek çizgide ilerleyemesin. Kapı ve pencere üstüne lento konur; boşluğun üstündeki duvarı o taşır.",
  tieCol:
    "Düşey hatıllar, duvar köşelerine ve birleşimlerine dökülen ince betonarme dikmeler. Duvarları köşelerden birbirine kenetler; yığma binalar depremde en çok köşelerinden ayrılır.",
  // Timber frame.
  studs:
    "Ahşap karkasın iskeleti kurulur. Alt kiriş temele çelik ankrajlarla bağlanır, üstüne dikmeler çakılır. Çaprazlar dikdörtgenlerin yamulmasını, yani binanın rüzgârda ya da depremde yana yatmasını önler.",
  joists:
    "Ahşap kirişler belli aralıklarla dizilir, üstüne OSB levha (preslenmiş ahşap yongalardan plaka) çakılır. Kirişler yükü duvarlara taşır; OSB hem zemin olur hem de katı tek bir sağlam tabla gibi bağlar.",
  sheath:
    "Karkasın dışı OSB ile kaplanır, üstüne rüzgâr bariyeri denen nefes alan bir örtü sarılır. Rüzgârı ve yağmuru içeri almaz ama içerideki nemi dışarı bırakır; ahşap böylece çürümez.",
  // Steel frame.
  steelCol:
    "Çelik kolonlar vinçle getirilir, temeldeki ankraj bulonlarına oturtulup sıkılır. Bulonlar kolonu temele sağlam bağlar. Parçalar fabrikada hazırlandığı için sahada iş hızlı ilerler.",
  steelBeam:
    "Kolonların arasına çelik kirişler takılır ve bulonlarla birleştirilir. Bulonlar belli bir kuvvete (torka) kadar sıkılır; gevşek kalan bulon birleşimin kaymasına yol açar.",
  brace:
    "Çaprazlar, çerçevelere çapraz takılan çelik çubuklar. Dikdörtgen bir çerçeve yandan itilince kolayca yamulur ama üçgen yamulmaz. Çapraz, çerçeveyi üçgenlere böler ve binayı rüzgâra, depreme karşı sağlamlaştırır.",
  steelDeck:
    "Kirişlerin üstüne dalgalı trapez sac serilir, üstüne beton dökülür. Sac hem kalıp görevi görür hem de betonla birlikte çalışır; böylece kalıp sökmeye gerek kalmaz.",
  // Walls, roof, openings, finishes.
  walls:
    "Betonarme binada duvarlar yük taşımaz; kolon ve kirişlerin arasını doldurur. Gazbeton hafif ve ısıyı iyi tutan bir blok olduğu için tercih edilir. Kapı ve pencere üstüne lento konur ki üstteki duvar boşluğa çökmesin.",
  roofFrame: byLabel(
    [
      [/Kubbe/, "Kubbenin oturacağı taşıyıcı halka kurulur. Kubbe ağırlığıyla dışa doğru açılmak ister; halka onu bir fıçı çemberi gibi toplar."],
      [/çelik/, "Çatıyı taşıyacak çelik makaslar ve üstlerine enine aşıklar yerleştirilir. Makas, üçgenlerden oluşan bir kafes kiriş; üçgen yamulmadığı için ince parçalarla geniş bir açıklık geçilir."],
    ],
    "Çatı iskeleti kurulur. Makaslar, üçgen biçiminde birleştirilmiş ahşap kirişlerdir; çatının ağırlığını duvarlara indirir. Üstlerine enine aşıklar konur, kaplama onlara çakılır.",
  ),
  roofDeck: byLabel(
    [
      [/Kubbe/, "Kubbe yüzeyi kaplanır ve üstüne su yalıtımı yapılır. Eğri yüzeyde su hızlı akar ama ek yerlerinden sızmaya meyillidir, bu yüzden yalıtım eksiksiz sarılır."],
      [/alüminyum/, "Cam panellerin oturacağı alüminyum kayıtlar ve contalar takılır. Conta, cam ile metal arasında su ve hava geçirmeyen lastik bir şerit; camı titreşimden de korur."],
    ],
    "Aşıkların üstüne OSB levha çakılır, onun da üstüne su yalıtım örtüsü serilir. Kiremit tek başına rüzgârlı yağmuru tam durduramaz; altındaki örtü ikinci bir savunma hattıdır.",
  ),
  roofTiles: byLabel(
    [
      [/Kubbe/, "Kubbe metal levhalarla kaplanır. Metal hafif ve uzun ömürlüdür, eğri yüzeye de kolayca uyar."],
      [/cam/, "Çatıya temperli cam paneller yerleştirilir. Temperli cam ısıl işlemle güçlendirilmiştir; kırılırsa keskin parçalar yerine küçük, künt tanelere ayrılır."],
    ],
    "Kiremitler saçaktan, yani çatının alt kenarından başlayıp mahyaya, yani tepeye doğru dizilir. Böylece her sıra bir alttakinin üstüne biner ve yağmur suyu hep dışa akar, alttan içeri giremez.",
  ),
  finish: byLabel(
    [
      [/cam/, "Çelik iskeletin dışına alüminyum kayıtlar takılır ve cam paneller bunlara oturtulur. Cam yük taşımaz; sadece rüzgâra dayanır ve içeriyi dış havadan ayırır."],
      [/ahşap/, "Dış cephe ahşap tahtalarla kaplanır ve verniklenir. Vernik ahşabın su emip çürümesini ve güneşte grileşmesini geciktirir."],
      [/tuğla/, "Tuğlaların arasındaki derzler harçla doldurulup düzeltilir ki su girmesin. Betonarme hatıllar da tuğlayla kaplanır, böylece cephe tek parça görünür."],
    ],
    "Taşların arasındaki derzler doldurulur ki yağmur suyu duvara işlemesin. Betonarme hatıllar da taşla kaplanır, cephe bütün görünür.",
  ),
  openings: byLabel(
    [[/havalandırma/, "Kapılar ve havalandırma kapakları takılır. Cam yapılarda içerisi güneşle çok ısınır; açılır kapaklar sıcak havayı dışarı verir."]],
    "Pencere doğramaları ve kapı takılır. Kenarlardaki boşluk köpük ve bantla doldurulur ki ısı ve su kaçmasın; pencere kenarları binada en sık sızıntı yapan yerdir.",
  ),
  eps: "Mantolama, binayı dışarıdan bir mont gibi saran ısı yalıtımı. Yalıtım levhaları duvara yapıştırılır ve plastik dübellerle sabitlenir. Kışın ısının, yazın serinliğin kaçmasını önler, faturayı düşürür ve duvarlarda küfe yol açan terlemeyi engeller.",
  render:
    "Yalıtım levhalarının üstüne file gömülü ince sıva çekilir. File, sıvanın çatlamasını önleyen bir ağ gibi çalışır; sıva da levhaları güneşe ve darbeye karşı korur.",
  paint: "Dış cephe boyanır. Boya sadece süs değildir: sıvayı yağmura ve güneşin yıpratmasına karşı korur.",
  handover:
    "Şantiye toplanır: çit, konteyner ve makineler gider, bahçe düzenlenir. Son kontroller yapılır ve bina sahibine teslim edilir; ardından oturma izni (iskân) alınır.",
};

// The ground steps and the handover mean the same on every building.
const SHARED = new Set(["mobilize", "layout", "dig", "lean", "footWater", "footRebar", "footForm", "footPour", "handover"]);

const OWN = {
  geodesic: {
    ringForm:
      "Kubbenin oturacağı betonarme halka kiriş için demir bağlanır, kalıp kurulur ve kubbe çubuklarının bağlanacağı ankraj bulonları yerine konur. Kubbe yükünü bu halkaya, halka da temele verir.",
    ringPour: "Halka kirişe beton dökülür ve kür edilir. Kubbe ağırlığıyla dışa doğru açılmak ister; halka onu bir fıçı çemberi gibi toplar.",
    shore: "Kubbenin ortasına geçici bir iskele kulesi kurulur. Kubbe kapanana kadar parçalar kendini taşıyamaz; kule onları ortadan tutar.",
    strut:
      "Jeodezik kubbe üçgenlerden oluşur: çelik çubuklar düğüm noktalarında birleşir. Üçgen yamulmayan tek şekil olduğu için ince çubuklarla bile çok sağlam bir kabuk çıkar. Kubbe tabandan tepeye halka halka örülür.",
    bolts:
      "Bütün düğüm bulonları belli bir kuvvete kadar sıkılır ve kubbenin şekli ölçülür. Tek bir düğüm yanlış yerdeyse yük orada toplanır; geometri tutmalı ki her çubuk payına düşeni taşısın.",
    unshore: "Ortadaki iskele yavaş yavaş indirilir. Kubbe artık kapalı bir kabuk; yükünü çubuklar üzerinden halkaya kendisi aktarıyor.",
    panels: "Üçgen boşluklar sandviç panellerle kapatılır: iki metal levhanın arasında taş yünü. Taş yünü ısıyı tutar, yanmaz ve sesi de keser.",
    glazing:
      "Pencerelere ve tepedeki fenere lamine cam takılır. Lamine cam, arasında folyo olan iki camdır; kırılsa bile parçaları folyoya yapışık kalır ve kimsenin başına düşmez.",
    seal: "Paneller arasındaki derzlere EPDM lastik conta konur, üstü kapak profilleriyle örtülür. Kubbede yüzlerce ek yeri var ve her biri su sızdırabilir; o yüzden tek tek kapatılır.",
    openings:
      "Giriş tüneli ve cam kapı yapılır. Kubbenin bir üçgenini kesip kapı açmak taşıyıcı ağı bozacağı için giriş, dışarı çıkıntı yapan bir tünel olarak eklenir.",
  },
  kemer: {
    divert:
      "Batardo, suyun içindeki bir alanı kuru tutmak için yapılan geçici set. Kum torbalarıyla dere suyu yana çevrilir ki ayak temelleri kuru zeminde yapılabilsin.",
    abutDig: "Köprü ayaklarının temeli için dere kenarları kazılır. Kemer yükünü sadece aşağı değil yanlara doğru da iter; bu itkiyi sağlam zemine oturan ayaklar karşılar.",
    abutFoot: "Ayak temellerine demir konur ve beton dökülür. Kemerin bütün ağırlığı ve yana itkisi bu iki temele biner.",
    abutWall: "Kesme taş ayaklar üzengi taşına kadar örülür. Üzengi taşı, kemerin ilk taşının yaslandığı eğik yüzlü taştır.",
    centering:
      "Kemer taşları tek başına duramaz; kilit taşı konana kadar altlarında ahşap bir merkez kalıbı olmalı. Taşlar bu yay biçimli iskelenin üstüne dizilir.",
    voussoir:
      "Kama biçimli kemer taşları iki yandan aynı anda, simetrik dizilir. Tek taraftan gidilse iskele dengesiz yüklenip yana yatabilirdi.",
    keystone:
      "Kilit taşı kemerin tepesine en son konan taş. O girdiği anda iki yarım kemer birbirine yaslanır ve kemer çalışmaya başlar: taşlar birbirini sıkıştırarak ayakta durur.",
    spandrel: "Omuz duvarları kemerin iki yanında yol seviyesine kadar örülür. Kemerin üstündeki dolguyu tutar ve yolu taşır.",
    fill: "Kemerin üstü kırma taşla doldurulur, drenaj ve su yalıtımı yapılır. Dolgu yükü kemere yayar; su ise taşların arasına sızıp donunca onları çatlatacağı için dışarı atılmalı.",
    strike: "Kemer iskelesi yavaşça indirilir ve sökülür. Taşlar biraz oturup birbirine kenetlenir; kemer artık kendini ve üstündekileri taşıyor.",
    paving: "Yola kaldırım taşı döşenir. Hem yürüme yüzeyi olur hem de yağmuru dolguya sokmadan kenarlara akıtır.",
    parapet: "Kenarlara korkuluk duvarı örülür, üstüne harpuşta taşları konur. Harpuşta, duvarın tepesini örten eğimli taş; yağmuru duvarın içine değil dışına akıtır.",
    water: "Batardo sökülür ve dere eski yatağına döner. Artık su kemerin altından akıyor.",
    handover: "Fenerler takılır ve köprü kullanıma açılır. Taş kemer köprüler bakım görürse yüzlerce yıl dayanır.",
  },
  serender: {
    footing: "Dört ayağın altına düz taş kaideler konur. Ahşap toprağa değerse nemden çürür; taş onu yerden ayırır.",
    posts: "Kestane ağacından dört dikme dikilir. Kestane sert, rutubete dayanıklı ve böcek tutmayan bir ağaç; Karadeniz'in yağışlı havası için biçilmiş kaftan.",
    discs:
      "Dikmelerin başına yassı, geniş taşlar konur: fare taşı. Fare dikmeye tırmanır ama taşın altından baş aşağı dönüp üstüne çıkamaz, ambara ulaşamaz. Yüzyıllardır kullanılan çok akıllıca bir çözüm.",
    sill: "Taban kirişleri dikmelerin üstüne yerleşir ve köşelerde boğaz geçmeyle birbirine geçer. Boğaz geçmede kirişlere oyuk açılıp çapraz oturtulur, çivi gerekmez.",
    frame: "Köşe dikmeleri ve aralarına yatay kuşaklar kurulur. Bu çerçeve hem duvar tahtalarını tutar hem de yapıyı kare tutar.",
    boards:
      "Kenarları oluklu tahtalar dikmelerin yarığına yukarıdan kaydırılarak yerleştirilir. Çivisiz ama sıkı bir duvar olur; ahşap kuruyup şişse de tahta yuvasında oynayabildiği için çatlamaz.",
    roofFrame: "Çatı iskeleti için mertekler ve en tepeye mahya kirişi konur. Dik çatı Karadeniz'in bol yağmurunu hemen akıtır.",
    roofTiles: "Çatı hartamayla, yani ince ahşap pullarla balık pulu gibi bindirilerek kaplanır. Her pul alttakinin üstüne bindiği için su içeri giremez.",
    openings: "Oyma kapı ve havalandırma parmaklığı takılır. Mısır ve fındık kuruyabilmek için hava almalı; parmaklık ambarı havalandırır.",
    ladder: "Seyyar merdiven ve mısır askıları konur. Merdiven sabit değildir; kullanılmadığında çekilir ki fareler ona tırmanamasın.",
  },
  kerpic: {
    mudbrick:
      "Kerpiç, pişirilmemiş toprak tuğla. Çamura saman katılır, ahşap kalıplara basılır ve güneşte kurutulur. Saman, kururken çatlamasını önler. Ucuzdur, her yerde bulunur ve sıcağı içeri geç geçirir.",
    stoneFoot: "Moloz taştan temel ve zeminden biraz yükselen subasman yapılır. Kerpiç suya değerse erir; taş taban duvarları yerden gelen nemden ve yağmur sıçramasından korur.",
    cellWalls:
      "Kerpiç duvarlar çamur harçla, derzler şaşırtılarak örülür. Kalın toprak duvar gündüz sıcağı emer, gece yavaş yavaş geri verir; Harran'ın kavurucu yazında içerisi serin kalır.",
    corbel:
      "Kubbe kalıpsız örülür: her kerpiç sırası bir alttakinden biraz içeri taşırılır, ta ki tepede kapanana kadar. Bu yönteme bindirme denir. Tepede bırakılan delikten sıcak hava çıkar, ışık girer.",
    plaster: "Duvarlar ve kubbeler iki kat samanlı çamur sıvayla kaplanır. Sıva kerpici yağmurdan korur; aşındıkça yenilenir.",
    openings: "Alçak kapılar ve küçük pencereler açılır. Küçük açıklıklar sıcağı dışarıda tutar ve kerpiç duvarı zayıflatmaz.",
    court: "Avlu duvarı, ekmek pişirilen tandır ve asma çardağı yapılır. Günlük hayatın çoğu bu gölgeli avluda geçer.",
  },
  kabuk: {
    columns:
      "Her şemsiye tek bir betonarme kolona oturur. Kolonun içinden yağmur borusu geçer: şemsiye ters olduğu için yağmur ortada toplanır ve kolonun içinden aşağı iner.",
    shellForm:
      "İskele kurulur, üstüne düz tahtalarla kalıp çakılır ve hasır donatı serilir. Şemsiyenin eğri yüzeyi aslında düz çizgilerden oluşan bir şekil (hiperbolik paraboloit); bu sayede eğri kalıp düz tahtalarla yapılabiliyor.",
    shellPour:
      "Sadece 4 cm kalınlıkta beton dökülür, kür edilir, sonra kalıp sökülür. Bu kadar ince olmasına rağmen taşır, çünkü gücü kalınlığından değil eğri şeklinden gelir; tıpkı yumurta kabuğu gibi.",
    floorFinish: "Zemine terrazzo (mermer kırıklı, cilalı beton) dökülür ve yer süzgeçleri konur. Pazar yeri sık yıkanır; su süzgeçlere akmalı.",
    stalls: "Tezgâhlar ve kasalar yerleştirilir. Kolonlar az olduğu için şemsiyelerin altı geniş ve ferah kalır.",
    openings: "Sarkıt lambalar ve tabela takılır. Pazar akşam da açık kalabilsin diye her şemsiyenin altı ayrı aydınlatılır.",
  },
  gergi: {
    excavate: "Arazi oturma kademelerinin şekline göre kazılır; kenarlar göçmesin diye şevli bırakılır.",
    tiers: "Betonarme oturma kademeleri ve sahne dökülür. Her sıra bir öncekinden biraz yüksek olur ki herkes öndekinin başının üstünden sahneyi görsün.",
    anchors:
      "Direk temelleri ve zemine çakılan ankrajlar yapılır. Rüzgâr membranı yukarı çekmek ister; ankrajlar yapıyı yere bağlar. Tasarım yükünün 1,5 katıyla çekilerek test edilir.",
    masts: "Çelik direkler yerde birleştirilir ve vinçle dikilir. Yüksekte parça parça kurmak hem tehlikeli hem yavaş olurdu.",
    cables: "Gergi halatları direkleri ayakta tutar; kenar kabloları membranın kenarlarını taşır.",
    membrane:
      "PTFE kaplı cam elyafı membran paketinden açılır ve köşelere bağlanır. Kâğıt kadar ince ama çok güçlüdür; ışığı geçirir, güneşi yansıtır ve yağmurla kendini temizler.",
    tension:
      "Membran köşe plakalarından krikoyla gerilir. Kumaş ancak gergin olunca taşır; gevşek kalırsa rüzgârda bayrak gibi dalgalanıp yırtılır. Membranın eyer gibi bir yönde yukarı, öbür yönde aşağı kıvrık olması bu yüzden.",
    seats: "Beton kademelerin üstüne ahşap oturma tahtaları vidalanır; ahşap betondan daha sıcak ve rahattır.",
    stage: "Sahne döşemesi yapılır; ahşap, ayak sesini ve müziği betondan daha sıcak yansıtır.",
    lights: "Direklere projektörler takılır; ışık beyaz membrana vurunca bütün amfi aydınlanır.",
  },
  konsol: {
    pit: "Çekirdek ve karşı ağırlık radyesi için kazı yapılır. Ev boşluğa 4,8 m uzanıyor; devrilmemesi için arkada ağır bir beton blok lazım, tahterevallinin öbür ucundaki kişi gibi.",
    raftRebar:
      "Radye, binanın altına tek parça yayılan kalın beton plak. Donatısı bağlanır, arka uca çekme ankrajları konur: konsol öne devrilmek isterken arka uç yukarı kalkmak ister, ankrajlar onu aşağıda tutar.",
    raft: "Karşı ağırlık radyesine beton dökülür. Ağırlığı ne kadar fazlaysa konsolu o kadar güvenle dengeler.",
    coreWall: "Çekirdek perdeleri için demir bağlanır ve kalıp kurulur. Kafes kirişlerin bağlanacağı çelik plakalar betona gömülecek şekilde yerleştirilir.",
    corePour: "Çekirdek perdelerine beton dökülür. Çekirdek bütün evin dayandığı omurga.",
    props: "Konsolun ucuna kadar geçici iskele kuleleri kurulur. Kafes kirişler tamamlanıp bağlanana kadar boşluktaki kısmı bunlar taşır.",
    truss:
      "Kat yüksekliğinde çelik kafes kirişler çekirdekten uca doğru kurulur. Kafes kiriş üçgenlerden oluşan çok rijit bir kiriştir; bütün kat yüksekliğini kullandığı için boşluğa bu kadar uzanabilir.",
    deck: "Kafes kirişlerin üstüne trapez sac serilir ve beton dökülür. Sac hem kalıp olur hem de betonla birlikte çalışır.",
    release:
      "İskele kuleleri yavaşça indirilir; konsol artık kendini taşıyor. Ucun ne kadar sarktığı (sehim) ölçülüp hesapla karşılaştırılır: ölçülen hesaptan az çıkarsa yapı beklendiği gibi davranıyor demektir.",
    glazing: "Cam giydirme cephe çekirdekten uca doğru takılır. Cam yük taşımaz; kafes kirişlere asılır.",
    cladding: "Çatı ve döşeme alınları çinkoyla kaplanır. Çinko paslanmaz; zamanla kendi koruyucu tabakasını oluşturur.",
    openings: "Giriş kapısı ve çekirdek penceresi takılır. Kapılar çekirdekte; konsolun ucu yük almasın diye ağır işler hep arka tarafta toplanır.",
    swing: "Konsolun altına salıncak asılır. Boşlukta duran bir evin altı en güzel gölgelik.",
  },
  kapsul: {
    core: "Beton çekirdek tırmanır kalıpla yükselir: kalıp her dökümden sonra kendini bir kat yukarı kaldırır. Böylece dış iskele kurmadan, hızla yukarı çıkılır. Merdiven, asansör ve tesisat çekirdeğin içinde.",
    plates: "Kapsüllerin bağlanacağı çelik plakalar ve bulon şablonları yerleştirilir. Şablon bulonları milimetrik doğru yere koyar; fabrikadan gelen kapsülün delikleri ancak öyle oturur.",
    capsules:
      "Kapsüller fabrikada içi döşenmiş hazır odalar. Kamyonla gelir, vinçle kaldırılır ve sadece dört bulonla çekirdeğe takılır. Eskiyince sökülüp yenisiyle değiştirilebilsin diye böyle tasarlanmış.",
    torque: "Her kapsülün dört bulonu torkmetreyle belli bir kuvvete kadar sıkılır. Bir oda bütün ağırlığıyla bu dört bulona asılı; hiçbiri eksik sıkılmamalı.",
    lobby: "Zemin katta cam giriş holü yapılır. Kapsüller yukarıda olduğu için zemin boş kalır; giriş, asansör ve posta kutuları burada toplanır.",
    services: "Kapsüllere su ve elektrik bağlanır; çekirdekteki ana hatlardan her odaya ayrı ayrı.",
    roof: "Çatıya su deposu ve uyarı ışıklı direk konur. Yukarıdaki depo, suyu yer çekimiyle aşağıdaki odalara basınçlı gönderir; ışık da uçaklar binayı görsün diye.",
  },
  burgu: {
    core: "Çekirdek perdeleri tırmanır kalıpla yükselir. Kule bükülse de çekirdek dimdik durur; rüzgâr ve deprem yükünü o taşır.",
    floors:
      "Her kat masa kalıpla dökülür: tek parça bir kalıp tablası kattan kata taşınır. Eğik kolonlar her katı bir alttakine göre 9° döndürür; kule bu yüzden burgu gibi görünür. Rüzgâr dönen yüzeye tutunamadığı için kule daha az sallanır.",
    glazing: "Cam cephe kat kat takılır. Yüzey büküldüğü için her panel komşusundan biraz farklı açıyla oturur.",
    crown: "Çatıya taç ve uyarı ışığı konur. Yüksek binaların tepesinde kırmızı ışık zorunludur ki pilotlar binayı gece de görsün.",
    openings: "Giriş ve lobi yapılır. İnsanların ilk gördüğü yer olduğu için, iskele ve vinç gittikten sonra en son burası bitirilir.",
  },
  sukulesi: {
    shaft: "Altı kolon ve onları bağlayan kuşak kirişler kat kat yükselir. Kuşaklar, ince uzun kolonların yük altında yana bükülmesini (burkulmayı) önler.",
    tankForm:
      "Su haznesinin kalıbı ve demiri hazırlanır. Intze tipi hazne: altta konik bir halka, üstte silindir. Konik kısım suyun ittiği yükü dengeler ve hazneyi hafifletir. Ek yerlerine su tutucu bantlar konur.",
    tankPour: "Hazne betonu tek seferde dökülür. Ara verilirse eski ve yeni beton arasında soğuk derz oluşur, su da tam o çizgiden sızar.",
    dome: "Haznenin üstüne kubbe ve havalandırma feneri yapılır. Su seviyesi değiştikçe içeri hava girip çıkmalı, yoksa hazne vakum yapar.",
    waterTest: "Hazne suyla doldurulup bir gün bekletilir. Seviye düşmüyorsa sızıntı yok demektir. Kullanıma açmadan önce yapılması şart olan bir test.",
    stair: "Çelik merdiven ve hazne balkonu takılır; bakımcılar yukarı çıkabilsin diye.",
    paint: "Hazne gövdesi maviye boyanır. Boya betonu güneşe ve neme karşı korur.",
    openings: "Su borular bağlanır ve uçaklar görsün diye tepeye uyarı ışığı takılır.",
  },
  keops: {
    level:
      "Kaya taban düzlenir. Mısırlılar zemine kanallar açıp su doldurdu; su yüzeyi her yerde aynı yükseklikte olduğu için kanalları buna göre ayarlayıp bütün tabanı neredeyse kusursuz düzlediler.",
    orient: "Taban karesi yıldızlara bakılarak tam kuzeye çevrilir. Sapma yalnızca 4 yay dakikası; pusulasız, 4500 yıl önce.",
    courses:
      "Kireçtaşı bloklar kızaklarla rampadan yukarı çekilir. Kızağın önündeki kum ıslatılınca sürtünme yarıya iner; bu Mısır duvar resimlerinde bile çizili. Bir blok ortalama 2,5 ton.",
    chamber:
      "Kral odası, 800 km uzaktaki Asvan'dan getirilen granit kirişlerle örtülür. Üstüne beş boşaltma odası yapılır: piramidin dev ağırlığını tavandan yanlara dağıtır ve kirişleri kırılmaktan korur.",
    capstone: "Tepe taşı (piramidion) konur. Dört yüzün tepede tek noktada buluşması bütün inşaatın ne kadar doğru gittiğinin sınavıdır.",
    casing: "Beyaz Tura kireçtaşı kaplama tepeden aşağı doğru konur ve perdahlanır; rampa da aşağı inildikçe sökülür. Bitince piramit güneşte parlayan pürüzsüz bir yüzey olur.",
    entrance: "Kuzey yüzünde giriş açılır. Girişin üstünde de taşlar çatı gibi eğik konmuştur; üstteki ağırlığı yanlara verip girişi ezilmekten korur.",
    handover: "Piramit tamamlanır: yaklaşık MÖ 2560, aşağı yukarı 20 yıllık bir iş.",
  },
  kolezyum: {
    drain: "İmparator Nero'nun sarayının bahçesindeki yapay göl boşaltılır. Göl yatağı zaten kazılmış bir çukur; temel için biçilmiş kaftan.",
    foundation:
      "12 m derine Roma betonuyla halka temel dökülür; iş dört ekibe dört çeyrek olarak bölünür. Roma betonu kireç ve volkanik külle yapılır ve iki bin yıl dayanır.",
    piers: "Traverten taş ayaklar harçsız örülür; taşlar demir kenetlerle birbirine bağlanır. Ortaçağda insanlar bu demirleri sökmek için taşları oydu; bugün duvarlardaki delikler ondan.",
    radial: "Merkeze doğru uzanan ışınsal duvarlar ve üstlerine eğimli tonozlar yapılır. Oturma sıraları bu tonozların üstüne oturacak.",
    tiers:
      "Kemerli dış duvar üç kat yükselir: altta sade Toskan, ortada İyon, üstte en süslü Korint düzeni sütunlar. Kemer yükü yanlara dağıttığı için koca duvar az malzemeyle taşınır.",
    attic: "En üstte çatı katı örülür; gölgelik direklerinin oturacağı konsollar eklenir.",
    cavea: "Oturma sıraları tonozların üstüne mermerden yapılır. Yaklaşık 50 bin kişi; herkes sınıfına göre oturur.",
    arena: "Arena ahşap döşemeyle kapatılıp kumla örtülür. Latincede kuma harena denir; arena kelimesi buradan gelir.",
    velarium: "Velarium, seyirciyi güneşten koruyan dev bir gölgelik. 240 direğe halatlarla gerilir; bu iş için donanmadan denizciler getirilirdi.",
    statues: "Üst katların kemerlerine heykeller yerleştirilir. Kemerin boşluğu hem duvarı hafifletir hem de süsleme için hazır bir çerçeve olur.",
    handover: "MS 80'de İmparator Titus Kolezyum'u 100 gün süren oyunlarla açar.",
  },
  pisa: {
    found: "1173: Halka temel yumuşak kilin üstüne sadece 3 m derinlikte yapılır. Kil yükün altında ezilip sıkışacak; kule bu yüzden eğilecek.",
    floors0: "Zemin ve ilk iki kat örülür. Duvarların içi moloz taş dolgu, dışı mermer kaplama.",
    pause:
      "1178'de kule eğilmeye başlar ve savaşlar yüzünden inşaat 94 yıl durur. Bu bekleme şans oldu: kil o sürede sıkışıp sağlamlaştı. Durmasalardı kule büyük ihtimalle yıkılırdı.",
    floors1: "1272'de inşaata devam edilir. Ustalar eğikliği telafi etmek için alçak taraftaki katları daha yüksek örer; kule bu yüzden hafifçe muz gibi kavislidir.",
    bellChamber: "1372'de en üste çan katı yapılır. Ustalar eğikliğe karşı çan katını da hafifçe dik tarafa doğru eğik oturtur.",
    bells: "Yedi çan asılır; her biri ayrı bir notaya ayarlı. Sallanan çanlar kuleyi de titreştirdiği için bugün sallanmadan çalınıyor.",
    creep: "Kil yavaş yavaş sıkışmaya devam eder; altı yüzyılda eğim 5,5°'ye kadar çıkar ve kule yıkılma sınırına gelir.",
    stabilize:
      "1999-2001: Mühendisler kuzey tarafın altından eğik borularla azar azar toprak çeker. Kuzey biraz oturunca kule doğrulur ve 3,97°'ye iner. Tamamen düzeltilmedi, çünkü turistler zaten eğikliği görmeye geliyor.",
    handover: "Mucizeler Meydanı'nın çimleri düzenlenir ve kule ziyarete açılır.",
  },
  suleymaniye: {
    found: "Derin bir moloz taş temel yapılır ve oturması için bekletilir. Zemin önce otursun ki sonra duvarlarda çatlak çıkmasın; Sinan'ın temeli yıllarca beklettiği anlatılır.",
    walls:
      "Beden duvarları küfeki taşıyla örülür. Taşlar demir kenetlerle bağlanır, kenetlerin yuvasına kurşun dökülür: kurşun demiri paslanmaktan korur ve depremde biraz esneyebilir.",
    piers: "Dört fil ayağı ve aralarındaki dört büyük kemer yapılır. Ana kubbenin bütün ağırlığı bu dört kalın ayağa iner.",
    semi: "Mihrap ekseninde iki yarım kubbe yapılır. Ana kubbe yanlara açılmak ister; yarım kubbeler onu iki yandan destekler ve iç mekânı büyütür.",
    aisles: "Yan sahınlar küçük kubbelerle örtülür; bunlar da yükü kademe kademe dış duvarlara aktarır.",
    dome: "Ana kubbe ahşap iskele üstünde tuğladan örülür. Eteğindeki 32 pencere hem içeriyi aydınlatır hem kubbeyi hafifletir.",
    minarets: "Dört minare, toplam on şerefe yapılır. Kanuni Osmanlı'nın onuncu padişahı olduğu için on şerefe yapıldığı anlatılır.",
    lead: "Kubbeler kurşunla kaplanır, tepelerine alemler takılır. Kurşun su geçirmez, yüzyıllarca dayanır ve eğri yüzeye dövülerek kolayca uyar.",
    court: "Revaklı avlu ve ortasına şadırvan yapılır. Revak, önü kemerli sütunlarla açık üstü kubbeli bir galeri; avluyu güneşten ve yağmurdan korur.",
    interior: "İznik çinileri döşenir. Kandillerin isi hava akımıyla bir odada toplanır ve bu isten mürekkep yapılır: içerisi kararmaz, is de boşa gitmez.",
    handover: "1557'de Süleymaniye ibadete açılır.",
  },
  galata: {
    found: "1348: Moloz taş temel doğrudan kayaya oturtulur. Kaya hiç oturma yapmaz; ağır bir taş kule için en iyi zemin.",
    body: "Gövde moloz taştan örülür; dipte duvar 3,75 m kalınlığında. Ağırlık aşağıda toplandıkça kule daha dengeli durur. Katlar ahşap döşemelerle ayrılır, duvarlara dar mazgal pencereler açılır.",
    gallery:
      "Taş konsollar duvardan dışarı çıkar ve seyir balkonunu taşır. Konsol taşının büyük kısmı duvarın içine gömülüdür; üstteki duvarın ağırlığı onu sıkıştırıp düşmesini önler.",
    top: "Seyir katı kemerli pencerelerle yapılır. Kemer, pencerenin üstündeki taş duvarın yükünü yanlara aktarır; düz bir lento o yükü taşıyamazdı.",
    roof: "Tepeye konik külah, yani sivri çatı yapılır. Dik ve sivri olduğu için yağmur ve kar üstünde hiç durmaz.",
    storm: "1875'te bir fırtına külahı uçurur; kule yaklaşık 90 yıl düz çatıyla kalır.",
    restore: "1965-67 restorasyonunda külah yeniden yapılır, bu sefer içinde betonarme iskelet var; eski ahşaptan çok daha sağlam.",
    lights: "Gece aydınlatması takılır. Işıklar taşa aşağıdan vurur ki duvar dokusu gölgeleriyle birlikte görünsün.",
  },
  anitkabir: {
    level: "Rasattepe düzlenir. Kazıda Frig dönemine ait tümülüsler (mezar tepecikleri) çıkar; buluntular müzeye taşınır.",
    raftRebar: "Radye temel için demir bağlanır. Radye, binanın altına tek parça yayılan kalın beton plak; yükü geniş bir alana yayar.",
    raft: "Radye temel betonu dökülür. Bu kadar büyük bir plak, ek yeri olmasın diye mümkün olduğunca kesintisiz dökülür.",
    podium: "Holün oturduğu kaide betonarme yapılır, traverten taşla kaplanır. Meydandan hole 42 basamak çıkar; yarı yolda hitabet kürsüsü var, üstünde \"Hakimiyet kayıtsız şartsız milletindir\" yazar.",
    frame: "Şeref Holü'nün (41,65 × 57,35 m) betonarme iskeleti kurulur: önde ve arkada 8, yanlarda 14'er kolon. Dışarıdan taş bir yapı gibi görünür ama içi modern betonarmedir.",
    columns: "14,4 m'lik kolonlar beyaz Kayseri traverteniyle, hol duvarları sarı Çankırı traverteniyle kaplanır. Traverten gözenekli ama sağlam bir kireçtaşı. Ön cephede tunç kapının solunda Gençliğe Hitabe, sağında Onuncu Yıl Nutku altın varakla yazılır.",
    roof: "İlk projedeki taş tonoz 1951'de kaldırılır, yerine betonarme döşeme yapılır. Saçak kenarına Selçuklu testere dişi süsü, yani sıra sıra üçgen taş dişler oyulur.",
    lahit: "40 tonluk tek parça kırmızı mermer lahit taşı merdivenden çekilip yerine konur; altında beyaz Afyon mermeri var. Bu sembolik bir taş; asıl mezar odası onun tam altında, aşağıdaki katta.",
    square: "Tören Meydanı (129 × 84 m, 15.000 kişilik) kırmızı, siyah, sarı ve beyaz travertenle döşenir: 373 desen, hepsi Türk kilimlerinden alınmış.",
    lions: "262 m'lik Aslanlı Yol'a 12 çift oturan aslan konur: Hitit üslubunda, 24 Oğuz boyunu simgeler. Yolun başında erkek ve kadın heykel grupları durur.",
    towers: "On kule yapılır: İstiklal, Hürriyet, Mehmetçik, Müdafaa-i Hukuk, Zafer, Barış, 23 Nisan, Misak-ı Milli, İnkılap, Cumhuriyet. Çatıları eski Türk çadırları gibi alçak piramit, tepelerinde tunç mızrak ucu. Meydanın kenarına revaklar yapılır.",
    flag: "33,5 m'lik tek parça çelik bayrak direği dikilir. Bayrak kanundaki ölçülerle: boyu enin 1,5 katı, ay ve yıldız ölçüsünde. Çevresine Barış Parkı yapılır; yaklaşık 50 bin fidan 20'yi aşkın ülkeden gelmiştir.",
    handover: "10 Kasım 1953'te Atatürk'ün naaşı Anıtkabir'e taşınır.",
  },
  eyfel: {
    found:
      "Dört ayağa beton temel blokları yapılır. Seine'e yakın ayaklarda zemin suya doymuş; burada basınçlı havalı keson kullanılır: altı açık çelik bir kutu zemine indirilir, içine hava basılır ki su girmesin, işçiler içinde kazar.",
    legs: "18.038 demir parçanın hepsi fabrikada ölçüsünde delinmiş gelir; sahada sadece perçinlenir. Ayaklar dışa eğik olduğu için birleşene kadar altlarına ahşap iskeleler konur.",
    platform1: "Dört ayak 1. katta birleşir. Altlarındaki kum kutuları ve krikolarla her ayak milim milim ayarlanır ki kirişler tam yerinde buluşsun.",
    floor2: "Yürüyen vinçler ayakların üstündeki raylarla birlikte tırmanır ve 2. kat kurulur.",
    shaft: "Dört ayak yukarıda tek gövdede birleşir ve gövde 3. kata kadar yükselir.",
    crown: "Tepeye fener ve bayrak direği takılır; kule 300 m'yi bulur. Kafes yapı rüzgârı içinden geçirdiği için bu yükseklikte bile tepe sadece birkaç santim sallanır.",
    paint: "Kule 60 ton boyayla boyanır. Demir boyasız kalırsa paslanır; Eyfel bugün de yaklaşık her 7 yılda bir baştan boyanıyor.",
    lights: "Asansörler ve ışıklar takılır. Ayaklar eğik olduğu için asansörler eğri raylar üzerinde çıkar.",
    handover: "31 Mart 1889'da Dünya Fuarı için açılır. Aslında 20 yıl sonra sökülecekti; radyo anteni olarak işe yarayınca kaldı.",
  },
  sidney: {
    piles: "580 beton kazık zemine çakılır. Kazık, yükü yumuşak üst tabakadan aşağıdaki sağlam zemine indiren uzun beton direk.",
    podium: "Podyum katlanmış plak kirişlerle yapılır. Kâğıdı akordeon gibi katlayınca nasıl sertleşiyorsa, katlanmış beton da az malzemeyle uzun açıklık geçer.",
    precast:
      "Utzon'un çözümü: bütün kabuklar aynı 75 m yarıçaplı kürenin parçaları olarak tasarlanır. Böylece nervürler aynı kalıplarda önceden dökülmüş (prekast) parçalar olarak üretilebilir. Bu fikir bulunana kadar kabuklar yapılamıyordu.",
    shells:
      "Çelik bir kurulum kemeri üstünde nervür parçaları vinçle tek tek yerine konur. İçlerinden geçen çelik halatlar gerilir (ard germe) ve bütün parçaları tek bir kabuk gibi sıkıştırır.",
    tiles: "Kabuklar 4.253 karo panelle kaplanır; üstlerinde 1.056.006 İsveç karosu var. Parlak ve mat karolar karışık dizildiği için güneşte o meşhur pırıltıyı verir, yağmurla da kendini temizler.",
    glass: "Kabukların ağızları cam duvarlarla kapatılır. Camlar kabuğa asılır, onu taşımaz; kabuk kendi kendini taşır.",
    stairs: "Anıtsal merdiven granitle kaplanır, salonların içi tamamlanır. Salonların içinde ses için ayrı tavanlar var; kabukların içi ses açısından çok uygun değildi.",
    handover: "20 Ekim 1973'te açılır; inşaat planlanandan 10 yıl uzun sürmüştü.",
  },
  burj: {
    piles: "192 fore kazık yapılır: zemin delinir, içine demir kafes konup beton dökülür. 1,5 m çaplı, 50 m derin. Zemin zayıf olduğu için kule ağırlığını kazıkların yan yüzündeki sürtünmeyle taşır.",
    raftRebar: "Radye donatısı bağlanır; kazık başları radyenin içine gömülecek şekilde hazırlanır.",
    raft: "3,7 m kalın radye dökülür. Beton sertleşirken ısınır; bu kadar kalın bir betonun içi kendini çatlatacak kadar ısınabilir. Bu yüzden gece ve buzlu suyla karılarak dökülür.",
    core: "Gövde tırmanır kalıpla yükselir. Plan Y biçiminde: ortada çekirdek, üç kanat birbirine payanda olur. Kanatlar sarmal kademelerle geri çekilir; rüzgâr her katta farklı bir şekle çarptığı için kuleyi sallayan girdaplar toparlanamaz. Beton 600 m'ye pompalanır.",
    spire: "Sivri uç gövdenin içinde birleştirilir ve hidrolik krikolarla yukarı itilir. O yükseklikte vinçle parça taşımak çok zor olurdu.",
    cladding: "Cepheye 26.000 cam panel takılır; çöl güneşini yansıtan özel kaplamalı camlar.",
    lights: "Işıklar ve asansörler takılır. Bu yükseklikte tek asansör yetmez; yolcular aradaki aktarma katlarında asansör değiştirir.",
    handover: "4 Ocak 2010'da 828 m ile dünyanın en yüksek yapısı olarak açılır.",
  },
};

const CHECK = {
  inspect:
    "Yapı denetim mühendisi gelir ve bir iş kapanıp görünmez olmadan önce projeye uygun yapılmış mı diye kontrol eder: demirin sayısı, kalınlığı, aralığı, bağlantılar. Onay çıkmadan sonraki işe geçilmez; hatayı şimdi düzeltmek, sonra yıkıp yapmaktan çok daha ucuz.",
  slump:
    "Beton gelince önce kıvamına bakılır: huni biçimli kalıp betonla doldurulup kaldırılır, betonun ne kadar çöktüğü ölçülür. Fazla sulu beton zayıf olur. Bir de küp kalıplara numune alınır; laboratuvarda 7 ve 28 gün sonra ezilip betonun istenen dayanımda olup olmadığına bakılır.",
};

const textOf = (v, label) => (typeof v === "function" ? v(label) : v);

/** The explanation for phase `p` of the building `sp`, or null. */
export function phaseInfo(sp, p) {
  const own = sp?.special ? OWN[sp.special] : null;
  const v = own ? own[p.key] ?? (SHARED.has(p.key) ? GENERIC[p.key] : null) : GENERIC[p.key];
  return v ? textOf(v, p.label) : null;
}

/** What the caption's (i) opens for the stage under way: { title, text } or null. */
export function stageInfo(sp, p, check, label) {
  const text = check ? CHECK[check.kind] : phaseInfo(sp, p);
  return text ? { title: label, text } : null;
}
