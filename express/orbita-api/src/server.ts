import { configDotenv } from "dotenv";
import app from "./main";
import HttpError from "./common/classes/HttpError";
import db from "./database/db";

configDotenv({ path: "config/.env.development", quiet: true });

async function bootstrap() {
  ["PORT", "DATABASE_URL"].forEach((envVar) => {
    if (process.env[envVar] === undefined) {
      throw new HttpError(
        500,
        `MISSING_${envVar}_ENV_VAR`,
        `The environment variable "${envVar}" is required for the server initialization.`,
      );
    }
  });

  await db
    .connect()
    .then(() => console.log("Database connection established successfully."))
    .catch((error) => {
      throw new HttpError(
        503,
        "DATABASE_ESTABLISHMENT_ERROR",
        "The database connection establishment failed.",
        error,
      );
    });

  app.listen(process.env.PORT!, () =>
    console.log(
      `Server running locally at http://localhost:${process.env.PORT!}`,
    ),
  );
}

bootstrap();
