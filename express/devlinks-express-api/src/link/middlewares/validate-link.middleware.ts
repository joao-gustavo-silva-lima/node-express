import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../../common/utils/stateful-error.utils.js";
import { protoLinkSchema } from "../link.types.js";

export default function validateLinkMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.headers["content-type"] !== "application/json") {
    throw new StatefulError(
      400,
      "Invalid Content-Type: The request must contain 'application/json' header",
    );
  }

  const validation = protoLinkSchema.safeParse(req.body);

  if (!validation.success) {
    throw new StatefulError(
      400,
      "Invalidly Formatted Object: The link is invalid so the action could not be concluded",
    );
  }

  req.body = validation.data;

  next();
}
