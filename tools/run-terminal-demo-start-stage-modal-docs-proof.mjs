#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const proof = 'terminal-demo-start-stage-modal-docs';
const files = {
  readme: 'terminal/demo/README.md',
  openspec: 'docs/20_architecture_and_specs/openspec/terminal_demo_real_mode_openspec.md',
  dedicatedSpec: 'docs/20_architecture_and_specs/openspec/terminal_demo_start_stage_modal_openspec.md',
  proofDoc: 'docs/proofs/terminal_demo_start_stage_modal_docs_proof.md',
  rootCmd: 'RUN_TERMINAL_DEMO_REAL.CMD',
  terminalCmd: 'terminal/demo/windows_runner_real.cmd',
  changelog: 'CHANGELOG.md',
  packageJson: 'package.json'
};
const text = Object.fromEntries(Object.entries(files).map(([key, rel]) => [key, read(rel)]));
const packageJson = JSON.parse(text.packageJson);
const startScripts = [
  'proof:terminal-demo-start-stage-modal',
  'proof:terminal-demo-start-stage-modal-shared-path',
  'proof:terminal-demo-start-stage-modal-db-effects',
  'proof:terminal-demo-start-stage-modal-docs'
];

const assertions = {
  dedicated_spec_exists: existsSync(path.join(repoRoot, files.dedicatedSpec)),
  proof_doc_exists: existsSync(path.join(repoRoot, files.proofDoc)),
  readme_documents_modal_key: hasAll(text.readme, ['start_stage_modal', 'The key pressed', '`S`', '`1`', 'Download', '`5`', 'Enqueue for Playback']),
  readme_documents_batch_contract: hasAll(text.readme, ['independent manual `batch_size`', 'default is `1`', 'allowed modal values are `1` and `3`']),
  openspec_documents_shared_path: hasAll(text.openspec, ['START_STAGE_MODAL_OPERATOR_DOCS_READY', 'regular-stage-worker', 'noCron=true']),
  dedicated_spec_documents_non_claims: hasAll(text.dedicatedSpec, ['No Download stage start', 'No cron/crontab', 'No DB schema redesign']),
  proof_doc_documents_static_guard: hasAll(text.proofDoc, ['statically guards', 'RUN_TERMINAL_DEMO_REAL.CMD', 'terminal/demo/windows_runner_real.cmd']),
  launchers_explain_operator_keys: hasAll(text.rootCmd + text.terminalCmd, ['start_stage_modal', '1 Download disabled', '2 Index', '3 GPS Parser', '4 Geocode', '5 Enqueue']),
  package_registers_all_modal_proofs: startScripts.every((script) => Boolean(packageJson.scripts?.[script])),
  changelog_has_docs_and_batch3_entries: hasAll(text.changelog, ['2.0.6 - Start stage modal docs', '2.0.5 - Start stage modal DB effects'])
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'START_STAGE_MODAL_OPERATOR_DOCS_READY' : 'START_STAGE_MODAL_OPERATOR_DOCS_BLOCKED',
  assertions,
  guardedFiles: Object.values(files)
}, null, 2));
if (!passed) process.exit(1);

function read(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
}

function hasAll(value, needles) {
  return needles.every((needle) => value.includes(needle));
}
