# Production GPS/geocode placeholder rules OpenSpec

Version introduced: v0.8.43
Status: OpenSpec-only acceptance contract
Runtime behavior changed by this document: none; this document tightens v1.0 acceptance language and proof requirements

## Purpose

This OpenSpec defines the production acceptance boundary for GPS extraction, address caching, real reverse geocoding, and placeholder usage on the path to v1.0.

The key rule is simple: **production v1.0 must not accept placeholder geocoding as success.** Placeholder providers and coordinate-echo address text may remain available for deterministic tests and development proofs, but they are not production proof of resolved addresses.

## Scope

This contract covers:

- GPS extraction provider evidence.
- Reverse-geocode provider evidence.
- Address cache behavior.
- Placeholder geocoder and placeholder-looking address rejection.
- Proof artifact expectations for v1.0 acceptance.
- Documentation language for deterministic/test-only proof paths.

This contract does not implement a new provider, call a network service, change dashboard UI, change database schema, or claim production provider PASS evidence.

`address_cache` must be checked before network providers.

## v1.0 acceptance rules

| Area | v1.0 requirement | Accepted as production success | Not accepted as production success |
|---|---|---|---|
| GPS extraction | GPS must come from a real extraction provider. | `exif`, `json_sidecar`, `xmp_sidecar`, `text_sidecar`, `filename_coordinates`, `path_coordinates`, or future documented real metadata providers. | Hardcoded coordinates with no provider evidence; generated placeholder coordinates presented as production. |
| Address cache | The address cache must be checked before network providers. | `address_cache` hit sourced from a previously proven real provider result. | Cache-only success where the cached value is placeholder text or has no real-provider provenance. |
| Cache miss behavior | Cache miss must continue to a real provider when production geocoding is required. | Cache miss -> enabled real provider -> sanitized human-readable address. | Cache miss -> `deterministic_placeholder` -> coordinate echo. |
| Real geocoding | Production proof must show a real provider ID. | `nominatim_osm`, `photon_komoot`, `postcodes_io_uk`, `pelias_self_hosted`, `opencage`, `geoapify`, `mapbox`, `google_geocoding`, or future documented real provider. | `deterministic_placeholder`. |
| Address text | Production address must be human-readable. | Address text containing real place/admin/country terms appropriate to the provider response. | Coordinate echoes such as `Lat: 58.37763, Lon: 26.72901`. |
| Failure behavior | Missing provider/config/network should fail honestly. | `BLOCKED`, `NO_RESULT`, or sanitized failure code. | Fake success, fabricated address, or placeholder fallback counted as production PASS. |
| Test/dev proofs | Deterministic placeholder behavior may remain for regression. | Clearly labeled deterministic/test-only proof. | Any deterministic placeholder proof used as v1.0 production acceptance. |

## Provider classification

### GPS providers

The current GPS providers are local metadata extractors and are acceptable v1.0 provider classes when they record provider evidence and valid coordinate bounds:

```text
exif
json_sidecar
xmp_sidecar
text_sidecar
filename_coordinates
path_coordinates
```

These providers do not require API keys. They can be used in production acceptance if the artifact records the provider that succeeded and the source is real media metadata or an explicit local metadata file/token.

### Reverse-geocode providers

| Provider ID | Production class | v1.0 production status |
|---|---|---|
| `address_cache` | Local cache | Accepted only when cached value has real-provider provenance and is not placeholder-looking. |
| `nominatim_osm` | Real no-key network provider | Accepted when explicitly enabled, policy-compliant, and evidence is sanitized. |
| `photon_komoot` | Real no-key network provider | Accepted when explicitly enabled and evidence is sanitized. |
| `postcodes_io_uk` | Real no-key network provider | Accepted for UK-only scope when evidence is sanitized. |
| `pelias_self_hosted` | Real self-hosted provider | Accepted when `BASE_URL` points to a controlled Pelias instance and evidence is sanitized. |
| `opencage` | Real API-key provider | Accepted when configured and secrets are redacted. |
| `geoapify` | Real API-key provider | Accepted when configured and secrets are redacted. |
| `mapbox` | Real token provider | Accepted when configured and secrets are redacted. |
| `google_geocoding` | Real API-key/billing provider | Accepted when configured and secrets are redacted. |
| `deterministic_placeholder` | Test/dev placeholder | Not accepted for production v1.0 success. |

## Environment and mode rules

Production acceptance runs must set or prove equivalent behavior for:

```text
GEOCODE_ALLOW_PLACEHOLDER_FALLBACK=false
```

A production proof must not depend on the default deterministic placeholder fallback. If this environment value is absent or true, the proof may still run as a deterministic/dev proof, but it must not be marked as production geocode PASS.

Network providers remain disabled by default for safety. Real provider proofs must be explicit and config-gated:

```text
PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true
PF_GEOCODE_CHAIN_PROOF_PROVIDER=<real_provider_id>
GEOCODE_NETWORK_PROVIDERS_ENABLED=true
GEOCODE_ALLOW_NETWORK_PROVIDERS=true
```

Provider-specific keys, account IDs, tokens, cookies, headers, and raw provider payloads must not appear in proof artifacts.

## Placeholder rejection rules

A production proof must reject all of the following as production success:

- Provider ID `deterministic_placeholder`.
- Address text matching a coordinate echo such as `Lat: <number>, Lon: <number>`.
- Cache hits where `cached_provider_name` is `deterministic_placeholder`.
- Cache hits with no recorded provider provenance when v1.0 requires production geocode evidence.
- Dashboard or endpoint output that says an address was resolved but cannot identify a real provider or trusted cache hit.

These rejection rules apply even if the process exits 0.

## Proof requirements

The v1.0 production GPS/geocode proof must record:

- baseline version and Git commit
- runtime mode and proof opt-in flags
- selected media or coordinate fixture
- successful GPS provider ID and parser method
- address-cache miss evidence before provider call
- selected real geocode provider ID
- sanitized provider success/failure summary
- cache insert evidence from the real provider result
- cache hit evidence on the second lookup
- placeholder fallback disabled evidence
- checks showing placeholder provider/address rejection
- redaction checks for secrets and raw provider output

`npm run proof:real-geocode-provider-chain` is the current closest proof path. It already blocks by default, requires a real provider ID, disables placeholder fallback in its subprocess, checks cache miss -> real provider -> cache hit, and rejects placeholder-looking addresses. v1.0 acceptance should either use that proof or a later proof that satisfies the same contract.

## Required documentation labels

Documentation for deterministic placeholder-based flows must use one of these labels:

- `deterministic local proof`
- `test/dev only`
- `not production geocode proof`
- `does not count for v1.0 production geocoding`

Documentation must not describe `deterministic_placeholder` as a production geocoder, production fallback, or v1.0 PASS path.

## Related placeholder inventory

| Related item | Current role | v1.0 treatment |
|---|---|---|
| `deterministic_placeholder` provider | Preserves deterministic Stage 4 behavior and tests. | Test/dev only; forbidden as production success. |
| `Lat: ..., Lon: ...` address strings | Placeholder coordinate echo. | Reject as production address. |
| Address display deterministic proof | Proves address propagation through playback contracts. | Keep as propagation proof only, not production geocode proof. |
| Deterministic media pipeline proof | Proves local pipeline orchestration. | Keep as regression proof only. |
| Mock/generated media flows | Safe local testing. | Not real production provider proof. |
| Redaction placeholders like `[REDACTED]` | Secret-safety output. | Required/safe; not a geocode placeholder problem. |
| HTML input placeholder text | UI affordance. | Not relevant to production geocode proof. |

## Non-claims

This OpenSpec does not prove:

- Any real provider currently succeeds from this environment.
- API-key providers are configured.
- Public provider terms or rate limits are satisfied.
- Production iCloud continuation.
- Raspberry display playback.
- Scheduler, reboot recovery, or power-loss recovery.

It only defines the v1.0 acceptance boundary for real GPS extraction, real geocoding, cache use, and placeholder rejection.
