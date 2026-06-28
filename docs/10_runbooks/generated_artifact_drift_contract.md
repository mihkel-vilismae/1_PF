# Generated Artifact Drift Contract

Generated proofrunner handoffs must not drift away from the repo identity that produced them.

Static checks must verify:

- generated README/launcher identity text contains the current repo version;
- generated README/launcher identity text contains the current repo HEAD;
- generated README/launcher identity text mentions SHA-256 verification;
- generated README/launcher identity text does not keep known stale handoff versions;
- the handoff manifest contains exactly one full-git repo ZIP and its `.sha256` file;
- the handoff manifest contains both `PROOF_RASPBERRYOS.SH` and `PROOF_WIN.PS1`;
- the handoff manifest contains `README_PROOFRUNNER.md`;
- the handoff manifest does not include expanded repo/runtime noise such as `node_modules`, `runtime_data`, extracted `.git` directories, `package.json`, or `package-lock.json`.
- generated launchers and README must reference the exact repo ZIP name that is present in the handoff manifest.

This is a static pre-proofrunner guard. It does not run Windows or Raspberry proof launchers and does not prove target readiness.

Validation command:

```bash
npm run proof:generated-artifact-drift
```
