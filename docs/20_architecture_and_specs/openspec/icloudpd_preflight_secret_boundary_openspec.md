# iCloudPD preflight secret-boundary OpenSpec

Version introduced: 0.8.160

## Purpose

Harden the real iCloudPD preflight boundary before any real provider proof is run. The preflight can report configuration presence, tool availability, target suitability, and block reasons. It must not leak provider credentials or session material.

## Allowed evidence

- Required key names and boolean presence only.
- Cookie directory existence as a boolean.
- Sanitized command/version attempts.
- Target detection summary.
- Explicit `PASSED`, `BLOCKED`, or `FAILED` proof status.

## Forbidden evidence

- Apple ID raw values.
- Passwords, two-factor codes, cookies, tokens, or authorization headers.
- `.env` values.
- Raw provider output that can contain account/session data.
- Full local user paths to private account/session material.

## Acceptance

`proof:raspberry-icloudpd-preflight` may pass only on a real non-override Raspberry target with required config present and a usable iCloudPD command/version check. Any missing target/config/tool evidence must produce `BLOCKED`, not a false pass.

## Non-claims

This boundary does not prove login, media download, iCloud continuation, GPS/geocode, playback, or Raspberry v1 readiness.
