/** Contract checks for human-visible prooflauncher progress output. */
export function analyzeLauncherProgressContract({ bashSource = '', powershellSource = '' }) {
  const bash = String(bashSource);
  const ps = String(powershellSource);
  const checks = [
    {
      name: 'raspberry_has_color_functions',
      passed: /C_GREEN|C_YELLOW|C_BLUE|C_RED/.test(bash) && /pass\(\)|warn\(\)|info\(\)|fail\(\)/.test(bash),
      detail: 'Raspberry launcher should have reusable ANSI color/status helpers.',
    },
    {
      name: 'raspberry_has_running_heartbeat_elapsed',
      passed: /while\s+kill\s+-0/.test(bash) && /elapsed=.*format_duration/.test(bash) && /still running/.test(bash),
      detail: 'Raspberry launcher should print periodic elapsed-time heartbeat while each proof command is running.',
    },
    {
      name: 'raspberry_has_eta_unavailable_message',
      passed: /previous data unavailable/.test(bash) && /estimate_for_proof/.test(bash),
      detail: 'Raspberry launcher should show an ETA from prior history or explicitly state previous data unavailable.',
    },
    {
      name: 'windows_has_colored_status_output',
      passed: /Write-Status/.test(ps) && /ForegroundColor/.test(ps) && /Green|Yellow|Cyan|Red/.test(ps),
      detail: 'Windows launcher should use colorized status output.',
    },
    {
      name: 'windows_has_running_heartbeat_elapsed',
      passed: /Start-Job/.test(ps) && /still running/.test(ps) && /Format-Duration/.test(ps),
      detail: 'Windows launcher should print periodic elapsed-time heartbeat while proof command jobs are running.',
    },
    {
      name: 'windows_has_eta_unavailable_message',
      passed: /previous data unavailable/.test(ps) && /Get-ProofEtaText/.test(ps),
      detail: 'Windows launcher should show an ETA from prior history or explicitly state previous data unavailable.',
    },
  ];
  return { checks, passed: checks.every((check) => check.passed) };
}
