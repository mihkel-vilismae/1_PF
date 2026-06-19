/** Geocode provider selection matrix proof. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact, createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { buildGeocodeProviderSelectionGuide, providerIdsFromMatrix } from './geocode-provider-selection-lib.mjs';
import { buildRealGeocodeProviderReadinessHints } from './real-geocode-provider-chain-proof-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const metadata = await readProjectMetadata();
  const guide = buildGeocodeProviderSelectionGuide();
  const readiness = buildRealGeocodeProviderReadinessHints({});
  const matrixIds = providerIdsFromMatrix();
  const readinessIds = [...readiness.supported_provider_ids].sort();
  const checks = [
    { name: 'matrix_matches_readiness_supported_providers', passed: JSON.stringify(matrixIds) === JSON.stringify(readinessIds), detail: { matrixIds, readinessIds } },
    { name: 'every_provider_has_required_env_keys', passed: guide.provider_matrix.every((provider) => provider.required_env.length > 0), detail: guide.provider_matrix.map((provider) => ({ provider_id: provider.provider_id, required_env: provider.required_env })) },
    { name: 'secret_boundary_documented', passed: /must not be written/.test(guide.secret_boundary), detail: guide.secret_boundary },
  ];
  const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
  const envelope = createProofEnvelope({
    proofKind: 'geocode_provider_selection',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'geocode_provider_selection_matrix',
    evidence: { environment: getProofEnvironment(), checks, guide },
    knownLimitations: ['This proof validates provider selection metadata; it does not call any geocode provider.'],
  });
  const outputPath = await writeProofArtifact('geocode_provider_selection', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks }, null, 2));
  process.exit(proofStatus === 'PASSED' ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
