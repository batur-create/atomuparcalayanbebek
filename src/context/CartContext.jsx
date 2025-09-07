import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Context'i ("Anons Kanalını") Oluştur
export const CartContext = createContext();

// 2. Provider'ı ("Anonsu Yapan") Oluştur
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  // Sepete ürün ekleme fonksiyonu
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        // Ürün zaten varsa, miktarını 1 artır
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Ürün yoksa, sepete yeni ürün olarak ekle
      return [...prevItems, { ...product, quantity: 1 }];
    });
    alert(`${product.name} sepete eklendi!`);
  };

  // "Hemen Al" fonksiyonu
  const buyNow = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (!existingItem) {
      // Ürün sepette yoksa ekle
      setCartItems(prev => [...prev, { ...product, quantity: 1 }]);
    }
    // Her durumda sepet sayfasına yönlendir
    navigate('/cart');
  };

  // Ürün miktarını güncelleme fonksiyonu
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return; // Miktar 1'den küçük olamaz
    setCartItems(prevItems =>
      prevItems.map(item => (item.id === id ? { ...item, quantity: newQuantity } : item))
    );
  };

  // Sepetten ürün silme fonksiyonu
  const removeItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // Sepeti tamamen temizleme fonksiyonu
  const clearCart = () => {
    setCartItems([]);
  };

  // Dışarıya anons edilecek tüm değerler (state'ler ve fonksiyonlar)
  const value = {
    cartItems,
    addToCart,
    buyNow,
    updateQuantity,
    removeItem,
    clearCart,
  };

  // Provider, sarmaladığı tüm component'lere bu "value" değerini sağlar
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// 3. Custom Hook ("Anonsu Dinleyen")
// Bu, herhangi bir component'in context'e kolayca erişmesini sağlar
export const useCart = () => {
  return useContext(CartContext);
};