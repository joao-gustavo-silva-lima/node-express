import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../utils/stateful-error.utils.js";

export function errorMiddleware(
  err: StatefulError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const isInternalError = err.status === undefined;

  res.status(err.status ?? 500).json({
    message: isInternalError ? `Internal Server Error` : err.message,
  });

  if (isInternalError) {
    res.on("finish", () => console.error(`\n${err.stack ?? err.message}\n`));
  }
}
