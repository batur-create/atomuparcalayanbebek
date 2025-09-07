import React from 'react';
import { 
  Menu, X, Search, ShoppingCart, Star, Heart, 
  ChevronDown, ChevronUp, Mail, Phone, Clock, MapPin,
  Instagram, Twitter, Facebook, Youtube, Sparkles, 
  Atom, Microscope, Dna, Rocket,
  Award, Package, Shield, TestTube
} from 'lucide-react';

// HomePage component'i, ihtiyaç duyduğu tüm state ve fonksiyonları props olarak alır.
export default function HomePage({
  products,
  themes,
  currentTheme,
  isScrolled,
  isMenuOpen,
  setIsMenuOpen,
  cartItems,
  handleGoToCart,
  searchTerm,
  setSearchTerm,
  activeFilters,
  handleFilterChange,
  clearFilters,
  filteredProducts,
  handleProductClick,
  toggleLike,
  likedProducts,
  handleAddToCart,
  handleBuyNow,
  faqData,
  activeFaq,
  setActiveFaq,
  contactForm,
  setContactForm,
  handleContactSubmit
}) {
  return (
    <>
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'}`}>
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Atom className="w-8 h-8" style={{ color: currentTheme.primary }} />
              <h1 className="text-2xl font-bold" style={{ color: currentTheme.primary }}>
                Atomu Parçalayan Bebek
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#products" className="hover:opacity-70 transition-opacity">Ürünler</a>
              <a href="#about" className="hover:opacity-70 transition-opacity">Hakkımızda</a>
              <a href="#faq" className="hover:opacity-70 transition-opacity">SSS</a>
              <a href="#contact" className="hover:opacity-70 transition-opacity">İletişim</a>
              <div className="relative cursor-pointer" onClick={handleGoToCart}>
                <ShoppingCart className="w-6 h-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
              aria-label="Menüyü aç/kapat"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="flex flex-col gap-4">
                <a href="#products" onClick={() => setIsMenuOpen(false)}>Ürünler</a>
                <a href="#about" onClick={() => setIsMenuOpen(false)}>Hakkımızda</a>
                <a href="#faq" onClick={() => setIsMenuOpen(false)}>SSS</a>
                <a href="#contact" onClick={() => setIsMenuOpen(false)}>İletişim</a>
                <div className="relative cursor-pointer" onClick={() => { setIsMenuOpen(false); handleGoToCart(); }}>
                  <ShoppingCart className="w-6 h-6 inline-block" />
                  <span className="ml-2">Sepetim ({cartItems.reduce((total, item) => total + item.quantity, 0)})</span>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: currentTheme.primary }}>
            Bilimi Keşfet, Eğlenerek Öğren
          </h2>
          <p className="text-lg mb-8 text-gray-600">
            Çocuklar ve yetişkinler için özenle seçilmiş bilim ürünleri.
            Oyunla öğrenmenin, merakla büyümenin adresi.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 rounded-full text-white font-semibold transition-all transform hover:scale-105"
              style={{ backgroundColor: currentTheme.primary }}
            >
              Ürünleri Keşfet
            </button>
            <button 
              onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 rounded-full border-2 font-semibold transition-all hover:bg-gray-50"
              style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
            >
              Hikayemiz
            </button>
          </div>
        </div>
        <div className="mt-12 flex justify-center gap-8 flex-wrap">
            {currentTheme.animation === 'wave' && <div className="animate-wave"><Sparkles className="w-12 h-12" style={{ color: currentTheme.secondary }} /></div>}
            {currentTheme.animation === 'bubble' && <div className="animate-bubble"><TestTube className="w-12 h-12" style={{ color: currentTheme.accent }} /></div>}
            {currentTheme.animation === 'grow' && <div className="animate-grow"><Dna className="w-12 h-12" style={{ color: currentTheme.accent }} /></div>}
            {currentTheme.animation === 'twinkle' && <div className="animate-twinkle"><Rocket className="w-12 h-12" style={{ color: currentTheme.secondary }} /></div>}
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>
          Ürünlerimiz
        </h2>
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 transition-all"
              style={{ focusRingColor: currentTheme.accent }}
            />
          </div>
        </div>
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm font-semibold text-gray-600 mr-2 self-center">Kategori:</span>
            {['oyuncak', 'deney', 'eğitici', 'dekoratif'].map(cat => (
              <button key={cat} onClick={() => handleFilterChange('category', cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilters.category === cat ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{backgroundColor: activeFilters.category === cat ? currentTheme.primary : undefined}}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm font-semibold text-gray-600 mr-2 self-center">Yaş:</span>
            {['3-6', '7-12', '13+'].map(age => (
              <button key={age} onClick={() => handleFilterChange('ageGroup', age)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilters.ageGroup === age ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{backgroundColor: activeFilters.ageGroup === age ? currentTheme.primary : undefined}}>
                {age} Yaş
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm font-semibold text-gray-600 mr-2 self-center">Bilim Dalı:</span>
            {['fizik', 'kimya', 'biyoloji', 'astronomi'].map(sci => (
              <button key={sci} onClick={() => handleFilterChange('science', sci)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeFilters.science === sci ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{backgroundColor: activeFilters.science === sci ? themes[sci].primary : undefined}}>
                {sci === 'fizik' && <Atom className="w-4 h-4" />}
                {sci === 'kimya' && <TestTube className="w-4 h-4" />}
                {sci === 'biyoloji' && <Microscope className="w-4 h-4" />}
                {sci === 'astronomi' && <Rocket className="w-4 h-4" />}
                {sci.charAt(0).toUpperCase() + sci.slice(1)}
              </button>
            ))}
          </div>
          {(activeFilters.category || activeFilters.ageGroup || activeFilters.science || searchTerm) && (
            <div className="text-center">
              <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900 underline">
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className={`${currentTheme.cardBg} rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`} onClick={() => handleProductClick(product)}>
                <div className="relative h-48 bg-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy"/>
                  {product.badge && <span className="absolute top-2 left-2 px-3 py-1 text-xs font-bold text-white rounded-full" style={{ backgroundColor: currentTheme.accent }}>{product.badge}</span>}
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                    <Heart className={`w-5 h-5 ${likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}/>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2" style={{ color: currentTheme.text.replace('text-', '') }}>{product.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{product.category}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{product.ageGroup} yaş</span>
                    <span className="text-xs px-2 py-1 text-white rounded-full" style={{ backgroundColor: themes[product.science]?.primary || currentTheme.primary }}>{product.science}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-sm text-gray-500">({product.reviews})</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold" style={{ color: currentTheme.primary }}>₺{product.price}</span>
                    {product.originalPrice && <span className="text-sm text-gray-400 line-through">₺{product.originalPrice}</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }} className="w-full py-2 px-4 rounded-lg text-white font-medium transition-all hover:opacity-90" style={{ backgroundColor: currentTheme.primary }}>
                      <ShoppingCart className="w-5 h-5 inline-block mr-1" />
                      Sepete Ekle
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleBuyNow(product); }} className="w-full py-2 px-4 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>
                      Hemen Satın Al
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Aradığınız kriterlere uygun ürün bulunamadı.</p>
            <button onClick={clearFilters} className="px-6 py-2 rounded-full text-white font-medium" style={{ backgroundColor: currentTheme.primary }}>
              Filtreleri Temizle
            </button>
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8" style={{ color: currentTheme.primary }}>Hakkımızda</h2>
            <p className="text-lg text-gray-600 mb-12">Aslı ve Batur'un ortak bilim aşkından doğan Atomu Parçalayan Bebek, çocuklara ve içindeki çocuğu kaybetmeyen yetişkinlere bilimi sevdirmek için kuruldu. Her bir ürünümüz, laboratuvar titizliği ve oyun eğlencesi harmanlanarak seçilir.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300">
                    <Award className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} />
                    <h3 className="font-bold text-xl mb-2">Kalite Garantisi</h3>
                    <p className="text-gray-600 text-sm">Ürünlerimizin tamamı uluslararası standartlara uygun, dayanıklı ve güvenlidir.</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300">
                    <Package className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} />
                    <h3 className="font-bold text-xl mb-2">Hızlı Kargo</h3>
                    <p className="text-gray-600 text-sm">Siparişleriniz, en kısa sürede ve özenle paketlenerek kapınıza ulaştırılır.</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300">
                    <Shield className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} />
                    <h3 className="font-bold text-xl mb-2">Güvenli Alışveriş</h3>
                    <p className="text-gray-600 text-sm">Tüm ödeme ve kişisel bilgileriniz en üst düzey güvenlik önlemleriyle korunur.</p>
                </div>
            </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
                {faqData.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-sm" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg" style={{ color: currentTheme.text.replace('text-', '') }}>{faq.question}</h3>
                            {activeFaq === index ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                        </div>
                        {activeFaq === index && <p className="mt-4 text-gray-600">{faq.answer}</p>}
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>İletişim</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4"><Mail className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">E-posta</h4><p className="text-gray-600">destek@atomuparcasi.com</p></div></div>
                        <div className="flex items-center gap-4"><Phone className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Telefon</h4><p className="text-gray-600">+90 555 123 45 67</p></div></div>
                        <div className="flex items-center gap-4"><Clock className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Çalışma Saatleri</h4><p className="text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p></div></div>
                        <div className="flex items-center gap-4"><MapPin className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Adres</h4><p className="text-gray-600">ODTÜ Teknokent, Ankara / Türkiye</p></div></div>
                    </div>
                </div>
                <div>
                    <form onSubmit={(e) => { e.preventDefault(); handleContactSubmit(); }} className="space-y-6">
                        <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Adınız</label><input type="text" id="name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required /></div>
                        <div><label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label><input type="email" id="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required /></div>
                        <div><label htmlFor="message" className="block text-sm font-medium text-gray-700">Mesajınız</label><textarea id="message" rows="4" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required ></textarea></div>
                        <button type="submit" className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90" style={{ backgroundColor: currentTheme.primary }}>Mesaj Gönder</button>
                    </form>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-4">Atomu Parçalayan Bebek</h3>
                    <p className="text-gray-400 text-sm">Eğlenerek öğrenmenin, bilimle büyümenin adresi.</p>
                    <div className="flex gap-4 mt-4">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><Instagram className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><Twitter className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><Facebook className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><Youtube className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-4">Kategoriler</h4>
                    <ul className="space-y-2">
                        {['Fizik', 'Kimya', 'Biyoloji', 'Astronomi', 'Deney Setleri', 'Eğitici Oyuncaklar'].map(cat => (
                            <li key={cat}><a href="#products" onClick={() => handleFilterChange('science', cat.toLowerCase().replace(' ', ''))} className="text-gray-400 hover:text-white transition-colors">{cat}</a></li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-4">Hızlı Bağlantılar</h4>
                    <ul className="space-y-2">
                        <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">Hakkımızda</a></li>
                        <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">Sıkça Sorulan Sorular</a></li>
                        <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">İletişim</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Gizlilik Politikası</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kullanım Koşulları</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-4">Bülten</h4>
                    <p className="text-gray-400 text-sm mb-4">Yeni ürünlerimizden ve kampanyalardan haberdar olmak için e-posta bültenimize kaydolun.</p>
                    <form onSubmit={(e) => e.preventDefault()} className="flex">
                        <input type="email" placeholder="E-posta adresiniz" className="px-4 py-2 rounded-l-lg text-slate-900 focus:outline-none w-full" />
                        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-r-lg font-bold hover:bg-purple-700 transition-colors">Abone Ol</button>
                    </form>
                </div>
            </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 Atomu Parçalayan Bebek. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </>
  );
}