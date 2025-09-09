import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trash2, Check, ArrowRight, XCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage({ onBack, onGoToCheckout, currentTheme }) {
  const { cartItems, updateQuantity, removeItem } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');

  const subtotal = useMemo(() =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const total = useMemo(() => subtotal * (1 - discount), [subtotal, discount]);

  const applyDiscount = () => {
    if (discountCode.toUpperCase() === 'BILIM10') {
      setDiscount(0.10); // %10 indirim
      setError('');
    } else {
      setError('Geçersiz indirim kodu.');
      setDiscount(0);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen" style={{ backgroundColor: currentTheme.background }}
    >
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2" aria-label="Geri dön">
                <ChevronLeft className="w-6 h-6" style={{ color: currentTheme.primary }} />
            </motion.button>
            <h1 className="text-2xl font-bold" style={{ color: currentTheme.primary }}>
                Sepetim
            </h1>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <h2 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>Sepetin şu an boş.</h2>
            <p className="text-gray-600 mb-8">Merak listenize ekleyecek harika ürünler sizi bekliyor.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack} className="px-8 py-3 rounded-full text-white font-semibold shadow-lg" style={{ backgroundColor: currentTheme.primary }}>
              Keşfe Devam Et
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <motion.div
              className="lg:col-span-2 space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* === MOBİL UYUMLULUK İÇİN YENİDEN DÜZENLENEN BÖLÜM BAŞLANGICI === */}
              {cartItems.map(item => (
                <motion.div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg p-4 flex gap-4"
                  variants={itemVariants}
                  layout
                >
                  {/* Ürün Resmi */}
                  <img src={item.image} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0" />
                  
                  {/* Ürün Bilgileri ve Kontroller */}
                  <div className="flex flex-col flex-grow justify-between">
                    {/* Üst Kısım: İsim ve Sil Butonu */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-md sm:text-lg font-semibold pr-2" style={{ color: currentTheme.primary }}>{item.name}</h3>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeItem(item.id)} aria-label="Ürünü kaldır" className="flex-shrink-0">
                        <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700 transition-colors" />
                      </motion.button>
                    </div>

                    {/* Alt Kısım: Fiyat ve Adet Seçici */}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-gray-700 font-semibold text-lg">₺{item.price.toFixed(2)}</p>
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-l-lg transition-colors" disabled={item.quantity === 1}>-</button>
                        <span className="px-4 font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-r-lg transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* === YENİDEN DÜZENLENEN BÖLÜM SONU === */}
            </motion.div>

            {/* Sipariş Özeti Bölümü (Aynı kalıyor) */}
            <div className="lg:col-span-1 space-y-6 sticky top-28">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: currentTheme.primary }}>İndirim Kodu</h3>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="BILIM10" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" style={{ borderColor: currentTheme.primary+'30', focusRingColor: currentTheme.secondary }} />
                  <motion.button onClick={applyDiscount} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2.5 rounded-lg text-white" style={{ backgroundColor: discount > 0 ? '#27ae60' : currentTheme.primary }}>
                    {discount > 0 ? <Check size={20} /> : <ArrowRight size={20} />}
                  </motion.button>
                </div>
                <AnimatePresence>
                {error && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm mt-2 text-red-500 flex items-center gap-1"><XCircle size={14}/> {error}</motion.p>}
                {discount > 0 && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm mt-2 text-green-600 font-semibold">Kod uygulandı!</motion.p>}
                </AnimatePresence>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: currentTheme.primary }}>Sipariş Özeti</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-gray-600"><span>Ara Toplam:</span><span>₺{subtotal.toFixed(2)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-green-600"><span>İndirim (%{discount * 100}):</span><span>-₺{(subtotal * discount).toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-xl border-t pt-4 mt-2"><span>Genel Toplam:</span><span style={{ color: currentTheme.primary }}>₺{total.toFixed(2)}</span></div>
                </div>
                <motion.button onClick={onGoToCheckout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full mt-6 py-3 text-white font-bold rounded-lg shadow-lg" style={{ backgroundColor: currentTheme.primary }}>
                  Güvenli Ödemeye Geç
                </motion.button>
              </motion.div>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
}