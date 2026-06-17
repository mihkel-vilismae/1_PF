# Voice AI transcript intake runbook

Status: reusable project-workflow rule  
Introduced: v0.8.129

## Purpose

Voice AI transcripts can contain useful PF_login / PhotoFrame requirements even when the text is messy, repeated, or partially garbled. This runbook defines how to read those transcripts without treating transcription noise as exact specification text.

## Intake rule

When a spoken transcript appears in a PF_login planning or implementation chat:

1. Preserve the underlying intent when it is clear.
2. Label unclear fragments as uncertain instead of inventing detail.
3. Separate product goals from proof contracts, implementation tasks, and non-claims.
4. Prefer app-owned proof artifacts over assistant interpretation when the transcript discusses proof.
5. Keep active immutable baselines and current proof state higher authority than transcript wording.

## Handling garbled fragments

| Fragment type | Handling |
|---|---|
| Clear repeated intent | Consolidate into one requirement. |
| Garbled wording with obvious context | Paraphrase the likely intent and mark the exact wording as uncertain. |
| Garbled wording with safety/proof impact | Ask for clarification or keep it as a deferred item. |
| Profanity/filler/restarts | Ignore as style noise unless it changes priority or risk. |
| Mid-task interruption | State interruption impact briefly, then follow the latest explicit instruction. |

## Output format

A transcript intake summary should include:

- extracted requirements;
- uncertain fragments;
- proof/state implications;
- affected docs/OpenSpec/runbooks;
- implementation slices, if requested;
- explicit non-claims.

## Example from auth checkpoint discussion

The spoken auth-checkpoint idea should be normalized as:

```text
The app records an auth-needed/login-ready state.
The operator performs manual login.
The app/proof runner records a sanitized session-usable artifact.
Later real-provider/download proofs consume that artifact.
The assistant can summarize the artifact, but cannot be the proof authority.
```

It should not be normalized as:

```text
The assistant saw a browser console note, so login is proven.
```

## Non-claims

This runbook does not implement auth, iCloud, download, playback, or v1 readiness behavior. It only describes how to turn messy spoken input into safe project requirements and proof-planning notes.
