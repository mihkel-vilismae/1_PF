import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createProjectLogger } from '../server/logging/projectLogger.ts';

test('project logger creates requested log files and mirrors all entries to full log', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'project-logger-'));
  try {
    const logger = createProjectLogger({
      repoRoot: root,
      logDir: 'logs',
      now: () => new Date('2026-04-26T01:02:03.004Z'),
      source: 'test',
    });

    await logger.initialize();
    await logger.info('regular event');
    await logger.debug('debug event');
    await logger.error('error event', new Error('boom'));

    assert.match(path.basename(logger.paths.regular), /^log_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/);
    const regular = await readFile(logger.paths.regular, 'utf8');
    const debug = await readFile(path.join(root, 'logs', 'debug.log'), 'utf8');
    const error = await readFile(path.join(root, 'logs', 'error.log'), 'utf8');
    const full = await readFile(path.join(root, 'logs', 'full_log.log'), 'utf8');

    assert.match(regular, /regular event/);
    assert.doesNotMatch(regular, /debug event|error event/);
    assert.match(debug, /debug event/);
    assert.match(error, /error event/);
    assert.match(full, /regular event/);
    assert.match(full, /debug event/);
    assert.match(full, /error event/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
