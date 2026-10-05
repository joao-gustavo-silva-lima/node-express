import router from "./router/Users.router.js";
import handleErrorMiddleware from "./middlewares/handleError.middleware.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import Express from "express";
import cors from "cors";

export const app = Express();

app.use(helmet());

app.use(cors());

app.use(Express.json());

app.use(cookieParser());

app.use("/users", router);

app.use(handleErrorMiddleware);
