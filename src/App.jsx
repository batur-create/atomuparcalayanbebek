import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

// Components
import HomePage from './components/HomePage';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
// import CheckoutPage from './components/CheckoutPage'; // GEREK KALMADI
import Notification from './components/notification';

// Local fallback data
import fallbackProducts from './data/products.json';

const themes = {
  default: { primary: '#2c3e50', secondary: '#f39c12' },
  fizik: { primary: '#3498db' },
  kimya: { primary: '#27ae60' },
  biyoloji: { primary: '#8e44ad' },
  astronomi: { primary: '#1abc9c' }
};

const faqData = [
    { 
        question: "Ürünler çocuklar için güvenli mi?", 
        answer: "Kesinlikle. Satışa sunduğumuz tüm ürünler, uluslararası güvenlik standartlarına (CE) uygun, toksik olmayan materyallerden üretilmiştir ve gerekli testlerden geçmiştir." 
    },
    { 
        question: "Siparişim ne zaman kargoya verilir?", 
        answer: "Hafta içi saat 15:00'e kadar verilen siparişler aynı gün, sonrasındaki siparişler ise ertesi iş günü özenle paketlenerek kargoya teslim edilir." 
    },
    { 
        question: "Hangi yaş grupları için ürünleriniz var?", 
        answer: "3-6 yaş okul öncesi dönemden başlayarak, 7-12 yaş ilkokul ve 13+ yaş genç ve yetişkin hobi gruplarına kadar geniş bir yelpazede ürünlerimiz bulunmaktadır. Her ürünün sayfasında önerilen yaş grubu belirtilmiştir."
    },
    { 
        question: "Okullar veya kurumlar için toplu alım yapabilir miyiz?", 
        answer: "Evet, eğitim kurumlarına, bilim merkezlerine ve şirketlere özel toplu alım indirimlerimiz ve proje setlerimiz mevcuttur. Lütfen iletişim sayfamızdan bize ulaşın."
    }
];
export default function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ category: [], ageGroup: [], tags: [] });
  const [currentTheme, setCurrentTheme] = useState(themes.default);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      // ... (fetchProducts kısmı aynı)
      try { const productsCollection = collection(db, "products"); const productSnapshot = await getDocs(productsCollection); const productList = productSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); if (productList.length > 0) { setProducts(productList); setDataSource('firebase'); } else { setProducts(fallbackProducts); setDataSource('local'); } } catch (error) { setProducts(fallbackProducts); setDataSource('local'); } finally { setIsLoading(false); }
    };
    fetchProducts();
  }, []);
  
  // ... (Diğer useEffect'ler ve fonksiyonlar aynı)
  useEffect(() => { const handleScroll = () => setIsScrolled(window.scrollY > 20); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  useEffect(() => { const firstTag = activeFilters.tags[0]; const newTheme = firstTag && themes[firstTag] ? themes[firstTag] : themes.default; setCurrentTheme(newTheme); }, [activeFilters.tags]);
  const filteredProducts = useMemo(() => { const lowercasedSearchTerm = searchTerm.toLowerCase(); return products.filter(product => { if (!product) return false; const searchMatch = lowercasedSearchTerm === '' || product.name?.toLowerCase().includes(lowercasedSearchTerm) || product.description?.toLowerCase().includes(lowercasedSearchTerm); const categoryMatch = activeFilters.category.length === 0 || activeFilters.category.includes(product.category?.toLowerCase()); const ageMatch = activeFilters.ageGroup.length === 0 || activeFilters.ageGroup.includes(product.ageGroup); const tagsMatch = activeFilters.tags.length === 0 || (Array.isArray(product.tags) && product.tags.some(tag => activeFilters.tags.includes(tag.toLowerCase()))); return searchMatch && categoryMatch && ageMatch && tagsMatch; }); }, [products, activeFilters, searchTerm]);
  const handleProductClick = (product) => navigate(`/product/${product.id}`);
  const handleBackToHome = () => navigate('/');
  const handleGoToCart = () => navigate('/cart');
  
  // *** DEĞİŞİKLİK BURADA ***
  // Artık '/checkout' sayfasına gitmek yerine doğrudan Shopier linkini açıyoruz.
  const handleGoToCheckout = () => {
    // Sepeti temizlemeden direkt yönlendiriyoruz ki, kullanıcı ödemeden vazgeçerse sepeti boş kalmasın.
    window.location.href = 'https://www.shopier.com/39211130';
  };
  
  const handleFilterChange = (type, value) => { const lowercasedValue = typeof value === 'string' ? value.toLowerCase() : value; setActiveFilters(prev => { const currentFilterArray = prev[type]; const isAlreadyActive = currentFilterArray.includes(lowercasedValue); let newFilterArray; if (isAlreadyActive) { newFilterArray = currentFilterArray.filter(item => item !== lowercasedValue); } else { newFilterArray = [...currentFilterArray, lowercasedValue]; } return { ...prev, [type]: newFilterArray }; }); };
  const clearFilters = () => { setActiveFilters({ category: [], ageGroup: [], tags: [] }); setSearchTerm(''); };
  const toggleLike = (productId) => { setLikedProducts(prev => { const newLikes = new Set(prev); if (newLikes.has(productId)) newLikes.delete(productId); else newLikes.add(productId); return newLikes; }); };
  const handleContactSubmit = () => { console.log('Form submitted:', contactForm); alert('Mesajınız gönderildi!'); setContactForm({ name: '', email: '', message: '' }); };
  const ProductDetailWrapper = () => { const { productId } = useParams(); const product = products.find(p => p.id?.toString() === productId); if (!product) { return ( <div className="min-h-screen flex items-center justify-center flex-col gap-4"><h1 className="text-2xl font-bold">Ürün Bulunamadı!</h1></div> ); } return <ProductDetail product={product} onBack={handleBackToHome} onToggleLike={toggleLike} isLiked={likedProducts.has(product.id)} />; };
  if (isLoading) { return ( <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div></div> ); }
  
  return (
    <CartProvider setNotification={setNotification}>
      <div className="bg-gray-50 text-gray-800">
        <Routes>
          <Route path="/" element={<HomePage products={filteredProducts} themes={themes} currentTheme={currentTheme} isScrolled={isScrolled} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} handleGoToCart={handleGoToCart} searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeFilters={activeFilters} handleFilterChange={handleFilterChange} clearFilters={clearFilters} handleProductClick={handleProductClick} toggleLike={toggleLike} likedProducts={likedProducts} faqData={faqData} activeFaq={activeFaq} setActiveFaq={setActiveFaq} contactForm={contactForm} setContactForm={setContactForm} handleContactSubmit={handleContactSubmit} />} />
          <Route path="/product/:productId" element={<ProductDetailWrapper />} />
          <Route path="/cart" element={<CartPage onBack={handleBackToHome} onGoToCheckout={handleGoToCheckout} currentTheme={currentTheme} />} />
          {/* <Route path="/checkout" element={...} /> // GEREK KALMADI */}
        </Routes>
        <AnimatePresence>
          {notification && <Notification product={notification} currentTheme={currentTheme} onEnd={() => setNotification(null)} />}
        </AnimatePresence>
      </div>
    </CartProvider>
  );
}