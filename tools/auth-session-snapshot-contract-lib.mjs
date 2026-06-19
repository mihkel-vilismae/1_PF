/** Auth/session snapshot contract helpers for manual login and iCloudPD bridge. */
export const AUTH_SESSION_STATES = Object.freeze(['AUTH_REQUIRED', 'AUTH_READY_FOR_OPERATOR', 'AUTH_IN_PROGRESS', 'AUTH_SESSION_DETECTED', 'AUTH_SESSION_USABLE', 'AUTH_BLOCKED']);
export const FORBIDDEN_SNAPSHOT_KEYS = Object.freeze(['password', 'passcode', 'two_factor_code', 'token', 'access_token', 'refresh_token', 'cookie', 'cookies', 'session_contents', 'apple_id']);

export function buildAuthSessionSnapshot({ stage, authState, source = 'manual_operator', sessionDirPresent = false, sessionFileCount = 0, newestSessionMtime = null, usable = false, notes = [] }) {
  if (!AUTH_SESSION_STATES.includes(authState)) throw new Error(`Invalid auth state: ${authState}`);
  return {
    snapshot_kind: 'auth_session_snapshot',
    stage,
    auth_state: authState,
    source,
    session_boundary: {
      session_dir_present: Boolean(sessionDirPresent),
      session_file_count: Number(sessionFileCount ?? 0),
      newest_session_mtime: newestSessionMtime,
      session_usable: Boolean(usable),
      session_contents_collected: false,
    },
    secret_policy: {
      secrets_collected: false,
      forbidden_keys: [...FORBIDDEN_SNAPSHOT_KEYS],
      allowed_evidence: ['presence', 'file_count', 'mtime', 'state_transition', 'non_secret_path_class'],
    },
    notes,
  };
}

export function validateAuthSessionSnapshot(snapshot) {
  const text = JSON.stringify(snapshot).toLowerCase();
  const forbiddenHits = FORBIDDEN_SNAPSHOT_KEYS.filter((key) => text.includes(`"${key}"`) && !JSON.stringify(snapshot.secret_policy?.forbidden_keys ?? []).toLowerCase().includes(`"${key}"`));
  const checks = [
    { name: 'kind', passed: snapshot?.snapshot_kind === 'auth_session_snapshot' },
    { name: 'valid_auth_state', passed: AUTH_SESSION_STATES.includes(snapshot?.auth_state) },
    { name: 'no_session_contents', passed: snapshot?.session_boundary?.session_contents_collected === false },
    { name: 'secrets_not_collected', passed: snapshot?.secret_policy?.secrets_collected === false },
    { name: 'no_forbidden_payload_keys', passed: forbiddenHits.length === 0, forbiddenHits },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function buildManualLoginSnapshotPair() {
  return {
    pre_login: buildAuthSessionSnapshot({ stage: 'pre_login', authState: 'AUTH_READY_FOR_OPERATOR', notes: ['Operator may now perform real provider login outside proof artifact collection.'] }),
    post_login: buildAuthSessionSnapshot({ stage: 'post_login', authState: 'AUTH_SESSION_DETECTED', sessionDirPresent: true, sessionFileCount: 1, newestSessionMtime: '[mtime-only]', usable: false, notes: ['Post-login snapshot records boundary metadata only.'] }),
  };
}
