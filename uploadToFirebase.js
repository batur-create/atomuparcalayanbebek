// Bu script, 'products.json' dosyasındaki verileri okur ve Firebase Firestore'daki 'products' koleksiyonuna yükler.
// Mevcut dökümanları günceller, olmayanları oluşturur.

import { db } from './src/firebase.js'; // Projendeki firebase ayar dosyasını import ediyoruz.
import { collection, doc, setDoc } from 'firebase/firestore';
import fs from 'fs'; // Node.js'in dosya okuma modülü

// products.json dosyasının yolunu belirtiyoruz.
const productsFilePath = './src/data/products.json';

async function uploadProducts() {
  try {
    // JSON dosyasını oku ve içeriğini parse et.
    const fileContent = fs.readFileSync(productsFilePath, 'utf8');
    const products = JSON.parse(fileContent);

    if (!Array.isArray(products)) {
      throw new Error('products.json dosyası bir ürün listesi (array) içermiyor.');
    }

    console.log(`📦 ${products.length} adet ürün bulundu. Firebase'e yükleniyor...`);

    // Her bir ürün için Firebase'e yazma işlemi başlat.
    const uploadPromises = products.map(async (product) => {
      // Ürünün ID'sini string'e çevirerek document referansı oluşturuyoruz.
      // Bu sayede JSON'daki ID ile Firebase'deki ID aynı olur.
      const productRef = doc(db, 'products', product.id.toString());
      
      // setDoc ile veriyi yazıyoruz. Bu komut, döküman yoksa oluşturur, varsa üzerine yazar (günceller).
      await setDoc(productRef, product);
      console.log(`  ✅ ID: ${product.id} - ${product.name} yüklendi.`);
    });

    // Tüm yükleme işlemlerinin bitmesini bekle.
    await Promise.all(uploadPromises);

    console.log("\n🚀 Yükleme tamamlandı! Tüm ürünler Firebase Firestore'a başarıyla gönderildi.");

  } catch (error) {
    console.error("\n❌ HATA! Yükleme sırasında bir sorun oluştu:", error.message);
  }
}

// Script'i çalıştır.
uploadProducts();