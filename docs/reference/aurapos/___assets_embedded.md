# AuraPOS — Gömülü Teknik Dosyalar
**ANF Notu:** Bu dosya, ANF tarafından otomatik okunamayan `.ts`, `.sql`, `.txt` dosyalarının içeriğini barındırır.
**Bu dosya GROUND-TRUTH'tur.** Kod yazarken bu şema ve interface tanımlarına tam uyum zorunludur.

---

## 1. Monorepo Yapısı (monorepo_structure.txt)

Tüm dosyaların yolu ve amacı aşağıda tanımlıdır. Architect her task için `file_path`'i buradan türetir.

```
aurapos/
│
├── apps/
│   ├── pos/                          # POS ekranı — Next.js PWA
│   │   ├── app/                      # App Router sayfaları
│   │   │   ├── (auth)/
│   │   │   │   └── pin/page.tsx      # PIN giriş ekranı
│   │   │   ├── (pos)/
│   │   │   │   ├── tables/page.tsx   # Masa planı
│   │   │   │   ├── order/[id]/page.tsx
│   │   │   │   └── payment/[id]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── tables/               # Masa planı bileşenleri
│   │   │   ├── order/                # Sipariş bileşenleri
│   │   │   ├── payment/              # Ödeme bileşenleri
│   │   │   └── kds/                  # KDS bileşenleri (aynı app, farklı rota)
│   │   ├── lib/
│   │   │   ├── electric.ts           # ElectricSQL client başlatma
│   │   │   ├── supabase.ts           # Supabase client (anon key)
│   │   │   └── hardware.ts           # Hardware Bridge API çağrıları
│   │   ├── public/
│   │   │   └── sw.js                 # Service Worker (Workbox)
│   │   ├── next.config.js            # PWA config (next-pwa)
│   │   └── package.json
│   │
│   ├── dashboard/                    # İşletme yönetim paneli — Next.js
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   ├── (panel)/
│   │   │   │   ├── page.tsx          # Ana dashboard / AI insights
│   │   │   │   ├── branches/
│   │   │   │   ├── menu/
│   │   │   │   ├── staff/
│   │   │   │   ├── stock/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/
│   │   │   │   └── payments/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # Ortak UI (shadcn/ui tabanlı)
│   │   │   ├── charts/               # Recharts wrapper'ları
│   │   │   └── ai/                   # AI insight kartları
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   └── package.json
│   │
│   ├── kds/                          # Mutfak Ekranı — Next.js (TV'de açık kalır)
│   │   ├── app/
│   │   │   └── page.tsx              # Tek sayfa, WebSocket driven
│   │   ├── components/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── StationFilter.tsx     # Mutfak / Bar / Soğuk büfe
│   │   │   └── TimerBadge.tsx
│   │   └── package.json
│   │
│   ├── waiter-app/                   # Garson tablet — React Native
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── TablesScreen.tsx
│   │   │   │   ├── OrderScreen.tsx
│   │   │   │   └── ProfileScreen.tsx
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   ├── electric.ts
│   │   │   │   └── api.ts
│   │   │   └── navigation/
│   │   ├── android/
│   │   ├── ios/
│   │   └── package.json
│   │
│   └── branch-server/                # Şube Node Sunucusu — Fastify
│       ├── src/
│       │   ├── index.ts              # Fastify server başlatma
│       │   ├── electric.ts           # PGlite + ElectricSQL şube sync
│       │   ├── routes/
│       │   │   ├── orders.ts
│       │   │   ├── payments.ts
│       │   │   └── hardware.ts
│       │   ├── middleware/
│       │   │   ├── optimisticLock.ts # lock_version kontrolü
│       │   │   └── requireAuth.ts
│       │   ├── hardware/
│       │   │   └── index.ts
│       │   └── sync/
│       │       ├── engine.ts
│       │       └── conflict.ts
│       ├── data/
│       │   └── branch.db
│       └── package.json
│
├── packages/
│   ├── shared-types/
│   │   ├── src/
│   │   │   ├── order.ts
│   │   │   ├── payment.ts
│   │   │   ├── menu.ts
│   │   │   ├── staff.ts
│   │   │   ├── hardware.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── hardware/
│   │   ├── payment-terminal/
│   │   │   ├── mock-driver.ts        # ADI DEĞİŞTİRİLEMEZ (Kural 9)
│   │   │   ├── real-driver-ingenico-a910.ts
│   │   │   ├── real-driver-ingenico-move5000.ts
│   │   │   ├── real-driver-beko.ts
│   │   │   └── index.ts
│   │   ├── printer/
│   │   │   ├── mock-driver.ts
│   │   │   ├── real-driver-usb.ts
│   │   │   ├── real-driver-network.ts
│   │   │   └── index.ts
│   │   ├── drawer/
│   │   │   ├── mock-driver.ts
│   │   │   ├── real-driver-escpos.ts
│   │   │   ├── real-driver-serial.ts
│   │   │   └── index.ts
│   │   ├── display/
│   │   │   ├── mock-driver.ts
│   │   │   ├── real-driver-serial.ts
│   │   │   └── index.ts
│   │   ├── barcode/
│   │   │   ├── mock-driver.ts
│   │   │   └── index.ts
│   │   ├── scale/
│   │   │   ├── mock-driver.ts
│   │   │   └── index.ts
│   │   └── IHardwareDriver.ts        # Interface tanımları (aşağıda)
│   │
│   ├── ui/
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── electric-config/
│   │   ├── src/
│   │   │   ├── shapes.ts
│   │   │   └── client.ts             # (aşağıda tam içerik)
│   │   └── package.json
│   │
│   └── ai/
│       ├── src/
│       │   ├── orchestrator.ts
│       │   ├── agents/
│       │   │   ├── insight.ts
│       │   │   ├── stock.ts
│       │   │   ├── tester.ts
│       │   │   └── coder.ts
│       │   └── prompts/
│       └── package.json
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_init_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions.sql
│   │   └── 004_seed_data.sql
│   ├── functions/
│   │   ├── ai-insights/
│   │   └── efatura-webhook/
│   └── config.toml
│
├── scripts/
│   ├── test-all-mocks.ts
│   ├── seed-demo-data.ts
│   ├── switch-hardware.ts
│   └── check-sync-status.ts
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.staging.yml
│   └── Dockerfile.branch-server
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 2. ElectricSQL Config — Tam İçerik (electric_config.ts)

### packages/electric-config/src/client.ts

```typescript
import { PGlite } from '@electric-sql/pglite'
import { electricSync } from '@electric-sql/pglite/sync'
import { ELECTRIC_URL, SUPABASE_URL, BRANCH_ID } from './env'

let _client: PGlite | null = null

export async function getElectricClient(): Promise<PGlite> {
  if (_client) return _client

  const dataDir = typeof window !== 'undefined'
    ? 'idb://aurapos-branch'
    : `/data/branch-${BRANCH_ID}.db`

  _client = await PGlite.create(dataDir, {
    extensions: { electric: electricSync() }
  })

  await _client.electric.connect(ELECTRIC_URL)
  return _client
}
```

### packages/electric-config/src/shapes.ts

```typescript
import { PGlite } from '@electric-sql/pglite'

interface SyncOptions {
  db: PGlite
  branchId: string
  businessId: string
}

export async function startBranchSync({ db, branchId, businessId }: SyncOptions): Promise<void> {
  await db.electric.syncShapeToTable({
    shape: { url: `${ELECTRIC_URL}/v1/shape`, table: 'categories',
             where: `business_id = '${businessId}'` },
    table: 'categories', primaryKey: ['id'],
  })
  await db.electric.syncShapeToTable({
    shape: { url: `${ELECTRIC_URL}/v1/shape`, table: 'products',
             where: `business_id = '${businessId}'` },
    table: 'products', primaryKey: ['id'],
  })
  await db.electric.syncShapeToTable({
    shape: { url: `${ELECTRIC_URL}/v1/shape`, table: 'table_areas',
             where: `branch_id = '${branchId}'` },
    table: 'table_areas', primaryKey: ['id'],
  })
  await db.electric.syncShapeToTable({
    shape: { url: `${ELECTRIC_URL}/v1/shape`, table: 'tables',
             where: `branch_id = '${branchId}'` },
    table: 'tables', primaryKey: ['id'],
  })
  await db.electric.syncShapeToTable({
    shape: { url: `${ELECTRIC_URL}/v1/shape`, table: 'orders',
             where: `branch_id = '${branchId}' AND created_at > NOW() - INTERVAL '7 days'` },
    table: 'orders', primaryKey: ['id'],
  })
  await db.electric.syncShapeToTable({
    shape: { url: `${ELECTRIC_URL}/v1/shape`, table: 'order_items' },
    table: 'order_items', primaryKey: ['id'],
  })
  await db.electric.syncShapeToTable({
    shape: { url: `${ELECTRIC_URL}/v1/shape`, table: 'ingredients',
             where: `branch_id = '${branchId}'` },
    table: 'ingredients', primaryKey: ['id'],
  })
  await db.electric.syncShapeToTable({
    shape: { url: `${ELECTRIC_URL}/v1/shape`, table: 'staff',
             where: `branch_id = '${branchId}' AND is_active = true` },
    table: 'staff', primaryKey: ['id'],
  })
  console.log(`[ElectricSQL] Şube ${branchId} sync başladı ✓`)
}
```

### apps/branch-server/src/sync/conflict.ts

```typescript
export type ConflictType = 'order' | 'payment' | 'stock' | 'table_status'

export interface ConflictRecord {
  table: string
  local_record: Record<string, unknown>
  cloud_record: Record<string, unknown>
  conflict_type: ConflictType
  detected_at: string
}

export async function resolveConflict(conflict: ConflictRecord): Promise<'local' | 'cloud' | 'merge'> {
  switch (conflict.conflict_type) {
    case 'payment':
    case 'table_status':
      await logConflict(conflict, 'cloud_wins')
      return 'cloud'
    case 'order': {
      const localTs = new Date(conflict.local_record.updated_at as string).getTime()
      const cloudTs = new Date(conflict.cloud_record.updated_at as string).getTime()
      const winner  = localTs > cloudTs ? 'local' : 'cloud'
      await logConflict(conflict, `last_write_wins:${winner}`)
      return winner
    }
    case 'stock':
      await logConflict(conflict, 'both_applied')
      return 'merge'
  }
}

async function logConflict(conflict: ConflictRecord, resolution: string): Promise<void> {
  console.warn(`[CONFLICT] ${conflict.table} → ${resolution}`, {
    local: conflict.local_record?.id,
    cloud: conflict.cloud_record?.id,
    at:    conflict.detected_at,
  })
}
```

### packages/hardware/IHardwareDriver.ts — Tüm Interface'ler

```typescript
export interface IPaymentTerminalDriver {
  sale(amount: number, currency?: string): Promise<ApprovalResponse>
  cancel(transactionId: string): Promise<CancelResponse>
  refund(transactionId: string, amount: number): Promise<RefundResponse>
  batchClose(): Promise<BatchResponse>
  addTip(transactionId: string, tipAmount: number): Promise<TipResponse>
  partialPayment(amount: number, total: number): Promise<PartialResponse>
  healthCheck(): Promise<{ online: boolean; model: string }>
}

export interface IPrinterDriver {
  print(receipt: ReceiptObject): Promise<PrintResponse>
  printKitchenTicket(ticket: KitchenTicket): Promise<PrintResponse>
  healthCheck(): Promise<{ online: boolean; paperLevel: 'ok' | 'low' | 'empty' }>
}

export interface IDrawerDriver {
  open(): Promise<{ status: 'OPENED'; timestamp: string }>
  status(): Promise<{ status: 'OPEN' | 'CLOSED' }>
}

export interface IDisplayDriver {
  show(lines: string[]): Promise<{ status: 'SHOWN' }>
  clear(): Promise<{ status: 'CLEARED' }>
}

export interface ApprovalResponse {
  status: 'APPROVED' | 'DECLINED' | 'ERROR'
  auth_code: string
  transaction_id: string
  amount: number
  currency: string
  card_last4: string
  card_type: 'VISA' | 'MASTERCARD' | 'AMEX' | 'TROY' | 'OTHER'
}
export interface CancelResponse   { status: 'CANCELLED'; transaction_id: string }
export interface RefundResponse   { status: 'REFUNDED';  transaction_id: string; amount: number }
export interface BatchResponse    { status: 'BATCH_CLOSED'; batch_id: string }
export interface TipResponse      { status: 'TIP_ADDED'; transaction_id: string; tip: number }
export interface PartialResponse  { status: 'APPROVED'; paid: number; remaining: number }
export interface PrintResponse    { status: 'PRINTED'; file?: string }

export interface ReceiptObject {
  business_name?: string
  order_id:       string
  table?:         string
  cashier?:       string
  items:          Array<{ name: string; qty: number; price: number }>
  total:          number
  payment_method?: string
  tip_amount?:    number
  change_given?:  number
}

export interface KitchenTicket {
  order_id:   string
  table?:     string
  station:    'kitchen' | 'bar' | 'cold'
  items:      Array<{ name: string; qty: number; note?: string; options?: string[] }>
  created_at: string
}
```

---

## 3. Supabase Migrations — Tam SQL (supabase_migrations.sql)

> ⚠️ Bu migration'lar değiştirilemez (Kural 10). Yeni tablo/kolon = yeni numaralı migration.

### 001_init_schema.sql

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, vkn TEXT UNIQUE, tax_office TEXT, address TEXT, phone TEXT, email TEXT,
  logo_url TEXT, plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial','starter','pro','enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, address TEXT, phone TEXT, timezone TEXT DEFAULT 'Europe/Istanbul',
  is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, permissions JSONB DEFAULT '{}', is_system BOOLEAN DEFAULT FALSE
);

CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id), role_id UUID NOT NULL REFERENCES roles(id),
  name TEXT NOT NULL, email TEXT, phone TEXT,
  pin_hash TEXT NOT NULL,  -- bcrypt, asla plain text
  supabase_uid UUID, avatar_url TEXT, is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id), staff_id UUID NOT NULL REFERENCES staff(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ended_at TIMESTAMPTZ, break_minutes INT DEFAULT 0
);

CREATE TABLE table_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, sort_order INT DEFAULT 0
);

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES table_areas(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, capacity INT DEFAULT 4, pos_x FLOAT DEFAULT 0, pos_y FLOAT DEFAULT 0,
  status TEXT DEFAULT 'empty' CHECK (status IN ('empty','occupied','reserved','blocked')),
  current_order_id UUID
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID, parent_id UUID REFERENCES categories(id),
  name TEXT NOT NULL, image_url TEXT, sort_order INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL, description TEXT, image_url TEXT,
  base_price NUMERIC(10,2) NOT NULL, vat_rate NUMERIC(5,2) DEFAULT 8.0,
  unit TEXT DEFAULT 'adet', barcode TEXT,
  kitchen_station TEXT DEFAULT 'kitchen' CHECK (kitchen_station IN ('kitchen','bar','cold')),
  prep_minutes INT DEFAULT 5, allergens TEXT[], calories INT, is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, price_modifier NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE option_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, is_required BOOLEAN DEFAULT FALSE, min_select INT DEFAULT 0, max_select INT DEFAULT 1
);

CREATE TABLE option_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL, price_modifier NUMERIC(10,2) DEFAULT 0, sort_order INT DEFAULT 0
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  table_id UUID REFERENCES tables(id), staff_id UUID REFERENCES staff(id),
  order_number SERIAL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','on_hold','partial_paid','paid','closed','cancelled')),
  type TEXT DEFAULT 'dine_in' CHECK (type IN ('dine_in','takeaway','delivery')),
  note TEXT, cancel_reason TEXT, cover_count INT DEFAULT 1,
  subtotal NUMERIC(10,2) DEFAULT 0, service_fee NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0, total NUMERIC(10,2) DEFAULT 0,
  lock_version INT DEFAULT 0,  -- Optimistic lock (v1.1)
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), closed_at TIMESTAMPTZ
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  portion_id UUID REFERENCES portions(id),
  qty INT NOT NULL DEFAULT 1, unit_price NUMERIC(10,2) NOT NULL, total_price NUMERIC(10,2) NOT NULL,
  note TEXT, seat_no INT DEFAULT NULL,  -- Koltuk bazlı sipariş (v1.1)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','served','cancelled','waste','complimentary')),
  sent_to_kds BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_item_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  option_item_id UUID NOT NULL REFERENCES option_items(id),
  price_modifier NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  method TEXT NOT NULL CHECK (method IN ('cash','card','meal_voucher','mobile','mixed','unpaid')),
  amount NUMERIC(10,2) NOT NULL, tip_amount NUMERIC(10,2) DEFAULT 0,
  cash_given NUMERIC(10,2), change_given NUMERIC(10,2),
  ingenico_tid TEXT, ingenico_auth TEXT, card_last4 TEXT, card_type TEXT,
  meal_voucher_type TEXT, status TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','refunded','cancelled')),
  refund_reason TEXT, staff_id UUID REFERENCES staff(id), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  method TEXT NOT NULL, amount NUMERIC(10,2) NOT NULL
);

CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id), staff_id UUID NOT NULL REFERENCES staff(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(), closed_at TIMESTAMPTZ,
  opening_amount NUMERIC(10,2) DEFAULT 0, closing_amount NUMERIC(10,2),
  expected_amount NUMERIC(10,2), difference NUMERIC(10,2), note TEXT
);

CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id), register_id UUID REFERENCES cash_registers(id),
  staff_id UUID NOT NULL REFERENCES staff(id), type TEXT CHECK (type IN ('in','out')),
  amount NUMERIC(10,2) NOT NULL, reason TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  name TEXT NOT NULL, unit TEXT NOT NULL,
  current_qty NUMERIC(10,3) DEFAULT 0, critical_qty NUMERIC(10,3) DEFAULT 0,
  cost_per_unit NUMERIC(10,2), supplier TEXT,
  warehouse_id UUID,  -- v1.1: çoklu depo
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  qty_per_unit NUMERIC(10,4) NOT NULL,
  UNIQUE(product_id, ingredient_id)
);

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  type TEXT CHECK (type IN ('purchase','sale','waste','transfer_in','transfer_out','count','production')),
  qty NUMERIC(10,3) NOT NULL, note TEXT,
  order_item_id UUID REFERENCES order_items(id), staff_id UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  title TEXT NOT NULL, description TEXT, scheduled_time TIME,
  requires_photo BOOLEAN DEFAULT FALSE, is_recurring BOOLEAN DEFAULT TRUE,
  recurrence TEXT DEFAULT 'daily', assigned_role TEXT, is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE task_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id), branch_id UUID NOT NULL REFERENCES branches(id),
  staff_id UUID NOT NULL REFERENCES staff(id), completed_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT, note TEXT, log_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name TEXT, phone TEXT, email TEXT, birth_date DATE,
  total_spent NUMERIC(10,2) DEFAULT 0, visit_count INT DEFAULT 0, loyalty_pts INT DEFAULT 0,
  notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- v1.1 Yeni Tablolar

CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, type TEXT DEFAULT 'main' CHECK (type IN ('main','bar','kitchen','cold')),
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE products ADD COLUMN warehouse_type TEXT DEFAULT 'kitchen'
  CHECK (warehouse_type IN ('main','bar','kitchen','cold'));

CREATE TABLE aggregator_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  aggregator TEXT NOT NULL CHECK (aggregator IN ('yemeksepeti','getir','trendyol')),
  external_sku TEXT NOT NULL, product_id UUID NOT NULL REFERENCES products(id),
  external_name TEXT, is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(aggregator, external_sku, business_id)
);

CREATE TABLE aggregator_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  aggregator TEXT NOT NULL, external_order_id TEXT NOT NULL,
  order_id UUID REFERENCES orders(id), raw_payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','mapped','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  customer_id UUID REFERENCES customers(id), branch_id UUID NOT NULL REFERENCES branches(id),
  order_id UUID REFERENCES orders(id), type TEXT NOT NULL CHECK (type IN ('debit','credit')),
  amount NUMERIC(10,2) NOT NULL, description TEXT, due_date DATE, paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE semi_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL, unit TEXT NOT NULL, current_qty NUMERIC(10,3) DEFAULT 0
);

CREATE TABLE semi_product_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semi_product_id UUID NOT NULL REFERENCES semi_products(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  qty_required NUMERIC(10,4) NOT NULL
);

CREATE TABLE production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  semi_product_id UUID NOT NULL REFERENCES semi_products(id),
  produced_qty NUMERIC(10,3) NOT NULL, staff_id UUID REFERENCES staff(id),
  note TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE printers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  name TEXT NOT NULL, ip_address TEXT, mdns_name TEXT, port INT DEFAULT 9100,
  type TEXT DEFAULT 'kitchen' CHECK (type IN ('kitchen','bar','receipt','packaging')),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE printer_routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id), printer_id UUID NOT NULL REFERENCES printers(id),
  condition_type TEXT NOT NULL CHECK (condition_type IN ('category','order_type','product','is_fryer','station')),
  condition_value TEXT NOT NULL, priority INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE qr_attendance_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  token TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL,
  used_by UUID REFERENCES staff(id), used_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_orders_branch_status   ON orders(branch_id, status);
CREATE INDEX idx_orders_business_date   ON orders(business_id, created_at DESC);
CREATE INDEX idx_order_items_order      ON order_items(order_id);
CREATE INDEX idx_order_items_kds        ON order_items(order_id, sent_to_kds, kitchen_station) INCLUDE (status);
CREATE INDEX idx_payments_order         ON payments(order_id);
CREATE INDEX idx_payments_branch_date   ON payments(branch_id, created_at DESC);
CREATE INDEX idx_stock_movements_ingr   ON stock_movements(ingredient_id, created_at DESC);
CREATE INDEX idx_tables_branch_status   ON tables(branch_id, status);
CREATE INDEX idx_staff_business_active  ON staff(business_id, is_active);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Sipariş kapanınca masa boşalt
CREATE OR REPLACE FUNCTION release_table_on_close() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('closed', 'cancelled') AND OLD.status NOT IN ('closed','cancelled') THEN
    UPDATE tables SET status = 'empty', current_order_id = NULL WHERE id = NEW.table_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_release_table
  AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION release_table_on_close();

-- Trigger: Yarı mamul üretimi — hammadde düş + stok artır
CREATE OR REPLACE FUNCTION process_production() RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT ingredient_id, qty_required FROM semi_product_recipes
    WHERE semi_product_id = NEW.semi_product_id
  LOOP
    UPDATE ingredients
    SET current_qty = current_qty - (rec.qty_required * NEW.produced_qty)
    WHERE id = rec.ingredient_id;

    INSERT INTO stock_movements (branch_id, ingredient_id, type, qty, note)
    VALUES (NEW.branch_id, rec.ingredient_id, 'production',
            -(rec.qty_required * NEW.produced_qty),
            'Üretim: ' || NEW.semi_product_id::text);
  END LOOP;

  UPDATE semi_products
  SET current_qty = current_qty + NEW.produced_qty
  WHERE id = NEW.semi_product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_production_log
  AFTER INSERT ON production_logs
  FOR EACH ROW EXECUTE FUNCTION process_production();
```

### 002_rls_policies.sql

```sql
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth_business_id() RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'business_id')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE POLICY "business_isolation" ON businesses FOR ALL USING (id = auth_business_id());
CREATE POLICY "business_isolation" ON branches FOR ALL USING (business_id = auth_business_id());
CREATE POLICY "business_isolation" ON staff FOR ALL USING (business_id = auth_business_id());
CREATE POLICY "business_isolation" ON roles FOR ALL USING (business_id = auth_business_id());
CREATE POLICY "business_isolation" ON categories FOR ALL USING (business_id = auth_business_id());
CREATE POLICY "business_isolation" ON products FOR ALL USING (business_id = auth_business_id());
CREATE POLICY "business_isolation" ON orders FOR ALL USING (business_id = auth_business_id());
CREATE POLICY "business_isolation" ON payments FOR ALL USING (business_id = auth_business_id());
CREATE POLICY "business_isolation" ON ingredients FOR ALL USING (business_id = auth_business_id());
CREATE POLICY "business_isolation" ON customers FOR ALL USING (business_id = auth_business_id());
```

### 003_functions.sql

```sql
CREATE OR REPLACE FUNCTION get_daily_revenue(p_business_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (branch_id UUID, branch_name TEXT, total NUMERIC, cash NUMERIC, card NUMERIC,
               meal_voucher NUMERIC, mobile NUMERIC, tip_total NUMERIC, order_count BIGINT) AS $$
  SELECT b.id, b.name,
    COALESCE(SUM(p.amount), 0),
    COALESCE(SUM(CASE WHEN p.method = 'cash' THEN p.amount END), 0),
    COALESCE(SUM(CASE WHEN p.method = 'card' THEN p.amount END), 0),
    COALESCE(SUM(CASE WHEN p.method = 'meal_voucher' THEN p.amount END), 0),
    COALESCE(SUM(CASE WHEN p.method = 'mobile' THEN p.amount END), 0),
    COALESCE(SUM(p.tip_amount), 0),
    COUNT(DISTINCT o.id)
  FROM branches b
  LEFT JOIN orders o ON o.branch_id = b.id AND o.business_id = p_business_id
                     AND DATE(o.closed_at) = p_date AND o.status = 'closed'
  LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
  WHERE b.business_id = p_business_id GROUP BY b.id, b.name;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_critical_stock(p_business_id UUID)
RETURNS TABLE (branch_id UUID, ingredient_id UUID, name TEXT, current_qty NUMERIC, critical_qty NUMERIC, unit TEXT) AS $$
  SELECT i.branch_id, i.id, i.name, i.current_qty, i.critical_qty, i.unit
  FROM ingredients i
  WHERE i.business_id = p_business_id AND i.current_qty <= i.critical_qty
  ORDER BY (i.current_qty / NULLIF(i.critical_qty, 0)) ASC;
$$ LANGUAGE SQL STABLE;
```

### 004_seed_data.sql

```sql
INSERT INTO businesses (id, name, vkn, tax_office, address)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Kafe', '1234567890', 'Ankara VD', 'Çankaya, Ankara');

INSERT INTO branches (id, business_id, name)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Merkez Şube');

INSERT INTO roles (business_id, name, is_system, permissions) VALUES
  ('00000000-0000-0000-0000-000000000001', 'owner',   TRUE, '{"all": true}'),
  ('00000000-0000-0000-0000-000000000001', 'manager', TRUE, '{"orders": true, "payments": true, "reports": true, "staff": true}'),
  ('00000000-0000-0000-0000-000000000001', 'cashier', TRUE, '{"orders": true, "payments": true}'),
  ('00000000-0000-0000-0000-000000000001', 'waiter',  TRUE, '{"orders": true}'),
  ('00000000-0000-0000-0000-000000000001', 'barista', TRUE, '{"kds": true}');
```
