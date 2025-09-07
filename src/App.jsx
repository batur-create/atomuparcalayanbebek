import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

import HomePage from './components/HomePage';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import Notification from './components/Notification';

const themes = {
  default: { primary: '#2c3e50', secondary: '#f39c12', accent: '#e74c3c', background: '#F5F5F5', cardBg: 'bg-white', text: 'text-gray-800', animation: 'grow' },
  fizik: { primary: '#3498db', secondary: '#f1c40f', accent: '#e74c3c', background: '#ecf0f1', cardBg: 'bg-white', text: 'text-gray-800', animation: 'twinkle' },
  kimya: { primary: '#27ae60', secondary: '#f39c12', accent: '#9b59b6', background: '#f0f4f7', cardBg: 'bg-white', text: 'text-gray-800', animation: 'bubble' },
  biyoloji: { primary: '#8e44ad', secondary: '#2ecc71', accent: '#34495e', background: '#f8f4f2', cardBg: 'bg-white', text: 'text-gray-800', animation: 'wave' },
  astronomi: { primary: '#1abc9c', secondary: '#e67e22', accent: '#3498db', background: '#f2f7f7', cardBg: 'bg-white', text: 'text-gray-800', animation: 'twinkle' }
};
const faqData = [
    { question: "Ürünler güvenlik sertifikalı mı?", answer: "Evet, tüm ürünlerimiz CE ve TSE sertifikalıdır." },
    { question: "Kargo süresi ne kadar?", answer: "Siparişleriniz 1-2 iş günü içinde kargoya verilir." },
    { question: "İade koşulları nelerdir?", answer: "14 gün içinde, ürün açılmamış orijinal ambalajında ise koşulsuz iade hakkınız vardır." },
    { question: "Okul ve kurumlara toplu satış var mı?", answer: "Evet, eğitim kurumlarına özel indirimli fiyatlarımız mevcuttur." }
];
const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@400;500;700&display=swap');
    body { font-family: 'Poppins', sans-serif; background-color: #F5F5F5; } h1, h2, h3, h4 { font-family: 'Playfair Display', serif; } @keyframes wave { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } } @keyframes bubble { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.05); } } @keyframes grow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } } @keyframes twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } } .animate-wave { animation: wave 3s ease-in-out infinite; } .animate-bubble { animation: bubble 4s ease-in-out infinite; } .animate-grow { animation: grow 3s ease-in-out infinite; } .animate-twinkle { animation: twinkle 2s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`;

export default function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ category: '', ageGroup: '', science: '' });
  const [currentTheme, setCurrentTheme] = useState(themes.default);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products");
        const productSnapshot = await getDocs(productsCollection);
        const productList = productSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setProducts(productList);
      } catch (error) {
        console.error("Firebase'den ürünleri çekerken hata oluştu:", error);
        // Burada kullanıcıya bir hata mesajı da gösterebiliriz.
      } finally {
        setIsLoading(false); // Hata olsa bile yükleme ekranından çık
      }
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

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!activeFilters.category || product.category === activeFilters.category) &&
      (!activeFilters.ageGroup || product.ageGroup === activeFilters.ageGroup) &&
      (!activeFilters.science || product.science === activeFilters.science)
    );
  }, [products, activeFilters, searchTerm]);

  const handleProductClick = (product) => navigate(`/product/${product.id}`);
  const handleBackToHome = () => navigate('/');
  const handleGoToCart = () => navigate('/cart');
  const handleGoToCheckout = () => navigate('/checkout');
  const handleFilterChange = (type, value) => setActiveFilters(prev => ({ ...prev, [type]: prev[type] === value ? '' : value }));
  const clearFilters = () => { setActiveFilters({ category: '', ageGroup: '', science: '' }); setSearchTerm(''); };
  const toggleLike = (productId) => setLikedProducts(prev => { const newLikes = new Set(prev); newLikes.has(productId) ? newLikes.delete(productId) : newLikes.add(productId); return newLikes; });
  const handleContactSubmit = () => { console.log('Form submitted:', contactForm); alert('Mesajınız gönderildi!'); setContactForm({ name: '', email: '', message: '' }); };

  const ProductDetailWrapper = () => {
    const { productId } = useParams();
    const product = products.find(p => p.id === productId); 
    if (!product) return <div className="min-h-screen flex items-center justify-center"><h1>Ürün Bulunamadı!</h1></div>;
    return <ProductDetail product={product} onBack={handleBackToHome} onToggleLike={toggleLike} isLiked={likedProducts.has(product.id)} />;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><h1>Atomlar Diziliyor...</h1></div>;
  }

  return (
    <CartProvider setNotification={setNotification}>
      <div className={`bg-gradient-to-br ${currentTheme.background}`}>
        <style>{customStyles}</style>
        <Routes>
          <Route path="/" element={<HomePage products={filteredProducts} themes={themes} currentTheme={currentTheme} isScrolled={isScrolled} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} handleGoToCart={handleGoToCart} searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeFilters={activeFilters} handleFilterChange={handleFilterChange} clearFilters={clearFilters} handleProductClick={handleProductClick} toggleLike={toggleLike} likedProducts={likedProducts} faqData={faqData} activeFaq={activeFaq} setActiveFaq={setActiveFaq} contactForm={contactForm} setContactForm={setContactForm} handleContactSubmit={handleContactSubmit} />} />
          <Route path="/product/:productId" element={<ProductDetailWrapper />} />
          <Route path="/cart" element={<CartPage onBack={handleBackToHome} onGoToCheckout={handleGoToCheckout} currentTheme={currentTheme} />} />
          <Route path="/checkout" element={<CheckoutPage onBack={handleGoToCart} currentTheme={currentTheme} />} />
        </Routes>
        <AnimatePresence>
          {notification && (
            <Notification product={notification} currentTheme={currentTheme} onEnd={() => setNotification(null)} />
          )}
        </AnimatePresence>
      </div>
    </CartProvider>
  );
}