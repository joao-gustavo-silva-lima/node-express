import { NextFunction, Request, Response } from "express";

export function validateLinkMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  throw new Error("WIP");

  next();
}
