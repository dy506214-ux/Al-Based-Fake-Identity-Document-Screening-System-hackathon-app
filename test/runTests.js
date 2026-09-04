/**
 * Master Test Runner for SIH26188
 * Runs all phase tests sequentially and reports results
 */

const { execSync } = require('child_process');
const path = require('path');

const phases = [
    { name: 'Phase 1 - Stabilization',          file: 'test/phase1.test.js' },
    { name: 'Phase 2 - Screening Pipeline',      file: 'test/phase2.test.js' },
    { name: 'Phase 3 - Face Verification',       file: 'test/phase3.test.js' },
];

let passed = 0;
let failed = 0;

console.log('\n========================================================');
console.log('   SIH26188 - AI Identity & Document Screening System   ');
console.log('                 MASTER TEST RUNNER                      ');
console.log('========================================================\n');

for (const phase of phases) {
    try {
        console.log(`\n▶ Running: ${phase.name}`);
        console.log('─'.repeat(55));
        const output = execSync(`node ${phase.file}`, {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8',
            timeout: 60000
        });
        console.log(output.trim());
        console.log(`✅ ${phase.name}: PASSED`);
        passed++;
    } catch (err) {
        console.error(`❌ ${phase.name}: FAILED`);
        console.error(err.stdout || err.message);
        failed++;
    }
}

console.log('\n========================================================');
console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('========================================================\n');

if (failed > 0) {
    process.exit(1);
}
