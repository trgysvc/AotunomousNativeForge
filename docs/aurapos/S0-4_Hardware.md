# Yerel monorepo içinde
npm install @aurapos/hardware


yarn add @aurapos/hardware


// src/hardware.ts
import { HardwareInterface } from '@aurapos/hardware';

// Donanım arayüzünü başlatma (örnek implementasyon)
const hw: HardwareInterface = {
  open: () => Promise.resolve(),
  close: () => Promise.resolve(),
  sendData: (data: Buffer) => Promise.resolve(data.length),
};

async function run() {
  await hw.open();
  const sent = await hw.sendData(Buffer.from('Hello Aurapos'));
  console.log(`Gönderilen bayt sayısı: ${sent}`);
  await hw.close();
}

run().catch(console.error);


# Paketi derlemek
npm run build   # tsc çalıştırılır, dist/ klasörüne çıktı üretilir

# Yayın öncesi otomatik derleme (npm publish hook)
npm prepare     # aynı zamanda `npm run build` tetikler