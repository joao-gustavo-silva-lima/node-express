import express from "express";
import validateRoutineMiddleware from "../middlewares/validate-routine.middleware.js";
import RoutinesController from "../controllers/routines.controller.js";
import {
  habitSchema,
  routineSchema,
  subTaskSchema,
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
  ["/:routineId", routineSchema],
  ["/:routineId/habits/:habitId", habitSchema],
  ["/:routineId/habits/:habitId/sub-tasks/:subTaskId", subTaskSchema],
].forEach(([route, schema]) =>
  router.patch(
    route as string,
    validateRoutineMiddleware((schema as z.ZodObject).pick({ title: true })),
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
