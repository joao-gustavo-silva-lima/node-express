import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import HttpError from "../utils/HttpError.utils.js";

export default function tokenValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.cookies.token === undefined) {
    throw new HttpError(
      401,
      "AUTH_TOKEN_REQUIRED",
      "Authentication token is required.",
    );
  }

  if (process.env.JWT_SECRET === undefined) {
    throw new HttpError(
      500,
      "JWT_SECRET_MISSING",
      "The JWT secret is not configured in the environment.",
    );
  }

  try {
    const payload = jwt.verify(
      req.cookies.token,
      process.env.JWT_SECRET,
    ) as any;

    req.authenticatedUserId = payload.userId;

    next();
  } catch {
    throw new HttpError(
      403,
      "INVALID_AUTH_TOKEN",
      "The authentication token is invalid or expired.",
    );
  }
}
