#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const HARD_LIMIT_LINES = 1500;
const SOFT_LIMIT_LINES = 700;
const HARD_ADDED_LINE_LIMIT = 75;
const SOFT_ADDED_LINE_LIMIT = 150;

const DEFAULT_BASE_REF = process.env.PF_LARGE_FILE_BASE_REF || 'HEAD~1';
const HEAD_REF = process.env.PF_LARGE_FILE_HEAD_REF || 'HEAD';

const APPEND_LEDGER_ALLOWLIST = new Set([
  'CHANGELOG.md',
  'package-lock.json',
]);

const GENERATED_OR_ARCHIVAL_PREFIXES = [
  'runtime_data/',
  'generated_test_data/',
  'docs/90_archive/',
];

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trimEnd();
}

function refExists(ref) {
  try {
    git(['rev-parse', '--verify', '--quiet', ref]);
    return true;
  } catch {
    return false;
  }
}

function fileLinesAt(ref, path) {
  try {
    const content = git(['show', `${ref}:${path}`]);
    if (content.length === 0) return 0;
    return content.split('\n').length;
  } catch {
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf8');
      return content.length === 0 ? 0 : content.split('\n').length;
    }
    return 0;
  }
}

function parseNumstatLine(line) {
  const firstTab = line.indexOf('\t');
  const secondTab = line.indexOf('\t', firstTab + 1);
  if (firstTab === -1 || secondTab === -1) return null;
  const addedRaw = line.slice(0, firstTab);
  const deletedRaw = line.slice(firstTab + 1, secondTab);
  const path = line.slice(secondTab + 1);
  const added = addedRaw === '-' ? 0 : Number.parseInt(addedRaw, 10);
  const deleted = deletedRaw === '-' ? 0 : Number.parseInt(deletedRaw, 10);
  if (!Number.isFinite(added) || !Number.isFinite(deleted)) return null;
  return { added, deleted, path };
}

function isGeneratedOrArchival(path) {
  return GENERATED_OR_ARCHIVAL_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isAllowedLargeLedger(path) {
  return APPEND_LEDGER_ALLOWLIST.has(path);
}

function classifyViolation({ path, added, baseLines, headLines }) {
  if (isGeneratedOrArchival(path) || isAllowedLargeLedger(path)) return null;

  const largestKnownSize = Math.max(baseLines, headLines);

  if (largestKnownSize > HARD_LIMIT_LINES && added > HARD_ADDED_LINE_LIMIT) {
    return {
      path,
      added,
      baseLines,
      headLines,
      limit: HARD_LIMIT_LINES,
      addedLimit: HARD_ADDED_LINE_LIMIT,
      severity: 'hard',
      message: `File is over ${HARD_LIMIT_LINES} LOC and this change adds ${added} lines. Add feature code in a new module/file and keep this file as glue-only.`,
    };
  }

  if (largestKnownSize > SOFT_LIMIT_LINES && added > SOFT_ADDED_LINE_LIMIT) {
    return {
      path,
      added,
      baseLines,
      headLines,
      limit: SOFT_LIMIT_LINES,
      addedLimit: SOFT_ADDED_LINE_LIMIT,
      severity: 'soft',
      message: `File is over ${SOFT_LIMIT_LINES} LOC and this change adds ${added} lines. Split new feature code into a focused file unless this is a same-responsibility refactor.`,
    };
  }

  return null;
}

function main() {
  if (!refExists(DEFAULT_BASE_REF)) {
    console.log(`large-file-containment: SKIPPED; base ref not found: ${DEFAULT_BASE_REF}`);
    process.exit(0);
  }

  const numstat = git(['diff', '--numstat', `${DEFAULT_BASE_REF}..${HEAD_REF}`]);
  const entries = numstat
    .split('\n')
    .filter(Boolean)
    .map(parseNumstatLine)
    .filter(Boolean);

  const violations = [];
  const inspected = [];

  for (const entry of entries) {
    const baseLines = fileLinesAt(DEFAULT_BASE_REF, entry.path);
    const headLines = fileLinesAt(HEAD_REF, entry.path);
    inspected.push({ ...entry, baseLines, headLines });
    const violation = classifyViolation({ ...entry, baseLines, headLines });
    if (violation) violations.push(violation);
  }

  console.log(`large-file-containment: base=${DEFAULT_BASE_REF} head=${HEAD_REF}`);
  console.log(`large-file-containment: inspected changed files=${inspected.length}`);
  console.log(`large-file-containment: hard>${HARD_LIMIT_LINES} LOC max +${HARD_ADDED_LINE_LIMIT} lines; soft>${SOFT_LIMIT_LINES} LOC max +${SOFT_ADDED_LINE_LIMIT} lines`);

  if (violations.length > 0) {
    console.error('large-file-containment: FAILED');
    for (const violation of violations) {
      console.error(`- ${violation.path}`);
      console.error(`  severity=${violation.severity} base_lines=${violation.baseLines} head_lines=${violation.headLines} added=${violation.added}`);
      console.error(`  ${violation.message}`);
    }
    process.exit(1);
  }

  console.log('large-file-containment: PASSED');
}

main();
