import express from "express";
import { LinkController } from "../controllers/link.controller.js";
import { validateQueryMiddleware } from "../middlewares/validate-query.middleware.js";
import { validateLinkMiddleware } from "../middlewares/validate-link.middleware.js";

export const router = express.Router();

router.get("/", validateQueryMiddleware, LinkController.list);
router.post("/", validateLinkMiddleware, LinkController.register);

router.get("/:id", LinkController.getByID);
router.delete("/:id", LinkController.deleteByID);

router.get("/:id/redirect", LinkController.redirectByID);
