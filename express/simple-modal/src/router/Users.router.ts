import { Router } from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware.js";
import {
  authenticateUserController,
  registerUserController,
} from "../controllers/Users.controller.js";
import { authUserSchema, userSchema } from "../types/User.types.js";

export const router = Router();

router.post(
  "/",
  payloadValidationMiddleware(userSchema),
  registerUserController,
);

router.post(
  "/auth",
  payloadValidationMiddleware(authUserSchema),
  authenticateUserController,
);

router.use((req, res) => res.status(404).json("ROUTE_NOT_FOUND"));
