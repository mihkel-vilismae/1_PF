# Raspberry power-loss recovery proof

This proof is for actual Raspberry Pi recovery after power loss. Windows CronEmulator, source inspection, and local tests are useful preparation, but they are not hardware proof.

On the Raspberry Pi, after a real power interruption and boot restoration, run:

```bash
bash scripts/raspberry_power_loss_recovery_check.sh
```

Then collect explicit sanitized evidence:

```bash
PF_PROOF_ENABLE_RASPBERRY_RECOVERY=true \
PF_RASPBERRY_POWER_LOSS_PERFORMED=true \
PF_RASPBERRY_WORKERS_STARTED=true \
PF_RASPBERRY_PLAYBACK_SAFE=true \
PF_RASPBERRY_STARTUP_MECHANISM=cron \
node tools/collect-raspberry-recovery-proof.mjs
```

Output is written under ignored `runtime_data/proofs/raspberry_power_loss_recovery_<timestamp>.json`.
