import { configDotenv } from "dotenv";
import app from "./main";
import HttpError from "./common/classes/HttpError";

configDotenv({ path: "config/.env.development", quiet: true });

["PORT"].forEach((envVar) => {
  if (process.env[envVar] === undefined) {
    throw new HttpError(
      500,
      `MISSING_${envVar}_ENV_VAR`,
      `The environment variable "${envVar}" is required for the server initialization.`,
    );
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running locally at http://localhost:${process.env.PORT}`),
);
