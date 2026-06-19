# Proof Run Handoff Triage

When a Windows or Raspberry proof-results ZIP is uploaded, analyze two layers separately:

1. shell/process exit status from the prooflauncher summary
2. proof JSON `proof_status` values from runtime_data/proofs

A proof command can exit 0 and still be honestly `BLOCKED`. A hard shell failure is different and should be prioritized.
