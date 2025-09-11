// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import fallbackProducts from '../data/products.json';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const productsCollection = collection(db, "products");
        const productSnapshot = await getDocs(productsCollection);
        const productList = productSnapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id 
        }));
        
        if (productList.length > 0) {
          setProducts(productList);
        } else {
          setProducts(fallbackProducts);
        }
      } catch (error) {
        console.error("Firebase veri çekme hatası:", error);
        setProducts(fallbackProducts);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, isLoading, error };
};