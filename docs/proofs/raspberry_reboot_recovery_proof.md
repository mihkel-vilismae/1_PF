# Raspberry reboot/restored-start recovery proof

Version introduced: v0.8.47  
Status: Implemented manual evidence proof runner / target event required

Run:

```bash
npm run proof:raspberry-reboot-recovery
```

The proof requires `PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE` with pre-reboot marker, post-reboot marker, boot detection, active cron, all three worker lanes resumed, app-running status passed after reboot, stale locks safe, and playback state safe.

The runner does not reboot the Raspberry automatically and does not prove physical sudden power-loss recovery.
