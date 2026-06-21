import { createHash } from 'node:crypto';
import { basename, join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

const MARKER_PATTERN = /^PF_ADDR_[0-9A-Z_\-]+$/;
const DEFAULT_ADDRESS = 'Tartu, Estonia';

function safeRunId(input) {
  return String(input ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14))
    .toUpperCase()
    .replace(/[^0-9A-Z_-]/g, '_')
    .slice(0, 48);
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function quoteForSh(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function buildAddressOverlayProofMarker({ runId = null } = {}) {
  const normalizedRunId = safeRunId(runId);
  return {
    run_id: normalizedRunId,
    marker: `PF_ADDR_${normalizedRunId}`,
    marker_pattern: 'PF_ADDR_<run_id>',
  };
}

export function readAddressOverlayProofInput(env = process.env) {
  const marker = buildAddressOverlayProofMarker({ runId: env.PF_ADDRESS_OVERLAY_PROOF_RUN_ID });
  const primaryLine = String(env.PF_ADDRESS_OVERLAY_PROOF_ADDRESS_TEXT ?? DEFAULT_ADDRESS).trim() || DEFAULT_ADDRESS;
  const secondaryLine = String(env.PF_ADDRESS_OVERLAY_PROOF_SECONDARY_TEXT ?? marker.marker).trim() || marker.marker;
  return {
    ...marker,
    primary_line: primaryLine,
    secondary_line: secondaryLine.includes(marker.marker) ? secondaryLine : marker.marker,
    source_kind: String(env.PF_ADDRESS_OVERLAY_SOURCE_KIND ?? 'readiness_approved_address').trim() || 'readiness_approved_address',
  };
}

export function validateAddressOverlayProofMarker(input) {
  const errors = [];
  if (!input?.run_id) errors.push('run_id is required');
  if (!MARKER_PATTERN.test(String(input?.marker ?? ''))) errors.push('marker must match PF_ADDR_<run_id>');
  if (!String(input?.primary_line ?? '').trim()) errors.push('primary_line is required');
  if (!String(input?.secondary_line ?? '').includes(String(input?.marker ?? ''))) errors.push('secondary_line must include marker');
  return { status: errors.length ? 'FAILED' : 'PASSED', errors };
}

export function buildAddressOverlaySvg(input) {
  const width = 1280;
  const height = 720;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#101418"/>
  <rect x="48" y="516" width="1184" height="144" rx="24" fill="rgba(0,0,0,0.72)"/>
  <text x="84" y="585" font-family="Arial, sans-serif" font-size="44" fill="#ffffff">${escapeXml(input.primary_line)}</text>
  <text x="84" y="632" font-family="Arial, sans-serif" font-size="28" fill="#cfd8dc">${escapeXml(input.secondary_line)}</text>
</svg>
`;
}

export async function writeAddressOverlayRenderArtifact({ input, outputDir = join(process.cwd(), 'runtime_data', 'address_overlay') } = {}) {
  await mkdir(outputDir, { recursive: true });
  const svg = buildAddressOverlaySvg(input);
  const outputPath = join(outputDir, `address_overlay_${input.run_id}.svg`);
  await writeFile(outputPath, svg, 'utf8');
  return {
    artifact_path: outputPath,
    artifact_basename: basename(outputPath),
    artifact_sha256: sha256(svg),
    marker_in_artifact: svg.includes(input.marker),
    address_in_artifact: svg.includes(escapeXml(input.primary_line)),
    artifact_kind: 'svg_overlay_frame',
    artifact_path_redacted: true,
  };
}

export async function buildAddressOverlayProofMarkerContract({ metadata, env = process.env } = {}) {
  const input = readAddressOverlayProofInput(env);
  const validation = validateAddressOverlayProofMarker(input);
  return createProofEnvelope({
    proofKind: 'address_overlay_proof_marker_contract',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: validation.status,
    runtimeMode: 'address_overlay_marker_contract',
    evidence: {
      environment: getProofEnvironment(),
      overlay: input,
      validation,
      pass_criteria: 'Unique PF_ADDR_<run_id> marker is generated and included in overlay text.',
      non_claims: ['does not render pixels', 'does not execute the Raspberry display path', 'does not prove visual device output'],
    },
    knownLimitations: ['Marker contract proof only defines expected visible text for later render/display evidence.'],
  });
}

export async function buildRaspberryAddressOverlayTemplateProof({ metadata, env = process.env } = {}) {
  const input = readAddressOverlayProofInput(env);
  const validation = validateAddressOverlayProofMarker(input);
  const render = validation.status === 'PASSED' ? await writeAddressOverlayRenderArtifact({ input }) : null;
  const renderValidation = render ? {
    status: render.marker_in_artifact && render.address_in_artifact ? 'PASSED' : 'FAILED',
    errors: [
      ...(render.marker_in_artifact ? [] : ['marker missing from render artifact']),
      ...(render.address_in_artifact ? [] : ['address text missing from render artifact']),
    ],
  } : { status: 'FAILED', errors: ['marker validation failed; render skipped'] };
  const proofStatus = validation.status === 'PASSED' && renderValidation.status === 'PASSED' ? 'PASSED' : 'FAILED';
  return createProofEnvelope({
    proofKind: 'raspberry_address_overlay_template',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'raspberry_address_overlay_template_render',
    evidence: {
      environment: getProofEnvironment(),
      overlay: input,
      marker_validation: validation,
      render,
      render_validation: renderValidation,
      pass_criteria: 'Rendered SVG overlay artifact contains readiness-approved address text and exact PF_ADDR marker.',
      non_claims: ['rendered artifact is not proof of device visibility', 'does not prove real GPS/geocode product source'],
    },
    knownLimitations: ['Template/render proof is L1 evidence only; device display requires visual capture/operator evidence later.'],
  });
}

export function buildAddressOverlayEvidenceTemplate(markerInput = readAddressOverlayProofInput(process.env)) {
  return {
    overlay_marker: markerInput.marker,
    overlay_primary_line: markerInput.primary_line,
    overlay_secondary_line: markerInput.secondary_line,
    overlay_source_kind: markerInput.source_kind,
    native_display_path_observed: false,
    address_text_present: false,
    overlay_rendered_on_device: false,
    operator_observed: false,
    marker_visible_in_device_evidence: false,
    observed_at: new Date().toISOString(),
    operator_note: 'Set all required boolean fields to true only after observing real Raspberry/device display evidence containing overlay_marker.',
  };
}

export function buildDisplayCommand(env, artifactPath) {
  const template = String(env.PF_ADDRESS_OVERLAY_DISPLAY_COMMAND ?? '').trim();
  if (!template) return null;
  const quotedArtifact = quoteForSh(artifactPath);
  return template.includes('{artifact}') ? template.replaceAll('{artifact}', quotedArtifact) : `${template} ${quotedArtifact}`;
}

export async function buildRaspberryAddressOverlayDisplayCommandProof({ metadata, env = process.env, target = detectRaspberryTarget({ env }), runDisplayCommand = runCommand } = {}) {
  const input = readAddressOverlayProofInput(env);
  const validation = validateAddressOverlayProofMarker(input);
  const render = validation.status === 'PASSED' ? await writeAddressOverlayRenderArtifact({ input }) : null;
  const blockReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  const command = render ? buildDisplayCommand(env, render.artifact_path) : null;
  if (!command) blockReasons.push('PF_ADDRESS_OVERLAY_DISPLAY_COMMAND is not set; configure a real Raspberry display command using optional {artifact} placeholder');
  if (validation.status !== 'PASSED') blockReasons.push(`marker contract invalid: ${validation.errors.join(', ')}`);

  let commandResult = null;
  if (!blockReasons.length) {
    const result = await runDisplayCommand('sh', ['-lc', command], { timeoutMs: Number(env.PF_ADDRESS_OVERLAY_DISPLAY_COMMAND_TIMEOUT_MS ?? 15000) });
    commandResult = {
      command: 'sh',
      args: ['-lc', '[ADDRESS_OVERLAY_DISPLAY_COMMAND]'],
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut: result.timedOut,
      durationMs: result.durationMs,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  const failedReasons = [];
  if (commandResult && commandResult.exitCode !== 0) failedReasons.push(`display command exited ${commandResult.exitCode}`);
  const proofStatus = blockReasons.length ? 'BLOCKED' : failedReasons.length ? 'FAILED' : 'PASSED';
  return createProofEnvelope({
    proofKind: 'raspberry_address_overlay_display_command',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'raspberry_address_overlay_display_command',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      overlay: input,
      marker_validation: validation,
      render,
      display_command: {
        configured: Boolean(command),
        template_redacted: command ? '[CONFIGURED]' : null,
        artifact_placeholder_supported: String(env.PF_ADDRESS_OVERLAY_DISPLAY_COMMAND ?? '').includes('{artifact}'),
      },
      command_result: commandResult,
      block_reasons: blockReasons,
      failed_reasons: failedReasons,
      pass_criteria: 'PASSED only when Raspberry target executes configured display command with rendered marker artifact. This is not visual proof.',
      non_claims: ['does not prove the marker was visible on screen', 'does not close address_overlay_device_display readiness'],
    }),
    knownLimitations: proofStatus === 'PASSED'
      ? ['Display command exited zero, but visual capture/operator evidence is still required before the device-display readiness gate can pass.']
      : ['Configure/run a real Raspberry display command; visual marker evidence is a later D4-D5 proof.'],
  });
}
