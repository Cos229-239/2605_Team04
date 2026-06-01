# Security

TeamLuke 2605 is a class-project repository. Even so, treat credentials and student information carefully.

## Do not commit

- Discord webhook URLs
- API keys or access tokens
- `.env` files
- Private credentials
- Real student contact details unless explicitly approved by the class/instructor
- Personal information that is not needed for the project

## Sample data

Use fake or sanitized data in examples. The roster prototype should be safe to share publicly unless the repository owner chooses otherwise.

## Reporting a problem

If you find a secret or private data committed by accident:

1. Tell the repo owner/instructor immediately.
2. Remove the exposed data in a new commit.
3. Rotate the exposed secret if one was committed.
4. Do not repost the secret in an issue, PR, screenshot, or Discord message.

## Workflow secrets

The Discord workflow should use GitHub Secrets/Variables only:

- `DISCORD_WEBHOOK` as a secret
- `SUPATEWL_DISCORD_ENABLED` as a variable

Never hard-code those values in repository files.
