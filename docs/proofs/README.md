# Proof artifacts

This folder documents proof workflows for behavior that cannot be honestly proven by source code alone.

| Layer | Location | Tracked in Git | Purpose |
|---|---|---:|---|
| Human proof docs | `docs/proofs/` | Yes | Explain how to run and interpret a proof. |
| Runtime proof JSON | `runtime_data/proofs/` | No | Timestamped sanitized evidence generated on the machine that ran the proof. |

| Status | Meaning |
|---|---|
| `PASSED` | The exact behavior was observed and sanitized evidence was written. |
| `FAILED` | The proof was attempted and observed a failure. |
| `BLOCKED` | The proof could not run because a dependency, session, config, or hardware was missing. |
| `PARTIAL` | Some proof steps succeeded, but the full proof chain was not completed. |
| `TIMED_OUT` | The proof command exceeded its configured timeout. |

Proof artifacts must not include Apple IDs, passwords, 2FA codes, cookies, API keys, provider tokens, raw provider output, or private filesystem paths.

## Available proof runners

| Proof | Command | Runtime mode |
|---|---|---|
| Full test suite stability | `npm run proof:full-test` | local test |
| Real iCloudPD pipeline | `npm run proof:real-icloudpd` | opt-in real provider |
| Real geocode provider | `npm run proof:geocode-provider` | opt-in real provider |
| Real geocode provider chain | `npm run proof:real-geocode-provider-chain` | opt-in real network provider |
| GPS fallback parsing | `npm run proof:gps-fallback` | deterministic local |
| Deterministic media pipeline | `npm run proof:deterministic-media-pipeline` | deterministic local |
| Address display | `npm run proof:address-display` | deterministic local |
| Address display UI | `npm run proof:address-display-ui` | deterministic local UI render |
| Native / fullscreen playback | `npm run proof:native-fullscreen-playback` | deterministic local |
| Windows CronEmulator | `npm run proof:windows-cronemulator` | windows emulator |
| Real download continuation | `npm run proof:real-download-continuation` | opt-in real provider |
| Raspberry power-loss recovery | `npm run proof:raspberry-recovery` | hardware/operator proof |
| Windows native proof milestone | `docs/proofs/windows_native_proof_milestone_v0.8.26.md` | target-machine evidence summary |

- `dirty_shutdown_testing_proof.md` — deterministic proof for the Test Mode-only View C dirty-shutdown testing panel and backend guard scaffold.
- `windows_cronemulator_proof.md` — deterministic proof for Windows CronEmulator parsing, scheduling, executor boundaries, and Python tests.

## Real geocode provider-chain proof

`npm run proof:real-geocode-provider-chain` is blocked by default. To run it, set `PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true` and choose a real provider with `PF_GEOCODE_CHAIN_PROOF_PROVIDER`, for example `nominatim_osm`. The proof uses the existing Python reverse-geocode provider interfaces, disables deterministic placeholder fallback for the subprocess, checks cache miss -> network provider -> cache hit behavior, and verifies that the returned address is human-readable and contains expected terms.

Example PowerShell setup for the no-key Nominatim path:

```powershell
$env:PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN = "true"
$env:PF_GEOCODE_CHAIN_PROOF_PROVIDER = "nominatim_osm"
$env:PF_GEOCODE_CHAIN_EXPECTED_TERMS = "Tallinn;Estonia"
$env:GEOCODE_NOMINATIM_OSM_USER_AGENT = "PF_login-proof/0.7.43"
npm run proof:real-geocode-provider-chain
```

Use provider-specific API-key or token environment variables for providers that require accounts. The generated artifact must not include API keys, access tokens, raw headers, or raw provider output.

## Address display UI proof

`npm run proof:address-display-ui` renders the dashboard/display-facing Windows playback view and fullscreen overlay from deterministic local state. It asserts semantic UI fragments only, including the selected media name, resolved address label, expected address text, safe backend media URL, pending-address fallback copy, and absence of raw filesystem path exposure.

The generated JSON artifact intentionally stores assertion results and markup length metrics, not full HTML snapshots. This keeps the proof stable across harmless layout/CSS changes while still proving the address evidence reaches the display-facing UI contract.

## Windows native proof milestone

`docs/proofs/windows_native_proof_milestone_v0.8.26.md` is the consolidated proof-status snapshot for the v0.8.26 Windows target-machine checkpoint. It records the PASSED Windows native image/video/recovery/scheduler-loop evidence and keeps non-claims explicit for Windows Task Scheduler, full Windows reboot, Raspberry cron/reboot/power-loss recovery, monitor-pixel proof, production iCloud continuation, and vendored media tooling.
