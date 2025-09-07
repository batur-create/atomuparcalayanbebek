import React from 'react';
import { ChevronLeft, ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext'; // Kendi anons sistemimizi dinliyoruz

export default function ProductDetail({ 
  product, 
  onBack, 
  onToggleLike, 
  isLiked 
}) {
  // Sepet fonksiyonlarını doğrudan context'ten alıyoruz
  const { addToCart, buyNow } = useCart();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 mr-4" aria-label="Geri dön">
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
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
            <div className="flex items-center gap-1 mb-4 text-gray-600">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span>{product.rating}</span>
              <span className="text-sm text-gray-500">({product.reviews} yorum)</span>
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
              <span className="text-xs px-3 py-1 bg-gray-100 rounded-full">{product.science}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => addToCart(product)}
                className="flex-1 py-3 px-6 rounded-full text-white font-semibold flex items-center justify-center transition-all hover:opacity-90 bg-blue-600"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Sepete Ekle
              </button>
              <button 
                onClick={() => buyNow(product)}
                className="flex-1 py-3 px-6 rounded-full font-semibold flex items-center justify-center border-2 border-blue-600 text-blue-600 transition-all hover:bg-blue-50"
              >
                Hemen Satın Al
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}