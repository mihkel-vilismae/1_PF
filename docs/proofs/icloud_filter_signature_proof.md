# iCloud filter signature proof

Command:

```bash
npm run proof:icloud-filter-signature
```

This local proof validates that filtered iCloud download runs use a normalized, secret-free filter object and a stable SHA-256 `filter_signature`.

Batch 1 and batch 2 may be compared for no-loop/no-overlap only when they use the same `filter_signature`.

This proof does not call iCloudPD or download files.
