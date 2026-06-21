import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRaspberryAddressOverlayDisplayCommandProof } from '../tools/address-overlay-proof-marker-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };

test('display command proof blocks off Raspberry and without command', async () => {
  const envelope = await buildRaspberryAddressOverlayDisplayCommandProof({ metadata, env: {}, target: { raspberry_like: false } });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.block_reasons.join('\n'), /Raspberry/);
  assert.match(envelope.evidence.block_reasons.join('\n'), /PF_ADDRESS_OVERLAY_DISPLAY_COMMAND/);
});

test('display command proof executes configured command on Raspberry-like target without visual claim', async () => {
  let observedCommand = null;
  const envelope = await buildRaspberryAddressOverlayDisplayCommandProof({
    metadata,
    env: { PF_ADDRESS_OVERLAY_PROOF_RUN_ID: '20260621_193027', PF_ADDRESS_OVERLAY_DISPLAY_COMMAND: 'printf display {artifact}' },
    target: { raspberry_like: true, platform: 'linux', arch: 'arm64' },
    runDisplayCommand: async (command, args) => {
      observedCommand = { command, args };
      return { exitCode: 0, signal: null, timedOut: false, durationMs: 3, stdout: 'display', stderr: '' };
    },
  });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(observedCommand.command, 'sh');
  assert.equal(envelope.evidence.command_result.args[1], '[ADDRESS_OVERLAY_DISPLAY_COMMAND]');
  assert.match(envelope.evidence.non_claims.join('\n'), /does not prove the marker was visible/);
});

test('display command proof fails when Raspberry command exits nonzero', async () => {
  const envelope = await buildRaspberryAddressOverlayDisplayCommandProof({
    metadata,
    env: { PF_ADDRESS_OVERLAY_PROOF_RUN_ID: '20260621_193027', PF_ADDRESS_OVERLAY_DISPLAY_COMMAND: 'false {artifact}' },
    target: { raspberry_like: true, platform: 'linux', arch: 'arm64' },
    runDisplayCommand: async () => ({ exitCode: 2, signal: null, timedOut: false, durationMs: 3, stdout: '', stderr: 'no display' }),
  });
  assert.equal(envelope.proof_status, 'FAILED');
  assert.match(envelope.evidence.failed_reasons.join('\n'), /exited 2/);
});
