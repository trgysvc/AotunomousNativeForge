'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { ask, start, log, sendMessage } = require('./base-agent');

const SRC = path.join(__dirname, '..', 'src');

async function processTask(task) {
    const projectPath = path.join(SRC, task.project_id);
    const configPath = path.join(projectPath, 'config.json');
    
    // Proje bazlı anahtarları oku (Güvenlik için tokenları temizle)
    let configStr = '{}';
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.github) config.github.token = 'REDACTED';
        if (config.supabase) config.supabase.key = 'REDACTED'; // Varsa temizle
        configStr = JSON.stringify(config, null, 2);
    }

    let prompt = "";
    if (task.type === 'FIX_CODE') {
        log(`🔧 Hata Düzeltiliyor: [${task.project_id}] ${task.task_id}`);
        const currentCode = fs.readFileSync(task.file_path, 'utf8');
        prompt = `
        PROJE: ${task.project_id}
        KİMLİK VERİLERİ: ${configStr}
        DOSYA YOLU: ${task.file_path}
        
        MEVCUT HATALI KOD:
        ${currentCode}
        
        HATA RAPORU:
        ${task.description}
        
        Lütfen hatayı düzelt ve sadece güncel Node.js kodunu döndür.`;
    } else {
        log(`✍️ Kod Yazılıyor: [${task.project_id}] ${task.title}`);
        prompt = `
        PROJE: ${task.project_id}
        KİMLİK VERİLERİ (Supabase/GitHub): ${configStr}
        GÖREV: ${task.desc}
        BAŞLIK: ${task.title}
        
        Lütfen sadece Node.js native kodunu döndür. Markdown kullanma.`;
    }

    const code = await ask('CODER', prompt, __dirname);
    
    const filePath = task.file_path || path.join(projectPath, `${task.task_id}.js`);
    if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    
    fs.writeFileSync(filePath, code, 'utf-8');
    log(`💾 Kod Mühürlendi: ${filePath}`);
    
    sendMessage('ARCHITECT', 'CODE_FINISHED', { ...task, file_path: filePath });
}

start('CODER', processTask);