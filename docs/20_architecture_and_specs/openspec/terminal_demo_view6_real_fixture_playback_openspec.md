# Terminal Demo View 6 Real Fixture Playback OpenSpec

## Scope

View `6` now implements the fixture-first playback handoff. The six fixture buttons no longer stop at `CODEX_DEFERRED`; they generate browser-renderable HTML playback artifacts under the real-demo runtime output folder.

This slice remains fixture-only. Queue-backed playback controls stay visible and disabled until fixture playback is stable.

## Implemented fixture buttons

- Play fixture image in HTML browser
- Play fixture video in HTML browser
- Play fixture image full screen without overlay
- Play fixture video full screen without overlay
- Show fixture image with address overlay
- Show fixture video with address overlay

Each button writes a viewer artifact under:

```text
DEMO_RUNTIME_OUTPUT_DIR/view6-fixture-playback/button-{key}-{mediaType}-{playbackMode}.html
```

## Evidence contract

Each fixture button writes one shared terminal action log event to:

```text
runtime_data/logs/demo/terminal-button-actions.jsonl
```

Required markers:

- `action=view6_fixture_playback_real`
- `branchFeature=view6_fixture_playback`
- `result=VIEW6_FIXTURE_PLAYBACK_READY` when the viewer artifact is written in proof/headless mode
- `viewerWritten=true`
- `queueBacked=false`
- `dbWrites=false`
- `workers=false`
- `auth=false`
- `noCron=true`

## Playback modes

| Mode | Implementation |
|---|---|
| `html_browser` | Writes a normal browser-renderable image/video HTML viewer. |
| `fullscreen_no_overlay` | Writes a fullscreen-capable viewer without address overlay. |
| `address_overlay` | Writes a browser-renderable viewer with a fixture address overlay. |

## Non-claims

This slice does not implement queue-backed playback, slideshow_queue execution, DB writes, cron, auth, worker execution, Raspberry hardware behavior, real fullscreen verification, or browser visual proof.

Proof mode writes and validates viewer artifacts; it does not open a browser.
