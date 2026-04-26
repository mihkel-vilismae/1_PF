# Summary Document — Vision/Specification Questions and Answers

Created: 2026-04-26 20:24 EEST
Status: authoritative Q&A summary from post-Slice-3 discussion.

## Purpose

This document summarizes the discussion after the 3-slice vision/specification documentation run. The goal was to clarify ambiguous project decisions so the next documentation or implementation pass can update the specs accurately.

## 1. Main Project Direction

The project’s main purpose is an autonomous photo-frame system for Raspberry Pi.

Windows and other platform-specific work exists mainly for convenience, development, testing, or debugging. Raspberry Pi is the final target and should be treated as the primary production environment.

Decision:

```text
Primary product identity: Autonomous Raspberry Pi photo-frame runtime.
Secondary/supporting identity: Cross-platform dashboard and development tooling.
```

## 2. Worker Lock Files

Lock files should live in the runtime data folder, preferably in a dedicated lock subfolder.

Use a central runtime lock location such as:

```text
runtime/data/locks/regular_worker.lock
runtime/data/locks/playback_worker.lock
runtime/data/locks/screen_worker.lock
```

The exact path can still be finalized later, but the principle is clear: worker locks belong under runtime data, not scattered across the repo.

## 3. Runtime Truth JSON

The long-term role of `conf/runtime-truth.json` was deferred and remains `NEEDS_USER_DECISION`.

## 4. Mock Download vs Real iCloud Download

Mock download must be entirely separate from the real iCloud download path.

Mock download should only copy files into the test/mock download folder. It should not interact with real iCloud authentication, real iCloud downloads, the real database, or real media folders.

After mock download succeeds, later test-stage actions must not unexpectedly push the user into a login/authentication flow.

Decision:

```text
Mock download = test-only file copy flow.
Real iCloud download = separate provider-backed production flow.
```

## 5. Real vs Test Environment Separation

The `.env` defines separate paths for real database, real file download location, test database, and test file download location. These must not match.

Actions from the test view must not affect the real database or real files.

Decision:

```text
Real runtime and test runtime must be strictly isolated.
```

## 6. Geocoding Providers

The system should start with multiple free providers, preferably providers that do not require an account. The user wants more than one free provider, not only one.

Direction: use approximately three free/no-account providers first, with room to add credential-based providers later.

Final provider choice still needs verification because provider terms, limits, and account requirements can change.

## 7. GPS Extraction Methods

GPS extraction should not rely on only one method.

The architecture should support several local “provider-like” extraction methods, possibly four or five, such as EXIF GPS extraction, other metadata extraction, sidecar metadata files, filename/path pattern parsing, and fallback/manual/imported metadata.

Decision:

```text
GPS extraction should be multi-method and fallback-based.
```

## 8. Batch Processing and Retry Logic

Batch size should be configurable in `.env`. The user mentioned batches such as 25 files at a time.

Workflow model:

```text
1. Take a batch of files.
2. Try provider/method 1.
3. If successful, save result.
4. If failed, try provider/method 2.
5. If failed, try provider/method 3.
6. Each provider/method gets configured retries, for example 3 retries.
7. If all providers/methods fail after retries, mark the item unresolved/failed.
```

## 9. Authentication Session Handling

The system should use the existing iCloud/session-cookie behavior as long as it remains valid. It should not ask the user to re-login unless actually needed.

Decision:

```text
Do not force re-login unnecessarily.
Use valid existing sessions until they fail or expire.
Prompt for login only when required.
```

## 10. Error / Logging / Notification Pipeline

There should be a structured message delivery path so important backend events can reach the dashboard.

This includes errors, warnings, status messages, session-expiry warnings, re-login-needed messages, and backend crash/failure information where possible.

Concept:

```text
normal notification/status pipeline
logging pipeline
error pipeline as the last-resort failure path
```

## 11. Test Login Button / Download-One-File Check

No final decision was made. The feature should remain unresolved until dashboard placement and behavior are inspected again.

Status: `OPEN / NEEDS_FURTHER_REVIEW`.

## 12. Scheduler Platform Behavior

Windows should use the cron emulator created by the user. Linux systems should use real cron. Raspberry Pi remains the real target environment.

Decision:

```text
Windows = cron emulator.
Linux/Fedora/Raspberry Pi = real cron.
Raspberry Pi = final production target.
```

## 13. Worker Schedules

Default schedules should be placed in `.env` and `.env.example`:

```text
regular stage worker: every 10 minutes
playback worker: every 1 minute
screen on/off worker: every 3 minutes
```

They are not necessarily final; the user expects to fine-tune them later through environment configuration.

## 14. Old / Deprecated Documentation

Old/deprecated/superseded documents should be moved into `docs/to_be_deleted/` and receive a header explaining that the file is marked for deletion/deprecated, including a reason.

No documents should be permanently deleted immediately.

## 15. April 2026 Merged Specification Document

The document is still important and should not be thrown away. Parts may be outdated and should be refined by newer decisions from this conversation and later spec updates.

Decision:

```text
Keep the April 2026 merged spec as an important authority/foundation.
Do not discard it.
Update or supersede outdated parts through newer vision/spec documentation.
```

## 16. Priority Question

The long-term goal is clearly autonomous Raspberry Pi operation. The immediate next implementation priority was not fully finalized.

