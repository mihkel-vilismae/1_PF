# Logging Standard Contract

Estonian timestamp: 29.05.2026, 20:18:00 EEST

This contract extracts the reusable logging standard from the PF_login / 1234_PF photo-frame project. It is intended for implementation in another project without copying this repository's dashboard layout, backend route table, auth provider, or media pipeline implementation.

## 1. Purpose and scope

The standard defines how a project records durable backend/runtime diagnostics, optional verbose HTTP evidence, terminal-like UI log panels, and sensitive provider-debug output. The contract is reusable across projects that have a backend service, a frontend/dashboard, optional hardware or worker processes, and operator-facing troubleshooting screens.

The contract does not require the target project to use this repo's route names, media stages, SQLite schema, iCloudPD provider, or OS playback views. Those are adapter examples only.

## 2. Source evidence in this baseline

| Evidence area | Repo evidence | Contract meaning |
| --- | --- | --- |
| Backend JSONL logger | `server/logging/projectLogger.ts` | Own log file paths, JSONL serialization, safe file creation, and ordered best-effort writes behind one logger interface. |
| HTTP request completion logging | `server/index.ts` request handler and `logRequest()` | Every handled backend request should produce a compact completion record with method, route, status, duration, and request correlation ID when available. |
| Verbose request lifecycle logging | `server/index.ts` `logVerboseRequestStarted()`, `logVerboseRequestCompleted()`, and `logVerboseRequestFailed()` | Optional verbose mode may capture sanitized request/response lifecycle records without changing normal response behavior. |
| Auth/login debug mirror | `server/index.ts` login debug helpers and `logger.loginDebug()` | Sensitive auth routes may have a dedicated sanitized debug sink that is intentionally separate from normal runtime logs. |
| Private raw provider output | `server/auth/icloudpdRawStdioLog.ts` | Raw provider stdout/stderr capture must be opt-in, private/local-only, path-restricted, and outside shareable artifacts. |
| Runtime/Test log isolation | `server/runtimeModeEnv.ts`, `example.env`, `test.example.env` | Real Mode and Test Mode log roots must be separable so test runs do not write into the operator's real runtime logs. |
| Terminal-like UI panels | `dashboard/views/osPlaybackView.ts`, `dashboard/app.ts` | Terminal-like panels must provide copy all, clear, and per-row expand affordances. |
| Regression coverage | `tests/projectLogger.test.js`, `tests/initApi.step1.test.js`, `tests/icloudpdRawStdioLog.test.js`, `tests/envExamples.test.js` | File creation, mirroring, verbose redaction, private raw log path rules, and environment examples should be covered. |

## 3. Mandatory logging guarantees

A project implementing this contract must provide these guarantees:

| Guarantee | Requirement |
| --- | --- |
| Durable JSONL format | Persistent logs use one JSON object per line. Normal project log entries include at least `at`, `level`, `source`, `message`, and `details`. |
| Stable logger boundary | Application code writes through a single project logger or narrow adapter. Feature code should not scatter direct file appends except for explicitly isolated private/debug sinks. |
| Non-truncating startup | Logger initialization creates required files and directories without truncating existing log files. |
| Best-effort write safety | Log write failure must not crash or alter the user-facing operation. It may report to stderr/console or a provided error hook. |
| Ordered writes | Concurrent writes should be serialized or chained so entries are not interleaved unpredictably. |
| Aggregate visibility | Normal info/debug/error project entries are mirrored into an aggregate `full_log.log` or equivalent. |
| Sensitive-data redaction | Credentials, cookies, tokens, authorization headers, passwords, API keys, 2FA codes, session values, and raw secrets are redacted before reaching normal logs, verbose logs, UI history, or shareable artifacts. |
| Environment-driven roots | Log directory and optional verbose logging are configured by environment values or equivalent typed config, not hardcoded paths inside feature logic. |
| Test/Real separation | Test Mode or test harness logs must be redirected to a safe test log root and must not write into Real Mode operator logs. |
| UI observability | Operator terminal-like panels should expose enough log rows to diagnose current behavior without requiring direct filesystem access. |

## 4. Log categories and channels

Use these channels as the portable default. Rename only when a target project has a better domain term, but preserve the responsibility split.

| Channel | Default file | Contents | Mirrored to aggregate? | Notes |
| --- | --- | --- | --- | --- |
| Regular runtime log | `log_<YYYY-MM-DD_HH-MM-SS>.log` | Info-level runtime and request-completion entries for the current process start. | Yes | Use one timestamped file per backend start or run session. |
| Debug log | `debug.log` | Debug-level backend/runtime diagnostics. | Yes | Keep useful but not raw-secret-bearing. |
| Error log | `error.log` | Error-level backend/runtime diagnostics and failed server operations. | Yes | Feed error-only UI panels from this when possible. |
| Aggregate full log | `full_log.log` | Unified normal runtime stream containing info, debug, and error entries. | N/A | This is the first file to inspect when reconstructing behavior. |
| Verbose request lifecycle log | `full_log_verbose.log` | Sanitized request_started, request_completed, and request_failed records. | No | Disabled unless explicitly enabled because it is high-volume. |
| Auth/login debug log | `logindebug.log` | Sanitized auth/login route arrival, completion, and failure diagnostics. | No | Keep separate from normal runtime logs to reduce accidental sharing. |
| Private raw provider log | `runtime_data/private_logs/<provider>_raw_stdio.log` | Raw stdout/stderr from an external provider or tool. | No | Must be opt-in, path-restricted, private, and excluded from shareable artifacts. |
| Frontend/UI history | In-memory or persisted UI event rows | User action history, backend call summaries, and display events. | No | Do not treat this as a substitute for backend durable logs. |

## 5. Entry schema

Normal project JSONL entries should use this shape:

| Field | Type | Requirement |
| --- | --- | --- |
| `at` | ISO-8601 string | Required timestamp created at write time. |
| `level` | `info`, `debug`, or `error` | Required normalized severity. Unknown levels default to `info`. |
| `source` | string | Required component or adapter name, such as `server`, `worker`, or `test`. |
| `message` | string | Required short human-readable message. Error objects should contribute their public message. |
| `details` | JSON-safe value | Required but may be null. Error objects should be serialized to public fields such as name, message, stack, and code. |

Verbose lifecycle entries may use a flatter event schema with `event`, `requestId`, `request`, `response`, `statusCode`, and `durationMs`. The target project may extend this, but it must keep redaction and payload-size limits.

## 6. Request/response correlation requirements

Where a frontend or dashboard calls the backend, the client should send a correlation ID header such as `X-Dashboard-Request-Id`. The backend should validate the ID with a bounded safe-character rule before echoing or logging it.

Backend completion logs should include the correlation ID when provided. Verbose lifecycle logs may generate an internal request ID when the frontend did not provide one, but generated IDs should not be confused with user-facing correlation IDs.

Each completion record should include at least method, path or route key, status code, duration in milliseconds, and correlation ID when available.

## 7. Redaction and security rules

| Rule | Requirement |
| --- | --- |
| Redact by key and context | Redact common sensitive keys and auth/provider-specific keys recursively in objects, arrays, query parameters, headers, request bodies, responses, and error details. |
| Redact invalid/raw request bodies | If parsing fails or raw body text is logged for diagnostics, replace raw content with a redacted marker. |
| Bound payload size | Verbose request/response payloads should be limited before writing to disk. Large data should be summarized, not dumped. |
| Keep raw provider output private | Raw stdout/stderr logs are not shareable logs. They are local private debugging artifacts and must be disabled by default. |
| Restrict raw log paths | Raw provider paths must resolve under an approved private runtime log directory and use a safe log extension. |
| Do not expose secrets in UI | Terminal-like UI panels and auth status screens may show sanitized previews or classifications only. |
| Do not weaken behavior on log failure | Logging is diagnostic. It must never make auth, playback, workers, downloads, or hardware control succeed/fail differently. |

## 8. Terminal-like UI requirements

Any terminal-like div or panel that displays durable or live log rows should include these controls by default:

| Control | Requirement |
| --- | --- |
| Copy all | Copies all currently rendered rows in a readable format. |
| Clear | Clears only the local rendered panel/history unless the user explicitly triggers a backend log-clearing action. |
| Expand row | Opens a large detail view or modal for the selected row so long payloads are readable without truncation. |
| Scroll preservation | Live-refreshing panels should preserve user scroll and focus where practical. |
| Source label | The panel should identify whether data came from backend logs, scheduler logs, native/player logs, simulated/test data, or local UI history. |

Clearing a UI terminal panel should not delete durable backend log files unless there is a separate destructive control with confirmation and clear wording.

## 9. Frontend, backend, worker, and firmware adapter guidance

| Adapter | Guidance |
| --- | --- |
| Backend service | Own durable JSONL files and request lifecycle logging. Keep route handlers focused on domain behavior and call a logger facade. |
| Frontend/dashboard | Generate request IDs, show call status, mirror backend results into UI history, and render terminal-like panels with copy/clear/expand controls. |
| Worker/scheduler | Use the same logger or a compatible JSONL writer with `source` set to the worker name. Worker logs should appear in aggregate runtime evidence. |
| Hardware/firmware bridge | Treat serial/Wi-Fi packets as transport events. Log connection status, command ID, response status, and payload summaries; do not log Wi-Fi passwords, tokens, or raw secrets. |
| External provider/tool | Capture sanitized status in normal logs. Capture raw stdout/stderr only through an explicit private raw-debug sink. |
| Test harness | Override log roots to safe test paths and assert that Real Mode paths are not touched. |

## 10. Environment/configuration keys

A target project can rename these keys, but it should keep equivalent behavior.

| Key | Purpose | Default-style value |
| --- | --- | --- |
| `LOG_DIR` | Real/runtime log directory. | `runtime_data/logs` or `logs` |
| `TEST_LOG_DIR` | Safe test log directory. | `test_runtime_data/logs` |
| `FULL_LOG` | Aggregate full log path when a component expects an explicit path. | `<LOG_DIR>/full_log.log` |
| `TEST_FULL_LOG` | Aggregate test full log path. | `<TEST_LOG_DIR>/full_log.log` |
| `FULL_LOG_VERBOSE` | Enables sanitized verbose request lifecycle JSONL. | `false` unless actively debugging |
| `CLEAR_FULL_LOG` | Optional retention/rotation policy marker. | Project-specific |
| `<PROVIDER>_RAW_STDIO_LOG` | Explicit opt-in for raw provider stdout/stderr capture. | `0` / disabled |
| `<PROVIDER>_RAW_STDIO_LOG_PATH` | Private raw provider log path. | `runtime_data/private_logs/<provider>_raw_stdio.log` |
| `LOG_RETENTION_DAYS` | Optional retention policy. | Project-specific |

## 11. Test checklist

A project implementing this contract should have tests or manual checks for these cases:

| Check | Expected result |
| --- | --- |
| Logger initialization | Required files are created without truncating existing contents. |
| Info/debug/error routing | Info goes to the regular timestamped log and aggregate full log; debug goes to debug and aggregate; error goes to error and aggregate. |
| Login/auth debug routing | Auth/login diagnostics go to the dedicated sanitized debug sink and not to unrelated logs unless intentionally mirrored. |
| Verbose disabled | `full_log_verbose.log` is absent or empty when verbose mode is disabled. |
| Verbose enabled | Sanitized request_started, request_completed, and request_failed entries are written with request IDs and durations. |
| Redaction | Passwords, cookies, tokens, auth headers, API keys, 2FA codes, and invalid raw request bodies are absent from normal, verbose, auth, and UI logs. |
| Raw provider disabled | Raw provider output is not captured unless the explicit opt-in flag is enabled. |
| Raw provider path guard | Unsafe raw log paths outside private runtime logs are rejected. |
| Test/Real separation | Test runs write only to test log paths. |
| Terminal controls | Each terminal-like UI panel has copy all, clear, and expand row behavior. |

## 12. Migration checklist for another project

1. Create a logger module that owns paths, file creation, JSONL serialization, and write ordering.
2. Replace direct feature-level file appends with calls to the logger or a narrow private-debug adapter.
3. Add environment/configuration keys for real logs, test logs, verbose lifecycle logging, retention, and private raw-provider logging.
4. Add request correlation from frontend to backend and include safe IDs in completion and verbose records.
5. Add recursive redaction and payload-size limiting before any request/response/error details reach disk or UI.
6. Add terminal-like UI panels with copy all, clear, and expand row controls.
7. Keep raw provider/tool output private, disabled by default, path-restricted, and excluded from shareable ZIPs/artifacts.
8. Add regression tests for file routing, redaction, verbose toggles, raw path guards, and Test/Real log isolation.
9. Document which logs are safe to share and which are local-private only.
10. Verify packaging excludes runtime logs, private logs, secrets, `node_modules`, and other ignored files.

## 13. Non-goals

This contract does not require a specific database, route naming scheme, frontend framework, media pipeline, auth provider, native player, ESP32 firmware protocol, or scheduler implementation. It defines the logging behavior and observability boundaries that those components should use.
