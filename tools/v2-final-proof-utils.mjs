import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

export function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

export function parseArgs(argv = process.argv.slice(2)) {
  return {
    contract: argv.includes('--contract'),
    evidence: argv.includes('--evidence'),
    write: argv.includes('--write'),
    json: argv.includes('--json'),
  };
}

export function check(checks, id, description, condition, details = {}) {
  checks.push({ id, description, status: condition ? 'PASSED' : 'BLOCKED', details });
}

export function proofResult({ proof, checks, note, evidenceMode }) {
  const passed = checks.filter((item) => item.status === 'PASSED').length;
  const blocked = checks.length - passed;
  return {
    proof,
    status: blocked === 0 ? 'PASSED' : 'BLOCKED',
    mode: evidenceMode ? 'evidence' : 'contract',
    passed,
    blocked,
    checks,
    note,
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

export function emitProof(result, { write = false } = {}) {
  const payload = JSON.stringify(result, null, 2);
  console.log(payload);
  if (write) {
    const proofsDir = path.resolve('runtime_data', 'proofs');
    mkdirSync(proofsDir, { recursive: true });
    const safeName = result.proof.replace(/[^a-z0-9_-]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeFileSync(path.join(proofsDir, `${safeName}_${timestamp}.json`), `${payload}\n`, 'utf8');
  }
  process.exit(result.status === 'PASSED' ? 0 : 1);
}

export function packageScripts() {
  return readJson('package.json').scripts ?? {};
}

export function packageVersionMatches() {
  const pkg = readJson('package.json');
  const version = readText('VERSION').trim();
  const lock = existsSync('package-lock.json') ? readJson('package-lock.json') : null;
  return pkg.version === version && (!lock || lock.version === version || lock.packages?.['']?.version === version);
}

export function readTruthEvents(mode = 'real', root = process.cwd()) {
  const candidates = [
    process.env[mode === 'real' ? 'V2_WORKER_TRUTH_DIR' : 'TEST_V2_WORKER_TRUTH_DIR'],
    path.join(root, 'runtime_data', 'v2_worker_truth', mode),
  ].filter(Boolean);
  const events = [];
  const files = [];
  const malformed = [];
  for (const dir of candidates) {
    const resolvedDir = path.resolve(root, dir);
    if (!existsSync(resolvedDir)) continue;
    for (const filename of ['regular-worker.truth.jsonl', 'playback-worker.truth.jsonl', 'screen-worker.truth.jsonl']) {
      const filePath = path.join(resolvedDir, filename);
      if (!existsSync(filePath)) continue;
      files.push(filePath);
      const worker = filename.replace('.truth.jsonl', '');
      const lines = readText(filePath).split(/\r?\n/).filter(Boolean);
      lines.forEach((line, index) => {
        try {
          events.push({ worker, ...JSON.parse(line), sourceFile: filePath, sourceLine: index + 1 });
        } catch (error) {
          malformed.push({ filePath, line: index + 1, error: error instanceof Error ? error.message : String(error) });
        }
      });
    }
    if (files.length) break;
  }
  events.sort((a, b) => String(a.timestamp ?? '').localeCompare(String(b.timestamp ?? '')));
  return { events, files, malformed };
}

export function findLatestProofs(root = process.cwd()) {
  const dir = path.join(root, 'runtime_data', 'proofs');
  const latestByProof = new Map();
  if (!existsSync(dir)) return [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const filePath = path.join(dir, name);
    try {
      const stats = statSync(filePath);
      const parsed = readJson(filePath);
      const proof = parsed.proof || parsed.proofName || name.replace(/_\d{4}.+$/, '');
      const previous = latestByProof.get(proof);
      if (!previous || stats.mtimeMs > previous.mtimeMs) {
        latestByProof.set(proof, { proof, filePath, mtimeMs: stats.mtimeMs, status: parsed.status ?? 'UNKNOWN', parsed });
      }
    } catch {
      // Ignore malformed proof artifacts in the summary collector.
    }
  }
  return [...latestByProof.values()].sort((a, b) => a.proof.localeCompare(b.proof));
}

export function commandAvailable(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
  return result.status === 0;
}
