import React from 'react';
import { Menu, X, ShoppingCart, User, LogOut, Package, ChevronLeft } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

export default function Header({ isScrolled, currentTheme, isMenuOpen, setIsMenuOpen, handleGoToCart }) {
  const { cartItems } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const totalItemsInCart = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => { navigate('/'); })
      .catch((error) => { console.error("Çıkış yaparken hata oluştu:", error); });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Ürünler'e tıklandığında: Home'daysak #products'a kaydır, farklı sayfadaysak Home+#products'a git
  const goHomeProducts = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/#products');
    }
    if (setIsMenuOpen) setIsMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-3">
            {location.pathname !== '/' && (
              <button
                onClick={handleGoBack}
                className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full"
                aria-label="Geri git"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <Link to="/" className="flex items-center gap-3" onClick={() => setIsMenuOpen && setIsMenuOpen(false)}>
              <img src="/logo.png" alt="Prizma Science Logo" className="h-10 w-10" />
              <span className="text-xl sm:text-2xl font-bold" style={{ color: currentTheme.primary }}>
                PRIZMA SCIENCE
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button type="button" onClick={goHomeProducts} className="hover:opacity-70 transition-opacity">
              Ürünler
            </button>

            {currentUser ? (
              <>
                <Link to="/orders" className="hover:opacity-70 transition-opacity flex items-center gap-1">
                  <Package size={18} /> Siparişlerim
                </Link>
                <button onClick={handleLogout} className="hover:opacity-70 transition-opacity flex items-center gap-1">
                  <LogOut size={18} /> Çıkış Yap
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:opacity-70 transition-opacity flex items-center gap-1">
                <User size={18} /> Giriş Yap
              </Link>
            )}

            <button className="relative" onClick={handleGoToCart} aria-label="Sepetim">
              <ShoppingCart className="w-6 h-6" />
              {totalItemsInCart > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItemsInCart}
                </span>
              )}
            </button>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2" aria-label="Menüyü aç/kapat">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col gap-4">
              <button onClick={goHomeProducts}>Ürünler</button>

              {currentUser ? (
                <>
                  <Link to="/orders" onClick={() => setIsMenuOpen(false)}>Siparişlerim</Link>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Çıkış Yap</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>Giriş Yap / Kayıt Ol</Link>
              )}

              <button className="relative text-left" onClick={() => { setIsMenuOpen(false); handleGoToCart(); }}>
                <ShoppingCart className="w-6 h-6 inline-block" />
                <span className="ml-2">Sepetim ({totalItemsInCart})</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
