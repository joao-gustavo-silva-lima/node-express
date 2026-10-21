import express from "express";
import loggerMiddleware from "./middlewares/logger.middleware";
import userRouter from "./routers/User.router";

const app = express();

app.use(express.json());

app.use(loggerMiddleware);

app.use("/api/v1/", userRouter);

export default app;
