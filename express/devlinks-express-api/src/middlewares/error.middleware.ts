import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../utils/stateful-error.utils.js";

export function errorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  //MISSING FEATURE: Handle JSON payload syntax error

  const isHandledError = error instanceof StatefulError;

  const status = isHandledError ? error.status : 500;
  const message = isHandledError ? error.message : "Internal Server Error";

  res.status(status).json({ message });

  if (!isHandledError) {
    res.on("finish", () =>
      console.error(
        `\n${error.stack ?? error.message ?? "Unexpected Error"}\n`,
      ),
    );
  }
}
