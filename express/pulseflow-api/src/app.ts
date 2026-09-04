import express from "express";
import { router } from "./router/router.js";
import errorHandlerMiddleware from "./middlewares/error-handler.middleware.js";

export const app = express();

app.use(express.json());

app.use(router);

app.use(errorHandlerMiddleware);
