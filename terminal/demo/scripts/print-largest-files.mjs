import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ignored = new Set(['.git', 'node_modules', 'dist', 'runtime_logs']);
const files = [];

walk(process.cwd());
for (const item of files.sort((a, b) => b.loc - a.loc).slice(0, 10)) {
  console.log(`${String(item.loc).padStart(5)} ${item.file}`);
}

const oversize = files.filter((item) => item.loc > 300 && /\.(ts|js|mjs|ps1|md)$/.test(item.file));
if (oversize.length > 0) {
  console.log('WARN files over 300 LOC:');
  for (const item of oversize.sort((a, b) => b.loc - a.loc)) console.log(`${item.loc} ${item.file}`);
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignored.has(name)) continue;
    const absolute = path.join(dir, name);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!stat.isFile()) continue;
    try {
      const text = readFileSync(absolute, 'utf8');
      files.push({ file: path.relative(process.cwd(), absolute).replace(/\\/g, '/'), loc: text.split(/\r?\n/).length });
    } catch {
      // binary/unreadable file; ignore for LOC check
    }
  }
}
