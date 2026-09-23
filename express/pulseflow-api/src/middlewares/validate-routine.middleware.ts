import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../utils/stateful-error.utils.js";
import { ZodObject } from "zod";
import formatZodErrors from "../utils/zod-errors-formater.utils.js";

export default function validateRoutineMiddleware(
  validationSchema: ZodObject,
  allowEmptyBody = false,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasEmptyBody = Object.keys(req.body ?? {}).length === 0;

    if (allowEmptyBody && hasEmptyBody) {
      req.body = {};
    }

    if (
      req.headers["content-type"] !== "application/json" &&
      !(allowEmptyBody && hasEmptyBody)
    ) {
      throw new StatefulError(
        400,
        "INVALID_CONTENT_TYPE",
        "The 'content-type: application/json' request header was expected",
      );
    }

    const validation = validationSchema.safeParse(req.body);

    if (validation.success) {
      req.body = validation.data;
      next();
      return;
    }

    throw new StatefulError(
      400,
      "INVALID_PAYLOAD",
      "The payload format is not valid",
      {
        zodErrors: formatZodErrors(validation.error.issues),
      },
    );
  };
}
