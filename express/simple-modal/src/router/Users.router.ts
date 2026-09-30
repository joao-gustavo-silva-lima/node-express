import { Router } from "express";
import payloadValidationMiddleware from "../middlewares/payloadValidation.middleware.js";

export const router = Router();

router.post("/", payloadValidationMiddleware);

router.use((req, res) => res.json("Hello World"));
