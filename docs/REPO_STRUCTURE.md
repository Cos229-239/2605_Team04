# Repo Structure

```text
.
+-- .github/
�   +-- discord-notify.json
�   +-- workflows/discord.yml
+-- Documents/
�   +-- Existing class notes, Git guides, links, Trello walkthroughs, Kotlin cheat sheets
+-- docs/
�   +-- Project-facing docs for GitHub readers
+-- index.html
+-- roster-v2-sample.json
+-- .gitignore
+-- README.md
```

## Important files

- `README.md` � GitHub landing page.
- `index.html` � current roster editor prototype.
- `roster-v2-sample.json` � sample export/input shape.
- `.gitignore` � protects local junk, build outputs, dependencies, and secrets.
- `.github/workflows/discord.yml` � Discord notification automation.

## Organization rule

If a file helps someone understand the project, put it in `docs/`.
If a file is course/reference material, keep it in `Documents/`.
If a file is app code, keep it outside docs and name it clearly.
