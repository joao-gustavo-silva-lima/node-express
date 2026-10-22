import express from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware";
import { createUserSchema, deleteUserSchema } from "../schemas/User.schema";
import * as userController from "../controllers/User.controller";
import tokenValidationMiddleware from "../middlewares/tokenValidation.middleware";

const router = express.Router();

router.post(
  "/user/auth/register",
  payloadValidationMiddleware(createUserSchema),
  userController.createUser,
);

router.get(
  "/user/auth/profile",
  tokenValidationMiddleware,
  userController.fetchUser,
);

router.get("/user/:username", userController.fetchUser);

router.delete(
  "/user/auth/delete",
  payloadValidationMiddleware(deleteUserSchema, true),
  tokenValidationMiddleware,
  userController.deleteUser,
);

export default router;
