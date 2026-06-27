# V2 Visual Physical Proof Bundle XACR — 2026-06-28

## Scope

This slice preserves the passing v0.10.82 backend autonomous proof chain and adds an operator visual evidence layer for physical screen proof.

The backend proof can show cron/runtime/truth events. It cannot visually prove that the Raspberry/display screen actually showed media and overlay. v0.10.83 adds a folder, instructions, validation command, and final-bundle gate for operator-provided photo/video evidence.

## XACR decision

- Keep the v0.10.82 cron-runtime proof commands unchanged.
- Add `proof:v2-visual-physical-evidence` as a separate proof layer.
- Do not claim physical visual success unless photo/video evidence and operator confirmation are included.
- Keep backend autonomous proof and visual physical proof statuses separable in the final bundle.

## Runtime artifacts

Each prooflauncher run creates:

```text
prooflauncher_runs/<timestamp>/operator_visual_evidence/
  VISUAL_PHYSICAL_PROOF_INSTRUCTIONS.md
  PUT_PHOTOS_OR_VIDEOS_HERE.txt
  operator_confirmation_template.json
```

The operator should add files such as:

```text
screen_media_overlay.jpg
screen_media_advances.mp4
operator_visual_confirmation.json
```

Accepted media extensions:

```text
.jpg .jpeg .png .webm .mp4 .mov .mkv
```

Accepted supporting evidence extensions:

```text
.txt .md .json
```

## New proof command

```bash
npm run proof:v2-visual-physical-evidence
```

It writes:

```text
runtime_data/proofs/v2_visual_physical_evidence_<timestamp>.json
```

Required PASS conditions:

- operator visual evidence folder exists
- instructions exist
- at least one accepted evidence file exists
- at least one photo/video file exists
- `operator_visual_confirmation.json` exists
- confirmation JSON is valid
- `screenShowsMedia` is `true`
- `overlayVisible` is `true`

## Prooflauncher behavior

The prooflauncher opens the evidence folder before the visual proof command. It can optionally wait using:

```bash
PF_V2_VISUAL_EVIDENCE_WAIT_SECONDS=120
```

Default is `0`, so the launcher does not block forever. Without added operator evidence, the visual proof is expected to BLOCK while the backend proof chain remains analyzable.

## Final bundle behavior

The final autonomous bundle now checks `v2_visual_physical_evidence` as the physical proof layer. A missing/blocked visual proof does not erase backend cron proof results; it reports the remaining physical evidence gap explicitly.
