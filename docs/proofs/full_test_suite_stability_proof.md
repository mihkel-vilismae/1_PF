# Full test suite stability proof

Run:

```bash
node tools/run-full-test-proof.mjs
```

The proof runner executes:

```bash
npx tsx --test --test-reporter=spec
```

Optional timeout:

```bash
PF_FULL_TEST_PROOF_TIMEOUT_MS=300000 node tools/run-full-test-proof.mjs
```

Output is written under ignored `runtime_data/proofs/full_test_suite_stability_<timestamp>.json`.

This proves local full-suite pass/fail/timeout status, duration, summary counts, and environment. It does not prove real iCloudPD, real geocode provider, or Raspberry hardware behavior.
