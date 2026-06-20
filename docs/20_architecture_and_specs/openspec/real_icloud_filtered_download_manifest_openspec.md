# Real iCloud filtered download manifest OpenSpec

Status: proof contract foundation  
Version introduced: v0.8.239

## Goal

Prove the narrow real-provider path without overclaiming full v1 readiness:

```text
auth/session usable -> normalized filters -> real filtered download -> safe manifest -> second batch -> no-loop/no-overlap result
```

## Required proof boundaries

- The proof must not include Apple ID, password, 2FA code, cookies, raw session files, raw provider output, or private media content.
- Real provider execution must be explicit opt-in.
- A local contract proof may pass without live provider access, but it must not claim that files were downloaded.
- A live proof may pass only when it writes a safe manifest from real downloaded files.

## Normalized filter contract

A normalized filter is the canonical form used to compare batch runs. It must record only non-secret operator intent, such as:

- media type selection, for example `photo`, `video`, or `any`;
- limit/count;
- ordering mode, for example `newest_first`;
- optional album name hash or operator-safe label;
- optional date range normalized to ISO dates.

The proof must compute a stable `filter_signature` from the normalized filter. Batch 1 and batch 2 are comparable only when their signatures match.

## Manifest contract

A safe manifest records what happened without uploading media files or private provider data.

Required top-level fields:

- `schema_version`
- `proof_kind`
- `filter_signature`
- `batches`
- `overlap`
- `secret_safety`

Required item fields:

- `safe_source_id_hash`
- `file_sha256`
- `extension`
- `size_bytes`
- `downloaded_at`

## No-loop / no-overlap acceptance

The proof must fail if batch 2 repeats batch 1 as `1,2,3,4,5 -> 1,2,3,4,5`.

The no-overlap proof must compare at least:

- redacted/hashed source IDs;
- file SHA-256 hashes;
- safe filenames or destination names when available.

## Non-claims

This OpenSpec does not claim live iCloud authentication, real download success, Raspberry display output, geocode, or v1 readiness. It defines the proof contract those later slices must satisfy.

## Auth session usable evidence contract

A later live proof may unlock real filtered download only after a sanitized auth evidence object validates these fields:

- `session_state: usable`;
- `operator_completed_2fa: true`;
- `checkpoint_marker_seen: true`;
- `redacted: true`;
- `secret_fields_present: false`;
- `safe_session_id_hash` with a SHA-256 digest.

The evidence object must reject Apple IDs, passwords, 2FA codes, cookies, tokens, raw session paths, and raw provider output.

## Filter signature proof contract

The filtered download proof must call the normalized filter signature helper before any manifest comparison. Two batches may be compared only when the `filter_signature` is identical. The canonical filter JSON must exclude credentials, cookies, tokens, 2FA values, raw provider output, and private media paths.
