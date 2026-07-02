# Terminal Demo View 6 Codex Playback Handoff

## Status

This handoff is complete in v2.0.18.

The earlier placeholder boundary used:

```text
this will be done by Codex
CODEX_DEFERRED
launchesPlayback=false
```

That historical placeholder has been superseded by real fixture playback artifact generation.

## Implemented fixture inputs

- `terminal/demo/test_data/playback_fixtures/gps_valid_01.jpg`
- `terminal/demo/test_data/playback_fixtures/gps_valid_video_02_tartu.mp4`

## Implemented buttons

- Play fixture image in HTML browser
- Play fixture video in HTML browser
- Play fixture image full screen without overlay
- Play fixture video full screen without overlay
- Show fixture image with address overlay
- Show fixture video with address overlay

The buttons now generate browser-renderable HTML viewer artifacts and shared terminal action-log evidence using `action=view6_fixture_playback_real`.

Only after fixture playback remains stable should future queue-backed buttons switch from disabled planning controls to queue-backed controls.

## Do Not Do

Do not add cron, auth, DB writes, worker calls, or queue execution as part of the fixture playback implementation. Do not claim browser visual proof or real fullscreen proof from static artifact generation.

## Proof

Run:

```bash
npm run proof:terminal-demo-view6-real-fixture-playback
```
