# Raspberry managed cron preflight

Version introduced: v0.8.54  
Status: Implemented check/install helper

Check current crontab:

```bash
npm run proof:raspberry-cron-preflight
```

Install or replace the PF_login managed worker block:

```bash
npm run proof:raspberry-cron-preflight -- --install
```

The managed block adds the three expected worker lanes for the current repo path:

- `regular_stage_worker` every 10 minutes;
- `playback_worker` every 1 minute;
- `screen_on_off_worker` every 3 minutes.

The helper preserves crontab content outside the PF_login managed block. It does not run workers, reboot the Raspberry, or prove power-loss recovery.

## v0.8.58 cron row matching repair

The cron preflight now preserves raw `crontab -l` output internally while evaluating managed worker rows, then sanitizes evidence before writing proof artifacts. This prevents path redaction from removing `--scheduler ...` fragments before row matching.
