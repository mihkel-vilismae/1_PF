# Windows Project Launcher Skill

Use this skill when adding or changing Windows startup scripts for this repo.

## Rules

- Preserve existing launcher behavior unless the user explicitly asks to replace it.
- Prefer adding a new wrapper over silently changing an existing commonly used script.
- Keep dependency installation explicit and verbose: `npm install --verbose`.
- Run tests before opening long-running API/frontend servers when the user asks for a full launch script.
- Prefer Windows Terminal tabs for paired API/frontend processes, but provide a fallback for machines without `wt.exe`.
- Open the frontend in the default browser only after install/test/build steps complete and server processes are launched.
- Do not log secrets, `.env` contents, provider credentials, cookies, or session data.

## Expected structure

- Root `.cmd` file for double-click usage.
- `start_scripts/` PowerShell implementation for readable logic.
- `HOW_TO_RUN.md` entry that explains when to use the launcher.
