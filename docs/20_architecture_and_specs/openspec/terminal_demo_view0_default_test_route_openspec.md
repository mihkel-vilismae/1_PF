# Terminal Demo View 0 Default Test Route OpenSpec

## Scope

View `0` is now `map and testing - view 0`.

The default test route is:

```text
0 -> Enter -> Enter -> Enter -> 0A
```

Expected behavior:

- pressing `0` opens View 0;
- pressing `Enter` opens the test-page selector;
- pressing `Enter` accepts default integer `0`;
- pressing `Enter` accepts default character `A`;
- the terminal renders `TEST PAGE 0A`;
- shared JSONL evidence includes `view0_test_page_route_completed` and `TEST_PAGE_ROUTE_READY`.

## Side Effects

Allowed side effect:

- append terminal-demo evidence to `runtime_data/logs/demo/terminal-button-actions.jsonl`.

Forbidden side effects:

- worker calls;
- auth/session access;
- DB writes;
- file copy;
- playback;
- cron.
