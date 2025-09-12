import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Search,
  MoreVertical,
  Save,
  X,
  Star,
  ShoppingCart,
  Upload,
  Image as ImageIcon,
  Loader
} from 'lucide-react';

// Firebase imports
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, uploadMultipleFiles } from '../../firebase';

// Multi-Photo Upload Component
const MultiPhotoUpload = ({ images, setImages, isUploading, setIsUploading }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Lütfen sadece resim dosyaları seçin.');
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadedUrls = await uploadMultipleFiles(imageFiles, 'products');
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Fotoğraflar yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="text-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-600">Fotoğraflar yükleniyor...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Fotoğrafları sürükleyin veya <span className="text-blue-600 font-medium">tıklayın</span>
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP - Maksimum 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100x100?text=Error';
                }}
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                  Ana
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// Product form component with multi-photo support
const ProductForm = ({ product, onSave, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    ageGroup: '',
    price: '',
    originalPrice: '',
    description: '',
    tags: '',
    shopierLink: '',
    badge: '',
    rating: 4.5,
    reviews: 0,
    ...(product || {}),
    tags: product?.tags ? (Array.isArray(product.tags) ? product.tags.join(', ') : product.tags) : ''
  });

  const [images, setImages] = useState(product?.images || [product?.image].filter(Boolean) || []);
  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = ['deney', 'eğitici', 'oyuncak', 'dekoratif'];
  const ageGroups = ['3-6', '7-12', '13+'];
  const badges = ['', 'Yeni', 'Çok Satan', 'Trend', 'Popüler', 'Özel Seri'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.length === 0) {
      alert('En az bir fotoğraf yüklemelisiniz.');
      return;
    }
    
    setSaving(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        tags: typeof formData.tags === 'string' && formData.tags.trim()
          ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [],
        // Multi-photo support
        images: images,
        image: images[0], // Main image for backward compatibility
        updatedAt: new Date()
      };

      if (!isEditing) {
        productData.createdAt = new Date();
      }

      await onSave(productData);
    } catch (error) {
      console.error('Product save error:', error);
      alert('Ürün kaydedilirken hata oluştu!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Multi-Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Fotoğrafları *
            </label>
            <MultiPhotoUpload 
              images={images} 
              setImages={setImages}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Adı *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ürün adını giriniz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Kategori Seçin</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yaş Grubu *
              </label>
              <select
                required
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Yaş Grubu Seçin</option>
                {ageGroups.map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiyat (₺) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="199.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eski Fiyat (₺)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.originalPrice || ''}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="299.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Badge
              </label>
              <select
                value={formData.badge || ''}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {badges.map(badge => (
                  <option key={badge} value={badge}>{badge || 'Badge Yok'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ürün açıklamasını giriniz"
            />
          </div>

          {/* Tags & Meta Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiketler (virgülle ayırın)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="fizik, kimya, deney"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yorum Sayısı
              </label>
              <input
                type="number"
                min="0"
                value={formData.reviews}
                onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Shopier Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shopier Link
            </label>
            <input
              type="text"
              value={formData.shopierLink || ''}
              onChange={(e) => setFormData({ ...formData, shopierLink: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#SHOPIER_LINK_HERE"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving || isUploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Güncelle' : 'Kaydet'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Product table row component - Enhanced for multi-photo display
const ProductRow = ({ product, onEdit, onDelete, onView }) => {
  const [showMenu, setShowMenu] = useState(false);

  const images = product.images || [product.image].filter(Boolean);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="relative">
            <img
              src={images[0] || product.image}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-lg mr-4"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
              }}
            />
            {images.length > 1 && (
              <div className="absolute -top-1 -right-3 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {images.length}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500">ID: {product.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {product.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.ageGroup}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
          {product.originalPrice && (
            <span className="text-gray-400 line-through mr-2">
              ₺{product.originalPrice.toFixed(2)}
            </span>
          )}
          <span className="font-semibold">₺{product.price.toFixed(2)}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
          {product.rating} ({product.reviews})
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {product.badge && (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            {product.badge}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={() => {
                  onView(product);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="w-4 h-4 mr-2" />
                Görüntüle
              </button>
              <button
                onClick={() => {
                  onEdit(product);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Düzenle
              </button>
              <button
                onClick={() => {
                  onDelete(product);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sil
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

// Main AdminProducts component - Same as before but using enhanced ProductForm
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {}
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsCollection = collection(db, 'products');
      const q = query(productsCollection, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const productsData = [];
      const categoryStats = {};
      
      querySnapshot.forEach((doc) => {
        const productData = { id: doc.id, ...doc.data() };
        productsData.push(productData);
        
        const category = productData.category;
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      setProducts(productsData);
      setStats({
        total: productsData.length,
        byCategory: categoryStats
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Ürünler yüklenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      await addDoc(collection(db, 'products'), productData);
      setShowForm(false);
      fetchProducts();
      alert('Ürün başarıyla eklendi!');
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, productData);
      setEditingProduct(null);
      setShowForm(false);
      fetchProducts();
      alert('Ürün başarıyla güncellendi!');
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`"${product.name}" ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteDoc(doc(db, 'products', product.id));
        fetchProducts();
        alert('Ürün başarıyla silindi!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ürün silinirken hata oluştu!');
      }
    }
  };

  const handleViewProduct = (product) => {
    window.open(`/product/${product.id}`, '_blank');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ürün Yönetimi</h1>
            <p className="text-gray-600 mt-2">
              Toplam {stats.total} ürün • {filteredProducts.length} ürün görüntüleniyor
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Yeni Ürün Ekle
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {Object.entries(stats.byCategory).map(([category, count]) => (
            <div key={category} className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{category}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tüm Kategoriler</option>
                <option value="deney">Deney</option>
                <option value="eğitici">Eğitici</option>
                <option value="oyuncak">Oyuncak</option>
                <option value="dekoratif">Dekoratif</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ürün Bulunamadı</h3>
              <p className="text-gray-600">Arama kriterlerinize uygun ürün bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yaş Grubu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Badge
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onEdit={(product) => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                      onDelete={handleDeleteProduct}
                      onView={handleViewProduct}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Product Form Modal */}
        <AnimatePresence>
          {showForm && (
            <ProductForm
              product={editingProduct}
              onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
              onCancel={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
              isEditing={!!editingProduct}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}