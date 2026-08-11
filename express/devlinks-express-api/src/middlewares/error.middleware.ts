import { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => console.error(`\n${err.stack ?? err.message}\n`));

  res.status(500).json({ message: `Internal Server Error` });
}
