# API Documentation

## Response format

All endpoints return:

```ts
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

## `GET /api/countries`

Returns country list, continent metadata, and aggregate stats.

### Query params

- `continent` (optional): filter to one continent
- `includeTerritories` (optional, default `true`)

### Example

`/api/countries?continent=Europe&includeTerritories=true`

## `GET /api/session`

- With `?id=<sessionId>` returns one session.
- Without query returns the latest 100 in-memory sessions.

## `POST /api/session`

Saves or updates a session.

```json
{
  "session": {
    "id": "session-1",
    "mode": "survival",
    "region": "Europe",
    "score": 120,
    "streak": 3,
    "completed": ["DEU"],
    "remaining": [],
    "skipped": [],
    "missed": ["FRA"],
    "wrongGuesses": ["ESP"],
    "survivalAttempts": [
      { "targetId": "DEU", "guessId": "DEU", "correct": true },
      { "targetId": "FRA", "guessId": "ESP", "correct": false }
    ],
    "timestamp": "2026-03-09T18:20:00.000Z",
    "elapsedSeconds": 302,
    "order": "sequential",
    "timeLimitSeconds": 600,
    "endReason": "completed"
  }
}
```

### Session fields (summary)

- `mode`: `continent | marathon | survival`
- `order`: `random | sequential`
- `completed`: correctly guessed country ids
- `missed`: survival-mode missed target ids
- `wrongGuesses`: ids of countries guessed incorrectly in survival
- `survivalAttempts`: per-target survival attempts
- `timeLimitSeconds`: survival timer limit (continent based)
- `endReason`: `completed | timeout` (when session is finished)

## `GET /api/session/:id`

Fetches one session from in-memory store.

## `DELETE /api/session/:id`

Deletes a session from in-memory store.

## `GET /api/admin/aliases`

Returns custom alias overrides keyed by country id.

## `POST /api/admin/aliases`

Saves aliases for a country.

```json
{
  "countryId": "USA",
  "aliases": ["United States", "US", "United States of America"]
}
```

## Error handling

- `400`: invalid payload
- `404`: missing resources
- `429`: rate limiting
- `500`: server/internal failures
