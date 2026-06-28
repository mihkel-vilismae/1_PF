/** Proofrunner handoff mode-surface contract helpers. */
import {
  INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS,
  AUTOMATION_ONLY_PROOF_RUNNER_MODES,
  buildProofRunnerModeMenuLines,
  getDocumentedProofRunnerModes,
  normalizeProofRunnerLauncherSelection,
} from './proof-runner-queue-lib.mjs';

export const PREFERRED_MODE_ENV_VAR = 'PF_PROOF_MODE';
export const LEGACY_MODE_ENV_VAR = 'PF_PROOF_LAUNCHER_MODE';
export const REQUIRED_INTERACTIVE_HANDOFF_MODES = Object.freeze(
  INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS.map((option) => option.mode),
);
export const REQUIRED_AUTOMATION_HANDOFF_MODES = Object.freeze(
  AUTOMATION_ONLY_PROOF_RUNNER_MODES.map((option) => option.mode),
);

export function buildProofrunnerModeReadmeSection() {
  const menuRows = INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS
    .map((option) => `| ${option.choice} | \`${option.mode}\` | ${option.label}${option.firstRun ? ' / recommended first run' : option.finalSweep ? ' / final sweep, not first' : ''} |`)
    .join('\n');
  return `## Proof modes

| Menu | Mode | Meaning |
|---:|---|---|
${menuRows}

Preferred automation override:

\`\`\`text
${PREFERRED_MODE_ENV_VAR}=quick|blockers|platform|failed-last|minimum|full|changed
\`\`\`

Legacy compatibility override:

\`\`\`text
${LEGACY_MODE_ENV_VAR}=all      # maps to full
${LEGACY_MODE_ENV_VAR}=minimum  # maps to minimum
\`\`\`

Recommended order: \`quick -> blockers -> platform -> failed-last when needed -> full\`.
\`full\` is the final sweep, not the first run on a fresh target.
`;
}

export function buildAcceptedBashModeSelectionSnippet() {
  return `choose_mode() {
  local requested="\${PF_PROOF_MODE:-\${PF_PROOF_LAUNCHER_MODE:-}}"
  if [ -z "$requested" ] && [ -t 0 ]; then
    printf '\nPF_login proofrunner mode:\n'
${buildProofRunnerModeMenuLines().map((line) => `    printf '  ${line}\\n'`).join('\n')}
    printf 'Select [1]: '
    read -r choice || choice=''
    requested="$choice"
  fi
  if [ -z "$requested" ]; then requested='minimum'; fi
  case "$requested" in
    1|quick) PF_PROOF_MODE='quick' ;;
    2|blockers) PF_PROOF_MODE='blockers' ;;
    3|platform) PF_PROOF_MODE='platform' ;;
    4|failed-last|failed_last|failed) PF_PROOF_MODE='failed-last' ;;
    5|min|minimum) PF_PROOF_MODE='minimum' ;;
    6|all|full) PF_PROOF_MODE='full' ;;
    changed) PF_PROOF_MODE='changed' ;;
    *) PF_PROOF_MODE="$requested" ;;
  esac
  export PF_PROOF_MODE
}`;
}

export function buildAcceptedPowerShellModeSelectionSnippet() {
  return `function Choose-Mode {
  $requested = $env:PF_PROOF_MODE
  if ([string]::IsNullOrWhiteSpace($requested)) { $requested = $env:PF_PROOF_LAUNCHER_MODE }
  if ([string]::IsNullOrWhiteSpace($requested) -and $Host.Name -ne 'ServerRemoteHost') {
    Write-Host 'PF_login proofrunner mode:'
${buildProofRunnerModeMenuLines().map((line) => `    Write-Host '  ${line}'`).join('\n')}
    $choice = Read-Host 'Select [1]'
    $requested = $choice
  }
  if ([string]::IsNullOrWhiteSpace($requested)) { $requested = 'minimum' }
  switch -Regex ($requested.ToLowerInvariant()) {
    '^(1|quick)$' { $env:PF_PROOF_MODE = 'quick'; break }
    '^(2|blockers)$' { $env:PF_PROOF_MODE = 'blockers'; break }
    '^(3|platform)$' { $env:PF_PROOF_MODE = 'platform'; break }
    '^(4|failed-last|failed_last|failed)$' { $env:PF_PROOF_MODE = 'failed-last'; break }
    '^(5|min|minimum)$' { $env:PF_PROOF_MODE = 'minimum'; break }
    '^(6|all|full)$' { $env:PF_PROOF_MODE = 'full'; break }
    '^changed$' { $env:PF_PROOF_MODE = 'changed'; break }
    default { $env:PF_PROOF_MODE = $requested }
  }
}`;
}

function hasMode(text, mode) {
  const escaped = mode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9-])${escaped}([^a-z0-9-]|$)`, 'i').test(text);
}

export function analyzeHandoffModeSurfaceText({ readmeText = '', bashText = '', powershellText = '' } = {}) {
  const combined = `${readmeText}\n${bashText}\n${powershellText}`;
  const documentedModes = getDocumentedProofRunnerModes();
  const missingModes = documentedModes.filter((mode) => !hasMode(combined, mode));
  const checks = [
    {
      name: 'documents_all_required_modes',
      passed: missingModes.length === 0,
      detail: { documentedModes, missingModes },
    },
    {
      name: 'prefers_pf_proof_mode',
      passed: combined.includes(PREFERRED_MODE_ENV_VAR),
      detail: `Generated handoffs should prefer ${PREFERRED_MODE_ENV_VAR}.`,
    },
    {
      name: 'keeps_legacy_launcher_mode_alias',
      passed: combined.includes(LEGACY_MODE_ENV_VAR) && /all.*full|full.*all/is.test(combined),
      detail: `Generated handoffs should keep ${LEGACY_MODE_ENV_VAR}=all/minimum compatibility.`,
    },
    {
      name: 'interactive_menu_exposes_numeric_choices',
      passed: REQUIRED_INTERACTIVE_HANDOFF_MODES.every((mode, index) => combined.includes(`${index + 1}`) && hasMode(combined, mode)),
      detail: { choices: INTERACTIVE_PROOF_RUNNER_MODE_OPTIONS },
    },
    {
      name: 'quick_is_not_mapped_to_minimum',
      passed: !/quick\)?\s*(PF_PROOF_MODE\s*=\s*|\$env:PF_PROOF_MODE\s*=\s*)['"]?minimum/i.test(combined),
      detail: 'quick must remain quick; minimum is legacy compatibility only.',
    },
    {
      name: 'full_is_labeled_final_sweep',
      passed: /full[\s\S]{0,80}(final sweep|not first)|final sweep[\s\S]{0,80}full/i.test(combined),
      detail: 'Operators should not be guided to run full first.',
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function analyzeProofrunnerModeNormalization() {
  const samples = {
    '': 'minimum',
    1: 'quick',
    quick: 'quick',
    2: 'blockers',
    blockers: 'blockers',
    3: 'platform',
    platform: 'platform',
    4: 'failed-last',
    failed: 'failed-last',
    failed_last: 'failed-last',
    5: 'minimum',
    minimum: 'minimum',
    6: 'full',
    all: 'full',
    full: 'full',
    changed: 'changed',
  };
  const checks = Object.entries(samples).map(([input, expected]) => ({
    name: `normalizes_${input || 'blank'}_to_${expected}`,
    passed: normalizeProofRunnerLauncherSelection(input) === expected,
    detail: { input, expected, actual: normalizeProofRunnerLauncherSelection(input) },
  }));
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}


export function analyzeGeneratedProofrunnerIdentitySurface({
  texts = [],
  expectedVersion,
  expectedHead,
  staleVersions = ['0.10.84', '0.10.86'],
} = {}) {
  const combined = (Array.isArray(texts) ? texts : [texts]).join('\n');
  const expectedVersionToken = String(expectedVersion ?? '').trim();
  const expectedHeadToken = String(expectedHead ?? '').trim();
  const staleHits = staleVersions
    .map((version) => String(version).trim())
    .filter(Boolean)
    .filter((version) => version !== expectedVersionToken && combined.includes(version));
  const checks = [
    {
      name: 'contains_expected_version_marker',
      passed: Boolean(expectedVersionToken) && combined.includes(expectedVersionToken),
      detail: { expectedVersion: expectedVersionToken },
    },
    {
      name: 'contains_expected_head_marker',
      passed: Boolean(expectedHeadToken) && combined.includes(expectedHeadToken),
      detail: { expectedHead: expectedHeadToken },
    },
    {
      name: 'rejects_known_stale_launcher_versions',
      passed: staleHits.length === 0,
      detail: { staleVersions, staleHits },
    },
    {
      name: 'identity_text_mentions_repo_zip_sha',
      passed: /sha-?256/i.test(combined),
      detail: 'Generated handoff identity text should include repo ZIP SHA-256 verification context.',
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function buildAcceptedGeneratedHandoffIdentityText({ version, head, repoZipName = 'PF_login_full_git.zip', sha256 = 'abc123' } = {}) {
  return `# PF_login v${version} — 2proofrunner 1repo handoff
Baseline: v${version} / ${head}
Repo ZIP: ${repoZipName}
Repo ZIP SHA-256: ${sha256}
Generated launchers must verify VERSION/package/package-lock/HEAD before proof discovery.`;
}

