import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TermsOfServicePage({ currentTheme }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2" aria-label="Geri dön">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Kullanım Koşulları</h1>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8 prose lg:prose-lg max-w-4xl">
        <h2>Kullanım Koşulları</h2>
        <p>Lütfen sitemizi kullanmadan önce bu kullanım koşullarını dikkatlice okuyunuz. Bu web sitesini kullanarak, aşağıda belirtilen şartları kabul etmiş sayılırsınız.</p>
        
        <h3>1. Hizmetlerin Tanımı</h3>
        <p>Prizma Science, bilim temalı eğitici oyuncak ve deney setleri satışı yapan bir e-ticaret platformudur. Sitemizde sunulan tüm ürünler ve hizmetler, bu koşullar altında sağlanmaktadır.</p>

        <h3>2. Kullanıcı Yükümlülükleri</h3>
        <p>Kullanıcılar, siteye kayıt olurken ve sipariş verirken doğru ve güncel bilgiler vermekle yükümlüdür. Oluşturulan hesapların güvenliğinden kullanıcılar sorumludur.</p>

        <h3>3. Fiyatlandırma ve Ödeme</h3>
        <p>Sitemizdeki tüm ürün fiyatları Türk Lirası (TL) cinsindendir ve KDV dahildir. Ödemeler, Shopier aracılığıyla güvenli bir şekilde alınmaktadır. Prizma Science, fiyatlarda değişiklik yapma hakkını saklı tutar.</p>

        <h3>4. İade ve Değişim</h3>
        <p>Satın alınan ürünler, teslim tarihinden itibaren 14 gün içinde, ambalajı açılmamış ve kullanılmamış olması koşuluyla iade edilebilir. Detaylı bilgi için lütfen Sıkça Sorulan Sorular sayfamızı ziyaret edin.</p>
        
        <h3>5. Fikri Mülkiyet</h3>
        <p>Bu sitede yer alan tüm içerik (logo, metinler, görseller) Prizma Science'a aittir ve izinsiz kullanılamaz.</p>
      </main>
    </div>
  );
}
