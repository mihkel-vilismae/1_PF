/**
 * Proof-runner queue ordering helpers for 2proofrunner handoffs.
 * Keeps release-readiness summary proofs after proof-producing commands so the
 * uploaded report represents the final state of that run rather than an early snapshot.
 */

export const FINAL_SUMMARY_PROOFS = Object.freeze([
  'proof:raspberry-v1-readiness',
  'proof:proof-report-blocker-summary',
  'proof:proof-runner-final-summary',
]);

export const WINDOWS_ONLY_SUFFIX = ':windows';


export const INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS = Object.freeze([
  { choice: '1', mode: 'quick', label: 'quick smoke queue', recommendedOrder: 1, firstRun: true },
  { choice: '2', mode: 'blockers', label: 'known readiness blockers queue', recommendedOrder: 2 },
  { choice: '3', mode: 'platform', label: 'platform / hardware / cron / display queue', recommendedOrder: 3 },
  { choice: '4', mode: 'failed-last', label: 'rerun last failed proofs', recommendedOrder: 4 },
  { choice: '5', mode: 'minimum', label: 'legacy minimum release-smoke queue', recommendedOrder: 5, legacy: true },
  { choice: '6', mode: 'full', label: 'complete proof queue / historical all', recommendedOrder: 6, finalSweep: true },
]);

export const AUTOMATION_ONLY_PROOF_RUNNER_MODES = Object.freeze([
  { mode: 'changed', label: 'explicit changed proofs plus quick-core safety proofs' },
]);

export function normalizeProofRunnerLauncherSelection(selection = '') {
  const raw = String(selection ?? '').trim().toLowerCase();
  if (!raw) return 'minimum';
  const byChoice = INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS.find((option) => option.choice === raw);
  if (byChoice) return byChoice.mode;
  return normalizeProofRunnerMode(raw);
}

export function buildProofRunnerModeMenuLines() {
  return INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS.map((option) => {
    const suffix = option.firstRun ? ' (recommended first run)' : option.finalSweep ? ' (final sweep, not first)' : '';
    return `${option.choice}) ${option.mode} — ${option.label}${suffix}`;
  });
}

export function getDocumentedProofRunnerModes() {
  return [
    ...INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS.map((option) => option.mode),
    ...AUTOMATION_ONLY_PROOF_RUNNER_MODES.map((option) => option.mode),
    'all',
  ];
}

export const PROOF_RUNNER_MODE_ALIASES = Object.freeze({
  all: 'full',
  full: 'full',
  minimum: 'minimum',
  quick: 'quick',
  changed: 'changed',
  blockers: 'blockers',
  'failed-last': 'failed-last',
  failed_last: 'failed-last',
  failed: 'failed-last',
  platform: 'platform',
});

export const QUICK_PROOF_RUNNER_PROOFS = Object.freeze([
  'proof:docs-reconciliation-audit',
  'proof:proof-runner-queue',
  'proof:proofrunner-handoff-artifact-export-contract',
  'proof:proofrunner-handoff-runtime-contract',
  'proof:proofrunner-launcher-progress-contract',
  'proof:proofrunner-packaging-identity',
  'proof:proofrunner-platform-filter-contract',
]);

export const MINIMUM_PROOF_RUNNER_PROOFS = Object.freeze([
  'proof:docs-reconciliation-audit',
  'proof:full-test',
  'proof:openspec-v1-audit',
  'proof:overall-project-completeness-registry',
  'proof:proof-runner-queue',
  'proof:proofrunner-windows-launcher-contract',
  'proof:raspberry-v1-readiness',
  'proof:proof-report-blocker-summary',
  'proof:proof-runner-final-summary',
]);

export const BLOCKER_PROOF_RUNNER_PROOFS = Object.freeze([
  'proof:operator-safe-icloud-session-checkpoint',
  'proof:auth-checkpoint-state',
  'proof:auth-session-usable-evidence-producer',
  'proof:real-icloud-media-source-evidence-pack',
  'proof:real-icloudpd-readiness',
  'proof:real-icloudpd',
  'proof:real-download-continuation',
  'proof:regular-worker-product-evidence-producer',
  'proof:regular-worker-consumes-download-manifest',
  'proof:regular-worker-real-download-bridge',
  'proof:raspberry-regular-stage-worker-product-pipeline',
  'proof:real-geocode-provider-readiness',
  'proof:real-geocode-provider-chain',
  'proof:real-gps-geocode-product-bridge-evidence-pack',
  'proof:real-gps-geocode-product-bridge',
  'proof:raspberry-address-overlay-template',
  'proof:raspberry-address-overlay-display-command',
  'proof:raspberry-address-overlay-device-evidence',
  'proof:raspberry-address-overlay-device-display',
  'proof:native-playback-readiness',
  'proof:cron-orchestration',
  ...FINAL_SUMMARY_PROOFS,
]);

export const PLATFORM_PROOF_NAME_PATTERN = /raspberry|windows|win32|native|playback|display|cron|install-runtime|fullscreen|mpv/i;

export function normalizeProofRunnerMode(runMode = 'full') {
  const raw = String(runMode ?? 'full').trim().toLowerCase() || 'full';
  return PROOF_RUNNER_MODE_ALIASES[raw] ?? 'full';
}

export function parseProofList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value ?? '')
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function discoverProofScriptsFromPackage(pkg, { includeWindowsAliases = true } = {}) {
  const scripts = Object.keys(pkg?.scripts ?? {}).filter((name) => name.startsWith('proof:'));
  return scripts.filter((name) => includeWindowsAliases || !name.endsWith(WINDOWS_ONLY_SUFFIX)).sort();
}

export function orderProofScriptsForEvidenceRun(proofScripts, { includeWindowsAliases = true } = {}) {
  const uniqueScripts = [...new Set(proofScripts)]
    .filter((name) => includeWindowsAliases || !name.endsWith(WINDOWS_ONLY_SUFFIX));
  const finalSet = new Set(FINAL_SUMMARY_PROOFS);
  const regular = uniqueScripts.filter((name) => !finalSet.has(name)).sort();
  const finals = FINAL_SUMMARY_PROOFS.filter((name) => uniqueScripts.includes(name));
  return [...regular, ...finals];
}

export function buildProofRunnerQueuePlan(pkg, options = {}) {
  const discovered = discoverProofScriptsFromPackage(pkg, options);
  const ordered = orderProofScriptsForEvidenceRun(discovered, options);
  return {
    discovered_count: discovered.length,
    ordered_count: ordered.length,
    include_windows_aliases: options.includeWindowsAliases !== false,
    final_summary_proofs: FINAL_SUMMARY_PROOFS.filter((name) => ordered.includes(name)),
    ordered_proofs: ordered,
    skipped_windows_aliases: options.includeWindowsAliases === false
      ? discoverProofScriptsFromPackage(pkg, { includeWindowsAliases: true }).filter((name) => name.endsWith(WINDOWS_ONLY_SUFFIX))
      : [],
  };
}

export function assertFinalSummaryProofsRunLast(orderedProofs) {
  const presentFinals = FINAL_SUMMARY_PROOFS.filter((name) => orderedProofs.includes(name));
  if (presentFinals.length === 0) return { passed: true, reason: 'No final summary proof scripts are present.' };
  const firstFinalIndex = Math.min(...presentFinals.map((name) => orderedProofs.indexOf(name)));
  const nonFinalAfter = orderedProofs.slice(firstFinalIndex).filter((name) => !FINAL_SUMMARY_PROOFS.includes(name));
  return {
    passed: nonFinalAfter.length === 0,
    first_final_index: firstFinalIndex,
    final_summary_proofs_present: presentFinals,
    non_final_proofs_after_summary: nonFinalAfter,
  };
}

function selectExistingProofs(fullPlan, desiredProofs) {
  const available = new Set(fullPlan.ordered_proofs);
  const selected = desiredProofs.filter((name) => available.has(name));
  return { selected, missing: desiredProofs.filter((name) => !available.has(name)) };
}

function buildSelectedProofRunnerQueuePlan(pkg, options = {}, { runMode, desiredProofs, selectedProofKind, fallbackProofs = QUICK_PROOF_RUNNER_PROOFS } = {}) {
  const fullPlan = buildProofRunnerQueuePlan(pkg, options);
  const desired = parseProofList(desiredProofs);
  const effectiveDesired = desired.length ? desired : [...fallbackProofs];
  const { selected, missing } = selectExistingProofs(fullPlan, effectiveDesired);
  const ordered = orderProofScriptsForEvidenceRun(selected, options);
  return {
    ...fullPlan,
    run_mode: runMode,
    selection_kind: selectedProofKind,
    requested_proofs: effectiveDesired,
    ordered_count: ordered.length,
    ordered_proofs: ordered,
    missing_requested_proofs: missing,
    full_discovered_count: fullPlan.discovered_count,
    full_ordered_count: fullPlan.ordered_count,
  };
}

export function buildQuickProofRunnerQueuePlan(pkg, options = {}) {
  return buildSelectedProofRunnerQueuePlan(pkg, options, {
    runMode: 'quick',
    selectedProofKind: 'quick-core',
    desiredProofs: QUICK_PROOF_RUNNER_PROOFS,
  });
}

export function buildMinimumProofRunnerQueuePlan(pkg, options = {}) {
  const plan = buildSelectedProofRunnerQueuePlan(pkg, options, {
    runMode: 'minimum',
    selectedProofKind: 'legacy-minimum-release-smoke',
    desiredProofs: MINIMUM_PROOF_RUNNER_PROOFS,
  });
  return {
    ...plan,
    minimum_required_proofs: MINIMUM_PROOF_RUNNER_PROOFS,
    missing_minimum_proofs: plan.missing_requested_proofs,
  };
}

export function buildChangedProofRunnerQueuePlan(pkg, options = {}) {
  const changedProofs = parseProofList(options.changedProofs);
  const desired = [...new Set([...changedProofs, ...QUICK_PROOF_RUNNER_PROOFS])];
  return buildSelectedProofRunnerQueuePlan(pkg, options, {
    runMode: 'changed',
    selectedProofKind: changedProofs.length ? 'changed-plus-quick-core' : 'changed-fallback-quick',
    desiredProofs: desired,
  });
}

export function buildBlockerProofRunnerQueuePlan(pkg, options = {}) {
  return buildSelectedProofRunnerQueuePlan(pkg, options, {
    runMode: 'blockers',
    selectedProofKind: 'known-readiness-blockers',
    desiredProofs: BLOCKER_PROOF_RUNNER_PROOFS,
  });
}

export function buildFailedLastProofRunnerQueuePlan(pkg, options = {}) {
  const failed = parseProofList(options.lastFailedProofs).filter((name) => !['npm', 'npm install'].includes(name));
  const desired = failed.length
    ? [...new Set([...failed.filter((name) => name !== 'proof:proof-runner-final-summary'), ...FINAL_SUMMARY_PROOFS.filter((name) => failed.includes('proof:proof-runner-final-summary'))])]
    : [...QUICK_PROOF_RUNNER_PROOFS];
  return buildSelectedProofRunnerQueuePlan(pkg, options, {
    runMode: 'failed-last',
    selectedProofKind: failed.length ? 'failed-last' : 'failed-last-fallback-quick',
    desiredProofs: desired,
  });
}

export function buildPlatformProofRunnerQueuePlan(pkg, options = {}) {
  const fullPlan = buildProofRunnerQueuePlan(pkg, options);
  const desired = fullPlan.ordered_proofs.filter((name) => PLATFORM_PROOF_NAME_PATTERN.test(name));
  const withFinals = [...new Set([...desired, ...FINAL_SUMMARY_PROOFS])];
  return buildSelectedProofRunnerQueuePlan(pkg, options, {
    runMode: 'platform',
    selectedProofKind: 'platform-named-proofs',
    desiredProofs: withFinals,
  });
}

export function buildProofRunnerQueuePlanForMode(pkg, { runMode = 'full', changedProofs = [], lastFailedProofs = [], ...options } = {}) {
  const normalizedMode = normalizeProofRunnerMode(runMode);
  if (normalizedMode === 'quick') return buildQuickProofRunnerQueuePlan(pkg, options);
  if (normalizedMode === 'minimum') return buildMinimumProofRunnerQueuePlan(pkg, options);
  if (normalizedMode === 'changed') return buildChangedProofRunnerQueuePlan(pkg, { ...options, changedProofs });
  if (normalizedMode === 'blockers') return buildBlockerProofRunnerQueuePlan(pkg, options);
  if (normalizedMode === 'failed-last') return buildFailedLastProofRunnerQueuePlan(pkg, { ...options, lastFailedProofs });
  if (normalizedMode === 'platform') return buildPlatformProofRunnerQueuePlan(pkg, options);
  return { ...buildProofRunnerQueuePlan(pkg, options), run_mode: 'full', requested_mode: runMode };
}
