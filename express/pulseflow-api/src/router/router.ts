import express from "express";
import validateRoutineMiddleware from "../middlewares/validate-routine.middleware.js";
import RoutinesController from "../controllers/routines.controller.js";
import {
  habitSchema,
  routineSchema,
  subTaskSchema,
} from "../types/routines.types.js";
import { string, z } from "zod";

export const router = express.Router();

[
  ["/", routineSchema],
  ["/:routineId/habits", habitSchema],
  ["/:routineId/habits/:habitId/sub-tasks", subTaskSchema],
].forEach(([route, schema]) =>
  router.post(
    route as string,
    validateRoutineMiddleware(schema as z.ZodObject),
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
  RoutinesController.delete,
);
