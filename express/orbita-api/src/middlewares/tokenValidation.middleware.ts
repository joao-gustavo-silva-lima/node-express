import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import HttpError from "../common/classes/HttpError";

export default function tokenValidationMiddleware(bypass = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.cookies.token === undefined) {
      if (bypass) {
        return next();
      }
      throw new HttpError(
        401,
        "AUTH_TOKEN_REQUIRED",
        "Authentication token is required.",
      );
    }

    try {
      const payload = jwt.verify(
        req.cookies.token,
        process.env.JWT_SECRET!,
      ) as any;

      req.authenticatedUsername = payload.username;

      next();
    } catch {
      if (bypass) {
        return next();
      }

      throw new HttpError(
        403,
        "INVALID_AUTH_TOKEN",
        "The authentication token is invalid or expired.",
      );
    }
  };
}
