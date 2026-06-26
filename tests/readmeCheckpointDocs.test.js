import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walk(path));
    else if (/readme.*\.md$/i.test(entry)) out.push(path.replaceAll('\\', '/'));
  }
  return out;
}

test('repository README files carry the current checkpoint marker', () => {
  const version = readFileSync('VERSION', 'utf8').trim();
  const readmes = walk('.').sort();
  const missing = readmes.filter((path) => !readFileSync(path, 'utf8').includes(`Current checkpoint: \`v${version}\``));

  assert.ok(readmes.length >= 10, 'expected repository README inventory to be non-trivial');
  assert.deepEqual(missing, []);
});

test('root quickstart docs report the canonical repository version', () => {
  const version = readFileSync('VERSION', 'utf8').trim();
  const rootReadme = readFileSync('README.md', 'utf8');
  const howToRun = readFileSync('HOW_TO_RUN.md', 'utf8');
  const updateReadme = readFileSync('README_UPDATE_LOCAL_REPO_FROM_ZIP.md', 'utf8');

  assert.ok(rootReadme.includes('| Version | `' + version + '` |'));
  assert.ok(howToRun.includes('Repository/package version: `' + version + '`'));
  assert.ok(updateReadme.includes('`VERSION`, `package.json`, and `package-lock.json` should all report `' + version + '`'));
});
