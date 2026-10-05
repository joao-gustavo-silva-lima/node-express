import HttpError from "./utils/HttpError.utils.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config();

if (process.env.PORT === undefined) {
  throw new HttpError(
    500,
    "SERVER_PORT_MISSING",
    "The server PORT is not configured.",
  );
}

if (
  ["PGPORT", "PGUSER", "PGHOST", "PGDATABASE", "PGPASSWORD"].some(
    (directive) => process.env[directive] === undefined,
  )
) {
  throw new HttpError(
    500,
    "MISSING_DATABASE_ENV_VARIABLES",
    "Some database environment variables were not defined.",
  );
}

const PORT = process.env.PORT;

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
