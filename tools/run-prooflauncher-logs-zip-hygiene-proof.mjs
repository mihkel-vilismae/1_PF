#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { check, emitProof, proofResult } from './v2-final-proof-utils.mjs';

const argv = process.argv.slice(2);
const contract = argv.includes('--contract');
const write = argv.includes('--write');
const evidence = argv.includes('--evidence') || Boolean(process.env.PF_PROOFLAUNCHER_LOG_ZIP);
const zipArgIndex = argv.indexOf('--zip');
const zipPath = zipArgIndex >= 0 ? argv[zipArgIndex + 1] : process.env.PF_PROOFLAUNCHER_LOG_ZIP;

const checks = [];
const forbiddenPatterns = [
  { id: 'workspace', pattern: /(^|\/)workspace(\/|$)/ },
  { id: 'node_modules', pattern: /(^|\/)node_modules(\/|$)/ },
  { id: 'git-dir', pattern: /(^|\/)\.git(\/|$)/ },
  { id: 'repo-package-json', pattern: /(^|\/)package\.json$/ },
  { id: 'repo-package-lock', pattern: /(^|\/)package-lock\.json$/ },
];

const raspberryLauncher = path.resolve('prooflauncher_raspberry.sh');
const localRaspberryLauncher = existsSync(raspberryLauncher)
  ? raspberryLauncher
  : path.resolve('start_scripts', 'prooflauncher_raspberry.sh');
const launcherText = existsSync(localRaspberryLauncher) ? readFileSync(localRaspberryLauncher, 'utf8') : '';

check(
  checks,
  'launcher-uses-logs-only-stage',
  'Prooflauncher uses a logs-only staging folder instead of zipping the whole run workspace.',
  launcherText.includes('LOGS_ONLY_STAGE') || launcherText.includes('logs_only_stage'),
  { launcher: localRaspberryLauncher },
);
check(
  checks,
  'launcher-does-not-zip-whole-run-dir',
  'Prooflauncher does not zip the entire run directory with workspace included.',
  !launcherText.includes('zip -r "$RESULT_ZIP" "$RUN_TS"') && !launcherText.includes('Compress-Archive -Force -Path $RunDir'),
  { forbiddenShell: 'zip -r "$RESULT_ZIP" "$RUN_TS"', forbiddenPowerShell: 'Compress-Archive -Force -Path $RunDir' },
);
check(
  checks,
  'launcher-excludes-workspace-repo-folders',
  'Prooflauncher explicitly excludes workspace, node_modules, and .git from log ZIP staging.',
  ['workspace', 'node_modules', '.git'].every((needle) => launcherText.includes(needle)),
  { requiredTerms: ['workspace', 'node_modules', '.git'] },
);

let entries = [];
let zipListingError = null;
if (!contract) {
  check(checks, 'zip-path-provided', 'Prooflauncher log ZIP path was provided.', Boolean(zipPath), { zipPath: zipPath ?? null });
  check(checks, 'zip-file-exists', 'Prooflauncher log ZIP exists.', Boolean(zipPath && existsSync(zipPath)), { zipPath: zipPath ?? null });
  if (zipPath && existsSync(zipPath)) {
    const listed = listZipEntries(zipPath);
    entries = listed.entries;
    zipListingError = listed.error;
    check(checks, 'zip-listable', 'Prooflauncher log ZIP entries can be listed.', !zipListingError, { error: zipListingError });
    check(checks, 'zip-entry-count-positive', 'Prooflauncher log ZIP contains evidence/log entries.', entries.length > 0, { entryCount: entries.length });
    for (const item of forbiddenPatterns) {
      const matches = entries.filter((entry) => item.pattern.test(entry));
      check(checks, `zip-excludes-${item.id}`, `Log ZIP does not contain ${item.id} repo/workspace entries.`, matches.length === 0, { matches: matches.slice(0, 20), matchCount: matches.length });
    }
    const requiredTopLevel = ['prooflauncher.log', 'command_logs/', 'captured_artifacts/'];
    for (const needle of requiredTopLevel) {
      check(
        checks,
        `zip-includes-${needle.replace(/[^a-z0-9]/gi, '-')}`,
        `Log ZIP includes ${needle}.`,
        entries.some((entry) => entry.includes(needle)),
        { needle },
      );
    }
  }
}

const result = proofResult({
  proof: 'prooflauncher_logs_zip_hygiene',
  checks,
  evidenceMode: !contract,
  note: 'Prooflauncher log ZIP hygiene proof. The proofrunner log ZIP must contain logs/proofs/truth/operator evidence only and must not include the extracted repository workspace, node_modules, or .git.',
});
result.evidence = { zipPath: zipPath ?? null, zipEntryCount: entries.length, zipListingError, forbiddenPatterns: forbiddenPatterns.map((item) => item.id) };

emitProof(result, { write });

function listZipEntries(filePath) {
  const unzip = spawnSync('unzip', ['-Z1', filePath], { encoding: 'utf8' });
  if (unzip.status === 0) {
    return { entries: unzip.stdout.split(/\r?\n/).filter(Boolean), error: null };
  }
  const python = spawnSync('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); print("\\n".join(z.namelist()))', filePath], { encoding: 'utf8' });
  if (python.status === 0) {
    return { entries: python.stdout.split(/\r?\n/).filter(Boolean), error: null };
  }
  return { entries: [], error: (unzip.stderr || python.stderr || 'unable to list zip entries').trim() };
}
