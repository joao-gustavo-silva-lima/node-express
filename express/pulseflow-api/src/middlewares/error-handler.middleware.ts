import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../utils/stateful-error.utils.js";

export default function errorHandlerMiddleware(
  error: StatefulError | Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!(error instanceof StatefulError)) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }

  res.status(error.status).json({ message: error.message, ...error.appendix });
}
