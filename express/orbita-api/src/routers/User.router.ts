import express from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware";
import {
  createUserSchema,
  deleteUserSchema,
  loginUserSchema,
  updateUserSchema,
} from "../schemas/User.schema";
import * as userController from "../controllers/User.controller";
import tokenValidationMiddleware from "../middlewares/tokenValidation.middleware";

const router = express.Router();

router.post(
  "/user/auth",
  payloadValidationMiddleware(createUserSchema),
  userController.createUser,
);

router.post(
  "/user/auth/login",
  payloadValidationMiddleware(loginUserSchema),
  userController.loginUser,
);

router.post("/user/auth/logout", userController.logoutUser);

router.get(
  "/user/auth/profile",
  tokenValidationMiddleware,
  userController.fetchUser,
);

router.get("/user/:username", userController.fetchUser);

router.patch(
  "/user/auth",
  tokenValidationMiddleware,
  payloadValidationMiddleware(updateUserSchema),
  userController.updateUser,
);

router.delete(
  "/user/auth",
  tokenValidationMiddleware,
  payloadValidationMiddleware(deleteUserSchema),
  userController.deleteUser,
);

export default router;
