import { Request, Response, NextFunction } from "express";

export function validateIDMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (Number.isNaN(Number(req.params.id))) {
    res.status(400).json({
      message: `Invalid ID: A valid ID data type is a zero based number`,
    });
    return;
  }

  next();
}
