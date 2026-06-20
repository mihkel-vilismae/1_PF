# Auth session usable evidence proof

Command:

```bash
npm run proof:auth-session-usable-evidence
```

This local contract proof defines the sanitized evidence object that a later live/operator-assisted login proof must produce after manual 2FA.

The evidence may say that an app-owned session is usable only when:

- the operator completed 2FA outside artifact capture;
- the operator checkpoint marker was observed;
- the evidence is redacted;
- no Apple ID, password, 2FA code, cookie, token, raw session path, or raw provider output is present;
- any session reference is represented only by a safe hash.

This proof does not authenticate against Apple/iCloud and does not inspect real session files.
