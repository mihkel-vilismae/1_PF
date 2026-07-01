# ACR Usage Ledger Proof

Run:

```bash
npm run proof:workflow-acr-usage-ledger
```

The proof creates a temporary ledger, records three events, and verifies:

- `XACR` can be counted as `user_called`.
- `3XACR` can be counted as `assistant_automatic`.
- `2x2acr` normalizes to `2x2ACR`.
- Empty known commands still appear in the summary.
- Documentation mentions `runtime_data/workflow/acr-command-usage.jsonl`.
- `workflow:acr:record`, `workflow:acr:summary`, and `proof:workflow-acr-usage-ledger` are registered.

The proof does not use or mutate the real runtime ledger.
