# Orbita API

Orbita API is a REST API for user accounts and personal links. It is built with Express 5 and TypeScript, validates request payloads with Zod, persists data through Prisma and PostgreSQL, and authenticates users with JSON Web Tokens stored in an HTTP-only cookie.

## Requirements

- Node.js with npm
- PostgreSQL 16 or a compatible PostgreSQL database
- A `.env` file containing the required environment variables

## Environment variables

The server loads environment variables with `dotenv` during startup. Create a `.env` file in the project root with values similar to:

```bash
NODE_ENV=development
PORT=3000
FRONT_END_URL=http://localhost:5173
DATABASE_URL=postgresql://...
JWT_SECRET=replace-this-with-a-long-random-secret
```

| Variable        | Description                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`      | Runtime environment. Production changes the authentication cookie to `secure`, `SameSite=None`, and `partitioned`. |
| `PORT`          | Local HTTP port used by the API. The examples below assume `3000`.                                                 |
| `FRONT_END_URL` | Allowed front-end origin used by CORS.                                                                             |
| `DATABASE_URL`  | PostgreSQL connection string used by Prisma.                                                                       |
| `JWT_SECRET`    | Secret used to sign and verify authentication tokens.                                                              |

`PORT`, `JWT_SECRET`, `DATABASE_URL`, and `FRONT_END_URL` are required. The application validates them before opening the HTTP server.

## Getting started

Start the local PostgreSQL database;

Install dependencies:

```bash
npm install
```

Apply the Prisma migrations when setting up a new database:

```bash
npx prisma migrate deploy
```

Start the API in development mode:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## Scripts

| Command         | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| `npm run dev`   | Starts the API with `tsx watch` and reloads it when source files change. |
| `npm run build` | Installs dependencies and compiles the TypeScript source into `dist`.    |
| `npm start`     | Starts the compiled server from `dist/server.js`.                        |

## Architecture

```text
src/
├── main.ts                              Express application, security, CORS, parsers and routers
├── server.ts                            Environment validation, database check and HTTP bootstrap
├── common/
│   ├── classes/HttpError.ts              Typed application error
│   ├── constants/nodeEnv.ts              Production-environment helper
│   └── utils/generateToken.ts             JWT creation
├── controllers/
│   ├── Link.controller.ts                 Link request handlers
│   └── User.controller.ts                 User and authentication handlers
├── lib/prisma.ts                         Prisma client and PostgreSQL adapter
├── middlewares/
│   ├── corsOptions.middleware.ts          Origin and credential configuration
│   ├── handleError.middleware.ts          Centralized error responses
│   ├── logger.middleware.ts              Request timing logger
│   ├── payloadValidation.middleware.ts    Content-Type and Zod validation
│   └── tokenValidation.middleware.ts      JWT cookie validation
├── prisma/
│   ├── schema.prisma                      Prisma data model
│   └── migrations/                        Database migrations
├── routers/
│   ├── Link.router.ts                     Link routes
│   └── User.router.ts                     User and authentication routes
├── schemas/
│   ├── Link.schema.ts                     Link validation schemas
│   ├── User.schema.ts                     User validation schemas
│   └── common.schema.ts                   Shared username and timestamp schemas
├── services/
│   ├── Link.service.ts                    Link business logic and queries
│   └── User.service.ts                    User business logic and queries
└── types/express.d.ts                     Authenticated request type augmentation
```

Middleware is registered in the following order: Helmet, CORS, JSON parsing, cookie parsing, request logging, versioned routers, the route-not-found response, and the centralized error handler.

All API routes are mounted under `/api/v1`.

## Authentication

Registration and login issue a JWT in the `orbitaAuthToken` HTTP-only cookie. The token contains the authenticated username and expires after one day.

Cookie behavior:

- `httpOnly: true`
- `maxAge: 86400000` (one day)
- Development: `secure: false`, `sameSite: "lax"`
- Production: `secure: true`, `sameSite: "none"`, `partitioned: true`

Authenticated requests must send the cookie. Browser clients should enable credentials for cross-origin requests, for example with `credentials: "include"` in `fetch`. CORS allows the origin configured by `FRONT_END_URL` and enables credentials for authentication and link routes.

## Data model

The Prisma schema defines two resources.

### User

| Field         | Type       | Rules                                                                                                  |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `id`          | `UUID`     | Generated automatically.                                                                               |
| `username`    | `string`   | Required, 3-30 characters, lowercase, and limited to letters, numbers, `.`, `_`, and `-`. Unique.      |
| `name`        | `string`   | Required, 2-255 characters, and must contain at least one letter.                                      |
| `email`       | `string`   | Required, valid email, lowercase, and up to 255 characters. Unique.                                    |
| `password`    | `string`   | 12-72 characters, with uppercase, lowercase, number, and special character; whitespace is not allowed. |
| `createdAt`   | `datetime` | Generated automatically.                                                                               |
| `lastEdition` | `datetime` | Updated automatically by Prisma.                                                                       |

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

Users may create at most 10 links. Public links can be viewed by other authenticated users; private links are returned only to their owner. Deleting a user cascades to that user's links.

## API

All routes below are relative to `http://localhost:PORT`.

### User and authentication endpoints

| Method   | Path                        | Auth | Description                                                        | Success |
| -------- | --------------------------- | ---- | ------------------------------------------------------------------ | ------- |
| `POST`   | `/api/v1/user/auth`         | No   | Creates a user and sets the authentication cookie.                 | `201`   |
| `POST`   | `/api/v1/user/auth/login`   | No   | Authenticates with a username or email and sets the cookie.        | `200`   |
| `POST`   | `/api/v1/user/auth/logout`  | No   | Clears the authentication cookie.                                  | `200`   |
| `GET`    | `/api/v1/user/auth/profile` | Yes  | Returns the authenticated user's profile and links.                | `200`   |
| `GET`    | `/api/v1/user/:username`    | No   | Returns a public user profile and public links.                    | `200`   |
| `PATCH`  | `/api/v1/user/auth`         | Yes  | Updates the authenticated user's profile and refreshes the cookie. | `200`   |
| `DELETE` | `/api/v1/user/auth`         | Yes  | Deletes the authenticated user after password confirmation.        | `200`   |

### Link endpoints

All link endpoints require the `orbitaAuthToken` cookie.

| Method   | Path               | Description                                      | Success |
| -------- | ------------------ | ------------------------------------------------ | ------- |
| `POST`   | `/api/v1/link`     | Creates a link for the authenticated user.       | `201`   |
| `GET`    | `/api/v1/link`     | Lists all links owned by the authenticated user. | `200`   |
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

The response contains the created user, its links array, and timestamps. The password is not returned, and the response sets `orbitaAuthToken`.

### Login with username or email

`POST /api/v1/user/auth/login`

```json
{
  "username": "davolias",
  "email": "golias.davis@gmail.com",
  "password": "Davolias@123"
}
```

At least one of `username` or `email` is required. The response contains the authenticated user and refreshes `orbitaAuthToken`.

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

All fields are optional for updates. `title`, `ref`, and `visibility` are validated when present.

### Update a user

`PATCH /api/v1/user/auth`

```json
{
  "name": "Davis Golias",
  "username": "godavis",
  "currentPassword": "Davolias@123"
}
```

`currentPassword` is always required. A user update can be performed at most once every three days after the first edition, and a successful update issues a new authentication token.

### Logout

`POST /api/v1/user/auth/logout`

```json
{
  "code": "USER_LOGOUT_SUCCESS",
  "message": "The user has logged out successfully"
}
```

### Delete a user

`DELETE /api/v1/user/auth`

```json
{
  "password": "Davolias@123"
}
```

Successful deletion clears the cookie and returns:

```json
{
  "code": "USER_DELETION_SUCCESS",
  "message": "The user was deleted successfully"
}
```

## Responses and errors

Successful resource operations return the resource directly. Action-only operations return a compact response envelope:

```json
{
  "code": "LINK_DELETED",
  "message": "The link was deleted successfully."
}
```

Invalid JSON, unsupported content types, validation failures, authentication failures, and database failures use the same error shape:

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

| Status | Code                               | Meaning                                                     |
| ------ | ---------------------------------- | ----------------------------------------------------------- |
| `400`  | `INVALID_JSON`                     | The request body is not valid JSON.                         |
| `400`  | `INVALID_REQUEST_BODY`             | The request body does not satisfy its Zod schema.           |
| `400`  | `INVALID_LINK_ID`                  | The link ID is not a positive integer.                      |
| `401`  | `AUTH_TOKEN_REQUIRED`              | The authentication cookie was not provided.                 |
| `401`  | `USER_LOGIN_INVALID_CREDENTIALS`   | The username/email or password is incorrect.                |
| `403`  | `INVALID_AUTH_TOKEN`               | The JWT is invalid or expired.                              |
| `403`  | `LINK_CREATION_QUOTA_EXCEEDED`     | The user already owns 10 links.                             |
| `403`  | `USER_UPDATE_FORBIDDEN`            | The current password does not match.                        |
| `403`  | `USER_UPDATE_NOT_ALLOWED_TOO_SOON` | The three-day update interval has not elapsed.              |
| `403`  | `USER_DELETION_FORBIDDEN`          | The deletion password does not match.                       |
| `404`  | `ROUTE_NOT_FOUND`                  | The requested route does not exist.                         |
| `404`  | `USER_NOT_FOUND`                   | The requested public user does not exist.                   |
| `404`  | `LINK_NOT_FOUND`                   | The link does not exist or is not visible to the requester. |
| `409`  | `USER_CREATION_CONFLICT`           | The email or username is already in use.                    |
| `409`  | `USER_UPDATE_DETAILS_CONFLICT`     | An updated email or username is already in use.             |
| `409`  | `LINK_CONFLICT`                    | A link title or reference is already in use.                |
| `415`  | `INVALID_CONTENT_TYPE`             | The request Content-Type is not `application/json`.         |
| `503`  | `UNEXPECTED_DATABASE_ERROR`        | An unexpected database operation failed.                    |
| `500`  | `ENV_VARS_MISSING`                 | Required environment variables are missing during startup.  |
| `500`  | `INTERNAL_SERVER_ERROR`            | An unhandled server error occurred.                         |

Unknown routes return a response similar to:

```json
{
  "code": "ROUTE_NOT_FOUND",
  "message": "'/api/v1/unknown' is not a recognized route."
}
```

## Development notes

- Prisma uses the PostgreSQL adapter configured in `src/lib/prisma.ts`.
- The server checks the database connection with `SELECT 1` before listening.
- `FRONT_END_URL` must match the browser application's origin exactly when credentials are used.
- Authenticated browser requests must include cookies; configure the client and server for credentialed CORS.
- `NODE_ENV=production` requires HTTPS because the authentication cookie is marked `secure`.
- Request logs include the HTTP method, URL, and response time. Logging is skipped when `NODE_ENV=test`.
