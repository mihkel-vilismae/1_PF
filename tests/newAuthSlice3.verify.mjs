import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (filePath) => readFileSync(new URL(`../${filePath}`, import.meta.url), 'utf8');
const service = read('server/auth/newAuthService.ts');
const routes = read('server/auth/newAuthRoutes.ts');
const index = read('server/index.ts');
const frontend = read('dashboard/services/newAuthService.ts');
const runtime = read('dashboard/services/runtimeTruth/runtimeTruthNewAuthActions.ts');

assert.ok(index.includes("'POST /api/auth/new/login': newAuthRouteHandlers.loginHandler"));
assert.ok(index.includes("'POST /api/auth/new/submit-2fa': newAuthRouteHandlers.submitTwoFactorHandler"));
assert.ok(index.includes("'POST /api/auth/new/logout': newAuthRouteHandlers.logoutHandler"));
assert.ok(routes.includes('startNewAuthLogin'));
assert.ok(routes.includes('submitNewAuthTwoFactor'));
assert.ok(routes.includes('logoutNewAuthSession'));
assert.doesNotMatch(routes, /loginPendingHandler|submitTwoFactorPendingHandler|logoutPendingHandler|NEW_AUTH_SLICE_3_REQUIRED/);
assert.doesNotMatch(routes, /createAuthRoutes|authRouteHandlers|\/api\/auth\/(status|verify-icloudpd|run|logout|2fa\/submit)/);

assert.ok(service.includes('export async function startNewAuthLogin'));
assert.ok(service.includes('export async function submitNewAuthTwoFactor'));
assert.ok(service.includes('export async function logoutNewAuthSession'));
assert.ok(service.includes('verifyExistingNewAuthSessionWithProvider'));
assert.ok(service.includes('buildNewAuthSessionProofArgs'));
assert.ok(service.includes('NEW_AUTH_PROVIDER_VERIFIED'));
assert.doesNotMatch(service, /Treating the local session as authenticated until Slice 3 adds provider proof/);
assert.ok(service.includes('NEW_AUTH_MISSING_CONFIG'));
assert.ok(service.includes('NEW_AUTH_2FA_CODE_MISSING'));
assert.ok(service.includes('NEW_AUTH_UNSAFE_SESSION_PATH'));
assert.ok(service.includes('pending_2fa'));
assert.ok(service.includes('stdinText: `${code}\\n`'));
assert.ok(service.includes("'--auth-only'"));
assert.ok(service.includes('await rm(safeCookieDir, { recursive: true, force: true })'));
assert.ok(service.includes('isSafeSessionCleanupPath'));
assert.ok(service.includes('redactEmail'));
assert.ok(service.includes('sanitizeCommandOutput'));
assert.doesNotMatch(service, /providerOutputPreview:\s*result\.(stdout|stderr)/);

assert.ok(frontend.includes("login: { method: 'POST', path: '/api/auth/new/login' }"));
assert.ok(frontend.includes("submitTwoFactor: { method: 'POST', path: '/api/auth/new/submit-2fa' }"));
assert.ok(frontend.includes("logout: { method: 'POST', path: '/api/auth/new/logout' }"));
assert.doesNotMatch(frontend, /\/api\/auth\/(status|verify-icloudpd|run|logout|2fa\/submit)(['"`])/);

assert.ok(runtime.includes("status === 'success' ? 'authenticated' : 'waiting_for_2fa'"));
assert.ok(runtime.includes("payload?.state === 'pending_2fa'"));
assert.ok(runtime.includes('SECRET_FIELD_PATTERN'));
assert.ok(runtime.includes('submitNewAuthTwoFactor(code)'));
assert.doesNotMatch(runtime, /old auth|\/api\/auth\/run/i);

console.log('newAuthSlice3 static verification passed');
