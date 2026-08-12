import { NextFunction, Request, Response } from "express";
import { protoLinkSchema } from "../types/link.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export function validateLinkMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const validation = protoLinkSchema.safeParse(req.body);

  if (validation.success) {
    return next();
  }

  throw new StatefulError(
    400,
    "Invalidly Formatted Object: The link is invalid and could not be registered",
  );
}
