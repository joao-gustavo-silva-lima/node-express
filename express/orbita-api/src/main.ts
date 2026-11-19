import express from "express";
import loggerMiddleware from "./common/middlewares/logger.middleware.js";
import userRouter from "./user/User.router.js";
import linkRouter from "./link/Link.router.js";
import handleErrorMiddleware from "./common/middlewares/handleError.middleware.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import corsOptionsMiddleware from "./common/middlewares/corsOptions.middleware.js";

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
