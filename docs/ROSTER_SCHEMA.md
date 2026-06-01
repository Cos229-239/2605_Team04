# Roster Schema

The current sample roster lives in `roster-v2-sample.json`.

## Top-level shape

```json
{
  "version": "v2",
  "cycle": "2604",
  "teams": [],
  "unassigned": []
}
```

## Team shape

```json
{
  "label": "Team 01",
  "students": []
}
```

## Student shape

```json
{
  "name": "Student Name",
  "github_id": "",
  "github_email": "",
  "trello_email": "",
  "discord_id": ""
}
```

## Data rules

- Keep sample data fake or intentionally sanitized.
- Use empty strings for unknown optional fields.
- Keep `version` updated if the shape changes.
- Prefer adding new fields rather than changing existing field names without team agreement.
