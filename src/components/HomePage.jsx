import React from 'react';
import { motion } from 'framer-motion';
import {
  Menu, X, Search, ShoppingCart, Star, Heart,
  ChevronDown, ChevronUp, Mail, Phone, Clock, MapPin,
  Instagram, Twitter, Facebook, Youtube, Sparkles,
  Atom, Microscope, Dna, Rocket,
  Award, Package, Shield, TestTube
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function HomePage({
  products,
  themes,
  currentTheme,
  isScrolled,
  isMenuOpen,
  setIsMenuOpen,
  handleGoToCart,
  searchTerm,
  setSearchTerm,
  activeFilters,
  handleFilterChange,
  clearFilters,
  handleProductClick,
  toggleLike,
  likedProducts,
  faqData,
  activeFaq,
  setActiveFaq,
  contactForm,
  setContactForm,
  handleContactSubmit
}) {
  const { addToCart, buyNow, cartItems } = useCart();

  // Tekrar kullanılabilir animasyon tanımı
  const sectionAnimation = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.8 }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Prizma Science Logo" className="h-10 w-10" />
              <span className="text-2xl font-bold" style={{ color: currentTheme.primary }}>
                PRIZMA SCIENCE
              </span>
            </a>
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
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2" aria-label="Menüyü aç/kapat">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
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
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, delay: 0.2 }}
        className="container mx-auto px-4 pt-32 pb-16 text-center"
      >
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl md:text-5xl font-bold mb-6" style={{ color: currentTheme.primary }}
          >
            Bilimi Keşfet, Eğlenerek Öğren
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg mb-8 text-gray-600"
          >
            Çocuklar ve yetişkinler için özenle seçilmiş bilim ürünleri. Oyunla öğrenmenin, merakla büyümenin adresi.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <button onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3 rounded-full text-white font-semibold transition-all transform hover:scale-105" style={{ backgroundColor: currentTheme.primary }}>Ürünleri Keşfet</button>
            <button onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3 rounded-full border-2 font-semibold transition-all hover:bg-gray-50" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}>Hikayemiz</button>
          </motion.div>
        </div>
        <div className="mt-12 flex justify-center gap-8 flex-wrap">
            {currentTheme.animation === 'wave' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}><Sparkles className="w-12 h-12" style={{ color: currentTheme.secondary }} /></motion.div>}
            {currentTheme.animation === 'bubble' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}><TestTube className="w-12 h-12" style={{ color: currentTheme.accent }} /></motion.div>}
            {currentTheme.animation === 'grow' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}><Dna className="w-12 h-12" style={{ color: currentTheme.accent }} /></motion.div>}
            {currentTheme.animation === 'twinkle' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10, delay: 1 }}><Rocket className="w-12 h-12" style={{ color: currentTheme.secondary }} /></motion.div>}
        </div>
      </motion.section>

      {/* Products Section */}
      <section id="products" className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>
            Ürünlerimiz
          </h2>
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="product-search"
                type="text"
                placeholder="Ürünleri veya açıklamalarını ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 transition-all"
                style={{ focusRingColor: currentTheme.secondary, borderColor: currentTheme.primary + '20' }}
              />
            </div>
          </div>

          <div className="mb-12 space-y-4">
            <div className="flex flex-wrap gap-2 justify-center"><span className="text-sm font-semibold text-gray-600 mr-2 self-center">Kategori:</span>{['oyuncak', 'deney', 'eğitici', 'dekoratif'].map(cat => (<button key={cat} onClick={() => handleFilterChange('category', cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilters.category === cat ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{backgroundColor: activeFilters.category === cat ? currentTheme.primary : undefined}}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>))}</div>
            <div className="flex flex-wrap gap-2 justify-center"><span className="text-sm font-semibold text-gray-600 mr-2 self-center">Yaş:</span>{['3-6', '7-12', '13+'].map(age => (<button key={age} onClick={() => handleFilterChange('ageGroup', age)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilters.ageGroup === age ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{backgroundColor: activeFilters.ageGroup === age ? currentTheme.primary : undefined}}>{age} Yaş</button>))}</div>
            <div className="flex flex-wrap gap-2 justify-center"><span className="text-sm font-semibold text-gray-600 mr-2 self-center">Bilim Dalı:</span>{['fizik', 'kimya', 'biyoloji', 'astronomi'].map(sci => (<button key={sci} onClick={() => handleFilterChange('science', sci)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeFilters.science === sci ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{backgroundColor: activeFilters.science === sci ? themes[sci].primary : undefined}}>{sci === 'fizik' && <Atom className="w-4 h-4" />}{sci === 'kimya' && <TestTube className="w-4 h-4" />}{sci === 'biyoloji' && <Microscope className="w-4 h-4" />}{sci === 'astronomi' && <Rocket className="w-4 h-4" />}{sci.charAt(0).toUpperCase() + sci.slice(1)}</button>))}</div>
            {(activeFilters.category || activeFilters.ageGroup || activeFilters.science || searchTerm) && (<div className="text-center"><button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900 underline">Filtreleri Temizle</button></div>)}
          </div>
        </motion.div>
        
        {products.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {products.map(product => (
              <motion.div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-2xl flex flex-col cursor-pointer"
                onClick={() => handleProductClick(product)}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              >
                <div className="relative h-56 bg-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy"/>
                  {product.badge && <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full" style={{ backgroundColor: currentTheme.secondary }}>{product.badge}</span>}
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }} className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                    <Heart className={`w-5 h-5 ${likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}/>
                  </button>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg mb-2" style={{ color: currentTheme.primary }}>{product.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{product.category}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{product.ageGroup} yaş</span>
                    <span className="text-xs px-2 py-1 text-white rounded-full" style={{ backgroundColor: themes[product.science]?.primary || currentTheme.primary }}>{product.science}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-sm text-gray-500">({product.reviews})</span>
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl font-bold" style={{ color: currentTheme.primary }}>₺{product.price.toFixed(2)}</span>
                      {product.originalPrice && <span className="text-sm text-gray-400 line-through">₺{product.originalPrice.toFixed(2)}</span>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="w-full py-2 px-4 rounded-lg text-white font-semibold transition-all hover:opacity-90" style={{ backgroundColor: currentTheme.primary }}>
                      <ShoppingCart className="w-5 h-5 inline-block mr-2" />
                      Sepete Ekle
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Aradığınız kriterlere uygun ürün bulunamadı.</p>
            <button onClick={clearFilters} className="px-6 py-2 rounded-full text-white font-medium" style={{ backgroundColor: currentTheme.primary }}>Filtreleri Temizle</button>
          </div>
        )}
      </section>

      {/* About Section */}
      <motion.section id="about" className="container mx-auto px-4 py-16" {...sectionAnimation}>
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8" style={{ color: currentTheme.primary }}>Hakkımızda</h2>
            <p className="text-lg text-gray-600 mb-12">
              Prizma Science, karmaşık görünen evrenin aslında ne kadar anlaşılır ve estetik bir düzene sahip olduğu fikrinden doğdu. Misyonumuz, bilimin büyüleyici dünyasını bir prizma gibi ele alıp, en temel ve en saf halini her yaştan meraklı zihin için bir keşif serüvenine dönüştürmektir. Bir mühendis adayı ve bilim tutkunu olarak, raflarımızdaki her bir ürünü bu felsefeyle seçiyoruz: Her kit bir merak kıvılcımı, her oyuncak ise bir "eureka!" anı vaat etmeli.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300"><Award className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} /><h3 className="font-bold text-xl mb-2">Kalite Garantisi</h3><p className="text-gray-600 text-sm">Ürünlerimizin tamamı uluslararası standartlara uygun, dayanıklı ve güvenlidir.</p></div>
              <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300"><Package className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} /><h3 className="font-bold text-xl mb-2">Hızlı Kargo</h3><p className="text-gray-600 text-sm">Siparişleriniz, en kısa sürede ve özenle paketlenerek kapınıza ulaştırılır.</p></div>
              <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center text-center transition-all hover:scale-105 duration-300"><Shield className="w-12 h-12 mb-4" style={{ color: currentTheme.primary }} /><h3 className="font-bold text-xl mb-2">Güvenli Alışveriş</h3><p className="text-gray-600 text-sm">Tüm ödeme ve kişisel bilgileriniz en üst düzey güvenlik önlemleriyle korunur.</p></div>
            </div>
        </div>
      </motion.section>
      
      {/* FAQ Section */}
      <motion.section id="faq" className="container mx-auto px-4 py-16" {...sectionAnimation}>
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div key={index} className="border border-gray-200 bg-white rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-sm" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                    {activeFaq === index ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                  </div>
                  {activeFaq === index && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-gray-600">{faq.answer}</motion.p>}
                </div>
              ))}
            </div>
        </div>
      </motion.section>
      
      {/* Contact Section */}
      <motion.section id="contact" className="container mx-auto px-4 py-16" {...sectionAnimation}>
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>İletişim</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <div className="space-y-6"><div className="flex items-center gap-4"><Mail className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">E-posta</h4><p className="text-gray-600">destek@prizmascience.com</p></div></div><div className="flex items-center gap-4"><Phone className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Telefon</h4><p className="text-gray-600">+90 555 123 45 67</p></div></div><div className="flex items-center gap-4"><Clock className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Çalışma Saatleri</h4><p className="text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p></div></div><div className="flex items-center gap-4"><MapPin className="w-6 h-6" style={{ color: currentTheme.primary }} /><div><h4 className="font-bold">Adres</h4><p className="text-gray-600">ODTÜ Teknokent, Ankara / Türkiye</p></div></div></div>
              </div>
              <div>
                <form onSubmit={(e) => { e.preventDefault(); handleContactSubmit(); }} className="space-y-6"><div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Adınız</label><input type="text" id="name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required /></div><div><label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label><input type="email" id="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required /></div><div><label htmlFor="message" className="block text-sm font-medium text-gray-700">Mesajınız</label><textarea id="message" rows="4" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required ></textarea></div><button type="submit" className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90" style={{ backgroundColor: currentTheme.primary }}>Mesaj Gönder</button></form>
              </div>
            </div>
        </div>
      </motion.section>
      
      {/* Footer */}
      <motion.footer className="bg-slate-900 text-white py-12" {...sectionAnimation}>
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div><h3 className="text-xl font-bold mb-4">Prizma Science</h3><p className="text-gray-400 text-sm">Eğlenerek öğrenmenin, bilimle büyümenin adresi.</p><div className="flex gap-4 mt-4"><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Youtube"><Youtube className="w-6 h-6 text-gray-400 hover:text-white transition-colors" /></a></div></div>
                <div><h4 className="font-bold text-lg mb-4">Kategoriler</h4><ul className="space-y-2">{['Fizik', 'Kimya', 'Biyoloji', 'Astronomi', 'Deney Setleri', 'Eğitici Oyuncaklar'].map(cat => (<li key={cat}><a href="#products" onClick={() => handleFilterChange('science', cat.toLowerCase().replace(' ', ''))} className="text-gray-400 hover:text-white transition-colors">{cat}</a></li>))}</ul></div>
                <div><h4 className="font-bold text-lg mb-4">Hızlı Bağlantılar</h4><ul className="space-y-2"><li><a href="#about" className="text-gray-400 hover:text-white transition-colors">Hakkımızda</a></li><li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">Sıkça Sorulan Sorular</a></li><li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">İletişim</a></li><li><a href="#" className="text-gray-400 hover:text-white transition-colors">Gizlilik Politikası</a></li><li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kullanım Koşulları</a></li></ul></div>
                <div><h4 className="font-bold text-lg mb-4">Bülten</h4><p className="text-gray-400 text-sm mb-4">Yeni ürünlerimizden ve kampanyalardan haberdar olmak için e-posta bültenimize kaydolun.</p><form onSubmit={(e) => e.preventDefault()} className="flex"><input type="email" placeholder="E-posta adresiniz" className="px-4 py-2 rounded-l-lg text-slate-900 focus:outline-none w-full" /><button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-r-lg font-bold hover:bg-purple-700 transition-colors">Abone Ol</button></form></div>
            </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500"><p>&copy; 2025 Prizma Science. Tüm hakları saklıdır.</p></div>
      </motion.footer>
    </>
  );
}