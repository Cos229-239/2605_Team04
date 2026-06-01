# Roadmap

## Phase 1 � Repo cleanup and clarity

- Keep the GitHub README clear and current.
- Keep project docs in `docs/`.
- Keep class/reference material in `Documents/`.
- Make the roster prototype easy to run without setup.

## Phase 2 � Roster editor hardening

- Validate required fields before export.
- Add import/upload support for existing roster JSON.
- Add clearer empty states and error messages.
- Keep the JSON schema documented as it changes.

## Phase 3 � Team workflow support

- Improve Discord notification messages.
- Add branch/PR expectations for team members.
- Add examples for common Git mistakes and fixes.

## Phase 4 � Future app structure

If this grows beyond a single prototype page, split the app into obvious files:

- `src/` for app code
- `src/components/` for reusable UI pieces
- `src/data/` for sample data
- `docs/` for project docs
- `tests/` when automated checks exist
