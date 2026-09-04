import { NextFunction, Request, Response } from "express";
import { routineSchema } from "../types/routines.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default function validateRoutineMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.headers["content-type"] !== "application/json") {
    throw new StatefulError(
      400,
      "The 'content-type: application/json' request header was expected",
    );
  }

  const validation = routineSchema.safeParse(req.body);

  if (validation.success) {
    req.body = validation.data;
    next();
    return;
  }

  const errors = validation.error!.issues.reduce(
    (acc, issue) => ({
      ...acc,
      [issue.path.join("__") || "unknown-field"]: issue.message,
    }),
    {},
  );

  throw new StatefulError(400, "The payload format is not a valid routine", {
    errors: errors,
  });
}
