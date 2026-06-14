# Raspberry v1 question matrix decisions OpenSpec

Status: active v1 planning/specification aid  
Introduced: v0.8.67  
Baseline input: user question-matrix conversation after v0.8.66 Raspberry target-pack evidence

## Purpose

This document records the v1 blocker question matrix, the answers clarified so far, and the resulting implementation direction. It prevents later slices from silently changing v1 scope or treating an unanswered item as confirmed.

## Confirmed or partially confirmed answers

| ID | Gate | Answer | Decision status | Implementation meaning |
|---|---|---:|---|---|
| I1 | real iCloud media source | C | Confirmed as not sure | Do not assume `icloudpd` is already working; first add/discover a safe iCloudPD preflight. |
| I2 | real iCloud media source | Unanswered | Open | v1 requires real iCloud, but proof may still use local real iPhone media as a preparatory tool only if later approved. |
| I3 | real iCloud media source | A | Confirmed | Manual/operator Apple login and 2FA are acceptable for v1 proof; do not try to automate 2FA. |
| G1 | real GPS/geocode | A | Confirmed | Real photos/videos are expected to usually contain GPS metadata; build v1 proof around real GPS when present. |
| G2 | real GPS/geocode | A | Confirmed by current working assumption | Use OpenStreetMap/Nominatim first unless user later selects another provider. |
| G3 | real GPS/geocode | C | Confirmed | Media without GPS should remain playable and be marked `unknown` rather than skipped. |
| R1 | regular worker product pipeline | B | Confirmed | `regular_stage_worker` should prioritize iCloud download as the first real source. |
| R2 | regular worker product pipeline | Unanswered | Open | Whether real DB rows/queue writes happen immediately or behind a flag remains unresolved. |
| R3 | regular worker product pipeline | Unanswered | Open | Minimum PASS level for regular worker product proof remains unresolved. |
| A1 | address overlay | Unanswered | Open | Display location target remains governed by the existing v1 release gate: device/native display required unless changed. |
| A2 | address overlay | Unanswered | Open | Address text granularity remains unresolved. |
| A3 | address overlay | Unanswered | Open | Evidence style remains unresolved: operator observation, screenshot/photo, or JSON-only. |
| D1 | dashboard status view | Unanswered | Open | Dashboard status contents remain unresolved. |
| D2 | dashboard status view | Unanswered | Open | Dashboard control authority remains unresolved; default should be status-only until confirmed. |
| S1 | screen worker non-blocking | Unanswered | Open | Physical screen power control remains non-v1 unless confirmed otherwise. |
| S2 | screen worker non-blocking | Unanswered | Open | Exact PASS criteria for non-blocking screen lane remains unresolved. |
| DOC1 | docs reconciliation | Unanswered | Open | Timing of documentation cleanup remains unresolved. |
| DOC2 | docs reconciliation | Unanswered | Open | Strictness of stale-doc cleanup remains unresolved. |

## Working defaults for unresolved items

These defaults are allowed for planning only. They must be shown as defaults, not user-confirmed decisions, in implementation docs and proof output.

| ID | Default | Reason |
|---|---:|---|
| R2 | C | Real product writes should be staged behind a flag until proof/data safety is established. |
| R3 | C | v1 release gate already expects import/download + index + GPS + geocode + queue. |
| A1 | A | Existing answered v1 matrix requires address overlay on Raspberry/device display. |
| A2 | A | City/country is a safe minimum overlay with less privacy/detail risk than full address. |
| A3 | B | Screenshot/photo or operator-observation evidence is safer than JSON-only for display claims. |
| D1 | D | Worker health, current playback, and v1 gates are all useful. |
| D2 | A | Dashboard should remain status-only until command authority is explicitly scoped. |
| S1 | A | Physical screen power control is not a v1 blocker; prove the lane is non-blocking. |
| S2 | C | PASS should show worker exits safely and does not block other cron lanes. |
| DOC1 | B | Runtime gates should be stabilized before broad docs cleanup. |
| DOC2 | C | Fix critical contradictions first; full doc cleanup can happen near release candidate. |

## Implementation consequences

1. The next runtime repair remains the v0.8.67 target-pack ordering repair from the uploaded v0.8.66 evidence: `app_running_pass` produces complete duplicate/stale-lock evidence, so the target pack should not require earlier worker-evidence proofs to pass before that harness has run.
2. The next product direction after target-pack ordering is iCloud-first discovery and preflight, not local-folder-first product implementation, because R1 was clarified as iCloud priority.
3. Because I1 is not sure, the first iCloud slice must be a safe preflight/discovery slice, not a production download claim.
4. Because I3 is A, all iCloud runbooks/proofs must allow manual login/2FA and must not claim full 2FA automation.
5. Because G1/G2/G3 are clarified, GPS/geocode proof should use real GPS when present, Nominatim/OpenStreetMap as first provider, and mark missing GPS as `unknown` while keeping media playable.
6. Unanswered items must remain visible in readiness reports and docs as unresolved or defaulted, not silently converted to requirements.

## Non-claims

- This document does not prove iCloud access works.
- This document does not prove geocoding works.
- This document does not implement the regular worker product pipeline.
- This document does not prove address overlay or dashboard status.
- This document does not replace proof artifacts generated under `runtime_data/proofs`.
