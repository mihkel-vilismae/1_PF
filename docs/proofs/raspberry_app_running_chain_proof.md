# Raspberry app-running PASS chain proof

Version introduced: v0.8.50  
Status: Implemented chain runner / target evidence required

Run:

```bash
npm run proof:raspberry-app-running-chain
```

The chain runs the worker evidence generator, feeds the generated evidence file into the cron worker runtime proof, and then builds the app-running status proof from that same cron proof.

It can return `PASSED` only when all three steps pass in the same run. It remains `BLOCKED` off-target, without managed crontab rows, or when worker evidence is incomplete.

The chain does not install cron, reboot the Raspberry, perform physical power-loss recovery, prove monitor pixels, or prove production iCloud continuation.
