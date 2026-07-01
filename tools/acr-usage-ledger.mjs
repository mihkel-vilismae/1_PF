#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const KNOWN_ACR_COMMANDS = ['ACR', '2XACR', '3XACR', 'XACR', '2x2ACR', '3X2ACR'];
export const KNOWN_ACR_SOURCES = ['user_called', 'assistant_automatic'];
export const DEFAULT_ACR_LEDGER_PATH = 'runtime_data/workflow/acr-command-usage.jsonl';

const commandAliases = new Map(KNOWN_ACR_COMMANDS.map((command) => [command.toLowerCase(), command]));
commandAliases.set('2xacr', '2XACR');
commandAliases.set('3xacr', '3XACR');
commandAliases.set('xacr', 'XACR');
commandAliases.set('2x2acr', '2x2ACR');
commandAliases.set('3x2acr', '3X2ACR');

export function normalizeAcrCommand(value) {
  const key = String(value ?? '').trim().replace(/^\//, '').toLowerCase();
  const command = commandAliases.get(key);
  if (!command) {
    throw new Error(`Unknown ACR command: ${value}. Allowed: ${KNOWN_ACR_COMMANDS.join(', ')}`);
  }
  return command;
}

export function validateAcrSource(value) {
  const source = String(value ?? '').trim();
  if (!KNOWN_ACR_SOURCES.includes(source)) {
    throw new Error(`Unknown ACR source: ${value}. Allowed: ${KNOWN_ACR_SOURCES.join(', ')}`);
  }
  return source;
}

export function resolveLedgerPath(repoRoot = process.cwd(), ledgerPath = DEFAULT_ACR_LEDGER_PATH) {
  return path.isAbsolute(ledgerPath) ? ledgerPath : path.join(repoRoot, ledgerPath);
}

export function makeAcrUsageEvent(input) {
  const event = {
    timestamp: input.timestamp || new Date().toISOString(),
    command: normalizeAcrCommand(input.command),
    source: validateAcrSource(input.source),
    scope: cleanText(input.scope || 'unspecified'),
    project: cleanText(input.project || 'PF_login'),
    baselineVersion: cleanText(input.baselineVersion || 'unknown'),
    notes: cleanText(input.notes || '')
  };
  if (!Number.isFinite(Date.parse(event.timestamp))) {
    throw new Error(`Invalid timestamp: ${event.timestamp}`);
  }
  return event;
}

export function recordAcrUsage(input, options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const ledgerPath = resolveLedgerPath(repoRoot, options.ledgerPath || input.ledgerPath || DEFAULT_ACR_LEDGER_PATH);
  const event = makeAcrUsageEvent(input);
  mkdirSync(path.dirname(ledgerPath), { recursive: true });
  appendFileSync(ledgerPath, `${JSON.stringify(event)}\n`, 'utf8');
  return { status: 'RECORDED', ledgerPath, event };
}

export function readAcrUsageEvents(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const ledgerPath = resolveLedgerPath(repoRoot, options.ledgerPath || DEFAULT_ACR_LEDGER_PATH);
  if (!existsSync(ledgerPath)) return { ledgerPath, events: [] };
  const lines = readFileSync(ledgerPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const events = lines.map((line, index) => {
    const parsed = JSON.parse(line);
    return makeAcrUsageEvent({ ...parsed, lineNumber: index + 1 });
  });
  return { ledgerPath, events };
}

export function summarizeAcrUsage(options = {}) {
  const { ledgerPath, events } = readAcrUsageEvents(options);
  const rows = KNOWN_ACR_COMMANDS.map((command) => ({
    command,
    user_called: 0,
    assistant_automatic: 0,
    total: 0
  }));
  const byCommand = new Map(rows.map((row) => [row.command, row]));
  for (const event of events) {
    const row = byCommand.get(event.command);
    row[event.source] += 1;
    row.total += 1;
  }
  return { ledgerPath, eventsCount: events.length, rows };
}

function cleanText(value) {
  return String(value).replace(/[\r\n]/g, ' ').trim();
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      parsed._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function printSummaryTable(summary) {
  console.log(`ledger: ${summary.ledgerPath}`);
  console.log('| Command | User-called | Assistant automatic | Total |');
  console.log('|---|---:|---:|---:|');
  for (const row of summary.rows) {
    console.log(`| ${row.command} | ${row.user_called} | ${row.assistant_automatic} | ${row.total} |`);
  }
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args._[0] || 'summary';
  if (mode === 'record') {
    const result = recordAcrUsage({
      command: args.command,
      source: args.source,
      scope: args.scope,
      project: args.project,
      baselineVersion: args.baselineVersion,
      notes: args.notes,
      timestamp: args.timestamp,
      ledgerPath: args.ledger
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (mode === 'summary') {
    const summary = summarizeAcrUsage({ ledgerPath: args.ledger });
    if (args.json) console.log(JSON.stringify(summary, null, 2));
    else printSummaryTable(summary);
    return;
  }
  throw new Error(`Unknown mode: ${mode}. Use record or summary.`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === pathToFileURL(currentFile).href) {
  try {
    runCli();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
