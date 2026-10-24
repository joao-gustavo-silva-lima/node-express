import type { NextFunction, Request, Response } from "express";
import HttpError from "../common/classes/HttpError.js";

export default function handleErrorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const isHttpError = error instanceof HttpError;

  const status = isHttpError ? error.status : 500;
  const code = isHttpError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = isHttpError
    ? error.message
    : "An internal server error occurred. Please try again later.";

  if (code === "INTERNAL_SERVER_ERROR" || status >= 500) {
    res.on("finish", () => console.error(error));
  }

  res.status(status).json({ code, message });
}
