/**
 * Address display proof library for PF_login.
 * Runs a deterministic local pipeline from GPS sidecar through playback contract.
 * Proves geocoded address text reaches queued/current playback payloads.
 * Uses existing Python sqlite_admin stage helpers without backend shortcuts.
 * Writes sanitized proof envelopes through the shared proof utilities.
 */
import { spawnSync } from 'node:child_process';
import { createProofEnvelope, getProofEnvironment, sanitizeText } from './proof-utils.mjs';

const PYTHON_COMMAND_CANDIDATES = Object.freeze([
  { command: 'python3', prefixArgs: [] },
  { command: 'py', prefixArgs: ['-3'] },
  { command: 'python', prefixArgs: [] },
]);

/** Runs the proof Python script with Windows and POSIX command fallbacks. */
function runPythonProofScript(script, cwd) {
  const attempts = [];
  for (const candidate of PYTHON_COMMAND_CANDIDATES) {
    const args = [...candidate.prefixArgs, '-c', script, cwd];
    const result = spawnSync(candidate.command, args, {
      cwd,
      encoding: 'utf8',
      timeout: 120000,
    });
    attempts.push({ candidate, args, result });
    if (!result.error || result.error.code !== 'ENOENT') {
      return { candidate, args, result, attempts };
    }
  }
  const lastAttempt = attempts[attempts.length - 1];
  return { ...lastAttempt, attempts };
}

/** Builds the deterministic Python script that proves address propagation. */
export function buildAddressDisplayProofPythonScript() {
  return String.raw`
import json
import os
import sys
import tempfile
from pathlib import Path

repo_root = sys.argv[1]
sys.path.insert(0, os.path.join(repo_root, 'server', 'scripts'))

from sqlite_admin import (
    stage2_index_register,
    stage3_process_gps_queue,
    stage4_process_geocode_queue,
    prepare_slideshow_queue,
    select_current_item,
    playback_contract,
)

with tempfile.TemporaryDirectory() as temp_dir:
    root = Path(temp_dir)
    media_dir = root / 'downloads'
    media_dir.mkdir()
    db_path = root / 'proof.sqlite'
    schema_path = os.path.join(repo_root, 'database', 'schema.sql')
    media_path = media_dir / 'address_display_photo.jpg'
    media_path.write_text('not a real image; JSON sidecar proves fallback path', encoding='utf-8')
    sidecar_payload = {'latitude': 58.37762, 'longitude': 26.72901, 'altitude': 55.5}
    (media_dir / 'address_display_photo.jpg.json').write_text(json.dumps(sidecar_payload), encoding='utf-8')

    indexed = stage2_index_register(str(db_path), str(media_dir), '2026-05-31T00:00:00Z', schema_path)
    gps = stage3_process_gps_queue(str(db_path), '2026-05-31T00:00:01Z', schema_path)
    geocode = stage4_process_geocode_queue(str(db_path), '2026-05-31T00:00:02Z', schema_path)
    queue = prepare_slideshow_queue(str(db_path), '2026-05-31T00:00:03Z', schema_path)
    selected = select_current_item(str(db_path), '2026-05-31T00:00:04Z', repo_root)
    contract = playback_contract(str(db_path), repo_root)

    expected_address = 'Lat: 58.37762, Lon: 26.72901'
    selected_address = (selected.get('selected') or {}).get('addressText')
    current_item = contract.get('currentItem') or {}
    next_item = contract.get('nextItem') or {}

    print(json.dumps({
        'expected_address': expected_address,
        'stage_results': {
            'indexing': indexed,
            'gps': gps,
            'geocode': geocode,
            'queue': queue,
            'selected': selected,
        },
        'playback_contract': {
            'currentItem': current_item,
            'nextItem': next_item,
            'queue': contract.get('queue'),
        },
        'assertions': {
            'gps_success': gps.get('successCount') == 1,
            'geocode_success': geocode.get('successCount') == 1,
            'queue_inserted': queue.get('insertedCount') == 1,
            'selection_outcome': selected.get('outcome'),
            'selected_address_matches': selected_address == expected_address,
            'current_item_has_address': current_item.get('hasResolvedAddress') is True,
            'current_item_address_matches': current_item.get('resolvedAddress') == expected_address,
        },
    }))
`;
}

/** Runs the deterministic address propagation proof and returns a proof envelope. */
export async function runAddressDisplayProof({ metadata, cwd = process.cwd() }) {
  const startedAt = Date.now();
  const proofScript = buildAddressDisplayProofPythonScript();
  const { candidate, args, result: processResult, attempts } = runPythonProofScript(proofScript, cwd);
  const commandResult = {
    command: candidate.command,
    args: [...candidate.prefixArgs, '-c', '[ADDRESS_DISPLAY_PROOF_SCRIPT]', cwd],
    attemptedCommands: attempts.map((attempt) => ({
      command: attempt.candidate.command,
      args: [...attempt.candidate.prefixArgs, '-c', '[ADDRESS_DISPLAY_PROOF_SCRIPT]', cwd],
      errorCode: attempt.result.error?.code ?? null,
      exitCode: attempt.result.status,
    })),
    exitCode: processResult.status,
    signal: processResult.signal,
    timedOut: Boolean(processResult.error && processResult.error.code === 'ETIMEDOUT'),
    durationMs: Date.now() - startedAt,
    stdout: sanitizeText(processResult.stdout ?? '').text,
    stderr: sanitizeText(processResult.stderr ?? processResult.error?.message ?? '').text,
  };

  if (commandResult.exitCode !== 0) {
    return createProofEnvelope({
      proofKind: 'address_display',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: commandResult.timedOut ? 'TIMED_OUT' : 'FAILED',
      runtimeMode: 'deterministic_local',
      evidence: { environment: getProofEnvironment(), command_result: commandResult },
      knownLimitations: ['The deterministic address display proof did not complete successfully.'],
    });
  }

  const payload = JSON.parse(processResult.stdout || '{}');
  const assertions = payload.assertions ?? {};
  const proofPassed = Boolean(
    assertions.gps_success &&
    assertions.geocode_success &&
    assertions.queue_inserted &&
    assertions.selection_outcome === 'selected' &&
    assertions.selected_address_matches &&
    assertions.current_item_has_address &&
    assertions.current_item_address_matches,
  );

  return createProofEnvelope({
    proofKind: 'address_display',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: proofPassed ? 'PASSED' : 'PARTIAL',
    runtimeMode: 'deterministic_local',
    evidence: {
      environment: getProofEnvironment(),
      command_result: commandResult,
      expected_address: payload.expected_address,
      assertions,
      stage_results: payload.stage_results,
      playback_contract: payload.playback_contract,
      verified_contracts: [
        'GPS sidecar coordinates reach canonical_media_assets',
        'deterministic geocode writes address_text',
        'Stage 5 queues only GEOCODE_FOUND assets with address text',
        'Stage 6 selected payload includes addressText',
        'playback_contract currentItem exposes resolvedAddress and hasResolvedAddress',
      ],
    },
    knownLimitations: proofPassed
      ? ['This proof uses deterministic local placeholder geocoding; it does not prove a network geocode provider or browser rendering.']
      : ['Address propagation did not satisfy every deterministic assertion.'],
  });
}
