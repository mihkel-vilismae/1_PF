import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * @typedef {import('node:child_process').ChildProcessWithoutNullStreams} ChildProcessWithoutNullStreams
 */

/**
 * @typedef {object} ValidationServer
 * @property {ChildProcessWithoutNullStreams} child
 * @property {() => boolean} isReady
 * @property {() => string} getStdout
 * @property {() => string} getStderr
 */

/**
 * @typedef {object} RequestJsonResult
 * @property {number} status
 * @property {unknown} payload
 */

const repoRoot = process.cwd();
const tempDir = mkdtempSync(path.join(os.tmpdir(), 'view-e-validate-'));
const tempDbPath = path.join(tempDir, 'view-e-test.sqlite');
const envPath = path.join(repoRoot, '.env');

if (!existsSync(envPath)) {
  writeFileSync(
    envPath,
    [
      'user=test@example.com',
      'pw=test-password',
      `DOWNLOAD_DIR=${path.join(tempDir, 'downloads')}`,
      `DB_PATH=${tempDbPath}`,
      `LOG_DIR=${path.join(tempDir, 'logs')}`,
      `ICLOUDPD_COOKIE_DIR=${path.join(tempDir, 'cookies')}`,
      'DOWNLOAD_RECENT=10',
      'DISPLAY_SECONDS=15',
      'ALLOW_MOCK_DOWNLOAD=true',
    ].join('\n') + '\n',
    'utf8',
  );
}

/**
 * @returns {ValidationServer}
 */
function startServer() {
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    cwd: repoRoot,
    env: { ...process.env, PORT: '4312' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let ready = false;
  let stdoutBuffer = '';
  let stderrBuffer = '';

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdoutBuffer += text;
    if (text.includes('listening')) {
      ready = true;
    }
  });
  child.stderr.on('data', (chunk) => {
    stderrBuffer += chunk.toString();
  });

  return { child, isReady: () => ready, getStdout: () => stdoutBuffer, getStderr: () => stderrBuffer };
}

/**
 * @param {ValidationServer} server
 * @param {number} [timeoutMs]
 * @returns {Promise<void>}
 */
async function waitForServer(server, timeoutMs = 8000) {
  const start = Date.now();
  while (!server.isReady()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Server did not become ready.\nSTDOUT:\n${server.getStdout()}\nSTDERR:\n${server.getStderr()}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<RequestJsonResult>}
 */
async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  return { status: response.status, payload };
}

/**
 * @param {unknown} condition
 * @param {string} message
 * @returns {void}
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @returns {Promise<void>}
 */
async function main() {
  const server = startServer();
  try {
    await waitForServer(server);

    let result = await requestJson('http://127.0.0.1:4312/api/database-viewer/verify', { method: 'POST', body: '{}' });
    assert(result.status === 200, `Verify endpoint failed before DB creation: ${JSON.stringify(result)}`);
    assert(result.payload?.verificationPassed === false, 'Verify should fail before DB exists.');

    result = await requestJson('http://127.0.0.1:4312/api/database-viewer/connect', { method: 'POST', body: '{}' });
    assert(result.status === 200, `Connect endpoint failed before DB creation: ${JSON.stringify(result)}`);
    assert(result.payload?.connected === false, 'Connect should remain blocked before DB exists.');

    result = await requestJson('http://127.0.0.1:4312/api/init/database/recreate-empty', {
      method: 'POST',
      body: JSON.stringify({ confirm: true, action: 'recreate-db' }),
    });
    assert(result.status === 200, `Recreate-empty failed: ${JSON.stringify(result)}`);

    result = await requestJson('http://127.0.0.1:4312/api/database-viewer/tables');
    assert(result.status === 200, `Tables endpoint failed on empty DB: ${JSON.stringify(result)}`);
    assert(Array.isArray(result.payload?.objects), 'Tables response should include objects array.');

    result = await requestJson('http://127.0.0.1:4312/api/database-viewer/rows', {
      method: 'POST',
      body: JSON.stringify({ tableName: 'missing_table', page: 0, pageSize: 9999 }),
    });
    assert(result.status >= 400, 'Rows endpoint should fail for invalid table name.');

    result = await requestJson('http://127.0.0.1:4312/api/database-viewer/logging/start', { method: 'POST', body: '{}' });
    assert(result.status === 200, `Logging start failed: ${JSON.stringify(result)}`);
    assert(result.payload?.logging?.active === true, 'Logging should be active after start.');

    await requestJson('http://127.0.0.1:4312/api/database-viewer/tables');

    result = await requestJson('http://127.0.0.1:4312/api/database-viewer/logging/stop', { method: 'POST', body: '{}' });
    assert(result.status === 200, `Logging stop failed: ${JSON.stringify(result)}`);
    assert(result.payload?.logging?.active === false, 'Logging should be inactive after stop.');
    assert((result.payload?.logging?.entryCount ?? 0) >= 1, 'Logging stop should return at least one captured event.');

    console.log(JSON.stringify({ status: 'ok', message: 'View E validation passed.', tempDbPath }, null, 2));
  } finally {
    server.child.kill('SIGTERM');
    await once(server.child, 'exit').catch(() => {});
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
