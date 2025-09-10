import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useBreadcrumbs from 'use-react-router-breadcrumbs';
import { ChevronRight } from 'lucide-react';

const ProductNameBreadcrumb = ({ match, products }) => {
  const product = Array.isArray(products) 
    ? products.find(p => p.id?.toString() === match.params.productId) 
    : null;
  return <span>{product ? product.name : 'Ürün Detayı'}</span>;
};

const staticRoutes = [
  { path: '/product', breadcrumb: 'Ürünler' }, 
  { path: '/cart', breadcrumb: 'Sepetim' },
  { path: '/orders', breadcrumb: 'Siparişlerim' },
  { path: '/login', breadcrumb: 'Giriş Yap' },
  { path: '/register', breadcrumb: 'Kayıt Ol' },
  { path: '/privacy-policy', breadcrumb: 'Gizlilik Politikası' },
  { path: '/terms-of-service', breadcrumb: 'Kullanım Koşulları' },
];

export default function Breadcrumbs({ products }) {
  const dynamicRoutes = [
    { path: '/product/:productId', breadcrumb: ProductNameBreadcrumb },
  ];
  
  const routes = [...staticRoutes, ...dynamicRoutes];
  
  const breadcrumbs = useBreadcrumbs(routes);
  const location = useLocation();

  if (location.pathname === '/' || breadcrumbs.length < 2) {
    return null;
  }

  return (
    <div className="bg-gray-100 border-b">
      <nav aria-label="Breadcrumb" className="container mx-auto">
        <ol className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
          {breadcrumbs.map(({ match, breadcrumb }, index) => (
            <React.Fragment key={match.pathname}>
              {index > 0 && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
              <li className="truncate">
                <NavLink
                  to={match.pathname}
                  className={({ isActive }) => 
                    isActive ? "font-semibold text-gray-800" : "hover:text-gray-800 transition-colors"
                  }
                  style={index === breadcrumbs.length - 1 ? { pointerEvents: 'none' } : {}}
                >
                  {breadcrumb}
                </NavLink>
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>
    </div>
  );
}