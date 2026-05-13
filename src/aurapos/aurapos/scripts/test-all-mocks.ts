#!/usr/bin/env ts-node
import { execSync } from 'child_process';

function runMockTests() {
  try {
    console.log('🔍 Running all mock tests...');
    execSync('pnpm test --filter "*mock*"', { stdio: 'inherit' });
    console.log('✅ All mock tests passed.');
  } catch (error) {
    console.error('❌ Mock test suite failed:', error);
    process.exit(1);
  }
}

runMockTests();