# ACR Usage Ledger OpenSpec

## Decision

`ACR_USAGE_LEDGER_READY` means the repository has a small runtime ledger for future ACR command usage and a proof that user-called and assistant-automatic counts remain separate.

## Data contract

Ledger file:

```text
runtime_data/workflow/acr-command-usage.jsonl
```

Each JSONL row contains:

| Field | Required | Meaning |
|---|---:|---|
| `timestamp` | yes | ISO timestamp for the usage event. |
| `command` | yes | One of `ACR`, `2XACR`, `3XACR`, `XACR`, `2x2ACR`, `3X2ACR`. |
| `source` | yes | `user_called` or `assistant_automatic`. |
| `scope` | yes | Short workflow scope, such as `batch_refinement`. |
| `project` | yes | Project label, normally `PF_login`. |
| `baselineVersion` | yes | Baseline version known when the event was recorded. |
| `notes` | yes | Short human note, with newlines stripped. |

## Commands

| Script | Purpose |
|---|---|
| `workflow:acr:record` | Appends one validated event to the JSONL ledger. |
| `workflow:acr:summary` | Prints totals by command and source. |
| `proof:workflow-acr-usage-ledger` | Proves recording, normalization, docs, and summary totals. |

## Non-goals

- No terminal UI changes.
- No Demo Mode behavior changes.
- No retroactive chat-history scraping.
- No tracked runtime data committed to Git.
