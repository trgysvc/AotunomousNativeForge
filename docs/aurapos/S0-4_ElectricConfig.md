# Mono‑repo kökünden (yarn/pnpm/npm workspace kullanıyorsanız)
npm install @aurapos/electric-config
# veya
yarn add @aurapos/electric-config


{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@aurapos/*": ["../packages/*/src"]
    }
  }
}


// src/index.ts
import { AppConfig } from '@aurapos/shared-types';

export const electricConfig: AppConfig = {
  features: {
    electricMode: true,
    voltageLevels: [220, 380],
  },
  thresholds: {
    warning: 0.8,
    critical: 0.95,
  },
};


npm run build   # veya: yarn build
# Çıktı: dist/index.js ve dist/index.d.ts


// başka bir paket veya uygulama
import { electricConfig } from '@aurapos/electric-config';

console.log(electricConfig.features.electricMode); // true
console.log(electricConfig.thresholds.warning);   // 0.8


## DEVLOG - 2025-09-26 10:15:00 +0300
**Görev:** Create electric-config package source
**Durum:** DONE
**Açıklama:** @aurapos/electric-config paketi oluşturuldu, package.json yapılandırıldı, TypeScript derleme süreci tanımlanır. Native Node.js (No-Middleware) yaklaşımı benimsendi, çünkü paket sadece yapılandırma verilerini dışa aktarır ve hiçbir HTTP veya middleware katmanı gerektirmez. Bu karar PRD'de "hafif ve bağımsız konfigürasyon paketi" gerektiği için alındı.
**Değişiklikler:** 
- paket kök dizinine `package.json` eklendi (yukarıdaki içerik)
- varsayılan `tsconfig.json` eklendi
- `src/index.ts` örnek yapılandırma dışa aktarımı eklendi
- `build` ve `prepare` scriptleri tanımlanır