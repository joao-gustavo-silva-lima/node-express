import express from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware";
import { createUserSchema } from "../schemas/User.schema";
import * as userController from "../controllers/User.controller";

const router = express.Router();

router.post(
  "/auth/register",
  payloadValidationMiddleware(createUserSchema),
  userController.createUser,
);

export default router;
