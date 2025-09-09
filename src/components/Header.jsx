import React from 'react';
import { Menu, X, ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Yeni anons sistemimizi dahil ediyoruz
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Header({ isScrolled, currentTheme, isMenuOpen, setIsMenuOpen, handleGoToCart }) {
  const { cartItems } = useCart();
  const { currentUser } = useAuth(); // Giriş yapmış kullanıcı bilgisini alıyoruz
  const navigate = useNavigate();
  const totalItemsInCart = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      // Çıkış başarılı, anasayfaya yönlendir
      navigate('/');
    }).catch((error) => {
      console.error("Çıkış yaparken hata oluştu:", error);
    });
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Prizma Science Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold" style={{ color: currentTheme.primary }}>
              PRIZMA SCIENCE
            </span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/#products" className="hover:opacity-70 transition-opacity">Ürünler</a>
            
            {/* --- AKILLI BÖLÜM --- */}
            {currentUser ? (
              // Kullanıcı giriş yapmışsa bunları göster
              <>
                <a href="/orders" className="hover:opacity-70 transition-opacity flex items-center gap-1"><Package size={18}/> Siparişlerim</a>
                <button onClick={handleLogout} className="hover:opacity-70 transition-opacity flex items-center gap-1"><LogOut size={18}/> Çıkış Yap</button>
              </>
            ) : (
              // Kullanıcı giriş yapmamışsa bunları göster
              <>
                <a href="/login" className="hover:opacity-70 transition-opacity flex items-center gap-1"><User size={18}/> Giriş Yap</a>
              </>
            )}
            {/* --- AKILLI BÖLÜM SONU --- */}

            <div className="relative cursor-pointer" onClick={handleGoToCart}>
              <ShoppingCart className="w-6 h-6" />
              {totalItemsInCart > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItemsInCart}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2" aria-label="Menüyü aç/kapat">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobil Menüyü de akıllı hale getiriyoruz */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col gap-4">
              <a href="/#products" onClick={() => setIsMenuOpen(false)}>Ürünler</a>
              {currentUser ? (
                <>
                  <a href="/orders" onClick={() => setIsMenuOpen(false)}>Siparişlerim</a>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Çıkış Yap</button>
                </>
              ) : (
                <a href="/login" onClick={() => setIsMenuOpen(false)}>Giriş Yap / Kayıt Ol</a>
              )}
              <div className="relative cursor-pointer" onClick={() => { setIsMenuOpen(false); handleGoToCart(); }}>
                <ShoppingCart className="w-6 h-6 inline-block" />
                <span className="ml-2">Sepetim ({totalItemsInCart})</span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}