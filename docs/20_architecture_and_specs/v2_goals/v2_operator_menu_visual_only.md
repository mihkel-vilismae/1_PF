# V2 Operator Menu visual-only prototype

Version slice: visual-only v2 operator menu slice on the current 0.10.20 working tree

## Purpose

This slice adds a visual-only dashboard surface for the planned PhotoFrame v2 operator workflow.
It is intentionally not wired to backend mutation routes yet.

## Files

```text
dashboard/views/v2OperatorMenuView.ts
dashboard/shared/constants.ts
dashboard/app.ts
dashboard/styles.css
tests/v2OperatorMenuView.test.js
```

## Visual-only boundary

The view must not:

- edit `.env`,
- write crontab,
- mutate the database,
- run authentication,
- access credentials or cookies,
- run recovery,
- spawn workers,
- claim Raspberry proof.

The view may:

- render the Structure V1 menu tree,
- show planned-safe and v3 markers,
- show explanations that were explicitly captured in planning,
- provide a safe visual target for later wiring.

## Implemented root sections

```text
_v2/
├── setup.sh
├── authentication.sh
├── startup.sh
├── workers
├── statistics page [v3]
├── troubleshooting
└── recovery
```

## Design choice

The view uses the existing dashboard Vite/TypeScript UI and existing dashboard CSS tokens.
No new frontend framework was introduced.
