# Real GPS/geocode product bridge evidence pack proof

`npm run proof:real-gps-geocode-product-bridge-evidence-pack` creates and validates the operator evidence pack needed by `proof:real-gps-geocode-product-bridge`.

## Purpose

The bridge proof correctly blocks unless the operator supplies accepted GPS evidence and normalized geocode address evidence. This evidence-pack proof lowers operator friction by generating:

- `media_gps_evidence_template.json`;
- `normalized_geocode_address_template.json`;
- `latest.env` with exact bridge proof variables;
- `NEXT_STEPS.txt` explaining what is still missing;
- `latest_report.json` with sanitized preflight details.

## Output location

```text
runtime_data/operator_evidence/real_gps_geocode_product_bridge_evidence_pack/
```

## Generated env variables

The generated `latest.env` includes the bridge variables:

```bash
PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true
PF_REGULAR_WORKER_RUNTIME_STATUS_FILE=runtime_data/scheduler/regular-stage-worker-status.json
PF_REAL_GPS_GEOCODE_SOURCE_KIND=readiness_approved_manifest
PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE=...
PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE=...
PF_NORMALIZED_REAL_GEOCODE_ADDRESS_FILE=...
```

The pack never generates manual product-work confirmation. The bridge derives that claim from the referenced durable worker runtime status.

## Status behavior

- `PASSED` means required evidence paths were supplied and the GPS/address coordinate validation passed.
- `BLOCKED` means templates/env/next steps were generated, but actual evidence is missing or inconsistent.
- Shell exit remains zero for `BLOCKED` so the proofrunner can package diagnostics.

## Non-claims

This proof does not claim:

- iCloud authentication;
- real iCloud download unless a separate proof supplies it;
- native playback;
- address overlay visibility.
