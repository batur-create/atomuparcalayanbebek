import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, ShieldCheck, Truck, RefreshCw, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, runTransaction, doc, where } from 'firebase/firestore';
import AccordionItem from './AccordionItem';

const StarRatingDisplay = ({ rating }) => (
  <div className="flex items-center">{[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}</div>
);

const StarRatingInput = ({ rating, setRating }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button type="button" key={starValue} className="transition-transform duration-150 ease-in-out transform hover:scale-125" onClick={() => setRating(starValue)} onMouseEnter={() => setHoverRating(starValue)} onMouseLeave={() => setHoverRating(0)}>
            <Star className={`w-7 h-7 ${starValue <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
          </button>
        );
      })}
    </div>
  );
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const RelatedProductCard = ({ product }) => (
  <Link to={`/product/${product.id}`} className="block group">
    <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
      <img src={product.image} alt={product.name} className="w-full h-32 object-cover" loading="lazy" />
      <div className="p-3"><h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{product.name}</h4><p className="text-md font-bold text-gray-900 mt-1">₺{product.price.toFixed(2)}</p></div>
    </div>
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

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);
  
  useEffect(() => {
    const fetchReviewsAndCheckUser = async () => {
      if (!product.id) return;
      try {
        setReviewsLoading(true);
        const reviewsRef = collection(db, 'products', product.id, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() || new Date() }));
        setReviews(reviewsData);
        if (currentUser) {
          const userReview = reviewsData.find(review => review.userId === currentUser.uid);
          setHasUserReviewed(!!userReview);
        } else {
          setHasUserReviewed(false);
        }
      } catch (error) { console.error("Yorumları çekerken hata oluştu:", error); } 
      finally { setReviewsLoading(false); }
    };
    fetchReviewsAndCheckUser();
  }, [product.id, currentUser]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (newRating === 0 || !newComment.trim()) { alert("Lütfen puan verin ve bir yorum yazın."); return; }
    setIsSubmitting(true);
    const productRef = doc(db, 'products', product.id);
    const reviewsRef = collection(db, 'products', product.id, 'reviews');
    try {
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) { throw "Ürün bulunamadı!"; }
        const currentData = productDoc.data();
        const currentRating = currentData.rating || 0;
        const currentReviewCount = currentData.reviews || 0;
        const newReviewCount = currentReviewCount + 1;
        const newAverageRating = ((currentRating * currentReviewCount) + newRating) / newReviewCount;
        transaction.update(productRef, { reviews: newReviewCount, rating: parseFloat(newAverageRating.toFixed(2)) });
        const newReviewRef = doc(reviewsRef);
        transaction.set(newReviewRef, { userId: currentUser.uid, userName: currentUser.displayName || currentUser.email, rating: newRating, comment: newComment, createdAt: serverTimestamp() });
      });
      setNewComment(''); setNewRating(0); setHasUserReviewed(true);
      const updatedReviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'));
      const updatedSnapshot = await getDocs(updatedReviewsQuery);
      const newReviews = updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() || new Date() }));
      setReviews(newReviews);
      const updatedProductDocSnapshot = await getDocs(query(collection(db, "products"), where("id", "==", product.id)));
      if (!updatedProductDocSnapshot.empty) {
        const updatedDoc = updatedProductDocSnapshot.docs[0];
        setProduct({id: updatedDoc.id, ...updatedDoc.data()});
      }
    } catch (error) {
      console.error("Yorum gönderilirken hata oluştu:", error);
      alert("Yorumunuz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally { setIsSubmitting(false); }
  };

  const relatedProducts = allProducts ? allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4) : [];

  return (
    <div className="bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="lg:w-1/2">
            <div className="relative rounded-xl overflow-hidden shadow-xl sticky top-28">
              <img src={product.image} alt={product.name} className="w-full h-auto object-cover"/>
              <button onClick={() => onToggleLike(product.id)} className="absolute top-4 right-4 p-3 bg-white/80 rounded-full hover:bg-white transition-colors" aria-label="Favorilere ekle">
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}/>
              </button>
            </div>
          </div>
          <div className="lg:w-1/2">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4 text-gray-600">
              <StarRatingDisplay rating={product.rating} />
              <span className="text-sm text-gray-500 ml-2">({product.reviews} yorum)</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-extrabold text-blue-600">₺{product.price.toFixed(2)}</span>
              {product.originalPrice && <span className="text-xl text-gray-400 line-through">₺{product.originalPrice.toFixed(2)}</span>}
            </div>
            <p className="mb-6 text-gray-700">{product.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button onClick={() => addToCart(product)} className="flex-1 py-3 px-6 rounded-full text-white font-semibold flex items-center justify-center transition-all hover:opacity-90 bg-blue-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"><ShoppingCart className="w-5 h-5 mr-2" />Sepete Ekle</button>
              <button onClick={() => buyNow(product)} className="flex-1 py-3 px-6 rounded-full font-semibold flex items-center justify-center border-2 border-blue-600 text-blue-600 transition-all hover:bg-blue-50">Hemen Satın Al</button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mb-8 border-t border-b py-4">
              <div className="flex flex-col items-center gap-1 text-xs text-gray-600"><ShieldCheck className="w-6 h-6 text-green-500"/><span>Güvenli Ödeme</span></div>
              <div className="flex flex-col items-center gap-1 text-xs text-gray-600"><Truck className="w-6 h-6 text-blue-500"/><span>Hızlı Kargo</span></div>
              <div className="flex flex-col items-center gap-1 text-xs text-gray-600"><RefreshCw className="w-6 h-6 text-orange-500"/><span>Kolay İade</span></div>
            </div>
            <div className="space-y-2">
              <AccordionItem title="Ürün Özellikleri" isOpen={openAccordion === 1} onClick={() => setOpenAccordion(openAccordion === 1 ? 0 : 1)}>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Kategori:</strong> {capitalizeFirstLetter(product.category)}</li>
                  <li><strong>Yaş Grubu:</strong> {product.ageGroup}</li>
                  <li><strong>Etiketler:</strong> {product.tags?.join(', ')}</li>
                </ul>
              </AccordionItem>
              <AccordionItem title="Kargo ve Teslimat" isOpen={openAccordion === 2} onClick={() => setOpenAccordion(openAccordion === 2 ? 0 : 2)}>
                <p>Saat 15:00'e kadar verilen siparişler aynı gün kargoya verilir. Tahmini teslimat süresi 1-3 iş günüdür.</p>
              </AccordionItem>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-2xl font-bold mb-6">Değerlendirmeler ({reviews.length})</h3>
          {currentUser && !hasUserReviewed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-lg shadow mb-8">
              <h4 className="font-bold text-lg mb-4">Değerlendirme Yap</h4>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Puanınız</label><StarRatingInput rating={newRating} setRating={setNewRating} /></div>
                <div className="mb-4"><label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">Yorumunuz</label><textarea id="comment" rows="4" className="w-full p-2 border border-gray-300 rounded-md" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ürün hakkındaki düşüncelerinizi paylaşın..."/></div>
                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-400"><Send className="w-4 h-4 mr-2" />{isSubmitting ? 'Gönderiliyor...' : 'Yorumu Gönder'}</button>
              </form>
            </motion.div>
          )}
          {currentUser && hasUserReviewed && (<div className="bg-green-100 p-4 rounded-lg text-center text-green-800 mb-8"><p>Bu ürün için zaten bir değerlendirme yaptınız. Teşekkür ederiz!</p></div>)}
          {reviewsLoading ? (<p className="text-gray-500">Yorumlar yükleniyor...</p>) : reviews.length === 0 ? (<div className="bg-gray-100 p-6 rounded-lg text-center"><p className="text-gray-600">Bu ürün için henüz hiç yorum yapılmamış.</p></div>) : (<div className="space-y-6">{reviews.map(review => (<div key={review.id} className="bg-white p-5 rounded-lg shadow"><div className="flex items-center justify-between"><p className="font-bold text-gray-800">{review.userName}</p><span className="text-sm text-gray-400">{new Date(review.createdAt).toLocaleDateString('tr-TR')}</span></div><div className="my-2"><StarRatingDisplay rating={review.rating} /></div><p className="text-gray-600">{review.comment}</p></div>))}</div>)}
        </div>
        {relatedProducts.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-2xl font-bold mb-6">İlgini Çekebilecek Diğer Ürünler</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map(p => (<RelatedProductCard key={p.id} product={p} />))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default memo(ProductDetail);