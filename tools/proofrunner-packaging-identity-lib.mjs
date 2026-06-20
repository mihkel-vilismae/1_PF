/** Repo ZIP/handoff packaging identity helpers. */

export function expectedRepoArchiveRoot({ project = 'PF_login', version, slug = 'real-icloud-download-artifacts-batch-b' } = {}) {
  if (!version) throw new Error('version is required');
  return `${project}--v${version}--${slug}-full_git`;
}

export function analyzeArchiveRootNames(rootNames = [], { version } = {}) {
  const roots = [...rootNames].map(String);
  const currentVersionPattern = new RegExp(`--v${String(version).replaceAll('.', '\\.')}(--|$)`);
  const checks = [
    {
      name: 'has_current_version_root',
      passed: roots.some((root) => currentVersionPattern.test(root)),
      detail: 'At least one archive root must include the current VERSION value.',
    },
    {
      name: 'no_stale_v0_8_199_root',
      passed: roots.every((root) => !/v0\.8\.199/.test(root)),
      detail: 'Generated repo/handoff ZIP roots must not keep the stale v0.8.199 folder name.',
    },
    {
      name: 'uses_full_git_suffix',
      passed: roots.some((root) => /-full_git$/.test(root)),
      detail: 'Repo ZIP root must identify that .git history is included.',
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}
