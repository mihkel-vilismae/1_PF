# Raspberry screen worker non-blocking OpenSpec

Status: active planning contract  
Introduced: v0.8.69

## Goal

Define the v1 requirement that `screen_on_off_worker` participates in the cron-managed app without blocking the core photo-frame workflow.

## Default scope

Physical screen power control is not a v1 blocker unless the user later changes S1. The v1 proof should focus on:

- worker invocation observed;
- worker exits safely;
- duplicate same-worker invocation skips safely;
- stale lock can be reclaimed;
- regular and playback workers are not blocked by screen worker state.

## Non-claims

- Non-blocking proof does not prove physical monitor power control.
- Screen worker proof does not replace full cron/app-running proof.

## Design pre-pass — v0.8.164

`proof:screen-worker-nonblocking-design` validates a local/mock design before any real scheduler host exists. The pre-pass requires:

- reading screen-worker status does not start a process;
- the screen-worker lane is marked non-blocking;
- regular and playback worker lanes remain available;
- no physical monitor power-control proof is claimed;
- no crontab mutation or Raspberry target pass is claimed.

This pre-pass enables a later target proof, but it is not the target proof itself.
