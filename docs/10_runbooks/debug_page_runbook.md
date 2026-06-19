# Debug Page Runbook

Status: operator/developer runbook for the planned Debug page.  
Version introduced: 0.8.131.  
Related OpenSpec: [`debug_page_openspec.md`](../20_architecture_and_specs/openspec/debug_page_openspec.md).

## Debug Page Keybook

Use the repo-local keybook before changing or analyzing Debug page panes, buttons, element IDs, actions, tests, or proof claims:

- [`../40_backlog_and_tasks/debug_page_keybook.md`](../40_backlog_and_tasks/debug_page_keybook.md)
- [`../40_backlog_and_tasks/debug_page_keybook.json`](../40_backlog_and_tasks/debug_page_keybook.json)
- `.codex/skills/debug-page-keybook/SKILL.md`

The keybook maps each Debug page pane/button to source files, docs, tests, proof commands, reality level, and non-claims. It is a navigation and proof-honesty aid, not a runtime proof by itself.


## 1. Purpose

Use the Debug page as a focused control surface for PhotoFrame debug actions. It should help inspect worker state, run controlled debug functions, and view proof/status output without mixing those actions into noisy normal logs.

This runbook describes intended use. It does not prove the Debug page or its controls exist yet.

## 2. Opening the page

The planned left sidebar entry is:

```text
Debug
```

It belongs near the bottom of the sidebar. A regular version-tracking item should appear directly after/near it. Visual dashboards should also preserve the top-right version tracker pattern.

Recommended route, subject to existing router convention:

```text
/debug
```

## 3. Page layout

The page uses stacked full-width panes. Each pane has:

- heading in the top-left;
- underline or line-under-text treatment;
- optional explanation text;
- action controls;
- status/proof output;
- warnings where an action can touch real runtime state.

Do not treat a button label as proof that behavior is implemented. Proof comes from code/tests/generated artifacts/target evidence.

## 4. Store and restore state

### Intended use

Use this pane to debug save/restore behavior related to power-loss and resume scenarios.

### Controls

- **Save state**: saves a controlled snapshot/state once implementation defines what state means.
- **Restore state**: restores from the saved snapshot once semantics are defined.

### Before using real restore

Confirm the implementation defines:

- what state is saved;
- what files/database records are affected;
- whether restore can overwrite current state;
- whether the flow is test-only or production-affecting;
- what evidence proves success.

## 5. Test playback

### Intended use

Use this pane to run, pause, and stop a controlled playback test.

### Layout

- Left side: controls.
- Right side: media player or preview.
- Subtle divider between the two halves.

### Controls

- **Run**.
- **Pause**.
- **Stop**.

### Safety check

Before implementation, verify whether these controls affect test playback only, native playback, or both. The pane must not silently interrupt production playback unless explicitly documented and confirmed.

## 6. Add images / process testing

### Intended use

Use this pane to imitate the download stage without using a real download.

### Entry point

The planned control is:

```text
+ Add images here
```

This control is the only official entry point into the test process.

### Expected flow

1. Press **Add images here**.
2. Select test images.
3. The system treats those images as downloaded media for test purposes.
4. Downstream stages can run from that test input.
5. The pane shows accepted/rejected files and stage status.

### Isolation check

Before running real processing, confirm the flow uses isolated test data/database. Do not mix this with production media/database state unless a later OpenSpec explicitly approves it.

## 7. Crontab Setup

### Intended use

Use this pane to inspect and safely manage PhotoFrame-owned crontab entries.

This is safety-sensitive because crontab is the real scheduler path for workers.

### Read current crontab

Use the read/check control to display current crontab content and app-owned entries.

Expected result:

- current crontab content or safe summary;
- app-owned block detected or missing;
- status: active, paused, malformed, missing, blocked, or unknown.

This action must be read-only.

### Pause/resume app-owned entries

Use pause/resume to comment out or re-enable PhotoFrame-owned crontab entries.

Rules:

- only app-owned entries may change;
- unrelated crontab lines must be preserved;
- status after operation must be visible.

### Install crontab

Use install to configure worker intervals.

Expected installer table rows:

- Regular worker.
- Playback worker.
- On/off worker.

Expected interval choices:

- Every 1 second.
- Every 10 seconds.
- Every 1 minute.
- Custom/manual, if implemented.

After saving choices, the settings are pending only. The UI must show a yellow warning:

```text
Setting is not applied yet. Press Install into crontab.
```

Only the final **Install into crontab** action applies the real change.

### High-frequency confirmation

If any interval is less than 10 seconds, final install requires double confirmation.

Reason: aggressive intervals can create runaway calls, duplicate work, high load, and hard-to-stop side effects.

### Emergency recovery if workers run too often

1. Open Debug.
2. Open Crontab Setup.
3. Pause app-owned crontab entries.
4. Confirm status shows paused.
5. Inspect worker panes for running/failing worker state.
6. Reinstall safer intervals only after understanding the failure.

## 8. Worker debug panes

The page should show three separate panes below Crontab Setup:

- **Regular Worker Debug Pane**.
- **Playback Worker Debug Pane**.
- **On/off Worker Debug Pane**.

### Required telemetry

Each pane must show:

- first called timestamp;
- last called timestamp;
- called count.

Timestamp display should use Estonian date/time formatting.

### Recommended telemetry

Each pane should also show:

- current status;
- current interval;
- schedule source;
- next expected run;
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

### Manual run button

Each pane should include:

```text
Run now
```

Manual run should invoke that worker once, show status/evidence, and avoid unsafe concurrent duplicate runs.

## 9. Existing status-panel reference

The existing screenshot showed a panel titled:

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

The Debug page may reuse this status vocabulary, but the OpenSpec defines the future contract.

## 10. Proof-honesty checklist

Before calling any Debug page behavior proven, check:

- Does a code path exist?
- Does a test cover it?
- Does a generated proof artifact exist where required?
- For real crontab behavior, does target Raspberry evidence exist?
- Are test data and production data separated?
- Are warnings and confirmation gates present?
- Are unrelated crontab entries preserved?

If any answer is no, the status remains planned, TODO, blocked, or not claimed.
