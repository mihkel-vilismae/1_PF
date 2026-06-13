# Raspberry app-running PASS harness

Version introduced: v0.8.52  
Status: Implemented proof-owned harness / Raspberry target required

Run:

```bash
npm run proof:raspberry-app-running-pass
```

The harness is designed to produce complete evidence for `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker` by checking normal invocation, duplicate-skip behavior, cross-worker independence, and stale-lock reclaim before feeding the generated evidence into the app-running chain.

It remains `BLOCKED` off-target and does not claim reboot, physical power-loss recovery, monitor-pixel proof, production iCloud continuation, or real product work for the instrumentation-only regular/screen workers.
