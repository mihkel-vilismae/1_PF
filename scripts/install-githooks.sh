#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"
git config core.hooksPath .githooks
printf '%s\n' 'Configured core.hooksPath to .githooks'
