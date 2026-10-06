import HttpError from "./utils/HttpError.utils.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config();

["PORT", "DATABASE_URL", "FRONT_END_URL"].forEach((envVar) => {
  if (process.env[envVar] === undefined) {
    throw new HttpError(
      500,
      `MISSING_${envVar}_ENV_VARIABLE`,
      `The server ${envVar} was not provided.`,
    );
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running at http://localhost:${process.env.PORT}`),
);
