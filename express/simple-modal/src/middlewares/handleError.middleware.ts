import type { NextFunction, Request, Response } from "express";
import { DatabaseError } from "pg";

export default function handleErrorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const isDatabaseError =
    error?.code === "ECONNREFUSED" ||
    error?.code === "57P01" ||
    error instanceof DatabaseError;

  const status = Number(error?.status) || 500;
  const code = isDatabaseError ? "DATABASE_ERROR" : error?.code || "INTERNAL_SERVER_ERROR";
  const message = isDatabaseError
    ? "A database error occurred. Please try again later."
    : error?.message || "An internal server error occurred. Please try again later.";

  if (code === "INTERNAL_SERVER_ERROR" || status >= 500) {
    const loggingMessage =
      error instanceof Error ? error.message : (error as any)?.message;
    if (loggingMessage) {
      res.on("finish", () => console.error(loggingMessage));
    }
  }

  res.status(status).json({ code, message });
}
