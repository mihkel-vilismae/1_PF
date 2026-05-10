"""Local HTTP dashboard for CronEmulator."""

from __future__ import annotations

import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .state import AppState

HOST = "127.0.0.1"
PORT = 8765


def find_repo_root() -> Path:
    """Resolve the repository root when running from source checkout."""

    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "crontab_emulated.txt").exists():
            return parent
    return Path.cwd()


APP_STATE: AppState | None = None


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""

    parser = argparse.ArgumentParser(
        description="Run the CronEmulator dashboard.",
    )
    parser.add_argument(
        "crontab_file",
        nargs="?",
        type=Path,
        help="Path to the crontab file to emulate. Defaults to crontab_emulated.txt in the project root.",
    )
    parser.add_argument(
        "--log-file",
        type=Path,
        help="Path to a JSON Lines file for persistent cron call logs, including command output.",
    )
    return parser.parse_args()


def get_app_state() -> AppState:
    """Return initialized application state."""

    if APP_STATE is None:
        raise RuntimeError("Application state has not been initialized.")
    return APP_STATE


class CronEmulatorHandler(BaseHTTPRequestHandler):
    """HTTP request handler for dashboard HTML and JSON API."""

    server_version = "CronEmulator/0.1.0"

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self._send_html(DASHBOARD_HTML)
            return
        if parsed.path == "/api/state":
            query = parse_qs(parsed.query)
            selected_job_id = query.get("job_id", [None])[0]
            self._send_json(get_app_state().snapshot(selected_job_id=selected_job_id))
            return
        self.send_error(404, "Not found")

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        parsed = urlparse(self.path)
        if parsed.path == "/api/reload":
            get_app_state().reload_crontab()
            self._send_json({"ok": True})
            return
        if parsed.path == "/api/scheduler/start":
            get_app_state().scheduler.start()
            self._send_json({"ok": True})
            return
        if parsed.path == "/api/scheduler/stop":
            get_app_state().scheduler.stop()
            self._send_json({"ok": True})
            return
        if parsed.path == "/api/logs/clear":
            get_app_state().clear_logs()
            self._send_json({"ok": True})
            return
        if parsed.path == "/api/jobs/run":
            payload = self._read_json_body()
            job_id = str(payload.get("job_id", ""))
            self._send_json({"ok": get_app_state().execute_job_by_id(job_id)})
            return
        self.send_error(404, "Not found")

    def log_message(self, format: str, *args: object) -> None:
        """Keep server logging compact and useful."""

        print(f"[HTTP] {self.address_string()} - {format % args}")

    def _read_json_body(self) -> dict[str, object]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def _send_json(self, payload: object) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, html: str) -> None:
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    """Start the local dashboard server."""

    global APP_STATE

    args = parse_args()
    repo_root = find_repo_root()
    crontab_path = args.crontab_file.resolve() if args.crontab_file else None
    log_file_path = args.log_file.resolve() if args.log_file else None
    APP_STATE = AppState(repo_root, crontab_path=crontab_path, log_file_path=log_file_path)

    server = ThreadingHTTPServer((HOST, PORT), CronEmulatorHandler)
    print(f"CronEmulator dashboard: http://{HOST}:{PORT}")
    print(f"Loaded crontab: {get_app_state().crontab_path}")
    if get_app_state().log_file_path:
        print(f"Cron call log file: {get_app_state().log_file_path}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping CronEmulator...")
    finally:
        get_app_state().scheduler.stop()
        server.server_close()


DASHBOARD_HTML = r"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CronEmulator</title>
  <style>
    :root { color-scheme: dark; --bg:#0d1117; --panel:#161b22; --panel2:#0b1220; --line:#30363d; --text:#e6edf3; --muted:#8b949e; --good:#3fb950; --bad:#f85149; --warn:#d29922; --accent:#58a6ff; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, Segoe UI, system-ui, sans-serif; background: radial-gradient(circle at top, #172033, var(--bg)); color: var(--text); }
    main { max-width: 1440px; margin: 0 auto; padding: 24px; }
    header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .sub { color: var(--muted); font-size: 14px; word-break: break-all; }
    .pill { display:inline-flex; gap:8px; align-items:center; border:1px solid var(--line); border-radius:999px; padding:8px 12px; background:rgba(255,255,255,.04); }
    .dot { width:10px; height:10px; border-radius:50%; background:var(--bad); box-shadow:0 0 10px currentColor; }
    .dot.on { background:var(--good); }
    .toolbar { display:flex; flex-wrap:wrap; gap:10px; margin: 14px 0; }
    button, select { background:#21262d; color:var(--text); border:1px solid var(--line); border-radius:10px; padding:9px 12px; cursor:pointer; }
    button:hover, select:hover { border-color:var(--accent); }
    section { background:rgba(22,27,34,.92); border:1px solid var(--line); border-radius:18px; padding:16px; margin-bottom:18px; box-shadow:0 16px 60px rgba(0,0,0,.28); }
    .section-title { display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:12px; }
    h2 { margin:0; font-size:18px; }
    pre.terminal { min-height:96px; margin:0; padding:16px; border-radius:14px; background:#050a12; border:1px solid #1f6feb55; color:#c9d1d9; overflow:auto; white-space:pre-wrap; font-family: Consolas, 'Cascadia Mono', monospace; box-shadow: inset 0 0 0 1px rgba(255,255,255,.02); }
    table { width:100%; border-collapse:collapse; font-size:14px; overflow:hidden; }
    th, td { padding:10px 8px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
    th { color:#b6c2cf; font-weight:600; background:rgba(255,255,255,.03); position:sticky; top:0; }
    tr:hover td { background:rgba(88,166,255,.06); }
    .status { font-weight:700; }
    .valid { color:var(--good); }
    .invalid { color:var(--bad); }
    .countdown { font-size:18px; color:#79c0ff; font-variant-numeric:tabular-nums; }
    .raw { font-family: Consolas, 'Cascadia Mono', monospace; color:#c9d1d9; max-width:420px; word-break:break-word; }
    .grid { display:grid; grid-template-columns: 1fr; gap:18px; }
    .empty { color:var(--muted); padding:16px; }
    .stdout { color:var(--good); }
    .stderr { color:var(--warn); }
    @media (max-width: 900px) { main { padding: 12px; } header { flex-direction:column; } table { font-size:12px; } th,td { padding:8px 6px; } }
  </style>
</head>
<body>
<main>
  <header>
    <div>
      <h1>CronEmulator</h1>
      <div class="sub" id="path">Loading crontab...</div>
    </div>
    <div class="pill"><span id="statusDot" class="dot"></span><span id="statusText">Scheduler stopped</span></div>
  </header>

  <div class="toolbar">
    <button onclick="post('/api/reload')">Reload crontab</button>
    <button onclick="post('/api/scheduler/start')">Start scheduler</button>
    <button onclick="post('/api/scheduler/stop')">Stop scheduler</button>
    <button onclick="runSelected()">Run selected job now</button>
    <button onclick="post('/api/logs/clear')">Clear log</button>
    <select id="jobFilter" onchange="refresh()"><option value="">All logs</option></select>
  </div>

  <section>
    <div class="section-title"><h2>Raw crontab_emulated.txt</h2><span class="sub">Exact loaded file contents</span></div>
    <pre class="terminal" id="rawCrontab"></pre>
  </section>

  <section>
    <div class="section-title"><h2>Parsed jobs</h2><span class="sub" id="generatedAt"></span></div>
    <div style="overflow:auto">
      <table>
        <thead>
          <tr>
            <th>Select</th><th>Status</th><th>Job name</th><th>Timing</th><th>Seconds</th><th>Next run</th><th>Command</th><th>Last run</th><th>Last result</th><th>Raw row</th>
          </tr>
        </thead>
        <tbody id="jobsBody"></tbody>
      </table>
    </div>
  </section>

  <section>
    <div class="section-title"><h2>Run log</h2><span class="sub">Filter with the dropdown above</span></div>
    <div style="overflow:auto">
      <table>
        <thead><tr><th>Timestamp</th><th>Job</th><th>Status</th><th>Code</th><th>Raw cron row</th><th>Stdout</th><th>Stderr</th></tr></thead>
        <tbody id="logsBody"></tbody>
      </table>
    </div>
  </section>
</main>
<script>
let selectedJobId = '';

async function post(url, payload = {}) {
  await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  await refresh();
}

function runSelected() {
  const chosen = document.querySelector('input[name="selectedJob"]:checked');
  if (!chosen) return alert('Select a valid job row first.');
  post('/api/jobs/run', {job_id: chosen.value});
}

async function refresh() {
  const filter = document.getElementById('jobFilter').value;
  const res = await fetch('/api/state' + (filter ? `?job_id=${encodeURIComponent(filter)}` : ''));
  const state = await res.json();
  render(state);
}

function render(state) {
  document.getElementById('path').textContent = state.crontab_path;
  document.getElementById('rawCrontab').textContent = state.raw_crontab || '(empty or missing crontab_emulated.txt)';
  document.getElementById('generatedAt').textContent = 'Updated ' + state.generated_at;
  document.getElementById('statusDot').classList.toggle('on', state.scheduler_running);
  document.getElementById('statusText').textContent = state.scheduler_running ? 'Scheduler running' : 'Scheduler stopped';

  const filter = document.getElementById('jobFilter');
  const currentFilter = filter.value;
  filter.innerHTML = '<option value="">All logs</option>' + state.jobs.map(job => `<option value="${escapeHtml(job.id)}">${escapeHtml(job.job_name)}</option>`).join('');
  filter.value = currentFilter;

  document.getElementById('jobsBody').innerHTML = state.jobs.map(job => `
    <tr>
      <td>${job.valid ? `<input type="radio" name="selectedJob" value="${escapeHtml(job.id)}">` : ''}</td>
      <td class="status ${job.valid ? 'valid':'invalid'}">${job.valid ? 'valid':'invalid'}${job.error ? `<div class="sub">${escapeHtml(job.error)}</div>`:''}</td>
      <td>${escapeHtml(job.job_name)}</td>
      <td>${escapeHtml(job.readable_timing)}</td>
      <td class="countdown">${job.seconds_until_next_run ?? '-'}</td>
      <td>${job.next_run_timestamp ?? '-'}</td>
      <td class="raw">${escapeHtml(job.command)}</td>
      <td>${job.last_run_timestamp ?? '-'}</td>
      <td>${job.last_result ? `${escapeHtml(job.last_result)} (${job.last_return_code ?? '-'})` : '-'}</td>
      <td class="raw">${escapeHtml(job.raw_row)}</td>
    </tr>`).join('') || '<tr><td colspan="10" class="empty">No active cron rows found.</td></tr>';

  document.getElementById('logsBody').innerHTML = state.logs.map(log => `
    <tr>
      <td>${escapeHtml(log.timestamp)}</td>
      <td>${escapeHtml(log.job_name)}</td>
      <td>${escapeHtml(log.status)}</td>
      <td>${log.return_code ?? '-'}</td>
      <td class="raw">${escapeHtml(log.raw_cron_row)}</td>
      <td class="stdout">${escapeHtml(log.stdout_summary || '')}</td>
      <td class="stderr">${escapeHtml(log.stderr_summary || '')}</td>
    </tr>`).join('') || '<tr><td colspan="7" class="empty">No run logs yet.</td></tr>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

refresh();
setInterval(refresh, 1000);
</script>
</body>
</html>
"""


if __name__ == "__main__":
    main()
