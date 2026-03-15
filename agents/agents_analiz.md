# ANF — Autonomous Native Forge: Detaylı Sistem Analizi

Bu döküman, **Autonomous Native Forge (GB10)** sisteminin otonom yazılım fabrikası mimarisini, dinamik yapılandırma süreçlerini ve güvenlik protokollerini detaylandırmak için hazırlanmıştır.

---

## 1. Mimari Temeller (Software Factory Model)
Sistemin kalbi, tamamen **Native Node.js** çekirdek modülleri üzerine inşa edilmiş, dinamik olarak genişleyebilen bir **Multi-Agent System (MAS)** yapısıdır.

- **Proje Bazlı Dinamik Yapı:** Sistem, projeleri kod içine gömmek yerine `config/vault.json` dosyasından dinamik olarak okur (Single Source of Truth).
- **Otonom Orkestrasyon (Bootstrap):** `bootstrap.js`, sistemin kurulum, mühürleme ve ajan uyandırma süreçlerini tek başına yönetir.
- **Kuyruk ve Log Tabanlı Haberleşme:** Ajanlar `queue/inbox` dizinleri üzerinden JSON dosyaları ile haberleşirken, tüm süreçler `logs/` altında merkezi olarak izlenir.
- **Düşük Gecikme:** NVIDIA Blackwell mimarisi, Apple Silicon (Unified Memory) ve NPU (AI Hızlandırıcı) çipler için optimize edilmiş, kütüphanesiz (library-free) iletişim protokolleri kullanılır.
- **Yüksek Bant Genişliği:** Unified Memory mimarisi sayesinde devasa context (bağlam) pencereleri minimum gecikmeyle işlenir.

---

## 2. Sistem Bileşenleri ve Ajan Rolleri

### 2.1. Dynamic Vault (`config/vault.json`)
Sistemin "Kimlik Kasası"dır.
- Her projenin GitHub repo, Token ve Supabase bilgilerini içerir.
- Yazılım fabrikasına yeni bir "bant" (proje) eklemek için bu dosyaya kayıt girmek yeterlidir.

### 2.2. Bootstrap (Fabrika Yöneticisi)
Sistemi ayağa kaldıran ana mekanizmadır.
- **Mühürleme:** Her projenin `src` klasörüne gidip `.env` ve `config.json` dosyalarını fiziksel olarak mühürler.
- **Otomatik Spawning:** İşletim sistemini (Linux/macOS) algılar ve 4 ana ajanı ayrı terminal pencerelerinde otonom olarak başlatır.
- **Sistem Sağlığı:** Gerekli tüm klasör hiyerarşisini (queue, docs, src, logs) otomatik inşa eder.

### 2.3. Uzman Ajanlar
1.  **Architect (Baş Mimar):** `docs/reference/` altındaki dökümanları tarar, DeepSeek-R1 ile iş planı çıkarır ve dökümanları önüne `_` koyarak mühürler. Onaylı kodları GitHub'a push eder.
2.  **Coder (Geliştirici):** Architect'ten gelen görevleri ve döküman linklerini alır. Hedef platformun (Swift, SQL, Node vb.) "Native" standartlarını ve en güncel döküman patternlerini kullanarak kod üretir.
3.  **Tester (Denetçi):** Üretilen kodu güvenlik ve bağımlılık taramasından geçirir. Hata varsa "Self-Healing" sürecini başlatır.
4.  **Docs (Arşivci):** Başarılı süreçleri dökümante eder ve merkezi `DEVLOG.md` dosyasını günceller.

---

## 3. İş Akışı (Process Flow)

1.  **Tanımlama:** Kullanıcı `vault.json`'a projeyi ekler ve `bootstrap.js`'i çalıştırır.
2.  **Uyandırma:** Bootstrap tüm klasörleri hazırlar ve 4 ajanı terminal pencerelerinde başlatır.
3.  **Keşif:** Architect, `docs/reference/[PROJE]` içine atılan yeni dökümanları görür ve atomik görevlere böler.
4.  **Üretim Döngüsü:** 
    - Coder kodu yazar.
    - Tester denetler (Hata varsa Coder'a geri döner).
    - Başarılı olan kod Architect tarafından GitHub'a itilir (Push).
5.  **İzleme:** Kullanıcı tüm süreci `logs/system.log` ve ajanlara özel log dosyalarından takip eder.

---

## 4. Güvenlik ve İzolasyon Protokolleri

- **Credential Isolation:** Ajanlar hiçbir zaman ana token'lara doğrudan erişmez; sadece Bootstrap tarafından mühürlenen izole `.env` ve `config.json` dosyalarını okur.
- **Mühürlü Kaynaklar:** İşlenen dökümanlar `_` ön ekiyle işaretlenerek mükerrer işlem yapılması engellenir (Atomsicity).
- **Log Şeffaflığı:** Her ajanın çıktısı hem terminale hem de fiziksel log dosyasına mühürlenir, böylece sistemin geçmişe dönük "niyet analizi" yapılabilir.
- **Strict Native Policy:** Kod üretiminde ve sistem bileşenlerinde harici bağımlılık (npm install) yasaktır, bu da tedarik zinciri saldırılarını sıfıra indirir.
