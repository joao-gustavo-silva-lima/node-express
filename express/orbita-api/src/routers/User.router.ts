import express from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware";
import { createUserSchema } from "../schemas/User.schema";
import * as userController from "../controllers/User.controller";
import tokenValidationMiddleware from "../middlewares/tokenValidation.middleware";

const router = express.Router();

router.post(
  "/user/auth/register",
  payloadValidationMiddleware(createUserSchema),
  userController.createUser,
);

router.get(
  "/user/:username",
  tokenValidationMiddleware(true),
  userController.fetchUser,
);

export default router;
