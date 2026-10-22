import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import HttpError from "../common/classes/HttpError";

export default function tokenValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.cookies.orbitaAuthToken === undefined) {
    throw new HttpError(
      401,
      "AUTH_TOKEN_REQUIRED",
      "Authentication token is required.",
    );
  }

  try {
    const payload = jwt.verify(
      req.cookies.orbitaAuthToken,
      process.env.JWT_SECRET!,
    ) as any;

    req.authUsername = payload.authUsername;

    next();
  } catch {
    throw new HttpError(
      403,
      "INVALID_AUTH_TOKEN",
      "The authentication token is invalid or expired.",
    );
  }
}
