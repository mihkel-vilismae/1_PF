# Real GPS/geocode product bridge proof

`npm run proof:real-gps-geocode-product-bridge` validates the bridge from accepted media GPS evidence to normalized geocode address evidence and structured v2 regular worker product evidence.

## Purpose

This proof closes the implementation gap between the real/readiness media source and product evidence:

```text
redacted real/download manifest or readiness media GPS evidence
→ accepted GPS coordinate
→ normalized real geocode address artifact
→ structured v2 regular worker product evidence
```

## Required opt-ins

The proof is blocked by default. A passing run requires:

```bash
export PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true
export PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED=true
export PF_REAL_GPS_GEOCODE_MANIFEST_FILE=/path/to/redacted_manifest_with_gps.json
export PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE=/path/to/normalized_real_geocode_address.json
```

Alternatively, provide a standalone accepted GPS evidence file:

```bash
export PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE=/path/to/readiness_media_gps.json
```

## Evidence contract

The GPS source must be one of:

- `real_media_exif`
- `readiness_approved_gps`
- `operator_confirmed_media_gps`
- `provider_coordinate_fixture`

The bridge verifies that the normalized address artifact coordinate matches the accepted GPS evidence within proof tolerance and that the address artifact does not include provider secrets or raw provider payload.

## Generated output

When passed, the proof writes product evidence under:

```text
runtime_data/operator_evidence/real_gps_geocode_product_bridge/latest.json
runtime_data/operator_evidence/real_gps_geocode_product_bridge/latest.env
```

The generated `.env` line can be used by the regular worker product proof:

```bash
source runtime_data/operator_evidence/real_gps_geocode_product_bridge/latest.env
npm run proof:raspberry-regular-stage-worker-product-pipeline
```

## Non-claims

This bridge does **not** prove:

- iCloud authentication;
- real iCloud download by itself;
- native device playback;
- address overlay visibility on a physical display.

Those remain owned by their separate proof gates.
