# Real iCloud filtered download OpenSpec proof

Command:

```bash
npm run proof:real-icloud-filtered-download-openspec
```

This proof validates that the OpenSpec for the real iCloud filtered download manifest exists and contains the required contract pieces: auth/session boundary, normalized filter signature, safe manifest, no-loop/no-overlap acceptance, and explicit non-claims.

It is a contract proof only. It does not run iCloudPD, authenticate, download files, or inspect private media.
