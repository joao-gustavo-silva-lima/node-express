import { app } from "./app.js";
import dotenv from "dotenv";
import HttpError from "./utils/HttpError.utils.js";

dotenv.config();

if (process.env.PORT === undefined) {
  throw new HttpError(
    500,
    "NO_CONNECTION_PORT_PROVIDED",
    "Server connection PORT was not provided.",
  );
}

const PORT = process.env.PORT;

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
