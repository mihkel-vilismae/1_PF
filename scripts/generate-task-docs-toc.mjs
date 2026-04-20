import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const taskDocsDir = path.join(repoRoot, 'task_docs');
const tocPath = path.join(taskDocsDir, '_TABLE_OF_CONTENTS.md');

const CONTROLLED_STATUSES = [
  'proposed',
  'in_progress',
  'implemented',
  'superseded',
  'archived',
  'reference',
  'unknown',
];

const files = listFiles(taskDocsDir)
  .filter((filePath) => path.basename(filePath) !== '_TABLE_OF_CONTENTS.md')
  .sort((left, right) => left.localeCompare(right));

const entries = files.map(buildEntry);
const output = renderToc(entries);

writeFileSync(tocPath, output, 'utf8');
console.log(`Wrote ${path.relative(repoRoot, tocPath)} with ${entries.length} entries.`);

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listFiles(fullPath);
    }
    return [fullPath];
  });
}

function buildEntry(filePath) {
  const relativePath = normalizeRelativePath(path.relative(taskDocsDir, filePath));
  const content = isMarkdown(filePath) ? readFileSync(filePath, 'utf8') : '';
  const gitInfo = getGitInfo(filePath);

  return {
    relativePath,
    title: detectTitle(relativePath, content),
    purpose: detectPurpose(relativePath, content),
    status: detectStatus(relativePath, content),
    created: gitInfo.createdDate,
    lastUpdated: gitInfo.lastUpdatedDate,
    latestCommit: gitInfo.latestCommit,
    notes: detectNotes(relativePath, content, gitInfo),
  };
}

function isMarkdown(filePath) {
  return path.extname(filePath).toLowerCase() === '.md';
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function getGitInfo(filePath) {
  const relativeToRepo = normalizeRelativePath(path.relative(repoRoot, filePath));
  const result = spawnSync(
    'git',
    ['log', '--follow', '--format=%h|%cs', '--', relativeToRepo],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || `git log failed for ${relativeToRepo}`);
  }

  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const statusResult = spawnSync(
    'git',
    ['status', '--porcelain', '--', relativeToRepo],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  if (statusResult.status !== 0) {
    throw new Error(statusResult.stderr || `git status failed for ${relativeToRepo}`);
  }

  const dirty = Boolean(statusResult.stdout.trim());

  if (!lines.length) {
    return {
      createdDate: 'unknown',
      lastUpdatedDate: 'unknown',
      latestCommit: 'uncommitted',
      committed: false,
      dirty,
    };
  }

  const latest = lines[0].split('|');
  const earliest = lines[lines.length - 1].split('|');

  return {
    createdDate: earliest[1] || 'unknown',
    lastUpdatedDate: latest[1] || 'unknown',
    latestCommit: latest[0] || 'unknown',
    committed: true,
    dirty,
  };
}

function detectTitle(relativePath, content) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) {
    return heading;
  }
  return path.basename(relativePath);
}

function detectPurpose(relativePath, content) {
  if (!content) {
    return 'Non-Markdown file tracked under task_docs/.';
  }

  const summarySection = extractSection(content, 'Summary');
  const purposeSection = extractSection(content, 'Purpose');
  const source = summarySection || purposeSection || content;
  const paragraph = firstParagraph(source);

  if (paragraph) {
    return clip(cleanInlineMarkdown(paragraph), 160);
  }

  if (relativePath === 'README.md') {
    return 'Folder-level conventions for adding and maintaining task documentation.';
  }

  return 'Task documentation entry.';
}

function detectStatus(relativePath, content) {
  if (relativePath === 'README.md') {
    return 'reference';
  }

  const statusSection = extractSection(content, 'Status');
  const statusSource = `${statusSection}\n${content}`.toLowerCase();

  for (const status of CONTROLLED_STATUSES) {
    const pattern = status.replace('_', '[ _-]?');
    if (new RegExp(`\\b${pattern}\\b`, 'i').test(statusSource)) {
      return status;
    }
  }

  return 'unknown';
}

function detectNotes(relativePath, content, gitInfo) {
  const notes = [];

  if (!gitInfo.committed) {
    notes.push('Uncommitted file.');
  }

  if (gitInfo.dirty && gitInfo.committed) {
    notes.push('Has uncommitted changes.');
  }

  if (relativePath === 'README.md') {
    notes.push('Companion process doc for task_docs/ maintenance.');
  }

  if (/^##\s+Codex-Ready Implementation Prompt\s*$/mi.test(content)
    && /^##\s+GitHub Issue \/ Spec-Style Task Description\s*$/mi.test(content)) {
    notes.push('Includes both a Codex-ready implementation prompt and a GitHub issue / spec-style task description.');
  }

  return notes.length ? notes.join(' ') : '—';
}

function extractSection(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^##\\s+${escapedHeading}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`, 'mi'));
  return match?.[1]?.trim() ?? '';
}

function firstParagraph(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('- ') && !line.startsWith('|') && !/^\d+\.\s/.test(line));

  if (!lines.length) {
    return '';
  }

  return lines[0];
}

function cleanInlineMarkdown(value) {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function clip(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function escapeTableCell(value) {
  return String(value).replace(/\|/g, '\\|');
}

function renderToc(entries) {
  const listedFiles = entries.map((entry) => `- \`${entry.relativePath}\``).join('\n');
  const tableRows = entries
    .map((entry) =>
      [
        `\`${entry.relativePath}\``,
        `\`${escapeTableCell(entry.title)}\``,
        escapeTableCell(entry.purpose),
        `\`${entry.status}\``,
        `\`${entry.created}\``,
        `\`${entry.lastUpdated}\``,
        `\`${entry.latestCommit}\``,
        escapeTableCell(entry.notes),
      ].join(' | '),
    )
    .map((row) => `| ${row} |`)
    .join('\n');

  return `# Task Docs Table of Contents

_Generated by \`npm run task-docs:toc\`. Manual edits to this file may be overwritten the next time the generator runs._

## Authority

This file is the authoritative index for \`task_docs/\`.

Rules:

- every file under \`task_docs/\` must be listed here exactly once
- \`_TABLE_OF_CONTENTS.md\` itself is the only file in \`task_docs/\` excluded from the registry table below
- whenever a file in \`task_docs/\` is added, removed, renamed, or materially updated, regenerate this file in the same patch
- metadata must not be invented; when a value cannot be determined reliably, use \`unknown\` or \`uncommitted\`

## Registry

| Path | Title | Purpose | Status | Created | Last Updated | Latest Commit | Notes |
|---|---|---|---|---|---|---|---|
${tableRows}

## Maintenance Check

Current indexed file count: \`${entries.length}\`

Expected covered files under \`task_docs/\` excluding \`_TABLE_OF_CONTENTS.md\`:

${listedFiles}
`;
}
