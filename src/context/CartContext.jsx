import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export const CartContext = createContext();

// Provider'a yeni bir prop ekliyoruz: setNotification
export const CartProvider = ({ children, setNotification }) => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    // App.jsx'ten gelen bildirim gösterme fonksiyonunu burada çağırıyoruz
    if (setNotification) {
      setNotification(product);
    }
  };

  const buyNow = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (!existingItem) {
        setCartItems(prev => [...prev, { ...product, quantity: 1 }]);
    }
    navigate('/cart');
  };
  
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prevItems => prevItems.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };
  
  const removeItem = (id) => setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  
  const clearCart = () => setCartItems([]);

  const value = {
    cartItems,
    addToCart,
    buyNow,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};