aurapos/
├─ packages/
│   └─ shared-types/
│      ├─ src/
│      │   └─ index.ts          # Dışa aktarılan tip tanımları
│      ├─ dist/                 # tsc çıktısı (build sonrası)
│      ├─ package.json
│      └─ tsconfig.json


# Paket kök dizinine gidin
cd packages/shared-types

# Geliştirme bağımlılıklarını kur (sadece TypeScript)
npm install

# Derleme
npm run build   # tsc komutu çalıştırılır, dist/ klasörüne çıktı üretilir


// src/index.ts
export interface Product {
  id: string;
  name: string;
  price: number; // birim: TL
  sku: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  items: Product[];
  total: number; // toplam tutar, TL
  createdAt: Date;
}


// örnek: packages/order-service/src/service.ts
import { Product, Order } from '@aurapos/shared-types';

function calculateTotal(items: Product[]): number {
  return items.reduce((sum, p) => sum + p.price, 0);
}

function createOrder(customerId: string, items: Product[]): Order {
  return {
    orderId: Math.random().toString(36).substr(2, 9),
    customerId,
    items,
    total: calculateTotal(items),
    createdAt: new Date(),
  };
}


npm run build && tsc --noEmit --project tsconfig.json