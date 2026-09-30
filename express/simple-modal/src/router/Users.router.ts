import { Router } from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware.js";
import { registerUserController } from "../controllers/Users.controller.js";

export const router = Router();

router.post("/", payloadValidationMiddleware, registerUserController);

router.use((req, res) => res.status(404).json("ROUTE_NOT_FOUND"));
