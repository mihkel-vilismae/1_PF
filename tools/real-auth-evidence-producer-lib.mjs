import { validateAuthSessionUsableEvidence } from './auth-session-usable-evidence-lib.mjs';
import { blockReasons, readJsonFile, requirement, statusFromRequirements } from './real-icloud-proof-evidence-utils.mjs';
export function evaluateRealAuthEvidenceProducer(env = process.env, { cwd = process.cwd() } = {}) {
  const artifact = readJsonFile(env.PF_AUTH_SESSION_USABLE_EVIDENCE_FILE, { cwd });
  const requirements = [requirement('auth_evidence_file_configured', Boolean(env.PF_AUTH_SESSION_USABLE_EVIDENCE_FILE), 'Set PF_AUTH_SESSION_USABLE_EVIDENCE_FILE to redacted usable-session evidence.')];
  if (artifact.value) {
    const validation = validateAuthSessionUsableEvidence(artifact.value);
    requirements.push(requirement('auth_evidence_schema_valid', validation.status === 'PASSED', validation.errors.join('; ') || 'Auth evidence validates.'));
    requirements.push(requirement('auth_evidence_secret_safe', validation.status === 'PASSED', 'Auth evidence schema rejects Apple IDs, raw 2FA codes, cookies, tokens, raw session path, and secret-like keys.')); 
  } else {
    requirements.push(requirement('auth_evidence_schema_valid', false, artifact.reason));
    requirements.push(requirement('auth_evidence_secret_safe', false, 'No auth evidence was available to audit.'));
  }
  return { proofStatus: statusFromRequirements(requirements), requirements, block_reasons: blockReasons(requirements) };
}
