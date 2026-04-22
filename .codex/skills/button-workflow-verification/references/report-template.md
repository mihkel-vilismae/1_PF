# Button Verification Report Template

Use this template for the final per-button artifact or final response section.

## Scope

- View:
- Section:
- Control:
- Action key:

## Final Classification

`✅ Works` or `⚠️ Partial` or `❌ Broken` or `🧪 Mock-only`

## Evidence Basis

State which of these were used:

- static code tracing
- live endpoint execution
- executable tests
- browser/manual click evidence

Be explicit when browser automation was not used.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger |  |  |  |
| 2. Frontend Wiring |  |  |  |
| 3. Frontend -> Backend Call |  |  |  |
| 4. Backend Endpoint Existence |  |  |  |
| 5. Backend Logic Execution |  |  |  |
| 6. Response Handling (Frontend) |  |  |  |
| 7. Mock / Reality Validation |  |  |  |
| 8. Inspect System Alignment |  |  |  |
| 9. Test Coverage |  |  |  |

## Live Result Summary

- Backend status:
- Key payload facts:
- Operator-visible outcome:

## Notes

- Include non-blocking caveats.
- Call out any evidence that came from code tracing rather than a real browser click.

## Registry Update

- `RUN_LOG.md` appended: yes/no
- `INDEX.md` updated to latest status: yes/no
