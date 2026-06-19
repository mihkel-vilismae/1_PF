# ND-1 Slice 0.8.223 ACR — iCloudPD session path validator

- Analyze: Real iCloud proof needs a safe way to check where operator-created session material lives.
- Critique: Proof artifacts must not include credentials, cookies, tokens, or raw `.env` values.
- Refine: Add validator that reports only presence/path class/count/mtime and returns BLOCKED for missing config.
