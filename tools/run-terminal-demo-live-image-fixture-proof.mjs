#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { buildLiveImageFixture } from './terminal-demo-live-image-fixture-lib.mjs';

const repoRoot = process.cwd();
const proof = 'terminal-demo-live-image-fixture';
const setup = buildLiveImageFixture({ repoRoot });
const nextItem = setup.playbackContract?.nextItem ?? null;
const assetPath = nextItem?.mediaAssetId ? runSqlite('playback_asset_media_path', [String(nextItem.mediaAssetId), repoRoot]) : null;
const resolvedPath = assetPath?.resolvedPath ?? '';
const assertions = {
  setup_passed: setup.status === 'PASSED',
  copied_real_generated_image_exists: existsSync(setup.copiedImage) && setup.copiedImage.startsWith(setup.downloadDir),
  copied_from_generated_test_data: setup.sourceImage.includes(`${path.sep}generated_test_data${path.sep}`),
  demo_db_exists: existsSync(setup.dbPath),
  uses_required_real_tables: setup.tables.includes('canonical_media_assets') && setup.tables.includes('media_asset_variants') && setup.tables.includes('slideshow_queue') && setup.tables.includes('runtime_state'),
  playback_contract_has_ready_row: setup.playbackContract?.queue?.readyCount >= 1,
  ready_row_is_image: nextItem?.mediaType === 'image',
  ready_row_uses_slideshow_queue: Number.isFinite(nextItem?.slideshowQueueId),
  asset_media_path_resolves: assetPath?.found === true && existsSync(resolvedPath),
  resolved_path_is_demo_download: resolvedPath.startsWith(setup.downloadDir),
  address_overlay_value_is_present: typeof nextItem?.resolvedAddress === 'string' && nextItem.resolvedAddress.includes('Live demo playback fixture address'),
  no_legacy_json_queue_required: !existsSync(path.join(setup.runtimeOutputDir, 'legacy-display-queue.json'))
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'REAL_DEMO_LIVE_IMAGE_PLAYBACK_FIXTURE_READY' : 'REAL_DEMO_LIVE_IMAGE_PLAYBACK_FIXTURE_BLOCKED',
  dbPath: rel(setup.dbPath),
  downloadDir: rel(setup.downloadDir),
  copiedImage: rel(setup.copiedImage),
  sourceImage: rel(setup.sourceImage),
  nextItem,
  resolvedMediaPath: rel(resolvedPath),
  setupMessages: setup.messages,
  tables: setup.tables,
  assertions
}, null, 2));
process.exit(passed ? 0 : 1);

function rel(value) {
  return value ? path.relative(repoRoot, value).replace(/\\/g, '/') : '';
}

function runSqlite(helper, args) {
  const scriptPath = path.join(repoRoot, 'server', 'scripts', 'sqlite_admin.py');
  const attempts = [];
  for (const command of ['python3', 'py', 'python']) {
    const finalArgs = command === 'py' ? ['-3', scriptPath, helper, setup.dbPath, ...args] : [scriptPath, helper, setup.dbPath, ...args];
    const result = spawnSync(command, finalArgs, { cwd: repoRoot, encoding: 'utf8', timeout: 120000 });
    attempts.push(`${command} => ${result.status ?? 'null'}`);
    if (result.error?.code === 'ENOENT') continue;
    if (result.status !== 0) throw new Error(`${helper} failed: ${result.stderr || result.stdout}\n${attempts.join('\n')}`);
    return JSON.parse(result.stdout);
  }
  throw new Error(`No Python command available for ${helper}. Attempts: ${attempts.join('; ')}`);
}
