import { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => console.error(`\n\t${err.message}`));

  res.status(500).json({ message: `Something bad happened at server side` });
}
