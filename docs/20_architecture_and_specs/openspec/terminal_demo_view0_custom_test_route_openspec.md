# Terminal Demo View 0 Custom Test Route OpenSpec

## Scope

View `0` accepts a typed integer and character route while the selector owns input.

The custom proof route is:

```text
0 -> Enter -> 7 -> Enter -> D -> Enter -> 7D
```

Expected behavior:

- pressing `0` opens View 0;
- pressing `Enter` opens the selector;
- pressing `7` records integer input;
- pressing `Enter` accepts integer `7`;
- pressing `D` records character input instead of switching to the default operator view;
- pressing `Enter` renders `TEST PAGE 7D`;
- shared JSONL evidence includes `view0_test_page_route_completed` and `TEST_PAGE_ROUTE_READY`.

## Non-Claims

This is terminal-demo route state only. It does not implement debug actions, workers, auth, DB mutation, playback, file copy, or cron.
