# Raspberry app-running target pack proof

Command:

```bash
npm run proof:raspberry-app-running-target-pack
```

This proof runs the main app-running/v1-readiness target chain in order:

1. executable permission repair
2. Raspberry `.env` preflight/create
3. Raspberry tool checker
4. Raspberry generated fixture validation
5. three-worker startup smoke with `--prepare`
6. managed cron preflight install
7. app-running PASS harness
8. worker evidence generation
9. cron worker runtime proof
10. app-running status proof
11. app-running chain proof
12. native Raspberry image playback proof
13. native Raspberry video playback proof
14. v1 readiness summary

It passes only on a non-override Raspberry target when the required target/setup/startup/cron/app-running/native-playback steps report `PASSED`. It does not prove real iCloud/GPS/geocode, address overlay, regular worker product work, dashboard status, reboot recovery, or physical power-loss recovery.

## Uploadable ZIP bundle

As of v0.8.65, the command also creates a ZIP bundle and prints `bundleZipPath`. The ZIP includes proof artifacts and runtime evidence useful for analysis. The bundle itself is packaging only; the individual proof artifacts remain the source of proof truth.

As of v0.8.66, the target pack also includes the currently available v1-readiness proof artifacts so `proof:raspberry-v1-readiness` has the target/tool/native/app-running evidence it expects before future product/provider gates are implemented.

As of v0.8.68, the app-running PASS harness intentionally runs before worker-evidence-dependent checks. This prevents the target pack from blocking on incomplete startup-smoke evidence when the later harness would generate complete duplicate-skip and stale-lock evidence.
