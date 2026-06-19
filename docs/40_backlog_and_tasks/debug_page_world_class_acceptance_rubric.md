# Debug Page World-Class Acceptance Rubric

Status: active rubric introduced in v0.8.202.

This rubric turns “world-class Debug page” into measurable checkpoints. It is intentionally proof-honest: a polished UI does not prove real provider, device, crontab, worker, media/database, or recovery behavior.

| Area | 85% checkpoint | 95% checkpoint | Non-claim |
|---|---|---|---|
| Operator context | Help, Stack/Status, Elements list, Auth/Session context are visible before controls. | Context is compact, scannable, and clear on small screens. | Does not prove real backend/provider behavior. |
| Visual system | 3 color schemas and 3 major visual modes are specified and rendered. | Schemas/modes feel coherent and accessible. | Does not prove product behavior. |
| Element inventory | Every major pane/button has stable ID and keybook entry. | Marker/modal/list behavior is pleasant and proofed. | IDs do not prove the action is real. |
| Behavior definition | Every button is local/mock/planned-safe/blocked/real-runtime. | Page displays behavior status consistently. | Planned-safe is not implementation. |
| Proof input | Page tells operator what proof ZIP/input to upload and what not to include. | Proof input panel links to relevant commands and non-claims. | Does not run proof by itself. |
| Completion reporting | Debug page can be scored against this rubric. | Report identifies exact remaining blockers. | Score is not final v1 readiness. |

## Scoring rule

85% means the operator can understand, inspect, and safely use the Debug page without guessing what is real, fake, blocked, or planned. 95% means the page is also visually polished, accessible, and supported by stronger render/proof coverage.

## v0.8.210 accessibility/responsive addendum

The first 85% runtime implementation must support small screens by stacking visual toolbar controls and element-list rows. Keyboard users must be able to focus visual controls and `*` markers with a visible outline.
