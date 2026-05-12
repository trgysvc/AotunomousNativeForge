#!/usr/bin/env ts-node
import { execSync } from 'child_process';

export {};

function runMockTests(): void {
  try {
    execSync(['pnpm', 'test', '--filter', '*mock*'], { stdio: 'inherit', shell: false });
    console.log('✅ All mock tests passed');
  } catch (err) {
    const error = err as Error;
    console.error('❌ Mock tests failed:', error.message);
    process.exit(1);
  }
}

runMockTests();