# PulseFlow API

PulseFlow is a small REST API for organizing routines, habits, and sub-tasks:

```text
Routine
└── Habit
    └── Sub-task
```

It is built with Express and TypeScript, validates request payloads with Zod, and persists data in a local JSON file. Completion is tracked by date and can be propagated from children to their parents.

## Requirements

- Node.js with npm

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The API is available at `http://localhost:3000`. Set `PORT` to use another port:

```bash
PORT=4000 npm run dev
```

The development command uses `tsx watch`, so changes to TypeScript files restart the server automatically.

## Scripts

| Command       | Description                                   |
| ------------- | --------------------------------------------- |
| `npm run dev` | Starts the server in watch mode               |
| `npm test`    | Runs the Jest and SuperTest integration suite |

Tests reset `src/database/routines.db.json` before each test and restore it afterward.

## Architecture

```text
src/
├── app.ts                         Express app, CORS, JSON parser and middleware
├── server.ts                      HTTP server bootstrap and PORT configuration
├── controllers/
│   └── routines.controller.ts     HTTP handlers and response envelopes
├── database/
│   ├── connection.db.ts            JSON file read/write abstraction
│   └── routines.db.json            Local data store
├── middlewares/
│   ├── error-handler.middleware.ts Centralized error responses
│   ├── logger.middleware.ts        Request logging
│   └── validate-routine.middleware.ts
├── router/router.ts                Route registration
├── services/routines.service.ts   Resource and completion business rules
├── types/routines.types.ts         Zod schemas and inferred TypeScript types
└── utils/                         Application error and validation helpers
```

The application registers middleware in this order: CORS, JSON parsing, request logging, routes, and the error handler. Unknown routes are handled by the router with a `ROUTE_NOT_FOUND` response.

## Data model

Every resource has an `id`, a title, and a `completionDates` array. Dates use the `YYYY-MM-DD` format.

### Routine

| Field             | Type       | Rules                                               |
| ----------------- | ---------- | --------------------------------------------------- |
| `id`              | `string`   | Optional on creation; generated as `routine-<uuid>` |
| `title`           | `string`   | Required, trimmed, 3-40 characters                  |
| `habits`          | `Habit[]`  | Required; 1-15 items with unique titles             |
| `completionDates` | `string[]` | Optional; unique ISO calendar dates                 |

### Habit

| Field             | Type        | Rules                                                                     |
| ----------------- | ----------- | ------------------------------------------------------------------------- |
| `id`              | `string`    | Optional on creation; generated as `habit-<uuid>`                         |
| `title`           | `string`    | Required, trimmed, 3-50 characters                                        |
| `category`        | `string`    | One of `Health`, `Studies`, `Work`, `Finance`, `Personal`, `Productivity` |
| `subTasks`        | `SubTask[]` | Optional; defaults to an empty array and allows up to 10 items            |
| `completionDates` | `string[]`  | Optional; unique ISO calendar dates                                       |

### Sub-task

| Field             | Type       | Rules                                                |
| ----------------- | ---------- | ---------------------------------------------------- |
| `id`              | `string`   | Optional on creation; generated as `sub-task-<uuid>` |
| `title`           | `string`   | Required, trimmed, 2-60 characters                   |
| `completionDates` | `string[]` | Optional; unique ISO calendar dates                  |

IDs and titles must be unique among siblings. Title comparisons for uniqueness are case-insensitive and ignore surrounding whitespace.

## API

The API has no version prefix. All paths below are relative to `http://localhost:3000`.

### Routines

| Method   | Path                       | Description                              | Success |
| -------- | -------------------------- | ---------------------------------------- | ------- |
| `GET`    | `/`                        | Lists all routines                       | `200`   |
| `POST`   | `/`                        | Creates a routine                        | `201`   |
| `GET`    | `/:routineId`              | Gets one routine                         | `200`   |
| `PATCH`  | `/:routineId`              | Updates the routine title                | `200`   |
| `DELETE` | `/:routineId`              | Deletes a routine                        | `200`   |
| `POST`   | `/:routineId/toggle-today` | Toggles completion for the current date  | `200`   |
| `POST`   | `/:routineId/toggle-date`  | Toggles completion for the supplied date | `200`   |

### Habits

| Method   | Path                                       | Description                              | Success |
| -------- | ------------------------------------------ | ---------------------------------------- | ------- |
| `GET`    | `/:routineId/habits`                       | Lists a routine's habits                 | `200`   |
| `POST`   | `/:routineId/habits`                       | Creates a habit                          | `201`   |
| `GET`    | `/:routineId/habits/:habitId`              | Gets one habit                           | `200`   |
| `PATCH`  | `/:routineId/habits/:habitId`              | Updates title and/or category            | `200`   |
| `DELETE` | `/:routineId/habits/:habitId`              | Deletes a habit                          | `200`   |
| `POST`   | `/:routineId/habits/:habitId/toggle-today` | Toggles completion for the current date  | `200`   |
| `POST`   | `/:routineId/habits/:habitId/toggle-date`  | Toggles completion for the supplied date | `200`   |

### Sub-tasks

| Method   | Path                                                            | Description                              | Success |
| -------- | --------------------------------------------------------------- | ---------------------------------------- | ------- |
| `GET`    | `/:routineId/habits/:habitId/sub-tasks`                         | Lists a habit's sub-tasks                | `200`   |
| `POST`   | `/:routineId/habits/:habitId/sub-tasks`                         | Creates a sub-task                       | `201`   |
| `GET`    | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Gets one sub-task                        | `200`   |
| `PATCH`  | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Updates the title                        | `200`   |
| `DELETE` | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Deletes a sub-task                       | `200`   |
| `POST`   | `/:routineId/habits/:habitId/sub-tasks/:subTaskId/toggle-today` | Toggles completion for the current date  | `200`   |
| `POST`   | `/:routineId/habits/:habitId/sub-tasks/:subTaskId/toggle-date`  | Toggles completion for the supplied date | `200`   |

## Request examples

### Create a routine

`POST /`

```http
Content-Type: application/json
```

```json
{
  "title": "Morning routine",
  "habits": [
    {
      "title": "Exercise",
      "category": "Health"
    }
  ]
}
```

The response is an envelope. IDs and omitted `completionDates` are generated/defaulted by the schema:

```json
{
  "code": "ROUTINE_CREATED",
  "message": "The new routine was created successfully",
  "data": {
    "id": "routine-...",
    "title": "Morning routine",
    "habits": [
      {
        "id": "habit-...",
        "title": "Exercise",
        "category": "Health",
        "subTasks": [],
        "completionDates": []
      }
    ],
    "completionDates": []
  }
}
```

### Create a habit or sub-task

The payload follows the corresponding resource schema. An optional `date` can be sent on child creation to recalculate completion dates for its parents.

```json
{
  "title": "Read a book",
  "category": "Studies",
  "date": "2026-09-24"
}
```

`date` is a request control field; it is not stored inside the created resource.

### Update a resource

```http
PATCH /routine-id/habits/habit-id
Content-Type: application/json
```

```json
{
  "title": "Read technical books",
  "category": "Studies"
}
```

Routine and sub-task updates accept only `title`. Habit updates accept `title`, `category`, or both.

### Toggle a date

Use `toggle-today` with an empty body, or `toggle-date` with an exact ISO date:

```http
POST /routine-id/habits/habit-id/toggle-date
Content-Type: application/json
```

```json
{
  "date": "2026-09-24"
}
```

The response does not return the resource. It reports the resulting state:

```json
{
  "code": "COMPLETED_HABIT",
  "message": "The habit with ID 'habit-id' was marked as 'completed'"
}
```

When a child is completed, the service marks a parent complete only when all of its children are complete for that date. The same rule is recalculated when a child is uncompleted, created, or deleted.

### Delete a resource for a specific date

Deletion normally recalculates completion using today. To recalculate another date, send an optional body:

```http
DELETE /routine-id/habits/habit-id/sub-tasks/sub-task-id
Content-Type: application/json
```

```json
{
  "date": "2026-09-24"
}
```

## Responses and errors

Collection and single-resource `GET` routes return the resource directly. Mutating routes return an envelope such as:

```json
{
  "code": "HABIT_UPDATED",
  "message": "The habit with ID 'habit-id' was updated successfully",
  "data": {}
}
```

Delete and toggle responses omit `data`.

Validation and application errors use this shape:

```json
{
  "code": "INVALID_PAYLOAD",
  "message": "The payload format is not valid",
  "appendix": {
    "zodErrors": {
      "title": "HABIT_TITLE_TOO_SHORT"
    }
  }
}
```

| Status | Typical codes                                                                                 |
| ------ | --------------------------------------------------------------------------------------------- |
| `400`  | `INVALID_CONTENT_TYPE`, `INVALID_PAYLOAD`, collection/mutation validation errors              |
| `404`  | `ROUTE_NOT_FOUND`, `ROUTINE_NOT_FOUND`, `HABIT_NOT_FOUND`, `SUB-TASK_NOT_FOUND`               |
| `409`  | `DUPLICATE_ROUTINE_ID`, `DUPLICATE_HABIT_ID`, `DUPLICATE_SUB-TASK_ID`, duplicate title errors |
| `500`  | `DATABASE_CONNECTION_FAILED`, `DATABASE_WRITE_FAILED`, `INTERNAL_SERVER_ERROR`                |

Mutation routes require the exact `Content-Type: application/json` header. `toggle-today` and delete routes may use an empty body; `toggle-date` requires a valid `date` field.

## Persistence and limitations

- Data is stored in `src/database/routines.db.json`.
- There is no database server, migration system, authentication, or authorization layer.
- Writes replace the JSON file and are not transactional.
- The server uses the current system clock to calculate `toggle-today` dates with UTC ISO formatting.
- The JSON file is part of the repository and contains sample data.

## Tests

The integration suite in `tests.ts` uses Jest and SuperTest against the Express app without opening a network port. It covers:

- creation, reading, updates, and deletion at all resource levels;
- validation, duplicate IDs/titles, and content-type failures;
- unknown routes and missing resources;
- current-date and arbitrary-date completion toggles;
- propagation of completion state through sub-task, habit, and routine parents.

Run it with:

```bash
npm test
```
