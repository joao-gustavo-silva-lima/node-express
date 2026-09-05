import express from "express";
import validateRoutineMiddleware from "../middlewares/validate-routine.middleware.js";
import RoutinesController from "../controllers/routines.controller.js";
import { routineSchema } from "../types/routines.types.js";

export const router = express.Router();

router.get("/", RoutinesController.readRoutines);
router.post(
  "/",
  validateRoutineMiddleware(routineSchema),
  RoutinesController.createRoutine,
);

router.patch(
  "/:routineId",
  validateRoutineMiddleware(routineSchema.pick({ title: true })),
  RoutinesController.updateRoutineById,
);
router.delete("/:routineId", RoutinesController.deleteRoutineById);
