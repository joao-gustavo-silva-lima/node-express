# PulseFlow API

PulseFlow API is a REST API for managing routines, habits, and habit sub-tasks. It is built with Express.js and TypeScript and demonstrates a modular service-oriented architecture, request validation with Zod, centralized error handling, and a lightweight JSON file database.

## Repository Overview

The API organizes resources hierarchically:

```text
Routine
└── Habits
    └── Sub-tasks
```

Each routine, habit, and sub-task has a completion history represented by an array of dates in `YYYY-MM-DD` format. The API can create, read, update, delete, and toggle today's completion status for these resources.

### Project Structure

```text
pulseflow-api/
├── src/
│   ├── app.ts                              # Express application and middleware setup
│   ├── server.ts                           # HTTP server entry point
│   ├── controllers/
│   │   └── routines.controller.ts           # Request handlers and response formatting
│   ├── database/
│   │   ├── connection.db.ts                 # JSON database read/write operations
│   │   └── routines.db.json                 # Local routines database
│   ├── middlewares/
│   │   ├── error-handler.middleware.ts      # Centralized error responses
│   │   ├── logger.middleware.ts              # HTTP request logging
│   │   └── validate-routine.middleware.ts   # Request payload validation
│   ├── router/
│   │   └── router.ts                        # API route definitions
│   ├── services/
│   │   └── routines.service.ts              # Routine business logic
│   ├── types/
│   │   └── routines.types.ts                # Zod schemas and TypeScript types
│   └── utils/
│       ├── stateful-error.utils.ts           # Application error type
│       └── zod-errors-formater.utils.ts     # Validation error formatting
├── tests.ts                                 # Integration tests with SuperTest
├── package.json                             # Scripts and dependencies
├── tsconfig.json                            # TypeScript configuration
└── README.md
```

## Getting Started

### Requirements

- Node.js with native ES module support
- npm

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

The server starts at `http://localhost:3000` by default. A different port can be provided through the `PORT` environment variable:

```bash
PORT=4000 npm run dev
```

### Run tests

```bash
npm test
```

The integration tests use the application directly and reset the JSON database before each test case.

## Data Model

The database is persisted as a `Routine[]` array, and nested collections such as `habits` and `subTasks` are also arrays rather than object maps keyed by IDs. This makes resource lookup and updates deterministic by matching the item `id` in the collection.

### Routine

| Field             | Type       | Description                                  |
| ----------------- | ---------- | -------------------------------------------- |
| `id`              | `string`   | Optional on creation; generated when omitted |
| `title`           | `string`   | 3 to 40 characters                           |
| `habits`          | `Habit[]`  | At least 1 and at most 15 habits             |
| `completionDates` | `string[]` | Unique dates in `YYYY-MM-DD` format          |

### Habit

| Field             | Type        | Description                                  |
| ----------------- | ----------- | -------------------------------------------- |
| `id`              | `string`    | Optional on creation; generated when omitted |
| `title`           | `string`    | 3 to 50 characters                           |
| `category`        | `string`    | One of the predefined categories             |
| `subTasks`        | `SubTask[]` | At most 10 sub-tasks                         |
| `completionDates` | `string[]`  | Unique dates in `YYYY-MM-DD` format          |

Available categories: `Health`, `Studies`, `Work`, `Finance`, `Personal`, and `Productivity`.

### Sub-task

| Field             | Type       | Description                                  |
| ----------------- | ---------- | -------------------------------------------- |
| `id`              | `string`   | Optional on creation; generated when omitted |
| `title`           | `string`   | 2 to 60 characters                           |
| `completionDates` | `string[]` | Unique dates in `YYYY-MM-DD` format          |

IDs and titles must be unique among resources at the same level. Duplicate completion dates are rejected. When a resource is updated, only the fields that are actually provided are changed, so partial updates such as title-only or category-only patches are valid.

## API Endpoints

The API is mounted at the root path (`/`). Requests that create or update data must use the `Content-Type: application/json` header.

| Method   | Endpoint                                                        | Description                        |
| -------- | --------------------------------------------------------------- | ---------------------------------- |
| `GET`    | `/`                                                             | List all routines                  |
| `POST`   | `/`                                                             | Create a routine                   |
| `GET`    | `/:routineId`                                                   | Get a routine                      |
| `PATCH`  | `/:routineId`                                                   | Update a routine title             |
| `DELETE` | `/:routineId`                                                   | Delete a routine                   |
| `POST`   | `/:routineId/toggle-today`                                      | Toggle today's routine completion  |
| `GET`    | `/:routineId/habits`                                            | List a routine's habits            |
| `POST`   | `/:routineId/habits`                                            | Create a habit in a routine        |
| `GET`    | `/:routineId/habits/:habitId`                                   | Get a habit                        |
| `PATCH`  | `/:routineId/habits/:habitId`                                   | Update a habit title or category   |
| `DELETE` | `/:routineId/habits/:habitId`                                   | Delete a habit                     |
| `POST`   | `/:routineId/habits/:habitId/toggle-today`                      | Toggle today's habit completion    |
| `GET`    | `/:routineId/habits/:habitId/sub-tasks`                         | List a habit's sub-tasks           |
| `POST`   | `/:routineId/habits/:habitId/sub-tasks`                         | Create a sub-task                  |
| `GET`    | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Get a sub-task                     |
| `PATCH`  | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Update a sub-task title            |
| `DELETE` | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Delete a sub-task                  |
| `POST`   | `/:routineId/habits/:habitId/sub-tasks/:subTaskId/toggle-today` | Toggle today's sub-task completion |

## Responses and Errors

Successful create operations return status `201` and include a `code`, `message`, and `data` field. Read operations return the requested resource or collection directly. Update responses include the updated resource in `data`; delete and completion-toggle responses include a success `code` and `message`.

Success response codes are:

- `RESOURCE_CREATED` for resource creation
- `RESOURCE_UPDATED` for resource updates
- `RESOURCE_DELETED` for resource deletion
- `COMPLETION_TOGGLED` for completion changes

Validation and application errors use a consistent JSON format:

```json
{
  "code": "INVALID_PAYLOAD",
  "message": "The payload format is not valid",
  "errors": {}
}
```

Unknown routes return `ROUTE_NOT_FOUND`. Other common error codes include
`INVALID_CONTENT_TYPE`, `ROUTINE_NOT_FOUND`, `HABIT_NOT_FOUND`,
`SUBTASK_NOT_FOUND`, `DUPLICATE_ID`, `DATABASE_CONNECTION_FAILED`,
`DATABASE_WRITE_FAILED`, and `INTERNAL_SERVER_ERROR`.

Common status codes are:

- `200` for successful reads, updates, deletes, and completion toggles
- `201` for successful resource creation
- `400` for malformed payloads or invalid content types
- `404` when a routine, habit, sub-task, or route does not exist
- `409` when an ID or title is already in use
- `500` for database or unexpected server errors

## Architecture and Learning Goals

- **Type safety:** TypeScript types are inferred from Zod schemas.
- **Validation:** Middleware validates incoming JSON before it reaches the controller.
- **Separation of concerns:** Controllers handle HTTP concerns, services contain business rules, and the database connection handles persistence.
- **Centralized errors:** Stateful application errors are converted into consistent HTTP responses.
- **Testability:** SuperTest integration tests exercise the complete route and service flow.

##

**Enjoy Coding**
