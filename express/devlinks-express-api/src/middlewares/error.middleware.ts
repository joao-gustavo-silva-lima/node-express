import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../utils/stateful-error.utils.js";

export function errorMiddleware(
  err: StatefulError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.status(err.status ?? 500).json({
    message: /[^\s]{1,}/.test(err.message)
      ? err.message
      : `Internal Server Error`,
  });

  if (!err.status || err.status === 500) {
    res.on("finish", () => console.error(`\n${err.stack ?? err.message}\n`));
  }
}
