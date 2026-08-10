import { NextFunction, Request, Response } from "express";

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestTime = performance.now();

  res.on("finish", () => {
    const responseTime = performance.now() - requestTime;

    console.log(`\n${req.method} ${req.path} (${responseTime.toFixed(2)} ms)`);
  });

  next();
}
