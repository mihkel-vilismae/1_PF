# Button Verification Index

Use this file as the quick lookup table before starting a new button audit. Update the existing row when a button is re-audited instead of creating duplicate entries.

This file stores the latest known status per button. The append-only history for every workflow run lives in `docs/button_verification_results/RUN_LOG.md`.

| View | Section | Control | Action key | Classification | Last verified | Report | Backend test | Frontend test | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | 1A | Verify .env / Run | `verify-env` | `✅ Works` | 2026-04-22 | [VIEW_A_1A_VERIFY_ENV.md](/I:/___006_1904/1_PF/docs/button_verification_results/VIEW_A_1A_VERIFY_ENV.md) | `tests/initApi.step1.test.js` | `tests/viewA.verifyEnv.buttonWorkflow.test.js` | Live endpoint returned `status: ok`; path-type keys can still point to missing directories without failing the action. |
