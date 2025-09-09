import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// 1. Context'i oluşturuyoruz
const AuthContext = createContext();

// 2. Diğer bileşenlerin bu context'i kolayca kullanması için bir hook oluşturuyoruz
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Tüm uygulamayı saracak ve kullanıcı bilgilerini sağlayacak olan Provider'ı oluşturuyoruz
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Sayfa ilk yüklendiğinde Firebase'i dinlemek için

  useEffect(() => {
    const auth = getAuth();
    // onAuthStateChanged, Firebase'in sihirli fonksiyonudur.
    // Kullanıcı giriş yaptığında, çıkış yaptığında veya sayfa yenilendiğinde otomatik olarak tetiklenir.
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Component kaldırıldığında listener'ı temizle
    return unsubscribe;
  }, []);

  const value = {
    currentUser
  };

  // loading false olana kadar uygulamayı göstermeyerek,
  // kullanıcının anlık olarak giriş/çıkış yaptığını görmesini engelleriz.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}