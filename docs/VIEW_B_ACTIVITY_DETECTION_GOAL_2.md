# View B / B5 activity detection test — Goal 2

## Status

Goal 2 is implemented as a View B / B5 testing surface. It is not wired into fullscreen playback yet.

## Scope

The B5 card now separates legacy screen simulation controls from a dedicated activity detection test. The test lets the operator select PIR sensor, mouse movement, and keyboard activity as inputs for the next run.

## Test flow

1. Select the activity sources to include in the next B5 test.
2. Press **Start Test**.
3. Watch the visible `3 → 2 → 1` countdown.
4. During the bounded detection window, move the mouse or press a key to test browser-observed activity.
5. Read the per-source result: `detected`, `not detected`, `skipped`, or `unavailable`.

## PIR boundary

PIR is intentionally honest. This repo version does not add a new real PIR backend or GPIO source, so PIR remains `backend_dependent` / `unavailable` unless a verified source is added in a later slice. The UI must not fake real PIR detection.

## Fullscreen playback boundary

Goal 3 will reuse the proven View B detection logic inside fullscreen playback for wake/keep-on behavior. That reuse is intentionally deferred until Goal 2 is tested on the PC/Raspberry flow.

## Regression expectations

- Existing B2 Test Mode and Real Mode separation remains unchanged.
- Existing B5 backend-owned screen simulation toggles remain unchanged.
- Existing playback selection, OS playback views, fullscreen overlay, scheduler, database, and auth behavior remain unchanged.
- The new activity detection state is frontend test state unless a later verified PIR backend source is introduced.
