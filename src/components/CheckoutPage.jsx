import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext'; // Context'i import et

export default function CheckoutPage({ onBack, currentTheme }) {
  // Gerekli veriyi ve fonksiyonu doğrudan Context'ten çekiyoruz
  const { cartItems, clearCart } = useCart();
  
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', address: '', city: '', email: '', phoneNumber: '' });

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = 25.00;
  const total = subtotal + shipping;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    console.log('Sipariş Onaylandı:', { formData, cartItems });
    setIsOrderPlaced(true);
    clearCart(); // Sipariş sonrası sepeti temizlemek için Context fonksiyonunu çağır
  };

  if (isOrderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        {/* ... Sipariş Alındı JSX Kodu Değişmedi ... */}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* ... Geri Butonu ... */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Sipariş Özeti */}
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: currentTheme.primary }}>Sipariş Özeti</h2>
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  {/* ... item detayları ... */}
                </div>
              ))}
            </div>
            {/* ... Toplam Fiyat Bilgileri ... */}
          </div>

          {/* Teslimat ve Ödeme Formu */}
          <div>
            {/* ... Form JSX Kodu Değişmedi ... */}
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* ... form inputları ... */}
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