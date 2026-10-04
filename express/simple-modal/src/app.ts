import Express from "express";
import { router } from "./router/Users.router.js";
import handleErrorMiddleware from "./middlewares/handleError.middleware.js";
import cookieParser from "cookie-parser";

export const app = Express();

app.use(Express.json());

app.use(cookieParser());

app.use("/users", router);

app.use(handleErrorMiddleware);
