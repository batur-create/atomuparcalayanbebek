import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useCart } from './context/CartContext';

import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

import HomePage from './components/HomePage';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';

const themes = {
  default: { primary: '#1e293b', secondary: '#64748b', accent: '#3b82f6', background: 'from-slate-50 to-white', cardBg: 'bg-white', text: 'text-slate-900', animation: 'pulse' },
  fizik: { primary: '#1e3a8a', secondary: '#facc15', accent: '#fbbf24', background: 'from-blue-50 via-indigo-50 to-white', cardBg: 'bg-gradient-to-br from-blue-50/50 to-white', text: 'text-blue-900', animation: 'wave' },
  kimya: { primary: '#047857', secondary: '#14b8a6', accent: '#10b981', background: 'from-emerald-50 via-teal-50 to-white', cardBg: 'bg-gradient-to-br from-teal-50/50 to-white', text: 'text-emerald-900', animation: 'bubble' },
  biyoloji: { primary: '#059669', secondary: '#34d399', accent: '#86efac', background: 'from-green-50 via-emerald-50 to-white', cardBg: 'bg-gradient-to-br from-green-50/50 to-white', text: 'text-green-900', animation: 'grow' },
  astronomi: { primary: '#4c1d95', secondary: '#7c3aed', accent: '#a78bfa', background: 'from-violet-100 via-purple-50 to-indigo-50', cardBg: 'bg-gradient-to-br from-violet-50/50 to-white', text: 'text-violet-900', animation: 'twinkle' }
};
const faqData = [
  { question: "Ürünler güvenlik sertifikalı mı?", answer: "Evet, tüm ürünlerimiz CE ve TSE sertifikalıdır. Çocukların güvenliği için uluslararası standartlarda üretilmiştir." },
  { question: "Kargo süresi ne kadar?", answer: "Siparişleriniz 1-2 iş günü içinde kargoya verilir. Teslimat süresi bulunduğunuz bölgeye göre 2-5 iş günü arasında değişmektedir." },
  { question: "İade koşulları nelerdir?", answer: "14 gün içinde, ürün açılmamış orijinal ambalajında ise koşulsuz iade hakkınız vardır. Hasarlı ürünlerde anında değişim yapıyoruz." },
  { question: "Okul ve kurumlara toplu satış var mı?", answer: "Evet, eğitim kurumlarına özel indirimli fiyatlarımız mevcuttur. Kurumsal satış ekibimizle iletişime geçebilirsiniz." }
];
const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
    * { font-family: 'Inter', sans-serif; } h1, h2, h3 { font-family: 'Playfair Display', serif; } @keyframes wave { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } } @keyframes bubble { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.05); } } @keyframes grow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } } @keyframes twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } } .animate-wave { animation: wave 3s ease-in-out infinite; } .animate-bubble { animation: bubble 4s ease-in-out infinite; } .animate-grow { animation: grow 3s ease-in-out infinite; } .animate-twinkle { animation: twinkle 2s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`;

function App() {
  // === STATE YÖNETİMİ ===
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // ----- EKSİK OLAN VE EKLENEN SATIR -----
  const [isScrolled, setIsScrolled] = useState(false);
  // ------------------------------------
  const [activeFilters, setActiveFilters] = useState({ category: '', ageGroup: '', science: '' });
  const [currentTheme, setCurrentTheme] = useState(themes.default);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const navigate = useNavigate();

  // === EFEKTLER (EFFECTS) ===
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const productsCollection = collection(db, "products");
      const productSnapshot = await getDocs(productsCollection);
      const productList = productSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setProducts(productList);
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const newTheme = activeFilters.science && themes[activeFilters.science] ? themes[activeFilters.science] : themes.default;
    setCurrentTheme(newTheme);
  }, [activeFilters.science]);

  // === HESAPLAMALAR (MEMO) ===
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!activeFilters.category || product.category === activeFilters.category) &&
      (!activeFilters.ageGroup || product.ageGroup === activeFilters.ageGroup) &&
      (!activeFilters.science || product.science === activeFilters.science)
    );
  }, [products, activeFilters, searchTerm]);

  // === FONKSİYONLAR ===
  const handleProductClick = (product) => navigate(`/product/${product.id}`);
  const handleBackToHome = () => navigate('/');
  const handleGoToCart = () => navigate('/cart');
  const handleGoToCheckout = () => navigate('/checkout');
  const handleFilterChange = (type, value) => {
    setActiveFilters(prev => ({ ...prev, [type]: prev[type] === value ? '' : value }));
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
  
  const ProductDetailWrapper = () => {
    const { productId } = useParams();
    const product = products.find(p => p.id === productId); 
    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><h1>Ürün Yükleniyor...</h1></div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center"><h1>Ürün Bulunamadı!</h1></div>;
    return (
      <ProductDetail 
        product={product} 
        onBack={handleBackToHome}
        onToggleLike={toggleLike}
        isLiked={likedProducts.has(product.id)}
      />
    );
  };
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><h1>Atomlar Diziliyor...</h1></div>;
  }

  // === RENDER ===
  return (
    <div className={`bg-gradient-to-br ${currentTheme.background}`}>
      <style>{customStyles}</style>
      <Routes>
        <Route 
          path="/" 
          element={
            <HomePage
              products={filteredProducts}
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
            />
          } 
        />
        <Route path="/product/:productId" element={<ProductDetailWrapper />} />
        <Route 
          path="/cart" 
          element={
            <CartPage 
              onBack={handleBackToHome}
              onGoToCheckout={handleGoToCheckout}
              currentTheme={currentTheme}
            />
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <CheckoutPage
              onBack={handleGoToCart}
              currentTheme={currentTheme}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default function Root() {
  return <App />;
}