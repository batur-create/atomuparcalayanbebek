import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, Package, Home, Settings, BarChart3, Users, UserCircle, Heart, ClipboardList } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

export default function Header({ 
  isScrolled, 
  currentTheme, 
  isMenuOpen, 
  setIsMenuOpen, 
  handleGoToCart,
  searchTerm,
  setSearchTerm,
  onSearchFocus
}) {
  const { cartItems } = useCart();
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const totalItemsInCart = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isAdminPage = location.pathname.startsWith('/admin');

  // Get user initial for profile icon
  const getUserInitial = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName.charAt(0).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => { 
        setProfileDropdownOpen(false);
        navigate('/'); 
      })
      .catch((error) => { console.error("Çıkış yaparken hata oluştu:", error); });
  };

  // Navigate to products section with smooth scroll
  const goHomeProducts = () => {
    if (location.pathname === '/') {
      const searchElement = document.getElementById('product-search');
      if (searchElement) {
        searchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => searchElement.focus(), 300);
      } else {
        const productsElement = document.getElementById('products');
        if (productsElement) productsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const searchElement = document.getElementById('product-search');
        if (searchElement) {
          searchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => searchElement.focus(), 300);
        }
      }, 100);
    }
    if (setIsMenuOpen) setIsMenuOpen(false);
  };

  // Scroll direction detection
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      if (direction !== scrollDirection && (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)) {
        setScrollDirection(direction);
      }
      setLastScrollY(scrollY > 0 ? scrollY : 0);
    };
    window.addEventListener('scroll', updateScrollDirection);
    return () => window.removeEventListener('scroll', updateScrollDirection);
  }, [scrollDirection, lastScrollY]);

  // Profile dropdown menu items
  const profileMenuItems = [
    { icon: UserCircle, label: 'Profilim', href: '/profile' },
    { icon: ClipboardList, label: 'Siparişlerim', href: '/orders' },
    { icon: Heart, label: 'Favorilerim', href: '/favorites' },
    { icon: Settings, label: 'Hesap Ayarları', href: '/profile/settings' }
  ];

  return (
    <>
      {/* Main Header */}
      <motion.header 
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-500
          ${isScrolled 
            ? 'bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/50' 
            : 'bg-white/90 backdrop-blur-lg'
          }
          ${scrollDirection === 'down' && !isMenuOpen && isScrolled ? '-translate-y-full' : 'translate-y-0'}
        `}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-20 px-6">
            
            {/* Logo Section */}
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Link to="/" className="flex items-center group">
                {/* Your Custom Logo */}
                <div className="relative mr-4">
                  <motion.div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src="/logo.png" 
                      alt="Prizma Science" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback if logo.png not found
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span class="text-white font-bold text-xl bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center rounded-xl">P</span>';
                      }}
                    />
                  </motion.div>
                </div>
                
                {/* Brand Text */}
                <div className="flex flex-col">
                  <motion.span 
                    className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.05 }}
                  >
                    PRIZMA SCIENCE
                  </motion.span>
                  <span className="text-xs text-gray-500 font-medium tracking-wide">
                    {isAdminPage ? 'Admin Panel' : 'Bilimi Keşfet'}
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Center Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {isAdminPage ? (
                /* Admin Navigation */
                <nav className="flex items-center space-x-6">
                  <Link 
                    to="/admin" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                      location.pathname === '/admin' 
                        ? 'bg-blue-100 text-blue-700 shadow-md' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <BarChart3 size={18} />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link 
                    to="/admin/products" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                      location.pathname === '/admin/products' 
                        ? 'bg-green-100 text-green-700 shadow-md' 
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Package size={18} />
                    <span>Ürünler</span>
                  </Link>
                  
                  <Link 
                    to="/admin/orders" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                      location.pathname === '/admin/orders' 
                        ? 'bg-orange-100 text-orange-700 shadow-md' 
                        : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <ShoppingCart size={18} />
                    <span>Siparişler</span>
                  </Link>
                  
                  <Link 
                    to="/admin/users" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                      location.pathname === '/admin/users' 
                        ? 'bg-purple-100 text-purple-700 shadow-md' 
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Users size={18} />
                    <span>Kullanıcılar</span>
                  </Link>
                </nav>
              ) : (
                /* Regular Navigation - Separated Functions */
                <nav className="flex items-center space-x-8">
                  {/* Products Link - Goes to Product Section */}
                  <motion.button 
                    onClick={goHomeProducts}
                    className="text-gray-600 hover:text-blue-600 font-medium transition-all duration-300 relative group"
                    whileHover={{ scale: 1.05 }}
                  >
                    Ürünler
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
                  </motion.button>
                  
                  {/* About Link */}
                  <motion.a 
                    href="#about"
                    className="text-gray-600 hover:text-purple-600 font-medium transition-all duration-300 relative group"
                    whileHover={{ scale: 1.05 }}
                  >
                    Hakkımızda
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300" />
                  </motion.a>
                  
                  {/* Contact Link */}
                  <motion.a 
                    href="#contact"
                    className="text-gray-600 hover:text-green-600 font-medium transition-all duration-300 relative group"
                    whileHover={{ scale: 1.05 }}
                  >
                    İletişim
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300" />
                  </motion.a>
                </nav>
              )}
            </div>

            {/* Right Section - User & Actions */}
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  {/* Cart (only for regular pages) */}
                  {!isAdminPage && (
                    <motion.button 
                      onClick={handleGoToCart}
                      className="relative p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ShoppingCart size={20} />
                      {totalItemsInCart > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                        >
                          {totalItemsInCart}
                        </motion.span>
                      )}
                    </motion.button>
                  )}

                  {/* User Profile Section */}
                  <div className="flex items-center space-x-2">
                    {/* Admin Panel Link (only for non-admin pages) */}
                    {isAdmin && !isAdminPage && (
                      <Link 
                        to="/admin"
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all duration-300 font-medium"
                      >
                        <Settings size={16} />
                        <span className="hidden md:block">Admin</span>
                      </Link>
                    )}
                    
                    {/* Home Link (only for admin pages) */}
                    {isAdminPage && (
                      <Link 
                        to="/"
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-300 font-medium"
                      >
                        <Home size={16} />
                        <span className="hidden md:block">Ana Sayfa</span>
                      </Link>
                    )}
                    
                    {/* Profile Icon with Dropdown */}
                    <div className="relative">
                      <motion.button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Profile Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {getUserInitial()}
                        </div>
                        
                        {/* User Info (hidden on mobile) */}
                        <div className="hidden lg:flex flex-col items-start">
                          <span className="text-sm font-medium text-gray-800">
                            {currentUser.displayName || 'Kullanıcı'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {currentUser.email}
                          </span>
                        </div>
                      </motion.button>

                      {/* Profile Dropdown Menu */}
                      <AnimatePresence>
                        {profileDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                          >
                            {/* Profile Header */}
                            <div className="px-4 py-3 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-800">
                                {currentUser.displayName || 'Kullanıcı'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {currentUser.email}
                              </p>
                            </div>

                            {/* Profile Menu Items */}
                            <div className="py-2">
                              {profileMenuItems.map((item) => (
                                <Link
                                  key={item.href}
                                  to={item.href}
                                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  onClick={() => setProfileDropdownOpen(false)}
                                >
                                  <item.icon size={16} />
                                  <span>{item.label}</span>
                                </Link>
                              ))}
                              
                              {/* Logout */}
                              <button
                                onClick={handleLogout}
                                className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                              >
                                <LogOut size={16} />
                                <span>Çıkış Yap</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ) : (
                /* Not Logged In */
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/login"
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    <User size={18} />
                    <span>Giriş Yap</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                className="lg:hidden p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileTap={{ scale: 0.95 }}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50"
            >
              <div className="container mx-auto px-6 py-6">
                {isAdminPage ? (
                  /* Admin Mobile Menu */
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Panel</h3>
                    
                    <Link 
                      to="/admin" 
                      className="flex items-center space-x-3 p-4 bg-blue-50 text-blue-700 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BarChart3 size={20} />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    
                    <Link 
                      to="/admin/products" 
                      className="flex items-center space-x-3 p-4 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Package size={20} />
                      <span className="font-medium">Ürünler</span>
                    </Link>
                    
                    <Link 
                      to="/admin/orders" 
                      className="flex items-center space-x-3 p-4 hover:bg-orange-50 text-gray-700 hover:text-orange-700 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingCart size={20} />
                      <span className="font-medium">Siparişler</span>
                    </Link>
                    
                    <Link 
                      to="/" 
                      className="flex items-center space-x-3 p-4 bg-blue-50 text-blue-700 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home size={20} />
                      <span className="font-medium">Ana Sayfa</span>
                    </Link>
                  </div>
                ) : (
                  /* Regular Mobile Menu */
                  <div className="space-y-4">
                    <button 
                      onClick={() => { goHomeProducts(); setIsMenuOpen(false); }}
                      className="flex items-center space-x-3 p-4 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl transition-colors w-full text-left"
                    >
                      <Package size={20} />
                      <span className="font-medium">Ürünler</span>
                    </button>
                    
                    <a 
                      href="#about"
                      className="flex items-center space-x-3 p-4 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home size={20} />
                      <span className="font-medium">Hakkımızda</span>
                    </a>

                    {currentUser ? (
                      <>
                        {/* Profile Link for Mobile */}
                        <Link 
                          to="/profile" 
                          className="flex items-center space-x-3 p-4 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <UserCircle size={20} />
                          <span className="font-medium">Profilim</span>
                        </Link>

                        <Link 
                          to="/orders" 
                          className="flex items-center space-x-3 p-4 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-xl transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Package size={20} />
                          <span className="font-medium">Siparişlerim</span>
                        </Link>
                        
                        {isAdmin && (
                          <Link 
                            to="/admin" 
                            className="flex items-center space-x-3 p-4 bg-purple-50 text-purple-700 rounded-xl transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Settings size={20} />
                            <span className="font-medium">Admin Panel</span>
                          </Link>
                        )}
                        
                        <button 
                          onClick={() => { handleGoToCart(); setIsMenuOpen(false); }}
                          className="flex items-center space-x-3 p-4 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors w-full text-left"
                        >
                          <ShoppingCart size={20} />
                          <span className="font-medium">
                            Sepetim {totalItemsInCart > 0 && `(${totalItemsInCart})`}
                          </span>
                        </button>
                        
                        <button 
                          onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                          className="flex items-center space-x-3 p-4 bg-red-50 text-red-700 rounded-xl transition-colors w-full text-left"
                        >
                          <LogOut size={20} />
                          <span className="font-medium">Çıkış</span>
                        </button>
                      </>
                    ) : (
                      <Link 
                        to="/login" 
                        className="flex items-center space-x-3 p-4 bg-blue-50 text-blue-700 rounded-xl transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User size={20} />
                        <span className="font-medium">Giriş Yap</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Header spacing handled by components individually */}
    </>
  );
}