import { existsSync, readFileSync } from 'node:fs';
import { blockReasons, requirement, statusFromRequirements } from './real-icloud-proof-evidence-utils.mjs';
export function evaluateRealIcloudProofRunbook() {
  const file = 'docs/10_runbooks/real_icloud_filtered_download_operator_runbook.md';
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const phrases = ['PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD','PF_AUTH_SESSION_USABLE_EVIDENCE_FILE','PF_REAL_ICLOUD_FILTER_FILE','PF_REAL_ICLOUD_DOWNLOAD_DIR','PF_REAL_ICLOUD_DOWNLOAD_LEDGER_FILE','PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE','PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE','Secrets must not be uploaded'];
  const requirements = [requirement('runbook_exists', existsSync(file), `${file} must exist`), ...phrases.map((phrase) => requirement(`runbook_mentions:${phrase}`, text.includes(phrase), `Runbook must mention ${phrase}`))];
  return { proofStatus: statusFromRequirements(requirements), requirements, block_reasons: blockReasons(requirements) };
}
