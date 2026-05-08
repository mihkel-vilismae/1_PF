/*
 * Verifies development-server watch settings that protect dashboard state.
 * These checks keep mutable runtime files from causing browser reloads.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import viteConfig from '../vite.config.ts';

test('Vite dev server ignores mutable runtime truth persistence writes', () => {
  assert.deepEqual(viteConfig.server?.watch?.ignored, ['**/conf/runtime-truth.json']);
});
