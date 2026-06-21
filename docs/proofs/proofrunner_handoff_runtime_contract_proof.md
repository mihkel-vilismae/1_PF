# Proofrunner handoff runtime contract proof

Command: `npm run proof:proofrunner-handoff-runtime-contract`

This local proof validates the handoff runtime helpers used by generated prooflaunchers. It checks that:

- `last_run_stats.json` can be generated from Raspberry TSV summaries without inline Python string-literal/newline hazards.
- Windows CSV summaries with quoted paths are parsed correctly.
- final proof-results ZIP paths resolve one level above the extracted handoff folder into the extraction root.
- launcher contract patterns use the repo-owned Node stats builder instead of escape-sensitive inline Python.

The proof does not execute the full generated handoff launcher and does not prove real iCloud login/download.
