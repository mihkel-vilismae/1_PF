# Terminal Demo Shared Logging OpenSpec

## Purpose

Define one branch-safe terminal action log for terminal-demo View 0, View 6, and existing operator button evidence.

## Contract

Terminal-demo branch actions write JSONL evidence to:

```text
runtime_data/logs/demo/terminal-button-actions.jsonl
```

Events must include:

- `source: "terminal-demo"`
- `view`
- `action`
- `branchFeature`
- `noCron: true`
- `result`

Accepted `branchFeature` values in this merged slice:

- `default_operator`
- `view0_map_testing`
- `view6_fixture_playback`

## View 0 Events

View 0 uses `branchFeature: "view0_map_testing"` for the map/testing route:

- `view0_opened`
- `view0_test_selector_opened`
- `view0_test_integer_selected`
- `view0_test_page_route_completed`

The default route is `0 -> Enter -> Enter -> Enter -> 0A`.

## View 6 Events

View 6 uses `branchFeature: "view6_fixture_playback"` for fixture button placeholder events.

The placeholder result is `CODEX_DEFERRED`; events record `launchesPlayback=false`.

## Non-Claims

Do not create branch-specific top-level terminal action logs. Do not treat these events as proof of real playback, queue execution, worker execution, DB writes, auth, cron, or hardware behavior.
