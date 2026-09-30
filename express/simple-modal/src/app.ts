import Express from "express";
import { router } from "./router/Users.router.js";

export const app = Express();

app.use(Express.json());

app.use("/users", router);
