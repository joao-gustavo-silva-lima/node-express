import router from "./router/Users.router.js";
import handleErrorMiddleware from "./middlewares/handleError.middleware.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import Express from "express";
import cors from "cors";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";

export const app = Express();

app.use(helmet());

app.use(cors({ origin: process.env.FRONT_END_URL, credentials: true }));

app.use(Express.json());

app.use(cookieParser());

app.use(loggerMiddleware);

app.use("/users", router);

app.use(handleErrorMiddleware);
