# Raspberry app-running target pack proof

Command:

```bash
npm run proof:raspberry-app-running-target-pack
```

This proof runs the main app-running target chain in order:

1. executable permission repair
2. Raspberry `.env` preflight/create
3. three-worker startup smoke with `--prepare`
4. managed cron preflight install
5. app-running PASS harness
6. v1 readiness summary

It passes only on a non-override Raspberry target when the required setup/startup/cron/app-running steps report `PASSED`. It does not prove real iCloud/GPS/geocode, address overlay, or regular worker product work.
