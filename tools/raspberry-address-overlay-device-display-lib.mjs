/** Raspberry address overlay device-display proof scaffold. */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export const ADDRESS_OVERLAY_REQUIRED_FIELDS = Object.freeze([
  'native_display_path_observed',
  'address_text_present',
  'overlay_rendered_on_device',
  'operator_observed',
]);

export async function loadAddressOverlayEvidence({ env = process.env, evidence = null } = {}) {
  if (evidence) return { source: 'injected', data: evidence, load_error: null };
  const file = env.PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE;
  if (!file) return { source: 'none', data: null, load_error: 'PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE is not set' };
  try {
    return { source: file, data: JSON.parse(await readFile(file, 'utf8')), load_error: null };
  } catch (error) {
    return { source: file, data: null, load_error: error instanceof Error ? error.message : String(error) };
  }
}

export function evaluateAddressOverlayEvidence({ target, loadedEvidence }) {
  const blockReasons = [];
  const failedReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (loadedEvidence.load_error) blockReasons.push(loadedEvidence.load_error);
  const data = loadedEvidence.data ?? {};
  const missing = ADDRESS_OVERLAY_REQUIRED_FIELDS.filter((field) => data[field] !== true);
  if (!loadedEvidence.load_error && missing.length) failedReasons.push(`address overlay evidence missing true fields: ${missing.join(', ')}`);
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons, missingFields: missing };
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons, missingFields: missing };
  return { proofStatus: 'PASSED', blockReasons, failedReasons, missingFields: [] };
}

export async function buildRaspberryAddressOverlayDeviceDisplayProof({ metadata, env = process.env, evidence = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const loadedEvidence = await loadAddressOverlayEvidence({ env, evidence });
  const evaluation = evaluateAddressOverlayEvidence({ target, loadedEvidence });
  return createProofEnvelope({
    proofKind: 'raspberry_address_overlay_device_display',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'raspberry_address_overlay_device_display',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      evidence_source: loadedEvidence.source,
      address_overlay_evidence: loadedEvidence.data,
      required_fields: ADDRESS_OVERLAY_REQUIRED_FIELDS,
      evaluation,
      pass_criteria: 'PASSED only on Raspberry when operator/proof evidence shows native device display path, address text, rendered overlay, and operator observation.',
      non_claims: ['does not itself render the overlay', 'does not prove iCloud/GPS/geocode provider correctness', 'does not prove full cron workflow'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED' ? ['Address overlay evidence is operator/proof supplied for this run.'] : ['Provide PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE after a real device-display overlay observation.'],
  });
}
