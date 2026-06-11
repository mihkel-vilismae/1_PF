/**
 * View E validation hermeticity guard.
 *
 * validate:view-e must use proof-owned temporary DB/env state instead of any
 * operator .env or ambient DB_PATH. Otherwise a local existing DB can make the
 * "verify before DB creation" assertion fail on a clean Git tree.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, '.env');

function parseLastJsonObject(stdout) {
  const start = stdout.lastIndexOf('{\n  "status"');
  assert.notEqual(start, -1, `could not find status JSON in stdout:\n${stdout}`);
  return JSON.parse(stdout.slice(start));
}

test('validate:view-e ignores repo .env and ambient DB_PATH by using proof-owned temp env', { timeout: 30000 }, () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), 'view-e-hermetic-test-'));
  const backupPath = path.join(tempRoot, 'repo.env.backup');
  const hadEnv = existsSync(envPath);
  if (hadEnv) copyFileSync(envPath, backupPath);

  try {
    const hostileDbPath = path.join(tempRoot, 'hostile-existing.sqlite');
    const hostileLogDir = path.join(tempRoot, 'hostile-logs');
    const recreate = spawnSync('python', ['server/scripts/sqlite_admin.py', 'recreate', hostileDbPath, 'schema.sql'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(recreate.status, 0, recreate.stderr || recreate.stdout);
    assert.equal(existsSync(hostileDbPath), true);

    writeFileSync(envPath, [
      'user=hostile@example.com',
      'pw=hostile-password-that-must-not-appear-in-validation-output',
      `DOWNLOAD_DIR=${path.join(tempRoot, 'hostile-downloads')}`,
      `DB_PATH=${hostileDbPath}`,
      `LOG_DIR=${hostileLogDir}`,
      `ICLOUDPD_COOKIE_DIR=${path.join(tempRoot, 'hostile-cookies')}`,
      'DOWNLOAD_RECENT=999',
      'DISPLAY_SECONDS=999',
      'ALLOW_MOCK_DOWNLOAD=false',
    ].join('\n') + '\n', 'utf8');

    const result = spawnSync('node', ['scripts/validate-view-e.mjs'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        INIT_ENV_FILE: envPath,
        DB_PATH: hostileDbPath,
        LOG_DIR: hostileLogDir,
        VALIDATE_VIEW_E_PORT: '4318',
      },
      timeout: 30000,
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(result.stdout.includes('hostile-password-that-must-not-appear-in-validation-output'), false);
    assert.equal(result.stderr.includes('hostile-password-that-must-not-appear-in-validation-output'), false);

    const payload = parseLastJsonObject(result.stdout);
    assert.equal(payload.status, 'ok');
    assert.equal(payload.envIsolation.envFileSource, 'proof_owned_temp_env');
    assert.equal(payload.envIsolation.ignoredRepoEnv, true);
    assert.equal(payload.envIsolation.ignoredAmbientDbPath, true);
    assert.notEqual(payload.tempDbPath, hostileDbPath);
    assert.match(payload.envIsolation.tempEnvPath, /view-e-validation\.env$/);
    assert.equal(payload.envIsolation.port, 4318);

    const currentEnvText = readFileSync(envPath, 'utf8');
    assert.match(currentEnvText, /hostile-password-that-must-not-appear-in-validation-output/);
  } finally {
    if (hadEnv) {
      copyFileSync(backupPath, envPath);
    } else if (existsSync(envPath)) {
      unlinkSync(envPath);
    }
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
