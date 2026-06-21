# Raspberry iCloud-first regular worker product pipeline OpenSpec

Status: active implementation contract  
Introduced: v0.8.69  
Refined: v0.10.3 regular worker product evidence bridge

## Goal

Define and prove the v1 product path for `regular_stage_worker` after the question matrix clarified that iCloud download is the first priority.

The regular worker product pipeline proof must demonstrate the product chain:

```text
real/readiness download manifest
→ regular worker input resolver
→ selected eligible media
→ product record evidence
→ display queue/output preparation
→ redacted proof artifact
```

## Required stage order

1. source discovery: real iCloudPD source or explicit readiness-approved source;
2. download/import manifest available to the worker;
3. media indexing / selected eligible asset creation;
4. GPS metadata status recorded;
5. geocode/address status recorded;
6. slideshow/display queue preparation;
7. product evidence artifact written.

## Evidence shape v2

A regular worker product evidence artifact must include both legacy booleans and structured evidence.

Legacy booleans remain supported for compatibility:

- `media_source_observed`;
- `download_or_import_completed`;
- `index_completed`;
- `gps_extraction_completed`;
- `geocode_completed`;
- `queue_prepared`;
- `worker_status_product_work_claimed`.

Structured v2 evidence must include:

```json
{
  "evidence_schema_version": 2,
  "worker": {
    "mode": "regular",
    "entrypoint": "regular_stage_worker",
    "run_id": "safe_id"
  },
  "input": {
    "source_kind": "real_download_manifest|readiness_approved_manifest",
    "manifest_id": "safe_hash",
    "items_seen": 1,
    "items_eligible": 1,
    "private_paths_redacted": true
  },
  "selected_media": {
    "media_id": "safe_id",
    "media_type": "image|video",
    "source_provenance": "real_download|readiness_approved"
  },
  "product_record": {
    "created": true,
    "has_media_asset": true,
    "has_display_asset": true,
    "gps_status": "present|missing|blocked|not_required",
    "geocode_status": "present|missing|blocked|not_required",
    "overlay_status": "ready|partial|blocked|not_required"
  },
  "output": {
    "display_queue_written": true,
    "next_display_item_ready": true
  },
  "redaction": {
    "private_paths_redacted": true,
    "secrets_redacted": true,
    "raw_media_included": false,
    "raw_provider_output_included": false
  }
}
```

## Evidence levels

| Level | Source | Meaning | May satisfy this gate? |
|---:|---|---|---|
| L0 | template/mock only | shape only | no |
| L1 | fixture manifest | mechanics proof | no |
| L2 | readiness-approved manifest | product bridge proof | yes for implementation readiness |
| L3 | real download manifest | strong product proof | yes |
| L4 | real download + GPS/geocode enrichment | enriched product proof | yes |
| L5 | product output visible on device | downstream full path | belongs to display proof |

The worker product gate may pass with L2/L3 core evidence, while the `real_gps_geocode` and `address_overlay_device_display` gates remain separately blocked until their own evidence passes.

## Safety defaults

Until R2/R3 are explicitly confirmed, real DB/queue writes should be staged or guarded by an explicit flag. Proof commands must label staged/defaulted decisions as such.

The product evidence producer requires explicit opt-ins:

- `PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE=true`
- `PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED=true`
- `PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE` or `PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE`

These flags are not a substitute for real media/geocode/display proofs. They only make the worker product evidence bridge explicit and auditable.

## Non-claims

- Starting the worker is not product pipeline proof.
- Local/generated-media rehearsal is not real iCloud proof.
- Product evidence cannot claim real geocode unless provider proof or cached real-provider data supports it.
- Product evidence cannot claim address overlay visibility; that belongs to `address_overlay_device_display`.
- Product evidence must not include credentials, cookies, 2FA values, raw provider output, private media paths, or raw media bytes.

## Product contract proof

`proof:regular-worker-product-contract` validates that stage keys, staged-write boundaries, and non-claims stay in sync between this OpenSpec and the product-pipeline proof library.

## Product evidence producer proof

`proof:regular-worker-product-evidence-producer` converts a safe manifest plus explicit regular-worker product-work confirmation into a redacted `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE` compatible artifact.

It writes:

- `runtime_data/operator_evidence/regular_worker_product/latest.json`
- `runtime_data/operator_evidence/regular_worker_product/latest.env`

The generated `.env` line can be used by:

```bash
npm run proof:raspberry-regular-stage-worker-product-pipeline
```

## v0.10.10 GPS/geocode product enrichment bridge

`proof:real-gps-geocode-product-bridge` may generate an enriched structured v2 product evidence file when supplied with:

- a redacted real/download or readiness-approved media GPS source;
- a normalized geocode address artifact from a provider-chain or accepted cache output;
- explicit product-work confirmation.

The generated evidence may set:

- `gps_extraction_completed: true`;
- `geocode_completed: true`;
- `product_record.gps_status: "present"`;
- `product_record.geocode_status: "present"`;
- `product_record.overlay_status: "ready"`.

It must still keep `address_overlay_visibility_satisfied: false` until a marker-matched visual device proof passes.
