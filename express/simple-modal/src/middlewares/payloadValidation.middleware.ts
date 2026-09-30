import type { NextFunction, Request, Response } from "express";

export default function payloadValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.headers["content-type"] !== "application/json") {
    res.status(400).json({ code: "INVALID_CONTENT_TYPE" });
    return;
  }

  next();
}
