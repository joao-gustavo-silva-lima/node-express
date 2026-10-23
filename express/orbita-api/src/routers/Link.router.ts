import express from "express";
import * as linkController from "../controllers/Link.controller";
import tokenValidationMiddleware from "../middlewares/tokenValidation.middleware";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware";
import { createLinkSchema, updateLinkSchema } from "../schemas/Link.schema";

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
