/** PowerShell proofrunner safe log filename contract. */
export const BAD_REGEX_PATTERN = "-replace '[:/\\]','_'";

export function analyzePowerShellSafeLogNameText(text = '') {
  const source = String(text);
  const checks = [
    {
      name: 'no_unescaped_backslash_character_class',
      passed: !source.includes(BAD_REGEX_PATTERN) && !/-replace\s+'\[:\/\\\]'\s*,\s*'_'/.test(source),
      detail: 'PowerShell/.NET regex char class [:/\\] is invalid unless the backslash is escaped correctly.',
    },
    {
      name: 'uses_literal_replace_chain_or_escaped_regex',
      passed: /\.Replace\(':','_'\)\.Replace\('\/','_'\)\.Replace\('\\\\','_'\)/.test(source) || /-replace\s+'\[:\/\\\\\]'\s*,\s*'_'/.test(source),
      detail: 'Prefer literal .Replace chain for : / \\ when building proof log filenames.',
    },
    {
      name: 'safe_name_used_before_log_path',
      passed: /\$safe\s*=/.test(source) && /Join-Path\s+\$LogDir/.test(source),
      detail: 'Safe proof names must be created before log paths.',
    },
  ];
  return { status: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED', checks };
}

export function buildAcceptedPowerShellSafeLogNameSnippet() {
  return "$safe=$proof.Replace(':','_').Replace('/','_').Replace('\\\\','_'); $log=Join-Path $LogDir ('{0:d3}_{1}.log' -f $Idx,$safe)";
}
