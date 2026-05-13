import { readFileSync } from 'fs';
import { resolve } from 'path';

function main() {
  const envPath = resolve(process.cwd(), '.env');
  let envReady = false;
  try {
    readFileSync(envPath, 'utf-8');
    envReady = true;
  } catch (_) {
    // file not found or unreadable
  }
  console.log(`Sync status: ${envReady ? 'READY' : 'MISSING .env'}`);
}

main();