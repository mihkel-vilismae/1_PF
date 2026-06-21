#!/usr/bin/env node
import { writeLastRunStats, ensureParentDir } from './proofrunner-handoff-runtime-lib.mjs';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    out[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
for (const required of ['summary', 'timing', 'out', 'version', 'head', 'run-id', 'platform-runner', 'started-at', 'ended-at', 'passed', 'failed', 'discovered', 'summary-file']) {
  if (!args[required]) throw new Error(`Missing --${required}`);
}
ensureParentDir(args.out);
const stats = await writeLastRunStats({
  summaryPath: args.summary,
  timingPath: args.timing,
  outPath: args.out,
  version: args.version,
  head: args.head,
  runId: args['run-id'],
  platformRunner: args['platform-runner'],
  startedAt: args['started-at'],
  endedAt: args['ended-at'],
  passedExitZero: args.passed,
  failedExitNonzero: args.failed,
  discovered: args.discovered,
  summaryFile: args['summary-file'],
  summaryFormat: args['summary-format'] ?? 'auto',
});
console.log(JSON.stringify({ status: 'PASSED', outPath: args.out, proof_scripts_discovered: stats.proof_scripts_discovered }, null, 2));
