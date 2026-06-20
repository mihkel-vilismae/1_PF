import { evaluateRealAuthEvidenceProducer } from './real-auth-evidence-producer-lib.mjs';
import { evaluateRealIcloudFilterConfig } from './real-icloud-filter-config-lib.mjs';
import { evaluateRealIcloudControlledDownloadDir } from './real-icloud-controlled-download-dir-lib.mjs';
import { evaluateRealIcloudBatchProducer } from './real-icloud-batch-producer-lib.mjs';
import { evaluateRealIcloudNoLoopProducer } from './real-icloud-no-loop-producer-lib.mjs';
import { evaluateRealProviderArtifactRedaction } from './real-provider-artifact-redaction-lib.mjs';
import { evaluateDownloadPartialFileSafety } from './download-partial-file-safety-lib.mjs';
export function evaluateRealIcloudDownloadReport(env = process.env, opts = {}) {
  const sections = {
    auth: evaluateRealAuthEvidenceProducer(env, opts).proofStatus,
    filter: evaluateRealIcloudFilterConfig(env, opts).proofStatus,
    download_dir: evaluateRealIcloudControlledDownloadDir(env, opts).proofStatus,
    batch1: evaluateRealIcloudBatchProducer(env, { ...opts, manifestEnv: 'PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE', expectedIndex: 0, label: 'batch1' }).proofStatus,
    batch2: evaluateRealIcloudBatchProducer(env, { ...opts, manifestEnv: 'PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE', expectedIndex: 1, label: 'batch2' }).proofStatus,
    no_loop: evaluateRealIcloudNoLoopProducer(env, opts).proofStatus,
    redaction: evaluateRealProviderArtifactRedaction(env, opts).proofStatus,
    partial_file_safety: evaluateDownloadPartialFileSafety(env, opts).proofStatus,
  };
  const proofStatus = Object.values(sections).every((status) => status === 'PASSED') ? 'PASSED' : 'BLOCKED';
  return { proofStatus, sections, summary: 'Real iCloud download report requires all evidence path sections to pass.' };
}
