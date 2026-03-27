'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { ask, start, log, sendMessage, safeWriteFile } = require('./base-agent');

const SRC = path.join(__dirname, '..', 'src');

/**
 * Path Authority: Ensures the file path is within the project directory
 */
function getAuthorizedPath(projectPath, requestedPath) {
    const absolutePath = path.resolve(projectPath, requestedPath);
    if (!absolutePath.startsWith(path.resolve(projectPath))) {
        throw new Error(`🛡️ GÜVENLİK İHLALİ: Geçersiz dosya yolu (Dizin dışına çıkma denemesi): ${requestedPath}`);
    }
    return absolutePath;
}

/**
 * Project Tree: Generates a simple directory map for the agent
 */
function getProjectTree(projectPath) {
    try {
        const files = fs.readdirSync(projectPath, { recursive: true });
        return files.slice(0, 50).join('\n'); // İlk 50 dosyayı döndür
    } catch (e) { return "Dizin okunamadı."; }
}

async function processTask(task) {
    const projectPath = path.join(SRC, task.project_id);
    if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath, { recursive: true });

    const configPath = path.join(projectPath, 'config.json');
    
    // Proje bazlı anahtarları oku (Güvenlik için tokenları temizle)
    let configStr = '{}';
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.github) config.github.token = 'REDACTED';
        if (config.supabase) config.supabase.key = 'REDACTED';
        configStr = JSON.stringify(config, null, 2);
    }

    // Dil algılama
    const ext = path.extname(task.file_path || (task.task_id + '.js')).toLowerCase();
    const langMap = {
        '.js': 'Node.js',
        '.ts': 'TypeScript',
        '.tsx': 'React/Next.js (TypeScript)',
        '.swift': 'Swift (Apple Silicon Optimized)',
        '.py': 'Python',
        '.sql': 'PostgreSQL/Supabase SQL',
        '.html': 'HTML5',
        '.css': 'Tailwind CSS / CSS3'
    };
    const targetLang = langMap[ext] || 'Source Code';

    const projectTree = getProjectTree(projectPath);

    // Dökümantasyon Bağlamı
    const docContextSection = task.doc_context ? `
    REFERANS DÖKÜMANTASYON STANDARTLARI:
    ${task.doc_context}` : "";

    const contextHeader = `
    CURRENT WORKING DIRECTORY: ${projectPath}
    PROJECT STRUCTURE:
    ${projectTree}
    `;

    let prompt = "";
    if (task.type === 'FIX_CODE') {
        log(`🔧 Hata Düzeltiliyor (${targetLang}): [${task.project_id}] ${task.task_id}`);
        const currentCode = fs.readFileSync(task.file_path, 'utf8');
        prompt = `
        ${contextHeader}
        PROJE: ${task.project_id}
        DİL: ${targetLang}
        KİMLİK VERİLERİ: ${configStr}
        DOSYA YOLU: ${task.file_path}
        ${docContextSection}
        
        MEVCUT HATALI KOD:
        ${currentCode}
        
        HATA RAPORU (OBSERVATION):
        ${task.description}
        
        Lütfen sadece güncel ${targetLang} kodunu döndür. Markdown bloğu kullan.`;
    } else {
        log(`✍️ Kod Yazılıyor (${targetLang}): [${task.project_id}] ${task.title}`);
        prompt = `
        ${contextHeader}
        PROJE: ${task.project_id}
        DİL: ${targetLang}
        KİMLİK VERİLERİ (Supabase/GitHub): ${configStr}
        GÖREV: ${task.desc}
        BAŞLIK: ${task.title}
        ${docContextSection}
        
        Lütfen sadece ${targetLang} kodunu döndür. Markdown bloğu kullan.`;
    }

    try {
        const code = await ask('CODER', prompt, __dirname);
        
        // Path Authority Check
        const targetPath = task.file_path || `${task.task_id}${ext}`;
        const filePath = getAuthorizedPath(projectPath, targetPath);
        
        safeWriteFile(filePath, code);
        
        sendMessage('ARCHITECT', 'CODE_FINISHED', { ...task, file_path: filePath });
    } catch (err) {
        log(`❌ CODER HATASI: ${err.message}`);
        throw err;
    }
}

start('CODER', processTask);