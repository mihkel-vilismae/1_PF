#!/usr/bin/env node
/**
 * Static endpoint contract inventory for PF_login.
 *
 * The API server registers route keys as `METHOD /api/...` object properties in
 * `server/index.ts` plus small route-factory modules under `server/routes/`.
 * This tool extracts those route keys without starting the server, classifies
 * them by surface, and optionally verifies that the OpenSpec document lists all
 * currently registered HTTP endpoints.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const ROUTE_SOURCE_FILES = Object.freeze([
  'server/index.ts',
  'server/routes/inspectionRoutes.ts',
  'server/routes/runtimeStatusRoutes.ts',
  'server/routes/runtimeTruthRoutes.ts',
  'server/routes/schedulerRoutes.ts',
  'server/routes/screenSimulationRoutes.ts',
]);

const METHOD_ORDER = Object.freeze(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

/** Extracts literal `METHOD /api/...` route keys from TypeScript source text. */
export function extractRouteKeysFromText(text) {
  const routeKeys = [];
  const regex = /['"`]((GET|POST|PUT|PATCH|DELETE) \/api\/[^'"`]+)['"`]\s*:/g;
  for (const match of text.matchAll(regex)) routeKeys.push(match[1]);
  return routeKeys;
}

/** Returns all currently registered HTTP API endpoints discovered from route source files. */
export function collectEndpointInventory({ repoRoot = process.cwd() } = {}) {
  const seen = new Map();
  for (const sourcePath of ROUTE_SOURCE_FILES) {
    const absolutePath = join(repoRoot, sourcePath);
    const text = readFileSync(absolutePath, 'utf8');
    for (const routeKey of extractRouteKeysFromText(text)) {
      if (!seen.has(routeKey)) {
        const [method, ...pathParts] = routeKey.split(' ');
        const path = pathParts.join(' ');
        seen.set(routeKey, {
          routeKey,
          method,
          path,
          surface: classifyEndpointSurface(path),
          sourcePath,
          authOrModeBoundary: classifyBoundary(path),
          mutation: method !== 'GET',
        });
      }
    }
  }
  return [...seen.values()].sort(compareEndpoints);
}

/** Classifies endpoints by the operator/runtime surface they expose. */
export function classifyEndpointSurface(path) {
  if (path.startsWith('/api/auth/new/')) return 'new auth/session/artifact surface';
  if (path.startsWith('/api/auth/')) return 'legacy auth/iCloudPD surface';
  if (path.startsWith('/api/init/cron/')) return 'scheduler target/cron-emulator surface';
  if (path.startsWith('/api/init/database/')) return 'database setup surface';
  if (path.startsWith('/api/database-viewer/')) return 'database viewer surface';
  if (path.startsWith('/api/runtime/download/')) return 'download pipeline surface';
  if (path.startsWith('/api/runtime/index/') || path.startsWith('/api/runtime/gps/') || path.startsWith('/api/runtime/geocode/') || path.startsWith('/api/runtime/queue/')) return 'media pipeline stage surface';
  if (path.startsWith('/api/runtime/playback/')) return 'playback contract/checkpoint surface';
  if (path.startsWith('/api/native-playback/')) return 'native playback control surface';
  if (path.startsWith('/api/testing/')) return 'test/proof-only surface';
  if (path.startsWith('/api/runtime/orchestration/')) return 'runtime orchestration status/run surface';
  if (path.startsWith('/api/runtime/screen-simulation/')) return 'screen simulation test surface';
  if (path.startsWith('/api/runtime-truth') || path.startsWith('/api/runtime/pipeline/')) return 'runtime truth and pipeline maintenance surface';
  if (path === '/api/version' || path === '/api/init/verify-env') return 'inspection/preflight surface';
  if (path === '/api/runtime/projection/live') return 'live runtime projection surface';
  return 'uncategorized API surface';
}

/** Describes proof/session/runtime boundaries that matter to outside callers. */
export function classifyBoundary(path) {
  if (path.startsWith('/api/auth/new/') || path.startsWith('/api/auth/')) return 'May touch provider/session state; outputs must remain sanitized.';
  if (path === '/api/runtime/download/real-run') return 'Real provider route; requires authenticated/session readiness and explicit opt-in.';
  if (path.startsWith('/api/testing/')) return 'Test Mode/proof-only boundary; do not use as production API.';
  if (path.startsWith('/api/native-playback/')) return 'Project-owned native playback process boundary; must not kill arbitrary OS processes.';
  if (path.startsWith('/api/init/cron/')) return 'Scheduler target boundary; Windows Task Scheduler remains out of scope.';
  if (path.startsWith('/api/runtime-truth') || path.startsWith('/api/runtime/pipeline/')) return 'Local runtime truth/lock maintenance boundary.';
  return 'Local same-origin dashboard/API boundary.';
}

/** Builds a markdown table for OpenSpec embedding. */
export function renderEndpointMarkdownTable(endpoints = collectEndpointInventory()) {
  const rows = [
    '| Endpoint | Surface | Source | Boundary |',
    '|---|---|---|---|',
  ];
  for (const endpoint of endpoints) {
    rows.push(`| \`${endpoint.routeKey}\` | ${endpoint.surface} | \`${endpoint.sourcePath}\` | ${endpoint.authOrModeBoundary} |`);
  }
  return rows.join('\n');
}

/** Verifies an OpenSpec file contains every discovered route key. */
export function checkOpenSpecCoverage({ docPath, endpoints = collectEndpointInventory(), repoRoot = process.cwd() }) {
  const text = readFileSync(join(repoRoot, docPath), 'utf8');
  return endpoints.filter((endpoint) => !text.includes(endpoint.routeKey));
}

function compareEndpoints(a, b) {
  const pathCompare = a.path.localeCompare(b.path);
  if (pathCompare !== 0) return pathCompare;
  return METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method);
}

function usage() {
  return [
    'Usage:',
    '  node tools/collect-endpoint-contract-inventory.mjs [--format json|markdown]',
    '  node tools/collect-endpoint-contract-inventory.mjs --check-doc <path>',
  ].join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage());
    return;
  }

  const checkIndex = args.indexOf('--check-doc');
  if (checkIndex >= 0) {
    const docPath = args[checkIndex + 1];
    if (!docPath) throw new Error('--check-doc requires a document path');
    const endpoints = collectEndpointInventory();
    const missing = checkOpenSpecCoverage({ docPath, endpoints });
    if (missing.length > 0) {
      console.error(JSON.stringify({ status: 'FAILED', docPath, missing }, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify({ status: 'PASSED', docPath, endpoint_count: endpoints.length }, null, 2));
    return;
  }

  const formatIndex = args.indexOf('--format');
  const format = formatIndex >= 0 ? args[formatIndex + 1] : 'markdown';
  const endpoints = collectEndpointInventory();
  if (format === 'json') {
    console.log(JSON.stringify({ endpoint_count: endpoints.length, endpoints }, null, 2));
    return;
  }
  if (format === 'markdown') {
    console.log(renderEndpointMarkdownTable(endpoints));
    return;
  }
  throw new Error(`Unsupported format: ${format}`);
}

function isDirectCliInvocation() {
  if (!process.argv[1]) return false;
  return pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
}

if (isDirectCliInvocation()) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
