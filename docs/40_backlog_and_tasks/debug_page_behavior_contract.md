# Debug Page Behavior Contract

Status: active behavior taxonomy introduced in v0.8.204.

Every Debug page pane and button must be classified before or during implementation.

| Behavior status | Meaning | Allowed output |
|---|---|---|
| `browser-local` | Changes only browser/front-end state. | May update local UI state/history. |
| `mock-only` | Simulates behavior without spawning real work. | May produce mock evidence. |
| `disabled-planned-safe` | Visible target, intentionally inactive. | Must explain missing contract/input. |
| `blocked-needs-contract` | Action is blocked until OpenSpec/proof contract exists. | Should record honest BLOCKED state. |
| `real-provider-runtime` | Calls provider/auth/download/geocode runtime. | Requires explicit proof contract and secret boundary. |
| `real-device-runtime` | Touches Raspberry/display/crontab/worker/device state. | Requires target evidence and operator safety gate. |

## Enforcement

The Debug page should render a behavior registry so the operator can see which category each action belongs to. Tests/proofs should reject new controls that lack a behavior status and non-claim.
