import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function CheckoutPage({ cartItems, onBack, onClearCart, currentTheme }) {
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    email: '',
    phoneNumber: ''
  });

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = 25.00; // Sabit kargo ücreti
  const total = subtotal + shipping;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    // Burada ödeme işlemini taklit ediyoruz
    console.log('Sipariş Onaylandı:', {
      formData,
      cartItems
    });
    setIsOrderPlaced(true);
    // Sipariş verildikten sonra sepeti temizle
    onClearCart();
  };

  if (isOrderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-xl mx-auto p-8 rounded-lg shadow-xl" style={{ backgroundColor: currentTheme.cardBg, color: currentTheme.text.replace('text-', '') }}>
          <CheckCircle className="w-24 h-24 mx-auto mb-6" style={{ color: currentTheme.primary }} />
          <h2 className="text-3xl font-bold mb-4">Siparişin Alındı!</h2>
          <p className="text-lg text-gray-600 mb-6">En kısa sürede kargoya verilecek.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-full text-white font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: currentTheme.primary }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 mb-8 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Sepete Geri Dön</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Sipariş Özeti */}
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: currentTheme.primary }}>Sipariş Özeti</h2>
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-500">Miktar: {item.quantity}</p>
                  </div>
                  <span className="font-bold">₺{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6 space-y-2">
              <div className="flex justify-between font-medium">
                <span>Ara Toplam:</span>
                <span>₺{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Kargo:</span>
                <span>₺{shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl" style={{ color: currentTheme.primary }}>
                <span>Toplam:</span>
                <span>₺{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Ödeme ve Adres Formu */}
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: currentTheme.primary }}>Teslimat ve Ödeme</h2>
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Adres Formu */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg" style={{ color: currentTheme.primary }}>Teslimat Bilgileri</h3>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Ad Soyad"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: currentTheme.primary, focusRingColor: currentTheme.accent }}
                  required
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Açık Adres"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: currentTheme.primary, focusRingColor: currentTheme.accent }}
                  required
                />
                <input
                  type="text"
                  name="city"
                  placeholder="Şehir"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: currentTheme.primary, focusRingColor: currentTheme.accent }}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="E-posta Adresi"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: currentTheme.primary, focusRingColor: currentTheme.accent }}
                  required
                />
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Telefon Numarası"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: currentTheme.primary, focusRingColor: currentTheme.accent }}
                  required
                />
              </div>

              {/* Ödeme Formu - Dummy */}
              <div className="space-y-4 pt-4">
                <h3 className="font-semibold text-lg" style={{ color: currentTheme.primary }}>Ödeme Bilgileri</h3>
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="Kart Numarası"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: currentTheme.primary, focusRingColor: currentTheme.accent }}
                  required
                />
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="expiry"
                    placeholder="Son Kullanma Tarihi (AA/YY)"
                    className="w-1/2 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: currentTheme.primary, focusRingColor: currentTheme.accent }}
                    required
                  />
                  <input
                    type="text"
                    name="cvc"
                    placeholder="CVC"
                    className="w-1/2 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: currentTheme.primary, focusRingColor: currentTheme.accent }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-lg text-white font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: currentTheme.primary }}
              >
                ₺{total.toFixed(2)} Öde ve Siparişi Tamamla
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}