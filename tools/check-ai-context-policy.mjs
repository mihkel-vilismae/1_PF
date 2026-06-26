// Validates the repo-local AI context policy manifest.
// This check keeps large low-value paths excluded from default AI context
// while protecting active source, test, and OpenSpec folders from accidental
// broad exclusion. It does not affect Git tracking or runtime behavior.
import { readFileSync, existsSync } from 'node:fs';

const manifestPath = '.ai-context-ignore';
const policyPath = 'docs/20_architecture_and_specs/ai_context_default_exclusion_policy.md';

// Reads a UTF-8 text file and returns normalized non-empty, non-comment lines.
function readManifestLines(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

// Fails the check with a compact message that can be used in proof logs.
function fail(message) {
  console.error(`AI context policy check failed: ${message}`);
  process.exit(1);
}

// Requires a path to exist before more detailed validation runs.
function requirePath(path) {
  if (!existsSync(path)) {
    fail(`missing required path: ${path}`);
  }
}

// Requires the manifest to include a specific exclusion pattern.
function requireManifestEntry(entries, pattern) {
  if (!entries.includes(pattern)) {
    fail(`missing required manifest entry: ${pattern}`);
  }
}

// Prevents broad exclusions that would hide active implementation/spec/test context.
function rejectForbiddenBroadExclusions(entries) {
  const forbidden = [
    'server/**',
    'server/',
    'server',
    'dashboard/**',
    'dashboard/',
    'dashboard',
    'tests/**',
    'tests/',
    'tests',
    'docs/20_architecture_and_specs/openspec/**',
    'docs/20_architecture_and_specs/openspec/',
    'docs/20_architecture_and_specs/openspec'
  ];

  for (const pattern of forbidden) {
    if (entries.includes(pattern)) {
      fail(`forbidden broad exclusion present: ${pattern}`);
    }
  }
}

// Verifies that the human policy text mentions all critical active-context safeguards.
function validatePolicyText(path) {
  const text = readFileSync(path, 'utf8');
  for (const requiredText of [
    'It does not delete, untrack, or hide files from Git.',
    'server/**',
    'dashboard/**',
    'tests/**',
    'docs/20_architecture_and_specs/openspec/**',
    'Load a full excluded file only when the task explicitly requires it.'
  ]) {
    if (!text.includes(requiredText)) {
      fail(`policy document missing required text: ${requiredText}`);
    }
  }
}

requirePath(manifestPath);
requirePath(policyPath);

const entries = readManifestLines(manifestPath);

for (const requiredPattern of [
  'package-lock.json',
  'CHANGELOG.md',
  'generated_test_data/**',
  'runtime_data/**',
  'docs/90_archive/patches/**',
  '*.patch',
  'docs/40_backlog_and_tasks/debug_page_keybook.json',
  'docs/40_backlog_and_tasks/overall_project_goal_registry.json',
  'node_modules/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '.cache/**',
  '.vite/**'
]) {
  requireManifestEntry(entries, requiredPattern);
}

rejectForbiddenBroadExclusions(entries);
validatePolicyText(policyPath);

console.log('AI context policy check passed.');
