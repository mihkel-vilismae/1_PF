#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  'docs/20_architecture_and_specs/openspec/terminal_demo_real_mode_openspec.md',
  'docs/20_architecture_and_specs/openspec/terminal_demo_v2_operator_rc_handoff_openspec.md',
  'docs/40_backlog_and_tasks/terminal_demo_v2_implementation_handoff.md',
  'docs/40_backlog_and_tasks/raspberry_v1_openspec_implementation_queue.md',
  'docs/table_of_contents.md',
  'docs/DOC_INDEX.md',
  'docs/DOC_FRESHNESS_MATRIX.md'
];

const requiredTexts = [
  ['terminal_demo_real_mode_openspec.md', '## v1.5.0 through v1.9.0 real-demo implementation status'],
  ['terminal_demo_real_mode_openspec.md', 'REAL_DEMO_MODE_V2_RC_READY'],
  ['terminal_demo_v2_operator_rc_handoff_openspec.md', '## Required proof pack'],
  ['terminal_demo_v2_operator_rc_handoff_openspec.md', 'npm run proof:terminal-demo-metadata-address-queue'],
  ['terminal_demo_v2_operator_rc_handoff_openspec.md', 'No cron or crontab installation.'],
  ['terminal_demo_v2_operator_rc_handoff_openspec.md', 'No unguarded real screen power command.'],
  ['terminal_demo_v2_implementation_handoff.md', 'Known implementation risks'],
  ['terminal_demo_v2_implementation_handoff.md', 'proof:terminal-demo-final'],
  ['raspberry_v1_openspec_implementation_queue.md', 'TDV2-RC-001'],
  ['table_of_contents.md', 'terminal_demo_v2_operator_rc_handoff_openspec.md'],
  ['DOC_INDEX.md', 'terminal_demo_v2_operator_rc_handoff_openspec.md'],
  ['DOC_FRESHNESS_MATRIX.md', 'terminal_demo_v2_operator_rc_handoff_openspec.md']
];

const checks = [];
for (const file of requiredFiles) {
  checks.push({ label: `required doc exists: ${file}`, passed: existsSync(file) });
}
for (const [basename, needle] of requiredTexts) {
  const file = requiredFiles.find((candidate) => candidate.endsWith(basename)) ?? basename;
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  checks.push({ label: `${basename} contains ${needle}`, passed: text.includes(needle) });
}
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
checks.push({
  label: 'npm script registered',
  passed: packageJson.scripts?.['proof:terminal-demo-v2-handoff-docs'] === 'node tools/run-terminal-demo-v2-handoff-docs-proof.mjs'
});
checks.push({
  label: 'git tracked proof script',
  passed: commandOk('git', ['ls-files', '--error-unmatch', 'tools/run-terminal-demo-v2-handoff-docs-proof.mjs'])
});

const passed = checks.every((check) => check.passed);
console.log(JSON.stringify({
  proof: 'terminal-demo-v2-handoff-docs',
  status: passed ? 'PASSED' : 'BLOCKED',
  decision: passed ? 'TERMINAL_DEMO_V2_HANDOFF_DOCS_READY' : 'TERMINAL_DEMO_V2_HANDOFF_DOCS_BLOCKED',
  checkedAt: new Date().toISOString(),
  checks
}, null, 2));
process.exit(passed ? 0 : 1);

function commandOk(command, args) {
  try {
    execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe', timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}
