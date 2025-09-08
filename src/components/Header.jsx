import React from 'react';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Header({ isScrolled, currentTheme, isMenuOpen, setIsMenuOpen, handleGoToCart }) {
  const { cartItems } = useCart();
  const totalItemsInCart = cartItems.reduce((total, item) => total + item.quantity, 0);

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
          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="hover:opacity-70 transition-opacity">Ürünler</a>
            <a href="#about" className="hover:opacity-70 transition-opacity">Hakkımızda</a>
            <a href="#faq" className="hover:opacity-70 transition-opacity">SSS</a>
            <a href="#contact" className="hover:opacity-70 transition-opacity">İletişim</a>
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
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col gap-4">
              <a href="#products" onClick={() => setIsMenuOpen(false)}>Ürünler</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)}>Hakkımızda</a>
              <a href="#faq" onClick={() => setIsMenuOpen(false)}>SSS</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)}>İletişim</a>
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