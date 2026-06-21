import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildRaspberryAddressOverlayTemplateProof,
  readAddressOverlayProofInput,
  writeAddressOverlayRenderArtifact,
} from '../tools/address-overlay-proof-marker-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };

test('address overlay renderer writes SVG artifact containing address and marker', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-overlay-'));
  try {
    const input = readAddressOverlayProofInput({ PF_ADDRESS_OVERLAY_PROOF_RUN_ID: '20260621_193027', PF_ADDRESS_OVERLAY_PROOF_ADDRESS_TEXT: 'Tartu, Estonia' });
    const render = await writeAddressOverlayRenderArtifact({ input, outputDir: dir });
    const svg = await readFile(render.artifact_path, 'utf8');
    assert.equal(render.marker_in_artifact, true);
    assert.equal(render.address_in_artifact, true);
    assert.match(svg, /PF_ADDR_20260621_193027/);
    assert.match(svg, /Tartu, Estonia/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('raspberry address overlay template proof passes as render-only L1 evidence', async () => {
  const envelope = await buildRaspberryAddressOverlayTemplateProof({ metadata, env: { PF_ADDRESS_OVERLAY_PROOF_RUN_ID: '20260621_193027' } });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.render.marker_in_artifact, true);
  assert.match(envelope.known_limitations[0], /L1 evidence/);
});
