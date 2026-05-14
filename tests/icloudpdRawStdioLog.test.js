/*
 * Verifies opt-in raw iCloudPD stdout/stderr capture remains isolated from
 * normal sanitized auth outputs, API-facing payloads, and default execution.
 */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import test from 'node:test';

import { createIcloudpdRawStdioLogger, resolveIcloudpdRawStdioLogPath } from '../server/auth/icloudpdRawStdioLog.ts';
import { runCommand } from '../server/auth/newAuth/newAuthCommandRunner.ts';
import { createIcloudpdProcessRunner } from '../server/auth/providers/icloudpdProcessRunner.ts';
import { logoutNewAuthSession, startNewAuthLogin } from '../server/auth/newAuthService.ts';

const RUNTIME_TEST_DIR = path.join(process.cwd(), 'runtime_data', 'private_logs', 'test', 'raw-stdio');

/*
 * Runs a callback with raw iCloudPD logging environment isolated from the
 * developer's current shell settings.
 */
async function withRawLogEnv(rawLogPath, callback) {
  const previousEnabled = process.env.ICLOUDPD_RAW_STDIO_LOG;
  const previousPath = process.env.ICLOUDPD_RAW_STDIO_LOG_PATH;
  process.env.ICLOUDPD_RAW_STDIO_LOG = '1';
  process.env.ICLOUDPD_RAW_STDIO_LOG_PATH = rawLogPath;
  try {
    return await callback();
  } finally {
    if (previousEnabled === undefined) {
      delete process.env.ICLOUDPD_RAW_STDIO_LOG;
    } else {
      process.env.ICLOUDPD_RAW_STDIO_LOG = previousEnabled;
    }
    if (previousPath === undefined) {
      delete process.env.ICLOUDPD_RAW_STDIO_LOG_PATH;
    } else {
      process.env.ICLOUDPD_RAW_STDIO_LOG_PATH = previousPath;
    }
  }
}

/*
 * Creates a fake NEW AUTH child process that emits provider output without
 * launching iCloudPD or touching real auth state.
 */
function commandSpawnerWithOutput({ stdout = '', stderr = '', exitCode = 0 }) {
  return () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => true;
    child.unref = () => {};

    setImmediate(() => {
      if (stdout) child.stdout.write(stdout);
      if (stderr) child.stderr.write(stderr);
      child.emit('close', exitCode, null);
    });

    return child;
  };
}

/*
 * Verifies the raw-sensitive sink is disabled unless explicitly requested.
 */
test('raw icloudpd stdio logging is disabled by default', async () => {
  const rawLogPath = path.join('runtime_data', 'private_logs', 'test', 'raw-stdio', `disabled-${Date.now()}.log`);
  const fullPath = path.resolve(process.cwd(), rawLogPath);
  await rm(path.dirname(fullPath), { recursive: true, force: true });

  const logger = createIcloudpdRawStdioLogger({
    env: {
      ICLOUDPD_RAW_STDIO_LOG: '0',
      ICLOUDPD_RAW_STDIO_LOG_PATH: rawLogPath,
    },
  });

  logger.write('stdout', 'raw provider output that must not be captured by default');

  assert.equal(logger.enabled, false);
  assert.equal(existsSync(fullPath), false);
});

/*
 * Verifies configured raw log paths cannot escape runtime_data isolation.
 */
test('raw icloudpd stdio log path must stay under runtime_data', () => {
  const resolved = resolveIcloudpdRawStdioLogPath({
    ICLOUDPD_RAW_STDIO_LOG: '1',
    ICLOUDPD_RAW_STDIO_LOG_PATH: '..\\outside-raw-stdio.log',
  });

  assert.equal(resolved, null);
});

/*
 * Verifies a runtime_data path is still rejected unless it stays in private_logs
 * with a .log extension.
 */
test('raw icloudpd stdio log path rejects non-private runtime media paths', () => {
  const resolved = resolveIcloudpdRawStdioLogPath({
    ICLOUDPD_RAW_STDIO_LOG: '1',
    ICLOUDPD_RAW_STDIO_LOG_PATH: path.join('runtime_data', 'downloads', 'raw-stdio.jpg'),
  });

  assert.equal(resolved, null);
});

/*
 * Verifies raw logging write errors are swallowed so diagnostics cannot change
 * authentication behavior.
 */
test('raw icloudpd stdio logging write failure is non-fatal', async () => {
  const rawLogPath = path.join('runtime_data', 'private_logs', 'test', 'raw-stdio', `directory-${Date.now()}.log`);
  const fullPath = path.resolve(process.cwd(), rawLogPath);
  await rm(RUNTIME_TEST_DIR, { recursive: true, force: true });
  await rm(fullPath, { recursive: true, force: true });

  await withRawLogEnv(rawLogPath, async () => {
    const logger = createIcloudpdRawStdioLogger();
    await rm(fullPath, { recursive: true, force: true });
    await mkdir(fullPath, { recursive: true });

    assert.doesNotThrow(() => logger.write('stdout', 'raw output that cannot be written to a directory path'));
  });

  await rm(RUNTIME_TEST_DIR, { recursive: true, force: true });
});

/*
 * Verifies the shared command runner does not raw-log non-iCloudPD helper
 * commands such as executable lookup commands.
 */
test('new auth command runner raw logging is gated to icloudpd commands', async () => {
  const rawLogPath = path.join('runtime_data', 'private_logs', 'test', 'raw-stdio', `lookup-${Date.now()}.log`);
  const fullPath = path.resolve(process.cwd(), rawLogPath);
  await rm(RUNTIME_TEST_DIR, { recursive: true, force: true });

  await withRawLogEnv(rawLogPath, async () => {
    const result = await runCommand('where', ['icloudpd'], {
      timeoutMs: 1_000,
      spawnImpl() {
        return commandSpawnerWithOutput({ stdout: 'lookup output that should not enter raw log' })();
      },
    });

    assert.equal(result.ok, true);
    assert.equal(existsSync(fullPath), false);
  });
});

/*
 * Verifies provider-runner raw capture is opt-in while normal output remains
 * available only through the existing sanitized provider field.
 */
test('provider runner writes raw icloudpd stdout only to opt-in runtime_data file', async () => {
  const rawLogPath = path.join('runtime_data', 'private_logs', 'test', 'raw-stdio', `provider-${Date.now()}.log`);
  const fullPath = path.resolve(process.cwd(), rawLogPath);
  await rm(RUNTIME_TEST_DIR, { recursive: true, force: true });

  await withRawLogEnv(rawLogPath, async () => {
    const processRunner = createIcloudpdProcessRunner({
      executable: 'icloudpd-test',
      async execFileImpl() {
        return {
          stdout: 'Authentication successful. Valid session cookie. Cookie: RAW_SESSION_COOKIE',
          stderr: '',
        };
      },
    });

    const result = await processRunner.startAuth({
      config: {
        username: 'operator@example.com',
        password: 'DO_NOT_EXPOSE_PASSWORD',
        cookieDir: path.join('runtime_data', 'private_logs', 'test', 'raw-stdio', 'cookies'),
        downloadDir: path.join('runtime_data', 'private_logs', 'test', 'raw-stdio', 'downloads'),
        timeoutMs: 1_000,
      },
    });

    const rawLog = readFileSync(fullPath, 'utf8');
    assert.equal(result.sanitizedCombinedOutput.includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(rawLog.includes('RAW_SESSION_COOKIE'), true);
    assert.equal(rawLog.includes('icloudpd-provider stdout'), true);
  });

  await rm(RUNTIME_TEST_DIR, { recursive: true, force: true });
});

/*
 * Verifies NEW AUTH interactive raw capture stays out of returned payloads.
 */
test('new auth interactive raw stdout is opt-in and not returned in payloads', async () => {
  const rawLogPath = path.join('runtime_data', 'private_logs', 'test', 'raw-stdio', `interactive-${Date.now()}.log`);
  const fullPath = path.resolve(process.cwd(), rawLogPath);
  const cookieDir = path.join(process.cwd(), 'runtime_data', 'private_logs', 'test', 'raw-stdio', 'interactive-cookies');
  await rm(RUNTIME_TEST_DIR, { recursive: true, force: true });

  const context = {
    executablePath: 'fake-icloudpd',
    commandSpawner: commandSpawnerWithOutput({
      stdout: 'Authentication successful. Valid session cookie. Cookie: RAW_INTERACTIVE_COOKIE',
    }),
    envValues: {
      user: 'person@example.com',
      pw: 'DO_NOT_EXPOSE_PASSWORD',
      ICLOUDPD_COOKIE_DIR: cookieDir,
      ICLOUDPD_AUTH_TIMEOUT_MS: '1000',
    },
  };

  await withRawLogEnv(rawLogPath, async () => {
    try {
      const login = await startNewAuthLogin(context);
      const serialized = JSON.stringify(login);
      const rawLog = readFileSync(fullPath, 'utf8');

      assert.equal(login.state, 'authenticated');
      assert.equal(serialized.includes('RAW_INTERACTIVE_COOKIE'), false);
      assert.equal(serialized.includes('DO_NOT_EXPOSE_PASSWORD'), false);
      assert.equal(rawLog.includes('RAW_INTERACTIVE_COOKIE'), true);
      assert.equal(rawLog.includes('new-auth-interactive stdout'), true);
    } finally {
      await logoutNewAuthSession(context);
    }
  });

  await rm(RUNTIME_TEST_DIR, { recursive: true, force: true });
});
