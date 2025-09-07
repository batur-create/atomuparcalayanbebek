import React, { useState, useEffect, useMemo } from 'react';
import { 
  Menu, X, Search, Filter, ShoppingCart, Star, Heart, 
  ChevronDown, ChevronUp, Mail, Phone, Clock, MapPin,
  Instagram, Twitter, Facebook, Youtube, Sparkles, 
  Atom, Microscope, Beaker, Dna, Rocket,
  Award, Package, Shield, Users, ArrowRight, Check,
  TestTube, Brain, Zap, FlaskRound
} from 'lucide-react';
import ProductDetail from './components/ProductDetail'; 
import CartPage from './components/CartPage';
// YENİ EKLEME
import CheckoutPage from './components/CheckoutPage';

// Tema Yapılandırması
const themes = {
  default: {
    primary: '#1e293b',
    secondary: '#64748b',
    accent: '#3b82f6',
    background: 'from-slate-50 to-white',
    cardBg: 'bg-white',
    text: 'text-slate-900',
    animation: 'pulse'
  },
  fizik: {
    primary: '#1e3a8a',
    secondary: '#facc15',
    accent: '#fbbf24',
    background: 'from-blue-50 via-indigo-50 to-white',
    cardBg: 'bg-gradient-to-br from-blue-50/50 to-white',
    text: 'text-blue-900',
    animation: 'wave'
  },
  kimya: {
    primary: '#047857',
    secondary: '#14b8a6',
    accent: '#10b981',
    background: 'from-emerald-50 via-teal-50 to-white',
    cardBg: 'bg-gradient-to-br from-teal-50/50 to-white',
    text: 'text-emerald-900',
    animation: 'bubble'
  },
  biyoloji: {
    primary: '#059669',
    secondary: '#34d399',
    accent: '#86efac',
    background: 'from-green-50 via-emerald-50 to-white',
    cardBg: 'bg-gradient-to-br from-green-50/50 to-white',
    text: 'text-green-900',
    animation: 'grow'
  },
  astronomi: {
    primary: '#4c1d95',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    background: 'from-violet-100 via-purple-50 to-indigo-50',
    cardBg: 'bg-gradient-to-br from-violet-50/50 to-white',
    text: 'text-violet-900',
    animation: 'twinkle'
  }
};

// Ürün Verileri
const products = [
  {
    id: 1,
    name: "Newton Beşiği Deluxe",
    category: "dekoratif",
    ageGroup: "13+",
    science: "fizik",
    price: 249.90,
    originalPrice: 299.90,
    image: "https://images.unsplash.com/photo-1599420186946-e8e8a10c5f5d?w=400",
    rating: 4.8,
    reviews: 127,
    description: "Momentum ve enerji korunumunu gösteren klasik fizik oyuncağı",
    shopierLink: "#SHOPIER_LINK_HERE",
    badge: "Çok Satan"
  },
  {
    id: 2,
    name: "Kristal Yetiştirme Seti",
    category: "deney",
    ageGroup: "7-12",
    science: "kimya",
    price: 189.90,
    image: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400",
    rating: 4.6,
    reviews: 89,
    description: "5 farklı renkte kristal yetiştirme deneyimi",
    shopierLink: "#SHOPIER_LINK_HERE",
    badge: "Yeni"
  },
  {
    id: 3,
    name: "Mikroskop Seti Pro",
    category: "eğitici",
    ageGroup: "7-12",
    science: "biyoloji",
    price: 599.90,
    originalPrice: 749.90,
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400",
    rating: 4.9,
    reviews: 156,
    description: "100x-1200x zoom, LED aydınlatma, 50 hazır preparat",
    shopierLink: "#SHOPIER_LINK_HERE"
  },
  {
    id: 4,
    name: "Güneş Sistemi Mobil",
    category: "dekoratif",
    ageGroup: "3-6",
    science: "astronomi",
    price: 299.90,
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400",
    rating: 4.7,
    reviews: 93,
    description: "LED ışıklı, dönen gezegenler, gerçek ölçekli",
    shopierLink: "#SHOPIER_LINK_HERE",
    badge: "Trend"
  },
  {
    id: 5,
    name: "Elektrik Devre Seti",
    category: "oyuncak",
    ageGroup: "7-12",
    science: "fizik",
    price: 349.90,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    rating: 4.5,
    reviews: 67,
    description: "30+ farklı devre kurulumu, güvenli bağlantılar",
    shopierLink: "#SHOPIER_LINK_HERE"
  },
  {
    id: 6,
    name: "Volkan Patlatma Kiti",
    category: "deney",
    ageGroup: "7-12",
    science: "kimya",
    price: 149.90,
    image: "https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=400",
    rating: 4.4,
    reviews: 112,
    description: "Güvenli kimyasal reaksiyon deneyi",
    shopierLink: "#SHOPIER_LINK_HERE",
    badge: "Popüler"
  },
  {
    id: 7,
    name: "DNA Modeli 3D",
    category: "eğitici",
    ageGroup: "13+",
    science: "biyoloji",
    price: 279.90,
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    rating: 4.8,
    reviews: 45,
    description: "60cm yüksekliğinde, renkli bazlar, çift sarmal yapı",
    shopierLink: "#SHOPIER_LINK_HERE"
  },
  {
    id: 8,
    name: "Teleskop Başlangıç",
    category: "eğitici",
    ageGroup: "13+",
    science: "astronomi",
    price: 899.90,
    originalPrice: 1199.90,
    image: "https://images.unsplash.com/photo-1608889175638-9322300c46e8?w=400",
    rating: 4.6,
    reviews: 78,
    description: "70mm objektif, 400mm odak uzaklığı, tripod dahil",
    shopierLink: "#SHOPIER_LINK_HERE"
  },
  {
    id: 9,
    name: "Manyetizma Laboratuvarı",
    category: "deney",
    ageGroup: "7-12",
    science: "fizik",
    price: 229.90,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
    rating: 4.7,
    reviews: 58,
    description: "20+ manyetizma deneyi, güçlü neodyum mıknatıslar",
    shopierLink: "#SHOPIER_LINK_HERE",
    badge: "Yeni"
  },
  {
    id: 10,
    name: "Periyodik Tablo Küpleri",
    category: "dekoratif",
    ageGroup: "13+",
    science: "kimya",
    price: 449.90,
    image: "https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?w=400",
    rating: 4.9,
    reviews: 134,
    description: "Gerçek element örnekleri, akrilik küpler, LED taban",
    shopierLink: "#SHOPIER_LINK_HERE",
    badge: "Özel Seri"
  },
  {
    id: 11,
    name: "Böcek Gözlem Seti",
    category: "oyuncak",
    ageGroup: "3-6",
    science: "biyoloji",
    price: 99.90,
    image: "https://images.unsplash.com/photo-1503149779833-1de50ebe5f8a?w=400",
    rating: 4.3,
    reviews: 89,
    description: "Büyüteçli gözlem kabı, toplama aletleri",
    shopierLink: "#SHOPIER_LINK_HERE"
  },
  {
    id: 12,
    name: "Yıldız Haritası Projektör",
    category: "dekoratif",
    ageGroup: "3-6",
    science: "astronomi",
    price: 189.90,
    image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400",
    rating: 4.8,
    reviews: 201,
    description: "Tavana gerçek yıldız haritası projeksiyonu",
    shopierLink: "#SHOPIER_LINK_HERE",
    badge: "En Çok Tercih"
  }
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    ageGroup: '',
    science: ''
  });
  const [currentTheme, setCurrentTheme] = useState(themes.default);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  // YENİ EKLEME
  const [showCheckout, setShowCheckout] = useState(false);

  // Form states
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Scroll efekti
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tema değişimi
  useEffect(() => {
    const newTheme = activeFilters.science && themes[activeFilters.science] 
      ? themes[activeFilters.science] 
      : themes.default;
    setCurrentTheme(newTheme);
  }, [activeFilters.science]);

  // Filtrelenmiş ürünler
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !activeFilters.category || product.category === activeFilters.category;
      const matchesAge = !activeFilters.ageGroup || product.ageGroup === activeFilters.ageGroup;
      const matchesScience = !activeFilters.science || product.science === activeFilters.science;
      
      return matchesSearch && matchesCategory && matchesAge && matchesScience;
    });
  }, [activeFilters, searchTerm]);

  // Ürün detayına geçiş fonksiyonu
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowCart(false);
    setShowCheckout(false);
  };
  
  // Ana sayfaya geri dönme fonksiyonu
  const handleBackToHome = () => {
    setSelectedProduct(null);
    setShowCart(false);
    setShowCheckout(false);
  };

  // Sepet sayfasına geçiş fonksiyonu
  const handleGoToCart = () => {
    setSelectedProduct(null);
    setShowCart(true);
    setShowCheckout(false);
  };

  // YENİ EKLEME: Ödeme sayfasına geçiş fonksiyonu
  const handleGoToCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };
  
  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
    alert(`${product.name} sepete eklendi!`);
  };

  const handleBuyNow = (product) => {
    setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id);
        let newItems;
        if (existingItem) {
            newItems = prevItems.map(item => 
                item.id === product.id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            newItems = [...prevItems, { ...product, quantity: 1 }];
        }
        return newItems;
    });
    handleGoToCart();
  };

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }
    setCartItems(prevItems => prevItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  const handleRemoveItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

const handleClearCart = () => {
    setCartItems([]);
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({ category: '', ageGroup: '', science: '' });
    setSearchTerm('');
  };

  const toggleLike = (productId) => {
    setLikedProducts(prev => {
      const newLikes = new Set(prev);
      if (newLikes.has(productId)) {
        newLikes.delete(productId);
      } else {
        newLikes.add(productId);
      }
      return newLikes;
    });
  };

  const handleContactSubmit = () => {
    console.log('Form submitted:', contactForm);
    alert('Mesajınız gönderildi!');
    setContactForm({ name: '', email: '', message: '' });
  };

  const faqData = [
    {
      question: "Ürünler güvenlik sertifikalı mı?",
      answer: "Evet, tüm ürünlerimiz CE ve TSE sertifikalıdır. Çocukların güvenliği için uluslararası standartlarda üretilmiştir."
    },
    {
      question: "Kargo süresi ne kadar?",
      answer: "Siparişleriniz 1-2 iş günü içinde kargoya verilir. Teslimat süresi bulunduğunuz bölgeye göre 2-5 iş günü arasında değişmektedir."
    },
    {
      question: "İade koşulları nelerdir?",
      answer: "14 gün içinde, ürün açılmamış orijinal ambalajında ise koşulsuz iade hakkınız vardır. Hasarlı ürünlerde anında değişim yapıyoruz."
    },
    {
      question: "Okul ve kurumlara toplu satış var mı?",
      answer: "Evet, eğitim kurumlarına özel indirimli fiyatlarımız mevcuttur. Kurumsal satış ekibimizle iletişime geçebilirsiniz."
    }
  ];

  // Custom CSS for animations
  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      font-family: 'Inter', sans-serif;
    }
    
    h1, h2, h3 {
      font-family: 'Playfair Display', serif;
    }
    
    @keyframes wave {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(10px); }
    }
    
    @keyframes bubble {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-10px) scale(1.05); }
    }
    
    @keyframes grow {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    
    @keyframes twinkle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    
    .animate-wave { animation: wave 3s ease-in-out infinite; }
    .animate-bubble { animation: bubble 4s ease-in-out infinite; }
    .animate-grow { animation: grow 3s ease-in-out infinite; }
    .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
    
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
    }
  `;

  // GÜNCELLENDİ: renderContent içine yeni kontrol eklendi
  const renderContent = () => {
    if (selectedProduct) {
      return (
        <ProductDetail 
          product={selectedProduct} 
          onBack={handleBackToHome} 
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onToggleLike={toggleLike}
          isLiked={likedProducts.has(selectedProduct.id)}
        />
      );
    } else if (showCheckout) {
      return (
        <CheckoutPage
          cartItems={cartItems}
          onBack={handleBackToHome}
          onClearCart={handleClearCart}
          currentTheme={currentTheme}
        />
      );
    } else if (showCart) {
      return (
        <CartPage 
          cartItems={cartItems} 
          onBack={handleBackToHome}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onGoToCheckout={handleGoToCheckout} // YENİ PROP
          currentTheme={currentTheme}
        />
      );
    } else {
      return (
        <>
          {/* Ana sayfa içeriği */}
          {/* Header */}
          <header className={`sticky top-0 z-50 transition-all duration-300 ${
            isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'
          }`}>
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
                  {/* Sepet simgesi */}
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
                    <a href="#products" onClick={() => { setIsMenuOpen(false); handleBackToHome(); }}>Ürünler</a>
                    <a href="#about" onClick={() => { setIsMenuOpen(false); handleBackToHome(); }}>Hakkımızda</a>
                    <a href="#faq" onClick={() => { setIsMenuOpen(false); handleBackToHome(); }}>SSS</a>
                    <a href="#contact" onClick={() => { setIsMenuOpen(false); handleBackToHome(); }}>İletişim</a>
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

            {/* Tema görselleri */}
            <div className="mt-12 flex justify-center gap-8 flex-wrap">
              {currentTheme.animation === 'wave' && (
                <div className="animate-wave">
                  <Sparkles className="w-12 h-12" style={{ color: currentTheme.secondary }} />
                </div>
              )}
              {currentTheme.animation === 'bubble' && (
                <div className="animate-bubble">
                  <TestTube className="w-12 h-12" style={{ color: currentTheme.accent }} />
                </div>
              )}
              {currentTheme.animation === 'grow' && (
                <div className="animate-grow">
                  <Dna className="w-12 h-12" style={{ color: currentTheme.accent }} />
                </div>
              )}
              {currentTheme.animation === 'twinkle' && (
                <div className="animate-twinkle">
                  <Rocket className="w-12 h-12" style={{ color: currentTheme.secondary }} />
                </div>
              )}
            </div>
          </section>

          {/* Products Section */}
          <section id="products" className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>
              Ürünlerimiz
            </h2>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <label htmlFor="product-search" className="sr-only">Ürün Ara</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="product-search"
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 transition-all"
                  style={{ focusRingColor: currentTheme.accent }}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="mb-8 space-y-4">
              {/* Kategori Filtreleri */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm font-semibold text-gray-600 mr-2 self-center">Kategori:</span>
                {['oyuncak', 'deney', 'eğitici', 'dekoratif'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleFilterChange('category', cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilters.category === cat 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: activeFilters.category === cat ? currentTheme.primary : undefined
                    }}
                    aria-label={`${cat} ürünleri filtrele`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Yaş Filtreleri */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm font-semibold text-gray-600 mr-2 self-center">Yaş:</span>
                {['3-6', '7-12', '13+'].map(age => (
                  <button
                    key={age}
                    onClick={() => handleFilterChange('ageGroup', age)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilters.ageGroup === age 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: activeFilters.ageGroup === age ? currentTheme.primary : undefined
                    }}
                    aria-label={`${age} yaş grubu ürünleri filtrele`}
                  >
                    {age} Yaş
                  </button>
                ))}
              </div>

              {/* Bilim Dalı Filtreleri */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm font-semibold text-gray-600 mr-2 self-center">Bilim Dalı:</span>
                {['fizik', 'kimya', 'biyoloji', 'astronomi'].map(sci => (
                  <button
                    key={sci}
                    onClick={() => handleFilterChange('science', sci)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      activeFilters.science === sci 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: activeFilters.science === sci ? themes[sci].primary : undefined
                    }}
                    aria-label={`${sci} ürünleri filtrele`}
                  >
                    {sci === 'fizik' && <Atom className="w-4 h-4" />}
                    {sci === 'kimya' && <TestTube className="w-4 h-4" />}
                    {sci === 'biyoloji' && <Microscope className="w-4 h-4" />}
                    {sci === 'astronomi' && <Rocket className="w-4 h-4" />}
                    {sci.charAt(0).toUpperCase() + sci.slice(1)}
                  </button>
                ))}
              </div>

              {/* Clear Filters */}
              {(activeFilters.category || activeFilters.ageGroup || activeFilters.science || searchTerm) && (
                <div className="text-center">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                    aria-label="Filtreleri temizle"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    className={`${currentTheme.cardBg} rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gray-100">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {product.badge && (
                        <span 
                          className="absolute top-2 left-2 px-3 py-1 text-xs font-bold text-white rounded-full"
                          style={{ backgroundColor: currentTheme.accent }}
                        >
                          {product.badge}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(product.id);
                        }}
                        className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                        aria-label={`Favorilere ekle: ${product.name}`}
                      >
                        <Heart 
                          className={`w-5 h-5 ${likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2" style={{ color: currentTheme.text.replace('text-', '') }}>
                        {product.name}
                      </h3>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {product.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {product.ageGroup} yaş
                        </span>
                        <span 
                          className="text-xs px-2 py-1 text-white rounded-full"
                          style={{ backgroundColor: themes[product.science]?.primary || currentTheme.primary }}
                        >
                          {product.science}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-sm text-gray-500">({product.reviews})</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl font-bold" style={{ color: currentTheme.primary }}>
                          ₺{product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            ₺{product.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className="w-full py-2 px-4 rounded-lg text-white font-medium transition-all hover:opacity-90"
                          style={{ backgroundColor: currentTheme.primary }}
                          aria-label={`${product.name} ürününü sepete ekle`}
                        >
                          <ShoppingCart className="w-5 h-5 inline-block mr-1" />
                          Sepete Ekle
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyNow(product);
                          }}
                          className="w-full py-2 px-4 rounded-lg border transition-colors hover:bg-gray-50"
                          style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
                          aria-label={`${product.name} ürününü hemen satın al`}
                        >
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
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 rounded-full text-white font-medium"
                  style={{ backgroundColor: currentTheme.primary }}
                  aria-label="Filtreleri temizle"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </section>

          {/* About Section */}
          <section id="about" className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8" style={{ color: currentTheme.primary }}>
                Hakkımızda
              </h2>
              <p className="text-lg text-gray-600 mb-12">
                Aslı ve Batur'un ortak bilim aşkından doğan Atomu Parçalayan Bebek, çocuklara ve içindeki çocuğu kaybetmeyen yetişkinlere bilimi sevdirmek için kuruldu. Her bir ürünümüz, laboratuvar titizliği ve oyun eğlencesi harmanlanarak seçilir.
              </p>
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
              <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>
                Sıkça Sorulan Sorular
              </h2>
              <div className="space-y-4">
                {faqData.map((faq, index) => (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-sm"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg" style={{ color: currentTheme.text.replace('text-', '') }}>
                        {faq.question}
                      </h3>
                      {activeFaq === index ? (
                        <ChevronUp className="w-6 h-6 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    {activeFaq === index && (
                      <p className="mt-4 text-gray-600">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>
                İletişim
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Mail className="w-6 h-6" style={{ color: currentTheme.primary }} />
                      <div>
                        <h4 className="font-bold">E-posta</h4>
                        <p className="text-gray-600">destek@atomuparcasi.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone className="w-6 h-6" style={{ color: currentTheme.primary }} />
                      <div>
                        <h4 className="font-bold">Telefon</h4>
                        <p className="text-gray-600">+90 555 123 45 67</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Clock className="w-6 h-6" style={{ color: currentTheme.primary }} />
                      <div>
                        <h4 className="font-bold">Çalışma Saatleri</h4>
                        <p className="text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <MapPin className="w-6 h-6" style={{ color: currentTheme.primary }} />
                      <div>
                        <h4 className="font-bold">Adres</h4>
                        <p className="text-gray-600">ODTÜ Teknokent, Ankara / Türkiye</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div>
                  <form onSubmit={(e) => { e.preventDefault(); handleContactSubmit(); }} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Adınız</label>
                      <input
                        type="text"
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label>
                      <input
                        type="email"
                        id="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mesajınız</label>
                      <textarea
                        id="message"
                        rows="4"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      Mesaj Gönder
                    </button>
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
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                      <Instagram className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                      <Twitter className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                      <Facebook className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Youtube">
                      <Youtube className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-4">Kategoriler</h4>
                  <ul className="space-y-2">
                    {['Fizik', 'Kimya', 'Biyoloji', 'Astronomi', 'Deney Setleri', 'Eğitici Oyuncaklar'].map(cat => (
                      <li key={cat}>
                        <a href="#products" onClick={() => handleFilterChange('science', cat.toLowerCase().replace(' ', ''))} className="text-gray-400 hover:text-white transition-colors">
                          {cat}
                        </a>
                      </li>
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
                    <input
                      type="email"
                      placeholder="E-posta adresiniz"
                      className="px-4 py-2 rounded-l-lg text-slate-900 focus:outline-none w-full"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-r-lg font-bold hover:bg-purple-700 transition-colors"
                    >
                      Abone Ol
                    </button>
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
  };

  const MemoizedProductCard = useMemo(() => {
    return ({ product }) => (
      <div 
        key={product.id}
        className={`${currentTheme.cardBg} rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
        onClick={() => handleProductClick(product)}
      >
        <div className="relative h-48 bg-gray-100">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {product.badge && (
            <span 
              className="absolute top-2 left-2 px-3 py-1 text-xs font-bold text-white rounded-full"
              style={{ backgroundColor: currentTheme.accent }}
            >
              {product.badge}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(product.id);
            }}
            className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
            aria-label={`Favorilere ekle: ${product.name}`}
          >
            <Heart 
              className={`w-5 h-5 ${likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2" style={{ color: currentTheme.text.replace('text-', '') }}>
            {product.name}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
              {product.category}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
              {product.ageGroup} yaş
            </span>
            <span 
              className="text-xs px-2 py-1 text-white rounded-full"
              style={{ backgroundColor: themes[product.science]?.primary || currentTheme.primary }}
            >
              {product.science}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-gray-500">({product.reviews})</span>
          </div>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold" style={{ color: currentTheme.primary }}>
              ₺{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₺{product.originalPrice}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product);
              }}
              className="w-full py-2 px-4 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: currentTheme.primary }}
              aria-label={`${product.name} ürününü sepete ekle`}
            >
              <ShoppingCart className="w-5 h-5 inline-block mr-1" />
              Sepete Ekle
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleBuyNow(product);
              }}
              className="w-full py-2 px-4 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
              aria-label={`${product.name} ürününü hemen satın al`}
            >
              Hemen Satın Al
            </button>
          </div>
        </div>
      </div>
    );
  }, [handleProductClick, toggleLike, handleAddToCart, handleBuyNow, likedProducts, currentTheme, themes]);

  return (
    <div className={`font-sans antialiased text-gray-800 bg-gradient-to-br ${currentTheme.background}`}>
      <style>{customStyles}</style>
      {renderContent()}
    </div>
  );
}