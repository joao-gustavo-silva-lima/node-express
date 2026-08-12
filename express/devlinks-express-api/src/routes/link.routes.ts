import express, { Router } from "express";
import { LinkController } from "../controllers/link.controller.js";
import { validateQueryMiddleware } from "../middlewares/validate-query.middleware.js";
import { validateIDMiddleware } from "../middlewares/validate-id.middleware.js";

export const router = express.Router();

router.get("/", validateQueryMiddleware, LinkController.list);

router.use("/:id", validateIDMiddleware);

router.get("/:id", LinkController.getByID);

router.get("/:id/redirect", LinkController.getByIDAndRedirect);
