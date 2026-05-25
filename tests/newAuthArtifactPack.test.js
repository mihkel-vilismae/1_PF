import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { generateNewAuthLoginArtifactPack, listNewAuthLoginArtifactPacks } from '../server/auth/newAuthArtifactPack.ts';

test('generateNewAuthLoginArtifactPack writes sanitized evidence without raw stdio contents', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'new-auth-artifacts-'));
  try {
    const privateLogPath = path.join(repoRoot, 'runtime_data', 'private_logs', 'icloudpd_raw_stdio.log');
    await mkdir(path.dirname(privateLogPath), { recursive: true });
    await writeFile(privateLogPath, 'user@example.com password=secret 123456 raw-provider-output', 'utf8');

    const payload = await generateNewAuthLoginArtifactPack(
      {
        envValues: {
          user: 'user@example.com',
          pw: 'secret-password',
          ICLOUDPD_COOKIE_DIR: path.join(repoRoot, 'runtime_data', 'icloudpd'),
          DOWNLOAD_DIR: path.join(repoRoot, 'downloads'),
        },
        executablePath: path.join(repoRoot, 'fake-icloudpd'),
      },
      {
        repoRoot,
        now: new Date('2026-05-25T15:30:45.000Z'),
      },
    );

    assert.equal(payload.ok, true);
    assert.equal(payload.state, 'success');
    assert.equal(payload.artifact.rawProviderOutputCopied, false);
    assert.equal(payload.artifact.sessionFileContentsCopied, false);

    const artifactPath = path.join(repoRoot, payload.artifact.path);
    const manifest = JSON.parse(await readFile(path.join(artifactPath, 'MANIFEST.json'), 'utf8'));
    assert.equal(manifest.generatedAtEstonia, '2026-05-25 18:30:45 EEST');
    assert.equal(manifest.safety.rawProviderOutputCopied, false);

    const metadata = JSON.parse(await readFile(path.join(artifactPath, 'provider_communication', 'icloudpd_raw_stdio_metadata.json'), 'utf8'));
    assert.equal(metadata.exists, true);
    assert.equal(metadata.contentsCaptured, false);
    assert.equal(metadata.sizeBytes > 0, true);

    const summary = await readFile(path.join(artifactPath, 'EVIDENCE_SUMMARY.md'), 'utf8');
    assert.match(summary, /Raw iCloudPD stdio contents were not copied/);
    assert.doesNotMatch(summary, /user@example\.com/);
    assert.doesNotMatch(summary, /secret-password/);
    assert.doesNotMatch(summary, /123456/);

    const redaction = JSON.parse(await readFile(path.join(artifactPath, 'redaction', 'redaction_checks.json'), 'utf8'));
    assert.equal(redaction.passed, true);
    assert.equal(redaction.findingCount, 0);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('listNewAuthLoginArtifactPacks returns generated packs without requiring an existing root', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'new-auth-artifact-list-'));
  try {
    const emptyList = await listNewAuthLoginArtifactPacks({ repoRoot });
    assert.equal(emptyList.ok, true);
    assert.equal(emptyList.count, 0);

    await generateNewAuthLoginArtifactPack(
      {
        envValues: {
          ICLOUDPD_COOKIE_DIR: path.join(repoRoot, 'runtime_data', 'icloudpd'),
          DOWNLOAD_DIR: path.join(repoRoot, 'downloads'),
        },
      },
      {
        repoRoot,
        now: new Date('2026-05-25T15:31:45.000Z'),
      },
    );

    const populatedList = await listNewAuthLoginArtifactPacks({ repoRoot });
    assert.equal(populatedList.ok, true);
    assert.equal(populatedList.count, 1);
    assert.match(populatedList.packs[0].name, /^auth_attempt_20260525_183145_EEST$/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
