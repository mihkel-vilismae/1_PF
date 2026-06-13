# Raspberry reboot evidence generator

Version introduced: v0.8.53  
Status: Implemented prepare/collect evidence generator / manual reboot required

Prepare before reboot:

```bash
npm run proof:raspberry-reboot-evidence -- --prepare
```

After the operator manually reboots the Raspberry, collect evidence:

```bash
npm run proof:raspberry-reboot-evidence -- --collect
```

Collect mode writes a `PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE=...` assignment that can be used with:

```bash
PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE=<generated file> npm run proof:raspberry-reboot-recovery
```

The generator does not reboot automatically and does not claim physical power-loss recovery.
