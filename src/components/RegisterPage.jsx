import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Firestore veritabanı bağlantısı
import { motion } from 'framer-motion';
import { User, Mail, Lock } from 'lucide-react';

export default function RegisterPage({ currentTheme }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { firstName, lastName, email, password, confirmPassword } = formData;

    // Şifrelerin eşleşip eşleşmediğini kontrol et
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      setLoading(false);
      return;
    }

    try {
      // 1. Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Kullanıcının profilini güncelle (Ad ve Soyad ekle)
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // 3. Kullanıcı bilgilerini Firestore'daki 'users' koleksiyonuna kaydet
      // Bu, gelecekte adres gibi ek bilgileri saklamak için önemlidir.
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: `${firstName} ${lastName}`,
        email: user.email,
        createdAt: serverTimestamp()
      });

      // Kayıt başarılı, anasayfaya yönlendir
      navigate('/');

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanılıyor.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre en az 6 karakter olmalıdır.');
      } else {
        setError('Kayıt başarısız oldu. Lütfen bilgilerinizi kontrol edin.');
      }
      console.error("Kayıt hatası:", err);
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
          <h2 className="text-3xl font-bold" style={{ color: currentTheme.primary }}>
            Hesap Oluştur
          </h2>
          <p className="mt-2 text-gray-600">Prizma Science dünyasına katılın!</p>
        </div>
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" name="firstName" onChange={handleInputChange} placeholder="Ad" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required />
            </div>
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" name="lastName" onChange={handleInputChange} placeholder="Soyad" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required />
            </div>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="email" name="email" onChange={handleInputChange} placeholder="E-posta Adresi" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="password" name="password" onChange={handleInputChange} placeholder="Şifre" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="password" name="confirmPassword" onChange={handleInputChange} placeholder="Şifreyi Onayla" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none" required />
          </div>
          
          {error && <p className="text-sm text-center text-red-500">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: currentTheme.primary }}
          >
            {loading ? 'İşleniyor...' : 'Kayıt Ol'}
          </motion.button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Zaten bir hesabın var mı?{' '}
            <a href="/login" className="font-medium underline" style={{ color: currentTheme.primary }}>
              Giriş Yap
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
