#!/usr/bin/env node
import { buildLiveImageFixture } from './terminal-demo-live-image-fixture-lib.mjs';

try {
  const result = buildLiveImageFixture();
  console.log(JSON.stringify({ proof: 'terminal-demo-live-image-fixture-setup', checkedAt: new Date().toISOString(), ...result }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ proof: 'terminal-demo-live-image-fixture-setup', status: 'BLOCKED', checkedAt: new Date().toISOString(), error: String(error?.message ?? error) }, null, 2));
  process.exitCode = 1;
}
