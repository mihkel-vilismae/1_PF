# Documentation Freshness Matrix

Estonian timestamp: 2026-06-11 18:30 EEST

This matrix is a navigation aid for deciding which PF_login documents can be trusted first. Code, tests, generated evidence, and target-machine runtime output remain stronger than prose documentation.

## Current authoritative entry points

| Path | Freshness | Authority note |
|---|---|---|
| `README.md` | current_latest_baseline | Current project overview, proof milestone summaries, and navigation entry point. |
| `HOW_TO_RUN.md` | current_latest_baseline | Current run instructions; active `npm run ...` references are covered by `tests/docsNpmScriptReferences.test.js`. |
| `CHANGELOG.md` | current_latest_baseline | Forward version log through v0.8.33; v0.8.28 is marked superseded by v0.8.29. |
| `docs/table_of_contents.md` | current_latest_baseline | Short operator-friendly map. |
| `docs/proofs/README.md` | current_latest_baseline | Proof vocabulary and complete current `proof:*` npm script index. |
| `docs/proofs/windows_native_proof_milestone_v0.8.26.md` | current_latest_baseline | Consolidated Windows target-machine proof milestone and non-claim boundary. |
| `docs/proofs/windows_reboot_recovery_preflight.md` | current_latest_baseline | Safe preflight contract for future manual Windows reboot/restart proof; no reboot, no Windows Task Scheduler. |
| `docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md` | current_latest_baseline | Raspberry OS missing-feature OpenSpec; documentation only, no Raspberry runtime proof. |
| `docs/50_audits_and_migrations/DOC_CONSISTENCY_AUDIT_20260611.md` | current_latest_baseline | Latest documentation issue registry and recommended next doc/implementation slices. |
| `docs/50_audits_and_migrations/PF_LOGIN_PROJECT_STATUS_ANALYSIS_20260611.md` | current_latest_baseline | Current v0.8.33 structured status report covering goals, implementation coverage, OpenSpec/docs coverage, endpoints/interfaces, proof matrix, issues, and next slices. |

## Current proof/documentation milestones

| Version | Documentation/proof status | Freshness note |
|---|---|---|
| v0.8.24 | Target-machine native Windows video playback PASSED. | Current proof milestone; does not prove Raspberry playback. |
| v0.8.25 | Controlled Windows native recovery PASSED. | Controlled API/process restart only; not OS reboot. |
| v0.8.26 | Proof-owned live Windows scheduler loop PASSED. | Project-owned/CronEmulator-style evidence path; not Windows Task Scheduler. |
| v0.8.27 | Windows proof milestone docs consolidated. | Current proof-status reference. |
| v0.8.28 | Windows Task Scheduler dry-run proof added then superseded. | Historical only; removed from project scope by v0.8.29. |
| v0.8.29 | Windows Task Scheduler removed from project scope. | Current project decision; do not recommend Task Scheduler paths. |
| v0.8.30 | Windows reboot/restart recovery preflight PASSED. | Safe preflight only; no reboot proof. |
| v0.8.31 | Raspberry OS missing-feature OpenSpec added. | Documentation only; no Raspberry runtime proof. |
| v0.8.32 | Documentation consistency audit/fix. | Removes stale proof command references and adds docs-command regression coverage. |
| v0.8.33 | Project status analysis and endpoint inventory report. | Documentation-only report; no runtime behavior changed. |

## Trust classes

| Freshness | How to use |
|---|---|
| `current_latest_baseline` | Start here. Still verify runtime claims with code/tests/evidence where possible. |
| `recent_verify_against_code` | Useful, but check against current source, tests, or generated evidence. |
| `historical_reference_only` | Provenance only; do not treat as current implementation truth. |
| `compatibility_navigation_only` | Old navigation/pointer docs; follow links to canonical numbered folders. |
| `superseded_scope` | Do not implement from this doc unless project scope is explicitly reversed. |

## Superseded or high-risk docs

| Path / topic | Freshness | Reason |
|---|---|---|
| v0.8.28 Windows Task Scheduler dry-run proof references | `superseded_scope` | Windows Task Scheduler is not part of PF_login project scope as of v0.8.29. |
| `docs/50_audits_and_migrations/placeholder_implementations.md` | `recent_verify_against_code` | Contains older Windows Task Scheduler implementation notes from before the scope decision; verify and do not reuse that path. |
| `docs/categorized/` | `compatibility_navigation_only` | Retained for old links only. |
| `docs/90_archive/` | `historical_reference_only` | Archive/provenance only. |
| `task_docs/` compatibility pointers | `historical_reference_only` | Old task docs; do not use as current truth. |

## Current non-claims to preserve

- No Windows Task Scheduler proof path is part of PF_login.
- No full Windows reboot recovery proof is claimed yet.
- No Raspberry native playback, Raspberry cron/systemd/autostart, Raspberry reboot, or Raspberry power-loss recovery proof is claimed yet.
- No monitor-pixel proof is claimed yet.
- No production iCloud continuation proof is claimed by the Windows proof milestone.
- `tools/mpv/` and `tools/ffmpeg/` are local-only ignored tool bundles and must not be vendored or re-tracked.
