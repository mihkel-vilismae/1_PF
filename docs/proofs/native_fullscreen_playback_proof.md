# Native / Fullscreen Playback Proof

## Purpose

This deterministic proof verifies the safe native-player and browser-fullscreen boundaries for PF_login playback. It proves the repository contracts around disabled-by-default native playback, explicit mock-player test configuration, process ownership rules, browser fullscreen overlay behavior, and route separation.

## Command

```bash
npm run proof:native-fullscreen-playback
```

## What it proves

The proof runs targeted repository tests that verify:

1. Native playback is disabled by default.
2. Native playback can use a mock player for deterministic local proof without launching an OS player.
3. Native playback API routes remain separate from browser playback routes.
4. The native playback spec records process ownership and spawn-argument safety boundaries.
5. Browser fullscreen overlay uses backend-served playback media URLs and resolved address text.
6. Browser fullscreen/rotation UI does not add backend mutation shortcuts.

## Safety and boundaries

- The proof is deterministic and local.
- It does not launch `mpv`, `vlc`, or any other native player.
- It does not enter real OS fullscreen.
- It does not touch Raspberry HDMI, monitor focus, or display hardware.
- Runtime proof JSON is written under ignored `runtime_data/proofs/`.

## Pass criteria

The proof passes when the targeted native playback and fullscreen UI tests pass and the required native/fullscreen documentation is present.

## Limitations

This proof does not prove actual OS fullscreen stability, native player process behavior on Windows/Raspberry, HDMI output, focus handling, or long-running slideshow display. Use `proof:live-windows-native-playback` for the opt-in Windows live native playback proof. That proof remains disabled unless explicitly enabled by the operator.
