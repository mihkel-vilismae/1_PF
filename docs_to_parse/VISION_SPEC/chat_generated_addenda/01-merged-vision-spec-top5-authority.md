# Merged Vision/Specification — Top 5 Authority Sources

Created: 2026-04-26 20:31 EEST.
Status: consolidated working authority draft.
Scope: merges the newest Q&A decisions with the April 2026 merged spec, documentation authority map, current implementation spec, and final reconciliation report.

Bundle index: `../VISION_SPEC_readme.md`.

## 1. Authority Stack

This document uses the following authority order:

1. New Q&A decisions from the post-Slice-3 discussion.
2. `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md`.
3. `docs/VISION_SPEC/12-documentation-authority-map.md`.
4. `docs/VISION_SPEC/07-current-implementation-spec.md`.
5. `docs/VISION_SPEC/reconciliation/13-final-vision-spec-reconciliation-report.md`.

When there is a conflict, newer explicit user decisions override older docs. Older docs are not discarded unless explicitly marked deprecated or superseded.

## 2. Primary Product Identity

The project is primarily an autonomous Raspberry Pi photo-frame runtime system.

The dashboard, Windows support, Fedora support, cron emulator, and development tools are supporting infrastructure. They exist to help build, test, inspect, debug, and operate the Raspberry Pi target. The Raspberry Pi remains the final production target.

## 3. Core Product Goal

The final system should run as independently as possible on Raspberry Pi:

- download or receive media;
- index files;
- extract GPS coordinates;
- convert GPS coordinates to readable addresses;
- queue eligible media for slideshow playback;
- select and display current media;
- manage screen/activity behavior;
- recover after reboot, outage, crash, or temporary network failure;
- expose runtime state and problems clearly through the dashboard.

## 4. Platform Roles

### Raspberry Pi

Raspberry Pi is the production environment and final target.

It should use real cron, real runtime folders, real database paths, and real worker processes.

### Linux / Fedora

Fedora and other Linux systems are useful development and scheduler-verification environments. They should generally follow the same cron model as Raspberry Pi where practical.

### Windows

Windows is a development and convenience platform. Windows should use the user-created cron emulator instead of real cron.

Windows-specific behavior must not redefine the production architecture. It is allowed where needed for development convenience, testing, or visual differences.

## 5. Real vs Test Environment Separation

Real and test environments must be strictly isolated.

The `.env` file must define separate paths for:

- real database;
- real download folder;
- test database;
- test download folder;
- other real/test stage paths as needed.

These paths must not overlap. Verification should fail if a real path and test path are the same or unsafe.

View B / test actions must never damage, overwrite, delete, or corrupt real runtime data. Even if the real process is running, test view actions must remain isolated from real database and real files.

## 6. Dashboard View Roles

### View A — Init / Setup / Verification

View A is responsible for initialization, setup checks, auth preflight, scheduler controls, and environment verification.

Authentication belongs in View A, not View B.

### View B — Test / Controlled Pipeline Runner

View B is the isolated test environment. It should run real-equivalent pipeline logic against test folders and a test database.

Allowed simulation boundaries:

- mock download source behavior;
- Windows playback presentation differences;
- Windows screen-off representation differences.

Post-download test stages should not be fake if real-equivalent test execution is possible.

### View C — Last Run Info / Recovery

View C should become the recovery and previous-runtime-state view. It should help answer what happened before a reboot, crash, outage, or worker restart.

### View D — Running Process / Live Runtime

View D should become the live runtime monitor for active workers, current media, recent worker status, and runtime health.

## 7. Mock Download vs Real iCloud Download

Mock download and real iCloud download are entirely separate.

Mock download is test-only. It copies files into the test/mock download folder and should not require iCloud login.

After mock download succeeds, later test-stage actions must not unexpectedly push the user into a login/authentication flow.

Real iCloud download is provider-backed production behavior and belongs to the real runtime/download provider path.

## 8. Authentication and 2FA

Authentication must be backend-owned and provider-evidenced.

The system must not fake successful authentication. It should use valid existing session/cookie data where possible and only ask the user to re-login when actually required.

Expected high-level auth states:

- logged out;
- logging in;
- pending 2FA;
- authenticated;
- provider failed;
- needs re-login.

Raw secrets must not be returned to the frontend or logged.

The “test login by downloading one file” button/feature remains open for later review. Its final placement and behavior are not fully decided.

## 9. Pipeline Stages

The canonical staged media pipeline is:

1. download;
2. index;
3. parse GPS;
4. geocode;
5. queue slideshow;
6. playback select-current.

Each stage should be idempotent where practical, log useful results, and avoid deleting history. Progression should use statuses rather than destructive record removal.

## 10. GPS Extraction Strategy

GPS extraction should support multiple local methods, not only one EXIF reader.

Possible methods include:

- EXIF GPS extraction;
- alternate metadata extraction;
- sidecar metadata files;
- filename/path pattern parsing;
- manual/imported/fallback metadata where appropriate.

The architecture should treat these as ordered extraction strategies. Batch size and retry behavior should be configurable through `.env` where applicable.

## 11. Geocoding Strategy

Geocoding converts GPS coordinates into readable addresses.

The system should support multiple providers in fallback order. The first implementation preference is several free providers, preferably ones that do not require accounts. Credential-based providers can be added later.

Provider execution model:

1. Process a configured batch of files/coordinates.
2. Try provider 1.
3. If provider 1 fails, try provider 2.
4. If provider 2 fails, try provider 3.
5. Continue through the configured provider list.
6. Each provider gets configured retries, for example three retries.
7. If all providers fail after retries, mark the item unresolved/failed.

Batch size, provider order, and retry count should be configurable through `.env`.

## 12. Workers

The target worker model has three workers:

- regular stage worker;
- playback worker;
- screen on/off worker.

The regular stage worker drives the normal pipeline. The playback worker keeps media playback moving. The screen on/off worker handles activity/inactivity and display behavior.

Only one instance of each worker should run at a time.

## 13. Lock Files, Logs, and Runtime Truth

Lock files are the source of truth for active worker instances.

Logs are evidence, history, and debugging material. Logs should not be the primary truth for whether a worker is active right now.

Worker lock files should live under the runtime data folder, preferably a dedicated lock folder such as:

- `runtime/data/locks/regular_worker.lock`;
- `runtime/data/locks/playback_worker.lock`;
- `runtime/data/locks/screen_worker.lock`.

The long-term role of `conf/runtime-truth.json` remains unresolved. It may remain a dashboard bridge or become temporary/development-only, but that decision still needs user confirmation.

## 14. Scheduler and Cron

Raspberry Pi and Linux should use real cron.

Windows should use the cron emulator.

Default worker schedules should be written to `.env` and `.env.example`, and should be configurable later:

- regular stage worker: every 10 minutes;
- playback worker: every 1 minute;
- screen on/off worker: every 3 minutes.

These are defaults, not permanent hard-coded values.

## 15. Notification, Logging, and Error Pipeline

Important runtime events should flow to the dashboard through a structured message pipeline.

This includes:

- errors;
- warnings;
- status messages;
- backend failure/crash information where possible;
- session-expiry warnings;
- re-login-needed messages.

There should be layered handling:

- normal notification/status pipeline;
- logging pipeline;
- error pipeline as the last-resort failure path.

The error pipeline is the final fallback for serious problems.

## 16. Current Implementation Reality

The current repository already has important pieces implemented or partially implemented:

- backend API route groups for init, auth, runtime stages, playback, and runtime truth;
- SQLite schema baseline;
- runtime stage endpoints;
- dashboard cards and inspect metadata;
- test coverage for selected non-auth functionality;
- version/changelog guard.

Major partial or unresolved areas remain:

- real iCloud download is not the normal tested route in the current stage endpoint;
- geocoding currently uses placeholder/deterministic behavior rather than final providers;
- View C is not yet a full recovery view;
- View D is not yet a full live worker monitor;
- exact worker scripts, lock-file enforcement, and scheduler install/check behavior need implementation details;
- auth/2FA provider behavior still requires careful real-world validation;
- runtime truth JSON needs a final architectural decision.

## 17. Documentation Authority and Cleanup

The reconciled `docs/vision_and_implementation/` set is active authority for current vision/spec work.

The April 2026 merged spec remains important and should not be thrown away. It should be treated as an authority/foundation with newer overrides from later explicit user decisions.

Old/deprecated/superseded documentation should eventually be moved to a folder such as:

- `docs/to_be_deleted/`

Each moved file should receive a clear header explaining that it is marked for deletion or deprecated, with a reason.

Files should not be permanently deleted immediately.

## 18. Open Decisions

The following remain open or need confirmation:

1. Should `conf/runtime-truth.json` remain long-term or become temporary/development-only?
2. What is the final placement and behavior of the test-login/download-one-file feature?
3. Which exact free/no-account geocoding providers should be used first, after terms and limits are checked?
4. What exact GPS extraction methods should be implemented first?
5. What should be the next immediate priority: autonomy reliability, dashboard observability, or pipeline configurability?
6. Which old docs should be harvested first before being moved to `docs/to_be_deleted/`?

## 19. Carry-Forward Rules

- Preserve existing functionality unless explicitly changing it.
- Separate real and test paths strictly.
- Never let mock/test flows trigger real login unexpectedly.
- Keep Raspberry Pi autonomous operation as the main goal.
- Keep Windows support as development convenience, not production identity.
- Use `.env` for tunable schedules, batch sizes, retries, providers, and paths.
- Prefer explicit status transitions over deleting records.
- Keep old docs until their useful content is harvested or superseded.
