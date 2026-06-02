# Full test-suite stability proof

`proof:full-test` is the local regression-confidence proof for PF_login / 1234_PF.

It executes the complete Node test suite through the checked-in local `tsx` dependency, captures structured command evidence, parses Node test summary counts when present, and writes sanitized JSON under `runtime_data/proofs`.

## What it proves

- The complete local test suite exited cleanly when `proof_status` is `PASSED`.
- The command, arguments, exit code, signal, duration, timeout setting, and test counts were recorded.
- Timeout and non-zero exits are represented honestly as `TIMED_OUT` or `FAILED`.
- Sanitized output tails are available for diagnosis without storing unlimited logs in Git.

## What it does not prove

- Real iCloudPD authentication success.
- Live network geocode-provider success.
- Raspberry hardware recovery.
- Physical display behavior.

Those concerns stay covered by their own proof runners or target-machine evidence.

## Runtime artifacts

Generated artifacts are written to:

```text
runtime_data/proofs/full_test_suite_stability_<timestamp>.json
```

The generated JSON files are runtime evidence and should normally remain untracked.
