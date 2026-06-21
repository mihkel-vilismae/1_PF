# Real geocode provider-chain proof

Introduced: v0.10.4

Command:

```bash
npm run proof:real-geocode-provider-chain
```

## Purpose

This proof validates the G1/G2 `real_gps_geocode` provider-chain layer:

```text
controlled coordinate fixture
→ configured real reverse-geocode provider
→ normalized address artifact
→ cache miss/cache insert/cache hit evidence
```

The proof is opt-in because it may call a real network provider.

## Required opt-in and provider config

Example for public Nominatim:

```bash
PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true \
PF_GEOCODE_CHAIN_PROOF_PROVIDER=nominatim_osm \
GEOCODE_NOMINATIM_OSM_USER_AGENT="PF_login/0.10.4 contact@example.invalid" \
npm run proof:real-geocode-provider-chain
```

The proof intentionally does not set a default provider user-agent. Required provider-specific env must be configured outside proof artifacts.

## Evidence produced

The proof writes a redacted proof envelope under ignored `runtime_data/proofs/` and records:

- selected provider id;
- controlled coordinate fixture;
- provider safety readiness summary;
- cache-first miss evidence;
- forced no-result fallback evidence;
- real provider result evidence;
- cache hit after provider success;
- normalized address artifact;
- normalized address validation result;
- placeholder rejection checks;
- provider secret/raw payload safety flags.

## Normalized address artifact

The proof emits `normalized_real_geocode_address` evidence with:

```json
{
  "artifact_kind": "normalized_real_geocode_address",
  "source_level": "provider_coordinate_fixture",
  "provider_id": "nominatim_osm",
  "coordinate": {
    "latitude": 59.437,
    "longitude": 24.7536,
    "language_code": "en"
  },
  "address": {
    "display_name": "Tallinn, Harju County, Estonia"
  },
  "overlay_ready": {
    "primary_line": "Tallinn, Harju County, Estonia"
  },
  "safety": {
    "raw_provider_payload_included": false,
    "provider_secrets_included": false,
    "private_paths_included": false
  }
}
```

## Status rules

| Condition | Status |
|---|---|
| proof opt-in missing | `BLOCKED` |
| provider id missing or unsupported | `BLOCKED` |
| provider safety config incomplete | `BLOCKED` |
| subprocess timeout | `TIMED_OUT` |
| subprocess failure | `FAILED` |
| deterministic placeholder output used | `FAILED` |
| address is coordinate echo only | `FAILED` |
| expected fixture terms missing | `FAILED` |
| provider/network unavailable after opt-in | `BLOCKED` when classified as operator/environment unavailable |
| normalized address artifact valid and provider/cache checks pass | `PASSED` |

## Non-claims

A passed provider-chain proof does not yet prove:

- real media GPS extraction;
- real iCloud media source;
- worker product record integration;
- Raspberry address overlay display evidence;
- `real_gps_geocode` v1 readiness gate closure by itself.

Future G3-G5 work must connect real/accepted GPS source evidence into the worker product record before readiness can close this blocker.
