# Real iCloud filtered download batch 2 proof

Status: artifact-consuming proof. It is blocked by default until a two-batch real filtered download manifest is provided.

Command:

```bash
npm run proof:real-icloud-filtered-download-batch2
```

Required input:

```bash
PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE=/path/to/safe/two-batch-download-manifest.json
```

Optional guard:

```bash
PF_REAL_ICLOUD_EXPECTED_FILTER_SIGNATURE=sha256:...
```

## Proves

- A provided safe manifest contains a second batch.
- The second batch downloaded at least one item.
- The second batch uses the same filter signature as the manifest.
- The artifact remains secret-safe and media-free.

## Does not prove

- No-overlap/no-loop success by itself.
- That the proof runner performed the provider call.

Run `npm run proof:real-icloud-download-no-loop` after this proof to compare batch 1 and batch 2.
