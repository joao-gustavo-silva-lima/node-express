# Orbita API

Orbita API is a REST API for user accounts and personal links. It is built with Express 5 and TypeScript, validates request payloads with Zod, persists data through Prisma and PostgreSQL, and authenticates users with JSON Web Tokens stored in an HTTP-only cookie.

## Requirements

- Node.js and npm
- PostgreSQL 16 or Docker with Docker Compose
- A valid environment file in `config/`

## Environment variables

The server loads `config/.env.development` for normal execution and `config/.env.test` for test execution.

Development environment example:

```bash
NODE_ENV=development
PORT=3000
FRONT_END_URL=http://localhost:5173
DATABASE_URL=postgresql://orbita_user:orbita_password@localhost:5432/orbita_db
JWT_SECRET=replace-this-with-a-long-random-secret
```

Test environment example:

```bash
NODE_ENV=test
DATABASE_URL=postgresql://orbita_test_user:orbita_test_password@localhost:5454/orbita_test_db
JWT_SECRET=replace-this-with-a-test-secret
```

| Variable        | Description                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`      | Runtime environment. Production enables secure, partitioned, and `SameSite=None` authentication cookies.             |
| `PORT`          | Local HTTP port used by the API. Development examples use `3000`.                                                    |
| `FRONT_END_URL` | Allowed browser origin used by CORS.                                                                                |
| `DATABASE_URL`  | PostgreSQL connection string used by Prisma.                                                                         |
| `JWT_SECRET`    | Secret used to sign and verify JWT authentication tokens.                                                             |

`PORT`, `JWT_SECRET`, `DATABASE_URL`, and `FRONT_END_URL` are required during server bootstrap. The test environment does not require `PORT` or `FRONT_END_URL`.

## Getting started

Clone the repository and move into this project directory:

```bash
git clone https://github.com/joao-gustavo-silva-lima/node-express.git
cd node-express/express/orbita-api
```

Install dependencies:

```bash
npm install
```

Start the development PostgreSQL database:

```bash
docker compose up -d
```

The Compose service exposes PostgreSQL on `localhost:5432` with the values declared in `docker-compose.yml`.

Create `config/.env.development`, then synchronize the database with the Prisma schema:

```bash
npx prisma db push
```

Start the API in development mode:

```bash
npm run dev
```

The API listens on `http://localhost:3000` by default.

## Scripts

| Command                   | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`             | Starts the API with `tsx watch` and reloads it after source changes.         |
| `npm run build`           | Installs dependencies and compiles the TypeScript source into `dist`.         |
| `npm start`               | Starts the compiled server from `dist/server.js`.                            |
| `npm test`                | Runs unit tests once and excludes HTTP integration tests.                     |
| `npm run test:integration` | Pushes the Prisma schema, then runs the HTTP integration tests with Vitest. |

Build and run the compiled project:

```bash
npm run build
npm start
```

## Architecture

```text
src/
├── main.ts                             Express application and middleware registration
├── server.ts                           Environment validation and HTTP bootstrap
├── common/
│   ├── common.schema.ts                Shared Zod username and timestamp schemas
│   ├── classes/HttpError.ts            Typed application error
│   └── middlewares/
│       ├── corsOptions.middleware.ts   Origin and credential configuration
│       ├── handleError.middleware.ts   Centralized error responses
│       ├── logger.middleware.ts        Request timing logger
│       ├── payloadValidation.middleware.ts
│       └── tokenValidation.middleware.ts
├── link/
│   ├── Link.controller.ts              HTTP handlers
│   ├── Link.router.ts                  Link route definitions
│   ├── Link.schema.ts                  Zod schemas and TypeScript types
│   ├── Link.service.ts                 Link business logic and Prisma queries
│   └── Link.service.test.ts
├── user/
│   ├── User.controller.ts              Authentication and user HTTP handlers
│   ├── User.router.ts                  User and authentication routes
│   ├── User.schema.ts                  Zod schemas and TypeScript types
│   ├── User.service.ts                 User business logic and Prisma queries
│   ├── User.service.test.ts
│   └── User.utils.ts                   Password and JWT helpers
├── prisma/
│   ├── prisma.ts                       Prisma PostgreSQL client
│   ├── schema.prisma                   Data model
│   ├── generated/                      Generated Prisma client
│   └── migrations/                     Database migration history
└── tests/
    ├── Link.integration.test.ts
    └── User.integration.test.ts
```

Middleware is registered in this order: Helmet, CORS, JSON parsing, cookie parsing, request logging, versioned routers, route-not-found handling, and the centralized error handler.

All API routes are mounted under `/api/v1`.

## Authentication

Registration and login issue a JWT in the `orbitaAuthToken` HTTP-only cookie. The token contains the authenticated username and expires after one day.

Cookie behavior:

- `httpOnly: true`
- `maxAge: 86400000` (one day)
- Development: `secure: false`, `sameSite: "lax"`
- Production: `secure: true`, `sameSite: "none"`, `partitioned: true`

Authenticated requests must send the cookie. Browser clients should enable credentials for cross-origin requests, for example with `credentials: "include"`. CORS allows the origin configured by `FRONT_END_URL` and enables credentials for `/user/auth` and `/link` routes.

## Data model

### User

| Field         | Type       | Rules                                                                                                    |
| ------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `id`          | `UUID`     | Generated automatically.                                                                                 |
| `username`    | `string`   | 3-30 characters, lowercase, unique, and limited to letters, numbers, `.`, `_`, and `-`.                  |
| `name`        | `string`   | 2-255 characters and must contain at least one letter.                                                   |
| `email`       | `string`   | Valid email, lowercase, up to 255 characters, and unique.                                                |
| `password`    | `string`   | 12-72 characters with uppercase, lowercase, number, and special character; whitespace is not allowed.    |
| `createdAt`   | `datetime` | Generated automatically.                                                                                 |
| `lastEdition` | `datetime` | Updated automatically by Prisma.                                                                         |

Passwords are hashed with `bcrypt` and are omitted from user responses.

### Link

| Field            | Type       | Rules                                            |
| ---------------- | ---------- | ------------------------------------------------ |
| `id`             | `integer`  | Positive auto-incrementing identifier.           |
| `authorUsername` | `string`   | Username of the owning user.                     |
| `title`          | `string`   | Required, trimmed, 1-255 characters, and unique. |
| `ref`            | `string`   | Required, trimmed, 1-255 characters, and unique. |
| `visibility`     | `enum`     | Either `PUBLIC` or `PRIVATE`.                    |
| `createdAt`      | `datetime` | Generated automatically.                         |
| `lastEdition`    | `datetime` | Updated automatically by Prisma.                 |

Users may create at most 10 links. Public links can be viewed by other users, while private links are returned only to their owner. Deleting a user cascades to that user's links.

## API

All routes below are relative to `http://localhost:3000`.

### User and authentication endpoints

| Method   | Path                        | Auth | Description                                                        | Success |
| -------- | --------------------------- | ---- | ------------------------------------------------------------------ | ------- |
| `POST`   | `/api/v1/user/auth`         | No   | Creates a user and sets the authentication cookie.                 | `201`   |
| `POST`   | `/api/v1/user/auth/login`   | No   | Logs in with a username or email and sets the cookie.              | `200`   |
| `POST`   | `/api/v1/user/auth/logout`  | No   | Clears the authentication cookie.                                  | `200`   |
| `GET`    | `/api/v1/user/auth/profile` | Yes  | Returns the authenticated user's profile and links.                | `200`   |
| `GET`    | `/api/v1/user/:username`    | No   | Returns a public profile and that user's public links.             | `200`   |
| `PATCH`  | `/api/v1/user/auth`         | Yes  | Updates the authenticated user's profile and refreshes the cookie. | `200`   |
| `DELETE` | `/api/v1/user/auth`         | Yes  | Deletes the authenticated user after password confirmation.        | `200`   |

### Link endpoints

All link endpoints require the `orbitaAuthToken` cookie.

| Method   | Path               | Description                                      | Success |
| -------- | ------------------ | ------------------------------------------------ | ------- |
| `POST`   | `/api/v1/link`     | Creates a link for the authenticated user.       | `201`   |
| `GET`    | `/api/v1/link`     | Lists links owned by the authenticated user.     | `200`   |
| `GET`    | `/api/v1/link/:id` | Returns an owned or public link.                 | `200`   |
| `PATCH`  | `/api/v1/link/:id` | Updates an owned link.                           | `200`   |
| `DELETE` | `/api/v1/link/:id` | Deletes an owned link.                           | `200`   |

## Request examples

### Register a user

`POST /api/v1/user/auth`

```http
Content-Type: application/json
```

```json
{
  "name": "Golias Davis",
  "username": "davolias",
  "email": "golias.davis@gmail.com",
  "password": "Davolias@123"
}
```

The response contains the created user and links array, omits the password, and sets `orbitaAuthToken`.

### Login

`POST /api/v1/user/auth/login`

```json
{
  "username": "davolias",
  "password": "Davolias@123"
}
```

Login also accepts `email` instead of `username`. At least one of these fields is required. The response contains the authenticated user and refreshes the cookie.

### Create a link

`POST /api/v1/link`

```json
{
  "title": "Phone number",
  "ref": "+55 00 90000-0000",
  "visibility": "PRIVATE"
}
```

### Update a link

`PATCH /api/v1/link/1`

```json
{
  "title": "Updated phone number",
  "visibility": "PUBLIC"
}
```

All link update fields are optional. `title`, `ref`, and `visibility` are validated when present.

### Update a user

`PATCH /api/v1/user/auth`

```json
{
  "name": "Davis Golias",
  "username": "godavis",
  "currentPassword": "Davolias@123"
}
```

`currentPassword` is always required. A profile update is allowed only after the service's update interval check passes.

### Delete a user

`DELETE /api/v1/user/auth`

```json
{
  "password": "Davolias@123"
}
```

Successful deletion clears the authentication cookie and returns:

```json
{
  "code": "USER_DELETION_SUCCESS",
  "message": "The user was deleted successfully"
}
```

## Responses and errors

Resource operations return the resource directly. Action-only operations return:

```json
{
  "code": "LINK_DELETED",
  "message": "The link was deleted successfully."
}
```

Validation and application errors use this shape:

```json
{
  "code": "INVALID_REQUEST_BODY",
  "message": "The request body is invalid. Please check the required fields and formats.",
  "details": {
    "username": "USERNAME_TOO_SHORT"
  }
}
```

Request-body validation requires the exact `Content-Type: application/json` header.

### Common status codes

| Status | Code                             | Meaning                                                     |
| ------ | -------------------------------- | ----------------------------------------------------------- |
| `400`  | `INVALID_JSON`                   | The request body is not valid JSON.                         |
| `400`  | `INVALID_REQUEST_BODY`           | The request body does not satisfy its Zod schema.           |
| `400`  | `INVALID_LINK_ID`                | The link ID is not a positive integer.                      |
| `401`  | `AUTH_TOKEN_REQUIRED`            | The authentication cookie was not provided.                 |
| `401`  | `USER_LOGIN_INVALID_CREDENTIALS` | The username/email or password is incorrect.                |
| `403`  | `INVALID_AUTH_TOKEN`             | The JWT is invalid or expired.                              |
| `403`  | `LINK_CREATION_QUOTA_EXCEEDED`   | The user already owns 10 links.                             |
| `403`  | `USER_UPDATE_FORBIDDEN`          | The current password does not match or update is too recent. |
| `403`  | `USER_DELETION_FORBIDDEN`        | The deletion password does not match.                       |
| `404`  | `ROUTE_NOT_FOUND`                | The requested route does not exist.                         |
| `404`  | `USER_NOT_FOUND`                 | The requested public user does not exist.                   |
| `404`  | `LINK_NOT_FOUND`                 | The link does not exist or is not visible to the requester. |
| `409`  | `USER_CREATION_CONFLICT`         | The email or username is already in use.                    |
| `409`  | `USER_UPDATE_DETAILS_CONFLICT`   | An updated email or username is already in use.             |
| `409`  | `LINK_CONFLICT`                  | A link title or reference is already in use.                |
| `415`  | `INVALID_CONTENT_TYPE`           | The request Content-Type is not `application/json`.         |
| `503`  | `UNEXPECTED_DATABASE_ERROR`      | An unexpected database operation failed.                    |
| `500`  | `ENV_VARS_MISSING`               | Required environment variables are missing during startup.  |
| `500`  | `INTERNAL_SERVER_ERROR`          | An unhandled server error occurred.                         |

Unknown routes return:

```json
{
  "code": "ROUTE_NOT_FOUND",
  "message": "'/api/v1/unknown' is not a recognized route."
}
```

## Testing

Start the test database:

```bash
docker compose -f docker-compose.test.yml up -d
```

Run unit tests:

```bash
npm test
```

Run HTTP integration tests:

```bash
npm run test:integration
```

Integration tests use `config/.env.test`, clear the test database before relevant suites, and should be run only against the disposable test database.
