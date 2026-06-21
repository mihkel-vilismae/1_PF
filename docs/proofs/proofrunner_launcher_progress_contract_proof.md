# Proofrunner launcher progress contract proof

Command: `npm run proof:proofrunner-launcher-progress-contract`

This local proof validates the human-visible prooflauncher progress contract:

- Raspberry launcher has colorized status helpers.
- Windows launcher uses colorized `Write-Host` status output.
- Both launchers show a periodic `still running` heartbeat while each proof command runs.
- Both launchers include elapsed time while a proof/test is running.
- Both launchers show an ETA based on prior timing history when available, or explicitly print `previous data unavailable`.

The proof validates contract patterns only. It does not execute a full Windows or Raspberry proofrunner.
