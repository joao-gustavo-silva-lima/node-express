import express from "express";
import loggerMiddleware from "./middlewares/logger.middleware";
import userRouter from "./routers/User.router";
import handleErrorMiddleware from "./middlewares/handleError.middleware";

const app = express();

app.use(express.json());

app.use(loggerMiddleware);

app.use("/api/v1", userRouter);

app.use((req, res) =>
  res.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: `'${req.path}' is not a recognized route.`,
  }),
);

app.use(handleErrorMiddleware);

export default app;
