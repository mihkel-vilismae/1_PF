# Raspberry executable-permission proof

`npm run proof:raspberry-executable-permissions` checks the project-owned Raspberry launcher/proof entrypoints that must remain executable after a ZIP is extracted on Linux/Raspberry OS.

## Commands

Check only:

```bash
npm run proof:raspberry-executable-permissions
```

Repair known project-owned executable boundaries, then write proof evidence:

```bash
npm run proof:raspberry-executable-permissions -- --repair
```

## Scope

The proof checks a fixed allow-list of repo-local files such as `start_raspberry_full.sh`, `start_scripts/start_raspberry_full.sh`, and Raspberry proof runner entrypoints. This addresses a Raspberry evidence blocker where extracting the repo ZIP with Python `zipfile.extractall()` produced non-executable launcher files and native playback proof failed at the launcher dry-run boundary.

## PASS criteria

The proof can return `PASSED` when all expected files exist and are executable after the check/repair step.

## BLOCKED criteria

The proof returns `BLOCKED` when an expected executable-boundary file is missing or remains non-executable after repair.

## Non-claims

This proof does not prove native image/video playback, cron installation, app-running status, reboot recovery, physical power-loss recovery, display pixels, or production iCloud/geocode behavior.
