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
      "NO_AUTHENTICATION_TOKEN_PROVIDED",
      "The authentication token was not provided.",
    );
  }

  if (process.env.JWT_SECRET === undefined) {
    throw new HttpError(
      505,
      "NO_JWT_SECRECT_PROVIDED",
      "Json Web Token secret was not provided by the host.",
    );
  }

  try {
    const payload = jwt.verify(
      req.cookies.token,
      process.env.JWT_SECRET,
    ) as any;

    req.authenticatedUserId = payload.userId;

    next();
  } catch (_) {
    throw new HttpError(
      403,
      "INVALID_AUTHENTICATION_TOKEN",
      "The authentication token is invalid or is expired.",
    );
  }
}
