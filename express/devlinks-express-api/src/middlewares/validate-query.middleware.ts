import { NextFunction, Request, Response } from "express";
import { LINK_KEYS, LinkProperty } from "../types/link.types.js";
import { StatefulError } from "../utils/stateful-error.utils.js";

export function validateQueryMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const queryKeys = Object.keys(req.query);

  if (queryKeys.length === 0) {
    return next();
  }

  const invalidQueryArgs = queryKeys.filter(
    (key) => !LINK_KEYS.has(key as LinkProperty),
  );

  if (invalidQueryArgs.length === 0) {
    return next();
  }

  throw new StatefulError(
    400,
    `Invalid Query: A link does not contain the following queried properties: ${invalidQueryArgs.map((param) => `'${param}'`).join(", ")}`,
  );
}
