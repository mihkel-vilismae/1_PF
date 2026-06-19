# Debug Page Proof Input / Output Contract

Status: active proof-input contract introduced in v0.8.205.

The Debug page should tell the operator what proof input is useful and what must never be uploaded.

## Accepted proof inputs

| Input | Use |
|---|---|
| `2proofrunner` results ZIP | Main Windows/Raspberry proof evidence. |
| `runtime_data/proofs/*.json` | Machine-readable proof statuses. |
| sanitized operator screenshots/photos | Device/display proof only when secrets/private data are absent. |
| sanitized session readiness proof | Auth/session state without cookies/tokens/passwords. |

## Forbidden proof inputs

Never request or upload:

- Apple ID/password/2FA codes;
- raw cookies, tokens, session file contents;
- raw `.env` values containing secrets;
- exact GPS/address unless explicitly approved;
- production database/media files unless a proof contract says exactly why.

## UI requirement

The Debug page must render a proof input panel that explains proof ZIP upload expectations, PASS/BLOCKED/FAILED, secret boundaries, and relevant proof commands.
