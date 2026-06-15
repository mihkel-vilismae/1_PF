import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync('tools/unzipper/unzip_latest_photoframe.sh', 'utf8');
const docs = readFileSync('tools/unzipper/unzip_latest_photoframe.md', 'utf8');

test('unzipper hardcodes custom variables source and copies it into extracted repo root', () => {
  assert.match(script, /CUSTOM_VARIABLES_LOCATION = Path\("\/home\/mihkel\/Download_chrome\/Photoframe_proofing\/\.env"\)/);
  assert.match(script, /def copy_custom_variables_file\(repo_folder: Path, source_path: Path = CUSTOM_VARIABLES_LOCATION, display_repo_folder: Path \| None = None\) -> Path:/);
  assert.match(script, /target = repo_folder \/ "\.env"/);
  assert.match(script, /shutil\.copy2\(source, target\)/);
  assert.match(script, /copy_custom_variables_file\(staging_path, display_repo_folder=paths\.target_path\)/);
});

test('unzipper documentation records custom variables copy and failure boundary', () => {
  assert.match(docs, /Custom variables location/);
  assert.match(docs, /\/home\/mihkel\/Download_chrome\/Photoframe_proofing\/\.env/);
  assert.match(docs, /extracted repository root as `\.env`/);
  assert.match(docs, /before the ZIP is archived/);
});
