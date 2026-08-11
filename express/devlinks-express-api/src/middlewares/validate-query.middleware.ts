import { NextFunction, Request, Response } from "express";
import { LINK } from "../types/link.types.js";

export function validateQueryMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const queryParams = Object.keys(req.query);

  if (queryParams.length === 0) {
    return next();
  }

  const invalidQueryParams = queryParams.filter(
    (param) => !Object.hasOwn(LINK, param),
  );

  if (invalidQueryParams.length === 0) {
    return next();
  }

  res.status(400).json({
    message: `Invalid Query: A link does not contain the following queried properties: ${invalidQueryParams.map((param) => `'${param}'`).join(", ")}`,
  });
}
