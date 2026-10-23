import express from "express";
import loggerMiddleware from "./middlewares/logger.middleware";
import userRouter from "./routers/User.router";
import linkRouter from "./routers/Link.router";
import handleErrorMiddleware from "./middlewares/handleError.middleware";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import corsOptionsMiddleware from "./middlewares/corsOptions.middleware";

const app = express();

app.use(helmet());

app.use(cors(corsOptionsMiddleware));

app.use(express.json());

app.use(cookieParser());

app.use(loggerMiddleware);

app.use("/api/v1", userRouter);
app.use("/api/v1", linkRouter);

app.use((req, res) =>
  res.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: `'${req.path}' is not a recognized route.`,
  }),
);

app.use(handleErrorMiddleware);

export default app;
