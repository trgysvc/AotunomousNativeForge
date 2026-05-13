import { promises as fs } from 'fs';
import path from 'path';

// Define hardware modules to test
const hardwareModules = [
  { name: 'payment-terminal', path: '../packages/hardware/payment-terminal/mock-driver' },
  { name: 'printer', path: '../packages/hardware/printer/mock-driver' },
  { name: 'drawer', path: '../packages/hardware/drawer/mock-driver' },
  { name: 'display', path: '../packages/hardware/display/mock-driver' },
  { name: 'barcode', path: '../packages/hardware/barcode/mock-driver' },
  { name: 'scale', path: '../packages/hardware/scale/mock-driver' },
];

async function importMock(modulePath: string) {
  // Use dynamic import to allow better error handling
  return await import(modulePath);
}

async function testMock(name: string, mod: any) {
  console.log(`\n🔧 Testing ${name} mock driver...`);
  try {
    // Attempt to call any exported init-like function if present
    if (typeof mod.init === 'function') {
      await mod.init();
      console.log(`  ✅ ${name}.init() succeeded`);
    }
    // Attempt to call any exported execute/run-like function if present
    if (typeof mod.execute === 'function') {
      await mod.execute();
      console.log(`  ✅ ${name}.execute() succeeded`);
    }
    if (typeof mod.run === 'function') {
      await mod.run();
      console.log(`  ✅ ${name}.run() succeeded`);
    }
    // If no known testable functions, just verify the module is an object
    if (mod && typeof mod === 'object' && !Array.isArray(mod)) {
      console.log(`  ✅ ${name} module loaded successfully (${Object.keys(mod).length} exports)`);
    }
  } catch (err) {
    console.error(`  ❌ ${name} test failed:`, err);
    throw err;
  }
}

async function runAllTests() {
  console.log('🚀 Starting mock driver test suite...\n');
  const failures: string[] = [];

  for (const { name, path: modulePath } of hardwareModules) {
    try {
      const mod = await importMock(modulePath);
      await testMock(name, mod);
    } catch (err) {
      failures.push(name);
    }
  }

  console.log('\n🏁 Test suite finished.');
  if (failures.length === 0) {
    console.log('✅ All mock drivers passed!');
    process.exit(0);
  } else {
    console.error(`❌ ${failures.length} mock driver(s) failed:`, failures.join(', '));
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(2);
  });
} else {
  // Export for potential programmatic use
  export { runAllTests };
}