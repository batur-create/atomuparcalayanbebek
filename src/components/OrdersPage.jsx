import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Calendar, Hash, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function OrdersPage({ currentTheme }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const userOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(userOrders);
      } catch (error) {
        console.error("Siparişler getirilirken hata oluştu: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser, navigate]);

  if (loading) {
    return <div className="flex-grow flex justify-center items-center"><p>Siparişler yükleniyor...</p></div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Siparişlerim</h1>
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Henüz hiç sipariş vermediniz.</h2>
            <p className="text-gray-600">İlk maceranıza atılmak için ürünlerimizi keşfedin!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex flex-wrap justify-between items-center border-b pb-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-2"><Hash size={14}/> Sipariş ID</p>
                    <p className="font-mono text-sm">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-2"><Calendar size={14}/> Sipariş Tarihi</p>
                    <p className="font-medium">{new Date(order.createdAt?.toDate()).toLocaleDateString('tr-TR')}</p>
                  </div>
                   <div>
                    <p className="text-sm text-gray-500 flex items-center gap-2"><Receipt size={14}/> Toplam Tutar</p>
                    <p className="font-bold text-lg" style={{color: currentTheme.primary}}>₺{order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                
                <h4 className="font-semibold mb-3">Sipariş İçeriği:</h4>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <p>{item.name} <span className="text-gray-500">x {item.quantity}</span></p>
                      <p className="font-medium">₺{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                 <div className="mt-4 pt-4 border-t">
                     <p className="font-semibold flex items-center gap-2"><Package size={16}/> Durum: <span className="font-normal text-blue-600">{order.status}</span></p>
                 </div>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}