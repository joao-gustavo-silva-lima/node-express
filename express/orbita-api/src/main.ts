import express from "express";
import loggerMiddleware from "./middlewares/logger.middleware";
import userRouter from "./routers/User.router";
import handleErrorMiddleware from "./middlewares/handleError.middleware";

const app = express();

app.use(express.json());

app.use(loggerMiddleware);

app.use("/api/v1/", userRouter);

app.use(handleErrorMiddleware);

export default app;
