import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));

test('security audit cleanup pins Vite and esbuild to the audited checkpoint policy', () => {
  assert.equal(packageJson.devDependencies.vite, '^8.1.0');
  assert.equal(packageJson.overrides.esbuild, '0.28.1');
  assert.equal(packageLock.packages[''].devDependencies.vite, '^8.1.0');
  assert.equal(packageLock.packages['node_modules/esbuild'].version, '0.28.1');
});

test('package and lock versions stay aligned after dependency audit cleanup', () => {
  const version = readFileSync('VERSION', 'utf8').trim();
  assert.equal(packageJson.version, version);
  assert.equal(packageLock.version, version);
  assert.equal(packageLock.packages[''].version, version);
});
