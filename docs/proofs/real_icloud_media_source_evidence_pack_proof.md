# Real iCloud media source evidence pack proof

## Command

```bash
npm run proof:real-icloud-media-source-evidence-pack
```

## Purpose

`proof:real-icloud-media-source-evidence-pack` generates and validates an operator-safe evidence pack for the `real_icloud_media_source` readiness blocker.

It is a preflight/helper proof. It does **not** log in to iCloud, call iCloudPD, download media, prove GPS/geocode, prove worker product output, or prove address overlay visibility.

## Generated files

The proof writes templates and helper files under:

```text
runtime_data/operator_evidence/real_icloud_media_source_evidence_pack/
```

Expected files:

- `auth_session_usable_evidence_template.json`
- `real_icloud_download_evidence_template.json`
- `real_icloud_download_manifest_template.json`
- `real_icloud_continuation_evidence_template.json`
- `latest.env`
- `latest_report.json`
- `NEXT_STEPS.txt`

## Safety boundary

The generated pack must not include:

- account identifiers;
- passwords;
- SMS/two-factor codes;
- cookie values;
- raw session files;
- raw media bytes;
- private absolute paths;
- raw provider output.

Only redacted status, safe IDs, safe hashes, counts, and basename-style filenames belong in the evidence pack.

## BLOCKED-safe behavior

When operator evidence is missing, the proof exits shell-zero with `proof_status: BLOCKED` and reports exactly which files or env vars are still missing.

This preserves proofrunner health while keeping real iCloud claims honest.

## Env handoff

`latest.env` includes the `PF_AUTH_SESSION_USABLE_EVIDENCE_FILE`, `PF_REAL_ICLOUD_*`, and downstream manifest variables needed by the real iCloud readiness/download and worker/GPS bridge proof chain.

Operators must review and fill the templates before using `latest.env` to run real iCloud proof commands.

## Non-claims

This proof does not claim:

- Apple authentication;
- real iCloud download;
- GPS/geocode success;
- regular worker product output;
- native playback;
- address overlay visibility.
