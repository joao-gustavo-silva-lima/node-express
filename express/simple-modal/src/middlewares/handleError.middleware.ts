import type { NextFunction, Request, Response } from "express";

export default function handleErrorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const isDatabaseConnectionError =
    error?.code === "ECONNREFUSED" || error?.code === "57P01";

  const status = error?.status || 505;
  const code = isDatabaseConnectionError
    ? "DATABASE_CONNECTION_ERROR"
    : error?.code || "INTERNAL_SERVER_ERROR";
  const message = isDatabaseConnectionError
    ? "The service is unavailable. Please, try again later."
    : error?.message ||
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
