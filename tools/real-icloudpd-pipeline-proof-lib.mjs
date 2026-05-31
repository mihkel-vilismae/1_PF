/**
 * Real iCloudPD pipeline proof library.
 * Keeps the real provider proof opt-in and API-driven.
 * Uses existing backend routes instead of adding shortcut behavior.
 * Returns BLOCKED when the operator has not explicitly enabled the proof.
 * Sanitizes all route evidence before artifacts are written.
 */
import { createProofEnvelope, sanitizeEvidence } from './proof-utils.mjs';

/** Tells callers whether the dangerous real iCloudPD proof was explicitly enabled. */
export function isRealIcloudpdProofEnabled(env = process.env) { return env.PF_PROOF_ENABLE_REAL_ICLOUDPD === 'true'; }

/** Builds the ordered route plan for the real iCloudPD pipeline proof. */
export function buildRealIcloudpdRoutePlan(recentCount = 10) {
  return [
    { key: 'auth_status', method: 'GET', path: '/api/auth/new/status' },
    { key: 'real_download', method: 'POST', path: '/api/runtime/download/real-run', body: { recentCount } },
    { key: 'index', method: 'POST', path: '/api/runtime/index/run' },
    { key: 'gps', method: 'POST', path: '/api/runtime/gps/run' },
    { key: 'geocode', method: 'POST', path: '/api/runtime/geocode/run' },
    { key: 'queue_prepare', method: 'POST', path: '/api/runtime/queue/prepare' },
    { key: 'playback_select', method: 'POST', path: '/api/runtime/playback/select-current' }
  ];
}

/** Performs one JSON HTTP request against the already-running PF_login backend. */
export async function requestJson(baseUrl, route) {
  const response = await fetch(new URL(route.path, baseUrl), { method: route.method, headers: { 'content-type': 'application/json', 'x-pf-runtime-mode': 'real' }, body: route.body ? JSON.stringify(route.body) : undefined });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { parse_error: 'non_json_response', text_tail: text.slice(-2000) }; }
  return { key: route.key, method: route.method, path: route.path, status: response.status, ok: response.ok, payload: sanitizeEvidence(payload) };
}

/** Runs the proof against a live backend only when explicitly enabled. */
export async function runRealIcloudpdPipelineProof({ baseUrl, recentCount, metadata, env = process.env }) {
  const routePlan = buildRealIcloudpdRoutePlan(recentCount);
  if (!isRealIcloudpdProofEnabled(env)) return createProofEnvelope({ proofKind: 'real_icloudpd_pipeline', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus: 'BLOCKED', runtimeMode: 'real', evidence: { reason: 'Set PF_PROOF_ENABLE_REAL_ICLOUDPD=true to run the real iCloudPD proof.', base_url: baseUrl, stage_order_planned: routePlan.map((route) => route.key), real_download_route_required: '/api/runtime/download/real-run', mock_download_route_used: false }, knownLimitations: ['No real provider call was attempted because the opt-in flag was not set.'] });
  const stageResults = [];
  for (const route of routePlan) {
    const result = await requestJson(baseUrl, route);
    stageResults.push(result);
    if (!result.ok) return createProofEnvelope({ proofKind: 'real_icloudpd_pipeline', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus: 'FAILED', runtimeMode: 'real', evidence: { base_url: baseUrl, stage_order_executed: stageResults.map((entry) => entry.key), failed_stage: route.key, stage_results: stageResults, mock_download_route_used: false }, knownLimitations: ['The proof stopped at the first failed route.'] });
  }
  return createProofEnvelope({ proofKind: 'real_icloudpd_pipeline', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus: 'PASSED', runtimeMode: 'real', evidence: { base_url: baseUrl, stage_order_executed: stageResults.map((entry) => entry.key), stage_results: stageResults, mock_download_route_used: false }, knownLimitations: ['This proof depends on the local iCloudPD session and backend environment used for this run.'] });
}
