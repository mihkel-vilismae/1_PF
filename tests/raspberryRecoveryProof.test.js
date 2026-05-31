/**
 * Tests Raspberry power-loss recovery proof safety behavior.
 * Verifies hardware proof cannot be claimed from unchecked source state.
 * Does not require Raspberry hardware or mutate startup services.
 * Protects the distinction between Windows CronEmulator and real Raspberry proof.
 * Runs through the standard Node test runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRaspberryRecoveryProof, determineRaspberryRecoveryStatus, parseWorkerList } from '../tools/raspberry-recovery-proof-lib.mjs';

/** Verifies worker list parsing stays deterministic and whitespace-safe. */
test('raspberry proof parses expected worker list', () => { assert.deepEqual(parseWorkerList('download_worker, index_worker, playback_worker'), ['download_worker', 'index_worker', 'playback_worker']); });

/** Verifies proof status cannot pass without real power-loss evidence. */
test('raspberry proof status blocks when hardware proof is not enabled or not performed', () => { assert.equal(determineRaspberryRecoveryStatus({ enabled: false, powerLossPerformed: true, workersStarted: true, playbackSafe: true }), 'BLOCKED'); assert.equal(determineRaspberryRecoveryStatus({ enabled: true, powerLossPerformed: false, workersStarted: true, playbackSafe: true }), 'BLOCKED'); });

/** Verifies a passed status requires observed workers and safe playback. */
test('raspberry proof status requires workers and playback for pass', () => { assert.equal(determineRaspberryRecoveryStatus({ enabled: true, powerLossPerformed: true, workersStarted: true, playbackSafe: true }), 'PASSED'); assert.equal(determineRaspberryRecoveryStatus({ enabled: true, powerLossPerformed: true, workersStarted: true, playbackSafe: false }), 'PARTIAL'); assert.equal(determineRaspberryRecoveryStatus({ enabled: true, powerLossPerformed: true, workersStarted: false, playbackSafe: false }), 'FAILED'); });

/** Verifies generated envelope explicitly rejects CronEmulator as hardware proof. */
test('raspberry proof envelope marks Windows CronEmulator as non-hardware proof', () => { const envelope = buildRaspberryRecoveryProof({ metadata: { version: '0.7.34', gitCommit: 'test' }, env: {}, evidence: { logExcerpt: 'C:\\Users\\mihke\\private\\log.txt' } }); assert.equal(envelope.proof_status, 'BLOCKED'); assert.equal(envelope.evidence.windows_cron_emulator_is_not_hardware_proof, true); assert.equal(String(envelope.evidence.logs.excerpt).includes('mihke'), false); });
