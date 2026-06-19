# Debug Page OpenSpec

Status: proposed / documentation contract.  
Version introduced: 0.8.130.  
Scope: lightweight PhotoFrame Debug page, sidebar entry, version tracker placement, debug pane layout, crontab setup, worker debug panes, safety boundaries, and proof expectations.

## 1. Purpose

The PhotoFrame project needs a lightweight **Debug** page that gives the operator one focused place to run debug actions, inspect controlled status, and prepare proofable runtime checks without mixing those controls into noisy logs or ordinary playback views.

The page is intentionally small at first. The OpenSpec contract exists before runtime implementation so later slices can add UI, backend actions, and Raspberry proofs without inventing behavior or shifting architecture boundaries.

## 2. Authority and non-claims

This document is a contract and planning authority, not runtime evidence.

Non-claims:

- This document does not prove a Debug page route exists.
- This document does not prove any crontab entry was read, paused, resumed, installed, or restored.
- This document does not prove real Raspberry worker execution.
- This document does not prove playback control, state restore, image ingestion, or database isolation.
- This document does not permit modifying unrelated system crontab entries.

A later implementation must cite code, tests, generated proof artifacts, or Raspberry target evidence before changing any of those non-claims.

## 3. Navigation contract

### 3.1 Route

The Debug page must have one stable route. Recommended route:

```text
/debug
```

If the existing router convention requires a different path, the implementation slice must update this OpenSpec and the runbook with the actual route.

### 3.2 Sidebar entry

The left sidebar must include a bottom-area entry with visible label:

```text
Debug
```

Contract:

- The visible text is **Debug**.
- The underlying page concept is **Debug Menu**.
- The entry belongs in the bottom/debug/system area of the sidebar.
- The entry must not displace existing primary product navigation unless explicitly approved in a later OpenSpec update.

### 3.3 Sidebar version tracker

A regular version-tracking item must be shown directly after or near the Debug entry.

Example display options:

```text
Debug
v0.8.130
```

or:

```text
Debug   v0.8.130
```

Contract:

- The version must come from the existing repo/app version source where possible.
- The implementation must not hard-code a stale version value.
- The sidebar version item is distinct from the page route; clicking the Debug entry opens the Debug page.

### 3.4 Top-right version tracker

Dashboard/visual UI surfaces should preserve the existing top-right version tracker pattern.

Clarified roles:

- Top-left eyebrow/overline text identifies the page/dashboard context.
- Top-right version tracker identifies current app version and may act as a debug/version affordance.
- The Debug page may show this same top-right tracker, but the sidebar version item remains separately required.

## 4. Debug page layout contract

The page is composed from full-width stacked panes. The whole page must not become a multi-column control wall.

Shared pane template:

- Full-width outer pane.
- Panes stack vertically.
- Top-left pane heading.
- Heading has an underline or line-under-text treatment.
- Optional short explanation text.
- Controls grouped separately from status/proof output.
- Warning blocks use clear color/status semantics.
- Undefined behavior appears as planned/TODO or blocked; it must not be rendered as proven success.

## 5. Pane: Store and restore state

Heading:

```text
Store and restore state
```

Purpose:

- Provide a controlled place for state snapshot and restoration planning.
- Model the same recovery class as power-loss and power-on resume, without claiming product recovery proof.

Required controls:

- **Save state**.
- **Restore state**.

Required status output after actions:

- action name;
- status: pending, running, succeeded, failed, blocked, or unknown;
- timestamp;
- evidence/log reference if available;
- block/failure reason if available.

TODO before runtime implementation:

- Define exactly what state means.
- Define where snapshots are stored.
- Define whether snapshots affect test state, real state, or both.
- Define overwrite/rollback behavior.
- Define proof artifacts for save and restore.

## 6. Pane: Test playback

Heading:

```text
Test playback
```

Purpose:

- Provide a controlled playback debugging surface.

Layout:

- One full-width outer pane.
- Internal split into left controls and right preview/player area.
- A subtle divider line separates control and player areas.

Required controls:

- **Run**.
- **Pause**.
- **Stop**.

Right-side area:

- built-in media player, playback preview, or explicit planned/blocked placeholder until implemented.

TODO before runtime implementation:

- Define whether controls target test playback, native playback, or both.
- Define the media source.
- Define backend/worker action mapping.
- Define safety behavior when real playback is already active.

## 7. Pane: Add images / process testing

Working heading options:

- **Add images**.
- **Image process testing**.
- **Process test input**.

Purpose:

- Imitate the download process without requiring a real download.
- Give the operator one controlled start point for downstream process testing.

Required control:

```text
+ Add images here
```

Single-entry contract:

- The plus/add-images control is the only official entry point into this test process.
- The implementation must not add hidden alternate entry points for the same flow unless OpenSpec is updated.
- Added images imitate downloaded media.
- Later stages may run only from the state created by this entry point.

Isolation contract:

- Test flow should use isolated test data and preferably its own test database.
- It must not mutate production media/database state unless a later OpenSpec explicitly allows that with warnings and proof requirements.

TODO before runtime implementation:

- Accepted file types and size/count limits.
- File storage path.
- Temporary versus persistent behavior.
- Test database name/location.
- Cleanup behavior.
- Proof that test data is isolated from production state.

## 8. Pane: Crontab Setup

Heading:

```text
Crontab Setup
```

Purpose:

- Inspect and safely manage PhotoFrame-owned crontab entries.
- Make scheduler state visible before worker debug panes.

This pane is safety-sensitive because crontab is the real scheduler path that invokes workers.

### 8.1 Read current crontab

Required action:

- Get current crontab file/content.
- Display app-owned entries when present.
- Show status: missing, active, paused, malformed, blocked, or unknown.

Rules:

- Read-only.
- Must distinguish app-owned entries from unrelated user/system entries.

### 8.2 Pause/resume app-owned entries

Required action:

- Pause by commenting out app-owned entries.
- Resume by re-enabling app-owned entries.
- Show current active/paused status.

Rules:

- Only operate on app-owned entries.
- Never blindly comment or remove unrelated crontab lines.
- Preserve unrelated entries exactly where practical.

### 8.3 Install crontab

Required action:

- Open an installer/configuration UI.
- Show a table-like UI with three worker rows:
  - regular worker;
  - playback worker;
  - on/off worker.
- Each row has a human-readable interval selector such as:
  - every 1 second;
  - every 10 seconds;
  - every 1 minute;
  - custom/manual.

Save/apply contract:

- Saving interval choices creates a pending configuration only.
- Pending configuration must show a large yellow warning:

```text
Setting is not applied yet. Press Install into crontab.
```

- Only the final **Install into crontab** action mutates the real crontab.

### 8.4 High-frequency safety

If any interval is less than 10 seconds, the final apply action must require double confirmation.

The warning must explain that high-frequency worker calls can cause runaway load, duplicate work, difficult-to-stop behavior, or other bad side effects.

### 8.5 App-owned block boundary

Implementation must manage a marked app-owned block instead of overwriting the whole crontab.

Recommended marker:

```text
# BEGIN PHOTOFRAME APP-OWNED CRONTAB
...
# END PHOTOFRAME APP-OWNED CRONTAB
```

If an existing marker convention already exists, use that convention and update this document.

### 8.6 Required safeguards before real mutation

Before writing crontab, implementation should:

- read current crontab;
- preserve unrelated entries;
- validate worker commands;
- validate intervals;
- create backup/rollback evidence;
- show preview or diff where practical;
- write only the app-owned block;
- return evidence/status after write.

## 9. Worker debug panes

Below **Crontab Setup**, add three separate stacked panes:

1. **Regular Worker Debug Pane**.
2. **Playback Worker Debug Pane**.
3. **On/off Worker Debug Pane**.

They are separate panes, not one combined pane.

### 9.1 Required telemetry

Each worker pane must show:

- first called timestamp;
- last called timestamp;
- called count.

Timestamp display must use Estonian date/time formatting.

Call count means scheduler/manual invocation count for that worker. If the count only covers crontab calls, the label must say so.

### 9.2 Recommended telemetry

Each worker pane should also show:

- current status: idle, running, failed, paused, disabled, blocked, or unknown;
- current interval;
- schedule source: crontab, manual, test, or unknown;
- next expected scheduled run when known;
- last run duration;
- average runtime;
- success count;
- failure count;
- last exit code;
- last error snippet;
- last log/evidence reference;
- worker command/path;
- enabled-in-crontab status;
- currently-running status.

### 9.3 Manual run

Each worker pane should include:

```text
Run now
```

or:

```text
Manually run now
```

Rules:

- Invoke only that worker once.
- Show pending/running/succeeded/failed/blocked status.
- Show timestamp and evidence/log output.
- Avoid unsafe concurrent duplicate worker runs unless explicitly supported.
- Respect scheduler and rate-limit safety rules.

## 10. Status reference from existing dashboard

The existing Test Mode dashboard screenshot showed:

```text
TEST MODE FAST EMULATOR STATUS
```

Visible rows:

- CRONTAB WORKING
- REGULAR WORKER CALLED
- PLAYBACK WORKER CALLED
- ON/OFF WORKER CALLED
- NATIVE PLAYBACK STARTED
- STAGE: MOCK DOWNLOAD
- STAGE: INDEX / REGISTER MEDIA
- STAGE: GPS PROCESSING
- STAGE: GEOCODE / ADDRESS RESOLUTION
- STAGE: QUEUE PREPARE
- STAGE: PLAYBACK SELECT

Rows used call/status fields such as first called, last called, and called count.

This screenshot is design/input evidence, not a complete contract. The Debug page contract above is the source for future implementation.

## 11. Data contracts

### 11.1 Worker telemetry object

Recommended shape:

```json
{
  "worker_id": "regular|playback|on_off",
  "display_name": "Regular Worker",
  "status": "idle|running|failed|paused|disabled|blocked|unknown",
  "first_called_at": "ISO-8601 timestamp or null",
  "last_called_at": "ISO-8601 timestamp or null",
  "first_called_display_et": "Estonian formatted datetime or not called yet",
  "last_called_display_et": "Estonian formatted datetime or not called yet",
  "called_count": 0,
  "current_interval": "human-readable interval or null",
  "schedule_source": "crontab|manual|test|unknown",
  "next_scheduled_at": "ISO-8601 timestamp or null",
  "last_duration_ms": null,
  "average_duration_ms": null,
  "success_count": 0,
  "failure_count": 0,
  "last_exit_code": null,
  "last_error_snippet": null,
  "last_log_reference": null,
  "enabled_in_crontab": false,
  "currently_running": false
}
```

### 11.2 Crontab status object

Recommended shape:

```json
{
  "status": "unknown|missing|active|paused|malformed|blocked",
  "app_owned_block_found": false,
  "unrelated_entries_preserved": true,
  "current_content_available": false,
  "backup_reference": null,
  "last_checked_at": "ISO-8601 timestamp or null",
  "last_changed_at": "ISO-8601 timestamp or null",
  "pending_install": false,
  "pending_warning": null,
  "requires_double_confirmation": false
}
```

### 11.3 Debug action result object

Recommended shape:

```json
{
  "action": "string",
  "status": "pending|running|succeeded|failed|blocked|unknown",
  "started_at": "ISO-8601 timestamp or null",
  "finished_at": "ISO-8601 timestamp or null",
  "message": "human readable status",
  "evidence_reference": null,
  "safe_to_retry": true
}
```

## 12. API placeholder contract

The following endpoints are placeholders for a later implementation slice. Do not claim they exist until code/tests prove them.

```text
GET  /api/debug/status
GET  /api/debug/crontab
POST /api/debug/crontab/pause
POST /api/debug/crontab/resume
POST /api/debug/crontab/preview-install
POST /api/debug/crontab/install
POST /api/debug/workers/:workerId/run
POST /api/debug/state/save
POST /api/debug/state/restore
POST /api/debug/images/add
```

If existing backend conventions differ, implementation must use existing conventions and update this placeholder.

## 13. Proof matrix

| Area | Minimum future proof | Current status |
|---|---|---|
| OpenSpec exists | File and index links exist | DOCUMENTED |
| Debug route | UI/router test proves route renders | PLANNED |
| Sidebar Debug link | UI/static test proves bottom/sidebar entry exists | PLANNED |
| Sidebar version item | UI/static test proves version appears near Debug | PLANNED |
| Top-right version tracker | UI/static test proves dashboard tracker is preserved | PLANNED/PRESERVE EXISTING |
| Shared pane template | UI/component test proves headings/layout | PLANNED |
| Store/restore state | Proof defines and exercises state save/restore | TODO |
| Test playback | UI/backend proof of run/pause/stop status | PLANNED |
| Add images entry point | Test proves plus button is single entry | PLANNED |
| Test database isolation | Proof verifies test DB differs from production DB | PLANNED |
| Crontab read | Fake-crontab test parses read-only status | PLANNED |
| Crontab pause/resume | Fake-crontab test modifies only app-owned block | PLANNED |
| Crontab install | Fake-crontab test writes only app-owned block | PLANNED |
| Under-10s interval warning | Test proves double confirmation requirement | PLANNED |
| Worker telemetry | Test proves first/last/called count display | PLANNED |
| Manual worker run | Test proves one safe worker invocation | PLANNED |
| Real Raspberry crontab | Raspberry proof artifact only | NOT CLAIMED |

## 14. Acceptance criteria

Documentation-stage acceptance:

- OpenSpec exists and is linked from OpenSpec README/table of contents.
- Regular runbook exists and links back to OpenSpec.
- Goal registry exists.
- Unknown behavior is marked planned/TODO.
- Crontab safety boundaries are explicit.
- Test isolation is explicit.
- Proof matrix is explicit.

Implementation-stage acceptance:

- Route/sidebar tests pass.
- Version tracker tests pass.
- Pane render tests pass.
- Fake-crontab parser/writer tests preserve unrelated entries.
- Under-10s interval double-confirmation test passes.
- Worker telemetry tests pass.
- Manual worker run tests pass.
- Image add flow single-entry test passes.
- Test database isolation proof exists.
- Real Raspberry crontab behavior is claimed only after Raspberry proof artifact.

## Keybook and element inventory

The Debug page must maintain a repo-local keybook/inventory for panes, buttons, planned stable UI element IDs, source files, docs, tests, proof commands, reality level, and non-claims.

Canonical files:

- `docs/40_backlog_and_tasks/debug_page_keybook.md`
- `docs/40_backlog_and_tasks/debug_page_keybook.json`
- `.codex/skills/debug-page-keybook/SKILL.md`

Future `data-ui-element-id` rendering and `*` corner marker behavior must be reconciled with this keybook. Keybook coverage does not prove real backend/provider/crontab/worker/database/media/Raspberry behavior.

## 15. Runtime keybook UI and element ID contract

As of v0.8.200, the Debug page must render these top-of-page panes before deeper debug controls:

1. **Help**
2. **Stack / Status**
3. **Elements / Buttons list**
4. **Auth / Session**

Implemented Debug panes/cards and buttons must expose stable globally unique PhotoFrame element IDs using `data-ui-element-id`. Inspectable elements must provide a `*` marker in debug/proof context. Hovering the marker shows the stable ID; clicking it opens a non-disruptive browser-local metadata dialog and must not trigger the underlying action.

The Auth / Session pane in this slice is a planned-safe surface only. It may list future login/check-session/verify-session targets, but it must not submit credentials, print secrets, read session file contents, or claim real provider proof until separate auth/session proof contracts are implemented.

## 16. World-class Debug page track

The world-class Debug page track is specified in [`debug_page_world_class_openspec.md`](debug_page_world_class_openspec.md). The slice plan is stored in [`../../40_backlog_and_tasks/debug_page_world_class_sliceplan.md`](../../40_backlog_and_tasks/debug_page_world_class_sliceplan.md).

Use `npm run proof:debug-page-world-class-plan` to validate that the plan keeps the max requested 4-batch structure, 18 slice records, visual toggle terms, proof input contract, and non-claim boundaries.
