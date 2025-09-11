import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Plus,
  Settings,
  Bell,
  Calendar,
  MessageSquare,
  Star,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Firebase imports
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

// Dashboard stats component
const StatCard = ({ title, value, change, changeType, icon: Icon, color, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    className={`bg-white p-6 rounded-2xl shadow-lg border border-gray-100 cursor-pointer`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center mt-2 ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'increase' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span className="text-sm font-medium">{change}%</span>
            <span className="text-xs text-gray-500 ml-1">son ay</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

// Recent activity component
const ActivityItem = ({ title, description, time, type }) => {
  const getActivityIcon = () => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'product': return <Package className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getActivityColor = () => {
    switch (type) {
      case 'order': return 'bg-green-100 text-green-600';
      case 'user': return 'bg-blue-100 text-blue-600';
      case 'product': return 'bg-purple-100 text-purple-600';
      case 'message': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${getActivityColor()}`}>
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
};

// Quick actions component
const QuickAction = ({ title, description, icon: Icon, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="p-4 bg-white rounded-xl shadow-lg border border-gray-100 text-left w-full hover:shadow-xl transition-all"
  >
    <div className={`p-3 rounded-lg ${color} inline-flex mb-3`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </motion.button>
);

export default function AdminDashboard() {
  const { currentUser, userRole, canManageProducts, canManageOrders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    messages: 0,
    reviewsCount: 0,
    subscribersCount: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch products count
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const totalProducts = productsSnapshot.size;

      // Fetch orders count and recent orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const totalOrders = ordersSnapshot.size;
      
      // Calculate revenue and pending orders
      let totalRevenue = 0;
      let pendingOrders = 0;
      const activities = [];

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        if (order.total) totalRevenue += order.total;
        if (order.status === 'pending') pendingOrders++;
        
        // Add to recent activity
        if (activities.length < 5) {
          activities.push({
            id: doc.id,
            title: `Yeni Sipariş #${doc.id.slice(-4)}`,
            description: `${order.total?.toFixed(2) || '0'}₺ - ${order.status || 'pending'}`,
            time: order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bilinmiyor',
            type: 'order'
          });
        }
      });

      // Fetch users count
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Fetch messages count
      const messagesSnapshot = await getDocs(collection(db, 'contact_messages'));
      const messages = messagesSnapshot.size;

      // Fetch reviews count
      const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
      const reviewsCount = reviewsSnapshot.size;

      // Fetch newsletter subscribers count
      const subscribersSnapshot = await getDocs(collection(db, 'newsletter_subscriptions'));
      const subscribersCount = subscribersSnapshot.size;

      setStats({
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        pendingOrders,
        messages,
        reviewsCount,
        subscribersCount
      });

      setRecentActivity(activities);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Navigation handlers
  const navigateToProducts = () => window.location.href = '/admin/products';
  const navigateToOrders = () => window.location.href = '/admin/orders';
  const navigateToUsers = () => window.location.href = '/admin/users';
  const navigateToAnalytics = () => window.location.href = '/admin/analytics';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: '80px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Hoş geldiniz {currentUser?.email} • Role: {userRole}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Toplam Ürün"
            value={stats.totalProducts}
            change={12}
            changeType="increase"
            icon={Package}
            color="bg-blue-500"
            onClick={navigateToProducts}
          />
          <StatCard
            title="Toplam Sipariş"
            value={stats.totalOrders}
            change={8}
            changeType="increase"
            icon={ShoppingCart}
            color="bg-green-500"
            onClick={navigateToOrders}
          />
          <StatCard
            title="Toplam Kullanıcı"
            value={stats.totalUsers}
            change={15}
            changeType="increase"
            icon={Users}
            color="bg-purple-500"
            onClick={navigateToUsers}
          />
          <StatCard
            title="Toplam Gelir"
            value={`${stats.totalRevenue.toFixed(0)}₺`}
            change={22}
            changeType="increase"
            icon={DollarSign}
            color="bg-orange-500"
            onClick={navigateToAnalytics}
          />
        </motion.div>

        {/* Secondary Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Bekleyen Siparişler"
            value={stats.pendingOrders}
            icon={Calendar}
            color="bg-yellow-500"
            onClick={navigateToOrders}
          />
          <StatCard
            title="Mesajlar"
            value={stats.messages}
            icon={MessageSquare}
            color="bg-red-500"
          />
          <StatCard
            title="Değerlendirmeler"
            value={stats.reviewsCount}
            icon={Star}
            color="bg-indigo-500"
          />
          <StatCard
            title="Newsletter Aboneleri"
            value={stats.subscribersCount}
            icon={Bell}
            color="bg-pink-500"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Son Aktiviteler</h2>
              <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                Tümünü Gör <ArrowUpRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-2">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <ActivityItem
                    key={index}
                    title={activity.title}
                    description={activity.description}
                    time={activity.time}
                    type={activity.type}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz aktivite bulunmuyor</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Hızlı İşlemler</h2>
              
              <div className="space-y-4">
                {canManageProducts() && (
                  <QuickAction
                    title="Yeni Ürün Ekle"
                    description="Mağazaya yeni ürün ekleyin"
                    icon={Plus}
                    color="bg-green-500"
                    onClick={() => window.location.href = '/admin/products?action=add'}
                  />
                )}
                
                {canManageOrders() && (
                  <QuickAction
                    title="Siparişleri Görüntüle"
                    description="Bekleyen siparişleri kontrol edin"
                    icon={Eye}
                    color="bg-blue-500"
                    onClick={navigateToOrders}
                  />
                )}
                
                <QuickAction
                  title="Analytics"
                  description="Satış raporlarını inceleyin"
                  icon={BarChart3}
                  color="bg-purple-500"
                  onClick={navigateToAnalytics}
                />
                
                <QuickAction
                  title="Ayarlar"
                  description="Sistem ayarlarını düzenleyin"
                  icon={Settings}
                  color="bg-gray-500"
                  onClick={() => window.location.href = '/admin/settings'}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}