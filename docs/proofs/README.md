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
| GPS fallback parsing | `npm run proof:gps-fallback` | deterministic local |
| Deterministic media pipeline | `npm run proof:deterministic-media-pipeline` | deterministic local |
| Address display | `npm run proof:address-display` | deterministic local |
| Native / fullscreen playback | `npm run proof:native-fullscreen-playback` | deterministic local |
| Real download continuation | `npm run proof:real-download-continuation` | opt-in real provider |
| Raspberry power-loss recovery | `npm run proof:raspberry-recovery` | hardware/operator proof |

- `dirty_shutdown_testing_proof.md` — deterministic proof for the Test Mode-only View C dirty-shutdown testing panel and backend guard scaffold.
