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

  if (code === "INTERNAL_SERVER_ERROR" || status === 505) {
    const message =
      error instanceof Error ? error.message : (error as any)?.message;
    if (message) {
      res.on("finish", () => console.error(message));
    }
  }

  res.status(status).json({ code });
}
