import { evaluateRealAuthEvidenceProducer } from './real-auth-evidence-producer-lib.mjs';
import { evaluateRealIcloudFilterConfig } from './real-icloud-filter-config-lib.mjs';
import { evaluateRealIcloudControlledDownloadDir } from './real-icloud-controlled-download-dir-lib.mjs';
import { evaluateRealIcloudBatchProducer } from './real-icloud-batch-producer-lib.mjs';
import { evaluateRealIcloudNoLoopProducer } from './real-icloud-no-loop-producer-lib.mjs';
import { evaluateRealProviderArtifactRedaction } from './real-provider-artifact-redaction-lib.mjs';
import { evaluateDownloadPartialFileSafety } from './download-partial-file-safety-lib.mjs';
import { isTruthy, requirement, statusFromRequirements, blockReasons } from './real-icloud-proof-evidence-utils.mjs';

export function evaluateRealIcloudEvidenceRunPackage(env = process.env, opts = {}) {
  const sections = {
    explicit_opt_in: isTruthy(env.PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD) ? 'PASSED' : 'BLOCKED',
    auth: evaluateRealAuthEvidenceProducer(env, opts).proofStatus,
    filter: evaluateRealIcloudFilterConfig(env, opts).proofStatus,
    download_dir: evaluateRealIcloudControlledDownloadDir(env, opts).proofStatus,
    batch1: evaluateRealIcloudBatchProducer(env, { ...opts, manifestEnv: 'PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE', expectedIndex: 0, label: 'batch1' }).proofStatus,
    batch2: evaluateRealIcloudBatchProducer(env, { ...opts, manifestEnv: 'PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE', expectedIndex: 1, label: 'batch2' }).proofStatus,
    no_loop: evaluateRealIcloudNoLoopProducer(env, opts).proofStatus,
    redaction: evaluateRealProviderArtifactRedaction(env, opts).proofStatus,
    partial_file_safety: evaluateDownloadPartialFileSafety(env, opts).proofStatus,
  };
  const requirements = Object.entries(sections).map(([name, status]) => requirement(name, status === 'PASSED', `${name} status is ${status}`));
  return { proofStatus: statusFromRequirements(requirements), sections, requirements, block_reasons: blockReasons(requirements), required_env: ['PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD','PF_AUTH_SESSION_USABLE_EVIDENCE_FILE','PF_REAL_ICLOUD_FILTER_FILE','PF_REAL_ICLOUD_DOWNLOAD_DIR','PF_REAL_ICLOUD_DOWNLOAD_LEDGER_FILE','PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE','PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE'] };
}
