# Discord Notifications

This repo includes a GitHub Actions workflow at `.github/workflows/discord.yml`.

## Purpose

The workflow sends GitHub activity/status messages to Discord so the team can see when branches are updated.

## Required GitHub settings

The workflow expects:

- Secret: `DISCORD_WEBHOOK`
- Variable: `SUPATEWL_DISCORD_ENABLED`

Set `SUPATEWL_DISCORD_ENABLED` to `true` to allow posts. Set it to `false` or remove the webhook to stop posts.

## Safe use

- Never commit the actual webhook URL.
- Keep notification text useful and short.
- If Discord gets noisy, disable the repo variable before deleting workflow code.

## Manual test

Use the workflow dispatch option in GitHub Actions and choose `test` mode.
