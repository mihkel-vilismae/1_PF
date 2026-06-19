# Debug Page Style Proof Contract OpenSpec

Status: source-level style proof contract introduced in v0.8.217.

## Purpose

A world-class Debug page needs visual proof boundaries. This contract defines what can be checked without a browser screenshot and what remains a non-claim until browser/screenshot evidence exists.

## Source-level checks

The style contract proof may validate:

- top-right visual toolbar CSS;
- color schema classes `debug-page--schema-1`, `debug-page--schema-2`, `debug-page--schema-3`;
- major visual mode classes `debug-page--visual-1`, `debug-page--visual-2`, `debug-page--visual-3` where applicable;
- responsive `@media` block for small screens;
- focus-visible styling;
- PASS/BLOCKED/FAILED chips;
- element marker and modal CSS.

## Screenshot/browser checks

A later proof may attach screenshot or browser-rendered evidence. Until then, source-level style proof is useful but does not prove final visual appearance on Windows/Raspberry/browser targets.
