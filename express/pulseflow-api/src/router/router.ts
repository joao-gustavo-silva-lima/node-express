import express from "express";
import validateRoutineMiddleware from "../middlewares/validate-routine.middleware.js";
import RoutinesController from "../controllers/routines.controller.js";
import {
  habitSchema,
  routineSchema,
  subTaskSchema,
} from "../types/routines.types.js";

export const router = express.Router();

router.get("/", RoutinesController.readRoutines);
router.post(
  "/",
  validateRoutineMiddleware(routineSchema),
  RoutinesController.createRoutine,
);

router.get("/:routineId", RoutinesController.readRoutineById);
router.patch(
  "/:routineId",
  validateRoutineMiddleware(routineSchema.pick({ title: true })),
  RoutinesController.updateRoutineById,
);
router.delete("/:routineId", RoutinesController.deleteRoutineById);

router.get("/:routineId/habits", RoutinesController.readHabitsByRoutineId);
router.post(
  "/:routineId/habits",
  validateRoutineMiddleware(habitSchema),
  RoutinesController.createHabitByRoutineId,
);

router.get("/:routineId/habits/:habitId", RoutinesController.readHabitById);
router.patch(
  "/:routineId/habits/:habitId",
  validateRoutineMiddleware(habitSchema.pick({ title: true })),
  RoutinesController.updateHabitById,
);
router.delete(
  "/:routineId/habits/:habitId",
  RoutinesController.deleteHabitById,
);

router.post(
  "/:routineId/habits/:habitId/sub-tasks",
  validateRoutineMiddleware(subTaskSchema),
  RoutinesController.createSubTaskByHabitId,
);
router.get(
  "/:routineId/habits/:habitId/sub-tasks",
  RoutinesController.readSubTasksByHabitId,
);

router.get(
  "/:routineId/habits/:habitId/sub-tasks/:subTaskId",
  RoutinesController.readSubTaskById,
);
router.patch(
  "/:routineId/habits/:habitId/sub-tasks/:subTaskId",
  validateRoutineMiddleware(subTaskSchema.pick({ title: true })),
  RoutinesController.updateSubTaskById,
);
router.delete(
  "/:routineId/habits/:habitId/sub-tasks/:subTaskId",
  RoutinesController.deleteSubTaskById,
);
