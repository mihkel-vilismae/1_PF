# Drag-and-drop repo ZIP installer

## Use

1. Put `start_scripts/packaging/UPDATE_LOCAL_REPO_FROM_ZIP.cmd` in the local repo folder you want to overwrite.
2. Drag the updated repo ZIP from Downloads onto `start_scripts/packaging/UPDATE_LOCAL_REPO_FROM_ZIP.cmd`.
3. Confirm with `Y`.
4. The script:
   - creates a timestamped backup folder,
   - extracts the dropped ZIP,
   - detects the repo root inside the ZIP,
   - mirrors the ZIP contents into the local repo folder,
   - preserves local `.git` metadata,
   - preserves `node_modules` and common build/cache folders.

## Important

The script is designed for Windows.

It overwrites the repo folder where the `.cmd` file is located, so place it carefully.

It creates a backup before overwriting:
`<repo>__backup_before_zip_install_YYYYMMDD-HHMMSS`

## After running

Recommended checks:

```bat
git status
npm install
npm test
```
