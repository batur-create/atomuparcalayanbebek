import React, { useState, useEffect } from 'react';
import { ChevronLeft, ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// Puanları yıldız olarak göstermek için küçük bir yardımcı bileşen
const StarRatingDisplay = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`w-5 h-5 ${index < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

export default function ProductDetail({ 
  product, 
  onBack, 
  onToggleLike, 
  isLiked 
}) {
  const { addToCart, buyNow } = useCart();
  
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!product.id) return;

      try {
        setReviewsLoading(true);
        const reviewsRef = collection(db, 'products', product.id, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const reviewsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
          };
        });
        setReviews(reviewsData);
      } catch (error) {
        console.error("Yorumları çekerken hata oluştu:", error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [product.id]);

  return (
    // === DÜZELTME BURADA: overflow-x-hidden sınıfını ekledik ===
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 mr-4" aria-label="Geri dön">
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{product.name}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image Section */}
          <div className="md:w-1/2">
            <div className="relative rounded-xl overflow-hidden shadow-xl">
              <img src={product.image} alt={product.name} className="w-full h-auto object-cover"/>
              <button
                onClick={() => onToggleLike(product.id)}
                className="absolute top-4 right-4 p-3 bg-white/80 rounded-full hover:bg-white transition-colors"
                aria-label="Favorilere ekle"
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}/>
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
            <div className="flex items-center gap-2 mb-4 text-gray-600">
              <StarRatingDisplay rating={product.rating} />
              <span className="text-sm text-gray-500 ml-2">({product.reviews} yorum)</span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-extrabold text-blue-600">₺{product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">₺{product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            <div className="mb-6 space-y-4 text-gray-700">
              <h3 className="font-bold text-lg">Ürün Açıklaması</h3>
              <p>{product.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-xs px-3 py-1 bg-gray-100 rounded-full">{product.category}</span>
              <span className="text-xs px-3 py-1 bg-gray-100 rounded-full">{product.ageGroup} yaş</span>
              {product.tags?.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 bg-gray-200 rounded-full">{tag}</span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => addToCart(product)} className="flex-1 py-3 px-6 rounded-full text-white font-semibold flex items-center justify-center transition-all hover:opacity-90 bg-blue-600"><ShoppingCart className="w-5 h-5 mr-2" />Sepete Ekle</button>
              <button onClick={() => buyNow(product)} className="flex-1 py-3 px-6 rounded-full font-semibold flex items-center justify-center border-2 border-blue-600 text-blue-600 transition-all hover:bg-blue-50">Hemen Satın Al</button>
            </div>
          </div>
        </div>

        {/* Yorumlar Bölümü */}
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-2xl font-bold mb-6">Değerlendirmeler ({reviews.length})</h3>
          {reviewsLoading ? (
            <p className="text-gray-500">Yorumlar yükleniyor...</p>
          ) : reviews.length === 0 ? (
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <p className="text-gray-600">Bu ürün için henüz hiç yorum yapılmamış.</p>
              <p className="text-gray-500 text-sm mt-1">İlk değerlendirmeyi sen yap!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-white p-5 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800">{review.userName}</p>
                    <span className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="my-2">
                    <StarRatingDisplay rating={review.rating} />
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}