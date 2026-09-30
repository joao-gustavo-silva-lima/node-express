import Express from "express";
import { router } from "./router/Users.router.js";
import handleErrorMiddleware from "./middlewares/handleError.middleware.js";

export const app = Express();

app.use(Express.json());

app.use("/users", router);

app.use(handleErrorMiddleware);
