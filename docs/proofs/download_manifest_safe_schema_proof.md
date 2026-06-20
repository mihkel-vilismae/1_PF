# Download manifest safe schema proof

Command:

```bash
npm run proof:download-manifest-safe-schema
```

This proof validates the safe manifest schema used by later real iCloud download proofs. The manifest proves what was downloaded using redacted hashes, file sizes, safe extensions, and batch metadata.

It must not include media files, raw provider output, Apple ID, password, 2FA code, cookies, tokens, or raw session paths.
