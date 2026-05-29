# Native Playback Runner Spec

Status: implemented in slices after v0.7.22 baseline.

## Goal

Add an OS-native playback method that can be called by backend routes and the playback worker so Windows and Raspberry deployments can launch fullscreen playback outside the browser fullscreen permission model.

## Architecture boundary

The dashboard browser remains an observer and manual control surface. Native process ownership stays backend-side:

```text
playback_worker
  -> native playback controller
    -> native playback adapter
      -> OS player process such as mpv or VLC
```

The playback worker still owns selection only. Native playback is an optional follow-up action that starts the already selected backend item when native playback is explicitly enabled.

## Default safety

Native playback must be disabled by default. Test Mode and normal browser playback must continue working with no native player installed.

Required default:

```text
NATIVE_PLAYBACK_ENABLED=false
```

## Supported first players

| Platform | Preferred player | Reason |
|---|---|---|
| Windows | `mpv` | CLI-friendly fullscreen playback, images/videos, process control. |
| Raspberry OS | `mpv` | Same command model as Windows and works well for fullscreen media. |
| Test harness | `mock` | Avoids launching real processes in automated tests. |

## Native playback environment keys

| Key | Default | Meaning |
|---|---|---|
| `NATIVE_PLAYBACK_ENABLED` | `false` | Master gate for process launch. |
| `NATIVE_PLAYBACK_PLATFORM` | `auto` | `auto`, `windows`, or `raspberry`. |
| `NATIVE_PLAYBACK_PLAYER` | `mpv` | `mpv`, `vlc`, or `mock`. |
| `NATIVE_PLAYBACK_PLAYER_PATH` | empty | Optional executable override. |
| `NATIVE_PLAYBACK_FULLSCREEN` | `true` | Start native player fullscreen. |
| `NATIVE_PLAYBACK_REPLACE_EXISTING` | `true` | Stop the owned old process before launching a new item. |
| `NATIVE_PLAYBACK_IMAGE_DURATION_SECONDS` | `12` | Suggested still-image duration for players that support it. |
| `NATIVE_PLAYBACK_AUTO_START_ON_WORKER` | `false` | Allows playback_worker to launch native playback after selection. |

## Process ownership rules

- Track only the process started by this backend instance.
- Store the owned PID in native playback status.
- Do not kill arbitrary `mpv` or `vlc` processes by name.
- Use spawn argument arrays rather than shell-concatenated commands.
- Sanitize command summaries and logs.

## Backend route contract

| Route | Purpose |
|---|---|
| `GET /api/native-playback/status` | Return enabled/config/status/log data. |
| `POST /api/native-playback/detect` | Check configured player availability without launching media. |
| `POST /api/native-playback/start-current` | Start fullscreen playback for current/next backend playback item. |
| `POST /api/native-playback/stop` | Stop the owned native playback process. |

## Worker integration contract

The playback worker may call native playback only when all are true:

1. Playback selection completed successfully.
2. `NATIVE_PLAYBACK_ENABLED=true`.
3. `NATIVE_PLAYBACK_AUTO_START_ON_WORKER=true`.
4. A current playable media item can be resolved to a safe backend media path.

If native playback fails, the worker should report the native result but should not corrupt queue selection state.

## Power outage restore integration

Native playback complements playback resume checkpoints. After reboot, the backend can restore the selected item and launch the native player fullscreen from the worker or manual native controls, while browser fullscreen remains user-triggered.

## Risks

| Risk | Mitigation |
|---|---|
| Native player missing | Detection route and setup docs. |
| Backend has no desktop session | Runbook documents desktop/session requirement. |
| Command injection | Spawn with argument arrays only. |
| Killing unrelated process | Kill only tracked PID/process object. |
| Test Mode starts real player | Disabled by default and mock player for tests. |
| Fullscreen opens on wrong display | Keep first slice simple; add display config later. |
