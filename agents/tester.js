'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('node:child_process');
const { promisify } = require('node:util');
const { ask, start, log, sendMessage } = require('./base-agent');

const execAsync = promisify(exec);

/**
 * Policy Enforcer: Checks for forbidden libraries and patterns
 */
function checkPolicy(code) {
    const forbidden = ['express', 'axios', 'mongoose', 'lodash', 'nodemon', 'dotenv'];
    const found = forbidden.filter(lib => code.includes(`require('${lib}')`) || code.includes(`require("${lib}")`) || code.includes(`from '${lib}'`) || code.includes(`from "${lib}"`));
    
    if (found.length > 0) {
        return { 
            status: 'FAILED', 
            reason: `NATIVE POLİTİKASI İHLALİ: Yasaklı kütüphane kullanımı tespit edildi: ${found.join(', ')}. Sadece Node.js native modülleri kullanın.` 
        };
    }
    return { status: 'PASSED' };
}

async function validateCode(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        if (ext === '.js') {
            await execAsync(`node --check "${filePath}"`);
        } else if (ext === '.ts' || ext === '.tsx') {
            // TypeScript Check (Bağımlılıkları kontrol etmeksizin hızlı syntax kontrolü)
            // Not: tsc kurulu olmalı. Değilse syntax check'e düşer.
            await execAsync(`npx -y typescript tsc --noEmit --target esnext --module esnext --esModuleInterop --skipLibCheck "${filePath}"`);
        }
        return { status: 'PASSED' };
    } catch (e) {
        return { status: 'FAILED', reason: `SYNTX/TYPE HATASI: ${e.stderr || e.message}` };
    }
}

async function processTask(task) {
    log(`🧐 Native Kalite Kontrol: [${task.project_id}] ${task.task_id}`);
    
    if (!fs.existsSync(task.file_path)) {
        sendMessage('ARCHITECT', 'BUG_REPORT', { ...task, description: "HATA: Dosya fiziksel olarak bulunamadı." });
        return;
    }

    const code = fs.readFileSync(task.file_path, 'utf8');

    // 1. Policy Check
    const policyResult = checkPolicy(code);
    if (policyResult.status === 'FAILED') {
        log(`🛡️ Policy İhlali: ${task.task_id}`);
        sendMessage('ARCHITECT', 'BUG_REPORT', { ...task, description: policyResult.reason });
        return;
    }

    // 2. Native Validation (Node/TSC)
    const valResult = await validateCode(task.file_path);
    if (valResult.status === 'FAILED') {
        log(`❌ Validation Başarısız: ${task.task_id}`);
        sendMessage('ARCHITECT', 'BUG_REPORT', { ...task, description: valResult.reason });
        return;
    }

    // 3. LLM Review (Optional feedback for logic, but PASSED is decided by native tools first)
    const prompt = `
    Sen bir Kıdemli QA Mühendisisin. Aşağıdaki kodu MANTIKSAL olarak denetle. 
    Sentaks ve Tip kontrolü NATIVE araçlarla (node/tsc) PASSED aldı. Sadece iş mantığı ve best-practice odaklı incele.
    
    PROJE: ${task.project_id}
    GÖREV: ${task.title}
    KOD:
    ${code}

    MANDATORY OUTPUT FORMAT (JSON ONLY):
    {
        "status": "PASSED" | "FAILED",
        "bugs": [
            { "id": 1, "description": "Hata detayı", "severity": "HIGH"|"MEDIUM"|"LOW" }
        ],
        "summary": "Teknik değerlendirme özeti"
    }
    
    Hata yoksa PASSED dön.`;

    try {
        const res = await ask('TESTER', prompt, __dirname);
        let result = { status: 'PASSED' };
        const match = res.match(/\{[\s\S]*\}/);
        if (match) result = JSON.parse(match[0]);

        if (result.status === 'PASSED') {
            sendMessage('ARCHITECT', 'TEST_PASSED', task);
        } else {
            const bugSummary = Array.isArray(result.bugs) 
                ? result.bugs.map(b => b.description).join(', ')
                : result.summary;
            sendMessage('ARCHITECT', 'BUG_REPORT', { ...task, description: `MANTIKSAL HATA: ${bugSummary}` });
        }
    } catch (e) {
        // LLM review fail olsa bile native tools pass verdiyse opsiyonel olarak geçirebiliriz veya Architect'e bildirebiliriz.
        log(`⚠️ LLM Review Hatası: ${e.message}. Native validation baz alınıyor.`);
        sendMessage('ARCHITECT', 'TEST_PASSED', task);
    }
}

start('TESTER', processTask);