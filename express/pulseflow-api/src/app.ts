import express from "express";
import { router } from "./router/router.js";
import errorHandlerMiddleware from "./middlewares/error-handler.middleware.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";

export const app = express();

app.use(express.json());

app.use(loggerMiddleware);

app.use(router);

app.use(errorHandlerMiddleware);
