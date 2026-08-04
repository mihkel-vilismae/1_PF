# Default Project Setting — `/deep_fix`

## Status

- **Enabled by default:** yes
- **Scope:** Default Project Settings / inherited project skill
- **Canonical global source:** `mihkel-vilismae/_GLOBAL_DATA_ROLES_RULES_WORKFLOWS_VERSIONING/skills/deep-fix/SKILL.md`
- **Generated-project target:** `.codex/skills/deep-fix/SKILL.md`
- **Alias:** `/deep_fix`

## Canonical intent

> NOW ANALYZE USING 3XACR, THEN VERIFY USING 3X3X3, THEN GENERATE RESULT REPORT AS A BASIS FOR SOLUTION

## Default inheritance rule

New projects created from Default Project Settings should include the canonical `/deep_fix` skill unless the project explicitly opts out.

The copied project skill must preserve the canonical global semantics rather than creating a project-specific reinterpretation.

## Workflow contract

When `/deep_fix` is invoked:

1. Freeze the current evidence baseline.
2. Run three ACR passes:
   - evidence/failure-boundary review;
   - competing-cause/adversarial review;
   - solution-architecture/risk review.
3. Run the existing 3x3x3 verification workflow against the resulting diagnosis and solution candidates.
4. If 3x3x3 invalidates the leading conclusion, return to the evidence baseline and revise the diagnosis.
5. Generate a structured solution-basis report.
6. Do **not** implement the solution unless implementation is explicitly requested.

## Required report sections

The `/deep_fix` result report should include:

1. Executive conclusion.
2. Evidence baseline.
3. Ruled-out causes.
4. 3xACR results.
5. 3x3x3 verification.
6. Selected solution basis.
7. Smallest coherent implementation slice.
8. Concrete acceptance gates.
9. Rollback/recovery path.
10. Open uncertainties.
11. One recommended next action.

## Required behavior

- Evidence first; keep facts separate from inference.
- Prefer the newest clean/reproducible run over older ambiguous evidence.
- Preserve contradictory evidence rather than silently reconciling it.
- Prefer discriminating tests over speculative changes.
- Do not broaden into unrelated subsystems.
- Do not declare success from build/install/upload alone; require runtime acceptance evidence appropriate to the system.
- Preserve already-working behavior while isolating the failing boundary.
- Avoid destructive reset/clean operations as a debugging convenience.
- When implementation is later requested, make one coherent reviewable logical change with tests/docs where appropriate.

## Short semantics

`/deep_fix` means:

> Analyze the current unresolved problem using 3xACR, verify the conclusions using 3x3x3, then generate a result report as the basis for the solution.

`/deep_fix then implement` means:

> Run the complete `/deep_fix` workflow first, then implement only the verified solution slice.
