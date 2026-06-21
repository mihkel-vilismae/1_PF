# Regular worker product evidence producer proof

Command:

```bash
npm run proof:regular-worker-product-evidence-producer
```

This proof builds a redacted `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE` compatible artifact from a safe download/readiness manifest and an explicit regular-worker product-work confirmation.

## Required inputs

```text
PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE=true
PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED=true
PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE=<safe-manifest.json>
```

Alternative manifest envs:

```text
PF_WORKER_REAL_DOWNLOAD_BRIDGE_MANIFEST_FILE=<safe-manifest.json>
PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE=<safe-manifest.json>
```

Optional:

```text
PF_WORKER_INPUT_SOURCE_KIND=real_download_manifest|readiness_approved_manifest
PF_REGULAR_WORKER_PRODUCT_RUN_ID=<safe-run-id>
```

## Outputs

When inputs are valid, it writes:

```text
runtime_data/operator_evidence/regular_worker_product/latest.json
runtime_data/operator_evidence/regular_worker_product/latest.env
```

The `.env` file contains:

```text
PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE=runtime_data/operator_evidence/regular_worker_product/latest.json
```

## Non-claims

- Does not prove iCloud auth/session.
- Does not prove real GPS/geocode provider output.
- Does not prove address overlay device visibility.
- Does not include credentials, raw provider output, private paths, or raw media bytes.

## Status semantics

- `PASSED`: manifest resolves to eligible worker input and explicit worker product-work confirmation is present.
- `BLOCKED`: manifest/opt-in/product-work confirmation missing.
- `FAILED`: reserved for malformed/unsafe evidence if safely detectable.
