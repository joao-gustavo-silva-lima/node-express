import Express from "express";
import { router } from "./router/router.js";

export const app = Express();

app.use(router);
