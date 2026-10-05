import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware.js";
import tokenValidationMiddleware from "../middlewares/tokenValidation.middleware.js";
import { loginUserSchema, userSchema } from "../types/User.types.js";
import {
  fetchByIdUserController,
  loginUserController,
  logoutUserController,
  registerUserController,
} from "../controllers/Users.controller.js";
import { Router } from "express";

const router = Router();

export default router;

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

router.post("/auth/logout", logoutUserController);

router.get("/auth/profile", tokenValidationMiddleware, fetchByIdUserController);

router.use((req, res) =>
  res.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: "The requested route was not found.",
  }),
);
