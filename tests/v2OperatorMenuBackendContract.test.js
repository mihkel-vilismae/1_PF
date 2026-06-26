import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { V2_OPERATOR_MENU_BACKEND_CONTRACT, findV2BackendContractRow } from '../dashboard/services/v2OperatorMenuBackendContract.ts';

const serverIndex = readFileSync('server/index.ts', 'utf8');
const endpointInventory = readFileSync('docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md', 'utf8');
const openspec = readFileSync('docs/20_architecture_and_specs/openspec/v2_operator_menu_backend_contract_openspec.md', 'utf8');

function routeKey(method, path) {
  return `${method} ${path}`;
}

test('V2 backend contract rows are explicit about support and non-claims', () => {
  assert.ok(V2_OPERATOR_MENU_BACKEND_CONTRACT.length >= 20);
  for (const row of V2_OPERATOR_MENU_BACKEND_CONTRACT) {
    assert.ok(row.nodeId, 'row has nodeId');
    assert.ok(row.label, `row ${row.nodeId} has label`);
    assert.match(row.support, /^(existing-backend|planned-v2|v3|visual-only)$/);
    assert.ok(row.source, `row ${row.nodeId} has source`);
    assert.ok(row.nonClaim, `row ${row.nodeId} has non-claim`);
    if (row.support === 'existing-backend') {
      assert.ok(row.endpoints?.length, `existing backend row ${row.nodeId} lists endpoints`);
    }
  }
});

test('V2 existing-backend endpoint mappings point to routes already present in server/index or endpoint inventory', () => {
  const existingRows = V2_OPERATOR_MENU_BACKEND_CONTRACT.filter((row) => row.support === 'existing-backend');
  assert.ok(existingRows.length >= 10);

  for (const row of existingRows) {
    for (const endpoint of row.endpoints ?? []) {
      const key = routeKey(endpoint.method, endpoint.path);
      const presentInServer = serverIndex.includes(`'${key}'`) || serverIndex.includes(`"${key}"`);
      const presentInInventory = endpointInventory.includes(`\`${endpoint.path}\``) || endpointInventory.includes(key);
      assert.ok(presentInServer || presentInInventory, `${key} for ${row.nodeId} is present in server/index or endpoint inventory`);
      assert.ok(endpoint.purpose, `${key} has purpose`);
    }
  }
});

test('V2 contract keeps known missing functionality planned instead of falsely wired', () => {
  for (const [nodeId, support] of [
    ['startup.database.backup', 'planned-v2'],
    ['startup.env.open', 'planned-v2'],
    ['troubleshooting.manual.backupLogs', 'planned-v2'],
    ['troubleshooting.manual.clearLogs', 'planned-v2'],
    ['troubleshooting.errorPipeline', 'planned-v2'],
    ['recovery', 'planned-v2'],
    ['statistics', 'v3'],
  ]) {
    const row = findV2BackendContractRow(nodeId);
    assert.ok(row, `${nodeId} row exists`);
    assert.equal(row.support, support, `${nodeId} is ${support}`);
    assert.equal(row.endpoints, undefined, `${nodeId} must not list fake endpoints`);
  }
});

test('V2 backend contract OpenSpec records test-first and non-implementation boundaries', () => {
  assert.match(openspec, /V2 Operator Menu backend contract/);
  assert.match(openspec, /test-first/);
  assert.match(openspec, /existing-backend/);
  assert.match(openspec, /planned-v2/);
  assert.match(openspec, /must not expose Apple ID, password, 2FA, cookies, or session secrets/);
});
