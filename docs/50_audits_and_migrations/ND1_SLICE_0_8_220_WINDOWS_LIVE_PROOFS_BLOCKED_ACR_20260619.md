# ND-1 Slice 0.8.220 ACR — Windows live proofs blocked contract

- Analyze: Windows proofrunner had hard FAIL rows when optional live Windows proofs lacked operator inputs such as `.env` or live scheduler opt-in.
- Critique: Missing operator input should be honest `BLOCKED`, not a PowerShell exception.
- Refine: Windows live wrapper scripts now route missing `.env` / missing live opt-in into node proof runners that produce `BLOCKED` evidence and exit zero.
- Non-claim: This does not prove live Windows playback/recovery/video/scheduler behavior; it proves the safe missing-input contract.
