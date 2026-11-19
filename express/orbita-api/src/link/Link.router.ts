import express from "express";
import * as linkController from "./Link.controller.js";
import tokenValidationMiddleware from "../common/middlewares/tokenValidation.middleware.js";
import payloadValidationMiddleware from "../common/middlewares/payloadValidation.middleware.js";
import { createLinkSchema, updateLinkSchema } from "./Link.schema.js";

const router = express.Router();

router.use("/link", tokenValidationMiddleware);

router.post(
  "/link",
  payloadValidationMiddleware(createLinkSchema),
  linkController.createLink,
);

router.get("/link", linkController.fetchLinks);

router.get("/link/:id", linkController.fetchLink);

router.patch(
  "/link/:id",
  payloadValidationMiddleware(updateLinkSchema),
  linkController.updateLink,
);

router.delete("/link/:id", linkController.deleteLink);

export default router;
