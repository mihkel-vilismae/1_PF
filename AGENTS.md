# Repository Instructions

## Source File Comment Discipline

- Every source file edited from now on must start with a short comment block, about five lines maximum, describing what the file does.
- Every function edited from now on must have a short leading comment explaining what it does, normally one to five lines.
- Do not retroactively sweep untouched files solely to add comments.
- Before editing a source file, check its file-level comment block first.
- Before editing a function, check whether it already has a comment and read it before changing code.
- After source edits, verify that every edited source file has a top comment block and every edited function has a leading comment.
- This rule does not apply to non-source metadata/support files such as `.gitignore`, package manifests, lockfiles, changelogs, or this instruction file unless explicitly requested.

## UI Version Display

- In apps with distinct frontend and backend parts, the top-right version display must show separate lines for each persistent component, including the component name and version number.
- If other distinct components connect at runtime, such as transient ESP32 devices, add a version line for each connected component while it is present.
- Transient component version lines must be visually distinguishable from persistent component lines, for example with a more muted, secondary, or status-like style.
