# Download manifest overlap check proof

Command:

```bash
npm run proof:download-manifest-overlap-check
```

This proof validates the local no-loop/no-overlap checker. It fails when batch 2 repeats batch 1 source IDs, file hashes, or filenames, and it fails when the compared batches use different filter signatures.

This proof does not download files. It is the comparison contract later live iCloud batch proofs must satisfy.
