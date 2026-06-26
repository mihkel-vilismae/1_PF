# V2 Operator Menu left sidebar OpenSpec

Status: Historical six-row sidebar OpenSpec plus first implementation slice. Superseded for current route/page status by `v2_operator_pages_openspec.md` and `V2_ImplementationStatus.md`; as of v0.10.47 the current V2 sidebar has nine rows `01` through `09`. This file remains useful for the original route metadata and non-recursive-sidebar boundary.
Project: PF_login / PhotoFrame
Baseline lineage: v0.10.20 immutable snapshot, promoted through v0.10.21 docs/version baseline
Scope: v2 operator menu left sidebar route list only
Non-scope: center-panel child layout, backend action wiring, real operator actions, recovery behavior, iCloud authentication behavior, crontab writes, worker execution.

## Purpose

This OpenSpec defines the left sidebar contract for the v2 operator menu UI.

The v2 operator menu must expose exactly six stable top-level areas. These areas are route owners, not recursive tree roots that expose every child item in the sidebar.

The operator mental model is:

```text
Left sidebar = choose one stable major operator area
Center panel = render that area's page content
```

This document intentionally covers only the left sidebar. Center-panel typed block coverage is a later OpenSpec slice.

## Normative sidebar items

The left sidebar must contain exactly these six items, in this order:

| Order metadata | Label | Route key | Route ownership boundary |
|---:|---|---|---|
| `01` | `setup.sh` | `setup` | setup/preflight/orchestration entry point only |
| `02` | `authentication.sh` | `authentication` | local iCloudPD login/session entry point only |
| `03` | `startup.sh` | `startup` | startup prerequisites entry point for env, database, and crontab |
| `04` | `workers` | `workers` | worker status/control entry point |
| `05` | `troubleshooting` | `troubleshooting` | diagnostics/logs/stale-locks/examples entry point |
| `06` | `recovery` | `recovery` | snapshot/recovery entry point |

## Required data shape

Implementations should represent each item with separate display/order metadata and label metadata.

```json
[
  { "order": "01", "label": "setup.sh", "route": "setup" },
  { "order": "02", "label": "authentication.sh", "route": "authentication" },
  { "order": "03", "label": "startup.sh", "route": "startup" },
  { "order": "04", "label": "workers", "route": "workers" },
  { "order": "05", "label": "troubleshooting", "route": "troubleshooting" },
  { "order": "06", "label": "recovery", "route": "recovery" }
]
```

The visible UI may show the number beside the label, but the internal label must not include the number.

Allowed display examples:

```text
01 setup.sh
01 — setup.sh
[01] setup.sh
```

Forbidden stored labels:

```text
01setup.sh
01 setup.sh
01 — setup.sh
```

## Sidebar invariants

The implementation must preserve these invariants:

1. The v2 operator menu left sidebar contains exactly six top-level items.
2. The item order is stable and numeric order is stored separately from label text.
3. Labels are stable and must match the normative table exactly.
4. Route keys are stable and must match the normative table exactly.
5. No child item may be promoted to a left-sidebar route.
6. No child item may appear as a nested sidebar row.
7. The sidebar is not a generic recursive tree renderer.
8. Selecting a sidebar item may update the center panel, but must not execute backend actions by itself.
9. Selecting `authentication.sh` must not expose credentials, 2FA values, cookies, or session secrets.
10. Selecting `startup.sh`, `workers`, `troubleshooting`, or `recovery` must not perform guarded actions by navigation alone.

## Explicitly forbidden sidebar rows

The following items must not appear in the left sidebar as standalone or nested route rows in this OpenSpec slice:

```text
.env / environment variables
verify.env
open .env in text editor
database
verify DB
recreate DB
backup DB
crontab
verify crontab
install default crontab
install custom worker
current status
regular worker
playback worker
screen on-off worker
statistics page
manual troubleshooting actions
examples
snapshot metadata
current snapshot
restore state snapshot
currently stored backup snapshots
```

Those are page content concerns owned by the center panel or later OpenSpec slices.

## Relationship to V2 mode

The previous V2 mode OpenSpec defines a planned third startup mode. This left-sidebar OpenSpec defines the stable v2 operator menu sidebar that should be rendered inside that V2 operator surface when implementation is approved.

This document does not require changing Test Mode or Real Mode. Existing Test Mode and Real Mode behavior must remain unchanged unless explicitly changed by a later implementation request.

## Route behavior contract

Each route key must map to one selected operator area:

| Route key | Selected area title | Navigation side effect allowance |
|---|---|---|
| `setup` | `setup.sh` | navigation only |
| `authentication` | `authentication.sh` | navigation only; secret-safe status fetch only if an existing safe contract is used later |
| `startup` | `startup.sh` | navigation only |
| `workers` | `workers` | navigation only; read-only status fetch allowed only if explicitly wired later |
| `troubleshooting` | `troubleshooting` | navigation only |
| `recovery` | `recovery` | navigation only |

Navigation alone must not run setup scripts, authentication scripts, database recreation, crontab installation, worker enable/disable, log deletion, stale-lock clearing, snapshot save, or snapshot restore.

## Acceptance checks

A correct implementation must include tests or static checks proving at least:

1. The exported/sidebar data source has exactly six entries.
2. The six entries appear in the exact required order.
3. Each entry has separate `order`, `label`, and `route` fields.
4. No label starts with a numeric prefix such as `01`, `02`, or `03`.
5. Route keys are exactly `setup`, `authentication`, `startup`, `workers`, `troubleshooting`, and `recovery`.
6. The rendered left sidebar shows exactly six top-level route rows in v2 operator mode.
7. Known child labels such as `.env / environment variables`, `database`, `regular worker`, `examples`, and `current snapshot` do not render as sidebar route rows.
8. Selecting a sidebar route changes only selected-route state / center-panel owner and does not invoke guarded actions.

## Proof guidance

Preferred proof shape for implementation:

```text
static schema test
+ render/sidebar test
+ regression assertion that Test Mode and Real Mode startup choices still exist
+ assertion that V2 operator sidebar contains only six route rows
```

The OpenSpec source of truth for this slice is this file, not the raw planning tree.

## Non-claims

This OpenSpec does not claim that:

- the center-panel typed blocks are implemented,
- any worker controls are functional,
- authentication is wired,
- crontab writes are implemented,
- recovery actions are implemented,
- troubleshooting examples are executable,
- v3 statistics exist.

This OpenSpec only freezes the left-sidebar route list and its safety boundaries.
