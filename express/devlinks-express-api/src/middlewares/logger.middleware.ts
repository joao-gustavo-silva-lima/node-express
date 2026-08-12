import { NextFunction, Request, Response } from "express";

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestTime = performance.now();

  res.on("finish", () => {
    const responseTime = performance.now() - requestTime;

    console.log(
      `${req.method} ${req.originalUrl} (${responseTime.toFixed(2)} ms)`,
    );
  });

  next();
}
