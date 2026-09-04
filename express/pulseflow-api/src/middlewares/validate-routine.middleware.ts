import { NextFunction, Request, Response } from "express";
import { routineSchema } from "../types/routines.types.js";

export default function ValidateRoutineMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const validation = routineSchema.safeParse(req.body);

  if (validation.success) {
    next();
  }

  const errors = validation.error!.issues.reduce(
    (acc, issue) => ({
      ...acc,
      [issue.path.join("__") || "unknown-field"]: issue.message,
    }),
    {},
  );

  //Use custom error class thrown to error handler middleware
}
