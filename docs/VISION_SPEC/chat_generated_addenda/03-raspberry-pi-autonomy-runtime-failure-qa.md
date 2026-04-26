# Summary Document — Raspberry Pi Autonomy / Runtime Failure Questions and Answers

Created: 2026-04-26 20:39 EEST
Status: follow-up specification notes from the Voice AI Q&A discussion.
Purpose: capture new decisions about autonomous Raspberry Pi operation, failure handling, storage, offline behavior, playback continuity, updates, and notifications.

## 1. Main Operating Goal

The project’s main goal remains autonomous Raspberry Pi photo-frame operation after initial setup/start.

The system should be able to keep running without manual intervention as much as possible.

## 2. Stale Lock Handling

If a worker crashes, it may leave a lock file behind. That lock file can become stale and prevent the worker from restarting.

Stale locks should not require manual handling. If a lock remains for too long, it should be treated as suspicious/stale.

Suggested initial threshold: 15 minutes.

Expected behavior:

```text
1. Detect stale lock.
2. Log/report that the lock is stale.
3. Safely clear or invalidate the stale lock.
4. Allow cron to restart the affected worker.
5. Notify the dashboard through the notification/error pipeline.
```

Cron is expected to restart workers automatically when needed.

## 3. Low Disk Space Handling

When free disk space reaches a critical low threshold, such as 1 GB free space remaining, the system should stop writing new data to disk as much as possible.

Required behavior:

```text
1. Stop downloading new media.
2. Stop regular pipeline stages that write to disk.
3. Avoid writing unnecessary new files.
4. Continue playback mode using already-queued/existing media.
5. Show an on-screen warning/notification.
6. Optionally support email notification later.
```

The system should degrade into playback-only mode rather than crashing or stopping playback.

## 4. Power Loss / Unexpected Restart Recovery

Recovery should be automatic.

After power returns:

```text
1. Raspberry Pi boots.
2. Cron starts again.
3. Workers resume automatically.
4. The system checks locks/state.
5. Playback continues from available queue/state where possible.
6. Pipeline stages resume safely if conditions allow.
```

No manual confirmation should be required.

## 5. Playback Queue Behavior

Playback should loop indefinitely.

Expected behavior:

```text
1. Playback goes through the current playback queue.
2. If new media is added, it can enter the queue according to normal rules.
3. If no new media is added, playback starts again from the beginning.
4. Playback continues indefinitely as long as playable media exists.
```

## 6. Hardware Failure Handling

Hardware-level failures should not be silently ignored.

Expected behavior:

```text
1. Detect the failure if possible.
2. Log the failure.
3. Notify the dashboard as soon as possible.
4. Use the notification/error pipeline.
5. Continue safe operation where possible.
```

The exact behavior depends on the failed component.

## 7. Software Updates

No fully automatic updates.

The owner/user may run a manual command that downloads or updates the repo from GitHub and unpacks/applies it. This is the maximum acceptable level of “automatic” update.

Expected behavior:

```text
No background auto-update.
No surprise updates.
No automatic upgrade prompts required.
Manual owner-triggered update command is acceptable.
```

## 8. Offline / Internet Loss Behavior

If internet is unavailable, regular online-dependent stages should pause, but playback should continue.

Expected behavior:

```text
1. Detect no internet connection.
2. Pause regular stages that require network access.
3. Do not treat this as provider failure if the whole internet is unavailable.
4. Continue playback from local media/queue.
5. Notify/log that the device is offline.
6. Resume normal stages automatically when internet returns.
```

## 9. Network-Agnostic Behavior

The system should be network-agnostic.

If internet works, continue normal operation. If internet does not work, pause online-dependent regular stages, continue playback, and notify/log offline state.

## 10. Multiple Users / Roles

No multi-user roles or permissions are needed for now.

## 11. Long-Term No-New-Media Notification

If no new media has been added for about one month, the system should show a lighthearted notification.

Example:

```text
One month, no new photos — still enjoying the classics!
```

This should be a non-critical notification through the notification pipeline. Playback continues normally.

## 12. Updated Carry-Forward Rules

```text
1. Stale worker locks should be automatically detected and handled.
2. A lock older than around 15 minutes is suspicious and may be treated as stale.
3. Cron should automatically restart workers after crashes/reboots.
4. Low disk space threshold should trigger playback-only protection mode.
5. At around 1 GB free disk, stop downloads and disk-writing pipeline work.
6. Playback must continue where possible during low disk, offline, or paused-pipeline states.
7. Power-loss recovery must be automatic.
8. Playback queue loops indefinitely if no new media is added.
9. Hardware failures should notify immediately where possible.
10. Updates are manual or owner-command-triggered only.
11. Offline mode pauses online stages but continues local playback.
12. Device behavior should be network-agnostic.
13. Multi-user roles are out of scope.
14. After one month without new media, show a friendly non-critical notification.
```

## Open Items for Later

```text
1. Exact stale-lock timeout value: 15 minutes was suggested, but can be made configurable.
2. Exact disk-space threshold: 1 GB was suggested, but should likely be configurable in .env.
3. Exact notification channels: dashboard is required; email may be added later.
4. Exact connectivity check method: ping/check multiple sites or use HTTP requests.
5. Exact behavior per hardware failure type still needs a detailed failure matrix.
```
