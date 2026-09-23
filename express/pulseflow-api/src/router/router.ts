import express from "express";
import validateRoutineMiddleware from "../middlewares/validate-routine.middleware.js";
import RoutinesController from "../controllers/routines.controller.js";
import {
  habitSchema,
  routineSchema,
  subTaskSchema,
  dateSchema,
} from "../types/routines.types.js";
import { z } from "zod";

export const router = express.Router();

[
  ["/", routineSchema],
  ["/:routineId/habits", habitSchema],
  ["/:routineId/habits/:habitId/sub-tasks", subTaskSchema],
].forEach(([route, schema]) =>
  router.post(
    route as string,
    validateRoutineMiddleware(
      (schema as z.ZodObject).extend(dateSchema.shape).partial({ date: true }),
    ),
    RoutinesController.create,
  ),
);

[
  "/",
  "/:routineId",
  "/:routineId/habits",
  "/:routineId/habits/:habitId",
  "/:routineId/habits/:habitId/sub-tasks",
  "/:routineId/habits/:habitId/sub-tasks/:subTaskId",
].forEach((route) => router.get(route, RoutinesController.read));

[
  ["/:routineId", routineSchema.pick({ title: true })],
  [
    "/:routineId/habits/:habitId",
    habitSchema.pick({ title: true, category: true }).partial(),
  ],
  [
    "/:routineId/habits/:habitId/sub-tasks/:subTaskId",
    subTaskSchema.pick({ title: true }),
  ],
].forEach(([route, schema]) =>
  router.patch(
    route as string,
    validateRoutineMiddleware(schema as z.ZodObject),
    RoutinesController.update,
  ),
);

router.delete(
  [
    "/:routineId",
    "/:routineId/habits/:habitId",
    "/:routineId/habits/:habitId/sub-tasks/:subTaskId",
  ],
  validateRoutineMiddleware(dateSchema.partial({ date: true }), true),
  RoutinesController.delete,
);

router.post(
  [
    "/:routineId/toggle-today",
    "/:routineId/habits/:habitId/toggle-today",
    "/:routineId/habits/:habitId/sub-tasks/:subTaskId/toggle-today",
  ],
  RoutinesController.toggleCompletionDate,
);

router.post(
  [
    "/:routineId/toggle-date",
    "/:routineId/habits/:habitId/toggle-date",
    "/:routineId/habits/:habitId/sub-tasks/:subTaskId/toggle-date",
  ],
  validateRoutineMiddleware(dateSchema),
  RoutinesController.toggleCompletionDate,
);

router.use(RoutinesController.notFound);
