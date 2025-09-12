import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

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
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  // Enhanced error messages mapping
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/user-not-found': 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.',
      'auth/wrong-password': 'Girdiğiniz şifre hatalı.',
      'auth/invalid-credential': 'E-posta veya şifre hatalı.',
      'auth/invalid-email': 'Geçersiz e-posta adresi formatı.',
      'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
      'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.',
      'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin.',
      'auth/weak-password': 'Şifreniz çok zayıf. En az 6 karakter olmalı.',
      'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda.',
      'auth/operation-not-allowed': 'Bu işlem şu anda izin verilmiyor.',
      'auth/invalid-verification-code': 'Geçersiz doğrulama kodu.',
      'auth/popup-closed-by-user': 'Google ile giriş penceresi kapatıldı.',
      'auth/popup-blocked': 'Popup penceresi engellendi. Lütfen tarayıcı ayarlarınızı kontrol edin.',
      'auth/cancelled-popup-request': 'Google ile giriş iptal edildi.',
      'auth/internal-error': 'İç sistem hatası. Lütfen tekrar deneyin.',
      'auth/missing-email': 'E-posta adresi gereklidir.',
      'auth/missing-password': 'Şifre gereklidir.'
    };
    
    return errorMessages[errorCode] || 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }
    
    if (!password.trim()) {
      setError('Lütfen şifrenizi girin.');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(getErrorMessage(err.code));
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

      // Eğer kullanıcı Firestore'da yoksa, onu veritabanımıza kaydedelim.
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          createdAt: serverTimestamp()
        });
      }
      
      navigate('/');
    } catch (error) {
      console.error("Google giriş hatası:", error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    setResetLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(getErrorMessage(err.code));
    } finally {
      setResetLoading(false);
    }
  };

  const resetPasswordResetState = () => {
    setShowPasswordReset(false);
    setResetSuccess(false);
    setResetEmail('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 space-y-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20"
      >
        <AnimatePresence mode="wait">
          {showPasswordReset ? (
            /* Password Reset Form */
            <motion.div
              key="password-reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {resetSuccess ? (
                /* Success State */
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">E-posta Gönderildi</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Şifre sıfırlama bağlantısı <strong>{resetEmail}</strong> adresine gönderildi.
                    E-posta kutunuzu kontrol edin.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetPasswordResetState}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Giriş Sayfasına Dön
                  </motion.button>
                </div>
              ) : (
                /* Reset Form */
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-blue-600">Şifremi Unuttum</h2>
                    <p className="mt-2 text-gray-600">E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.</p>
                  </div>
                  
                  <form className="space-y-4" onSubmit={handlePasswordReset}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="email" 
                        value={resetEmail} 
                        onChange={(e) => setResetEmail(e.target.value)} 
                        placeholder="E-posta Adresi" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                        required 
                      />
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }} 
                      type="submit" 
                      disabled={resetLoading} 
                      className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                    >
                      <Mail className="w-5 h-5" />
                      {resetLoading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
                    </motion.button>
                  </form>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetPasswordResetState}
                    className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Geri Dön
                  </motion.button>
                </div>
              )}
            </motion.div>
          ) : (
            /* Login Form */
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-600">Giriş Yap</h2>
                <p className="mt-2 text-gray-600">Tekrar hoş geldin!</p>
              </div>
              
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="E-posta Adresi" 
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                    required 
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Şifre" 
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Şifremi unuttum
                  </button>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-5 h-5" />
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </motion.button>
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
                className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                Google ile Giriş Yap
              </motion.button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Hesabın yok mu?{' '}
                  <a href="/register" className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    Kayıt Ol
                  </a>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-800 mb-1">Hata</h4>
                <p className="text-sm text-red-700 leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}