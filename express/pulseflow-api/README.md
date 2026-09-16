# PulseFlow API

PulseFlow API is a small Express + TypeScript service for managing routines, habits, and sub-tasks. The project follows a layered architecture composed of routing, validation middleware, controllers, business logic services, and a local JSON datastore. It is designed to demonstrate practical patterns for request validation, centralized error handling, and nested resource management in a REST API.

## 1. Project status

This repository is currently functional and includes:

- Express 5 application initialized in ES module mode
- TypeScript source files compiled at runtime with `tsx`
- Zod-based schemas and runtime validation
- JSON persistence through file reads and writes
- Request logging middleware
- Global error middleware for application-level failures
- Integration tests with Jest + SuperTest covering successful and failed scenarios

The implementation is not a generic CRUD template; it is a domain-specific API for a hierarchical routine model:

```text
Routine
└── Habit
    └── SubTask
```

Each node can hold a `completionDates` list in `YYYY-MM-DD` format. The service also propagates completion status to parents when a child is toggled, so a complete sub-task marks the parent habit and the routine as complete for the same date.

## 2. Stack and runtime

### Core dependencies

- `express` — HTTP server and routing
- `cors` — CORS support
- `zod` — schema validation and parsing
- `tsx` — TypeScript runtime execution during development

### Development/testing dependencies

- `jest` — test runner
- `ts-jest` — TypeScript execution inside Jest
- `supertest` — HTTP-level integration tests

### Runtime configuration

The application starts via:

```bash
npm install
npm run dev
```

The server listens on port `3000` by default, unless `PORT` is set:

```bash
PORT=4000 npm run dev
```

To run the integration suite:

```bash
npm test
```

## 3. Repository structure

```text
pulseflow-api/
├── src/
│   ├── app.ts                         # Express app wiring and middleware registration
│   ├── server.ts                      # HTTP server bootstrap
│   ├── controllers/
│   │   └── routines.controller.ts     # Request handlers and response shaping
│   ├── database/
│   │   ├── connection.db.ts           # JSON file I/O abstraction
│   │   └── routines.db.json           # Data store for routines
│   ├── middlewares/
│   │   ├── error-handler.middleware.ts # Global error response layer
│   │   ├── logger.middleware.ts       # Request logging middleware
│   │   └── validate-routine.middleware.ts # Request validation middleware
│   ├── router/
│   │   └── router.ts                  # Route registration and method mapping
│   ├── services/
│   │   └── routines.service.ts        # Business logic and mutation rules
│   ├── types/
│   │   └── routines.types.ts          # Zod schemas, inferred types, constants
│   └── utils/
│       ├── stateful-error.utils.ts    # Custom application error class
│       └── zod-errors-formater.utils.ts # Validation issue formatter
├── tests.ts                          # End-to-end HTTP tests
├── package.json                      # Scripts and dependencies
├── tsconfig.json                     # TypeScript config
└── README.md                         # Project documentation
```

## 4. Data model

The database is a JSON array of routines. Each routine contains an array of habits, and each habit contains an array of sub-tasks. IDs are not stored in separate maps; they are resolved by iterating the collection and comparing the `id` field.

### Routine schema

| Field             | Type       | Rules                                                         |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `id`              | `string`   | Optional on create; generated automatically                   |
| `title`           | `string`   | 3 to 40 characters, trimmed, unique within routine collection |
| `habits`          | `Habit[]`  | Must contain at least 1 and at most 15 habits                 |
| `completionDates` | `string[]` | ISO date strings, unique values                               |

### Habit schema

| Field             | Type        | Rules                                        |
| ----------------- | ----------- | -------------------------------------------- |
| `id`              | `string`    | Optional on create; generated automatically  |
| `title`           | `string`    | 3 to 50 characters, unique within a routine  |
| `category`        | `string`    | Must be one of the predefined categories     |
| `subTasks`        | `SubTask[]` | Max 10 items, unique titles within the habit |
| `completionDates` | `string[]`  | ISO date strings, unique values              |

Allowed categories:

- `Health`
- `Studies`
- `Work`
- `Finance`
- `Personal`
- `Productivity`

### Sub-task schema

| Field             | Type       | Rules                                       |
| ----------------- | ---------- | ------------------------------------------- |
| `id`              | `string`   | Optional on create; generated automatically |
| `title`           | `string`   | 2 to 60 characters, unique within a habit   |
| `completionDates` | `string[]` | ISO date strings, unique values             |

## 5. Validation rules currently enforced

The current implementation validates the following constraints:

- Title length and non-empty strings
- Unique identifiers within the same resource collection
- Unique titles within each sibling collection
- Duplicate completion dates are rejected
- Habit categories must match a predefined enum
- Routine must contain at least one habit and no more than 15
- Habit must contain no more than 10 sub-tasks
- `Content-Type` must be exactly `application/json` for mutation routes
- Parent resources are validated after mutation to ensure structural consistency

## 6. Request lifecycle: from HTTP request to response

The application is wired in `src/app.ts` as follows:

```ts
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);
app.use(router);
app.use(errorHandlerMiddleware);
```

The actual execution path for a successful request is:

1. A request arrives at the Express app.
2. `express.json()` parses the JSON body into `req.body`.
3. `loggerMiddleware` logs the request.
4. `router` matches the path and method.
5. Validation middleware runs for mutation routes and checks both body structure and `Content-Type`.
6. Controller extracts `req.params` and delegates to the service.
7. Service reads the current database, resolves the target resource, validates IDs/titles/mutations, and updates in-memory data.
8. Database writer persists the result to `src/database/routines.db.json`.
9. Controller serializes the final response.
10. If an error is thrown, `errorHandlerMiddleware` converts it to a JSON response with status and code.

## 7. Routing and endpoint catalog

The API is mounted at the root path `/`. All data-changing routes require the JSON content type and a valid body.

| Method   | Route                                                           | Purpose                              |
| -------- | --------------------------------------------------------------- | ------------------------------------ |
| `GET`    | `/`                                                             | List all routines                    |
| `POST`   | `/`                                                             | Create a routine                     |
| `GET`    | `/:routineId`                                                   | Read a routine                       |
| `PATCH`  | `/:routineId`                                                   | Update a routine title               |
| `DELETE` | `/:routineId`                                                   | Delete a routine                     |
| `POST`   | `/:routineId/toggle-today`                                      | Toggle routine completion for today  |
| `GET`    | `/:routineId/habits`                                            | List habits in a routine             |
| `POST`   | `/:routineId/habits`                                            | Create a habit                       |
| `GET`    | `/:routineId/habits/:habitId`                                   | Read a habit                         |
| `PATCH`  | `/:routineId/habits/:habitId`                                   | Update a habit                       |
| `DELETE` | `/:routineId/habits/:habitId`                                   | Delete a habit                       |
| `POST`   | `/:routineId/habits/:habitId/toggle-today`                      | Toggle habit completion for today    |
| `GET`    | `/:routineId/habits/:habitId/sub-tasks`                         | List sub-tasks                       |
| `POST`   | `/:routineId/habits/:habitId/sub-tasks`                         | Create a sub-task                    |
| `GET`    | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Read a sub-task                      |
| `PATCH`  | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Update a sub-task                    |
| `DELETE` | `/:routineId/habits/:habitId/sub-tasks/:subTaskId`              | Delete a sub-task                    |
| `POST`   | `/:routineId/habits/:habitId/sub-tasks/:subTaskId/toggle-today` | Toggle sub-task completion for today |

## 8. Route-by-route flow and failure analysis

### 8.1 Root routes

#### `GET /`

Flow:

- Router matches `GET /`.
- Controller calls `RoutinesService.read(true)` with no `routineId`.
- Service reads the database and returns the full `Database` array.
- Response: `200 OK` with the array of routines.

Possible failures:

- `DATABASE_CONNECTION_FAILED` — if reading the JSON file fails.
- `DATABASE_WRITE_FAILED` — not applicable to reads, but possible if a later write fails.
- `INTERNAL_SERVER_ERROR` — any unexpected exception in Express/middleware path.

#### `POST /`

Flow:

- Router matches `POST /` and applies `validateRoutineMiddleware(routineSchema)`.
- Middleware checks `Content-Type` equals `application/json`.
- Zod validates the routine payload and transforms default values.
- Controller calls `RoutinesService.create(dto)`.
- Service reads the DB, checks whether the incoming `id` and `title` are unique at the root level, inserts the new routine, validates the parent resource, then writes the file.
- Response: `201 Created` with payload shaped like:

```json
{
  "code": "ROUTINE_CREATED",
  "message": "The new routine was created successfully",
  "data": {
    "id": "routine-...",
    "title": "Example Routine",
    "habits": [],
    "completionDates": []
  }
}
```

Possible failures:

- `INVALID_CONTENT_TYPE` — wrong or missing `Content-Type`
- `INVALID_PAYLOAD` — malformed body or rule violation, with `appendix.zodErrors`
- `DUPLICATE_ROUTINE_ID` — repeated identifier at root level
- `DUPLICATE_ROUTINE_TITLE` — repeated title at root level
- `ROUTINE_HABIT_REQUIRED` — empty `habits` array
- `ROUTINE_HABIT_LIMIT_EXCEEDED` — more than 15 habits
- `INVALID_ROUTINE_MUTATION` — the created routine violates structural invariants after insertion
- `DATABASE_WRITE_FAILED` — persistence failed

#### `GET /:routineId`

Flow:

- Router matches `GET /:routineId`.
- Controller resolves `req.params.routineId` and calls `read(false, routineId)`.
- Service verifies that the routine exists.
- It returns the routine object itself, not its children.
- Response: `200 OK` and the routine JSON.

Possible failures:

- `ROUTINE_NOT_FOUND` — routine does not exist
- `DATABASE_CONNECTION_FAILED` — DB could not be read
- `INTERNAL_SERVER_ERROR` — unexpected application failure

#### `PATCH /:routineId`

Flow:

- Router matches `PATCH /:routineId` and validates only `{ title }`.
- Controller calls `RoutinesService.patch({ title }, routineId)`.
- Service locates the routine, verifies it exists, checks title uniqueness among siblings, updates the title, writes the DB, and returns the updated entity.
- Response: `200 OK` with `code: ROUTINE_UPDATED`.

Possible failures:

- `INVALID_CONTENT_TYPE` — body not sent as JSON
- `INVALID_PAYLOAD` — invalid title length or wrong field type
- `ROUTINE_NOT_FOUND` — routine not found
- `DUPLICATE_ROUTINE_TITLE` — title conflicts with another routine
- `DATABASE_WRITE_FAILED` — write operation failed

#### `DELETE /:routineId`

Flow:

- Router matches `DELETE /:routineId`.
- Controller calls `RoutinesService.delete(routineId)`.
- Service validates existence, removes the routine from the database array, and writes the updated JSON.
- Response: `200 OK` with `code: ROUTINE_DELETED`.

Possible failures:

- `ROUTINE_NOT_FOUND` — missing routine
- `DATABASE_WRITE_FAILED` — write failed
- `INTERNAL_SERVER_ERROR` — unhandled exception

#### `POST /:routineId/toggle-today`

Flow:

- Router matches `POST /:routineId/toggle-today`.
- Controller calls `toggleTodaysCompletionDate(routineId)`.
- Service checks existence, toggles the current date in the routine’s `completionDates`, then rewrites the database.
- Response: `200 OK` with `code: COMPLETED_ROUTINE` or `UNCOMPLETED_ROUTINE`.

Important behavior:

- The date is derived from `new Date().toISOString().split("T")[0]`.
- The toggle logic adds or removes the current date, depending on whether it already exists.

Possible failures:

- `ROUTINE_NOT_FOUND` — target routine missing
- `DATABASE_WRITE_FAILED` — write failed
- `INTERNAL_SERVER_ERROR` — unexpected internal failure

### 8.2 Habit routes

#### `GET /:routineId/habits`

Flow:

- Router matches `GET /:routineId/habits`.
- Controller calls `RoutinesService.read(true, routineId)`.
- Service ensures the routine exists and returns `routine.habits`.
- Response: `200 OK` with the habit array.

Possible failures:

- `ROUTINE_NOT_FOUND`
- `DATABASE_CONNECTION_FAILED`

#### `POST /:routineId/habits`

Flow:

- Router matches `POST /:routineId/habits` and applies `validateRoutineMiddleware(habitSchema)`.
- Middleware ensures JSON body and validates `title`, `category`, optional `subTasks`, and `completionDates`.
- Controller calls `RoutinesService.create(dto, routineId)`.
- Service resolves the routine, checks `id` and `title` uniqueness among habits, appends the habit, validates the parent routine mutation, and writes the file.
- Response: `201 Created` with `code: HABIT_CREATED`.

Possible failures:

- `INVALID_CONTENT_TYPE`
- `INVALID_PAYLOAD` with zod issue codes such as `HABIT_TITLE_REQUIRED`, `INVALID_HABIT_CATEGORY`, `HABIT_TITLE_TOO_SHORT`, `DUPLICATE_HABIT_TITLE`, `HABIT_SUB-TASK_LIMIT_EXCEEDED`
- `ROUTINE_NOT_FOUND`
- `DUPLICATE_HABIT_ID`
- `DUPLICATE_HABIT_TITLE`
- `INVALID_ROUTINE_MUTATION` — if the routine becomes structurally invalid
- `DATABASE_WRITE_FAILED`

#### `GET /:routineId/habits/:habitId`

Flow:

- Router matches `GET /:routineId/habits/:habitId`.
- Controller calls `RoutinesService.read(false, routineId, habitId)`.
- Service resolves the habit under the routine and returns it.
- Response: `200 OK` with the habit resource.

Possible failures:

- `ROUTINE_NOT_FOUND` — missing routine
- `HABIT_NOT_FOUND` — missing habit within routine
- `DATABASE_CONNECTION_FAILED`

#### `PATCH /:routineId/habits/:habitId`

Flow:

- Router matches `PATCH /:routineId/habits/:habitId` and validates only `title` and optional `category`.
- Controller calls `RoutinesService.patch(dto, routineId, habitId)`.
- Service checks habit existence, ensures unique title if present, updates the target fields, writes DB, returns updated habit.
- Response: `200 OK` with `code: HABIT_UPDATED`.

Possible failures:

- `INVALID_CONTENT_TYPE`
- `INVALID_PAYLOAD`
- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `DUPLICATE_HABIT_TITLE`
- `DATABASE_WRITE_FAILED`

#### `DELETE /:routineId/habits/:habitId`

Flow:

- Router matches `DELETE /:routineId/habits/:habitId`.
- Controller calls `delete(routineId, habitId)`.
- Service resolves the habit and removes it from the routine’s `habits` array.
- It validates the parent routine after removal to ensure it still contains at least one habit.
- Response: `200 OK` with `code: HABIT_DELETED`.

Possible failures:

- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `INVALID_ROUTINE_MUTATION` — last habit deletion attempts to violate routine minimum size
- `DATABASE_WRITE_FAILED`

#### `POST /:routineId/habits/:habitId/toggle-today`

Flow:

- Controller calls `toggleTodaysCompletionDate(routineId, habitId)`.
- Service checks the habit, toggles its own date, then also recalculates parent routine state based on child dates.
- Response: `200 OK` with `code: COMPLETED_HABIT` or `UNCOMPLETED_HABIT`.

Possible failures:

- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `DATABASE_WRITE_FAILED`

### 8.3 Sub-task routes

#### `GET /:routineId/habits/:habitId/sub-tasks`

Flow:

- Router matches `GET /:routineId/habits/:habitId/sub-tasks`.
- Controller calls `read(true, routineId, habitId)`.
- Service resolves the habit and returns `habit.subTasks`.
- Response: `200 OK` with the sub-task array.

Possible failures:

- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `DATABASE_CONNECTION_FAILED`

#### `POST /:routineId/habits/:habitId/sub-tasks`

Flow:

- Router applies `validateRoutineMiddleware(subTaskSchema)`.
- Controller calls `RoutinesService.create(dto, routineId, habitId)`.
- Service resolves the habit, checks unique `id` and title within the same habit, pushes the new sub-task, validates the parent habit mutation, and writes the DB.
- Response: `201 Created` with `code: SUB-TASK_CREATED`.

Possible failures:

- `INVALID_CONTENT_TYPE`
- `INVALID_PAYLOAD` with errors like `SUB-TASK_TITLE_REQUIRED`, `SUB-TASK_TITLE_TOO_SHORT`, `DUPLICATE_SUB-TASK_TITLE`, `INVALID_SUB-TASK_COMPLETION_DATES`
- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `DUPLICATE_SUB-TASK_ID`
- `INVALID_HABIT_MUTATION` — the parent habit fails validation after insertion
- `DATABASE_WRITE_FAILED`

#### `GET /:routineId/habits/:habitId/sub-tasks/:subTaskId`

Flow:

- Service resolves the exact sub-task under the target habit and returns it.
- Response: `200 OK` with the sub-task object.

Possible failures:

- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `SUB-TASK_NOT_FOUND`
- `DATABASE_CONNECTION_FAILED`

#### `PATCH /:routineId/habits/:habitId/sub-tasks/:subTaskId`

Flow:

- Router validates `{ title }` using `subTaskSchema.pick({ title: true })`.
- Service resolves the sub-task, checks title uniqueness among siblings, updates only `title`, writes to the DB, and returns the updated sub-task.
- Response: `200 OK` with `code: SUB-TASK_UPDATED`.

Possible failures:

- `INVALID_CONTENT_TYPE`
- `INVALID_PAYLOAD`
- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `SUB-TASK_NOT_FOUND`
- `DUPLICATE_SUB-TASK_TITLE`
- `DATABASE_WRITE_FAILED`

#### `DELETE /:routineId/habits/:habitId/sub-tasks/:subTaskId`

Flow:

- Controller calls `delete(routineId, habitId, subTaskId)`.
- Service removes the sub-task from the habit’s `subTasks` array and validates the parent habit after deletion.
- Response: `200 OK` with `code: SUB-TASK_DELETED`.

Possible failures:

- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `SUB-TASK_NOT_FOUND`
- `INVALID_HABIT_MUTATION` — structure becomes invalid, for example if the mutation validator rejects the result
- `DATABASE_WRITE_FAILED`

#### `POST /:routineId/habits/:habitId/sub-tasks/:subTaskId/toggle-today`

Flow:

- Service toggles the date on the sub-task.
- If the toggle marks the child as complete and all sibling sub-tasks are already complete for the same date, the parent habit updates its own completion date.
- If the habit becomes complete and all of its sibling habits are complete, the routine also records the same date.
- Response: `200 OK` with `code: COMPLETED_SUB-TASK` or `UNCOMPLETED_SUB-TASK`.

Possible failures:

- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `SUB-TASK_NOT_FOUND`
- `DATABASE_WRITE_FAILED`

## 9. Error contract and known error codes

The project uses a centralized `StatefulError` class and converts application errors into explicit HTTP responses. The response envelope is structured as follows:

```json
{
  "code": "INVALID_PAYLOAD",
  "message": "The payload format is not valid",
  "appendix": {
    "zodErrors": {
      "title": "ROUTINE_TITLE_TOO_SHORT"
    }
  }
}
```

The actual implementation stores validation details under `appendix.zodErrors` instead of a top-level `errors` field, which is important when comparing the real behavior to the README or API docs.

### Common HTTP status codes

| Status | Meaning                                     |
| ------ | ------------------------------------------- |
| `200`  | Read, update, delete, or toggle success     |
| `201`  | Resource creation success                   |
| `400`  | Validation errors or invalid `Content-Type` |
| `404`  | Resource or route not found                 |
| `409`  | Duplicate ID or duplicate title             |
| `500`  | Persistence or internal server failure      |

### Error categories

#### Validation and content problems

- `INVALID_CONTENT_TYPE`
- `INVALID_PAYLOAD`
- `INVALID_DATE_TYPE`
- `INVALID_DATE_FORMAT`
- `INVALID_HABIT_CATEGORY`
- `ROUTINE_TITLE_REQUIRED`
- `ROUTINE_TITLE_EMPTY`
- `ROUTINE_TITLE_TOO_SHORT`
- `ROUTINE_TITLE_TOO_LONG`
- `HABIT_TITLE_REQUIRED`
- `HABIT_TITLE_EMPTY`
- `HABIT_TITLE_TOO_SHORT`
- `HABIT_TITLE_TOO_LONG`
- `SUB-TASK_TITLE_REQUIRED`
- `SUB-TASK_TITLE_EMPTY`
- `SUB-TASK_TITLE_TOO_SHORT`
- `SUB-TASK_TITLE_TOO_LONG`

#### Resource existence and duplication

- `ROUTINE_NOT_FOUND`
- `HABIT_NOT_FOUND`
- `SUB-TASK_NOT_FOUND`
- `ROUTE_NOT_FOUND`
- `DUPLICATE_ROUTINE_ID`
- `DUPLICATE_HABIT_ID`
- `DUPLICATE_SUB-TASK_ID`
- `DUPLICATE_ROUTINE_TITLE`
- `DUPLICATE_HABIT_TITLE`
- `DUPLICATE_SUB-TASK_TITLE`

#### Collection and mutation validation

- `ROUTINE_HABIT_REQUIRED`
- `ROUTINE_HABIT_LIMIT_EXCEEDED`
- `HABIT_SUB-TASK_LIMIT_EXCEEDED`
- `DUPLICATE_ROUTINE_HABIT_TITLE`
- `DUPLICATE_HABIT_SUB-TASK_TITLE`
- `INVALID_ROUTINE_MUTATION`
- `INVALID_HABIT_MUTATION`
- `INVALID_SUB-TASK_MUTATION`

#### Persistence and infrastructure

- `DATABASE_CONNECTION_FAILED`
- `DATABASE_WRITE_FAILED`
- `INTERNAL_SERVER_ERROR`

## 10. Important implementation observations

This project is a practical example of a layered API, but it does have a few design details worth noting:

- The database is a local JSON file, not a relational or document database.
- Validation is strict and ties business constraints to schema rules.
- `toggle-today` uses direct date computation from the current system timezone/ISO value, so behavior depends on the server clock and locale.
- The service automatically validates parent resources after child creation or deletion.
- Unknown routes are handled by a final `router.use(RoutinesController.notFound)`, not by a dedicated Express 404 fallback.
- The middleware checks `req.headers["content-type"] !== "application/json"`, which is strict and exact; headers such as `application/json; charset=utf-8` will fail unless the client sets the exact value.

## 11. Test coverage summary

The test suite in `tests.ts` verifies:

- CRUD flows for routines, habits, and sub-tasks
- completion toggling for all resource levels
- propagation of completion dates to parent nodes
- JSON validation failures
- duplicate ID and duplicate title conflicts
- missing routes and missing resources
- failure when a route uses a non-JSON content type

## 12. Conclusion

PulseFlow API is a well-structured example of a small REST API built around domain-driven validation and nested resource management. Its current state reflects a complete request lifecycle from request parsing to middleware validation, service logic, database persistence, and response serialization. The most important design strength is the combination of Zod validation and centralized error handling, while the most important operational limitation is the use of a file-based JSON store rather than a transactional database.

This project is a useful reference for understanding how to model nested resources, enforce consistent validation rules, and centralize API error semantics in a TypeScript Express server.
