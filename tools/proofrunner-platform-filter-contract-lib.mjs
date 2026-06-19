/** Platform-specific proofrunner queue and handoff launcher contract helpers. */
import { WINDOWS_ONLY_SUFFIX, buildProofRunnerQueuePlanForMode } from './proof-runner-queue-lib.mjs';

export function analyzePlatformProofQueuePlan(pkg, { platformRunner = 'raspberryos_bash', runMode = 'all' } = {}) {
  const isWindowsRunner = /windows|powershell|win/i.test(String(platformRunner));
  const plan = buildProofRunnerQueuePlanForMode(pkg, { runMode, includeWindowsAliases: isWindowsRunner });
  const windowsAliasesInQueue = plan.ordered_proofs.filter((name) => name.endsWith(WINDOWS_ONLY_SUFFIX));
  const skippedWindowsAliases = plan.skipped_windows_aliases ?? [];
  const checks = [
    {
      name: 'non_windows_runner_excludes_windows_aliases',
      passed: isWindowsRunner || windowsAliasesInQueue.length === 0,
      detail: { platform_runner: platformRunner, windows_aliases_in_queue: windowsAliasesInQueue },
    },
    {
      name: 'non_windows_runner_records_skipped_windows_aliases',
      passed: isWindowsRunner || skippedWindowsAliases.length > 0,
      detail: { platform_runner: platformRunner, skipped_windows_aliases: skippedWindowsAliases },
    },
    {
      name: 'windows_runner_preserves_windows_aliases',
      passed: !isWindowsRunner || windowsAliasesInQueue.length > 0,
      detail: { platform_runner: platformRunner, windows_aliases_in_queue: windowsAliasesInQueue },
    },
    {
      name: 'final_summary_remains_last',
      passed: plan.ordered_proofs.at(-1) === 'proof:proof-runner-final-summary',
      detail: { tail: plan.ordered_proofs.slice(-5) },
    },
  ];
  return {
    status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED',
    platform_runner: platformRunner,
    run_mode: runMode,
    is_windows_runner: isWindowsRunner,
    plan,
    checks,
  };
}

export function analyzeRaspberryHandoffLauncherText(text = '') {
  const source = String(text ?? '');
  const checks = [
    {
      name: 'runs_queue_discovery_from_repo_root',
      passed: /cd \"?\$REPO_ROOT\"?/.test(source) || /Push-Location \$RepoRoot/.test(source),
      detail: 'Launcher must run the queue helper from the extracted repo root so relative ./tools imports resolve correctly.',
    },
    {
      name: 'fails_on_empty_or_failed_queue_discovery',
      passed: /No proof scripts discovered|Proof queue discovery failed|PROOFS\[@\].*0|\$Proofs\.Count.*0/s.test(source),
      detail: 'Queue discovery failure must stop the launcher instead of packaging an empty zero-proof run.',
    },
    {
      name: 'uses_platform_queue_helper_or_filters_windows_aliases',
      passed: /buildProofRunnerQueuePlanForMode/.test(source) || /!.*:windows|endsWith\(['"]:windows['"]\)/.test(source),
      detail: 'Raspberry/Linux handoff launcher must not blindly run every proof:* package script.',
    },
    {
      name: 'sets_include_windows_aliases_false',
      passed: /includeWindowsAliases\s*:\s*false/.test(source),
      detail: 'Raspberry/Linux launcher must explicitly exclude :windows package-script aliases.',
    },
    {
      name: 'records_skipped_windows_aliases',
      passed: /skipped_windows_aliases|skippedWindowsAliases/i.test(source),
      detail: 'Skipped Windows aliases should be visible in logs so omissions are intentional, not silent.',
    },
    {
      name: 'keeps_final_summary_in_queue',
      passed: /proof:proof-runner-final-summary/.test(source) || /ordered_proofs/.test(source),
      detail: 'Final summary must still run after proof-producing commands.',
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function buildAcceptedRaspberryLauncherSnippet() {
  return `if ! (cd "$REPO_ROOT" && PF_PROOF_QUEUE_PLAN_PATH="$QUEUE_PLAN" node --input-type=module <<'NODE_QUEUE' > "$LOG_DIR/proof_scripts.txt"
import { readFileSync, writeFileSync } from 'node:fs';
import { buildProofRunnerQueuePlanForMode } from './tools/proof-runner-queue-lib.mjs';
const pkg = JSON.parse(readFileSync('./package.json','utf8'));
const plan = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'all', includeWindowsAliases: false });
writeFileSync(process.env.PF_PROOF_QUEUE_PLAN_PATH, JSON.stringify(plan, null, 2));
console.error('skipped_windows_aliases=' + JSON.stringify(plan.skipped_windows_aliases));
console.log(plan.ordered_proofs.join('\\n'));
NODE_QUEUE
); then echo "Proof queue discovery failed"; exit 5; fi
mapfile -t PROOFS < "$LOG_DIR/proof_scripts.txt"
if [ "\${#PROOFS[@]}" -eq 0 ]; then echo "No proof scripts discovered"; exit 5; fi
# proof:proof-runner-final-summary remains part of ordered_proofs tail`;
}
