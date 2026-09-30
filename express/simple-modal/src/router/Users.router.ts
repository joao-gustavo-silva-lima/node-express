import { Router } from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware.js";
import UsersController from "../controllers/Users.controller.js";

export const router = Router();

router.post("/", payloadValidationMiddleware, UsersController.register);

router.use((req, res) => res.status(404).json("ROUTE_NOT_FOUND"));
