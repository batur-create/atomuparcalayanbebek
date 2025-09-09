import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';

// Google ikonu için basit bir SVG bileşeni
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 9.196C34.976 5.822 29.864 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l4.843-4.843A19.937 19.937 0 0 0 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025A20.01 20.01 0 0 0 24 44z"></path>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.245 44 30.027 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
  </svg>
);

export default function LoginPage({ currentTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-posta veya şifre hatalı.');
      } else {
        setError('Giriş başarısız oldu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firestore'da bu kullanıcı var mı diye kontrol et
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      // Eğer kullanıcı Firestore'da yoksa (yani Google ile ilk kez giriş yapıyorsa),
      // onu veritabanımıza kaydedelim.
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          createdAt: serverTimestamp()
        });
      }
      
      navigate('/'); // Başarıyla giriş yapıldı, anasayfaya yönlendir
    } catch (error) {
      setError('Google ile giriş yapılamadı. Lütfen tekrar deneyin.');
      console.error("Google giriş hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: currentTheme.background }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold" style={{ color: currentTheme.primary }}>Giriş Yap</h2>
          <p className="mt-2 text-gray-600">Tekrar hoş geldin!</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta Adresi" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required /></div>
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required /></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full py-3 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: currentTheme.primary }}><LogIn className="w-5 h-5" />Giriş Yap</motion.button>
        </form>

        <div className="flex items-center justify-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">veya</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <GoogleIcon />
          Google ile Giriş Yap
        </motion.button>

        {error && <p className="text-sm text-center text-red-500 pt-2">{error}</p>}
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Hesabın yok mu?{' '}
            <a href="/register" className="font-medium underline" style={{ color: currentTheme.primary }}>Kayıt Ol</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
