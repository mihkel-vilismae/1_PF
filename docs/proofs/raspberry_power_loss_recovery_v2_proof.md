# Raspberry physical power-loss recovery proof

Version introduced: v0.8.48  
Status: Implemented manual evidence proof runner / physical event required

Run:

```bash
npm run proof:raspberry-power-loss-recovery
```

The proof requires `PF_RASPBERRY_POWER_LOSS_RECOVERY_EVIDENCE_FILE` with pre-power-loss marker, explicit physical power-loss performed, restored-power detection, boot after restored power, active cron, all three workers resumed, app-running status passed after power loss, stale locks reclaimed, and playback state safe.

The runner never fabricates a power-loss event and does not use Windows CronEmulator evidence as Raspberry hardware proof.
