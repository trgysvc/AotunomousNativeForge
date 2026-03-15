'use strict';
const fs = require('node:fs');
const { ask, start, log, sendMessage } = require('./base-agent');

async function processTask(task) {
    log(`🧐 Kalite Kontrol: [${task.project_id}] ${task.task_id}`);
    const code = fs.readFileSync(task.file_path, 'utf8');

    const prompt = `
    Sen bir Kıdemli QA Mühendisisin. Aşağıdaki kodu denetle:
    PROJE: ${task.project_id}
    GÖREV: ${task.title}
    KOD:
    ${code}

    MANDATORY OUTPUT FORMAT (JSON ONLY):
    {
        "status": "PASSED" | "FAILED",
        "bugs": [
            { "id": 1, "description": "Hata detayı", "severity": "HIGH"|"MEDIUM"|"LOW", "line": 0 }
        ],
        "tests": [
            { "test_name": "Test Adı", "result": "PASS"|"FAIL", "reason": "Açıklama" }
        ],
        "summary": "Teknik değerlendirme özeti"
    }

    KURALLAR:
    - SADECE Native Node.js kullanılabilir (Express, Axios vb. YASAK).
    - JSON dosyalarında <br/> yasak.
    - Hata varsa FAILED dön.`;

    const res = await ask('TESTER', prompt, __dirname);
    let result = { status: 'FAILED', bugs: [{ description: 'Parse hatası oluştu.' }] };
    
    try {
        const match = res.match(/\{[\s\S]*\}/);
        if (match) result = JSON.parse(match[0]);
    } catch (e) {
        log(`❌ JSON Ayrıştırma Hatası: ${e.message}`);
    }

    if (result.status === 'PASSED') {
        sendMessage('ARCHITECT', 'TEST_PASSED', task);
    } else {
        const bugSummary = Array.isArray(result.bugs) 
            ? result.bugs.map(b => `[L:${b.line}] ${b.description}`).join(', ')
            : result.bugs;
        sendMessage('ARCHITECT', 'BUG_REPORT', { ...task, description: bugSummary });
    }
}

start('TESTER', processTask);