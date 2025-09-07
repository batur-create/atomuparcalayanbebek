import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Artık App'i direkt import ediyoruz
import './index.css';

// Gerekli bileşenleri import et
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>  {/* 1. Yönlendirici EN DIŞARIDA */}
      <CartProvider> {/* 2. Provider ONUN İÇİNDE */}
        <App />      {/* 3. Uygulama EN İÇTE */}
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);