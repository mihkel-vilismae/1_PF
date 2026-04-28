# Comparison — Current Q&A Decisions vs April 2026 Merged Specification

**Created:** 2026-04-26 20:26 EEST  
**Compared documents:**

1. **Current Q&A Summary Document** — the discussion summary created after the 3-slice vision/specification run.
2. **April 2026 Merged Specification** — `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md`.

## Purpose

This document compares the newest spoken Q&A decisions against the April 2026 merged specification. The goal is to identify what stayed consistent, what became clearer, what changed, and what still needs an update in the project documentation.

---

# Executive Summary

The April 2026 merged specification is still valuable and should not be discarded. It remains a strong authority for **View A**, **View B**, scheduler behavior, test/real environment separation, mock download behavior, stage execution, logging, playback testing, and screen activity testing.

The new Q&A discussion does **not** invalidate the April document. Instead, it mostly **extends and sharpens it**.

The biggest difference is scope:

- The April document focuses mainly on **dashboard behavior**, especially View A and View B.
- The new Q&A raises the project-level framing higher: the system is primarily an **autonomous Raspberry Pi photo-frame runtime**, with Windows and dashboard tooling serving development, test, and convenience purposes.

The new Q&A also adds stronger decisions around:

- Raspberry Pi as the final production target.
- Runtime lock file location and names.
- Mock download being fully separate from real iCloud.
- Strict real/test database and file separation.
- Multiple geocoding providers.
- Multiple GPS extraction methods.
- Configurable batch sizes, retries, and worker schedules through `.env`.
- Session reuse for iCloud authentication.
- A layered notification/logging/error pipeline.
- Old docs being moved to `docs/to_be_deleted/` with explicit deprecation headers.

---

# 1. Overall Product Identity

## April 2026 merged spec

The April document describes the intended behavior of the dashboard and related flows. Its focus is on:

- View A scheduler actions.
- View B test-stage actions.
- Test-vs-real environment separation.
- Stage execution rules.
- Playback testing.
- Screen activity/inactivity testing.

It is very implementation-useful, but it does not frame the whole project as strongly around the final Raspberry Pi autonomous runtime.

## Current Q&A decision

The project is primarily an:

```text
Autonomous Raspberry Pi photo-frame system.
```

Windows, Fedora, dashboard, and cross-platform pieces are supporting infrastructure. They are useful, but the Raspberry Pi autonomous photo-frame is the end goal.

## Difference

The April spec is **dashboard-flow authoritative**.  
The new Q&A is **product-direction authoritative**.

## Required documentation update

Future docs should explicitly state:

```text
Primary product goal: autonomous Raspberry Pi photo-frame runtime.
Supporting tooling: Windows/Fedora/dashboard development and verification tools.
```

---

# 2. View A / View B Scope

## April 2026 merged spec

The April document strongly defines:

- View A as Init/setup/verification.
- View B as Test/simulation/controlled validation.
- View B must not contain authentication.
- View B mock/test actions must not affect the real runtime.

## Current Q&A decision

The new Q&A confirms this direction, especially:

- Mock download belongs to test flow only.
- Mock download must not trigger real iCloud login.
- Test database/files and real database/files must never overlap.
- Test actions must not damage or affect the real process.

## Difference

This is mostly **confirmation**, not contradiction.

The new Q&A adds a sharper user-facing regression rule:

```text
After mock download copies files into the test folder, later test stages must not unexpectedly push the user into login.
```

## Required documentation update

The View B and mock download specs should include this explicit rule.

---

# 3. Real vs Test Environment Separation

## April 2026 merged spec

The April document already says real and test environments must be fully separated. It explicitly requires separate `.env` paths for:

- real database;
- test database;
- real download folder;
- test download folder;
- other stage-relevant test paths.

It also says verification should fail if real and test paths overlap.

## Current Q&A decision

The new Q&A strongly confirms this and adds the safety framing:

```text
Even if the real process is running, the user must not be able to damage or affect the real database from the test view.
```

## Difference

No contradiction. The new Q&A reinforces the April spec.

## Required documentation update

Add stronger wording to the current implementation and dashboard specs:

```text
The test view is safety-isolated. Test actions must never mutate real runtime database/files.
```

---

# 4. Mock Download

## April 2026 merged spec

The April document defines mock download as a View B test-stage action. Its purpose is to simulate/download test media into the test environment and allow pipeline stages to run against test data.

## Current Q&A decision

The Q&A clarifies:

- Mock download is entirely separate from real iCloud.
- It only copies files into the test/mock download folder.
- It must not use real iCloud authentication.
- It must not force login after files are copied.

## Difference

The April document already points in this direction, but the Q&A makes the boundary stricter and more explicit.

## Required documentation update

The mock download spec should say:

```text
Mock download is a file-copy test utility, not an iCloud provider operation.
```

---

# 5. Authentication and iCloud Session Handling

## April 2026 merged spec

The April document states:

- B1 authentication belongs in View A.
- View B should not have authentication.
- Authentication is related to real provider behavior and should not be mixed with test stages.

## Current Q&A decision

The new Q&A adds more detail:

- Use existing iCloud/session-cookie behavior as long as valid.
- Do not ask for re-login unless truly needed.
- Session expiry or re-login warnings should go through the notification/logging/error pipeline.
- The “test login by downloading one file” button remains unresolved/open.

## Difference

The April document defines placement and separation.  
The new Q&A defines session-handling behavior.

## Required documentation update

Auth docs should add:

```text
Reuse valid provider sessions. Prompt for re-login only when session verification fails, expires, or provider action requires it.
```

Also keep the “download one file to test login” behavior marked as:

```text
OPEN / NEEDS FURTHER REVIEW
```

---

# 6. Scheduler Platform Behavior

## April 2026 merged spec

The April document states scheduler behavior mostly around View A. It discusses:

- installing scheduler entries;
- checking scheduler entries;
- user-defined jobs;
- platform-specific scheduler behavior.

It already notes that Windows-specific behavior is acceptable where needed.

## Current Q&A decision

The new Q&A makes the platform split explicit:

```text
Windows = cron emulator.
Linux/Fedora/Raspberry Pi = real cron.
Raspberry Pi = final production target.
```

The user also wants to discuss the Windows cron emulator later.

## Difference

The April spec covers scheduler controls.  
The new Q&A finalizes the platform policy.

## Required documentation update

Scheduler docs should include a direct platform matrix:

| Platform | Scheduler mechanism | Purpose |
|---|---|---|
| Windows | User-created cron emulator | Development/testing convenience |
| Fedora/Linux | Real cron | Linux implementation target |
| Raspberry Pi | Real cron | Final production runtime |

---

# 7. Worker Schedules

## April 2026 merged spec

The April spec includes scheduler jobs and timing examples:

- regular stage worker every 10 minutes;
- playback worker every 1 minute;
- screen on/off worker every 3 minutes.

## Current Q&A decision

The Q&A confirms these values should be used as defaults, but they must be configurable through `.env` and `.env.example`.

## Difference

The April spec gives the job schedule values.  
The Q&A adds configuration policy.

## Required documentation update

Add:

```text
Worker schedules are defaults, not hardcoded constants. They belong in .env and .env.example and may be fine-tuned later.
```

---

# 8. Worker Lock Files

## April 2026 merged spec

The April document discusses one-stage-at-a-time rules, lock-file/stop behavior, and avoiding concurrent stage execution.

It does not clearly finalize exact lock file names and locations.

## Current Q&A decision

The new Q&A defines the intended lock location and names:

```text
runtime/data/locks/regular_worker.lock
runtime/data/locks/playback_worker.lock
runtime/data/locks/screen_worker.lock
```

The exact path can still be finalized, but the principle is clear: lock files belong under runtime data.

## Difference

The April spec defines the need for locks.  
The Q&A defines the likely location and names.

## Required documentation update

Add a lock-file convention section to runtime recovery and worker specs.

---

# 9. Runtime Truth JSON

## April 2026 merged spec

The April document does not appear to settle the long-term role of `runtime-truth.json`.

## Current Q&A decision

The question was deferred.

## Difference

No final change.

## Required documentation update

Keep this marked as:

```text
NEEDS_USER_DECISION
```

---

# 10. Pipeline and Stage Execution

## April 2026 merged spec

The April document defines several stage behavior expectations:

- setup before later stage buttons unlock;
- graceful empty-input behavior;
- human-readable logs;
- database snapshot/delta logging;
- one-stage-at-a-time execution;
- run-all stages button behavior.

## Current Q&A decision

The new Q&A adds broader pipeline configuration and provider fallback expectations:

- batch sizes configurable through `.env`;
- retries configurable;
- provider/method order configurable;
- if all providers fail after retries, mark item unresolved/failed.

## Difference

The April spec defines stage UI/runtime behavior.  
The Q&A defines more provider-style pipeline mechanics.

## Required documentation update

Add provider/method fallback logic to pipeline docs.

---

# 11. GPS Extraction Methods

## April 2026 merged spec

The April document references GPS parsing as a stage, but does not fully specify multiple extraction methods.

## Current Q&A decision

GPS extraction should support multiple local fallback methods, such as:

- EXIF GPS extraction;
- other embedded metadata extraction;
- sidecar metadata files;
- filename/path pattern parsing;
- fallback/manual/imported metadata.

## Difference

This is a new expansion beyond the April spec.

## Required documentation update

The GPS parsing stage should be documented as a multi-method extraction pipeline.

---

# 12. Geocoding Providers

## April 2026 merged spec

The April document includes geocoding as a stage but does not finalize provider strategy.

## Current Q&A decision

The project should support multiple free/no-account geocoding providers first, and later allow credential-based providers if needed.

The architecture should not assume only one provider.

## Difference

This is a new expansion beyond the April spec.

## Required documentation update

Geocoding docs should define:

```text
provider list
provider priority order
retry count
batch size
failure status
future credential-based provider extension point
```

Provider choices should be verified because provider account requirements and rate limits can change.

---

# 13. Logging, Error Pipeline, and Dashboard Notifications

## April 2026 merged spec

The April document strongly requires human-readable logs and database change tracking, especially in View B.

It focuses on:

- readable stage logs;
- database snapshots;
- delta information;
- stage summaries.

## Current Q&A decision

The new Q&A expands this into a layered system:

```text
normal notification/status pipeline
logging pipeline
error pipeline as last-resort failure path
```

The dashboard should receive:

- errors;
- warnings;
- status messages;
- session-expiry notices;
- re-login-needed messages;
- backend crash/failure information where possible.

## Difference

The April spec defines logging visibility.  
The Q&A defines a broader message/error delivery architecture.

## Required documentation update

Add a new or expanded section:

```text
Runtime Notification, Logging, and Error Pipeline
```

---

# 14. Playback and Screen Testing

## April 2026 merged spec

The April document covers these areas in detail:

- test playback source;
- playback display behavior;
- automatic transition to next media;
- Windows playback differences;
- B5 screen activity/inactivity testing.

## Current Q&A decision

The Q&A did not substantially change these areas.

## Difference

No major difference.

## Required documentation update

Keep the April spec as the main source for these areas unless later user decisions change them.

---

# 15. Old Documentation Cleanup

## April 2026 merged spec

The April document itself does not primarily define the documentation cleanup workflow.

## Current Q&A decision

Old/deprecated/superseded documents should be moved to:

```text
docs/to_be_deleted/
```

Each moved file must receive a header explaining it is marked for deletion/deprecated and why.

No documents should be permanently deleted immediately.

## Difference

This is a newer documentation-governance rule.

## Required documentation update

Documentation reconciliation specs should include this exact rule.

---

# 16. Status of the April 2026 Merged Spec

## April 2026 merged spec

It declares itself authoritative for the discussed behavior unless explicitly overridden later.

## Current Q&A decision

The user said the document is still important and should not be thrown away. However, some parts may be outdated and should be refined by newer decisions.

## Difference

The document remains important, but it is no longer the only authority. Newer Q&A decisions should refine or supersede outdated parts.

## Required documentation update

Classify it as:

```text
IMPORTANT_AUTHORITY_WITH_NEWER_OVERRIDES
```

Not:

```text
FOR_DELETION
```

---

# Topic-by-Topic Comparison Table

| Topic | April 2026 merged spec | Current Q&A decision | Relationship | Needed update |
|---|---|---|---|---|
| Product identity | Dashboard/test/runtime behavior focus | Raspberry Pi autonomous photo-frame is main goal | Q&A expands scope | Add product-level framing |
| View A | Init/setup/scheduler/auth placement | Still valid | Confirmed | Keep |
| View B | Test-only, no auth, isolated environment | Strongly confirmed | Confirmed and sharpened | Add no-login-after-mock rule |
| Test/real separation | Strongly defined | Strongly confirmed | Confirmed | Add stronger safety language |
| Mock download | Test flow action | File-copy only, separate from iCloud | Sharpened | Update mock spec |
| Auth | View A placement, not View B | Reuse valid sessions; no unnecessary login | Expanded | Update auth spec |
| Test login button | Placement implied near auth | Still open | Unresolved | Keep open |
| Scheduler | Install/check scheduler jobs | Windows emulator, Linux real cron | Expanded | Add platform matrix |
| Worker schedules | 10/1/3 min examples | Defaults in `.env`, tunable | Expanded | Add config policy |
| Lock files | Needed for concurrency | Runtime data locks with names | Expanded | Add exact convention |
| Runtime truth JSON | Not finalized | Deferred | Unresolved | Keep unresolved |
| Stage execution | One-stage-at-a-time, logs, snapshots | Adds provider retries/batches | Expanded | Add pipeline config |
| GPS parsing | Stage exists | Multi-method extraction | Expanded | Add extraction methods |
| Geocoding | Stage exists | Multiple free providers first | Expanded | Add provider strategy |
| Logs | Human-readable logs and deltas | Layered notification/logging/error pipeline | Expanded | Add error pipeline architecture |
| Playback testing | Detailed behavior | No major change | Still valid | Keep April spec |
| Screen testing | Detailed B5 behavior | No major change | Still valid | Keep April spec |
| Old docs cleanup | Not central | Move to `docs/to_be_deleted/` with reason header | New governance | Add doc cleanup rule |
| April spec status | Self-authoritative | Still important, with newer overrides | Refined | Mark as important authority with newer overrides |

---

# Recommended Authority Classification

## April 2026 merged specification

Recommended classification:

```text
IMPORTANT_AUTHORITY_WITH_NEWER_OVERRIDES
```

Reason:

- It remains highly useful for View A, View B, test environment, scheduler controls, stage behavior, playback testing, and screen testing.
- It should not be discarded.
- It must be read together with newer Q&A decisions and the 3-slice vision/spec docs.

## Current Q&A Summary

Recommended classification:

```text
NEWER_USER_DECISION_LOG
```

Reason:

- It contains newer spoken decisions.
- It clarifies product direction and several implementation policies not fully settled in the April spec.
- It should drive the next spec update pass.

---

# Most Important Differences to Apply Next

1. Update the project vision to say Raspberry Pi autonomous operation is the primary goal.
2. Update mock download docs to say it is strictly test-only file copying and must never trigger real iCloud login.
3. Update environment docs to require real/test path separation and reject overlap.
4. Add worker lock file convention under runtime data.
5. Add `.env` defaults for worker schedules and batch/retry settings.
6. Add multi-provider geocoding architecture.
7. Add multi-method GPS extraction architecture.
8. Add layered notification/logging/error pipeline concept.
9. Keep the test login button behavior open until inspected again.
10. Keep runtime truth JSON open until the user decides whether it is temporary or permanent.
11. Mark old docs moved to `docs/to_be_deleted/` with explicit deprecation headers and reasons.
12. Reclassify the April 2026 merged spec as important authority with newer overrides, not obsolete.

---

# Final Recommendation

Do not replace the April 2026 merged spec outright.

Instead, treat it as a strong behavioral authority for dashboard/test/runtime flow, then apply the newer Q&A decisions as an override layer.

The cleanest next documentation step would be to create a new reconciliation document such as:

```text
docs/vision_and_implementation/reconciliation/APRIL_2026_SPEC_OVERRIDE_MAP.md
```

That file should map each newer Q&A decision to the exact section of the April spec that it confirms, modifies, or supersedes.
