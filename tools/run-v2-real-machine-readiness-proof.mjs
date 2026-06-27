#!/usr/bin/env node
import { check, commandAvailable, emitProof, packageScripts, packageVersionMatches, parseArgs, proofResult, readJson, readText } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const checks = [];
const scripts = packageScripts();
const pkg = readJson('package.json');
const exampleEnv = readText('example.env');

check(checks, 'version-identity', 'VERSION, package.json and package-lock.json versions match.', packageVersionMatches());
check(checks, 'dependency-scripts', 'Full test/build/typecheck commands exist.', Boolean(scripts.test && scripts.build && scripts.typecheck));
check(checks, 'proof-contract-script', 'Static autonomous contract proof script exists.', Boolean(scripts['proof:v2-autonomous-contract']));
check(checks, 'real-machine-proof-scripts', 'Real-machine proof scripts are registered.', Boolean(scripts['proof:v2-real-cron-evidence'] && scripts['proof:v2-real-playback-display'] && scripts['proof:v2-final-autonomous-bundle']));
check(checks, 'worker-truth-env-template', 'example.env defines real/test V2 worker truth directories.', exampleEnv.includes('V2_WORKER_TRUTH_DIR=') && exampleEnv.includes('TEST_V2_WORKER_TRUTH_DIR='));
check(checks, 'test-real-env-template', 'example.env defines separated test/real DB, download, log and full-log paths.', ['DB_PATH=', 'TEST_DB_PATH=', 'DOWNLOAD_DIR=', 'TEST_DOWNLOAD_DIR=', 'LOG_DIR=', 'TEST_LOG_DIR=', 'FULL_LOG=', 'TEST_FULL_LOG='].every((key) => exampleEnv.includes(key)));

if (args.evidence) {
  check(checks, 'node-available', 'Node is available on the target machine.', commandAvailable('node'));
  check(checks, 'npm-available', 'npm is available on the target machine.', commandAvailable('npm'));
}

const result = proofResult({
  proof: 'v2_real_machine_readiness',
  checks,
  evidenceMode: args.evidence,
  note: args.evidence
    ? 'Target-machine readiness proof. Dependency install, npm test, build and typecheck must still be run by the operator if this script only confirms command availability.'
    : 'Static contract proof that the repo contains the commands/templates needed for target-machine readiness proofing.',
});

emitProof(result, { write: args.write });
