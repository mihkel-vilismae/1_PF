# OpenSpec — Linux Fedora rehearsal proof target

## Purpose

Fedora is allowed as a Linux rehearsal target for PF_login / PhotoFrame proof work when the Raspberry device is not available. Fedora proof is useful for checking Linux process, tool, scheduler, worker-lock, and product-pipeline behavior before the final Raspberry run.

## Boundary

Fedora proof is not Raspberry v1.0 product proof. A Fedora proof artifact must not satisfy gates that require Raspberry-native playback, Raspberry/device display overlay, Raspberry boot behavior, power-loss recovery, or physical screen observation.

## Required proof vocabulary

Fedora proof commands use `linux_fedora_*` proof kinds and `proof:linux-fedora-*` npm script names. Readiness summaries may classify evidence as:

- `PROVEN`: directly proven by a Fedora command on the current Linux host.
- `REHEARSED`: logic was exercised, but the result is not a Raspberry product claim.
- `NOT_RASPBERRY_PROVEN`: still requires Raspberry/device proof.
- `BLOCKED`: prerequisite missing on the current Fedora/Linux target.

## Fedora proof commands

- `proof:linux-fedora-env-preflight`
- `proof:linux-fedora-tool-checker`
- `proof:linux-fedora-cron-preflight`
- `proof:linux-fedora-worker-singleton-pack`
- `proof:linux-fedora-product-pipeline-rehearsal`
- `proof:linux-fedora-readiness`

## Preserved Raspberry gates

The following remain Raspberry-specific and cannot be replaced by Fedora artifacts:

- `proof:raspberry-native-image-playback`
- `proof:raspberry-native-video-playback`
- `proof:raspberry-address-overlay-device-display`
- `proof:raspberry-v1-readiness`
- real device display/overlay observation
- Raspberry boot/reboot/power-loss recovery evidence

## Acceptance criteria

A Fedora proof implementation passes this OpenSpec when:

1. Fedora proof scripts produce separate `linux_fedora_*` proof kinds.
2. Fedora readiness explicitly reports Raspberry-only gates as `NOT_RASPBERRY_PROVEN`.
3. Existing Raspberry proof commands and release-gate semantics are unchanged.
4. Proof artifacts include non-claims explaining what Fedora cannot prove.
