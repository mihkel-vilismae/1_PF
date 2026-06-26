# V2 Operator Menu left sidebar 6ACR review

Status: docs-only multipass review  
Target OpenSpec: `v2_operator_menu_left_sidebar_openspec.md`  
Scope: six left-sidebar items only  
Implementation status: not implemented by this review

## Pass 1 — Contract extraction

The input brief defines six stable top-level operator areas:

```text
01 setup.sh
02 authentication.sh
03 startup.sh
04 workers
05 troubleshooting
06 recovery
```

The important contract is not just the names. The important contract is that these six entries are the only left-sidebar routes. Numbering is display/order metadata and must not be merged into the label.

Decision: the OpenSpec must freeze the sidebar as a route list, not a nested UI tree.

## Pass 2 — Baseline preservation

Existing app behavior already has Test Mode and Real Mode surfaces, plus a docs-only Final Release mode plan. The new sidebar contract must not alter existing Test/Real behavior by itself.

Decision: define the sidebar as belonging to the v2 operator/final-release surface and make Test Mode / Real Mode preservation explicit.

## Pass 3 — Schema normalization

A safe implementation needs a normalized sidebar item shape.

Required minimum fields:

```text
order
label
route
```

The label field must be clean text such as `setup.sh`, not `01 setup.sh`. The route must be stable internal state such as `setup`, not display text.

Decision: include a normative JSON data shape in the OpenSpec.

## Pass 4 — Anti-recursion guard

The biggest implementation risk is rendering the planning tree as a generic recursive sidebar. That would place env/database/crontab/worker stages/log examples/snapshots into the left nav.

Decision: the OpenSpec must list explicit child labels that are forbidden as sidebar route rows.

## Pass 5 — Safety and side effects

Sidebar navigation must be safe. Selecting a route must not run scripts, perform auth, write crontab, recreate DB, clear logs/locks, change worker state, save snapshots, or restore snapshots.

Decision: sidebar route changes are navigation-only. Any later side-effectful action belongs in center-panel controls with explicit safety treatment.

## Pass 6 — Acceptance/proof design

The OpenSpec needs implementation-facing tests without forcing center-panel implementation.

Required checks:

```text
exactly six sidebar entries
exact order
separate order/label/route fields
labels do not include numeric prefixes
known child labels do not appear in sidebar routes
route selection has no guarded side effect
Test Mode and Real Mode are preserved
```

Decision: add acceptance checks that can be implemented as static schema tests and render tests when the UI slice is approved.

## Refined implementation prompt for this slice

```text
Implement only the v2 operator menu left-sidebar route list from the OpenSpec. The sidebar must contain exactly six top-level rows in order: setup.sh, authentication.sh, startup.sh, workers, troubleshooting, recovery. Store the visible number separately from the label. Do not use a recursive nested menu. Do not place any child item in the left sidebar. Selecting a row only changes the selected operator route / center-panel owner and must not trigger backend actions. Add static/render checks proving the exact six rows, separated order metadata, forbidden child rows, and preservation of existing Test Mode / Real Mode behavior.
```

## Review conclusion

The left-sidebar OpenSpec is intentionally narrow and implementation-ready. It does not define center-panel typed blocks yet, but it prevents the main architectural error: converting the v2 operator planning tree into a deep nested sidebar.
