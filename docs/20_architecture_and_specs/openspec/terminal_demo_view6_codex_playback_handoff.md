# Terminal Demo View 6 Codex Playback Handoff

## Current Boundary

View 6 fixture buttons open a placeholder modal with this exact message:

```text
this will be done by Codex
```

The action result is `CODEX_DEFERRED` and logged evidence records `launchesPlayback=false`.

## Fixture Inputs

- `terminal/demo/test_data/playback_fixtures/gps_valid_01.jpg`
- `terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4`

## Buttons Waiting For Codex Playback Wiring

- Play fixture image in HTML browser
- Play fixture video in HTML browser
- Play fixture image full screen without overlay
- Play fixture video full screen without overlay
- Show fixture image with address overlay
- Show fixture video with address overlay

Codex owns browser/fullscreen/address-overlay execution in the later real-playback slice, not in this placeholder merge.

Only after fixture playback works, switch future queue-backed buttons from disabled planning controls to queue-backed controls.

## Do Not Do

Do not add cron, auth, DB writes, worker calls, or queue execution as part of the placeholder handoff. Do not claim real playback until a later proof launches and verifies it.

## Proof Handoff

Run:

```bash
npm run proof:terminal-demo-view6-codex-placeholder-complete
npm run proof:terminal-demo-view6-codex-playback-handoff
```
