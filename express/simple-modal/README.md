# Simple Modal API

Simple Modal is a small REST API for user registration, authentication, and profile access. It is built with Express and TypeScript, validates request payloads with Zod, and stores user data in PostgreSQL. Authentication is handled with JWT tokens stored in an HTTP-only cookie.

## Requirements

- Node.js with npm
- PostgreSQL database
- A `.env` file with the required environment variables

## Environment variables

Create a `.env` file in the project root with values similar to the following:

```bash
PORT=9876
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/dev_db
FRONT_END_URL=http://localhost:3000
JWT_SECRET=change-me-to-a-strong-secret
NODE_ENV=development
```

> `PORT` is the local port used by the API. The examples below assume `http://localhost:9876`.

## Getting started

Start the PostgreSQL container if needed:

```bash
docker compose up -d
```

Install dependencies and start the API in development mode:

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:9876`.

## Scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Starts the API with `tsx` and dotenv support |
| `npm run build` | Compiles TypeScript to the `dist` folder     |
| `npm start`     | Starts the compiled application              |

## Architecture

```text
src/
├── app.ts                             Express app, CORS, JSON parser, cookie parser and middleware
├── server.ts                          HTTP server bootstrap and required environment validation
├── controllers/
│   └── Users.controller.ts            HTTP handlers for register, login, logout and profile routes
├── database/
│   └── database.db.ts                PostgreSQL pool configuration
├── middlewares/
│   ├── handleError.middleware.ts     Centralized error handling
│   ├── payloadValidation.middleware.ts Zod-based request validation
│   └── tokenValidation.middleware.ts JWT authentication middleware
├── router/
│   └── Users.router.ts               Route registration and 404 fallback
├── services/
│   └── Users.service.ts              User business logic and database queries
├── types/
│   ├── Express.d.ts                  Express type augmentation for authenticated user id
│   └── User.types.ts                 Zod schemas and inferred TypeScript types
├── utils/
│   └── HttpError.utils.ts            Custom application error class
└── ...
```

The application registers middleware in this order: Helmet, CORS, JSON parsing, cookie parsing, `/users` routes, and the global error handler.

## Data model

The API manages a single `users` resource. The database table is expected to have the following fields:

### User

| Field        | Type     | Rules                                                                                           |
| ------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `id`         | `string` | Generated automatically with `crypto.randomUUID()` on registration                              |
| `name`       | `string` | Required, 1-255 characters                                                                      |
| `email`      | `string` | Required, valid email, max 255 characters                                                       |
| `password`   | `string` | Required, minimum 8 characters; must contain uppercase, lowercase, number and special character |
| `created_at` | `string` | Generated automatically as an ISO-8601 datetime string                                          |

Passwords are never returned in API responses. They are hashed with `bcrypt` before saving to the database.

## API

All routes below are relative to `http://localhost:PORT`, and all paths are prefixed with `/users`.

### Authentication endpoints

| Method | Path                   | Description                                  | Success |
| ------ | ---------------------- | -------------------------------------------- | ------- |
| `POST` | `/users/auth/register` | Creates a new user account                   | `201`   |
| `POST` | `/users/auth/login`    | Authenticates a user and sets the JWT cookie | `200`   |
| `POST` | `/users/auth/logout`   | Clears the authentication cookie             | `200`   |
| `GET`  | `/users/auth/profile`  | Returns the current authenticated user       | `200`   |

Unknown routes return:

```json
{
  "code": "ROUTE_NOT_FOUND",
  "message": "The requested route was not found."
}
```

## Request examples

### Register a user

`POST /users/auth/register`

```http
Content-Type: application/json
```

```json
{
  "name": "Golias",
  "email": "golias.dev@outlook.com",
  "password": "g0L1a$123"
}
```

Successful response:

```json
{
  "code": "USER_CREATED",
  "message": "User created successfully."
}
```

### Login a user

`POST /users/auth/login`

```http
Content-Type: application/json
```

```json
{
  "email": "golias.dev@outlook.com",
  "password": "g0L1a$123"
}
```

On success, the API sets an HTTP-only cookie named `token` and responds with:

```json
{
  "code": "LOGIN_SUCCESS",
  "message": "User logged in successfully."
}
```

The cookie is configured with:

- `httpOnly: true`
- `sameSite: "lax"`
- `maxAge: 3600000` (1 hour)
- `secure: true` in production mode

### Get the authenticated profile

`GET /users/auth/profile`

This route requires the `token` cookie generated by `/users/auth/login`.

Successful response:

```json
{
  "id": "0d2f6d58-3273-4d7d-8d87-6d0d5b8d4732",
  "name": "Golias",
  "email": "golias.dev@outlook.com",
  "created_at": "2026-10-06T10:30:00.000Z"
}
```

The password is intentionally omitted from the output.

### Logout a user

`POST /users/auth/logout`

This endpoint clears the `token` cookie and returns:

```json
{
  "code": "LOGOUT_SUCCESS",
  "message": "User logged out successfully."
}
```

## Responses and errors

Mutating endpoints return a compact envelope with a response code and message:

```json
{
  "code": "SUCCESS_CODE",
  "message": "Human readable message"
}
```

### Common validation errors

When a request body is invalid, the API returns a `400` response with a `details` object generated from Zod issues:

```json
{
  "code": "INVALID_REQUEST_BODY",
  "message": "The request body is invalid. Please check the required fields and formats.",
  "details": {
    "email": "Invalid email",
    "password": "Password must contain at least one uppercase letter"
  }
}
```

### Common status codes

| Status | Code                                       | Meaning                                |
| ------ | ------------------------------------------ | -------------------------------------- |
| `400`  | `INVALID_REQUEST_BODY`                     | Request body is missing or invalid     |
| `415`  | `INVALID_CONTENT_TYPE`                     | Content-Type is not `application/json` |
| `401`  | `INVALID_CREDENTIALS`                      | Email or password is incorrect         |
| `401`  | `AUTH_TOKEN_REQUIRED`                      | No authentication cookie was provided  |
| `403`  | `INVALID_AUTH_TOKEN`                       | JWT is missing, invalid or expired     |
| `404`  | `USER_NOT_FOUND`                           | User does not exist for the given ID   |
| `409`  | `USER_ALREADY_EXISTS`                      | Duplicate email registration           |
| `500`  | `DATABASE_ERROR` / `INTERNAL_SERVER_ERROR` | Server or database failure             |

## Notes

- The project expects a PostgreSQL connection string via `DATABASE_URL`.
- `FRONT_END_URL` is used by CORS configuration and should point to the front-end application URL.
- The JWT secret must be configured in production; otherwise token generation/verification will fail.
- All authenticated routes rely on the `token` cookie and the `tokenValidationMiddleware`.
