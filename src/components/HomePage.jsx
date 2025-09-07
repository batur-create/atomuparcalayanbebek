import React from 'react';
import { 
  Menu, X, Search, ShoppingCart, Star, Heart, 
  ChevronDown, ChevronUp, Mail, Phone, Clock, MapPin,
  Instagram, Twitter, Facebook, Youtube, Sparkles, 
  Atom, Microscope, Dna, Rocket,
  Award, Package, Shield, TestTube
} from 'lucide-react';
import { useCart } from '../context/CartContext'; // Anons sistemini dinlemek için hook'umuzu import ettik

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
  // Gerekli sepet verilerini ve fonksiyonlarını doğrudan context'ten çekiyoruz
  const { addToCart, buyNow, cartItems } = useCart();

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
                {/* ... diğer linkler */}
                <div className="relative cursor-pointer" onClick={() => { setIsMenuOpen(false); handleGoToCart(); }}>
                  <ShoppingCart className="w-6 h-6 inline-block" />
                  <span className="ml-2">Sepetim ({cartItems.reduce((total, item) => total + item.quantity, 0)})</span>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
      
      {/* ... Geri kalan tüm JSX kodu aynı ... */}
      {/* Örnek olarak ürün kartlarındaki butonların nasıl context fonksiyonlarını kullandığına dikkat et */}
      
      <section id="products" className="container mx-auto px-4 py-16">
        {/* ... Search ve Filter Barları ... */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className={`${currentTheme.cardBg} rounded-xl shadow-lg ...`} onClick={() => handleProductClick(product)}>
                {/* ... ürün resmi ve diğer detaylar ... */}
                <div className="p-4">
                  {/* ... ürün adı, fiyatı vb ... */}
                  <div className="flex flex-col gap-2">
                    <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="w-full ...">
                      <ShoppingCart className="w-5 h-5 inline-block mr-1" />
                      Sepete Ekle
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); buyNow(product); }} className="w-full ...">
                      Hemen Satın Al
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          {/* ... ürün bulunamadı mesajı ... */}
        )}
      </section>

      {/* ... Hakkımızda, SSS, İletişim ve Footer Section'ları ... */}
      {/* Bunların içinde değişiklik yapmaya gerek yok */}
    </>
  );
}