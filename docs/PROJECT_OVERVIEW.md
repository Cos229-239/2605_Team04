# Project Overview

TeamLuke 2605 is a class-project repository focused on three jobs:

1. Keep project/team setup material in one place.
2. Practice a clean Git/GitHub workflow.
3. Prototype roster setup tools that can later feed class automation and reporting.

## Current app surface

The current prototype is `index.html`, a standalone browser page for editing a roster-like JSON model.

It supports:

- Loading sample roster data.
- Adding teams.
- Adding unassigned students.
- Editing student GitHub, Trello, and Discord fields.
- Exporting a V2 roster JSON file.

No backend, package install, or build step is required yet.

## Why this repo is organized this way

The repo separates practical project docs from class reference material:

- `docs/` is for polished project docs that GitHub visitors should read first.
- `Documents/` keeps the existing class/reference guides and cheat sheets.
- `.github/` keeps workflow automation.
- Root files like `README.md`, `index.html`, and `roster-v2-sample.json` stay easy to find.

## Current priorities

- Make the GitHub repo readable and professional.
- Keep the roster prototype simple enough for the whole team to understand.
- Preserve beginner-friendly Git workflow docs.
- Avoid committing private credentials or sensitive student data.
