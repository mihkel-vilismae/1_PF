# Drag-and-drop repo ZIP installer

> Current checkpoint: `v0.10.67`. This README is refreshed with the current root launcher/database/V2 recovery/proof-gate state.

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
type VERSION
node -p "require('./package.json').version"
npm install
npm test
```

For this checkpoint, `VERSION`, `package.json`, and `package-lock.json` should all report `0.10.67`. The V2 dashboard now includes the integrated `09 REAL PLAYBACK` layout/projection and B12 proof gate; target-machine proof claims still require current proof artifacts.

## Current repository layout reminders

After applying an updated ZIP, the current launcher and database layout is:

```text
start_scripts/windows/START_WIN.PS1
start_scripts/raspberry/START_RASPBERRYOS.SH
database/schema.sql
```

The updater preserves local `.git` metadata and local runtime/build folders. It does not recreate or delete an existing SQLite DB. Run launcher/database checks after updating if the ZIP changed schema or startup files.
