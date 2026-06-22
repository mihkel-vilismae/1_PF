/**
 * Runs the Raspberry v1 readiness evaluator.
 * Writes the shared proof envelope and prints gate plus identity diagnostics.
 * Leaves missing proof execution to the mapped operator commands.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryV1ReadinessProof } from './raspberry-v1-readiness-lib.mjs';

/** Reads the live version and short Git commit used for proof identity comparison. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Builds, writes, and prints the current readiness result. */
async function main() {
  const envelope = await buildRaspberryV1ReadinessProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('raspberry_v1_readiness', envelope);
  console.log(JSON.stringify({
    status: envelope.proof_status,
    mode: envelope.runtime_mode,
    outputPath,
    summary: envelope.evidence.summary,
    blockingGateIds: envelope.evidence.blocking_gate_ids,
    proofIdentitySummary: {
      policy: envelope.evidence.proof_identity_report.policy,
      identityMatchesCurrentBaseline: envelope.evidence.proof_identity_report.identity_matches_current_baseline,
      mismatchCount: envelope.evidence.proof_identity_report.mismatch_count,
      missingIdentityCount: envelope.evidence.proof_identity_report.missing_identity_count,
    },
    proofIdentityMismatches: envelope.evidence.proof_identity_report.mismatches,
    proofIdentityMissingFields: envelope.evidence.proof_identity_report.missing_identity,
    formalRefreshSummary: {
      policy: envelope.evidence.gate_formal_refresh_report.policy,
      releaseBaselineFormallyRefreshed: envelope.evidence.gate_formal_refresh_report.release_baseline_formally_refreshed,
      formallyRefreshedCount: envelope.evidence.gate_formal_refresh_report.formally_refreshed_count,
      passedNotFormallyRefreshedCount: envelope.evidence.gate_formal_refresh_report.passed_not_formally_refreshed_count,
      notPassedCount: envelope.evidence.gate_formal_refresh_report.not_passed_count,
    },
    passedNotFormallyRefreshedGates: envelope.evidence.gate_formal_refresh_report.gates
      .filter((gate) => gate.formal_refresh_status === 'PASSED_NOT_FORMALLY_REFRESHED'),
  }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
