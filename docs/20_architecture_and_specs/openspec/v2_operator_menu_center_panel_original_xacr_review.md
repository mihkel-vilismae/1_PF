# V2 Operator Menu Center Panel Original Items XACR Review

Status: docs-only multipass review  
Version introduced: v0.10.23  
Scope: review of original center-panel/sub-item OpenSpec coverage  
Runtime implementation: none  

## Pass 1 — X: Cross-check against the brief

The source brief defines six stable top-level operator areas and states that their children belong in the center panel, not in the left sidebar. The center items include mixed semantic objects: explanatory text, status, actions, grouped sections, toggles, combo selectors, worker stages, snapshot viewers, snapshot lists, future placeholders, and examples.

Result: a separate center-panel OpenSpec is justified. The left-sidebar OpenSpec alone is not enough to preserve the original design intent.

## Pass 2 — A: Analysis of semantic ownership

Each sidebar route has a distinct center-panel responsibility:

| Route | Center-panel responsibility |
|---|---|
| `setup` | small preflight/orchestration surface |
| `authentication` | local iCloudPD session surface with secret-safe output |
| `startup` | env, DB, crontab section groups |
| `workers` | operational status, stage table, playback status/current media, screen toggles, V3 statistics placeholder |
| `troubleshooting` | safe diagnostics, log/error information, non-action examples |
| `recovery` | snapshot inspection, backup policy, snapshot actions, snapshot list |

The center panel should be data-driven enough to assert type coverage, but not so generic that it loses page-specific safety rules.

## Pass 3 — C: Critique of likely implementation mistakes

Main mistakes to avoid:

1. Turning center children into nested sidebar rows.
2. Treating `batch size` as a route instead of a stage setting.
3. Treating `show statistics for this stage` as an active V2 feature instead of V3 placeholder.
4. Treating `*EX` troubleshooting scenarios as buttons.
5. Making `restore state snapshot`, `clear logs`, `clear stale locks`, `recreate DB`, or crontab writes one-click actions.
6. Showing authentication details without redaction.

## Pass 4 — R: Refined OpenSpec stance

The OpenSpec should record the original center-panel items as a contract snapshot, but it should not over-freeze future UI design. The user explicitly expects to change these items later. Therefore the document uses "original design" language and acceptance checks, not final implementation language.

## Pass 5 — Regression check

The generated OpenSpec preserves these active constraints:

- Existing runtime remains unchanged.
- Existing Test/Real/Final Release planning work remains unchanged.
- Left sidebar remains exactly six routes.
- Children stay out of the sidebar.
- Risky actions are guarded by default.
- V3 placeholders are disabled/future by default.

## Pass 6 — Implementation prompt refinement

When implementation is later requested, use this reduced prompt:

```text
From the current PF_login / PhotoFrame baseline, implement the V2 operator menu center-panel model without changing the six-route left sidebar. Use typed center-panel blocks for all child items. Add static/read-only rendering first. Do not wire destructive actions unless guarded contracts exist. Add checks proving children are center-panel typed blocks, not sidebar routes.
```

## Final review result

The original center-panel OpenSpec is suitable as a baseline design snapshot. It is intentionally not a final design freeze and should be superseded cleanly if the center items change later.
