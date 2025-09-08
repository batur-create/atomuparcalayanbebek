import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const CartContext = createContext();

// Tarayıcıdan sepet verisini okumak için bir başlangıç durumu fonksiyonu
const getInitialCart = () => {
  try {
    const savedCart = localStorage.getItem('prizma_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error("Sepet verisi okunurken hata oluştu:", error);
    return [];
  }
};

export const CartProvider = ({ children, setNotification }) => {
  // Başlangıç state'ini localStorage'dan alıyoruz
  const [cartItems, setCartItems] = useState(getInitialCart);
  const navigate = useNavigate();

  // cartItems state'i her değiştiğinde, yeni halini localStorage'a yazıyoruz
  useEffect(() => {
    try {
      localStorage.setItem('prizma_cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Sepet verisi yazılırken hata oluştu:", error);
    }
  }, [cartItems]);

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
    if (setNotification) {
      setNotification(product);
    }
  };

  const buyNow = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (!existingItem) {
        // Eğer ürün sepette yoksa, önce sepete ekleyip sonra yönlendiriyoruz
        setCartItems(prev => [...prev, { ...product, quantity: 1 }]);
    }
    navigate('/cart');
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
        // Adet 1'den küçük olursa ürünü direkt sepetten kaldıralım
        removeItem(id);
        return;
    };
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