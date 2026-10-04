import { Router } from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware.js";
import {
  fetchByIdUserController,
  loginUserController,
  registerUserController,
} from "../controllers/Users.controller.js";
import { loginUserSchema, userSchema } from "../types/User.types.js";
import tokenValidationMiddleware from "../middlewares/tokenValidation.middleware.js";

export const router = Router();

router.post(
  "/auth/register",
  payloadValidationMiddleware(userSchema),
  registerUserController,
);

router.post(
  "/auth/login",
  payloadValidationMiddleware(loginUserSchema),
  loginUserController,
);

router.get("/auth/profile", tokenValidationMiddleware, fetchByIdUserController);

router.use((req, res) => res.status(404).json("ROUTE_NOT_FOUND"));
