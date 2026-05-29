# Native Playback Runner Setup Runbook

Status: implemented as a disabled-by-default optional playback path after v0.7.22.

## Purpose

Use this runbook when Windows or Raspberry OS playback should launch a real OS-native fullscreen player from the backend/playback worker instead of relying only on browser fullscreen.

## Safe default

Native playback is off unless explicitly enabled:

```text
NATIVE_PLAYBACK_ENABLED=false
```

Leave it disabled while verifying the normal browser playback views, Test Mode, worker stages, or documentation-only changes.

## Recommended player

Install `mpv` first on both Windows and Raspberry OS. The backend also supports a `mock` player for automated tests.

| Platform | Recommended command check |
|---|---|
| Windows | `mpv --version` in PowerShell or Command Prompt |
| Raspberry OS | `mpv --version` in the terminal |

## Windows repo-local mpv install

Windows operators can install a portable mpv build into the repository without changing the machine-wide `PATH`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/install-mpv-windows.ps1
```

The script downloads the latest normal x86_64-v3 Windows build from the shinchiro mpv Windows release feed, extracts it with Windows `tar.exe`, verifies `mpv.exe --version`, and stores the executable under:

```text
tools/mpv/windows/mpv.exe
```

`tools/mpv/windows/` is ignored by git. When `NATIVE_PLAYBACK_PLAYER_PATH` is empty, the backend automatically prefers this repo-local Windows executable before falling back to `mpv` on `PATH`.

## Environment keys

```text
NATIVE_PLAYBACK_ENABLED=false
NATIVE_PLAYBACK_PLATFORM=auto
NATIVE_PLAYBACK_PLAYER=mpv
NATIVE_PLAYBACK_PLAYER_PATH=
NATIVE_PLAYBACK_FULLSCREEN=true
NATIVE_PLAYBACK_REPLACE_EXISTING=true
NATIVE_PLAYBACK_IMAGE_DURATION_SECONDS=12
NATIVE_PLAYBACK_AUTO_START_ON_WORKER=false
```

For a manual real test, change only these first:

```text
NATIVE_PLAYBACK_ENABLED=true
NATIVE_PLAYBACK_PLAYER=mpv
NATIVE_PLAYBACK_AUTO_START_ON_WORKER=false
```

Only enable worker auto-start after manual start/stop is proven:

```text
NATIVE_PLAYBACK_AUTO_START_ON_WORKER=true
```

## Dashboard verification

1. Start the backend and frontend with the normal Windows launcher.
2. Open the Windows Playback View or Raspberry OS Playback View.
3. Confirm the **Native fullscreen playback** card is visible.
4. Click **Detect player**.
5. Confirm the native log terminal reports player availability or a clear missing-player message.
6. Click **Start native fullscreen** only after the queue/current playback item is valid and native playback is enabled.
7. Click **Stop native playback** to stop the owned process.

## Worker verification

The playback worker may start native playback only when both are true:

```text
NATIVE_PLAYBACK_ENABLED=true
NATIVE_PLAYBACK_AUTO_START_ON_WORKER=true
```

Expected behavior:

- The worker still selects the current playback item first.
- Native playback is a follow-up action.
- If native player launch fails, selection state remains intact.
- The worker status JSON includes native playback result evidence.

## Power outage behavior

When combined with playback resume checkpoints, the native runner can relaunch the restored item fullscreen from the backend process. Browser fullscreen still requires user interaction, but OS-native fullscreen can start from the player process when the backend has access to the active desktop/session.

## Known limitations

| Limitation | Notes |
|---|---|
| Desktop/session access required | A Windows service or headless SSH session may not be able to open a visible fullscreen player. |
| Display selection not implemented yet | First implementation uses the default display. |
| mpv/VLC installation | Windows mpv can be installed repo-locally with `tools/install-mpv-windows.ps1`; Raspberry/VLC setup remains external. |
| Kill-by-name is intentionally avoided | The backend stops only the process it started. |
| Test Mode protected | The default is disabled; tests use `NATIVE_PLAYBACK_PLAYER=mock`. |
