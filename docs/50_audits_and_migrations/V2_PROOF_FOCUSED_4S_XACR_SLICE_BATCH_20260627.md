# V2 Proof-Focused 4S XACR Slice Batch — 2026-06-27

## Baseline

- Input baseline: `v0.10.77`
- Output version: `v0.10.78`
- Workflow: `4SLICSE-XACRSLICEPLAN-ZIP-OFFER` / `4S-ACRPL-Z-O`

## XACR conclusion

The remaining sliceplan is no longer broad UI implementation. The next safe work is proof tooling that lets the real Raspberry target prove or block the autonomous playback mission without pretending sandbox evidence is hardware evidence.

Implementation order for this batch:

1. Target-machine readiness proof contract.
2. Real cron/worker-truth evidence proof contract.
3. Real playback/display evidence proof contract.
4. Final autonomous proof bundle aggregator.

## Implemented proof commands

### Target-machine readiness

```bash
npm run proof:v2-real-machine-readiness-contract
npm run proof:v2-real-machine-readiness
```

The contract command checks repo identity, required npm commands, proof command registration, and separated TEST/REAL environment templates.

The evidence command is intended for the target machine and can write a proof artifact under `runtime_data/proofs`.

### Real cron worker evidence

```bash
npm run proof:v2-real-cron-evidence-contract
npm run proof:v2-real-cron-evidence
```

The contract command checks that Raspberry cron proof scripts and the worker-truth API are registered.

The evidence command reads real-mode worker truth JSONL files and checks for regular, playback, and screen worker evidence.

### Real playback display evidence

```bash
npm run proof:v2-real-playback-display-contract
npm run proof:v2-real-playback-display
```

The contract command checks that playback worker truth events and overlay/rendering surfaces exist.

The evidence command reads real-mode playback worker truth and checks for media start, media finish, and queue advance evidence.

### Final autonomous bundle

```bash
npm run proof:v2-final-autonomous-bundle-contract
npm run proof:v2-final-autonomous-bundle
```

The contract command checks final proof command registration.

The evidence command summarizes latest local proof artifacts and blocks until the required target-machine evidence proofs pass.

## Environment template update

Added explicit V2 worker truth paths to `example.env`:

```text
V2_WORKER_TRUTH_DIR=runtime_data/v2_worker_truth/real
TEST_V2_WORKER_TRUTH_DIR=test_runtime_data/v2_worker_truth/test
```

These keys support TEST/REAL separation for the worker-truth evidence flow.

## Validation performed in this environment

Passed static contract proof commands:

```bash
node tools/run-v2-real-machine-readiness-proof.mjs --contract
node tools/run-v2-real-cron-evidence-proof.mjs --contract
node tools/run-v2-real-playback-display-proof.mjs --contract
node tools/run-v2-final-autonomous-proof-bundle.mjs --contract
```

Not claimed here:

- Real Raspberry hardware display proof.
- Real cron scheduled worker execution.
- Real iCloudPD login proof.
- Full dependency-backed `npm test`, `npm run build`, or `npm run typecheck`.

## Remaining proof work

1. Install dependencies on the target machine.
2. Run full test/build/typecheck on the target machine.
3. Run real readiness proofs.
4. Install real crontab.
5. Prove scheduled workers write real truth events.
6. Prove playback displays media with overlay.
7. Prove screen worker behavior on the Raspberry target.
8. Run final autonomous bundle evidence proof.
