import React, { useState } from 'react';
import { ChevronLeft, Trash2, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext'; // Context'i import et

export default function CartPage({ onBack, onGoToCheckout, currentTheme }) {
  // Sepetle ilgili her şeyi TEK BİR YERDEN alıyoruz
  const { cartItems, updateQuantity, removeItem } = useCart();

  const [discountCode, setDiscountCode] = useState('');
  const [isCodeApplied, setIsCodeApplied] = useState(false);

  const applyDiscount = () => {
    if (discountCode.toLowerCase() === 'asli10') {
      setIsCodeApplied(true);
      alert('ASLI10 kodu başarıyla uygulandı! %10 indirim kazandın!');
    } else {
      setIsCodeApplied(false);
      alert('Geçersiz indirim kodu.');
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const discountAmount = isCodeApplied ? subtotal * 0.10 : 0;
  const total = subtotal - discountAmount;

  return (
    <div className={`min-h-screen ${currentTheme.background} transition-all duration-700`}>
      <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg`}>
        {/* ... Header JSX Kodu Değişmedi ... */}
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 mr-4" aria-label="Geri dön">
              <ChevronLeft className="w-6 h-6" style={{ color: currentTheme.primary }} />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: currentTheme.primary }}>
              Sepetim ({cartItems.length})
            </h1>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            {/* ... Sepet Boş JSX Kodu Değişmedi ... */}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sepet İçeriği */}
            <div className="md:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
                  {/* ... Ürün bilgileri ... */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} // Context fonksiyonunu kullan
                        className="px-2 py-1 text-lg font-bold"
                        disabled={item.quantity === 1}
                      >
                        -
                      </button>
                      <span className="px-3">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} // Context fonksiyonunu kullan
                        className="px-2 py-1 text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} aria-label="Ürünü kaldır"> // Context fonksiyonunu kullan
                      <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700 transition-colors" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sepet Özeti */}
            <div className="md:col-span-1 space-y-4">
                {/* ... İndirim ve Ödeme Bilgileri JSX Kodu Değişmedi ... */}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}