import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../package.json' with { type: 'json' };
import { analyzePlatformProofQueuePlan, analyzeRaspberryHandoffLauncherText, buildAcceptedRaspberryLauncherSnippet } from '../tools/proofrunner-platform-filter-contract-lib.mjs';

test('Raspberry proofrunner excludes Windows-only package-script aliases', () => {
  const analysis = analyzePlatformProofQueuePlan(pkg, { platformRunner: 'raspberryos_bash' });
  assert.equal(analysis.status, 'PASSED');
  assert.equal(analysis.plan.ordered_proofs.some((name) => name.endsWith(':windows')), false);
  assert.ok(analysis.plan.skipped_windows_aliases.includes('proof:live-windows-native-playback:windows'));
  assert.ok(analysis.plan.skipped_windows_aliases.includes('proof:live-windows-scheduler:windows'));
  assert.equal(analysis.plan.ordered_proofs.at(-1), 'proof:proof-runner-final-summary');
});

test('Windows proofrunner keeps Windows-only package-script aliases', () => {
  const analysis = analyzePlatformProofQueuePlan(pkg, { platformRunner: 'windows_powershell' });
  assert.equal(analysis.status, 'PASSED');
  assert.ok(analysis.plan.ordered_proofs.includes('proof:live-windows-native-playback:windows'));
  assert.ok(analysis.plan.ordered_proofs.includes('proof:live-windows-scheduler:windows'));
});

test('Raspberry handoff launcher contract rejects blind proof:* discovery', () => {
  const blindLauncher = "Object.keys(p.scripts).filter(k=>k.startsWith('proof:')).sort()";
  const analysis = analyzeRaspberryHandoffLauncherText(blindLauncher);
  assert.equal(analysis.status, 'FAILED');
  assert.equal(analysis.checks.find((check) => check.name === 'sets_include_windows_aliases_false').passed, false);
});

test('Raspberry handoff launcher contract accepts platform-aware helper usage', () => {
  const analysis = analyzeRaspberryHandoffLauncherText(buildAcceptedRaspberryLauncherSnippet());
  assert.equal(analysis.status, 'PASSED');
});


test('Raspberry handoff launcher contract rejects helper import from handoff cwd', () => {
  const wrongCwdLauncher = `PF_PROOF_QUEUE_PLAN_PATH="$QUEUE_PLAN" node --input-type=module <<'NODE_QUEUE' > "$LOG_DIR/proof_scripts.txt"
import { buildProofRunnerQueuePlanForMode } from './tools/proof-runner-queue-lib.mjs';
NODE_QUEUE
mapfile -t PROOFS < "$LOG_DIR/proof_scripts.txt"`;
  const analysis = analyzeRaspberryHandoffLauncherText(wrongCwdLauncher);
  assert.equal(analysis.status, 'FAILED');
  assert.equal(analysis.checks.find((check) => check.name === 'runs_queue_discovery_from_repo_root').passed, false);
});

test('Raspberry handoff launcher contract rejects empty queue success', () => {
  const emptyQueueLauncher = `cd "$REPO_ROOT" && node --input-type=module
mapfile -t PROOFS < "$LOG_DIR/proof_scripts.txt"`;
  const analysis = analyzeRaspberryHandoffLauncherText(emptyQueueLauncher);
  assert.equal(analysis.status, 'FAILED');
  assert.equal(analysis.checks.find((check) => check.name === 'fails_on_empty_or_failed_queue_discovery').passed, false);
});


test('Raspberry handoff launcher contract rejects escape-sensitive newline join literal', () => {
  const brokenNewlineLauncher = `if ! (cd "$REPO_ROOT" && node --input-type=module <<'NODE_QUEUE'
console.log(plan.ordered_proofs.join('\n'));
NODE_QUEUE
); then echo failed; fi
includeWindowsAliases: false
skipped_windows_aliases
proof:proof-runner-final-summary`;
  const analysis = analyzeRaspberryHandoffLauncherText(brokenNewlineLauncher);
  assert.equal(analysis.status, 'FAILED');
  assert.equal(analysis.checks.find((check) => check.name === 'no_escape_sensitive_newline_join_literal').passed, false);
});

test('handoff launcher contract rejects temp queue helper outside repo root with relative ./tools import', () => {
  const brokenBashLauncher = `discover_queue() {
  local repo_root="$1"
  local queue_js="$RUN_DIR/discover-proof-queue.mjs"
  cat > "$queue_js" <<'NODE'
import { buildProofRunnerQueuePlanForMode } from './tools/proof-runner-queue-lib.mjs';
NODE
  (cd "$repo_root" && node "$queue_js" "$queue_plan" > "$queue_txt")
  if [ ! -s "$queue_txt" ]; then echo "Proof queue discovery failed"; return 1; fi
  mapfile -t PROOFS < "$queue_txt"
  if [ "\${PROOFS[@]}" = "0" ]; then echo "No proof scripts discovered"; return 1; fi
}
includeWindowsAliases: false
skipped_windows_aliases
proof:proof-runner-final-summary`;
  const analysis = analyzeRaspberryHandoffLauncherText(brokenBashLauncher);
  assert.equal(analysis.status, 'FAILED');
  assert.equal(analysis.checks.find((check) => check.name === 'queue_helper_relative_import_resolves_from_repo_root').passed, false);
});

test('handoff launcher contract rejects PowerShell queue helper outside repo root with relative ./tools import', () => {
  const brokenPowerShellLauncher = `$QueueJs = Join-Path $WorkRoot 'discover-proof-queue.mjs'
@'
import { buildProofRunnerQueuePlanForMode } from './tools/proof-runner-queue-lib.mjs';
const plan = buildProofRunnerQueuePlanForMode(pkg, { runMode: mode, includeWindowsAliases: false });
'@ | Set-Content $QueueJs
Push-Location $RepoRoot
try { node $QueueJs $QueuePlan | Set-Content $QueueTxt } finally { Pop-Location }
if ($Proofs.Count -eq 0) { Write-Host 'No proof scripts discovered' }
skipped_windows_aliases
proof:proof-runner-final-summary`;
  const analysis = analyzeRaspberryHandoffLauncherText(brokenPowerShellLauncher);
  assert.equal(analysis.status, 'FAILED');
  assert.equal(analysis.checks.find((check) => check.name === 'queue_helper_relative_import_resolves_from_repo_root').passed, false);
});

test('handoff launcher contract accepts PowerShell queue helper written at extracted repo root', () => {
  const acceptedPowerShellLauncher = `$QueueJs = Join-Path $RepoRoot 'discover-proof-queue.mjs'
@'
import { buildProofRunnerQueuePlanForMode } from './tools/proof-runner-queue-lib.mjs';
const plan = buildProofRunnerQueuePlanForMode(pkg, { runMode: mode, includeWindowsAliases: false });
console.error('skipped_windows_aliases=' + JSON.stringify(plan.skipped_windows_aliases));
process.stdout.write(plan.ordered_proofs.join(String.fromCharCode(10)));
'@ | Set-Content $QueueJs
Push-Location $RepoRoot
try { node $QueueJs $QueuePlan | Set-Content $QueueTxt } finally { Pop-Location }
if ($Proofs.Count -eq 0) { Write-Host 'No proof scripts discovered' }
proof:proof-runner-final-summary`;
  const analysis = analyzeRaspberryHandoffLauncherText(acceptedPowerShellLauncher);
  assert.equal(analysis.status, 'PASSED');
});
