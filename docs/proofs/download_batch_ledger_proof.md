# Download batch ledger proof

Status: local contract proof.

Command:

```bash
npm run proof:download-batch-ledger
```

This proof validates the append-only ledger contract used by the later real iCloud filtered download proofs.

## Proves

- Ledger records use schema version `1`.
- Ledger records are append-only and preserve previous batch order.
- Batch IDs and run IDs are unique.
- Every batch uses the same normalized filter signature.
- Each appended batch references the previous ledger hash after the first batch.
- Ledger artifacts do not contain Apple IDs, passwords, 2FA codes, cookies, tokens, session paths, or raw provider output.

## Does not prove

- Real iCloud login.
- Real iCloud listing or download.
- Provider pagination behavior.
- That a physical media file was downloaded.

Those behaviors are covered by later opt-in, operator-machine proofs.
