import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, themes, currentTheme, handleProductClick, toggleLike, likedProducts }) {
  const { addToCart, buyNow } = useCart();

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-2xl flex flex-col cursor-pointer"
      onClick={() => handleProductClick(product)}
    >
      <div className="relative h-56 bg-gray-100">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy"/>
        {product.badge && <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full" style={{ backgroundColor: currentTheme.secondary }}>{product.badge}</span>}
        <button onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }} className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
          <Heart className={`w-5 h-5 ${likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}/>
        </button>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-2" style={{ color: currentTheme.primary }}>{product.name}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{product.category}</span>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{product.ageGroup} yaş</span>
          {/* Ürünün etiketlerini map ile dönüp gösteriyoruz */}
          {product.tags?.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 text-white rounded-full" style={{ backgroundColor: themes[tag]?.primary || currentTheme.primary }}>
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-sm text-gray-500">({product.reviews})</span>
        </div>
        <div className="mt-auto pt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold" style={{ color: currentTheme.primary }}>₺{product.price.toFixed(2)}</span>
            {product.originalPrice && <span className="text-sm text-gray-400 line-through">₺{product.originalPrice.toFixed(2)}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="flex-1 py-2 px-2 rounded-lg text-white font-semibold transition-all hover:opacity-90 text-sm flex items-center justify-center" style={{ backgroundColor: currentTheme.primary }}><ShoppingCart className="w-4 h-4 mr-2" />Sepete Ekle</button>
            <button onClick={(e) => { e.stopPropagation(); buyNow(product); }} className="flex-1 py-2 px-2 rounded-lg font-semibold border-2 transition-all hover:bg-gray-100 text-sm flex items-center justify-center" style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}><Zap className="w-4 h-4 mr-2" />Hemen Al</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}