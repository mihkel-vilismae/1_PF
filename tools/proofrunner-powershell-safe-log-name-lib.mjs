/** PowerShell proofrunner safe log filename contract. */
export const BAD_REGEX_PATTERN = "-replace '[:/\\]','_'";

export function analyzePowerShellSafeLogNameText(text = '') {
  const source = String(text);
  const checks = [
    {
      name: 'no_control_characters_in_launcher_paths',
      passed: !/[\r\u0000-\u001f]/.test(source),
      detail: 'Generated PowerShell launcher text must not contain carriage returns from accidental \\r escaping inside path strings.',
    },
    {
      name: 'no_backslash_run_workdir_literal',
      passed: !/_pf_2proofrunner_work\r?un_/.test(source) && !/_pf_2proofrunner_work\\run_/.test(source),
      detail: 'Build Windows work directories with nested Join-Path calls, not a string containing \\run_.',
    },
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

export function buildAcceptedPowerShellWorkDirSnippet() {
  return "$WorkRoot = Join-Path $RootDir '_pf_2proofrunner_work'; $WorkDir = Join-Path $WorkRoot (\"run_${RunId}_win\")";
}
