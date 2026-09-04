import express from "express";
import validateRoutineMiddleware from "../middlewares/validate-routine.middleware.js";
import RoutinesController from "../controllers/routines.controller.js";

export const router = express.Router();

router.post("/", validateRoutineMiddleware, RoutinesController.createRoutine);
