# Real iCloud download no-loop proof

Status: artifact-consuming proof. It is blocked by default until a two-batch real filtered download manifest is provided.

Command:

```bash
npm run proof:real-icloud-download-no-loop
```

Required input:

```bash
PF_REAL_ICLOUD_NO_LOOP_MANIFEST_FILE=/path/to/safe/two-batch-download-manifest.json
```

## Proves

- The manifest is safe and schema-valid.
- At least two batches exist.
- Both batches use the same normalized filter signature.
- Batch 2 does not repeat batch 1 source ID hashes.
- Batch 2 does not repeat batch 1 file hashes.
- Batch 2 does not repeat batch 1 safe filenames.

## Fails if

- Batch 2 loops over batch 1.
- Batch 2 has the same downloaded file hashes.
- The filter signature changes between batches.
- The manifest includes secret-like provider data or raw media.

## Does not prove

- The proof runner itself contacted iCloud.
- The proof runner itself downloaded media.
- Full Raspberry v1 readiness.

It proves the safety and no-loop meaning of the uploaded/downloaded manifest artifacts.
