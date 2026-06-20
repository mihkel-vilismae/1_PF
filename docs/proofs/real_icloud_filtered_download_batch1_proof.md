# Real iCloud filtered download batch 1 proof

Status: artifact-consuming proof. It is blocked by default until a real filtered download manifest is provided.

Command:

```bash
npm run proof:real-icloud-filtered-download-batch1
```

Required input:

```bash
PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE=/path/to/safe/download-manifest.json
```

Optional guard:

```bash
PF_REAL_ICLOUD_EXPECTED_FILTER_SIGNATURE=sha256:...
```

## Proves

- A provided real-download manifest matches the safe manifest schema.
- The first batch exists and downloaded at least one item.
- The batch uses the expected normalized filter signature when one is provided.
- The manifest does not include media files, raw provider output, Apple IDs, passwords, 2FA codes, cookies, tokens, or raw session paths.

## Does not prove

- The proof runner itself performed the download.
- Batch 2 continuation behavior.
- No-loop/no-overlap behavior.
