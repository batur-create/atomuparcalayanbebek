import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';

// Yeni hook'umuzu import ediyoruz
import { useCart } from './context/CartContext';

// Veri ve Component'leri import et
import productsData from './data/products.json';
import HomePage from './components/HomePage';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';

// Tema Yapılandırması (Değişmedi)
const themes = {
  default: { primary: '#1e293b', secondary: '#64748b', accent: '#3b82f6', background: 'from-slate-50 to-white', cardBg: 'bg-white', text: 'text-slate-900', animation: 'pulse' },
  fizik: { primary: '#1e3a8a', secondary: '#facc15', accent: '#fbbf24', background: 'from-blue-50 via-indigo-50 to-white', cardBg: 'bg-gradient-to-br from-blue-50/50 to-white', text: 'text-blue-900', animation: 'wave' },
  kimya: { primary: '#047857', secondary: '#14b8a6', accent: '#10b981', background: 'from-emerald-50 via-teal-50 to-white', cardBg: 'bg-gradient-to-br from-teal-50/50 to-white', text: 'text-emerald-900', animation: 'bubble' },
  biyoloji: { primary: '#059669', secondary: '#34d399', accent: '#86efac', background: 'from-green-50 via-emerald-50 to-white', cardBg: 'bg-gradient-to-br from-green-50/50 to-white', text: 'text-green-900', animation: 'grow' },
  astronomi: { primary: '#4c1d95', secondary: '#7c3aed', accent: '#a78bfa', background: 'from-violet-100 via-purple-50 to-indigo-50', cardBg: 'bg-gradient-to-br from-violet-50/50 to-white', text: 'text-violet-900', animation: 'twinkle' }
};

// SSS Verisi (Değişmedi)
const faqData = [
    { question: "Ürünler güvenlik sertifikalı mı?", answer: "Evet, tüm ürünlerimiz CE ve TSE sertifikalıdır..." },
    { question: "Kargo süresi ne kadar?", answer: "Siparişleriniz 1-2 iş günü içinde kargoya verilir..." },
    { question: "İade koşulları nelerdir?", answer: "14 gün içinde, ürün açılmamış orijinal ambalajında ise koşulsuz iade hakkınız vardır..." },
    { question: "Okul ve kurumlara toplu satış var mı?", answer: "Evet, eğitim kurumlarına özel indirimli fiyatlarımız mevcuttur..." }
];

// Custom CSS (Değişmedi)
const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
    * { font-family: 'Inter', sans-serif; }
    h1, h2, h3 { font-family: 'Playfair Display', serif; }
    /* ...diğer animasyon stilleri... */
`;

function App() {
  // State Yönetimi (Sadece sepetle ilgili olmayanlar kaldı)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ category: '', ageGroup: '', science: '' });
  const [currentTheme, setCurrentTheme] = useState(themes.default);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const navigate = useNavigate(); // Yönlendirme hook'u hala burada

  // Efektler
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const newTheme = activeFilters.science && themes[activeFilters.science] ? themes[activeFilters.science] : themes.default;
    setCurrentTheme(newTheme);
  }, [activeFilters.science]);

  // Filtrelenmiş ürünler
  const filteredProducts = useMemo(() => {
    return productsData.filter(product => 
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!activeFilters.category || product.category === activeFilters.category) &&
      (!activeFilters.ageGroup || product.ageGroup === activeFilters.ageGroup) &&
      (!activeFilters.science || product.science === activeFilters.science)
    );
  }, [activeFilters, searchTerm]);

  // Fonksiyonlar (Sadece sepetle ilgili olmayanlar)
  const handleProductClick = (product) => navigate(`/product/${product.id}`);
  const handleBackToHome = () => navigate('/');
  const handleGoToCart = () => navigate('/cart');
  const handleGoToCheckout = () => navigate('/checkout');

  const handleFilterChange = (type, value) => {
    setActiveFilters(prev => ({...prev, [type]: prev[type] === value ? '' : value}));
  };
  
  const clearFilters = () => {
    setActiveFilters({ category: '', ageGroup: '', science: '' });
    setSearchTerm('');
  };

  const toggleLike = (productId) => {
    setLikedProducts(prev => {
      const newLikes = new Set(prev);
      newLikes.has(productId) ? newLikes.delete(productId) : newLikes.add(productId);
      return newLikes;
    });
  };

  const handleContactSubmit = () => {
    console.log('Form submitted:', contactForm);
    alert('Mesajınız gönderildi!');
    setContactForm({ name: '', email: '', message: '' });
  };

 // src/App.jsx içindeki bu bölümü güncelle

  // Dinamik ProductDetail Wrapper
  const ProductDetailWrapper = () => {
    const { productId } = useParams();
    const { addToCart, buyNow } = useCart(); // Context'ten fonksiyonları al
    const product = productsData.find(p => p.id === parseInt(productId));
    
    if (!product) return <div>Ürün bulunamadı!</div>;

    return (
      <ProductDetail 
        product={product} 
        onBack={handleBackToHome} 
        onAddToCart={addToCart} // Context'ten gelen fonksiyonu prop olarak ver
        onBuyNow={buyNow}       // Context'ten gelen fonksiyonu prop olarak ver
        onToggleLike={toggleLike}
        isLiked={likedProducts.has(product.id)}
      />
    );
  };
  // Render
  return (
    <div className={`bg-gradient-to-br ${currentTheme.background}`}>
      <style>{customStyles}</style>
      <Routes>
        <Route path="/" element={
          <HomePage
            products={filteredProducts} // Filtrelenmiş ürünleri gönderiyoruz
            themes={themes}
            currentTheme={currentTheme}
            isScrolled={isScrolled}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            handleGoToCart={handleGoToCart}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeFilters={activeFilters}
            handleFilterChange={handleFilterChange}
            clearFilters={clearFilters}
            handleProductClick={handleProductClick}
            toggleLike={toggleLike}
            likedProducts={likedProducts}
            faqData={faqData}
            activeFaq={activeFaq}
            setActiveFaq={setActiveFaq}
            contactForm={contactForm}
            setContactForm={setContactForm}
            handleContactSubmit={handleContactSubmit}
          />} 
        />
        <Route path="/product/:productId" element={<ProductDetailWrapper />} />
        <Route path="/cart" element={
          <CartPage 
            onBack={handleBackToHome}
            onGoToCheckout={handleGoToCheckout}
            currentTheme={currentTheme}
          />} 
        />
        <Route path="/checkout" element={
          <CheckoutPage
            onBack={handleGoToCart}
            currentTheme={currentTheme}
          />}
        />
      </Routes>
    </div>
  );
}

// App'i BrowserRouter ile sarmalayan kök bileşen
export default function Root() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}