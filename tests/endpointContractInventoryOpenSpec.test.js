/**
 * Endpoint contract OpenSpec drift guard.
 *
 * The docs must list every same-origin `METHOD /api/...` route registered by
 * the backend source, so external callers and future slices have an accurate
 * route-surface map without starting the API server.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { collectEndpointInventory } from '../tools/collect-endpoint-contract-inventory.mjs';

const openSpecPath = 'docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('endpoint inventory OpenSpec and helper command exist', () => {
  assert.equal(existsSync(openSpecPath), true);
  assert.equal(existsSync('tools/collect-endpoint-contract-inventory.mjs'), true);
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['contract:endpoints'], 'node tools/collect-endpoint-contract-inventory.mjs');
  assert.equal(
    packageJson.scripts['contract:endpoints:check'],
    'node tools/collect-endpoint-contract-inventory.mjs --check-doc docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md',
  );
});

test('endpoint inventory helper discovers all expected API route surfaces', () => {
  const endpoints = collectEndpointInventory();
  assert.ok(endpoints.length >= 70, `expected broad API inventory, got ${endpoints.length}`);
  for (const required of [
    'GET /api/version',
    'POST /api/init/verify-env',
    'GET /api/auth/new/status',
    'POST /api/runtime/download/real-run',
    'GET /api/runtime/playback/current',
    'POST /api/native-playback/start-current',
    'GET /api/runtime/projection/live',
    'POST /api/testing/live-windows-native-video/seed',
    'POST /api/runtime-truth',
  ]) {
    assert.ok(endpoints.some((endpoint) => endpoint.routeKey === required), `missing endpoint: ${required}`);
  }
});

test('OpenSpec lists every discovered route key', () => {
  const result = spawnSync('node', ['tools/collect-endpoint-contract-inventory.mjs', '--check-doc', openSpecPath], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /"status": "PASSED"/);
});

test('endpoint OpenSpec preserves architecture and proof-honesty boundaries', () => {
  const text = read(openSpecPath);
  assert.match(text, /same-origin API server/);
  assert.match(text, /Real provider routes remain opt-in/);
  assert.match(text, /Test\/proof endpoints are local proof surfaces/);
  assert.match(text, /Windows Task Scheduler is not part of PF_login scope/);
  assert.match(text, /Raspberry OS runtime behavior remains unimplemented/);
  assert.match(text, /does not prove:[\s\S]*Production provider\/iCloud continuation/);
});
