/** Windows proofrunner launcher contract checks. */
import { readFileSync } from 'node:fs';

export function analyzePowerShellLauncherText(text) {
  const source = String(text ?? '');
  const checks = [
    {
      name: 'no_trim_on_node_external_command_output',
      passed: !/\(&\s*node\s+-e[\s\S]*?\)\.Trim\(\)/i.test(source),
      detail: 'Do not call .Trim() directly on possibly-null node -e output.',
    },
    {
      name: 'repo_root_package_json_read',
      passed: /Join-Path\s+\$RepoRoot\s+["']package\.json["']/i.test(source) || /git\s+-C\s+\$RepoRoot/i.test(source),
      detail: 'package.json and git metadata must be read from the extracted repo root.',
    },
    {
      name: 'package_json_convertfrom_json',
      passed: /ConvertFrom-Json/i.test(source),
      detail: 'PowerShell can read package.json directly instead of depending on node cwd.',
    },
    {
      name: 'actionable_package_failure_message',
      passed: /Could not read package\.json from extracted repo root/i.test(source) || /package version could not be read/i.test(source),
      detail: 'Launcher should explain package-version read failures.',
    },
    {
      name: 'repo_root_git_head_read',
      passed: /git\s+-C\s+\$RepoRoot\s+rev-parse\s+--short\s+HEAD/i.test(source),
      detail: 'Git HEAD must be read with git -C $RepoRoot.',
    },
  ];
  return { checks, passed: checks.every((check) => check.passed) };
}

export function analyzeContractDoc(path = 'docs/10_runbooks/proofrunner_handoff_windows_launcher_contract.md') {
  const text = readFileSync(path, 'utf8');
  const requiredPhrases = [
    'must not call methods such as `.Trim()` on possibly-null external command output',
    'Find the extracted repo root',
    'Read package version from `$RepoRoot\\package.json`',
    'Bash-only validation is not sufficient',
    'Unblock-File .\\PROOF_WIN.PS1',
    'does not prove real iCloud login',
  ];
  const checks = requiredPhrases.map((phrase) => ({ name: `doc_contains_${phrase.slice(0, 24).replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`, passed: text.includes(phrase), detail: phrase }));
  return { checks, passed: checks.every((check) => check.passed) };
}
