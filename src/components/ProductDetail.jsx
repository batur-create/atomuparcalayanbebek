import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, ShieldCheck, Truck, RefreshCw, Send, ZoomIn, X, ChevronLeft, ChevronRight, Share2, Package, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import AccordionItem from './AccordionItem';

const StarRatingDisplay = ({ rating, size = 'w-5 h-5' }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`${size} transition-colors ${
          i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`} 
      />
    ))}
  </div>
);

const StarRatingInput = ({ rating, setRating }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;
        return (
          <motion.button 
            type="button" 
            key={starValue} 
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="transition-all duration-150"
            onClick={() => setRating(starValue)} 
            onMouseEnter={() => setHoverRating(starValue)} 
            onMouseLeave={() => setHoverRating(0)}
          >
            <Star className={`w-7 h-7 transition-colors ${
              starValue <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`} />
          </motion.button>
        );
      })}
    </div>
  );
};

// Simplified Image Gallery Component
const ImageGallery = ({ product, isLiked, onToggleLike }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Simulated multiple images
  const images = [product.image, product.image, product.image];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="space-y-4">
        <motion.div 
          className="relative rounded-2xl overflow-hidden shadow-xl bg-white group"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Main image */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
            <motion.img 
              key={currentImageIndex}
              src={images[currentImageIndex]} 
              alt={product.name} 
              className="w-full h-full object-cover cursor-zoom-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsZoomed(true)}
            />
            
            {/* Image navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <motion.button 
                onClick={(e) => { e.stopPropagation(); onToggleLike(product.id); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
              >
                <Heart className={`w-6 h-6 transition-all duration-300 ${
                  isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-600 hover:text-red-400'
                }`}/>
              </motion.button>
              
              <motion.button
                onClick={() => setIsZoomed(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
              >
                <ZoomIn className="w-6 h-6 text-gray-600 hover:text-blue-600" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
              >
                <Share2 className="w-6 h-6 text-gray-600 hover:text-green-600" />
              </motion.button>
            </div>
          </div>

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2 justify-center">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <ShieldCheck className="w-8 h-8 text-green-500" />
            <span className="text-xs font-medium text-gray-700">Güvenli Ödeme</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <Truck className="w-8 h-8 text-blue-500" />
            <span className="text-xs font-medium text-gray-700">Hızlı Kargo</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <RefreshCw className="w-8 h-8 text-orange-500" />
            <span className="text-xs font-medium text-gray-700">Kolay İade</span>
          </div>
        </div>
      </div>

      {/* Clean zoom modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={images[currentImageIndex]} 
                alt={product.name} 
                className="w-full h-full object-contain rounded-lg"
              />
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const RelatedProductCard = ({ product }) => (
  <Link to={`/product/${product.id}`} className="block group">
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
      whileHover={{ y: -4, shadow: "0 20px 40px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative aspect-square bg-gray-50">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
          {product.name}
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">₺{product.price.toFixed(2)}</span>
          <StarRatingDisplay rating={product.rating} size="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  </Link>
);

const ProductDetail = ({ product: initialProduct, onToggleLike, isLiked, allProducts }) => {
  const { addToCart, buyNow } = useCart();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState(initialProduct);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [openAccordion, setOpenAccordion] = useState(1);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);
  
  // Reviews logic (simplified for space)
  useEffect(() => {
    const fetchReviewsAndCheckUser = async () => {
      if (!product.id) return;
      try {
        setReviewsLoading(true);
        const reviewsRef = collection(db, 'products', product.id, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          createdAt: doc.data().createdAt?.toDate() || new Date() 
        }));
        setReviews(reviewsData);
        if (currentUser) {
          const userReview = reviewsData.find(review => review.userId === currentUser.uid);
          setHasUserReviewed(!!userReview);
        } else {
          setHasUserReviewed(false);
        }
      } catch (error) { 
        console.error("Yorumları çekerken hata oluştu:", error); 
      } finally { 
        setReviewsLoading(false); 
      }
    };
    fetchReviewsAndCheckUser();
  }, [product.id, currentUser]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (newRating === 0 || !newComment.trim()) { 
      alert("Lütfen puan verin ve bir yorum yazın."); 
      return; 
    }
    
    setIsSubmitting(true);
    const productRef = doc(db, 'products', product.id);
    const reviewsRef = collection(db, 'products', product.id, 'reviews');
    
    try {
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw "Ürün bulunamadı!";
        
        const currentData = productDoc.data();
        const currentRating = currentData.rating || 0;
        const currentReviewCount = currentData.reviews || 0;
        const newReviewCount = currentReviewCount + 1;
        const newAverageRating = ((currentRating * currentReviewCount) + newRating) / newReviewCount;
        
        transaction.update(productRef, { 
          reviews: newReviewCount, 
          rating: parseFloat(newAverageRating.toFixed(2)) 
        });
        
        const newReviewRef = doc(reviewsRef);
        transaction.set(newReviewRef, { 
          userId: currentUser.uid, 
          userName: currentUser.displayName || currentUser.email, 
          rating: newRating, 
          comment: newComment, 
          createdAt: serverTimestamp() 
        });
      });
      
      setNewComment(''); 
      setNewRating(0); 
      setHasUserReviewed(true);
      
      // Refresh reviews
      const updatedReviewsQuery = query(collection(db, 'products', product.id, 'reviews'), orderBy('createdAt', 'desc'));
      const updatedSnapshot = await getDocs(updatedReviewsQuery);
      const newReviews = updatedSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        createdAt: doc.data().createdAt?.toDate() || new Date() 
      }));
      setReviews(newReviews);
      
    } catch (error) {
      console.error("Yorum gönderilirken hata oluştu:", error);
      alert("Yorumunuz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const relatedProducts = allProducts ? 
    allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4) : [];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen" style={{ paddingTop: '80px' }}>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Image Gallery */}
          <div>
            <ImageGallery product={product} isLiked={isLiked} onToggleLike={onToggleLike} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Category badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                  {product.category}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-600 text-sm font-medium rounded-full">
                  {product.ageGroup} yaş
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900 leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-6">
                <StarRatingDisplay rating={product.rating} />
                <span className="text-lg font-semibold text-gray-800">{product.rating}</span>
                <span className="text-gray-500">({product.reviews} yorum)</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  En Çok Satan
                </span>
              </div>

              {/* Enhanced pricing */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl mb-6 border border-blue-100">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ₺{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        ₺{product.originalPrice.toFixed(2)}
                      </span>
                      <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                        %{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)} İndirim
                      </span>
                    </>
                  )}
                </div>
                
                {/* Quantity selector */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-medium text-gray-700">Adet:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-semibold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    Toplam: ₺{(product.price * quantity).toFixed(2)}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button 
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Sepete Ekle ({quantity} Adet)
                  </motion.button>
                  
                  <motion.button 
                    onClick={() => buyNow(product)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 px-6 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Hemen Satın Al
                  </motion.button>
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Accordion */}
              <div className="space-y-3">
                <AccordionItem 
                  title="Ürün Özellikleri" 
                  isOpen={openAccordion === 1} 
                  onClick={() => setOpenAccordion(openAccordion === 1 ? 0 : 1)}
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-600">Kategori:</span>
                      <span className="ml-2 text-gray-800">{product.category}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Yaş Grubu:</span>
                      <span className="ml-2 text-gray-800">{product.ageGroup}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-gray-600">Etiketler:</span>
                      <span className="ml-2 text-gray-800">{product.tags?.join(', ')}</span>
                    </div>
                  </div>
                </AccordionItem>
                
                <AccordionItem 
                  title="Kargo ve Teslimat" 
                  isOpen={openAccordion === 2} 
                  onClick={() => setOpenAccordion(openAccordion === 2 ? 0 : 2)}
                >
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>📦 Saat 15:00'e kadar verilen siparişler aynı gün kargoya verilir.</p>
                    <p>🚚 Tahmini teslimat süresi 1-3 iş günüdür.</p>
                    <p>💳 Kapıda ödeme ve kredi kartı ile ödeme seçenekleri mevcuttur.</p>
                  </div>
                </AccordionItem>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Reviews Section */}
        <motion.div 
          className="mt-16 pt-8 border-t"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-3xl font-bold mb-8 text-center">Değerlendirmeler ({reviews.length})</h3>
          
          {currentUser && !hasUserReviewed && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl shadow-lg border border-blue-100 mb-8"
            >
              <h4 className="font-bold text-xl mb-6 text-center">Değerlendirme Yap</h4>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Puanınız</label>
                  <StarRatingInput rating={newRating} setRating={setNewRating} />
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Yorumunuz
                  </label>
                  <textarea 
                    id="comment" 
                    rows="4" 
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="Ürün hakkındaki düşüncelerinizi paylaşın..."
                  />
                </div>
                <motion.button 
                  type="submit" 
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Gönderiliyor...' : 'Yorumu Gönder'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {reviewsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Yorumlar yükleniyor...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-gray-50 p-12 rounded-2xl text-center">
              <p className="text-gray-600 text-lg">Bu ürün için henüz hiç yorum yapılmamış.</p>
              <p className="text-gray-500">İlk yorumu siz yapın!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reviews.map(review => (
                <motion.div 
                  key={review.id} 
                  className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{review.userName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <StarRatingDisplay rating={review.rating} />
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div 
            className="mt-16 pt-8 border-t"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-3xl font-bold mb-8 text-center">İlgini Çekebilecek Diğer Ürünler</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default memo(ProductDetail);