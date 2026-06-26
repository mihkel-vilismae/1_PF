# V2 Real Playback Documentation 3+2ACR Review

Estonian timestamp: 2026-06-26 09:34 EEST

## Scope

Docs-only 3+2ACR review for the V2 documentation package leading toward `09 REAL PLAYBACK`.

Reviewed planned documents:

- `docs/20_architecture_and_specs/v2_goals/goals.md`
- `docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md`
- `docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md`
- `docs/20_architecture_and_specs/openspec/V2_GoalSummary.md`
- `docs/20_architecture_and_specs/openspec/V2_IssueRegister.md`
- README and table-of-contents references

## ACR pass 1 — requirement extraction

The documentation must capture three levels of intent:

1. the final product goal: autonomous playback and autonomous recovery;
2. the V2 page structure: `01` through `09`;
3. the engineering constraints: reuse components, avoid copy-paste, track true implementation status.

The doc package needs to be explicit that `01` through `08` are proving/staging pages and `09 REAL PLAYBACK` is the final integrated endpoint.

## ACR pass 2 — architecture critique

The main documentation risk is that page-placement notes become a shopping list instead of an architecture. The OpenSpec therefore needs to define shared components and proof boundaries, especially Event Log, backend result panels, RPI rows, implementation-status overlay, and reusable card renderers.

The docs must also state that old/source controls are not automatically proven in V2. Existing tests/proofs must be reused or extended.

## ACR pass 3 — status honesty critique

The status tracker must be conservative. It should distinguish:

- visual placement;
- placeholder behavior;
- reused candidate;
- wired behavior;
- tested/proven behavior;
- unknown or broken behavior.

This avoids fake readiness.

## Extra critique pass 1 — issue coverage

The issue register must include the known hard problems:

- lightweight save state;
- power-loss recovery;
- corrupt/partial downloads;
- non-media rejection;
- PIR simulation/hardware proof;
- Windows cron emulator avoidance;
- browser auth fallback;
- stale-lock button verification.

## Extra critique pass 2 — documentation integration

The documentation is not done unless it is discoverable. Required references:

- README small V2 status/goal section;
- `docs/table_of_contents.md` V2 rows;
- OpenSpec README rows;
- architecture/spec README rows;
- goals file cross-reference to V2 OpenSpec/status docs.

## Refined documentation output

The documentation package should contain:

| Document | Required role |
| --- | --- |
| `v2_operator_pages_openspec.md` | full page/component/reuse/proof contract |
| `V2_ImplementationStatus.md` | current status and future status vocabulary |
| `V2_GoalSummary.md` | authoritative planning summary |
| `V2_IssueRegister.md` | unresolved design/verification gaps |
| this 3+2ACR review | why the package is structured this way |
| follow-up 3XACR review | final documentation quality review |

## Result

The documentation package is acceptable as the next step before code only if it remains clear that it is documentation, not runtime proof.
