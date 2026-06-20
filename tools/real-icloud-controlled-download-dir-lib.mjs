import { blockReasons, directoryRequirement, requirement, statusFromRequirements, SECRET_RE } from './real-icloud-proof-evidence-utils.mjs';
export function evaluateRealIcloudControlledDownloadDir(env = process.env, { cwd = process.cwd() } = {}) {
  const requirements = [requirement('download_dir_configured', Boolean(env.PF_REAL_ICLOUD_DOWNLOAD_DIR), 'Set PF_REAL_ICLOUD_DOWNLOAD_DIR to a proof-owned download directory.')];
  if (env.PF_REAL_ICLOUD_DOWNLOAD_DIR) {
    requirements.push(directoryRequirement(env.PF_REAL_ICLOUD_DOWNLOAD_DIR, 'download_dir', { cwd }));
    requirements.push(requirement('download_dir_secret_safe', !SECRET_RE.test(env.PF_REAL_ICLOUD_DOWNLOAD_DIR), 'Download dir path must not contain raw account/session/secret identifiers.'));
  }
  return { proofStatus: statusFromRequirements(requirements), requirements, block_reasons: blockReasons(requirements) };
}
