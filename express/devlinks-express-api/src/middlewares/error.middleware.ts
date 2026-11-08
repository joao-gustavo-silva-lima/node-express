import { NextFunction, Request, Response } from "express";
import { StatefulError } from "../utils/stateful-error.utils.js";

export function errorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const isHandledError = error instanceof StatefulError;
  const isSyntaxError = error instanceof SyntaxError;

  const status = isHandledError ? error.status : isSyntaxError ? 400 : 500;
  const message = isHandledError
    ? error.message
    : isSyntaxError
      ? "Invalid JSON: The request payload format is unexpected."
      : "Internal Server Error";

  res.status(status).json({ message });

  if (!isHandledError) {
    res.on("finish", () =>
      console.error(
        `\n${error.stack ?? error.message ?? "Unexpected Error"}\n`,
      ),
    );
  }
}
