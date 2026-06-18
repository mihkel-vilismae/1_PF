/** Validates the overall project completeness registry and writes a proof artifact. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';

const registryPath = 'docs/40_backlog_and_tasks/overall_project_goal_registry.json';
const enumPath = 'docs/20_architecture_and_specs/reference/project_status_enum_registry.md';
const openspecPath = 'docs/20_architecture_and_specs/openspec/project_completeness_reporting_openspec.md';
const repoRoot = process.cwd();

function readJson(path) {
  return JSON.parse(readFileSync(join(repoRoot, path), 'utf8'));
}

function extractNpmScripts(commandText) {
  const matches = [...String(commandText ?? '').matchAll(/npm\s+run\s+([A-Za-z0-9:_-]+)/g)];
  return matches.map((match) => match[1]);
}

function assert(condition, message, details = {}) {
  if (!condition) return { ok: false, message, details };
  return null;
}

async function readMetadata() {
  const version = readFileSync(join(repoRoot, 'VERSION'), 'utf8').trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const metadata = await readMetadata();
  const registry = readJson(registryPath);
  const packageJson = readJson('package.json');
  const scripts = packageJson.scripts ?? {};
  const allowedStatuses = new Set(registry.allowed_status_enums ?? []);
  const allowedProofStates = new Set(registry.allowed_proof_command_states ?? []);
  const findings = [];

  findings.push(assert(existsSync(join(repoRoot, enumPath)), 'status enum registry is missing', { enumPath }));
  findings.push(assert(existsSync(join(repoRoot, openspecPath)), 'project completeness OpenSpec is missing', { openspecPath }));
  findings.push(assert(Array.isArray(registry.goals) && registry.goals.length >= 40, 'goal registry should contain active v1/debug/backlog rows', { goalCount: registry.goals?.length ?? 0 }));
  findings.push(assert(allowedStatuses.has('PROVEN') && allowedStatuses.has('DOCS_ONLY') && allowedStatuses.has('PLANNED'), 'status enum registry does not include required proof-honesty statuses', { allowedStatuses: [...allowedStatuses].sort() }));
  findings.push(assert(allowedProofStates.has('IMPLEMENTED_COMMAND') && allowedProofStates.has('PLANNED_COMMAND'), 'proof command states are missing implemented/planned split', { allowedProofStates: [...allowedProofStates].sort() }));

  const categoryCounts = {};
  const statusCounts = {};
  const proofCommandStateCounts = {};
  const sourceMissing = [];
  const badStatuses = [];
  const badProofStates = [];
  const missingScripts = [];
  const plannedCommandsPresentedAsRunnable = [];
  const debugRuntimeClaims = [];
  const invalidDebugRuntimeClaims = [];

  for (const goal of registry.goals ?? []) {
    categoryCounts[goal.category] = (categoryCounts[goal.category] ?? 0) + 1;
    statusCounts[goal.status_enum] = (statusCounts[goal.status_enum] ?? 0) + 1;
    proofCommandStateCounts[goal.proof_command_state] = (proofCommandStateCounts[goal.proof_command_state] ?? 0) + 1;

    if (!allowedStatuses.has(goal.status_enum)) badStatuses.push({ id: goal.id, status: goal.status_enum });
    if (!allowedProofStates.has(goal.proof_command_state)) badProofStates.push({ id: goal.id, proof_command_state: goal.proof_command_state });

    for (const sourcePath of goal.source_paths ?? []) {
      if (!existsSync(join(repoRoot, sourcePath))) sourceMissing.push({ id: goal.id, sourcePath });
    }

    if (goal.proof_command_state === 'IMPLEMENTED_COMMAND') {
      for (const script of extractNpmScripts(goal.proof_command)) {
        if (!scripts[script]) missingScripts.push({ id: goal.id, script, command: goal.proof_command });
      }
    }

    if (goal.proof_command_state === 'PLANNED_COMMAND' && /npm\s+run\s+proof:/.test(String(goal.proof_command ?? ''))) {
      plannedCommandsPresentedAsRunnable.push({ id: goal.id, command: goal.proof_command });
    }

    if (goal.category === 'debug_page' && goal.id !== 'DBG-GOAL-020' && goal.runtime_implementation_claim) {
      debugRuntimeClaims.push({ id: goal.id, title: goal.title, status: goal.status_enum, proof_command_state: goal.proof_command_state, proof_status: goal.proof_status });
      const validImplementedDebugClaim = ['IMPLEMENTED', 'PROVEN'].includes(goal.status_enum)
        && goal.proof_command_state === 'IMPLEMENTED_COMMAND'
        && goal.proof_status === 'PASSED';
      if (!validImplementedDebugClaim) {
        invalidDebugRuntimeClaims.push({ id: goal.id, title: goal.title, status: goal.status_enum, proof_command_state: goal.proof_command_state, proof_status: goal.proof_status });
      }
    }
  }

  findings.push(assert(Object.keys(categoryCounts).includes('raspberry_v1_gate'), 'registry is missing raspberry v1 gate category', { categoryCounts }));
  findings.push(assert(Object.keys(categoryCounts).includes('debug_page'), 'registry is missing debug page category', { categoryCounts }));
  findings.push(assert(sourceMissing.length === 0, 'registry contains missing source paths', { sourceMissing }));
  findings.push(assert(badStatuses.length === 0, 'registry contains statuses outside allowed enum', { badStatuses }));
  findings.push(assert(badProofStates.length === 0, 'registry contains proof command states outside allowed enum', { badProofStates }));
  findings.push(assert(missingScripts.length === 0, 'implemented npm proof commands are missing from package.json scripts', { missingScripts }));
  findings.push(assert(plannedCommandsPresentedAsRunnable.length === 0, 'planned proof commands are presented as runnable npm proof commands', { plannedCommandsPresentedAsRunnable }));
  findings.push(assert(invalidDebugRuntimeClaims.length === 0, 'debug page runtime/UI goals claim implementation without implemented status and passed proof', { invalidDebugRuntimeClaims }));

  const failures = findings.filter(Boolean).filter((finding) => !finding.ok);
  const proofStatus = failures.length === 0 ? 'PASSED' : 'FAILED';
  const envelope = createProofEnvelope({
    proofKind: 'overall_project_completeness_registry',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'docs_static_registry_validation',
    evidence: {
      environment: getProofEnvironment(),
      registry_path: registryPath,
      status_enum_source: registry.status_enum_source,
      openspec_path: openspecPath,
      goal_count: registry.goals?.length ?? 0,
      category_counts: categoryCounts,
      status_counts: statusCounts,
      proof_command_state_counts: proofCommandStateCounts,
      failure_count: failures.length,
      failures,
      live_proof_artifact_note: 'This proof validates registry/source consistency only. It does not score live runtime_data/proofs artifacts.',
      non_claims: [
        'does not prove runtime Debug page UI',
        'does not prove Raspberry hardware behavior',
        'does not execute planned proof commands',
        'does not replace proof:raspberry-v1-readiness',
      ],
    },
    knownLimitations: ['Static registry proof only; live proof-artifact scoring remains separate.'],
  });
  const outputPath = await writeProofArtifact('overall_project_completeness_registry', envelope);
  console.log(JSON.stringify({ status: proofStatus, outputPath, goalCount: registry.goals?.length ?? 0, categoryCounts, failureCount: failures.length }, null, 2));
  process.exit(proofStatus === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
