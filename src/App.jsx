import React, { Suspense, lazy } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Custom hooks for state management
import { useProducts } from './hooks/useProducts';
import { useFilters } from './hooks/useFilters';
import { useTheme } from './hooks/useTheme';
import { useNotifications } from './hooks/useNotifications';
import { useScroll } from './hooks/useScroll';

// Core components (always loaded)
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import Breadcrumbs from './components/Breadcrumbs';
import Notification from './components/notification';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorFallback from './components/ErrorFallback';

// Lazy loaded components for better performance
const HomePage = lazy(() => import('./components/HomePage'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const CartPage = lazy(() => import('./components/CartPage'));
const RegisterPage = lazy(() => import('./components/RegisterPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const OrdersPage = lazy(() => import('./components/OrdersPage'));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./components/TermsOfServicePage'));

// Admin components (lazy loaded)
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminProducts = lazy(() => import('./admin/pages/AdminProducts'));
const AdminOrders = lazy(() => import('./admin/pages/AdminOrders'));
const AdminUsers = lazy(() => import('./admin/pages/AdminUsers'));
const AdminAnalytics = lazy(() => import('./admin/pages/AdminAnalytics'));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings'));

// Admin access control component
import { useAuth } from './context/AuthContext';

// Protected admin route wrapper
const AdminRoute = ({ children }) => {
  const { canAccessAdmin, loading, currentUser } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Yetki kontrolü yapılıyor..." />;
  }

  if (!currentUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-gray-50"
      >
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Giriş Gerekli</h1>
          <p className="text-gray-600 mb-6">Admin paneline erişmek için giriş yapmanız gerekiyor.</p>
          <motion.button
            onClick={() => window.location.href = '/login'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Giriş Yap
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (!canAccessAdmin()) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-gray-50"
      >
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⛔</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <motion.button
            onClick={() => window.location.href = '/'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ana Sayfaya Dön
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return children;
};

// Application configuration
const APP_CONFIG = {
  themes: {
    default: { primary: '#2c3e50', secondary: '#f39c12' },
    fizik: { primary: '#3498db' },
    kimya: { primary: '#27ae60' },
    biyoloji: { primary: '#8e44ad' },
    astronomi: { primary: '#1abc9c' },
    mühendislik: { primary: '#6c757d' },
    jeoloji: { primary: '#855a45' },
    elektronik: { primary: '#28a745' },
    mekanik: { primary: '#4a6b8a' },
    optik: { primary: '#20c997' },
    genetik: { primary: '#6610f2' },
    manyetizma: { primary: '#dc3545' },
    zooloji: { primary: '#fd7e14' },
    doğa: { primary: '#198754' }
  },
  faqData: [
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
  ]
};

// Enhanced ProductDetail wrapper with error handling
const ProductDetailWrapper = React.memo(() => {
  const { productId } = useParams();
  const { products, isLoading } = useProducts();
  const { toggleLike, likedProducts } = useFilters(products);
  
  if (isLoading) {
    return <LoadingSpinner message="Ürün yükleniyor..." />;
  }
  
  const product = products.find(p => p.id?.toString() === productId);
  
  if (!product) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-gray-50"
      >
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⌫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ürün Bulunamadı!</h1>
          <p className="text-gray-600 mb-6">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
          <motion.button
            onClick={() => window.history.back()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Geri Dön
          </motion.button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <ProductDetail 
      product={product} 
      allProducts={products} 
      onToggleLike={toggleLike} 
      isLiked={likedProducts.has(product.id)}
    />
  );
});

// Main App component
export default function App() {
  // Load all products
  const { products, isLoading: productsLoading, error: productsError } = useProducts();
  
  // Clean search + filter logic
  const { 
    // Search
    searchTerm,
    setSearchTerm,
    clearSearch,
    
    // Filters
    activeFilters,
    handleFilterChange,
    clearOnlyFilters,
    
    // Combined
    clearFilters,
    
    // Results (this is the key - filteredProducts contains search + filter results)
    searchResults,
    filteredProducts,
    
    // Likes
    likedProducts,
    toggleLike,
    
    // Debug
    stats
  } = useFilters(products);

  // Other app state
  const { currentTheme, handleShortcutFilter } = useTheme(APP_CONFIG.themes, activeFilters);
  const { 
    notification, 
    showNotification, 
    clearNotification,
    handleContactSubmit,
    handleNewsletterSubmit,
    contactForm,
    setContactForm,
    newsletterEmail,
    setNewsletterEmail
  } = useNotifications();
  const { isScrolled, isMenuOpen, setIsMenuOpen } = useScroll();

  // Navigation handlers
  const navigationHandlers = React.useMemo(() => ({
    handleProductClick: (product) => window.location.href = `/product/${product.id}`,
    handleGoToCart: () => window.location.href = '/cart',
    handleGoToCheckout: () => window.open('https://www.shopier.com/39211130', '_blank')
  }), []);

  // FAQ state
  const [activeFaq, setActiveFaq] = React.useState(null);

  // Debug logging (remove in production)
  React.useEffect(() => {
    console.log('Search/Filter Stats:', stats);
  }, [stats]);

  // Global loading state
  if (productsLoading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <LoadingSpinner message="Prizma Science yükleniyor..." />
      </div>
    );
  }

  // Global error state
  if (productsError) {
    return (
      <ErrorBoundary 
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          console.error('App Error:', error, errorInfo);
        }}
      >
        <ErrorFallback error={productsError} resetError={() => window.location.reload()} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <CartProvider setNotification={showNotification}>
          <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
            <ScrollToTop />
            
            {/* Header with enhanced navigation */}
            <Header 
              isScrolled={isScrolled} 
              currentTheme={currentTheme} 
              isMenuOpen={isMenuOpen} 
              setIsMenuOpen={setIsMenuOpen} 
              handleGoToCart={navigationHandlers.handleGoToCart}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
            
            {/* Breadcrumbs */}
            <Breadcrumbs products={products} />
            
            {/* Main content with Suspense for lazy loading */}
            <main className="flex-grow">
              <Suspense fallback={<LoadingSpinner message="Sayfa yükleniyor..." />}>
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path="/" 
                    element={
                      <HomePage 
                        products={filteredProducts}
                        allProducts={products}
                        themes={APP_CONFIG.themes}
                        currentTheme={currentTheme}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        clearSearch={clearSearch}
                        activeFilters={activeFilters}
                        handleFilterChange={handleFilterChange}
                        clearOnlyFilters={clearOnlyFilters}
                        clearFilters={clearFilters}
                        handleProductClick={navigationHandlers.handleProductClick}
                        faqData={APP_CONFIG.faqData}
                        activeFaq={activeFaq}
                        setActiveFaq={setActiveFaq}
                        contactForm={contactForm}
                        setContactForm={setContactForm}
                        handleContactSubmit={handleContactSubmit}
                        isLoading={productsLoading}
                        toggleLike={toggleLike}
                        likedProducts={likedProducts}
                        searchStats={stats}
                      />
                    } 
                  />
                  <Route path="/product/:productId" element={<ProductDetailWrapper />} />
                  <Route 
                    path="/cart" 
                    element={
                      <CartPage 
                        onGoToCheckout={navigationHandlers.handleGoToCheckout} 
                        currentTheme={currentTheme} 
                      />
                    } 
                  />
                  <Route path="/register" element={<RegisterPage currentTheme={currentTheme} />} />
                  <Route path="/login" element={<LoginPage currentTheme={currentTheme} />} />
                  <Route path="/orders" element={<OrdersPage currentTheme={currentTheme} />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage currentTheme={currentTheme} />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage currentTheme={currentTheme} />} />

                  {/* Admin Routes - Protected */}
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/products" 
                    element={
                      <AdminRoute>
                        <AdminProducts />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/orders" 
                    element={
                      <AdminRoute>
                        <AdminOrders />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <AdminRoute>
                        <AdminUsers />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/analytics" 
                    element={
                      <AdminRoute>
                        <AdminAnalytics />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/settings" 
                    element={
                      <AdminRoute>
                        <AdminSettings />
                      </AdminRoute>
                    } 
                  />
                </Routes>
              </Suspense>
            </main>
            
            {/* Enhanced Footer */}
            <Footer 
              handleShortcutFilter={handleShortcutFilter}
              handleNewsletterSubmit={handleNewsletterSubmit}
              newsletterEmail={newsletterEmail}
              setNewsletterEmail={setNewsletterEmail}
            />
            
            {/* Global notification system */}
            <AnimatePresence>
              {notification && (
                <Notification 
                  notificationData={notification} 
                  currentTheme={currentTheme} 
                  onEnd={clearNotification} 
                />
              )}
            </AnimatePresence>
          </div>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}