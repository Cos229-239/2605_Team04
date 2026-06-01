# TeamLuke 2605

TeamLuke 2605 is the class project workspace for roster setup, Git/GitHub practice, Discord workflow notifications, and beginner-friendly project documentation.

The current app surface is a standalone **Roster Editor V2 prototype**. It lets a class team edit roster-style JSON in the browser, test team/student data flows, and export a future-ready roster file for later automation.

## What is included

- `index.html` - standalone browser prototype for editing/exporting roster JSON.
- `roster-v2-sample.json` - sample V2 roster data shape.
- `.github/workflows/discord.yml` - GitHub Actions workflow for Discord push/status notifications.
- `.github/discord-notify.json` - notification configuration.
- `Documents/` - existing course notes, Git guides, Trello walkthroughs, links, and Kotlin cheat sheets.
- `docs/` - clean project-facing docs for GitHub readers.

## Current project status

This repo is in an early class-project/prototype phase. The priority is to keep it easy for teammates to understand, clone, edit, branch, push, and review.

| Area | Status | Notes |
| --- | --- | --- |
| Roster editor prototype | Active | Static HTML/JS; no backend required. |
| Roster V2 data shape | Drafted | See `roster-v2-sample.json`. |
| Discord notifications | Configured | Requires repo secret/variable setup. |
| Beginner docs | Active | Existing material lives in `Documents/`; curated docs live in `docs/`. |
| Production app build | Not started | Future work should split code into obvious files before it grows. |

## Start here

If you are new to the repo:

1. Read `docs/PROJECT_OVERVIEW.md`.
2. Open `index.html` in a browser.
3. Load the sample roster.
4. Make a small change.
5. Download the JSON export.
6. Read `docs/DEVELOPER_WORKFLOW.md` before committing.

## Local use

No install step is required for the current prototype.

```bash
# From the repo root, open index.html in your browser.
# Windows PowerShell example:
start index.html
```

## GitHub workflow

Recommended branch flow:

```bash
git checkout main
git pull
git checkout -b feature/short-description
# make edits
git status
git add .
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Then open a pull request back into `main`.

## Documentation

- `docs/PROJECT_OVERVIEW.md` - what this repo is and how the pieces fit.
- `docs/DEVELOPER_WORKFLOW.md` - safe edit/check/commit workflow.
- `docs/ROADMAP.md` - near-term project direction.
- `docs/ROSTER_SCHEMA.md` - current roster JSON shape.
- `docs/DISCORD_NOTIFICATIONS.md` - how the GitHub-to-Discord workflow is intended to work.
- `docs/REPO_STRUCTURE.md` - map of important folders/files.

Existing class/course documents remain under `Documents/`.

## Safety notes

- Do not commit real student private contact info unless the class/instructor has explicitly approved that use.
- Do not commit secrets, tokens, `.env` files, Discord webhooks, or private credentials.
- Keep sample data fake or intentionally sanitized.
- Use pull requests for shared work so the team can review changes before they land.

## Maintainers

TeamLuke / COS 229-239 class project contributors.
