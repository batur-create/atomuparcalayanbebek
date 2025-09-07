import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './App.jsx';
import './index.css';

// Yeni oluşturduğumuz CartProvider'ı import ediyoruz
import { CartProvider } from './context/CartContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <Root />
    </CartProvider>
  </React.StrictMode>
);