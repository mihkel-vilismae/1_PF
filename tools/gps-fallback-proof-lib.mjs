/**
 * Deterministic GPS fallback proof library for PF_login.
 * Runs the backend Python GPS provider chain against local fixture files only.
 * Proves JSON, XMP, text, filename-token, and path-token GPS fallbacks.
 * Writes no media data into Git and returns a sanitized proof envelope.
 * Keeps proof output under ignored runtime_data/proofs through proof-utils.
 */
import { spawnSync } from 'node:child_process';
import { createProofEnvelope, sanitizeText } from './proof-utils.mjs';

/** Builds the deterministic Python script used by the GPS fallback proof. */
export function buildGpsFallbackProofPythonScript() {
  return String.raw`
import json
import os
import sys
import tempfile
from pathlib import Path

repo_root = sys.argv[1]
sys.path.insert(0, os.path.join(repo_root, 'server', 'scripts'))

from media_pipeline.gps_exif_provider import default_gps_providers
from media_pipeline.provider_chain import run_gps_provider_chain
from media_pipeline.provider_contracts import GpsProviderInput


def run_case(case_name, media_path):
    result = run_gps_provider_chain(GpsProviderInput(str(media_path)), default_gps_providers())
    return {
        'case': case_name,
        'provider_id': result.provider_id,
        'status': result.status,
        'parser_method': result.parser_method,
        'latitude': round(float(result.latitude), 6) if result.latitude is not None else None,
        'longitude': round(float(result.longitude), 6) if result.longitude is not None else None,
        'altitude': float(result.altitude) if result.altitude is not None else None,
    }

with tempfile.TemporaryDirectory() as temp_dir:
    root = Path(temp_dir)
    json_media = root / 'json_photo.jpg'
    json_media.write_text('not an image, EXIF should fail safely', encoding='utf-8')
    (root / 'json_photo.jpg.json').write_text(json.dumps({'latitude': 58.377625, 'longitude': 26.729006, 'altitude': 55.5}), encoding='utf-8')

    xmp_media = root / 'xmp_photo.jpg'
    xmp_media.write_text('not an image, EXIF should fail safely', encoding='utf-8')
    (root / 'xmp_photo.xmp').write_text('<xmpmeta><gps latitude="59.437000" longitude="24.753600" altitude="12" /></xmpmeta>', encoding='utf-8')

    text_media = root / 'text_photo.jpg'
    text_media.write_text('not an image, EXIF should fail safely', encoding='utf-8')
    (root / 'text_photo.txt').write_text('lat=57.846000 lon=27.019000 alt=84', encoding='utf-8')

    filename_media = root / 'holiday_lat_58.380000_lon_26.720000.jpg'
    filename_media.write_text('not an image, EXIF should fail safely', encoding='utf-8')

    path_dir = root / 'gps_lat_58.100000_lon_27.100000'
    path_dir.mkdir()
    path_media = path_dir / 'path_photo.jpg'
    path_media.write_text('not an image, EXIF should fail safely', encoding='utf-8')

    cases = [
        ('json_sidecar', json_media),
        ('xmp_sidecar', xmp_media),
        ('text_sidecar', text_media),
        ('filename_coordinates', filename_media),
        ('path_coordinates', path_media),
    ]
    results = [run_case(name, media) for name, media in cases]

print(json.dumps({
    'default_provider_order': [provider.provider_id for provider in default_gps_providers()],
    'results': results,
}))
`;
}

/** Runs the local Python GPS fallback proof and returns a proof envelope. */
export async function runGpsFallbackProof({ metadata, cwd = process.cwd() }) {
  const startedAt = Date.now();
  const processResult = spawnSync('python3', ['-c', buildGpsFallbackProofPythonScript(), cwd], {
    cwd,
    encoding: 'utf8',
    timeout: 60000,
  });
  const commandResult = {
    command: 'python3',
    args: ['-c', '[GPS_FALLBACK_PROOF_SCRIPT]', cwd],
    exitCode: processResult.status,
    signal: processResult.signal,
    timedOut: Boolean(processResult.error && processResult.error.code === 'ETIMEDOUT'),
    durationMs: Date.now() - startedAt,
    stdout: sanitizeText(processResult.stdout ?? '').text,
    stderr: sanitizeText(processResult.stderr ?? '').text,
  };

  if (commandResult.exitCode !== 0) {
    return createProofEnvelope({
      proofKind: 'gps_fallback',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: commandResult.timedOut ? 'TIMED_OUT' : 'FAILED',
      runtimeMode: 'deterministic_local',
      evidence: { command_result: commandResult },
      knownLimitations: ['The Python GPS fallback proof did not complete successfully.'],
    });
  }

  const payload = JSON.parse(processResult.stdout || '{}');
  const expectedProviders = new Set(['json_sidecar', 'xmp_sidecar', 'text_sidecar', 'filename_coordinates', 'path_coordinates']);
  const observedProviders = new Set((payload.results ?? []).map((result) => result.provider_id));
  const missingProviders = [...expectedProviders].filter((providerId) => !observedProviders.has(providerId));
  const failedResults = (payload.results ?? []).filter((result) => result.status !== 'SUCCEEDED');
  const proofPassed = missingProviders.length === 0 && failedResults.length === 0;

  return createProofEnvelope({
    proofKind: 'gps_fallback',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: proofPassed ? 'PASSED' : 'PARTIAL',
    runtimeMode: 'deterministic_local',
    evidence: {
      command_result: commandResult,
      default_provider_order: payload.default_provider_order ?? [],
      expected_provider_ids: [...expectedProviders].sort(),
      observed_provider_ids: [...observedProviders].sort(),
      missing_provider_ids: missingProviders,
      failed_results: failedResults,
      results: payload.results ?? [],
    },
    knownLimitations: proofPassed
      ? ['This proof covers local deterministic fallback parsing only; it does not prove every real media file shape.']
      : ['At least one deterministic GPS fallback provider did not produce a successful result.'],
  });
}
