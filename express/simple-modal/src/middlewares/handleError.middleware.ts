import type { NextFunction, Request, Response } from "express";
import HttpError from "../utils/HttpError.utils.js";

export default function handleErrorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const httpError = error instanceof HttpError ? error : null;

  const status = httpError?.status || 505;
  const code = httpError?.code || "INTERNAL_SERVER_ERROR";
  const message =
    httpError?.message ||
    "An internal server error has ocurred. Please, try again later.";

  if (code === "INTERNAL_SERVER_ERROR" || status === 505) {
    const loggingMessage =
      error instanceof Error ? error.message : (error as any)?.message;
    if (loggingMessage) {
      res.on("finish", () => console.error(loggingMessage));
    }
  }

  res.status(status).json({ code, message });
}
