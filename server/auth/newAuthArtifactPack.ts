/*
 * Generates safe NEW AUTH login evidence packs for debugging iCloudPD login.
 * The pack collects sanitized endpoint snapshots, status summaries, and raw-log
 * metadata without copying provider secrets or changing authentication behavior.
 */
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sanitizeAuthValue } from './authLogSanitizer.ts';
import { resolveIcloudpdRawStdioLogPath } from './icloudpdRawStdioLog.ts';
import { getNewAuthSessionFiles, getNewAuthStatus, type NewAuthContext } from './newAuthService.ts';

interface GenerateArtifactPackOptions {
  repoRoot?: string;
  now?: Date;
}

interface ArtifactWriteEntry {
  relativePath: string;
  content: string;
}

interface RedactionFinding {
  file: string;
  pattern: string;
  matchPreview: string;
}

interface SafeFileMetadata {
  exists: boolean;
  path: string;
  sizeBytes?: number;
  lastModified?: string;
  contentsCaptured: false;
}

const artifactSchemaVersion = 1;
const artifactRootRelativePath = path.join('debug_artifacts', 'auth');
const redactionPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: 'email_address', pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { label: 'six_digit_code', pattern: /\b\d{6}\b/g },
  { label: 'password_assignment', pattern: /\b(pass(word)?|pw)\s*[:=]\s*[^\s\r\n]+/gi },
  { label: 'cookie_assignment', pattern: /\bcookie\s*[:=]\s*[^\s\r\n]+/gi },
  { label: 'token_assignment', pattern: /\b(token|authorization)\s*[:=]\s*[^\s\r\n]+/gi },
];

/*
 * Creates a new sanitized artifact pack under debug_artifacts/auth and returns
 * its manifest-level metadata for API callers.
 */
export async function generateNewAuthLoginArtifactPack(
  context: NewAuthContext = {},
  options: GenerateArtifactPackOptions = {},
): Promise<Record<string, unknown>> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const now = options.now ?? new Date();
  const timestamp = buildEstonianTimestamp(now);
  const folderName = `auth_attempt_${timestamp.fileStamp}`;
  const artifactDirectory = path.join(repoRoot, artifactRootRelativePath, folderName);

  const passiveStatus = sanitizeAuthValue(await getNewAuthStatus(context, { providerProof: false }));
  const sessionFiles = sanitizeAuthValue(await getNewAuthSessionFiles(context));
  const rawStdioMetadata = await collectRawStdioLogMetadata(repoRoot);
  const statusMatrix = buildStatusMatrix(passiveStatus, sessionFiles, rawStdioMetadata);
  const evidenceSummary = buildEvidenceSummary(timestamp.display, statusMatrix, rawStdioMetadata);
  const issueHypotheses = buildIssueHypotheses(statusMatrix);
  const timeline = buildTimeline(timestamp.iso, statusMatrix);

  const preliminaryFiles: ArtifactWriteEntry[] = [
    {
      relativePath: 'MANIFEST.json',
      content: stringifyJson({
        schemaVersion: artifactSchemaVersion,
        generatedAt: timestamp.iso,
        generatedAtEstonia: timestamp.display,
        artifactType: 'new_auth_login_evidence_pack',
        provider: 'icloudpd',
        purpose: 'Safe NEW AUTH login debugging evidence pack.',
        artifactDirectory: path.relative(repoRoot, artifactDirectory),
        safety: {
          rawProviderOutputCopied: false,
          sessionFileContentsCopied: false,
          secretValuesExpected: false,
          rawIcloudpdLogIsPrivateExternalEvidence: true,
        },
        files: [
          'README.md',
          'TIMELINE.ndjson',
          'STATUS_MATRIX.md',
          'EVIDENCE_SUMMARY.md',
          'ISSUE_HYPOTHESES.md',
          'endpoint_snapshots/new_auth_status_passive.json',
          'endpoint_snapshots/new_auth_session_files.json',
          'provider_communication/icloudpd_raw_stdio_metadata.json',
          'frontend/frontend_capture_notes.md',
          'backend/backend_capture_notes.md',
          'redaction/redaction_checks.json',
        ],
      }),
    },
    { relativePath: 'README.md', content: buildReadme(timestamp.display) },
    { relativePath: 'TIMELINE.ndjson', content: timeline.map((entry) => stringifyJsonLine(entry)).join('') },
    { relativePath: 'STATUS_MATRIX.md', content: renderStatusMatrix(statusMatrix) },
    { relativePath: 'EVIDENCE_SUMMARY.md', content: evidenceSummary },
    { relativePath: 'ISSUE_HYPOTHESES.md', content: issueHypotheses },
    { relativePath: path.join('endpoint_snapshots', 'new_auth_status_passive.json'), content: stringifyJson(passiveStatus) },
    { relativePath: path.join('endpoint_snapshots', 'new_auth_session_files.json'), content: stringifyJson(sessionFiles) },
    { relativePath: path.join('provider_communication', 'icloudpd_raw_stdio_metadata.json'), content: stringifyJson(rawStdioMetadata) },
    { relativePath: path.join('frontend', 'frontend_capture_notes.md'), content: buildFrontendCaptureNotes() },
    { relativePath: path.join('backend', 'backend_capture_notes.md'), content: buildBackendCaptureNotes() },
  ];

  const redactionChecks = runRedactionChecks(preliminaryFiles);
  const files = [
    ...preliminaryFiles,
    { relativePath: path.join('redaction', 'redaction_checks.json'), content: stringifyJson(redactionChecks) },
  ];

  await writeArtifactFiles(artifactDirectory, files);

  return {
    ok: redactionChecks.passed,
    state: redactionChecks.passed ? 'success' : 'redaction_warning',
    message: redactionChecks.passed
      ? 'NEW AUTH login artifact pack generated with sanitized evidence only.'
      : 'NEW AUTH login artifact pack generated, but redaction checks found suspicious content. Review redaction/redaction_checks.json before sharing.',
    artifact: {
      schemaVersion: artifactSchemaVersion,
      path: path.relative(repoRoot, artifactDirectory),
      generatedAt: timestamp.iso,
      generatedAtEstonia: timestamp.display,
      fileCount: files.length,
      rawProviderOutputCopied: false,
      sessionFileContentsCopied: false,
    },
    redaction: redactionChecks,
  };
}

/*
 * Reads only metadata for the optional raw iCloudPD stdio log; contents are not
 * copied into the shareable artifact pack.
 */
async function collectRawStdioLogMetadata(repoRoot: string): Promise<SafeFileMetadata> {
  const resolved = resolveIcloudpdRawStdioLogPath(process.env, repoRoot);
  const fallbackPath = path.join(repoRoot, 'runtime_data', 'private_logs', 'icloudpd_raw_stdio.log');
  const logPath = resolved ?? fallbackPath;
  try {
    const fileStat = await stat(logPath);
    return {
      exists: true,
      path: path.relative(repoRoot, logPath),
      sizeBytes: fileStat.size,
      lastModified: fileStat.mtime.toISOString(),
      contentsCaptured: false,
    };
  } catch {
    return {
      exists: false,
      path: path.relative(repoRoot, logPath),
      contentsCaptured: false,
    };
  }
}

/*
 * Builds compact status rows that separate local, provider, frontend, and
 * redaction evidence instead of blending them into one login claim.
 */
function buildStatusMatrix(
  passiveStatus: Record<string, unknown>,
  sessionFiles: Record<string, unknown>,
  rawStdioMetadata: SafeFileMetadata,
): Array<Record<string, unknown>> {
  const statusDetails = isRecord(passiveStatus.details) ? passiveStatus.details : {};
  const localSessionEvidence = isRecord(statusDetails.localSessionEvidence) ? statusDetails.localSessionEvidence : {};
  const paths = Array.isArray(sessionFiles.paths) ? sessionFiles.paths : [];
  return [
    {
      evidence: 'Passive NEW AUTH status',
      status: String(passiveStatus.state ?? 'unknown'),
      safeConclusion: 'Backend returned local/passive NEW AUTH state.',
      notSafeToConclude: 'Provider login is verified.',
      source: 'GET /api/auth/new/status?providerProof=false',
    },
    {
      evidence: 'Local session metadata',
      status: Boolean(localSessionEvidence.hasSessionFiles) ? 'session_files_present' : 'no_session_files',
      fileCount: Number(localSessionEvidence.sessionFileCount ?? 0),
      safeConclusion: 'Local session-like file metadata is known.',
      notSafeToConclude: 'Session file contents are valid or provider-accepted.',
      source: 'GET /api/auth/new/session-files',
    },
    {
      evidence: 'Session path inventory',
      status: `${paths.length} path entries`,
      safeConclusion: 'Safe path metadata was captured without file contents.',
      notSafeToConclude: 'No path contents were inspected.',
      source: 'GET /api/auth/new/session-files',
    },
    {
      evidence: 'Raw iCloudPD stdio private log',
      status: rawStdioMetadata.exists ? 'private_log_exists' : 'private_log_missing',
      sizeBytes: rawStdioMetadata.sizeBytes ?? 0,
      safeConclusion: 'Private raw-log location metadata is known.',
      notSafeToConclude: 'Raw provider output is safe to share.',
      source: 'runtime_data/private_logs/icloudpd_raw_stdio.log metadata only',
    },
    {
      evidence: 'Active provider proof',
      status: 'not_attempted_by_artifact_generator',
      safeConclusion: 'Generator avoided active provider-side checks to prevent behavior changes.',
      notSafeToConclude: 'Provider accepted the current session.',
      source: 'generator safety rule',
    },
  ];
}

/*
 * Produces a short human-readable evidence summary from the collected matrix.
 */
function buildEvidenceSummary(generatedAt: string, rows: Array<Record<string, unknown>>, rawStdioMetadata: SafeFileMetadata): string {
  return [
    '# NEW AUTH Login Evidence Summary',
    '',
    `Generated: ${generatedAt}`,
    '',
    'This pack contains sanitized evidence snapshots for iCloudPD-backed NEW AUTH login debugging.',
    '',
    '## Key facts',
    '',
    '- Passive backend auth status was captured without active provider proof.',
    '- Session files are represented as metadata only; file contents were not copied.',
    `- Raw iCloudPD stdio contents were not copied. Private log metadata says exists=${rawStdioMetadata.exists}.`,
    '- Redaction checks are written to `redaction/redaction_checks.json`.',
    '',
    '## Matrix summary',
    '',
    ...rows.map((row) => `- ${row.evidence}: ${row.status}`),
    '',
  ].join('\n');
}

/*
 * Produces safe first-pass hypotheses without claiming login success.
 */
function buildIssueHypotheses(rows: Array<Record<string, unknown>>): string {
  const passiveStatus = rows.find((row) => row.evidence === 'Passive NEW AUTH status');
  const localSession = rows.find((row) => row.evidence === 'Local session metadata');
  return [
    '# NEW AUTH Issue Hypotheses',
    '',
    'Use these as investigation prompts, not conclusions.',
    '',
    `1. Passive status is currently \`${String(passiveStatus?.status ?? 'unknown')}\`; compare this with the dashboard NEW AUTH panel state.`,
    `2. Local session metadata reports \`${String(localSession?.status ?? 'unknown')}\`; provider proof is still needed before claiming login works.`,
    '3. If raw iCloudPD private log metadata shows a non-zero file, inspect that private file locally only; do not share it without manual redaction.',
    '4. If UI and backend disagree, add frontend screenshots/event history beside this pack before drawing conclusions.',
    '',
  ].join('\n');
}

/*
 * Builds the artifact timeline as newline-delimited JSON events.
 */
function buildTimeline(generatedAtIso: string, rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return [
    {
      at: generatedAtIso,
      event: 'artifact_pack_generation_started',
      source: 'POST /api/auth/new/artifacts/generate',
      secretsShown: false,
    },
    ...rows.map((row) => ({
      at: generatedAtIso,
      event: 'evidence_snapshot_recorded',
      evidence: row.evidence,
      status: row.status,
      source: row.source,
      secretsShown: false,
    })),
    {
      at: generatedAtIso,
      event: 'artifact_pack_generation_completed',
      secretsShown: false,
    },
  ];
}

/*
 * Renders the evidence matrix as markdown for quick human review.
 */
function renderStatusMatrix(rows: Array<Record<string, unknown>>): string {
  const header = '| Evidence | Status | Safe conclusion | Not safe to conclude | Source |';
  const divider = '|---|---|---|---|---|';
  const body = rows.map((row) => [
    sanitizeMarkdownCell(row.evidence),
    sanitizeMarkdownCell(row.status),
    sanitizeMarkdownCell(row.safeConclusion),
    sanitizeMarkdownCell(row.notSafeToConclude),
    sanitizeMarkdownCell(row.source),
  ].join(' | '));
  return ['# NEW AUTH Status Matrix', '', header, divider, ...body.map((line) => `| ${line} |`), ''].join('\n');
}

/*
 * Builds the root README for the generated artifact pack.
 */
function buildReadme(generatedAt: string): string {
  return [
    '# NEW AUTH Login Artifact Pack',
    '',
    `Generated: ${generatedAt}`,
    '',
    'This folder contains sanitized evidence for debugging iCloudPD-backed NEW AUTH login.',
    '',
    'Start with:',
    '',
    '1. `MANIFEST.json`',
    '2. `EVIDENCE_SUMMARY.md`',
    '3. `STATUS_MATRIX.md`',
    '4. `redaction/redaction_checks.json`',
    '',
    'Safety boundaries:',
    '',
    '- Raw iCloudPD stdout/stderr is not copied into this pack.',
    '- Session/cache file contents are not copied into this pack.',
    '- This pack does not prove that login works; active provider proof or runtime evidence is still required.',
    '',
  ].join('\n');
}

/*
 * Explains how to add frontend-only evidence after generation.
 */
function buildFrontendCaptureNotes(): string {
  return [
    '# Frontend Capture Notes',
    '',
    'This generator runs in the backend and cannot capture browser screenshots or in-memory dashboard event history by itself.',
    '',
    'Add screenshots or copied dashboard event history here only after checking that no secrets are visible.',
    '',
  ].join('\n');
}

/*
 * Explains which backend evidence was included and which private evidence was not.
 */
function buildBackendCaptureNotes(): string {
  return [
    '# Backend Capture Notes',
    '',
    'Included backend evidence:',
    '',
    '- Passive NEW AUTH status snapshot.',
    '- NEW AUTH session/path metadata snapshot.',
    '- Private raw iCloudPD stdio log metadata only.',
    '',
    'Not included:',
    '',
    '- Raw provider stdout/stderr contents.',
    '- Raw session/cache file contents.',
    '- Raw environment values.',
    '',
  ].join('\n');
}

/*
 * Checks generated file contents for obvious secrets before writing the final
 * redaction report into the pack.
 */
function runRedactionChecks(files: ArtifactWriteEntry[]): Record<string, unknown> {
  const findings: RedactionFinding[] = [];
  for (const file of files) {
    for (const check of redactionPatterns) {
      check.pattern.lastIndex = 0;
      for (const match of file.content.matchAll(check.pattern)) {
        findings.push({
          file: file.relativePath,
          pattern: check.label,
          matchPreview: String(match[0] ?? '').slice(0, 80),
        });
      }
    }
  }
  return {
    passed: findings.length === 0,
    checkedAt: new Date().toISOString(),
    checkedFileCount: files.length,
    findingCount: findings.length,
    findings,
    rawProviderOutputCopied: false,
    sessionFileContentsCopied: false,
  };
}

/*
 * Writes artifact files after ensuring every target directory exists.
 */
async function writeArtifactFiles(artifactDirectory: string, files: ArtifactWriteEntry[]): Promise<void> {
  await mkdir(artifactDirectory, { recursive: true });
  for (const file of files) {
    const destination = path.join(artifactDirectory, file.relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content, 'utf8');
  }
}

/*
 * Lists existing artifact pack folder names for operator discovery.
 */
export async function listNewAuthLoginArtifactPacks(options: GenerateArtifactPackOptions = {}): Promise<Record<string, unknown>> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const artifactRoot = path.join(repoRoot, artifactRootRelativePath);
  try {
    const entries = await readdir(artifactRoot, { withFileTypes: true });
    const packs = await Promise.all(entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('auth_attempt_'))
      .map(async (entry) => {
        const manifestPath = path.join(artifactRoot, entry.name, 'MANIFEST.json');
        try {
          const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
          return {
            name: entry.name,
            path: path.join(artifactRootRelativePath, entry.name),
            generatedAt: manifest.generatedAt ?? null,
            generatedAtEstonia: manifest.generatedAtEstonia ?? null,
          };
        } catch {
          return {
            name: entry.name,
            path: path.join(artifactRootRelativePath, entry.name),
            generatedAt: null,
            generatedAtEstonia: null,
          };
        }
      }));
    return {
      ok: true,
      state: 'success',
      artifactRoot: artifactRootRelativePath,
      count: packs.length,
      packs: packs.sort((left, right) => String(right.name).localeCompare(String(left.name))),
    };
  } catch {
    return {
      ok: true,
      state: 'success',
      artifactRoot: artifactRootRelativePath,
      count: 0,
      packs: [],
    };
  }
}

/*
 * Formats timestamps for both filenames and Estonian human-readable evidence.
 */
function buildEstonianTimestamp(now: Date): { iso: string; display: string; fileStamp: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Tallinn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now).reduce<Record<string, string>>((accumulator, part) => {
    accumulator[part.type] = part.value;
    return accumulator;
  }, {});
  const display = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} EEST`;
  const fileStamp = `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}${parts.second}_EEST`;
  return {
    iso: now.toISOString(),
    display,
    fileStamp,
  };
}

/*
 * Converts values to pretty JSON with a trailing newline for stable diffs.
 */
function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/*
 * Converts values to compact NDJSON lines.
 */
function stringifyJsonLine(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

/*
 * Escapes markdown table separators in generated cells.
 */
function sanitizeMarkdownCell(value: unknown): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/*
 * Narrows unknown values to records for safe nested field access.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
