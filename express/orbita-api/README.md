# Orbita API

Orbita API is a REST API for managing user profiles and a personal link collection. Each user can create a profile, authenticate with a JWT stored in an HTTP-only cookie, and publish or keep links private. The service is implemented with Express and TypeScript, uses Prisma with PostgreSQL, and validates payloads with Zod.

## Requirements

- Node.js 20+
- npm
- PostgreSQL

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:3000` by default. You can override the port with the `PORT` environment variable:

```bash
PORT=4000 npm run dev
```

Because the app uses `tsx watch`, TypeScript files are compiled and restarted automatically while the server is running.

## Environment variables

The app expects the following environment values at runtime:

```env
NODE_ENV="development"
PORT=3000
FRONT_END_URL="http://localhost:5173"
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/orbita_db"
JWT_SECRET="replace-with-a-long-random-secret"
```

A development configuration file is already present in `config/.env.development`, and it is loaded automatically by the Prisma setup and server bootstrap.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Starts the server in watch mode |
| `npm run build` | Installs dependencies and runs the TypeScript compiler |
| `npm start` | Runs the compiled build from `dist/server.js` |

## Architecture

```text
src/
├── main.ts                       Express application bootstrap and route registration
├── server.ts                     Server startup, environment checks, and DB health check
├── common/
│   ├── classes/HttpError.ts      Standardized HTTP error class
│   ├── constants/nodeEnv.ts      Runtime environment helpers
│   └── utils/generateToken.ts     JWT token generator
├── controllers/
│   ├── User.controller.ts         User auth/profile handlers
│   └── Link.controller.ts         Link CRUD handlers
├── middlewares/
│   ├── corsOptions.middleware.ts  CORS configuration
│   ├── handleError.middleware.ts  Centralized error responses
│   ├── logger.middleware.ts       Request logging
│   ├── payloadValidation.middleware.ts
│   └── tokenValidation.middleware.ts
├── lib/
│   └── prisma.ts                  Prisma client configured with Postgres
├── prisma/
│   ├── schema.prisma              Data model definition
│   └── generated/                Prisma-generated client and models
├── routers/
│   ├── User.router.ts             User routes
│   └── Link.router.ts             Link routes
├── schemas/
│   ├── User.schema.ts             Zod schemas for users and auth payloads
│   ├── Link.schema.ts             Zod schemas for link payloads
│   └── common.schema.ts           Shared schema utilities
├── services/
│   ├── User.service.ts            Business rules for auth and user management
│   └── Link.service.ts            Business rules for link creation and ownership
├── types/
│   └── express.d.ts              Express request augmentation for auth username
└── server.ts                     App entrypoint
```

The application is mounted under the `/api/v1` prefix and registers middleware in this order: security headers, CORS, JSON parsing, cookie parsing, request logging, routes, 404 handler, and the global error middleware.

## Data model

The database is defined with Prisma and includes two primary models: `User` and `Link`.

### User

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | `string` | UUID primary key |
| `name` | `string` | Required, trimmed, 2-255 characters, must contain letters |
| `email` | `string` | Required, unique, valid email format |
| `username` | `string` | Required, unique, trimmed, validated by shared schema |
| `password` | `string` | Hashed before storage; minimum 12 chars and strong complexity requirements |
| `links` | `Link[]` | Relation to all links created by the user |
| `createdAt` | `DateTime` | Automatically set on creation |
| `lastEdition` | `DateTime` | Automatically updated on each modification |

### Link

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | `number` | Auto-increment numeric identifier |
| `authorUsername` | `string` | User owner reference |
| `title` | `string` | Required, unique among all records, max 255 chars |
| `ref` | `string` | Required, unique, usually a URL or external reference |
| `visibility` | `"PUBLIC" \| "PRIVATE"` | Access control for the link |
| `createdAt` | `DateTime` | Automatically set on creation |
| `lastEdition` | `DateTime` | Automatically updated on each change |

### Business rules

- Each user can create up to 10 links.
- Link titles and refs must be unique across the database.
- A user may only update their own profile or links.
- A profile can be updated only once every three days after the initial creation unless it has never been edited.
- Public links are visible to any user requesting the profile, while private links remain visible only to the owner.

## Authentication

Authentication is cookie-based. The server sets the `orbitaAuthToken` cookie after signing up, logging in, or updating the user profile. Protected endpoints require the cookie to be present and valid.

The token is verified with `jsonwebtoken` using the `JWT_SECRET` environment variable. The middleware checks for the cookie and rejects invalid or expired tokens with a `403` response.

## API

All routes are prefixed with `/api/v1` and use JSON requests. Protected routes depend on the authenticated user cookie, while public profile endpoints are available without authentication.

### User auth and profile

| Method | Path | Description | Success |
| ------ | ---- | ----------- | ------- |
| `POST` | `/api/v1/user/auth` | Creates a new user account | `201` |
| `POST` | `/api/v1/user/auth/login` | Logs in with username/email and password | `200` |
| `POST` | `/api/v1/user/auth/logout` | Clears the auth cookie | `200` |
| `GET` | `/api/v1/user/auth/profile` | Returns the authenticated user's profile | `200` |
| `GET` | `/api/v1/user/:username` | Returns a public profile by username | `200` |
| `PATCH` | `/api/v1/user/auth` | Updates the authenticated user | `200` |
| `DELETE` | `/api/v1/user/auth` | Deletes the authenticated user account | `200` |

### Links

| Method | Path | Description | Success |
| ------ | ---- | ----------- | ------- |
| `POST` | `/api/v1/link` | Creates a new link for the authenticated user | `201` |
| `GET` | `/api/v1/link` | Lists all links from the authenticated user | `200` |
| `GET` | `/api/v1/link/:id` | Returns one link if it is owned by the user or public | `200` |
| `PATCH` | `/api/v1/link/:id` | Updates a link owned by the authenticated user | `200` |
| `DELETE` | `/api/v1/link/:id` | Deletes a link owned by the authenticated user | `200` |

## Request examples

### Create a user

`POST /api/v1/user/auth`

```http
Content-Type: application/json
```

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "username": "adalovelace",
  "password": "StrongPass!2024"
}
```

Response:

```json
{
  "id": "9c7c7dbe-7fe8-42ce-a47d-b7a86a7b8499",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "username": "adalovelace",
  "links": [],
  "createdAt": "2026-10-23T19:00:00.000Z",
  "lastEdition": "2026-10-23T19:00:00.000Z"
}
```

The server also sends the auth cookie in the response so the client can continue performing protected requests.

### Log in

`POST /api/v1/user/auth/login`

```http
Content-Type: application/json
```

```json
{
  "username": "adalovelace",
  "password": "StrongPass!2024"
}
```

```json
{
  "code": "USER_LOGIN_SUCCESS",
  "message": "The user has logged in successfully"
}
```

### Create a link

`POST /api/v1/link`

```http
Content-Type: application/json
```

```json
{
  "title": "GitHub",
  "ref": "https://github.com/adalovelace",
  "visibility": "PUBLIC"
}
```

Response:

```json
{
  "id": 1,
  "authorUsername": "adalovelace",
  "title": "GitHub",
  "ref": "https://github.com/adalovelace",
  "visibility": "PUBLIC",
  "createdAt": "2026-10-23T19:02:00.000Z",
  "lastEdition": "2026-10-23T19:02:00.000Z"
}
```

## Error handling

The API uses a centralized error middleware to normalize responses. Errors are returned in a consistent format:

```json
{
  "code": "INVALID_REQUEST_BODY",
  "message": "The request body is invalid. Please check the required fields and formats.",
  "details": {
    "email": "EMAIL_INVALID_FORMAT"
  }
}
```

Common statuses include:

- `400` for invalid payloads or malformed IDs
- `401` for missing authentication
- `403` for invalid token or forbidden updates
- `404` for missing users or links
- `409` for duplicate username, email, or link details
- `500` for unexpected server errors

## Notes

- The project is designed for a simple full-stack workflow where the frontend stores session state as a cookie and consumes the public profile endpoints.
- Prisma migrations are not included in the docs because this repository focuses on the API layer and runtime configuration for a PostgreSQL database.
- Security is enforced at both the request-validation layer and the database access layer, with password hashing via `bcrypt` and JWT-based session verification.
