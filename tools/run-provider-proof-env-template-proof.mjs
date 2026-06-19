/** Provider proof env template proof runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact, createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { readAndAnalyzeProviderProofEnvTemplate } from './provider-proof-env-template-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const metadata = await readProjectMetadata();
  const analysis = readAndAnalyzeProviderProofEnvTemplate();
  const checks = [
    { name: 'all_required_template_keys_present', passed: analysis.required_keys.every((entry) => entry.present), detail: analysis.required_keys },
    { name: 'real_provider_opt_ins_default_false', passed: analysis.opt_in_defaults_safe.every((entry) => entry.safe), detail: analysis.opt_in_defaults_safe },
    { name: 'template_contains_no_secret_values', passed: analysis.no_secret_values, detail: analysis.secret_value_findings },
  ];
  const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
  const envelope = createProofEnvelope({
    proofKind: 'provider_proof_env_template',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'provider_proof_env_template_guard',
    evidence: { environment: getProofEnvironment(), checks, analysis },
    knownLimitations: ['This proof validates the template shape and secret boundary; it does not validate local private environment values.'],
  });
  const outputPath = await writeProofArtifact('provider_proof_env_template', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks }, null, 2));
  process.exit(proofStatus === 'PASSED' ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
