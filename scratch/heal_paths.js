const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/workspaces/AutonomousNativeForge/src/aurapos';
const QUEUE_DIR = '/workspaces/AutonomousNativeForge/queue';
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'manifest.json');

function normalizePath(p) {
    if (!p) return p;
    let clean = p;
    // Remove absolute prefix
    const absolutePrefix = '/workspaces/AutonomousNativeForge/src/aurapos/';
    if (clean.startsWith(absolutePrefix)) {
        clean = clean.substring(absolutePrefix.length);
    }
    // Remove redundant 'aurapos/' prefixes
    while (clean.startsWith('aurapos/')) {
        clean = clean.substring(8);
    }
    return clean;
}

// 1. Heal manifest.json
if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    if (manifest.tasks) {
        manifest.tasks.forEach(t => {
            t.file_path = normalizePath(t.file_path);
        });
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log('✅ manifest.json healed.');
    }
}

// 2. Heal queue files
function healQueue(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            healQueue(fullPath);
        } else if (file.endsWith('.json')) {
            try {
                const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                let changed = false;
                if (data.file_path) {
                    const old = data.file_path;
                    data.file_path = normalizePath(data.file_path);
                    if (old !== data.file_path) changed = true;
                }
                if (data.project_manifest && data.project_manifest.tasks) {
                    data.project_manifest.tasks.forEach(t => {
                        const old = t.file_path;
                        t.file_path = normalizePath(t.file_path);
                        if (old !== t.file_path) changed = true;
                    });
                }
                if (changed) {
                    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
                    console.log(`✅ Healed queue file: ${file}`);
                }
            } catch (e) {
                console.error(`❌ Failed to heal ${file}: ${e.message}`);
            }
        }
    });
}

healQueue(QUEUE_DIR);
console.log('🚀 Factory Path Healing Complete.');
