# iCloudPD Session Path Validator OpenSpec

Status: proof-enabler for operator-assisted real iCloudPD login.

The validator checks whether `.env` exists in the repo root or parent folder and whether `ICLOUDPD_COOKIE_DIR` / `TEST_ICLOUDPD_COOKIE_DIR` is configured. It may summarize path existence, directory-ness, file count, and mtime, but must not print Apple IDs, passwords, tokens, cookies, or session file contents.

Missing `.env` or missing session path is an honest `BLOCKED` state, not a hard failure.
