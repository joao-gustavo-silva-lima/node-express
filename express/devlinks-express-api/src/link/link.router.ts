import express from "express";
import * as LinkController from "./link.controller.js";
import validateLinkMiddleware from "./middlewares/validate-link.middleware.js";
import validateQueryMiddleware from "./middlewares/validate-query.middleware.js";

export const router = express.Router();

router.get("/", validateQueryMiddleware, LinkController.list);
router.post("/", validateLinkMiddleware, LinkController.register);

router.get("/:id", LinkController.getByID);
router.delete("/:id", LinkController.deleteByID);
router.put("/:id", validateLinkMiddleware, LinkController.updateByID);

router.get("/:id/redirect", LinkController.redirectByID);
