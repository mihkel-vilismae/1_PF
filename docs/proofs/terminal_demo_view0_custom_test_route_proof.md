# Terminal Demo View 0 Custom Test Route Proof

## Command

```bash
npm run proof:terminal-demo-view0-custom-test-route
```

## Proves

- View 0 selector accepts typed integer and character input.
- `0 -> Enter -> 7 -> Enter -> D -> Enter -> 7D` reaches `TEST PAGE 7D`.
- `D` is treated as selector character input while the selector owns input.
- The final JSONL event is `view0_test_page_route_completed` with `TEST_PAGE_ROUTE_READY`.

## Non-Claims

No debug action, worker, auth, DB write, file copy, playback, or cron behavior is proven.
