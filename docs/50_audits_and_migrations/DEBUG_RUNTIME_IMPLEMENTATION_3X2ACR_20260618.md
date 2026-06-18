# Debug Runtime Implementation 3X2ACR Workflow

Status: implementation workflow baseline guard.  
Baseline: v0.8.139, HEAD `4842973`.  
Scope: Debug page runtime/UI slices 0-9 only.

## Pass 1 — Analyze

The v0.8.139 registry and completeness reporting proof are the immutable input source. Earlier v0.8.133 slice-table starts are stale and must be rebased through the v0.8.139 registry before implementation.

## Pass 1 — Criticize

The Debug page OpenSpec is documentation-only before this workflow. Runtime implementation must not bypass the existing dashboard shell, runtime-truth state store, API client boundary, scheduler abstractions, or proof-honesty status registry.

## Pass 1 — Refine

Use one XACR slice per commit. Every slice must bump version, keep previous dashboard views available, and make only local/test-safe Debug behavior until a later Raspberry proof slice explicitly authorizes real target effects.

## Pass 2 — Analyze

The requested slices are ordered from guard/preservation to static UI, then isolated test paths, fake-crontab safety, and mock worker invocation.

## Pass 2 — Criticize

The dangerous edges are real crontab mutation, production media/database mutation, duplicate worker runs, and false claims that mock/fake Debug actions prove Raspberry target behavior.

## Pass 2 — Refine

All Debug runtime actions in this batch are browser-local, fake/test-backed, or mock-only. The final proof must preserve these non-claims:

- no real crontab write;
- no production media/database mutation;
- no real worker process invocation;
- no Raspberry hardware proof;
- no provider/auth/session proof.

## XACR slice sequence

| Order | Slice | XACR decision |
|---:|---|---|
| 0 | Baseline guard | Preserve v0.8.139 immutable baseline and reject v0.8.133 starts. |
| 1 | Registry/proof preservation | Add runtime proof lane without weakening proof honesty. |
| 2 | Debug route/sidebar | Implement route and navigation only. |
| 3 | Debug version tracker | Reuse real app version source. |
| 4 | Debug pane shell | Render static panes with planned/blocked status. |
| 5 | Test-media isolation | Model test media as isolated placeholders, not production writes. |
| 6 | Worker telemetry panes | Render mock/test telemetry only. |
| 7 | Fake crontab parser | Parse fake/app-owned content read-only. |
| 8 | Fake crontab mutation safety | Mutate fake app-owned blocks only. |
| 9 | Manual worker run mock path | Simulate safe single worker run without spawning workers. |

## Final acceptance

The final ZIP must include full git history, one logical commit per slice, clean tracked status, and proof outputs from targeted Debug runtime tests, registry proof, docs audits, typecheck, and build.
