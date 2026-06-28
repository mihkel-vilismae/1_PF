/** Static drift checks for generated proofrunner handoff artifacts. */

export const DEFAULT_STALE_GENERATED_ARTIFACT_VERSIONS = Object.freeze([
  '0.8.199',
  '0.10.84',
  '0.10.86',
]);

function containsToken(text, token) {
  const value = String(token ?? '').trim();
  if (!value) return false;
  return String(text ?? '').includes(value);
}

export function analyzeGeneratedArtifactTextDrift({
  artifactName = 'generated artifact',
  text = '',
  expectedVersion,
  expectedHead,
  expectedSha256,
  staleVersions = DEFAULT_STALE_GENERATED_ARTIFACT_VERSIONS,
} = {}) {
  const source = String(text ?? '');
  const expectedVersionToken = String(expectedVersion ?? '').trim();
  const expectedHeadToken = String(expectedHead ?? '').trim();
  const expectedShaToken = String(expectedSha256 ?? '').trim().toLowerCase();
  const staleHits = staleVersions
    .map((version) => String(version).trim())
    .filter(Boolean)
    .filter((version) => version !== expectedVersionToken)
    .filter((version) => containsToken(source, version));

  const checks = [
    {
      name: 'contains_current_version',
      passed: Boolean(expectedVersionToken) && containsToken(source, expectedVersionToken),
      detail: { artifactName, expectedVersion: expectedVersionToken },
    },
    {
      name: 'contains_current_head',
      passed: Boolean(expectedHeadToken) && containsToken(source, expectedHeadToken),
      detail: { artifactName, expectedHead: expectedHeadToken },
    },
    {
      name: 'mentions_sha256_identity',
      passed: /sha-?256/i.test(source),
      detail: `${artifactName} must surface SHA-256 verification context.`,
    },
    {
      name: 'contains_expected_sha256_when_supplied',
      passed: !expectedShaToken || source.toLowerCase().includes(expectedShaToken),
      detail: { artifactName, expectedSha256: expectedShaToken || null },
    },
    {
      name: 'rejects_known_stale_versions',
      passed: staleHits.length === 0,
      detail: { artifactName, staleVersions, staleHits },
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function analyzeGeneratedHandoffManifest(entries = []) {
  const names = entries.map((entry) => String(entry).replaceAll('\\\\', '/'));
  const has = (pattern) => names.some((name) => pattern.test(name));
  const forbidden = names.filter((name) => /(^|\/)node_modules(\/|$)|(^|\/)runtime_data(\/|$)|(^|\/)\.git(\/|$)|(^|\/)package\.json$|(^|\/)package-lock\.json$/.test(name));
  const checks = [
    {
      name: 'contains_single_full_git_repo_zip',
      passed: names.filter((name) => /PF_login_v.*full_git\.zip$/.test(name)).length === 1,
      detail: names.filter((name) => /full_git\.zip$/.test(name)),
    },
    {
      name: 'contains_repo_zip_sha256_file',
      passed: has(/PF_login_v.*full_git\.zip\.sha256$/),
      detail: 'Handoff must include the nested repo ZIP checksum file.',
    },
    {
      name: 'contains_both_platform_launchers',
      passed: has(/PROOF_RASPBERRYOS\.SH$/) && has(/PROOF_WIN\.PS1$/),
      detail: 'Handoff must include both Raspberry and Windows proofrunner launchers.',
    },
    {
      name: 'contains_operator_readme',
      passed: has(/README_PROOFRUNNER\.md$/),
      detail: 'Handoff must include the operator runbook.',
    },
    {
      name: 'excludes_runtime_and_repo_expansion_noise',
      passed: forbidden.length === 0,
      detail: { forbidden },
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}


export function extractRepoZipReferences(text = '') {
  const source = String(text ?? '');
  const references = new Set();
  for (const match of source.matchAll(/PF_login_v[^\s`"']*full_git\.zip/g)) {
    references.add(match[0]);
  }
  for (const match of source.matchAll(/REPO_ZIP_NAME=["']([^"']+)["']/g)) {
    references.add(match[1]);
  }
  return [...references].sort();
}

export function analyzeGeneratedHandoffReferenceConsistency({ entries = [], texts = [] } = {}) {
  const names = entries.map((entry) => String(entry).replaceAll('\\', '/'));
  const repoZipEntries = names.map((name) => name.split('/').pop()).filter((name) => /PF_login_v.*full_git\.zip$/.test(name));
  const repoZipSet = new Set(repoZipEntries);
  const references = extractRepoZipReferences((Array.isArray(texts) ? texts : [texts]).join('\n'));
  const missingReferences = references.filter((reference) => !repoZipSet.has(reference));
  const checks = [
    {
      name: 'has_manifest_repo_zip_for_reference_check',
      passed: repoZipEntries.length === 1,
      detail: { repoZipEntries },
    },
    {
      name: 'launcher_and_readme_repo_zip_references_match_manifest',
      passed: references.length > 0 && missingReferences.length === 0,
      detail: { references, manifestRepoZips: repoZipEntries, missingReferences },
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function buildAcceptedGeneratedArtifactText({ version, head, sha256 = 'a'.repeat(64) } = {}) {
  return `# PF_login v${version} proofrunner handoff\nBaseline: v${version} / ${head}\nRepo ZIP SHA-256: ${sha256}\nGenerated artifact identity guard: pass.`;
}
