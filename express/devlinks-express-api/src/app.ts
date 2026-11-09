import { errorMiddleware } from "./common/middlewares/error.middleware.js";
import { loggerMiddleware } from "./common/middlewares/logger.middleware.js";
import { router } from "./link/link.router.js";
import cors from "cors";
import express from "express";

export const app = express();

app.use(cors());

app.use(express.json());

app.use(loggerMiddleware);

app.use("/api/v1/links", router);

app.use(errorMiddleware);
