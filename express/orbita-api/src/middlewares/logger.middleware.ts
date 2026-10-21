import { NextFunction, Request, Response } from "express";

export default function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (process.env.NODE_ENV === "test") {
    next();
    return;
  }

  const requestTime = performance.now();

  res.on("finish", () => {
    const responseTime = performance.now() - requestTime;

    console.log(
      `${req.method} ${req.originalUrl} (${responseTime.toFixed(2)} ms)`,
    );
  });

  next();
}
