import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../../common/utils/stateful-error.utils.js";
import { querySchema } from "../link.types.js";

export default function validateQueryMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { data, success } = querySchema.safeParse(req.query);

  if (!success) {
    throw new StatefulError(
      400,
      `Invalid Query: the query triggers unexpected filters.`,
    );
  }

  req.validQuery = data;

  next();
}
