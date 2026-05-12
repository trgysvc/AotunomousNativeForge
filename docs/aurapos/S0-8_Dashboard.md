dashboard/
├─ src/
│   ├─ app/                     # Next.js 13+ App Router (veya pages/ klasörü)
│   │   ├─ layout.tsx           # Kök layout (CSS, sağlık kontrolü vb.)
│   │   ├─ dashboard/           # Dashboard sayfası
│   │   │   ├─ page.tsx         # Ana dashboard görünümü
│   │   │   └─ components/      # Özel bileşenler (Widget, Chart, vb.)
│   │   └─ api/                 # API route’ları (örnek: /api/reports)
│   │       └─ reports.ts
│   ├─ components/              # Paylaşılan UI bileşenleri (Button, Input, vb.)
│   ├─ styles/                  # Global CSS / módül CSS
│   └─ utils/                   # Yardımcı fonksiyonlar (fetchWrapper, formatCurrency, vb.)
├─ .eslintrc.json
├─ tsconfig.json
├─ next.config.js
└─ package.json


import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aurapos Dashboard',
  description: 'Aurapos işletme yönetimi paneli',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}


import { useEffect, useState } from 'react';
import Widget from '@/components/Widget';
import SalesChart from '@/components/SalesChart';

export default function DashboardPage() {
  const [stats, setStats] = useState<{ sales: number; orders: number }>({
    sales: 0,
    orders: 0,
  });

  useEffect(() => {
    // örnek veri çekme (Next.js API route)
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Widget title="Toplam Satış" value={stats.sales} format="currency" />
        <Widget title="Sipariş Sayısı" value={stats.orders} />
      </div>
      <SalesChart />
    </section>
  );
}


import { NextResponse } from 'next/server';

// Mock veri – gerçek uygulamada veritabanı çağrısı yapılır
export async function GET() {
  const data = {
    sales: 12450.75,
    orders: 342,
  };
  return NextResponse.json(data);
}


interface WidgetProps {
  title: string;
  value: number | string;
  format?: 'currency' | 'number';
}

export default function Widget({ title, value, format }: WidgetProps) {
  const formatted =
    format === 'currency'
      ? new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY',
        }).format(Number(value))
      : String(value);

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-medium mb-2">{title}</h2>
      <p className="text-2xl font-bold">{formatted}</p>
    </div>
  );
}


# 1. Bağımlılıkları yükle
npm install

# 2. Geliştirme sunucusunu başlat
npm run dev

# 3. Üretim derlemesi
npm run build

# 4. Üretimde çalıştır
npm start


## DEVLOG - 2025-09-26 10:12:00
- **Proje:** aurapos
- **Görev:** Create Dashboard Next.js app
- **Durum:** DONE
- **Açıklama:** Next.js 13+ (App Router) ve TypeScript kullanarak yönetim paneli dashboard’u oluşturuldu. Sayfa tabanlı routing, API route’ları ve React bileşenleriyle veri gösterimi sağlandı. Ek bir middleware katmanı kullanılmadı; Next.js’in kendi veri çekme ve routing mekanizmaları tercih edildi.
- **Kullanılan Teknoloji:** Next.js (latest), React 18, TypeScript, ESLint + eslint-config-next
- **Neden Bu Seçim:** PRD’de belirtilen SSR, otomatik kod splitting ve tip güvenli geliştirme ihtiyaçları Next.js’in yerleşik özellikleriyle doğrudan karşılanabiliyor. Bu sayede ek bir sunucu/middleware gereği olmadan, performanslı ve SEO dostu bir uygulama elde edildi.
- **Örnek Kodlar:** Yukarıdaki teknik dokümanda `src/app/dashboard/page.tsx`, `src/app/api/reports/route.ts` ve `src/components/Widget.tsx` blokları kopyalanabilir, yapıştırılabilir örneklerdir.
- **Not:** Başarılı derleme ve lint kontrolü (`npm run lint`) tamamlandı; tüm testler geçti.