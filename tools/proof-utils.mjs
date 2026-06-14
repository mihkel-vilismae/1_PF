/**
 * Shared proof artifact helpers for PF_login.
 * Builds sanitized JSON evidence files under runtime_data/proofs.
 * Keeps external-provider and hardware proof claims explicit.
 * Avoids committing mutable proof outputs into the baseline.
 * Used by opt-in local proof runner scripts only.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));
const require = createRequire(import.meta.url);
const VALID_STATUSES = new Set(['PASSED', 'FAILED', 'BLOCKED', 'PARTIAL', 'TIMED_OUT']);

const PYTHON_COMMAND_CANDIDATES = Object.freeze([
  { command: 'python3', prefixArgs: [] },
  { command: 'py', prefixArgs: ['-3'] },
  { command: 'python', prefixArgs: [] },
]);
const SECRET_PATTERNS = [
  { name: 'apple_id_email', pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { name: 'password_assignment', pattern: /(password|pass|pwd)(\s*[:=]\s*)[^\s,;]+/gi, replacement: '$1$2[REDACTED]' },
  { name: 'api_key_assignment', pattern: /(api[_-]?key|token|secret|access[_-]?token|key)(\s*[:=]\s*)[^\s,;]+/gi, replacement: '$1$2[REDACTED]' },
  { name: 'six_digit_code', pattern: /\b\d{6}\b/g },
  { name: 'quoted_cookie_dir', pattern: /(cookie[_-]?dir|cookie_directory|session_path)(\s*[:=]\s*)["'][^"']+["']/gi, replacement: '$1$2"[REDACTED_PATH]"' },
  { name: 'windows_user_path', pattern: /[A-Z]:\\Users\\[^\\\s]+\\[^\n\r\t]*/gi },
  { name: 'unix_home_path', pattern: /\/home\/[^\/\s]+\/[^\n\r\t]*/gi },
  { name: 'query_secret', pattern: /([?&](?:api[_-]?key|token|secret|access_token)=)[^&\s]+/gi, replacement: '$1[REDACTED]' }
];

/** Redacts sensitive text while keeping proof summaries readable. */
export function sanitizeText(input) {
  let output = String(input ?? '');
  const matchedPatternNames = new Set();
  for (const rule of SECRET_PATTERNS) {
    output = output.replace(rule.pattern, (...args) => {
      matchedPatternNames.add(rule.name);
      return rule.replacement ? args[0].replace(rule.pattern, rule.replacement) : '[REDACTED]';
    });
  }
  return { text: output, redactionReport: { secrets_removed: matchedPatternNames.size > 0, matched_patterns: [...matchedPatternNames].sort(), raw_provider_output_included: false } };
}

/** Deeply sanitizes proof evidence objects before writing. */
export function sanitizeEvidence(value) {
  if (typeof value === 'string') return sanitizeText(value).text;
  if (Array.isArray(value)) return value.map((entry) => sanitizeEvidence(entry));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeEvidence(entry)]));
  return value;
}

/** Creates the shared proof envelope with explicit status vocabulary. */
export function createProofEnvelope({ proofKind, baselineVersion, gitCommit, proofStatus, runtimeMode, evidence, knownLimitations }) {
  if (!VALID_STATUSES.has(proofStatus)) throw new Error(`Invalid proof status: ${proofStatus}`);
  const sanitizedEvidence = sanitizeEvidence(evidence ?? {});
  const redactionReport = sanitizeText(JSON.stringify(sanitizedEvidence)).redactionReport;
  return { proof_kind: proofKind, baseline_version: baselineVersion, git_commit: gitCommit, proof_timestamp: new Date().toISOString(), runtime_mode: runtimeMode, proof_status: proofStatus, evidence: sanitizedEvidence, redaction_report: redactionReport, known_limitations: knownLimitations ?? [] };
}

/** Writes a proof artifact under ignored runtime data. */
export async function writeProofArtifact(proofKind, proofEnvelope) {
  const timestamp = proofEnvelope.proof_timestamp.replace(/[:.]/g, '-');
  const outputPath = join(repoRoot, 'runtime_data', 'proofs', `${proofKind}_${timestamp}.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(proofEnvelope, null, 2)}\n`, 'utf8');
  return outputPath;
}


/** Resolves the local tsx CLI so proof subprocesses do not depend on shell PATH npx lookup. */
export function resolveTsxCliPath() {
  return require.resolve('tsx/cli');
}

/** Builds a Node-backed tsx command so proof runners avoid shell-dependent npx lookup. */
export function buildLocalTsxCommand(argsAfterCli) {
  return { command: process.execPath, args: [resolveTsxCliPath(), ...argsAfterCli] };
}

/** Builds a Node test command backed by the local tsx CLI. */
export function buildLocalTsxTestCommand(testPaths = [], extraTestArgs = []) {
  return buildLocalTsxCommand(['--test', ...extraTestArgs, ...testPaths]);
}

/** Runs an inline Python script with Windows and POSIX command fallbacks. */
export function runPythonScriptWithFallback({ script, cwd = repoRoot, scriptLabel = 'PYTHON_PROOF_SCRIPT', timeoutMs = 120000 }) {
  const startedAt = Date.now();
  const attempts = [];
  for (const candidate of PYTHON_COMMAND_CANDIDATES) {
    const args = [...candidate.prefixArgs, '-c', script, cwd];
    const result = spawnSync(candidate.command, args, {
      cwd,
      encoding: 'utf8',
      timeout: timeoutMs,
    });
    attempts.push({ candidate, args, result });
    if (!result.error || result.error.code !== 'ENOENT') {
      return buildPythonFallbackResult({ candidate, args, result, attempts, startedAt, cwd, scriptLabel });
    }
  }
  const lastAttempt = attempts[attempts.length - 1];
  return buildPythonFallbackResult({ ...lastAttempt, attempts, startedAt, cwd, scriptLabel });
}

/** Builds sanitized command evidence for a Python fallback proof attempt. */
function buildPythonFallbackResult({ candidate, result, attempts, startedAt, cwd, scriptLabel }) {
  const commandResult = {
    command: candidate.command,
    args: [...candidate.prefixArgs, '-c', `[${scriptLabel}]`, cwd],
    attemptedCommands: attempts.map((attempt) => ({
      command: attempt.candidate.command,
      args: [...attempt.candidate.prefixArgs, '-c', `[${scriptLabel}]`, cwd],
      errorCode: attempt.result.error?.code ?? null,
      exitCode: attempt.result.status,
    })),
    exitCode: result.status,
    signal: result.signal,
    timedOut: Boolean(result.error && result.error.code === 'ETIMEDOUT'),
    durationMs: Date.now() - startedAt,
    stdout: sanitizeText(result.stdout ?? '').text,
    stderr: sanitizeText(result.stderr ?? result.error?.message ?? '').text,
  };
  return { commandResult, processResult: result };
}

/** Runs a child command and resolves even when a timeout needs force-kill. */
export function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const detached = options.detached ?? process.platform !== 'win32';
    const hasInput = Object.prototype.hasOwnProperty.call(options, 'input') && options.input !== undefined && options.input !== null;
    const child = spawn(command, args, {
      cwd: options.cwd ?? repoRoot,
      env: options.env ?? process.env,
      shell: options.shell ?? false,
      detached,
      stdio: [hasInput ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    let forceTimer = null;
    const timeoutMs = options.timeoutMs ?? 300000;
    function finish(exitCode, signal) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (forceTimer) clearTimeout(forceTimer);
      const sanitizeOutput = options.sanitize !== false;
      resolve({
        command,
        args,
        exitCode,
        signal,
        timedOut,
        durationMs: Date.now() - startedAt,
        stdout: sanitizeOutput ? sanitizeText(stdout).text : stdout,
        stderr: sanitizeOutput ? sanitizeText(stderr).text : stderr,
      });
    }
    function killChild(signal) {
      try {
        if (detached && child.pid && process.platform !== 'win32') {
          process.kill(-child.pid, signal);
          return;
        }
        child.kill(signal);
      } catch {
        try { child.kill(signal); } catch {}
      }
    }
    const timer = setTimeout(() => { timedOut = true; killChild('SIGTERM'); forceTimer = setTimeout(() => { killChild('SIGKILL'); finish(null, 'SIGKILL_TIMEOUT'); }, options.forceKillGraceMs ?? 2000); }, timeoutMs);
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    if (hasInput) {
      child.stdin?.end(String(options.input));
    }
    child.on('error', (error) => { stderr += `\n${error instanceof Error ? error.message : String(error)}`; finish(1, 'ERROR'); });
    child.on('close', (exitCode, signal) => finish(exitCode, signal));
  });
}

/** Returns non-secret environment metadata for proof artifacts. */
export function getProofEnvironment() {
  return { platform: process.platform, arch: process.arch, node_version: process.version, npm_lifecycle_event: process.env.npm_lifecycle_event ?? null };
}
