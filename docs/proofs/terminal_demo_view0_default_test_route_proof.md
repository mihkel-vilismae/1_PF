# Terminal Demo View 0 Default Test Route Proof

## Command

```bash
npm run proof:terminal-demo-view0-default-test-route
```

## Proves

- View 0 renders `map and testing - view 0`.
- `0 -> Enter -> Enter -> Enter -> 0A` reaches `TEST PAGE 0A`.
- `runtime_data/logs/demo/terminal-button-actions.jsonl` receives ordered View 0 events.
- The final event is `view0_test_page_route_completed` with `TEST_PAGE_ROUTE_READY`.

## Non-Claims

No debug action, worker, auth, DB write, file copy, playback, or cron behavior is proven.
