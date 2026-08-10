import { errorMiddleware } from "./middlewares/error.middleware.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { router } from "./routes/link.routes.js";
import express from "express";

export const app = express();

app.use(express.json());

app.use(loggerMiddleware);

app.use("/api/v1/links", router);

app.use(errorMiddleware);
