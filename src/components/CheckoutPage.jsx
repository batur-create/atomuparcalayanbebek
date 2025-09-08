import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CreditCard, Truck, Shield, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

// Firebase fonksiyonlarını ve veritabanı bağlantısını import ediyoruz
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function CheckoutPage({ onBackToCart, onBackToHome, currentTheme }) {
  const { cartItems, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false); // Butona tekrar tekrar basılmasını önlemek için
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

  // *** GÜNCELLENEN handleSubmit FONKSİYONU ***
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      alert('Lütfen kullanım koşullarını kabul edin.');
      return;
    }
    setIsSubmitting(true); // Gönderim başladı, butonu pasif yap

    // 1. Firebase'e kaydedilecek yeni sipariş objesini oluştur
    const newOrder = {
      customerInfo: formData,
      items: cartItems,
      subtotal: subtotal,
      shipping: shipping,
      totalAmount: total,
      status: 'pending_payment', // Durum: Ödeme bekleniyor
      createdAt: serverTimestamp()
    };

    try {
      // 2. Bu objeyi Firebase'deki 'orders' koleksiyonuna kaydet
      console.log("Sipariş Firebase'e kaydediliyor...");
      await addDoc(collection(db, 'orders'), newOrder);
      console.log("Sipariş başarıyla kaydedildi!");

      // 3. Sipariş tamamlandı ekranını göster ve sepeti temizle
      setOrderCompleted(true);
      clearCart();

      // 4. Kısa bir beklemeden sonra Shopier'e yönlendir
      setTimeout(() => {
        console.log("Müşteri Shopier'e yönlendiriliyor...");
        window.location.href = 'https://www.shopier.com/39211130';
      }, 1500); // 1.5 saniye bekle, kullanıcı mesajı görsün

    } catch (error) {
      console.error("Sipariş kaydedilirken hata oluştu: ", error);
      alert("Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
      setIsSubmitting(false); // Hata oldu, butonu tekrar aktif yap
    }
  };

  // Sipariş tamamlandı ekranı
  if (orderCompleted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center" style={{ backgroundColor: currentTheme.background }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}><CheckCircle className="w-24 h-24 mx-auto mb-6 text-green-500" /></motion.div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>Siparişiniz Alındı!</h2>
          <p className="text-gray-600 mb-2">Ödemeyi tamamlamak için güvenli ödeme sayfasına yönlendiriliyorsunuz.</p>
          <p className="text-sm text-gray-500">Lütfen bekleyin...</p>
        </motion.div>
      </motion.div>
    );
  }

  // Ödeme Formu
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen" style={{ backgroundColor: currentTheme.background }}>
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBackToCart} className="p-2" aria-label="Sepete dön"><ChevronLeft className="w-6 h-6" style={{ color: currentTheme.primary }} /></motion.button>
          <h1 className="text-2xl font-bold" style={{ color: currentTheme.primary }}>Teslimat Bilgileri</h1>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Kişisel Bilgiler */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: currentTheme.primary }}><CreditCard className="w-5 h-5" />Kişisel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Ad</label><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="05XX XXX XX XX" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required /></div>
              </div>
            </motion.div>
            {/* Teslimat Adresi */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: currentTheme.primary }}><Truck className="w-5 h-5" />Teslimat Adresi</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Adres</label><textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" placeholder="Mahalle, sokak, bina no..." required /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">İl</label><input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">İlçe</label><input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Posta Kodu</label><input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" placeholder="06XXX" /></div>
                </div>
              </div>
            </motion.div>
            {/* Kullanım Koşulları */}
            <div className="flex items-center gap-3 p-6"><input type="checkbox" name="acceptTerms" id="acceptTerms" checked={formData.acceptTerms} onChange={handleInputChange} className="w-5 h-5 rounded" /><label htmlFor="acceptTerms" className="text-sm text-gray-600"><a href="#" className="underline" style={{ color: currentTheme.primary }}>Kullanım koşullarını</a> okudum, kabul ediyorum.</label></div>
          </div>
          {/* Sağ Taraf - Sipariş Özeti */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl shadow-md p-6 sticky top-28">
              <h3 className="text-xl font-bold mb-6" style={{ color: currentTheme.primary }}>Sipariş Özeti</h3>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">{cartItems.map(item => (<div key={item.id} className="flex items-center gap-3 pb-3 border-b border-gray-100"><img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" /><div className="flex-1"><h4 className="font-medium text-sm">{item.name}</h4><p className="text-gray-500 text-xs">Adet: {item.quantity}</p></div><p className="font-semibold">₺{(item.price * item.quantity).toFixed(2)}</p></div>))}</div>
              <div className="space-y-3 border-t pt-4"><div className="flex justify-between text-gray-600"><span>Ara Toplam:</span><span>₺{subtotal.toFixed(2)}</span></div><div className="flex justify-between text-gray-600"><span>Kargo:</span><span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'ÜCRETSİZ' : `₺${shipping.toFixed(2)}`}</span></div>{shipping > 0 && (<p className="text-xs text-gray-500">500₺ üzeri alışverişlerde kargo ücretsiz!</p>)}<div className="flex justify-between font-bold text-lg border-t pt-3"><span>Toplam:</span><span style={{ color: currentTheme.primary }}>₺{total.toFixed(2)}</span></div></div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg"><div className="flex items-center gap-2 text-sm text-gray-600"><Shield className="w-4 h-4 text-green-500" /><span>SSL Güvenli Bağlantı</span></div></div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting} className="w-full mt-6 py-3 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: currentTheme.primary }}><CreditCard className="w-5 h-5" />{isSubmitting ? 'İşleniyor...' : 'Shopier ile Ödemeye Geç'}</motion.button>
            </motion.div>
          </div>
        </form>
      </main>
    </motion.div>
  );
}