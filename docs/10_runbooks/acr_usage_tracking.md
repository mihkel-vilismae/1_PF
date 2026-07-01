# ACR Usage Tracking Runbook

## Purpose

Track future ACR-style workflow usage without guessing from chat history. The ledger records when an ACR command is intentionally used by the operator or by the assistant workflow.

## Ledger path

```text
runtime_data/workflow/acr-command-usage.jsonl
```

This is runtime evidence and remains ignored by Git.

## Commands tracked

| Command | Meaning |
|---|---|
| `ACR` | One Analyze / Compare / Recommend pass. |
| `2XACR` | Two ACR passes. |
| `3XACR` | Three ACR passes. |
| `XACR` | Architecture-aware ACR pass. |
| `2x2ACR` | Two rounds of two-pass ACR. |
| `3X2ACR` | Three rounds of two-pass ACR. |

## Source values

| Source | Meaning |
|---|---|
| `user_called` | The user explicitly asked for this ACR command. |
| `assistant_automatic` | The assistant ran the ACR command as part of an agreed workflow. |

## Record an event

```bash
npm run workflow:acr:record -- \
  --command XACR \
  --source user_called \
  --scope acr_usage_tracking_analysis \
  --project PF_login \
  --baselineVersion 2.0.8 \
  --notes "user requested ACR usage counting analysis"
```

## Print the summary

```bash
npm run workflow:acr:summary
```

Expected table shape:

| Command | User-called | Assistant automatic | Total |
|---|---:|---:|---:|
| `ACR` | 0 | 0 | 0 |
| `2XACR` | 0 | 0 | 0 |
| `3XACR` | 0 | 0 | 0 |
| `XACR` | 1 | 0 | 1 |
| `2x2ACR` | 0 | 0 | 0 |
| `3X2ACR` | 0 | 0 | 0 |

## Boundary

This tracker is reliable from the point it is used. It does not claim perfect retroactive counts from old chat history.
