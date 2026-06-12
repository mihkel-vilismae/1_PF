# Raspberry app-running status proof

Version introduced: v0.8.46  
Status: Implemented status/proof runner / target evidence required

Run:

```bash
npm run proof:raspberry-app-running-status
```

This proof turns the Raspberry cron worker runtime evidence into an operator-facing app-running summary. It can report `PASSED` only when the cron worker runtime proof passes for all three lanes: `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker`.

It does not start the API by itself, install cron, reboot the Raspberry, perform power-loss recovery, or prove production iCloud continuation.
