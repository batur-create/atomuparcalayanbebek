import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Breadcrumbs({ products }) {
  const location = useLocation();
  const params = useParams();
  
  // Don't show breadcrumbs on home page or admin pages
  if (location.pathname === '/' || location.pathname.startsWith('/admin')) {
    return null;
  }

  // Build breadcrumb items based on current route
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { name: 'Ana Sayfa', path: '/', icon: Home }
    ];

    // Route-specific breadcrumb logic
    if (pathSegments[0] === 'product' && pathSegments[1]) {
      // Product detail page
      breadcrumbs.push({ name: 'Ürünler', path: '/#products' });
      
      // Find actual product name
      const productId = pathSegments[1];
      const product = Array.isArray(products) 
        ? products.find(p => p.id?.toString() === productId) 
        : null;
      
      breadcrumbs.push({ 
        name: product ? product.name : 'Ürün Detayı', 
        path: `/product/${productId}`,
        isActive: true 
      });
    } else if (pathSegments[0] === 'cart') {
      breadcrumbs.push({ name: 'Sepetim', path: '/cart', isActive: true });
    } else if (pathSegments[0] === 'orders') {
      breadcrumbs.push({ name: 'Siparişlerim', path: '/orders', isActive: true });
    } else if (pathSegments[0] === 'profile') {
      breadcrumbs.push({ name: 'Hesabım', path: '/profile', isActive: true });
    } else if (pathSegments[0] === 'login') {
      breadcrumbs.push({ name: 'Giriş Yap', path: '/login', isActive: true });
    } else if (pathSegments[0] === 'register') {
      breadcrumbs.push({ name: 'Kayıt Ol', path: '/register', isActive: true });
    } else if (pathSegments[0] === 'privacy-policy') {
      breadcrumbs.push({ name: 'Gizlilik Politikası', path: '/privacy-policy', isActive: true });
    } else if (pathSegments[0] === 'terms-of-service') {
      breadcrumbs.push({ name: 'Kullanım Koşulları', path: '/terms-of-service', isActive: true });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // If only home page, don't show breadcrumbs
  if (breadcrumbs.length <= 1) {
    return null;
  }

  const handleNavigate = (path) => {
    if (path.includes('#')) {
      // Handle anchor links (like #products)
      const [route, anchor] = path.split('#');
      if (route === '/') {
        window.location.href = '/';
        setTimeout(() => {
          const element = document.getElementById(anchor);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    } else {
      // Regular navigation
      window.location.href = path;
    }
  };

  return (
    <motion.div 
      className="bg-white border-b border-gray-200 shadow-sm"
      style={{ marginTop: '80px' }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <nav aria-label="Breadcrumb" className="container mx-auto">
        <ol className="flex items-center gap-1 px-6 py-3 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.path}>
              {index > 0 && (
                <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400 mx-1" />
              )}
              
              <li className="flex items-center">
                {breadcrumb.isActive ? (
                  // Active/current page - not clickable
                  <motion.span 
                    className="flex items-center gap-1 px-3 py-1 font-semibold text-blue-600 bg-blue-50 rounded-lg"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
                    <span className="truncate max-w-[200px]">{breadcrumb.name}</span>
                  </motion.span>
                ) : (
                  // Clickable breadcrumb
                  <motion.button
                    onClick={() => handleNavigate(breadcrumb.path)}
                    className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
                    <span className="truncate max-w-[200px]">{breadcrumb.name}</span>
                  </motion.button>
                )}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>
    </motion.div>
  );
}