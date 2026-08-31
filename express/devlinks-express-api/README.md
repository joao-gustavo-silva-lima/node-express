# DevLinks Express API

Welcome to my DevLinks API project! This repository represents a hands-on exploration of building a robust, scalable API using Express.js and TypeScript. Here, I'm focusing on implementing best practices for API development, including clean architecture, comprehensive error handling, and middleware patterns.

## 🚀 Repository Overview

This project is a REST API built with Express.js and TypeScript, designed to handle link management operations. The application demonstrates modern backend development patterns including middleware chaining, service-oriented architecture, and type-safe implementations.

### 📁 Project Structure

The project follows a clean, modular architecture that separates concerns across different layers. Here's the directory breakdown:

```text
devlinks-express-api/
├── src/
│   ├── app.ts                      # Express application setup and middleware initialization
│   ├── server.ts                   # Server entry point and listener configuration
│   ├── controllers/
│   │   └── link.controller.ts      # Request handlers and business logic orchestration
│   ├── middlewares/
│   │   ├── error.middleware.ts     # Centralized error handling and response formatting
│   │   ├── logger.middleware.ts    # Request/response logging and debugging
│   │   ├── validate-link.middleware.ts   # Link payload validation logic
│   │   └── validate-query.middleware.ts  # Query parameter validation logic
│   ├── routes/
│   │   └── link.routes.ts          # API endpoint definitions and route mapping
│   ├── services/
│   │   └── link.service.ts         # Business logic and data processing layer
│   ├── types/
│   │   └── link.types.ts           # TypeScript type definitions and interfaces
│   └── utils/
│       └── stateful-error.utils.ts # Custom error class implementations
├── package.json                    # Scripts and dependencies definition
├── tsconfig.json                   # TypeScript compilation settings
└── README.md                       # This file
```

---

## 🔑 Core Files & Their Purpose

When navigating this codebase, here are the essential files you should understand:

1. 📝 **`app.ts`**: The heart of the Express application. Configures middleware stack, routes, and application-wide settings.
2. 🚀 **`server.ts`**: Entry point that starts the HTTP server and binds it to the configured port.
3. 🛣️ **`link.routes.ts`**: Defines all API endpoints related to link operations (GET, POST, PUT, DELETE, etc.).
4. 🎮 **`link.controller.ts`**: Handles incoming requests, delegates to services, and formats responses.
5. ⚙️ **`link.service.ts`**: Contains the core business logic and data manipulation operations.
6. 📊 **`link.types.ts`**: Centralized TypeScript interfaces and type definitions for type safety.
7. 🛡️ **`error.middleware.ts`**: Provides consistent error handling and error response formatting.

---

## 🛠️ Getting Started & How to Run

To run the API locally and explore the implementation, ensure you have **Node.js** and **npm** installed.

### 1. Clone the Repository

```bash
git clone https://github.com/joao-gustavo-silva-lima/node-express.git
cd node-express/express/devlinks-express-api
```

### 2. Install Dependencies

Install all required packages:

```bash
npm install
```

### 3. Build TypeScript

Compile TypeScript to JavaScript:

```bash
npm run build
```

### 4. Start the Server

Run the API server in development mode:

```bash
npm run dev
```

The server will typically start on `http://localhost:3000` (or the configured port). You should see log output confirming the server is running.

---

## 📈 Learning Goals & Objectives

- **Type Safety**: Leveraging TypeScript's strong type system to catch errors at compile time and ensure API contracts are properly defined.
- **Clean Architecture**: Separating concerns across controllers, services, and middleware layers for maintainability and testability.
- **Error Handling**: Implementing comprehensive error handling strategies with custom error utilities and centralized middleware.
- **Middleware Mastery**: Understanding middleware composition, middleware chaining, and how to build reusable request processing pipelines.
- **API Best Practices**: Following REST conventions, proper HTTP status codes, and consistent response formatting.

---

## 🚦 API Endpoints

The API exposes link management endpoints following RESTful conventions:

| Method   | Endpoint                  | Description                             |
| -------- | ------------------------- | --------------------------------------- |
| `GET`    | `/api/links`              | Retrieve all links                      |
| `GET`    | `/api/links/:id`          | Retrieve a specific link                |
| `GET`    | `/api/links/:id/redirect` | Retrieve a specific link's redirect URL |
| `POST`   | `/api/links`              | Create a new link                       |
| `PUT`    | `/api/links/:id`          | Update an existing link                 |
| `DELETE` | `/api/links/:id`          | Delete a link                           |

Each endpoint is validated, logged, and includes proper error handling through the middleware stack.

---

## 🎓 Development Workflow

This project follows a structured development approach:

1. **Define Types First**: Start with clear TypeScript interfaces in `link.types.ts`
2. **Build Services**: Implement business logic in the service layer
3. **Create Controllers**: Wire services to HTTP request/response handling
4. **Add Validation**: Use middleware for input validation and sanitization
5. **Test & Iterate**: Validate implementations and refactor for clarity and performance

---

Enjoy coding! 🚀
