# V2 next four slices XACR batch — 2026-06-27

## Scope

Implemented the next four remaining slices after v0.10.75:

1. Slice 16 — real crontab write-test.
2. Slice 17 — `08 PLAYBACK` browser-local pseudo queue playback loop.
3. Slice 18 — `09 REAL PLAYBACK` rendering modes and observation stage.
4. Slice 19 — playback worker truth events for the real playback loop boundary.

## XACR conclusion

The remaining sliceplan is logical, but cron and playback proof must stay ahead of recovery/PIR polish. The implementation therefore focused on proving the scheduling boundary and the playback/render/truth bridge.

## Implemented

### Slice 16

Added a backend crontab write-test endpoint:

```text
POST /api/init/cron/emulator/crontab/write-test
```

The endpoint performs a temporary marker add/read/remove flow. On Linux with the Raspberry real target it uses the user crontab and restores the original crontab afterwards. For CronEmulator targets it uses the emulator crontab file and restores its original contents.

### Slice 17

Added a browser-local pseudo playback loop for `08 PLAYBACK`.

The loop can start, stop, advance, loop back to the first playable item, show images, play videos, skip non-media rows, and keep the queue local to the browser-only pseudo queue.

### Slice 18

Added a rendering stage for playback rendering controls. It supports observe/preview mode and fullscreen mode through the shared browser-native rendering target. The overlay remains visible in both modes.

### Slice 19

Playback worker now emits worker-truth events for start, skip, selected media, media finish, queue advance, error, and worker finish. The worker still preserves existing database behavior and does not invent success rows while a stage is incomplete.

## Remaining after this batch

- Screen on/off worker proof.
- PIR real/fake wake behavior.
- Recovery tied to restart.
- Final autonomous proof on a dependency-installed Raspberry/host.

## Validation

Static repository checks and packaging were performed. Full `npm test` and `npm run build` require project dependencies (`tsx`, `vite`) that are not installed in this container.
