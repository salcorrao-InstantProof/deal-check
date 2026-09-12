'use strict';

// Calculation checks only. This script never creates a browser or storage shim.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, 'deal_check.html'), 'utf8');
const scripts = [...html.matchAll(/<script id="([^"]+)">([\s\S]*?)<\/script>/g)];
const core = scripts.find(([_, id]) => id === 'deal-core')[2];
const lockedEngine = core.slice(0, core.indexOf('function formatValue('));
const expectedHash = 'd81a964579480019dddd7948c73fb512eaa04d157d3c2d9568243f4b8a307ee9';
const actualHash = crypto.createHash('sha256').update(lockedEngine).digest('hex');
assert.equal(actualHash, expectedHash, 'Locked calculation source changed');
for (const [_, id, source] of scripts) new vm.Script(source, { filename: id });

const context = vm.createContext({});
vm.runInContext(core, context);
const engine = context.DealCheck;
const results = engine.runTests();
const lines = [
  'Node calculation tests only. Browser and persistence verification: NOT RUN.',
  'Locked calculation source unchanged: PASS',
  'Locked engine SHA-256: ' + actualHash,
  'JavaScript syntax: PASS (core and UI; UI not executed)',
  'Payment-attribution tolerance: $0.01; residuals are not discarded.',
  ''
];
for (const result of results) {
  lines.push((result.pass ? 'PASS ' : 'FAIL ') + result.name);
  if (result.failures.length) lines.push('  Failed: ' + result.failures.join(', '));
  lines.push('  ' + engine.attributionStatus(result.result.explanation));
}
lines.push(results.filter(result => result.pass).length + '/8 required cases passed', '');

let guardFailures = 0;
for (const [label, residual, expected] of [
  ['+$0.01000000 is within tolerance', 0.01, true],
  ['-$0.01000000 is within tolerance', -0.01, true],
  ['+$0.01010000 is rejected', 0.0101, false],
  ['-$0.01010000 is rejected', -0.0101, false],
  ['+$25.00000000 is rejected', 25, false],
  ['Nonfinite residual is rejected', NaN, false]
]) {
  const explanation = { steps: [], observedChange: residual, modelChange: 0, reason: null };
  const passed = engine.attributionCheck(explanation).pass === expected;
  if (!passed) guardFailures++;
  lines.push((passed ? 'PASS ' : 'FAIL ') + 'guard: ' + label);
}

lines.push('', 'ACTUAL REPORT OUTPUT FROM EACH CONSTRUCTED CASE');
for (const result of results) {
  lines.push('', result.name, 'INPUT:', JSON.stringify(result.input, null, 2), 'OUTPUT:', result.output);
}
const output = lines.join('\n') + '\n';
if (process.argv.includes('--capture')) {
  fs.writeFileSync(path.join(__dirname, 'LOGIC_TEST_OUTPUT.txt'), output);
}
process.stdout.write(output);
if (results.some(result => !result.pass) || guardFailures) process.exitCode = 1;
