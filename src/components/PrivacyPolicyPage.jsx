import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPolicyPage({ currentTheme }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2" aria-label="Geri dön">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Gizlilik Politikası</h1>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8 prose lg:prose-lg max-w-4xl">
        <h2>Gizlilik Politikası</h2>
        <p>Son güncelleme: 09 Eylül 2025</p>
        <p>Prizma Science olarak, kullanıcılarımızın gizliliğine saygı duyuyor ve önem veriyoruz. Bu gizlilik politikası, web sitemizi ziyaret ettiğinizde sizden topladığımız bilgilerin türlerini ve bu bilgileri nasıl kullandığımızı açıklamaktadır.</p>
        
        <h3>Topladığımız Bilgiler</h3>
        <p>Sitemizde bir hesap oluşturduğunuzda veya bir sipariş verdiğinizde, adınız, soyadınız, e-posta adresiniz, teslimat adresiniz ve telefon numaranız gibi kişisel bilgileri toplarız. Bu bilgiler, siparişlerinizi işlemek, göndermek ve sizinle iletişim kurmak için kullanılır.</p>

        <h3>Bilgilerin Kullanımı</h3>
        <p>Topladığımız kişisel bilgiler şu amaçlarla kullanılır:</p>
        <ul>
          <li>Siparişlerinizi almak, işlemek ve teslim etmek.</li>
          <li>Hesabınızı yönetmek ve size müşteri desteği sağlamak.</li>
          <li>İzniniz olması halinde, size yeni ürünler ve kampanyalar hakkında bilgi içeren e-posta bültenleri göndermek.</li>
          <li>Web sitemizin performansını analiz etmek ve kullanıcı deneyimini iyileştirmek.</li>
        </ul>

        <h3>Bilgilerin Paylaşımı</h3>
        <p>Kişisel bilgileriniz, yasal zorunluluklar dışında, sizin izniniz olmadan üçüncü partilerle kesinlikle paylaşılmaz. Sipariş teslimatı için yalnızca gerekli olan bilgiler (isim, adres, telefon) kargo şirketi ile paylaşılır.</p>

        <h3>Çerezler (Cookies)</h3>
        <p>Web sitemiz, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanmaktadır. Çerezler, sepetinizdeki ürünleri hatırlamak gibi temel işlevler için kullanılır. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.</p>
        
        <h3>İletişim</h3>
        <p>Gizlilik politikamız hakkında herhangi bir sorunuz varsa, lütfen <a href="/#contact">iletişim sayfamızdan</a> bize ulaşın.</p>
      </main>
    </div>
  );
}
