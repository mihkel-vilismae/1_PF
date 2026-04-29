import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createDefaultAuthState } from '../server/auth/authState.ts';
import { createAuthPersistence } from '../server/auth/authPersistence.ts';
import { configureAuthServiceForTests, loadPersistedAuthState } from '../server/auth/authService.ts';

async function withTempDir(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pf-auth-persistence-'));
  try {
    return await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('auth persistence reloads safe state without internal provider fields', async () => {
  await withTempDir(async (dir) => {
    const persistence = createAuthPersistence({ filePath: path.join(dir, 'auth-state.json') });
    await persistence.save(createDefaultAuthState({
      status: 'blocked',
      has_required_files: true,
      requires_2fa: true,
      two_factor_status: 'required',
      two_factor_method: 'trusted_device',
      next_action: 'submit_two_factor_code',
      attemptId: 'attempt-persisted',
      updatedAt: '2026-04-24T14:10:00.000Z',
      providerSessionRef: 'secret-session-ref',
      providerRawStatus: { token: 'secret-token' },
    }));

    const loaded = await persistence.load();
    assert.equal(loaded.status, 'blocked');
    assert.equal(loaded.attemptId, 'attempt-persisted');
    assert.equal(JSON.stringify(loaded).includes('secret-session-ref'), false);
    assert.equal(JSON.stringify(loaded).includes('secret-token'), false);
  });
});

test('auth persistence does not trust authenticated state after restart without provider verification', async () => {
  await withTempDir(async (dir) => {
    const persistence = createAuthPersistence({ filePath: path.join(dir, 'auth-state.json') });
    await persistence.save(createDefaultAuthState({
      status: 'authenticated',
      has_required_files: true,
      requires_2fa: false,
      two_factor_status: 'complete',
      next_action: 'auth_ready',
      attemptId: 'attempt-authenticated',
      updatedAt: '2026-04-24T14:11:00.000Z',
      authenticatedUser: 'operator@example.com',
    }));

    configureAuthServiceForTests({ persistence });
    const loaded = await loadPersistedAuthState({ persistence });

    assert.equal(loaded.status, 'unknown');
    assert.equal(loaded.next_action, 'verify_provider_session');
    assert.equal(loaded.error.code, 'auth_resume_verification_required');
    assert.equal(loaded.authenticatedUser, 'operator@example.com');
  });
});
