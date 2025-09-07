import React, { useState } from 'react';
import { ChevronLeft, Trash2, Check, ArrowRight } from 'lucide-react';

export default function CartPage({ cartItems, onBack, onUpdateQuantity, onRemoveItem, onGoToCheckout, currentTheme }) {
  const [discountCode, setDiscountCode] = useState('');
  const [isCodeApplied, setIsCodeApplied] = useState(false);

  // İndirim kodu işlevi için bir yer tutucu (sonraki aşamada tamamlanacak)
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
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="p-2 mr-4"
              aria-label="Geri dön"
            >
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
            <h2 className="text-2xl font-bold mb-4" style={{ color: currentTheme.primary }}>Sepetin boş.</h2>
            <p className="text-gray-600">Hadi, bilim dünyasını keşfe çık ve sepetine ürünler ekle!</p>
            <button
              onClick={onBack}
              className={`mt-6 px-6 py-2 rounded-full text-white font-medium transition-all hover:opacity-90`}
              style={{ backgroundColor: currentTheme.primary }}
            >
              Ürünleri İncele
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sepet İçeriği */}
            <div className="md:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: currentTheme.primary }}>{item.name}</h3>
                      <p className="text-gray-600">₺{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 text-lg font-bold"
                        disabled={item.quantity === 1}
                      >
                        -
                      </button>
                      <span className="px-3">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button onClick={() => onRemoveItem(item.id)} aria-label="Ürünü kaldır">
                      <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700 transition-colors" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sepet Özeti ve Ödeme Butonu */}
            <div className="md:col-span-1 space-y-4">
              {/* İndirim Kodu Alanı */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: currentTheme.primary }}>İndirim Kodu</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="İndirim kodunuz"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                    style={{ focusRingColor: currentTheme.accent }}
                  />
                  <button
                    onClick={applyDiscount}
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: currentTheme.primary }}
                    disabled={isCodeApplied}
                  >
                    {isCodeApplied ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                  </button>
                </div>
                {isCodeApplied && (
                  <p className="text-sm mt-2 text-green-600 font-semibold">Kod uygulandı!</p>
                )}
              </div>

              {/* Ödeme Bilgileri */}
              <div className="bg-white rounded-xl shadow-lg p-6 h-fit sticky top-28">
                <h3 className="text-xl font-bold mb-4" style={{ color: currentTheme.primary }}>Sepet Özeti</h3>
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Ara Toplam:</span>
                  <span>₺{subtotal.toFixed(2)}</span>
                </div>
                {isCodeApplied && (
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span className="text-sm">İndirim:</span>
                    <span className="text-red-500">-₺{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-4">
                  <span>Toplam:</span>
                  <span style={{ color: currentTheme.primary }}>₺{total.toFixed(2)}</span>
                </div>
                <button 
                  onClick={onGoToCheckout} 
                  className={`w-full mt-6 py-3 text-white font-bold rounded-lg transition-all hover:opacity-90`}
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Ödeme Sayfasına Git
                </button>
                <button
                  onClick={onBack}
                  className={`w-full mt-4 py-3 text-white font-bold rounded-lg transition-all hover:opacity-90`}
                  style={{ backgroundColor: currentTheme.secondary }}
                >
                  Alışverişe Devam Et
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}