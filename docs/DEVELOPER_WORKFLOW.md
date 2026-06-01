# Developer Workflow

Use this workflow before pushing changes.

## 1. Start clean

```bash
git checkout main
git pull
git status
```

If `git status` shows files you did not change, stop and ask the team before editing.

## 2. Create a branch

```bash
git checkout -b feature/short-description
```

Good branch names:

- `feature/roster-export-cleanup`
- `docs/update-git-guide`
- `fix/discord-notify-copy`

## 3. Make a small change

Prefer small, reviewable updates. A teammate should be able to understand the diff quickly.

## 4. Check your work

For the current static prototype:

- Open `index.html` in a browser.
- Load the sample roster.
- Edit one field.
- Download the JSON export.
- Confirm the exported JSON still looks valid.

Also run:

```bash
git status
git diff
```

## 5. Commit clearly

```bash
git add .
git commit -m "Explain what changed"
```

Good commit messages:

- `Improve roster editor landing copy`
- `Document Discord notification setup`
- `Add roster schema notes`

## 6. Push and open a pull request

```bash
git push -u origin your-branch-name
```

Open a pull request into `main` and summarize:

- What changed
- Why it changed
- How you checked it

## Safety rule

Never commit secrets, real tokens, webhook URLs, private credentials, or unnecessary personal student data.
