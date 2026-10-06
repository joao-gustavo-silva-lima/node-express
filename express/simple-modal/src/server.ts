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

if (process.env.DATABASE_URL === undefined) {
  throw new HttpError(
    500,
    "MISSING_DATABASE_URL_ENV_VARIABLE",
    "The database URL environment variable was not provided.",
  );
}

const PORT = process.env.PORT;

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
