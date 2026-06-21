/** Raspberry address overlay device-display proof scaffold. */
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { buildAddressOverlayEvidenceTemplate as buildMarkerAddressOverlayEvidenceTemplate } from './address-overlay-proof-marker-lib.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export const ADDRESS_OVERLAY_REQUIRED_FIELDS = Object.freeze([
  'native_display_path_observed',
  'address_text_present',
  'overlay_rendered_on_device',
  'operator_observed',
  'marker_visible_in_device_evidence',
]);

export const ADDRESS_OVERLAY_VISUAL_EVIDENCE_KINDS = Object.freeze([
  'framebuffer_capture',
  'screenshot',
  'mpv_screenshot',
  'browser_capture',
  'operator_photo',
]);

const SHA256_PATTERN = /^(?:sha256:)?[a-f0-9]{64}$/i;

export function buildAddressOverlayEvidenceTemplate() {
  return buildMarkerAddressOverlayEvidenceTemplate();
}

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

export function validateAddressOverlayVisualEvidence(data = {}) {
  const visual = data.visual_evidence ?? {};
  const errors = [];
  const expectedMarker = String(visual.expected_marker ?? data.overlay_marker ?? '').trim();
  const observedMarker = String(visual.observed_marker ?? '').trim();
  const kind = String(visual.kind ?? '').trim();
  if (!data.overlay_marker) errors.push('overlay_marker is required');
  if (!ADDRESS_OVERLAY_VISUAL_EVIDENCE_KINDS.includes(kind)) errors.push(`visual_evidence.kind must be one of ${ADDRESS_OVERLAY_VISUAL_EVIDENCE_KINDS.join(', ')}`);
  if (!SHA256_PATTERN.test(String(visual.artifact_sha256 ?? ''))) errors.push('visual_evidence.artifact_sha256 must be a sha256 hex digest');
  if (visual.artifact_path_redacted !== true) errors.push('visual_evidence.artifact_path_redacted must be true');
  if (!expectedMarker || expectedMarker !== data.overlay_marker) errors.push('visual_evidence.expected_marker must equal overlay_marker');
  if (!observedMarker || observedMarker !== expectedMarker) errors.push('visual_evidence.observed_marker must equal expected marker');
  if (visual.marker_validation !== 'matched') errors.push('visual_evidence.marker_validation must be matched');
  if (data.marker_visible_in_device_evidence !== true) errors.push('marker_visible_in_device_evidence must be true');
  if (kind === 'operator_photo' && visual.operator_confirmation !== true) errors.push('operator_photo evidence requires operator_confirmation true');
  return {
    status: errors.length ? 'FAILED' : 'PASSED',
    errors,
    evidence_level: errors.length ? 'L2_display_attempt_or_incomplete' : kind === 'operator_photo' ? 'L4_operator_photo' : 'L3_captured_output',
    visual_evidence_kind: kind || null,
    expected_marker: expectedMarker || null,
    marker_validation: visual.marker_validation ?? null,
  };
}

export function evaluateAddressOverlayEvidence({ target, loadedEvidence }) {
  const blockReasons = [];
  const failedReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (loadedEvidence.load_error) blockReasons.push(loadedEvidence.load_error);
  const data = loadedEvidence.data ?? {};
  const missing = ADDRESS_OVERLAY_REQUIRED_FIELDS.filter((field) => data[field] !== true);
  let visualEvidenceValidation = { status: 'FAILED', errors: ['visual evidence was not loaded'], evidence_level: 'L0_missing' };
  if (!loadedEvidence.load_error) {
    if (missing.length) failedReasons.push(`address overlay evidence missing true fields: ${missing.join(', ')}`);
    visualEvidenceValidation = validateAddressOverlayVisualEvidence(data);
    if (visualEvidenceValidation.status !== 'PASSED') failedReasons.push(`visual evidence invalid: ${visualEvidenceValidation.errors.join(', ')}`);
  }
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons, missingFields: missing, visualEvidenceValidation };
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons, missingFields: missing, visualEvidenceValidation };
  return { proofStatus: 'PASSED', blockReasons, failedReasons, missingFields: [], visualEvidenceValidation };
}

export async function buildRaspberryAddressOverlayDeviceEvidenceProof({ metadata, env = process.env, evidence = null } = {}) {
  const loadedEvidence = await loadAddressOverlayEvidence({ env, evidence });
  const validation = loadedEvidence.load_error
    ? { status: 'BLOCKED', errors: [loadedEvidence.load_error], evidence_level: 'L0_missing' }
    : validateAddressOverlayVisualEvidence(loadedEvidence.data ?? {});
  const proofStatus = validation.status === 'PASSED' ? 'PASSED' : loadedEvidence.load_error ? 'BLOCKED' : 'FAILED';
  return createProofEnvelope({
    proofKind: 'raspberry_address_overlay_device_evidence',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'raspberry_address_overlay_device_evidence',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      evidence_source: loadedEvidence.source,
      address_overlay_evidence: loadedEvidence.data,
      visual_evidence_validation: validation,
      allowed_visual_evidence_kinds: ADDRESS_OVERLAY_VISUAL_EVIDENCE_KINDS,
      pass_criteria: 'PASSED only when visual evidence metadata links the exact PF_ADDR marker to a screenshot/framebuffer/operator-photo artifact hash.',
      non_claims: ['does not run OCR', 'does not inspect image pixels automatically', 'does not prove the full display gate unless Raspberry target proof also passes'],
    }),
    knownLimitations: proofStatus === 'PASSED'
      ? ['Visual evidence is structured/operator supplied; no OCR or pixel inspection is performed in this slice.']
      : ['Provide PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE with matched marker visual evidence metadata.'],
  });
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
      pass_criteria: 'PASSED only on Raspberry when operator/proof evidence shows native device display path, address text, rendered overlay, operator observation, and visual evidence marker match.',
      non_claims: ['does not itself render the overlay', 'does not run OCR', 'does not prove iCloud/GPS/geocode provider correctness', 'does not prove full cron workflow'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED'
      ? ['Address overlay visual evidence is operator/proof supplied for this run; no OCR or pixel inspection is performed.']
      : ['Provide PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE after a real device-display overlay observation with matched PF_ADDR marker evidence.'],
  });
}
