import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Search, Atom, Microscope, Dna, Rocket, TestTube, Cog, Landmark, Cpu, Eye, Magnet, Leaf, Bug, Wrench } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton'; // Yeni bileşeni import ediyoruz

export default function ProductSection(props) {
  const {
    products, themes, currentTheme, searchTerm, setSearchTerm,
    activeFilters, handleFilterChange, clearFilters, handleProductClick,
    toggleLike, likedProducts,
    isLoading // App.jsx'ten gelen yeni prop
  } = props;

  const filterOptions = {
    category: ['oyuncak', 'deney', 'eğitici', 'dekoratif'],
    ageGroup: ['3-6', '7-12', '13+'],
    tags: ['fizik', 'kimya', 'biyoloji', 'astronomi', 'mühendislik', 'jeoloji', 'elektronik', 'mekanik', 'optik', 'genetik', 'manyetizma', 'zooloji', 'doğa']
  };

  return (
    <section id="products" className="container mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: currentTheme.primary }}>Ürünlerimiz</h2>
        <div className="max-w-xl mx-auto mb-8"><div className="relative"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input id="product-search" type="text" placeholder="Ürünleri veya açıklamalarını ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 transition-all" style={{ focusRingColor: currentTheme.secondary, borderColor: currentTheme.primary + '20' }} /></div></div>
        {/* Filtreleme butonları burada, aynı kalıyor... */}
        <div className="mb-12 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center"><span className="text-sm font-semibold text-gray-600 mr-2 self-center">Kategori:</span>{filterOptions.category.map(cat => (<button key={cat} onClick={() => handleFilterChange('category', cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilters.category.includes(cat) ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{backgroundColor: activeFilters.category.includes(cat) ? currentTheme.primary : undefined}}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>))}</div>
          <div className="flex flex-wrap gap-2 justify-center"><span className="text-sm font-semibold text-gray-600 mr-2 self-center">Yaş:</span>{filterOptions.ageGroup.map(age => (<button key={age} onClick={() => handleFilterChange('ageGroup', age)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilters.ageGroup.includes(age) ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{backgroundColor: activeFilters.ageGroup.includes(age) ? currentTheme.primary : undefined}}>{age} Yaş</button>))}</div>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-sm font-semibold text-gray-600 mr-2 self-center">Etiketler:</span>
            {filterOptions.tags.map(tag => (
              <button key={tag} onClick={() => handleFilterChange('tags', tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeFilters.tags.includes(tag) ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                style={{backgroundColor: activeFilters.tags.includes(tag) ? themes[tag]?.primary || currentTheme.primary : undefined}}>
                {tag === 'fizik' && <Atom className="w-4 h-4" />} {tag === 'kimya' && <TestTube className="w-4 h-4" />} {tag === 'biyoloji' && <Microscope className="w-4 h-4" />} {tag === 'astronomi' && <Rocket className="w-4 h-4" />} {tag === 'mühendislik' && <Wrench className="w-4 h-4" />} {tag === 'jeoloji' && <Landmark className="w-4 h-4" />} {tag === 'elektronik' && <Cpu className="w-4 h-4" />} {tag === 'mekanik' && <Cog className="w-4 h-4" />} {tag === 'optik' && <Eye className="w-4 h-4" />} {tag === 'genetik' && <Dna className="w-4 h-4" />} {tag === 'manyetizma' && <Magnet className="w-4 h-4" />} {tag === 'zooloji' && <Bug className="w-4 h-4" />} {tag === 'doğa' && <Leaf className="w-4 h-4" />}
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))}
          </div>
          {(activeFilters.category.length > 0 || activeFilters.ageGroup.length > 0 || activeFilters.tags.length > 0 || searchTerm) && (<div className="text-center"><button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900 underline">Filtreleri Temizle</button></div>)}
        </div>
      </motion.div>
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* === ANA MANTIK DEĞİŞİKLİĞİ BURADA === */}
        {isLoading ? (
          // Yükleniyorsa, 8 tane iskelet kart göster
          Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)
        ) : (
          // Yüklenme bittiyse, gerçek ürünleri göster
          <AnimatePresence>
            {products.length > 0 ? products.map(product => (<ProductCard key={product.id} product={product} themes={themes} currentTheme={currentTheme} handleProductClick={handleProductClick} toggleLike={toggleLike} likedProducts={likedProducts} />)) : null}
          </AnimatePresence>
        )}
      </motion.div>
      {/* "Ürün bulunamadı" mesajı sadece yükleme bittiğinde ve ürün yoksa gösterilir */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-12 col-span-full">
          <p className="text-gray-500 mb-4">Aradığınız kriterlere uygun ürün bulunamadı.</p>
          <button onClick={clearFilters} className="px-6 py-2 rounded-full text-white font-medium" style={{ backgroundColor: currentTheme.primary }}>Filtreleri Temizle</button>
        </div>
      )}
    </section>
  );
}