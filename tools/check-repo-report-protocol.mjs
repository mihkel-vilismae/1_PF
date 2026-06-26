// Validates the repo-local reporting protocol used by AI/Codex-style repo reports.
// This check is documentation/governance only and does not affect runtime behavior.
import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'docs/20_architecture_and_specs/repo_report_timestamp_loc_protocol.md',
  '.codex/skills/repo-report-wrapper/SKILL.md',
];

function fail(message) {
  console.error(`Repo report protocol check failed: ${message}`);
  process.exit(1);
}

for (const path of requiredPaths) {
  if (!existsSync(path)) {
    fail(`missing required path: ${path}`);
  }
}

const policy = readFileSync('docs/20_architecture_and_specs/repo_report_timestamp_loc_protocol.md', 'utf8');
const skill = readFileSync('.codex/skills/repo-report-wrapper/SKILL.md', 'utf8');

const requiredPolicyPhrases = [
  'START: YYYY-MM-DD HH:mm:ss EEST',
  'END: YYYY-MM-DD HH:mm:ss EEST',
  'Duration:',
  'LOC scanned/read:',
  'Do not claim hidden model token usage as exact LOC',
  '.ai-context-ignore',
  'Codex prompt',
];

for (const phrase of requiredPolicyPhrases) {
  if (!policy.includes(phrase)) {
    fail(`policy document missing phrase: ${phrase}`);
  }
}

const requiredSkillPhrases = [
  'START: YYYY-MM-DD HH:mm:ss EEST',
  'END: YYYY-MM-DD HH:mm:ss EEST',
  'LOC scanned/read',
  '.ai-context-ignore',
  'Do not report hidden model token usage as exact LOC',
];

for (const phrase of requiredSkillPhrases) {
  if (!skill.includes(phrase)) {
    fail(`skill document missing phrase: ${phrase}`);
  }
}

console.log('Repo report protocol check passed.');
