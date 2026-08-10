import express from "express";
import { router } from "./routes/link.routes.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";

export const app = express();

app.use(loggerMiddleware);

app.use(router);
