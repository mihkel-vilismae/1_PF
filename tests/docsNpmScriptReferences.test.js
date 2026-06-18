/**
 * Documentation consistency guard for package script references.
 * Active markdown docs must not tell operators to run removed npm scripts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = new Set(Object.keys(packageJson.scripts ?? {}));

function walkMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (path.replaceAll('\\', '/').includes('/90_archive/')) continue;
      out.push(...walkMarkdown(path));
    } else if (entry.endsWith('.md')) {
      out.push(path.replaceAll('\\', '/'));
    }
  }
  return out;
}

function activeMarkdownFiles() {
  return [
    'README.md',
    'HOW_TO_RUN.md',
    'CHANGELOG.md',
    ...walkMarkdown('docs').filter((path) => !path.startsWith('docs/90_archive/')),
  ];
}

function referencedNpmRunScripts(text) {
  const refs = [];
  const regex = /\bnpm\s+run\s+([^\s`]+)/g;
  for (const match of text.matchAll(regex)) {
    const script = match[1].replace(/[.,;:)]+$/g, '');
    if (!script || script === '...' || script === '…') continue;
    if (script.includes('<') || script.includes('>')) continue;
    if (script.includes('*')) continue;
    refs.push(script);
  }
  return refs;
}

test('active markdown npm run references exist in package.json scripts', () => {
  const missing = [];
  for (const file of activeMarkdownFiles()) {
    const text = readFileSync(file, 'utf8');
    for (const script of referencedNpmRunScripts(text)) {
      if (!scripts.has(script)) missing.push(`${file}: npm run ${script}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('proof README lists every current proof package script', () => {
  const proofsReadme = readFileSync('docs/proofs/README.md', 'utf8');
  const missing = [...scripts]
    .filter((script) => script.startsWith('proof:'))
    .filter((script) => !proofsReadme.includes(`npm run ${script}`));
  assert.deepEqual(missing, []);
});

test('active docs do not reference removed Windows Task Scheduler dry-run command', () => {
  const offenders = [];
  for (const file of activeMarkdownFiles()) {
    const text = readFileSync(file, 'utf8');
    if (text.includes('npm run proof:windows-task-scheduler-dry-run')) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
