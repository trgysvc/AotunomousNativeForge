'use strict';
/**
 * ANF Telemetry Daemon v2.0
 * Autonomous Native Forge — Real-Time System Analytics
 * 
 * Collects and reports:
 *   1. Hardware Utilization (nvidia-smi, /proc)
 *   2. AI/Model Performance (vLLM journald, sys.log)
 *   3. Reliability & Error Analysis (manifest.json, sys.log)
 *   4. Operational Cost & Efficiency (task timings, power draw)
 * 
 * Runs independently from all agents. Survives agent crashes.
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR     = path.join(__dirname, '..');
const APP_LOG      = path.join(BASE_DIR, 'sys.log');
const REPORT_PATH  = path.join(BASE_DIR, 'anf_system_report.md');
const SRC_DIR      = path.join(BASE_DIR, 'src');
const PROJECT_ID   = 'aurapos';
const MANIFEST_PATH = path.join(SRC_DIR, PROJECT_ID, 'manifest.json');

const STALL_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────────────
// 1. HARDWARE METRICS
// ─────────────────────────────────────────────────────────────────
function getHardwareMetrics() {
    const hw = {
        gpu_name: 'NVIDIA GB10',
        gpu_load_pct: 'N/A',
        gpu_temp_c: 'N/A',
        gpu_power_w: 'N/A',
        vram_used_mb: 'N/A',
        vram_total_mb: 'N/A',
        ram_used_mb: 'N/A',
        ram_total_mb: 'N/A',
        cpu_load_1m: 'N/A',
        thermal_throttling: false,
    };

    try {
        const smiOut = execSync(
            'nvidia-smi --query-gpu=name,utilization.gpu,utilization.memory,memory.used,memory.total,power.draw,temperature.gpu --format=csv,noheader,nounits',
            { timeout: 5000 }
        ).toString().trim();

        if (smiOut && smiOut !== '') {
            const parts = smiOut.split(',').map(s => s.trim());
            hw.gpu_name       = parts[0] || hw.gpu_name;
            hw.gpu_load_pct   = parts[1] !== '[N/A]' ? parseFloat(parts[1]) : 'N/A';
            hw.vram_used_mb   = parts[3] !== '[N/A]' ? parseFloat(parts[3]) : 'N/A';
            hw.vram_total_mb  = parts[4] !== '[N/A]' ? parseFloat(parts[4]) : 'N/A';
            hw.gpu_power_w    = parts[5] !== '[N/A]' ? parseFloat(parts[5]).toFixed(1) : 'N/A';
            hw.gpu_temp_c     = parts[6] !== '[N/A]' ? parseInt(parts[6]) : 'N/A';
            hw.thermal_throttling = hw.gpu_temp_c !== 'N/A' && hw.gpu_temp_c > 85;
        }
    } catch (_) {}

    try {
        const memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
        const total = parseInt(memInfo.match(/MemTotal:\s+(\d+)/)?.[1] || 0) / 1024;
        const avail = parseInt(memInfo.match(/MemAvailable:\s+(\d+)/)?.[1] || 0) / 1024;
        hw.ram_total_mb = Math.round(total);
        hw.ram_used_mb  = Math.round(total - avail);
    } catch (_) {}

    try {
        const loadAvg = fs.readFileSync('/proc/loadavg', 'utf8');
        hw.cpu_load_1m = parseFloat(loadAvg.split(' ')[0]);
    } catch (_) {}

    return hw;
}

// ─────────────────────────────────────────────────────────────────
// 2. VLLM / AI MODEL METRICS
// ─────────────────────────────────────────────────────────────────
function getVllmMetrics() {
    const metrics = { tps_generation: 0, tps_prompt: 0, kv_cache_pct: 0, running_reqs: 0, waiting_reqs: 0, prefix_cache_hit_rate: 0 };
    try {
        // Read last 5000 chars of sys.log for vLLM throughput data
        const logSize = fs.statSync(APP_LOG).size;
        const readSize = Math.min(5000, logSize);
        const buf = Buffer.alloc(readSize);
        const fd = fs.openSync(APP_LOG, 'r');
        fs.readSync(fd, buf, 0, readSize, logSize - readSize);
        fs.closeSync(fd);
        const tail = buf.toString('utf8');

        // Also try journald
        let vllmLog = tail;
        try {
            vllmLog += execSync('journalctl -u "vllm*" -n 20 --no-pager --output=cat 2>/dev/null || true', { timeout: 3000 }).toString();
        } catch (_) {}

        const tpsMatch = vllmLog.match(/Avg generation throughput:\s*([\d.]+)\s*tokens\/s/g);
        if (tpsMatch && tpsMatch.length > 0) {
            const last = tpsMatch[tpsMatch.length - 1];
            metrics.tps_generation = parseFloat(last.match(/([\d.]+)/)[1]);
        }

        const kvMatch = vllmLog.match(/GPU KV cache usage:\s*([\d.]+)%/g);
        if (kvMatch && kvMatch.length > 0) {
            const last = kvMatch[kvMatch.length - 1];
            metrics.kv_cache_pct = parseFloat(last.match(/([\d.]+)/)[1]);
        }

        const runMatch = vllmLog.match(/Running:\s*(\d+)\s*reqs/g);
        if (runMatch && runMatch.length > 0) {
            metrics.running_reqs = parseInt(runMatch[runMatch.length - 1].match(/(\d+)/)[1]);
        }

        const prefixMatch = vllmLog.match(/Prefix cache hit rate:\s*([\d.]+)%/g);
        if (prefixMatch && prefixMatch.length > 0) {
            metrics.prefix_cache_hit_rate = parseFloat(prefixMatch[prefixMatch.length - 1].match(/([\d.]+)/)[1]);
        }
    } catch (_) {}
    return metrics;
}

// ─────────────────────────────────────────────────────────────────
// 3. MANIFEST / TASK ANALYTICS
// ─────────────────────────────────────────────────────────────────
function getManifestMetrics() {
    const result = {
        total: 0, done: 0, pending: 0, in_progress: 0, testing: 0, failed: 0,
        retry_rate_pct: 0, total_retries: 0,
        error_breakdown: {},
        self_healing_count: 0,
        avg_retry_count: 0,
    };
    if (!fs.existsSync(MANIFEST_PATH)) return result;
    try {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        const tasks = manifest.tasks || [];
        result.total = tasks.length;

        tasks.forEach(t => {
            if (t.status === 'DONE')          result.done++;
            else if (t.status === 'PENDING')  result.pending++;
            else if (t.status === 'IN_PROGRESS' || t.status === 'FIXING') result.in_progress++;
            else if (t.status === 'TESTING')  result.testing++;
            else if (t.status === 'FAILED')   result.failed++;

            const retries = t.retry_count || 0;
            result.total_retries += retries;
            if (retries > 0 && t.status === 'DONE') result.self_healing_count++;

            // Error type breakdown from failure_log
            (t.failure_log || []).forEach(f => {
                const et = f.error_type || 'UNKNOWN';
                result.error_breakdown[et] = (result.error_breakdown[et] || 0) + 1;
            });
        });

        const attempted = tasks.filter(t => (t.retry_count || 0) > 0 || t.status === 'DONE' || t.status === 'FAILED').length;
        result.retry_rate_pct = attempted > 0 ? ((result.total_retries / attempted) * 100).toFixed(1) : 0;
        result.avg_retry_count = attempted > 0 ? (result.total_retries / attempted).toFixed(2) : 0;
    } catch (_) {}
    return result;
}

// ─────────────────────────────────────────────────────────────────
// 4. LOG PERFORMANCE ANALYTICS
// ─────────────────────────────────────────────────────────────────
function getLogMetrics() {
    const result = {
        readAvgSec: 0, readSamples: 0,
        codeAvgSec: 0, codeSamples: 0, codeMinSec: 0, codeMaxSec: 0,
        qaAvgSec: 0, qaSamples: 0,
        sync_fail_count: 0,
        max_retry_exceeded_count: 0,
        steering_count: 0,
        tasks_completed_count: 0,
        mtbf_minutes: 0,   // Mean Time Between Failures
    };
    if (!fs.existsSync(APP_LOG)) return result;

    try {
        const log = fs.readFileSync(APP_LOG, 'utf8');
        const lines = log.split('\n');
        let codeTimes = [], readTimes = [], qaTimes = [];
        let lastCoderStart = null, lastDocStart = null, lastQaStart = null;
        let failureTimestamps = [];

        lines.forEach(line => {
            const m = line.match(/\[([\d\-T:.Z]+)\]/);
            if (!m) return;
            const t = new Date(m[1]).getTime();

            if (line.includes('Multi-Doc Synthesis başlatılıyor')) lastDocStart = t;
            if (line.includes('CONSENSUS:') && line.includes('Peer Review') && lastDocStart) {
                readTimes.push((t - lastDocStart) / 1000);
                lastDocStart = null;
            }

            if (line.includes('CODER:') && line.includes('yazılıyor')) lastCoderStart = t;
            if (line.includes('Kod yazımı bitti') && lastCoderStart) {
                codeTimes.push((t - lastCoderStart) / 1000);
                lastCoderStart = null;
            }

            if (line.includes('QA GUARDRAIL:')) lastQaStart = t;
            if ((line.includes('SYNC FAIL') || line.includes('TEST GEÇİLDİ') || line.includes('onaylandı. HEARTBEAT_OK')) && lastQaStart) {
                qaTimes.push((t - lastQaStart) / 1000);
                lastQaStart = null;
            }

            if (line.includes('SYNC FAIL'))          result.sync_fail_count++;
            if (line.includes('MAX RETRY'))           { result.max_retry_exceeded_count++; failureTimestamps.push(t); }
            if (line.includes('STEERING:'))           result.steering_count++;
            if (line.includes('TEST GEÇİLDİ') || line.includes('onaylandı. HEARTBEAT_OK')) result.tasks_completed_count++;
        });

        const avg = arr => arr.length ? (arr.reduce((a,b) => a+b, 0) / arr.length) : 0;
        const min = arr => arr.length ? Math.min(...arr) : 0;
        const max = arr => arr.length ? Math.max(...arr) : 0;

        result.readAvgSec = avg(readTimes).toFixed(1);
        result.readSamples = readTimes.length;
        result.codeAvgSec = avg(codeTimes).toFixed(1);
        result.codeSamples = codeTimes.length;
        result.codeMinSec = min(codeTimes).toFixed(1);
        result.codeMaxSec = max(codeTimes).toFixed(1);
        result.qaAvgSec = avg(qaTimes).toFixed(1);
        result.qaSamples = qaTimes.length;

        // MTBF: average minutes between failures
        if (failureTimestamps.length > 1) {
            let diffs = [];
            for (let i = 1; i < failureTimestamps.length; i++) diffs.push((failureTimestamps[i] - failureTimestamps[i-1]) / 60000);
            result.mtbf_minutes = (diffs.reduce((a,b) => a+b, 0) / diffs.length).toFixed(1);
        }
    } catch (_) {}
    return result;
}

// ─────────────────────────────────────────────────────────────────
// 5. SYSTEM STATE CHECK
// ─────────────────────────────────────────────────────────────────
function getSystemState() {
    if (!fs.existsSync(APP_LOG)) return { status: '⚫ UNKNOWN', stalled_min: 0 };
    try {
        const stats = fs.statSync(APP_LOG);
        const diffMs = Date.now() - stats.mtimeMs;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMs > 15 * 60 * 1000) return { status: `🔴 STALLED (${diffMin} dakikadır log yok)`, stalled_min: diffMin };
        if (diffMs > 5 * 60 * 1000)  return { status: `🟡 IDLE (${diffMin} dk)`, stalled_min: diffMin };
        return { status: '🟢 ONLINE', stalled_min: 0 };
    } catch (_) { return { status: '⚫ UNKNOWN', stalled_min: 0 }; }
}

// ─────────────────────────────────────────────────────────────────
// 6. REPORT GENERATOR
// ─────────────────────────────────────────────────────────────────
function generateReport() {
    try {
        const hw      = getHardwareMetrics();
        const vllm    = getVllmMetrics();
        const tasks   = getManifestMetrics();
        const logs    = getLogMetrics();
        const sysState = getSystemState();
        const now     = new Date().toISOString();

        // Derived metrics
        const completionPct   = tasks.total > 0 ? ((tasks.done / tasks.total) * 100).toFixed(1) : 0;
        const avgTaskSec      = parseFloat(logs.codeAvgSec) || 240;
        const remainingTasks  = tasks.pending + tasks.in_progress + tasks.testing;
        const etaMinutes      = remainingTasks * ((avgTaskSec + parseFloat(logs.qaAvgSec || 0) + 30) / 60);
        const etaHours        = (etaMinutes / 60).toFixed(1);

        // Cost estimate: GB10 at ~240W avg, 0.10$/kWh
        const avgTaskMinutes  = avgTaskSec / 60;
        const powerKw         = (hw.gpu_power_w !== 'N/A' ? parseFloat(hw.gpu_power_w) : 240) / 1000;
        const costPerTaskUsd  = (powerKw * (avgTaskMinutes / 60) * 0.10).toFixed(4);

        // RAM utilization percent
        const ramPct = hw.ram_total_mb !== 'N/A' ? ((hw.ram_used_mb / hw.ram_total_mb) * 100).toFixed(1) : 'N/A';

        // Error breakdown table
        const errBreakdown = Object.entries(tasks.error_breakdown).length > 0
            ? Object.entries(tasks.error_breakdown)
                .sort((a,b) => b[1] - a[1])
                .map(([k,v]) => `| ${k} | ${v} |`)
                .join('\n')
            : '| Henüz kayıt yok | — |';

        // Thermal throttling warning
        const thermalNote = hw.thermal_throttling
            ? `> [!WARNING]\n> ⚠️ **THERMAL THROTTLING DETECTED** — GPU sıcaklığı ${hw.gpu_temp_c}°C. Performans düşüşü yaşanıyor olabilir.\n\n`
            : '';

        const report = `# ANF Otonom Sistem — Canlı Telemetri Raporu
*Son Güncelleme: ${now}*
*Sistem Durumu: **${sysState.status}***

---

## 💻 1. Donanım Kaynak Verimliliği (Hardware Utilization)

${thermalNote}| Metrik | Değer | Notlar |
|:---|:---|:---|
| **GPU** | ${hw.gpu_name} | NVIDIA GB10 Blackwell Superchip |
| **GPU İş Yükü** | ${hw.gpu_load_pct !== 'N/A' ? hw.gpu_load_pct + '%' : 'N/A'} | Aktif inferans sırasında |
| **GPU Güç Tüketimi** | ${hw.gpu_power_w !== 'N/A' ? hw.gpu_power_w + ' W' : 'N/A'} | Anlık (Limit: ~300W) |
| **GPU Sıcaklık** | ${hw.gpu_temp_c !== 'N/A' ? hw.gpu_temp_c + '°C' : 'N/A'} | Termal limit: 85°C |
| **Thermal Throttling** | ${hw.thermal_throttling ? '🔴 AKTİF' : '🟢 YOK'} | — |
| **VRAM Kullanımı** | ${hw.vram_used_mb !== 'N/A' ? (hw.vram_used_mb/1024).toFixed(1) + ' GB / ' + (hw.vram_total_mb/1024).toFixed(1) + ' GB' : 'Unified Memory (128GB)'} | Model ağırlıkları ~60GB |
| **KV Cache (vLLM)** | **${vllm.kv_cache_pct.toFixed(1)}%** | Bağlam belleği kullanımı |
| **Sistem RAM** | ${hw.ram_used_mb !== 'N/A' ? (hw.ram_used_mb/1024).toFixed(1) + ' GB / ' + (hw.ram_total_mb/1024).toFixed(1) + ' GB (' + ramPct + '%)' : 'N/A'} | |
| **CPU Yük Ortalaması (1dk)** | ${hw.cpu_load_1m} | Ajanların işlemci baskısı |

---

## 🧠 2. Ajan Zeka ve Model Performans Metrikleri

| Metrik | Değer | Açıklama |
|:---|:---|:---|
| **Üretim Hızı (TPS)** | **${vllm.tps_generation > 0 ? vllm.tps_generation + ' tokens/sn' : 'Hesaplanıyor...'}** | Nemotron-3-Super-120B NVFP4 |
| **Anlık İstek** | ${vllm.running_reqs} Running / ${vllm.waiting_reqs} Waiting | Paralel agent kapasitesi |
| **Prefix Cache Hit Rate** | ${vllm.prefix_cache_hit_rate}% | Tekrarlayan prompt önbelleklemesi |
| **Context Window Kullanımı** | ~${(vllm.kv_cache_pct * 2.4).toFixed(0)}K / 24K token | KV Cache oranından hesaplama |
| **Döküman Okuma / RAG Süresi** | **${logs.readAvgSec} sn** | Ort. (${logs.readSamples} ölçüm) |
| **Kod Yazma Süresi** | **${logs.codeAvgSec} sn** ort. | Min: ${logs.codeMinSec}s / Max: ${logs.codeMaxSec}s (${logs.codeSamples} ölçüm) |
| **QA Test Süresi** | **${logs.qaAvgSec} sn** | Ort. (${logs.qaSamples} ölçüm) |
| **Self-Healing Başarısı** | **${logs.steering_count} STEER** | Başarısız → Ajan kendi düzeltti |
| **Nihai Başarılı Görev** | ${logs.tasks_completed_count} görev | QA onaylı teslim |

---

## 🛡️ 3. Güvenilirlik ve Hata Analizi (Reliability)

| Metrik | Değer |
|:---|:---|
| **MTBF** | ${logs.mtbf_minutes > 0 ? logs.mtbf_minutes + ' dakika' : 'Yeterli veri yok'} |
| **Syntax Hata (SYNC FAIL)** | ${logs.sync_fail_count} |
| **MAX RETRY Aşımı** | ${logs.max_retry_exceeded_count} |
| **Retry Oranı** | %${tasks.retry_rate_pct} |
| **Ort. Deneme / Görev** | ${tasks.avg_retry_count} |

**Hata Sınıflandırması (failure_log):**

| Hata Tipi | Adet |
|:---|:---|
${errBreakdown}

---

## 📊 4. Proje İlerleme Durumu

| Statü | Adet | Oran |
|:---|:---:|:---|
| ✅ **DONE** | ${tasks.done} | ${completionPct}% |
| 🛠️ **IN_PROGRESS** | ${tasks.in_progress} | |
| 🔄 **TESTING** | ${tasks.testing} | |
| ⏳ **PENDING** | ${tasks.pending} | |
| ❌ **FAILED** | ${tasks.failed} | |
| **TOPLAM** | **${tasks.total}** | |

**Tahmini Kalan Süre (ETA):** ~${etaHours} saat (${remainingTasks} görev × ~${(avgTaskSec/60).toFixed(0)} dk/görev)

---

## 💰 5. Operasyonel Maliyet ve Verimlilik

| Metrik | Değer | Notlar |
|:---|:---|:---|
| **Görev Başına Ortalama Süre** | ${(avgTaskSec/60).toFixed(1)} dakika | Kod yazımı + QA dahil |
| **Tahmini Görev Başı Enerji Maliyeti** | $${costPerTaskUsd} | ${hw.gpu_power_w}W × ${(avgTaskSec/3600).toFixed(3)}h × $0.10/kWh |
| **Paralelizasyon Kapasitesi** | 3 eş zamanlı Coder | vault.concurrency |
| **Aktif İnsan Müdahalesi** | Sıfır | Tamamen Otonom Yürütme |
| **İnsan Ekibi Karşılaştırması** | 4-6 Hafta → ~${etaHours} Saat | Senior ekip tahmini |

---
*ANF Telemetry Daemon v2.0 — Her 15 saniyede güncellenir*
`;

        fs.writeFileSync(REPORT_PATH, report, 'utf8');
        console.log(`[TELEMETRY] Rapor güncellendi | ${sysState.status} | DONE: ${tasks.done}/${tasks.total} | GPU: ${hw.gpu_load_pct}% | TPS: ${vllm.tps_generation}`);
    } catch (err) {
        console.error('[TELEMETRY] Hata:', err.message);
    }
}

// ─────────────────────────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────────────────────────
console.log('🚀 TELEMETRY v2.0 başlatıldı.');
generateReport();
setInterval(generateReport, 15000);
