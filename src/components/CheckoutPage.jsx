import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CreditCard, Truck, Shield, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Kullanıcı bilgisini almak için
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function CheckoutPage({ onBackToCart, onBackToHome, currentTheme }) {
  const { cartItems, clearCart } = useCart();
  const { currentUser } = useAuth(); // Giriş yapmış kullanıcıyı al
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', district: '', postalCode: '',
    orderNote: '', acceptTerms: false
  });

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 29.90;
  const total = subtotal + shipping;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      alert('Lütfen kullanım koşullarını kabul edin.');
      return;
    }
    setIsSubmitting(true);

    const newOrder = {
      // YENİ: Siparişi kullanıcıya bağlıyoruz
      userId: currentUser ? currentUser.uid : 'guest', 
      customerInfo: formData,
      items: cartItems,
      subtotal: subtotal,
      shipping: shipping,
      totalAmount: total,
      status: 'Ödeme Bekleniyor (Shopier)',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      setOrderCompleted(true);
      clearCart();

      setTimeout(() => {
        window.location.href = 'https://www.shopier.com/39211130';
      }, 1500);

    } catch (error) {
      console.error("Sipariş kaydedilirken hata oluştu: ", error);
      alert("Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
      setIsSubmitting(false);
    }
  };

  if (orderCompleted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <CheckCircle className="w-24 h-24 mx-auto mb-6 text-green-500" />
          <h2 className="text-3xl font-bold mb-4">Siparişiniz Alındı!</h2>
          <p className="text-gray-600">Ödemeyi tamamlamak için güvenli ödeme sayfasına yönlendiriliyorsunuz...</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBackToCart} className="p-2"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-2xl font-bold">Teslimat Bilgileri</h1>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-6">Kişisel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label>Ad</label><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full mt-2 px-4 py-2 border rounded-lg" required /></div>
                <div><label>Soyad</label><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full mt-2 px-4 py-2 border rounded-lg" required /></div>
                <div><label>E-posta</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full mt-2 px-4 py-2 border rounded-lg" required /></div>
                <div><label>Telefon</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full mt-2 px-4 py-2 border rounded-lg" required /></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-6">Teslimat Adresi</h3>
               <div className="space-y-4">
                <div><label>Adres</label><textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className="w-full mt-2 px-4 py-2 border rounded-lg" required /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label>İl</label><input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full mt-2 px-4 py-2 border rounded-lg" required /></div>
                  <div><label>İlçe</label><input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full mt-2 px-4 py-2 border rounded-lg" required /></div>
                  <div><label>Posta Kodu</label><input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full mt-2 px-4 py-2 border rounded-lg" /></div>
                </div>
              </div>
            </div>
            <div className="p-6"><input type="checkbox" name="acceptTerms" id="acceptTerms" checked={formData.acceptTerms} onChange={handleInputChange} className="w-5 h-5 mr-2" /><label htmlFor="acceptTerms">Kullanım koşullarını okudum, kabul ediyorum.</label></div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-28">
              <h3 className="text-xl font-bold mb-6">Sipariş Özeti</h3>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">{cartItems.map(item => (<div key={item.id} className="flex justify-between"><span className="font-medium">{item.name} x {item.quantity}</span><span>₺{(item.price * item.quantity).toFixed(2)}</span></div>))}</div>
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between"><span>Ara Toplam:</span><span>₺{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Kargo:</span><span>{shipping === 0 ? 'ÜCRETSİZ' : `₺${shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Toplam:</span><span>₺{total.toFixed(2)}</span></div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full mt-6 py-3 text-white font-bold rounded-lg shadow-lg bg-blue-600 disabled:opacity-50">{isSubmitting ? 'İşleniyor...' : 'Shopier ile Ödemeye Geç'}</button>
            </div>
          </div>
        </form>
      </main>
    </motion.div>
  );
}
