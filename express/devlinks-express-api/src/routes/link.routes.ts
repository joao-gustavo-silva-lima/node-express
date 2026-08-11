import express from "express";
import { LinkController } from "../controllers/link.controller.js";
import { validateQueryMiddleware } from "../middlewares/validate-query.middleware.js";

export const router = express.Router();

router.get("/", validateQueryMiddleware, LinkController.list!);
