import { readFileSync } from 'node:fs';

const WRAPPERS = [
  'start_scripts/run_live_windows_native_playback_proof.ps1',
  'start_scripts/run_live_windows_native_recovery_proof.ps1',
  'start_scripts/run_live_windows_native_video_playback_proof.ps1',
  'start_scripts/run_live_windows_scheduler_proof.ps1',
];

export function analyzeWindowsLiveProofBlockedContract() {
  const wrapperResults = WRAPPERS.map((file) => {
    const text = readFileSync(file, 'utf8');
    return {
      file,
      hasBlockedLanguage: /honest BLOCKED/i.test(text),
      hasMissingEnvThrow: /throw\s+"\.env not found in repo root or parent folder\."/.test(text),
      forcesSchedulerLiveByDefault: file.includes('scheduler') && /PF_LIVE_WINDOWS_SCHEDULER_PROOF\s*=\s*"1"[\s\S]*PF_LIVE_WINDOWS_SCHEDULER_ORCHESTRATE\s*=\s*"1"/.test(text) && !/RunLiveScheduler/.test(text),
      usesBlockedMissingEnvFlag: !file.includes('scheduler') ? /ProofBlockedByMissingEnv/.test(text) : /RunLiveScheduler was not supplied/.test(text),
      invokesNodeProofForBlocked: /npm"\s+-Arguments\s+@\("run",\s+"proof:live-windows/.test(text),
      checksMissingEnvBeforeLiveRun: file.includes('scheduler') ? /RunLiveScheduler was not supplied/.test(text) : /if \(\$script:ProofBlockedByMissingEnv\)/.test(text),
    };
  });
  const failures = wrapperResults.flatMap((result) => {
    const problems = [];
    if (!result.hasBlockedLanguage) problems.push('missing honest BLOCKED language');
    if (result.hasMissingEnvThrow) problems.push('still throws on missing .env');
    if (result.forcesSchedulerLiveByDefault) problems.push('scheduler wrapper forces live orchestration by default');
    if (!result.usesBlockedMissingEnvFlag) problems.push('missing blocked/default guard');
    if (!result.invokesNodeProofForBlocked) problems.push('missing node proof fallback for blocked path');
    if (!result.checksMissingEnvBeforeLiveRun) problems.push('missing blocked guard before live proof run');
    return problems.map((problem) => ({ file: result.file, problem }));
  });
  return { status: failures.length === 0 ? 'PASSED' : 'FAILED', wrappers_checked: wrapperResults.length, wrapperResults, failures };
}
