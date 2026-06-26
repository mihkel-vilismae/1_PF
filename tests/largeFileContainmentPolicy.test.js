import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(path, 'utf8');

test('large-file containment policy is documented and runnable', () => {
  const agents = read('AGENTS.md');
  const openspec = read('docs/20_architecture_and_specs/openspec/repo_large_file_containment_openspec.md');
  const packageJson = JSON.parse(read('package.json'));

  assert.match(agents, /Large-File Containment Rule/);
  assert.match(agents, /1500/);
  assert.match(agents, /700/);
  assert.match(agents, /check:large-file-containment/);

  assert.match(openspec, /Files above `1500` physical lines are \*\*glue-only\*\*/);
  assert.match(openspec, /dashboard\/styles\.final-release\.css/);
  assert.match(openspec, /npm run check:large-file-containment/);

  assert.equal(
    packageJson.scripts['check:large-file-containment'],
    'node tools/check-large-file-containment.mjs',
  );
});
