import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Trash2, 
  Check, 
  ArrowRight, 
  XCircle, 
  Plus, 
  Minus, 
  ShoppingBag, 
  CreditCard, 
  Truck,
  Shield,
  Gift,
  Tag,
  Heart,
  Share2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

// Enhanced discount codes system
const DISCOUNT_CODES = {
  'BILIM10': { discount: 0.10, description: '%10 İndirim' },
  'YENI15': { discount: 0.15, description: '%15 Yeni Müşteri İndirimi' },
  'OGRENCI20': { discount: 0.20, description: '%20 Öğrenci İndirimi' },
  'TOPLU25': { discount: 0.25, description: '%25 Toplu Alım İndirimi' }
};

// Shipping calculation
const calculateShipping = (subtotal) => {
  if (subtotal >= 500) return 0; // Free shipping over 500₺
  if (subtotal >= 200) return 25; // 25₺ shipping
  return 40; // Standard shipping
};

// Enhanced cart item component
const CartItemCard = React.memo(({ 
  item, 
  updateQuantity, 
  removeItem, 
  currentTheme 
}) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = useCallback(async () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeItem(item.id);
    }, 200);
  }, [item.id, removeItem]);

  const handleQuantityChange = useCallback((newQuantity) => {
    if (newQuantity < 1) {
      handleRemove();
    } else {
      updateQuantity(item.id, newQuantity);
    }
  }, [item.id, updateQuantity, handleRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: isRemoving ? 0 : 1, 
        x: isRemoving ? -100 : 0,
        scale: isRemoving ? 0.8 : 1
      }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative flex-shrink-0">
          <motion.img 
            src={item.image} 
            alt={item.name} 
            className="w-24 h-24 object-cover rounded-xl shadow-md"
            whileHover={{ scale: 1.05 }}
          />
          {item.badge && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
        
        {/* Product Details */}
        <div className="flex-grow space-y-3">
          {/* Header with name and remove button */}
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-800 leading-tight pr-2">
              {item.name}
            </h3>
            <motion.button 
              onClick={handleRemove}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Ürünü kaldır"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Price and quantity controls */}
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold" style={{ color: currentTheme.primary }}>
                ₺{(item.price * item.quantity).toFixed(2)}
              </p>
              {item.quantity > 1 && (
                <p className="text-sm text-gray-500">
                  ₺{item.price.toFixed(2)} × {item.quantity}
                </p>
              )}
            </div>

            {/* Enhanced quantity selector */}
            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
              <motion.button 
                onClick={() => handleQuantityChange(item.quantity - 1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-gray-100 rounded-l-xl transition-colors"
                disabled={item.quantity === 1}
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              
              <motion.span 
                key={item.quantity}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="px-4 py-3 font-bold text-lg min-w-[60px] text-center"
              >
                {item.quantity}
              </motion.span>
              
              <motion.button 
                onClick={() => handleQuantityChange(item.quantity + 1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 hover:bg-gray-100 rounded-r-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Additional product info */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {item.category && (
              <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                {item.category}
              </span>
            )}
            {item.ageGroup && (
              <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                {item.ageGroup} yaş
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Enhanced discount input component
const DiscountSection = React.memo(({ 
  discountCode, 
  setDiscountCode, 
  discount, 
  setDiscount, 
  error, 
  setError, 
  currentTheme 
}) => {
  const [suggestions, setSuggestions] = useState([]);

  const applyDiscount = useCallback(() => {
    const code = discountCode.toUpperCase();
    if (DISCOUNT_CODES[code]) {
      setDiscount(DISCOUNT_CODES[code]);
      setError('');
      setSuggestions([]);
    } else {
      setError('Geçersiz indirim kodu.');
      setDiscount({ discount: 0 });
      const availableCodes = Object.keys(DISCOUNT_CODES);
      setSuggestions(availableCodes.slice(0, 2));
    }
  }, [discountCode, setDiscount, setError]);

  const applySuggestedCode = useCallback((code) => {
    setDiscountCode(code);
    setDiscount(DISCOUNT_CODES[code]);
    setError('');
    setSuggestions([]);
  }, [setDiscountCode, setDiscount, setError]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.2 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5" style={{ color: currentTheme.primary }} />
        <h3 className="text-xl font-bold" style={{ color: currentTheme.primary }}>
          İndirim Kodu
        </h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <motion.input
            type="text"
            placeholder="BILIM10, YENI15..."
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            className="flex-grow px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:outline-none transition-all"
            style={{ 
              borderColor: discount.discount > 0 ? '#10b981' : currentTheme.primary + '30',
              focusRingColor: currentTheme.secondary 
            }}
            onKeyPress={(e) => e.key === 'Enter' && applyDiscount()}
            whileFocus={{ scale: 1.02 }}
          />
          <motion.button 
            onClick={applyDiscount}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl text-white shadow-lg transition-all"
            style={{ 
              backgroundColor: discount.discount > 0 ? '#10b981' : currentTheme.primary 
            }}
          >
            {discount.discount > 0 ? <Check size={20} /> : <ArrowRight size={20} />}
          </motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <p className="text-sm text-red-500 flex items-center gap-1">
                <XCircle size={14} /> {error}
              </p>
              {suggestions.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-xs text-gray-500">Deneyin:</span>
                  {suggestions.map(code => (
                    <button
                      key={code}
                      onClick={() => applySuggestedCode(code)}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          
          {discount.discount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-green-600 font-semibold flex items-center gap-1"
            >
              <Check size={14} /> {discount.description} uygulandı!
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default function CartPage({ onGoToCheckout, currentTheme }) {
  const { cartItems, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState({ discount: 0 });
  const [error, setError] = useState('');

  // Enhanced calculations
  const calculations = useMemo(() => {
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const discountAmount = subtotal * discount.discount;
    const shipping = calculateShipping(subtotal);
    const total = subtotal - discountAmount + shipping;
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return {
      subtotal,
      discountAmount,
      shipping,
      total,
      itemCount
    };
  }, [cartItems, discount.discount]);

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

  if (cartItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50"
        style={{ paddingTop: '80px' }}
      >
        {/* Main content */}
        <main className="container mx-auto px-4 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: currentTheme.primary }}>
              Sepetiniz Boş
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Henüz sepetinize ürün eklemediniz. Bilimin büyüleyici dünyasından 
              size uygun ürünleri keşfetmeye başlayın!
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={() => navigate('/')}
              className="px-8 py-4 rounded-2xl text-white font-semibold shadow-lg flex items-center gap-2 mx-auto"
              style={{ backgroundColor: currentTheme.primary }}
            >
              <ArrowRight className="w-5 h-5" />
              Alışverişe Başla
            </motion.button>
          </motion.div>
        </main>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50"
      style={{ paddingTop: '80px' }}
    >
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }} 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
              aria-label="Geri dön"
            >
              <ChevronLeft className="w-6 h-6" style={{ color: currentTheme.primary }} />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: currentTheme.primary }}>
                Sepetim
              </h1>
              <p className="text-gray-600">
                {calculations.itemCount} ürün • ₺{calculations.total.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <Heart className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Cart Items */}
          <motion.div
            className="lg:col-span-2 space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {cartItems.map(item => (
                <motion.div key={item.id} variants={itemVariants}>
                  <CartItemCard
                    item={item}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                    currentTheme={currentTheme}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Order Summary - Fixed positioning */}
          <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-24">
              
              {/* Discount Section */}
              <DiscountSection
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                discount={discount}
                setDiscount={setDiscount}
                error={error}
                setError={setError}
                currentTheme={currentTheme}
              />

              {/* Order Summary */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <h3 className="text-xl font-bold mb-6" style={{ color: currentTheme.primary }}>
                  Sipariş Özeti
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam ({calculations.itemCount} ürün):</span>
                    <span>₺{calculations.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discount.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İndirim ({discount.description}):</span>
                      <span>-₺{calculations.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Kargo:
                    </span>
                    <span>
                      {calculations.shipping === 0 ? 'Ücretsiz' : `₺${calculations.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  
                  {calculations.shipping > 0 && calculations.subtotal < 500 && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
                      ₺{(500 - calculations.subtotal).toFixed(2)} daha ekleyin, kargo ücretsiz olsun!
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-xl">
                      <span>Toplam:</span>
                      <span style={{ color: currentTheme.primary }}>
                        ₺{calculations.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2 mt-6 text-center text-xs">
                  <div className="flex flex-col items-center p-2">
                    <Shield className="w-5 h-5 text-green-500 mb-1" />
                    <span className="text-gray-600">Güvenli</span>
                  </div>
                  <div className="flex flex-col items-center p-2">
                    <CreditCard className="w-5 h-5 text-blue-500 mb-1" />
                    <span className="text-gray-600">Ödeme</span>
                  </div>
                  <div className="flex flex-col items-center p-2">
                    <Gift className="w-5 h-5 text-purple-500 mb-1" />
                    <span className="text-gray-600">Hediye</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button 
                  onClick={onGoToCheckout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 py-4 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-lg"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <CreditCard className="w-5 h-5" />
                  Güvenli Ödemeye Geç
                </motion.button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  256-bit SSL şifreleme ile güvenli ödeme
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}