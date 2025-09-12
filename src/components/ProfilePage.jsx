import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Package, 
  Heart, 
  Settings, 
  Edit3, 
  Save, 
  X, 
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  CreditCard,
  Shield,
  Truck,
  Star,
  Clock,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { updatePassword, updateProfile } from 'firebase/auth';
import { db } from '../firebase';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    birthDate: '',
    newsletter: true
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: '',
    name: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    phone: '',
    isDefault: false
  });

  // Orders state
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Tab configuration
  const tabs = [
    { id: 'profile', label: 'Profil Bilgileri', icon: User },
    { id: 'addresses', label: 'Adreslerim', icon: MapPin },
    { id: 'orders', label: 'Siparişlerim', icon: Package },
    { id: 'favorites', label: 'Favorilerim', icon: Heart },
    { id: 'settings', label: 'Hesap Ayarları', icon: Settings }
  ];

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    loadOrders();
    loadFavorites();
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Load user profile data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileForm(prev => ({
          ...prev,
          ...userData,
          email: currentUser.email // Always use auth email
        }));
      }

      // Load user addresses
      const addressQuery = query(
        collection(db, 'users', currentUser.uid, 'addresses'),
        orderBy('createdAt', 'desc')
      );
      const addressSnapshot = await getDocs(addressQuery);
      setAddresses(addressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error loading user data:', error);
      showNotification('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!currentUser) return;
    
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      setOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadFavorites = async () => {
    if (!currentUser) return;
    
    try {
      const favoritesQuery = query(
        collection(db, 'users', currentUser.uid, 'favorites'),
        orderBy('createdAt', 'desc')
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      setFavorites(favoritesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleProfileUpdate = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: profileForm.displayName
      });

      // Update Firestore user document
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...profileForm,
        updatedAt: new Date()
      }, { merge: true });

      setIsEditingProfile(false);
      showNotification('Profil bilgileri güncellendi');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Profil güncellenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentUser) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('Şifreler eşleşmiyor', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showNotification('Şifre en az 6 karakter olmalı', 'error');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(currentUser, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showNotification('Şifre başarıyla güncellendi');
    } catch (error) {
      console.error('Error updating password:', error);
      showNotification('Şifre güncellenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const addressesRef = collection(db, 'users', currentUser.uid, 'addresses');
      await setDoc(doc(addressesRef), {
        ...addressForm,
        createdAt: new Date()
      });

      setAddressForm({
        title: '', name: '', address: '', city: '', district: '', 
        postalCode: '', phone: '', isDefault: false
      });
      setIsAddingAddress(false);
      loadUserData();
      showNotification('Adres başarıyla eklendi');
    } catch (error) {
      console.error('Error adding address:', error);
      showNotification('Adres eklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId) => {
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid, 'addresses', addressId), {
        deleted: true
      });
      loadUserData();
      showNotification('Adres silindi');
    } catch (error) {
      console.error('Error deleting address:', error);
      showNotification('Adres silinirken hata oluştu', 'error');
    }
  };

  const renderProfileTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-2xl text-white">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
            {profileForm.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profileForm.displayName || 'Kullanıcı'}</h2>
            <p className="text-blue-100">{profileForm.email}</p>
            <p className="text-sm text-blue-200">Üyelik: {new Date(currentUser?.metadata?.creationTime).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Kişisel Bilgiler</h3>
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {isEditingProfile ? <X size={16} /> : <Edit3 size={16} />}
            <span>{isEditingProfile ? 'İptal' : 'Düzenle'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
            <input
              type="text"
              value={profileForm.displayName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
              disabled={!isEditingProfile}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
            <input
              type="email"
              value={profileForm.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditingProfile}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Doğum Tarihi</label>
            <input
              type="date"
              value={profileForm.birthDate}
              onChange={(e) => setProfileForm(prev => ({ ...prev, birthDate: e.target.value }))}
              disabled={!isEditingProfile}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>

        {isEditingProfile && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleProfileUpdate}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>Kaydet</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderAddressesTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Kayıtlı Adreslerim</h3>
        <button
          onClick={() => setIsAddingAddress(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
        >
          <Plus size={16} />
          <span>Yeni Adres</span>
        </button>
      </div>

      {/* Add Address Form */}
      <AnimatePresence>
        {isAddingAddress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-2xl shadow-lg"
          >
            <h4 className="text-lg font-semibold mb-4">Yeni Adres Ekle</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Adres başlığı (Ev, İş vb.)"
                value={addressForm.title}
                onChange={(e) => setAddressForm(prev => ({ ...prev, title: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Ad Soyad"
                value={addressForm.name}
                onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Şehir"
                value={addressForm.city}
                onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="İlçe"
                value={addressForm.district}
                onChange={(e) => setAddressForm(prev => ({ ...prev, district: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Posta Kodu"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm(prev => ({ ...prev, postalCode: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={addressForm.phone}
                onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              placeholder="Detaylı adres"
              value={addressForm.address}
              onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setIsAddingAddress(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddAddress}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.filter(addr => !addr.deleted).map((address) => (
          <div key={address.id} className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-gray-800">{address.title}</h4>
              <button
                onClick={() => deleteAddress(address.id)}
                className="text-red-500 hover:bg-red-50 p-1 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-gray-600 mb-2">{address.name}</p>
            <p className="text-sm text-gray-500 mb-2">{address.address}</p>
            <p className="text-sm text-gray-500">{address.district}, {address.city} {address.postalCode}</p>
            <p className="text-sm text-gray-500">{address.phone}</p>
          </div>
        ))}
      </div>

      {addresses.filter(addr => !addr.deleted).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
          <p>Henüz kayıtlı adresiniz bulunmamaktadır.</p>
        </div>
      )}
    </motion.div>
  );

  const renderOrdersTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold text-gray-800">Sipariş Geçmişim</h3>
      
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">Sipariş #{order.id?.slice(-8)}</h4>
                  <p className="text-sm text-gray-500">{order.createdAt?.toDate?.()?.toLocaleDateString('tr-TR')}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {order.status || 'Hazırlanıyor'}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-lg font-semibold text-gray-800">₺{order.total}</p>
                <p className="text-sm text-gray-500">{order.items?.length || 0} ürün</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>Henüz siparişiniz bulunmamaktadır.</p>
        </div>
      )}
    </motion.div>
  );

  const renderSettingsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Password Change */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Şifre Değiştir</h3>
        <div className="space-y-4">
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Mevcut şifre"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12"
            />
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <input
            type={showPasswords ? 'text' : 'password'}
            placeholder="Yeni şifre"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type={showPasswords ? 'text' : 'password'}
            placeholder="Yeni şifre tekrar"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handlePasswordUpdate}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Şifreyi Güncelle
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Bildirim Ayarları</h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={profileForm.newsletter}
              onChange={(e) => setProfileForm(prev => ({ ...prev, newsletter: e.target.checked }))}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">E-posta bildirimleri al</span>
          </label>
        </div>
      </div>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'addresses': return renderAddressesTab();
      case 'orders': return renderOrdersTab();
      case 'favorites': return (
        <div className="text-center py-12 text-gray-500">
          <Heart size={48} className="mx-auto mb-4 opacity-50" />
          <p>Favori ürünleriniz burada görünecektir.</p>
        </div>
      );
      case 'settings': return renderSettingsTab();
      default: return renderProfileTab();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Profil sayfasına erişmek için giriş yapınız.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: '80px' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Hesabım</h1>
          <p className="text-gray-600">Hesap bilgilerinizi yönetin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon size={20} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
              notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}