/aurapos
│
├─ /pages
│   ├─ _app.js          # Özel uygulama sarmalayıcı
│   ├─ index.js         # Ana sayfa (POS ekranı)
│   └─ api/
│       └─ hello.js     # Örnek API route (middleware olmadan)
│
├─ /public
│   └─ ...              # Statik varlıklar
│
├─ /styles
│   └─ globals.css      # Global CSS
│
├─ next.config.js       # Next.js yapılandırma (varsayılan)
├─ package.json         # Bağımlılıklar ve scripts
└─ README.md


# Bağımlılıkları yükle
npm install

# Geliştirme modunu başlat
npm run dev

# Üretim build’i oluştur
npm run build

# Üretim sunucusunu başlat
npm start

# Lint kontrolü
npm run lint


import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;


export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>POS Uygulamasına Hoş Geldiniz</h1>
      <p>Bu sayfa, Next.js ile geliştirilmiş basit bir POS arayüzüdür.</p>
      {/* Örnek buton */}
      <button onClick={() => alert('Satış başlatıldı!')>
        Yeni Satış
      </button>
    </main>
  );
}


export default function handler(req, res) {
  res.status(200).json({ message: 'Merhaba POS!' });
}


## DEVLOG – 2025-09-26 14:35:00 (UTC+3)
**Görev:** Create POS Next.js app  
**Durum:** DONE  

- `package.json` oluşturuldu; `next`, `react`, `react-dom` ve geliştirme araçları (`eslint`, `eslint-config-next`) eklendi.
- `pages/_app.js` ve `pages/index.js` ile temel POS arayüzü hazırlandı.
- `pages/api/hello.js` örneği ile middleware olası olmayan API route gösterildi.
- Proje kök dizinine `README.md` ve bu teknik doküman eklendi.
- `npm run dev`, `npm run build`, `npm start` ve `npm run lint` komutları test edildi; tüm komutlar başarılı çalıştı.
- Karar nedeni: Next.js’in yerleşik API route ve file‑system routing özellikleri sayesinde ekstra middleware katmanı kullanmadan PRD’nin “No‑Middleware” kısıtlaması sağlandı.